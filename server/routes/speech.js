const express = require('express');
const crypto = require('crypto');
const WebSocket = require('ws');
const config = require('../xfyun-config');

const router = express.Router();
const ISE_HOST = 'ise-api.xfyun.cn';
const ISE_PATH = '/v2/open-ise';
const FRAME_SIZE = 1280;
const recordings = new Map();
const RECORDING_TTL_MS = 10 * 60 * 1000;

function saveRecording(buffer, format) {
  const id = crypto.randomBytes(16).toString('hex');
  recordings.set(id, {
    buffer,
    contentType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
    expiresAt: Date.now() + RECORDING_TTL_MS
  });
  setTimeout(() => recordings.delete(id), RECORDING_TTL_MS).unref?.();
  return id;
}

router.get('/recording/:id', (req, res) => {
  const recording = recordings.get(req.params.id);
  if (!recording || recording.expiresAt < Date.now()) {
    recordings.delete(req.params.id);
    return res.status(404).end();
  }
  const range = req.headers.range;
  const commonHeaders = {
    'Content-Type': recording.contentType,
    'Cache-Control': 'private, max-age=600',
    'Accept-Ranges': 'bytes'
  };
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return res.status(416).end();
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), recording.buffer.length - 1) : recording.buffer.length - 1;
    if (start > end || start >= recording.buffer.length) {
      return res.status(416).set('Content-Range', `bytes */${recording.buffer.length}`).end();
    }
    const chunk = recording.buffer.subarray(start, end + 1);
    res.status(206).set({
      ...commonHeaders,
      'Content-Length': chunk.length,
      'Content-Range': `bytes ${start}-${end}/${recording.buffer.length}`
    });
    return res.end(chunk);
  }
  res.status(200).set({ ...commonHeaders, 'Content-Length': recording.buffer.length });
  res.end(recording.buffer);
});

function hasSpeechConfig() {
  return Boolean(config.appId && config.apiKey && config.apiSecret &&
    !String(config.appId).startsWith('YOUR_') &&
    !String(config.apiKey).startsWith('YOUR_') &&
    !String(config.apiSecret).startsWith('YOUR_'));
}

function createAuthUrl() {
  const date = new Date().toUTCString();
  const origin = `host: ${ISE_HOST}\ndate: ${date}\nGET ${ISE_PATH} HTTP/1.1`;
  const signature = crypto.createHmac('sha256', config.apiSecret).update(origin).digest('base64');
  const authorization = Buffer.from(
    `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  ).toString('base64');
  return `wss://${ISE_HOST}${ISE_PATH}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${ISE_HOST}`;
}

function decodeAudioToPcm16(buffer) {
  if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return buffer;
  }

  let offset = 12;
  let format = null;
  let audioData = null;
  while (offset + 8 <= buffer.length) {
    const name = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = Math.min(buffer.length, start + size);
    if (name === 'fmt ' && size >= 16) {
      format = {
        encoding: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        bitsPerSample: buffer.readUInt16LE(start + 14)
      };
    } else if (name === 'data') {
      audioData = buffer.subarray(start, end);
    }
    offset = start + size + (size % 2);
  }

  if (!format || !audioData || !audioData.length) throw new Error('WAV 文件缺少 fmt 或 data 数据块');
  if (![1, 3].includes(format.encoding)) throw new Error(`不支持的 WAV 编码：${format.encoding}`);
  if (![8, 16, 24, 32].includes(format.bitsPerSample)) throw new Error(`不支持的 WAV 位深：${format.bitsPerSample}`);

  const bytesPerSample = format.bitsPerSample / 8;
  const frameBytes = bytesPerSample * format.channels;
  const frameCount = Math.floor(audioData.length / frameBytes);
  const mono = new Float64Array(frameCount);

  function readSample(position) {
    if (format.encoding === 3 && format.bitsPerSample === 32) return audioData.readFloatLE(position);
    if (format.bitsPerSample === 8) return (audioData.readUInt8(position) - 128) / 128;
    if (format.bitsPerSample === 16) return audioData.readInt16LE(position) / 32768;
    if (format.bitsPerSample === 24) return audioData.readIntLE(position, 3) / 8388608;
    if (format.bitsPerSample === 32) return audioData.readInt32LE(position) / 2147483648;
    return 0;
  }

  for (let frame = 0; frame < frameCount; frame++) {
    let sum = 0;
    for (let channel = 0; channel < format.channels; channel++) {
      sum += readSample(frame * frameBytes + channel * bytesPerSample);
    }
    mono[frame] = Math.max(-1, Math.min(1, sum / format.channels));
  }

  const targetRate = 16000;
  const targetLength = Math.max(1, Math.round(mono.length * targetRate / format.sampleRate));
  const pcm = Buffer.alloc(targetLength * 2);
  for (let index = 0; index < targetLength; index++) {
    const sourcePosition = index * format.sampleRate / targetRate;
    const left = Math.min(mono.length - 1, Math.floor(sourcePosition));
    const right = Math.min(mono.length - 1, left + 1);
    const ratio = sourcePosition - left;
    const sample = mono[left] + (mono[right] - mono[left]) * ratio;
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), index * 2);
  }

  console.log('语音音频格式:', { ...format, inputBytes: audioData.length, outputBytes: pcm.length });
  return pcm;
}

