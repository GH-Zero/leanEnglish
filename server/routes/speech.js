const express = require('express');
const crypto = require('crypto');
const https = require('https');
const WebSocket = require('ws');
const config = require('../xfyun-config');
const { normalizeEnglishText } = require('../utils/english-text');

const router = express.Router();
const ISE_HOST = 'ise-api.xfyun.cn';
const ISE_PATH = '/v2/open-ise';
const FRAME_SIZE = 1280;
const recordings = new Map();
const RECORDING_TTL_MS = 10 * 60 * 1000;

function saveRecording(buffer, format) {
  const id = crypto.randomBytes(16).toString('hex');
  recordings.set(id, { buffer, contentType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav', expiresAt: Date.now() + RECORDING_TTL_MS });
  setTimeout(() => recordings.delete(id), RECORDING_TTL_MS).unref?.();
  return id;
}

const ttsCache = new Map();
function fetchTts(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, response => {
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location && redirects < 3) {
        response.resume();
        return resolve(fetchTts(response.headers.location, redirects + 1));
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const type = String(response.headers['content-type'] || '');
        if (response.statusCode !== 200 || !type.includes('audio/') || buffer.length < 100) return reject(new Error('Invalid TTS response'));
        resolve(buffer);
      });
    });
    request.setTimeout(12000, () => request.destroy(new Error('TTS timeout')));
    request.on('error', reject);
  });
}
router.get('/tts', async (req, res) => {
  const text = String(req.query.text || '').trim();
  if (!text || text.length > 600) return res.status(400).json({ code: 400, message: '发音文本无效。' });
  const speed = Math.max(1, Math.min(5, Number(req.query.speed) || 3));
  const cacheKey = `${speed}:${text}`;
  try {
    let audio = ttsCache.get(cacheKey);
    if (!audio) {
      const chunks = [];
      let remaining = text;
      while (remaining.length) {
        let end = Math.min(120, remaining.length);
        if (end < remaining.length) {
          const boundary = Math.max(remaining.lastIndexOf('. ', end), remaining.lastIndexOf('? ', end), remaining.lastIndexOf('! ', end), remaining.lastIndexOf(', ', end), remaining.lastIndexOf(' ', end));
          if (boundary >= 45) end = boundary + 1;
        }
        chunks.push(remaining.slice(0, end).trim());
        remaining = remaining.slice(end).trim();
      }
      const buffers = [];
      for (const chunk of chunks.filter(Boolean)) {
        const url = `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(chunk)}&spd=${speed}&source=web`;
        buffers.push(await fetchTts(url));
      }
      audio = Buffer.concat(buffers);
      if (ttsCache.size >= 100) ttsCache.delete(ttsCache.keys().next().value);
      ttsCache.set(cacheKey, audio);
    }
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Cache-Control': 'public, max-age=86400' });
    res.end(audio);
  } catch (error) {
    console.error('TTS proxy failed:', error.message);
    res.status(502).json({ code: 502, message: '发音服务暂时不可用。' });
  }
});
router.get('/recording/:id', (req, res) => {
  const item = recordings.get(req.params.id);
  if (!item || item.expiresAt < Date.now()) return res.status(404).end();
  res.set({ 'Content-Type': item.contentType, 'Content-Length': item.buffer.length, 'Cache-Control': 'private, max-age=600', 'Accept-Ranges': 'bytes' });
  res.end(item.buffer);
});

function hasSpeechConfig() {
  return Boolean(config.appId && config.apiKey && config.apiSecret && !String(config.appId).startsWith('YOUR_') && !String(config.apiKey).startsWith('YOUR_') && !String(config.apiSecret).startsWith('YOUR_'));
}

function createAuthUrl() {
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${ISE_HOST}\ndate: ${date}\nGET ${ISE_PATH} HTTP/1.1`;
  const signature = crypto.createHmac('sha256', config.apiSecret).update(signatureOrigin).digest('base64');
  const authorization = Buffer.from(`api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`).toString('base64');
  return `wss://${ISE_HOST}${ISE_PATH}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${ISE_HOST}`;
}

