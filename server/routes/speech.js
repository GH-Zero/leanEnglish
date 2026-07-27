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
  recordings.set(id, { buffer, contentType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav', expiresAt: Date.now() + RECORDING_TTL_MS });
  setTimeout(() => recordings.delete(id), RECORDING_TTL_MS).unref?.();
  return id;
}

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

function isMp3(buffer, declaredFormat) {
  return declaredFormat === 'mp3' || buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
}

function formatEvaluationText(value, category) {
  const text = String(value || '').trim().replace(/[^A-Za-z0-9.' -]/g, ' ');
  if (category === 'read_word') return `\uFEFF[word]\n${text}`;
  return `\uFEFF[content]\n${text}`;
}

function numberFromXml(xml, field) {
  const match = xml.match(new RegExp(`${field}\\s*=\\s*["']([0-9.]+)["']`, 'i'));
  return match ? Number(match[1]) : null;
}
function scoreOf(value) { return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value <= 10 ? value * 10 : value))) : 0; }
function feedbackFor(score) { return score >= 90 ? '发音很棒，继续保持！' : score >= 80 ? '发音不错，可以再标准一些。' : score >= 70 ? '发音达标，继续巩固口型和节奏。' : '建议再听一次标准发音后重新跟读。'; }
function parseResult(xml) {
  const total = numberFromXml(xml, 'total_score');
  const score = scoreOf(total);
  return { hasScore: Number.isFinite(total), score, feedback: feedbackFor(score), detail: { pronunciation: scoreOf(numberFromXml(xml, 'accuracy_score')) || score, fluency: scoreOf(numberFromXml(xml, 'fluency_score')) || score, intonation: scoreOf(numberFromXml(xml, 'standard_score')) || score } };
}

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