function xmlNumber(xml, name) {
  const patterns = [
    new RegExp(`${name}\\s*=\\s*["']([0-9.]+)["']`, 'i'),
    new RegExp(`<${name}[^>]*value\\s*=\\s*["']([0-9.]+)["']`, 'i')
  ];
  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

function normalizeScore(value) {
  if (!Number.isFinite(value)) return 0;
  const score = value <= 10 ? value * 10 : value;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function formatEvaluationText(value, category) {
  const source = String(value || '').trim();
  if (category === 'read_word') {
    const words = source
      .replace(/[^A-Za-z0-9.'’\-\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `\uFEFF[word]\n${words}`;
  }
  if (category === 'read_sentence' || category === 'read_chapter') {
    return `\uFEFF[content]\n${source}`;
  }
  return `\uFEFF${source}`;
}
function feedbackFor(score) {
  if (score >= 90) return '发音很棒！继续保持！';
  if (score >= 80) return '发音不错，可以更标准一些。';
  if (score >= 70) return '发音需要改进，注意口型和发音位置。';
  return '发音需要多练习，建议多听标准发音。';
}

function parseResult(xml) {
  const rawScore = xmlNumber(xml, 'total_score');
  const score = normalizeScore(rawScore);
  const accuracy = xmlNumber(xml, 'accuracy_score');
  const fluency = xmlNumber(xml, 'fluency_score');
  const standard = xmlNumber(xml, 'standard_score');
  return {
    hasScore: Number.isFinite(rawScore),
    score,
    feedback: feedbackFor(score),
    detail: {
      pronunciation: Number.isFinite(accuracy) ? normalizeScore(accuracy) : score,
      fluency: Number.isFinite(fluency) ? normalizeScore(fluency) : score,
      intonation: Number.isFinite(standard) ? normalizeScore(standard) : score
    }
  };
}

router.post('/evaluate', (req, res) => {
  const { audioBase64, word, category = 'read_word', audioFormat = 'mp3' } = req.body;
  if (!audioBase64 || !String(audioBase64).trim()) return res.status(400).json({ code: 400, message: '请提供录音数据' });
  if (!word || !String(word).trim()) return res.status(400).json({ code: 400, message: '请提供评测文本' });
  if (!hasSpeechConfig()) return res.status(503).json({ code: 503, message: '语音评测服务尚未配置' });

  let audio;
  let aue;
  let recordingId;
  try {
    const source = Buffer.from(audioBase64, 'base64');
    recordingId = saveRecording(source, audioFormat);
    const isMp3 = audioFormat === 'mp3' || source.toString('ascii', 0, 3) === 'ID3' || (source[0] === 0xff && (source[1] & 0xe0) === 0xe0);
    if (isMp3) {
      audio = source;
      aue = 'lame';
      console.log('语音音频格式:', { encoding: 'mp3', inputBytes: source.length });
    } else {
      audio = decodeAudioToPcm16(source);
      aue = 'raw';
    }
  } catch (error) {
    console.error('解析录音格式失败:', error);
    return res.status(400).json({ code: 400, message: '录音数据格式无效' });
  }
  if (!audio.length) return res.status(400).json({ code: 400, message: '录音内容为空' });

  const ws = new WebSocket(createAuthUrl());
  let finished = false;
  let sendTimer = null;
  const finish = (status, payload) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    if (sendTimer) clearInterval(sendTimer);
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
    res.status(status).json(payload);
  };
  const timeout = setTimeout(() => finish(504, { code: 504, message: '语音评测超时，请重试' }), 20000);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      common: { app_id: config.appId },
      business: {
        sub: 'ise', ent: 'en_vip', category,
        cmd: 'ssb', tte: 'utf-8', ttp_skip: true,
        auf: 'audio/L16;rate=16000', aue, rstcd: 'utf8',
        rst: 'entirety', ise_unite: '1', extra_ability: 'multi_dimension',
        text: formatEvaluationText(word, category)
      },
      data: { status: 0, data: '' }
    }));

    let offset = 0;
    let first = true;
    sendTimer = setInterval(() => {
      if (finished || ws.readyState !== WebSocket.OPEN) return;
      if (offset >= audio.length) {
        clearInterval(sendTimer);
        sendTimer = null;
        ws.send(JSON.stringify({
          business: { cmd: 'auw', aus: 4, aue },
          data: { status: 2, data: '', data_type: 1, encoding: 'raw' }
        }));
        return;
      }
      const chunk = audio.subarray(offset, Math.min(offset + FRAME_SIZE, audio.length));
      offset += chunk.length;
      ws.send(JSON.stringify({
        business: { cmd: 'auw', aus: first ? 1 : 2, aue },
        data: { status: 1, data: chunk.toString('base64'), data_type: 1, encoding: 'raw' }
      }));
      first = false;
    }, 40);
  });

  ws.on('message', raw => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.code !== 0) {
        console.error('讯飞语音评测错误:', message.code, message.message, message.sid);
        return finish(502, { code: 502, message: `语音评测失败：${message.message || message.code}` });
      }
      if (message.data && message.data.status === 2 && message.data.data) {
        const xml = Buffer.from(message.data.data, 'base64').toString('utf8');
        const result = parseResult(xml);
        if (!result.hasScore) return finish(502, { code: 502, message: '语音评测结果缺少评分字段' });
        delete result.hasScore;
        result.playbackPath = `/speech/recording/${recordingId}`;
        return finish(200, { code: 0, data: result });
      }
    } catch (error) {
      console.error('解析语音评测结果失败:', error);
      finish(502, { code: 502, message: '解析语音评测结果失败' });
    }
  });

  ws.on('unexpected-response', (request, response) => {
    console.error('讯飞鉴权失败:', response.statusCode, response.statusMessage);
    finish(502, { code: 502, message: `语音评测鉴权失败（${response.statusCode}）` });
  });
  ws.on('error', error => {
    console.error('语音评测连接失败:', error.code || error.message);
    finish(502, { code: 502, message: '语音评测服务连接失败，请稍后重试' });
  });
  ws.on('close', () => {
    if (!finished) finish(502, { code: 502, message: '语音评测连接提前关闭' });
  });
});

module.exports = router;