function decodeWavToPcm16(buffer) {
  if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Expected a WAV recording');
  }
  let offset = 12;
  let format;
  let audioData;
  while (offset + 8 <= buffer.length) {
    const name = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = Math.min(buffer.length, start + size);
    if (name === 'fmt ' && size >= 16) {
      format = { encoding: buffer.readUInt16LE(start), channels: buffer.readUInt16LE(start + 2), sampleRate: buffer.readUInt32LE(start + 4), bitsPerSample: buffer.readUInt16LE(start + 14) };
    } else if (name === 'data') audioData = buffer.subarray(start, end);
    offset = start + size + (size % 2);
  }
  if (!format || !audioData?.length) throw new Error('WAV is missing format or audio data');
  if (![1, 3].includes(format.encoding) || ![8, 16, 24, 32].includes(format.bitsPerSample) || !format.channels || !format.sampleRate) throw new Error('Unsupported WAV format');
  const bytesPerSample = format.bitsPerSample / 8;
  const frameBytes = bytesPerSample * format.channels;
  const frameCount = Math.floor(audioData.length / frameBytes);
  if (!frameCount) throw new Error('WAV contains no audio frames');
  const samples = new Float64Array(frameCount);
  const readSample = (position) => {
    if (format.encoding === 3 && format.bitsPerSample === 32) return audioData.readFloatLE(position);
    if (format.bitsPerSample === 8) return (audioData.readUInt8(position) - 128) / 128;
    if (format.bitsPerSample === 16) return audioData.readInt16LE(position) / 32768;
    if (format.bitsPerSample === 24) return audioData.readIntLE(position, 3) / 8388608;
    return audioData.readInt32LE(position) / 2147483648;
  };
  for (let frame = 0; frame < frameCount; frame++) {
    let total = 0;
    for (let channel = 0; channel < format.channels; channel++) total += readSample(frame * frameBytes + channel * bytesPerSample);
    samples[frame] = Math.max(-1, Math.min(1, total / format.channels));
  }
  const targetRate = 16000;
  const targetLength = Math.max(1, Math.round(samples.length * targetRate / format.sampleRate));
  const pcm = Buffer.alloc(targetLength * 2);
  for (let index = 0; index < targetLength; index++) {
    const source = index * format.sampleRate / targetRate;
    const left = Math.min(samples.length - 1, Math.floor(source));
    const right = Math.min(samples.length - 1, left + 1);
    const sample = samples[left] + (samples[right] - samples[left]) * (source - left);
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), index * 2);
  }
  console.log('Speech audio prepared:', { ...format, sourceBytes: audioData.length, pcmBytes: pcm.length });
  return pcm;
}

function trimPcmSilence(pcm, sampleRate = 16000) {
  if (!pcm?.length || pcm.length < sampleRate) return pcm;
  const samples = Math.floor(pcm.length / 2);
  const threshold = 450;
  let first = 0;
  let last = samples - 1;
  while (first < samples && Math.abs(pcm.readInt16LE(first * 2)) < threshold) first++;
  while (last > first && Math.abs(pcm.readInt16LE(last * 2)) < threshold) last--;
  if (first >= last) return pcm;
  const padding = Math.round(sampleRate * 0.2);
  first = Math.max(0, first - padding);
  last = Math.min(samples - 1, last + padding);
  const trimmed = pcm.subarray(first * 2, (last + 1) * 2);
  return trimmed.length >= sampleRate ? trimmed : pcm;
}
function isMp3(buffer, declaredFormat) {
  return declaredFormat === 'mp3' || buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
}

function formatEvaluationText(value, category) {
  const text = normalizeEnglishText(value).replace(/[^A-Za-z0-9.' -]/g, ' ');
  if (category === 'read_word') return `\uFEFF[word]\n${text}`;
  return `\uFEFF[content]\n${text}`;
}

function numberFromXml(xml, field) {
  const match = xml.match(new RegExp(`${field}\\s*=\\s*["']([0-9.]+)["']`, 'i'));
  return match ? Number(match[1]) : null;
}
function scoreOf(value) { return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value <= 10 ? value * 10 : value))) : 0; }
function feedbackFor(score) { return score >= 90 ? '发音很棒，继续保持！' : score >= 80 ? '发音不错，可以再标准一些。' : score >= 70 ? '还差一点，继续调整口型和节奏。' : '建议再听一次标准发音后重新跟读。'; }
function parseResult(xml) {
  const total = numberFromXml(xml, 'total_score');
  const score = scoreOf(total);
  return { hasScore: Number.isFinite(total), score, feedback: feedbackFor(score), detail: { pronunciation: scoreOf(numberFromXml(xml, 'accuracy_score')) || score, fluency: scoreOf(numberFromXml(xml, 'fluency_score')) || score, intonation: scoreOf(numberFromXml(xml, 'standard_score')) || score } };
}

function createIatAuthUrl() {
  const host = 'iat-api.xfyun.cn';
  const path = '/v2/iat';
  const date = new Date().toUTCString();
  const origin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  const signature = crypto.createHmac('sha256', config.apiSecret).update(origin).digest('base64');
  const authorization = Buffer.from(`api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`).toString('base64');
  return `wss://${host}${path}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${host}`;
}
router.post('/transcribe', (req, res) => {
  const { audioBase64, audioFormat = 'mp3' } = req.body || {};
  if (!audioBase64 || !String(audioBase64).trim()) return res.status(400).json({ code: 400, message: '请提供录音数据。' });
  if (!hasSpeechConfig()) return res.status(503).json({ code: 503, message: '语音识别服务尚未配置。' });
  const audio = Buffer.from(audioBase64, 'base64');
  if (!audio.length || audio.length > 8 * 1024 * 1024) return res.status(400).json({ code: 400, message: '录音数据无效。' });
  const encoding = String(audioFormat).toLowerCase() === 'mp3' ? 'lame' : 'raw';
  const ws = new WebSocket(createIatAuthUrl());
  const parts = [];
  let offset = 0;
  let finished = false;
  let timer;
  const timeout = setTimeout(() => finish(504, { code: 504, message: '语音识别超时，请重试。' }), 25000);
  function finish(status, payload) {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    if (timer) clearInterval(timer);
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(1000);
    res.status(status).json(payload);
  }
  ws.on('open', () => {
    timer = setInterval(() => {
      if (finished || ws.readyState !== WebSocket.OPEN) return;
      if (offset >= audio.length) {
        clearInterval(timer); timer = null;
        ws.send(JSON.stringify({ data: { status: 2, format: 'audio/L16;rate=16000', encoding, audio: '' } }));
        return;
      }
      const chunk = audio.subarray(offset, Math.min(offset + FRAME_SIZE, audio.length));
      const first = offset === 0;
      offset += chunk.length;
      const packet = { data: { status: first ? 0 : 1, format: 'audio/L16;rate=16000', encoding, audio: chunk.toString('base64') } };
      if (first) {
        packet.common = { app_id: config.appId };
        packet.business = { language: 'en_us', domain: 'iat', vad_eos: 5000 };
      }
      ws.send(JSON.stringify(packet));
    }, 40);
  });
  ws.on('message', raw => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.code !== 0) return finish(502, { code: 502, message: `语音识别失败：${message.message || message.code}` });
      const words = message.data?.result?.ws || [];
      for (const word of words) {
        const value = word?.cw?.[0]?.w;
        if (value) parts.push(value);
      }
      if (message.data?.status === 2) {
        const transcript = parts.join('').replace(/\s+/g, ' ').trim();
        if (!transcript) return finish(422, { code: 422, message: '没有识别到英文，请重新录音。' });
        return finish(200, { code: 0, data: { text: transcript } });
      }
    } catch (_) { finish(502, { code: 502, message: '语音识别结果解析失败。' }); }
  });
  ws.on('error', () => finish(502, { code: 502, message: '语音识别服务连接失败。' }));
  ws.on('close', () => { if (!finished) finish(502, { code: 502, message: '语音识别连接提前关闭。' }); });
});
router.post('/evaluate', (req, res) => {
  const { audioBase64, word, category = 'read_word', audioFormat = 'wav' } = req.body || {};
  if (!audioBase64 || !String(audioBase64).trim()) return res.status(400).json({ code: 400, message: '请提供录音数据。' });
  if (!word || !String(word).trim()) return res.status(400).json({ code: 400, message: '请提供评测文本。' });
  if (!hasSpeechConfig()) return res.status(503).json({ code: 503, message: '语音评测服务尚未配置。' });
  let source;
  let audio;
  let aue;
  let actualFormat;
  try {
    source = Buffer.from(audioBase64, 'base64');
    if (!source.length) throw new Error('Empty audio');
    if (isMp3(source, audioFormat)) {
      audio = source;
      aue = 'lame';
      actualFormat = 'mp3';
    } else {
      audio = decodeWavToPcm16(source);
      aue = 'raw';
      actualFormat = 'wav';
    }
  } catch (error) {
    console.error('Invalid evaluation audio:', error.message);
    return res.status(400).json({ code: 400, message: '录音格式无效，请重新录音。' });
  }
  const recordingId = saveRecording(source, actualFormat);
  const ws = new WebSocket(createAuthUrl());
  let finished = false;
  let timer;
  const timeout = setTimeout(() => finish(504, { code: 504, message: '语音评测超时，请重新录音。' }), 25000);
  function finish(status, payload) {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    if (timer) clearInterval(timer);
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(1000);
    res.status(status).json(payload);
  }
  ws.on('open', () => {
    ws.send(JSON.stringify({ common: { app_id: config.appId }, business: { sub: 'ise', ent: 'en_vip', category, cmd: 'ssb', tte: 'utf-8', ttp_skip: true, auf: 'audio/L16;rate=16000', aue, rstcd: 'utf8', rst: 'entirety', ise_unite: '1', extra_ability: 'multi_dimension', text: formatEvaluationText(word, category) }, data: { status: 0 } }));
    let offset = 0;
    let first = true;
    timer = setInterval(() => {
      if (finished || ws.readyState !== WebSocket.OPEN) return;
      if (offset >= audio.length) {
        clearInterval(timer); timer = null;
        ws.send(JSON.stringify({ business: { cmd: 'auw', aus: 4 }, data: { status: 2, data: '' } }));
        return;
      }
      const chunk = audio.subarray(offset, Math.min(offset + FRAME_SIZE, audio.length));
      offset += chunk.length;
      ws.send(JSON.stringify({ business: { cmd: 'auw', aus: first ? 1 : 2 }, data: { status: 1, data: chunk.toString('base64') } }));
      first = false;
    }, 40);
  });
  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.code !== 0) return finish(502, { code: 502, message: `语音评测失败：${message.message || message.code}` });
      if (message.data?.status === 2 && message.data.data) {
        const result = parseResult(Buffer.from(message.data.data, 'base64').toString('utf8'));
        if (!result.hasScore) return finish(502, { code: 502, message: '语音评测结果缺少评分。' });
        delete result.hasScore;
        result.playbackPath = `/speech/recording/${recordingId}`;
        return finish(200, { code: 0, data: result });
      }
    } catch (error) { finish(502, { code: 502, message: '语音评测结果解析失败。' }); }
  });
  ws.on('unexpected-response', (_request, response) => finish(502, { code: 502, message: `语音评测鉴权失败：${response.statusCode}` }));
  ws.on('error', () => finish(502, { code: 502, message: '语音评测服务连接失败，请稍后重试。' }));
  ws.on('close', () => { if (!finished) finish(502, { code: 502, message: '语音评测连接提前关闭。' }); });
});

module.exports = router;


