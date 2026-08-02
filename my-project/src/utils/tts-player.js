import { BASE_URL } from '@/utils/api.js';

let queue = [];
let playing = false;
let activeAudio = null;
let activeItem = null;
let generation = 0;
let fileIndex = 0;
const pendingKeys = new Set();

function removeItemFile(item) {
	if (!item?.filePath) return;
	const filePath = item.filePath;
	item.filePath = '';
	try {
		uni.getFileSystemManager().unlink({ filePath, fail() {} });
	} catch (_) {}
}

function finishCurrent(success, error = null) {
	const item = activeItem;
	if (item?.key) pendingKeys.delete(item.key);
	if (activeAudio) { activeAudio.destroy(); activeAudio = null; }
	removeItemFile(item);
	activeItem = null;
	playing = false;
	if (item) success ? item.resolve(true) : item.reject(error || new Error('语音播放失败'));
	pump();
}

function pump() {
	if (playing || !queue.length) return;
	const item = queue.shift();
	const currentGeneration = generation;
	playing = true;
	activeItem = item;
	const url = `${BASE_URL}/speech/tts?text=${encodeURIComponent(item.text)}&speed=${item.speed}`;

	// 真机上的 downloadFile 使用单独的下载域名白名单。这里沿用 API 请求域名，
	// 获取音频字节后写入小程序本地目录，再交给 InnerAudioContext 播放。
	uni.request({
		url,
		method: 'GET',
		responseType: 'arraybuffer',
		timeout: 20000,
		success(response) {
			if (currentGeneration !== generation) return;
			if (response.statusCode !== 200 || !response.data || !response.data.byteLength) {
				finishCurrent(false, new Error('语音加载失败'));
				return;
			}
			const userDataPath = typeof wx !== 'undefined' && wx.env?.USER_DATA_PATH
				? wx.env.USER_DATA_PATH
				: uni.env?.USER_DATA_PATH;
			if (!userDataPath) {
				finishCurrent(false, new Error('语音缓存目录不可用'));
				return;
			}
			item.filePath = `${userDataPath}/tts-${Date.now()}-${fileIndex++}.mp3`;
			uni.getFileSystemManager().writeFile({
				filePath: item.filePath,
				data: response.data,
				success() {
					if (currentGeneration !== generation) {
						removeItemFile(item);
						return;
					}
					const audio = uni.createInnerAudioContext();
					let started = false;
					activeAudio = audio;
					audio.autoplay = false;
					audio.obeyMuteSwitch = false;
					audio.src = item.filePath;
					audio.onCanplay(() => {
						if (!started && currentGeneration === generation && activeAudio === audio) {
							started = true;
							audio.play();
						}
					});
					audio.onEnded(() => finishCurrent(true));
					audio.onError(error => {
						console.error('TTS playback failed:', error);
						finishCurrent(false, new Error('语音播放失败'));
					});
				},
				fail(error) {
					console.error('TTS file write failed:', error);
					if (currentGeneration === generation) finishCurrent(false, new Error('语音缓存失败'));
				}
			});
		},
		fail(error) {
			console.error('TTS request failed:', error);
			if (currentGeneration === generation) finishCurrent(false, new Error('语音请求失败'));
		}
	});
}

// Serialize all clicks; never interrupt the current audio.
export function playTts(text, speed = 3) {
	const value = String(text || '').trim();
	if (!value) return Promise.resolve(false);
	const normalizedSpeed = Math.max(1, Math.min(5, Number(speed) || 3));
	const key = `${normalizedSpeed}:${value}`;
	if (pendingKeys.has(key)) return Promise.resolve(false);
	pendingKeys.add(key);
	return new Promise((resolve, reject) => {
		queue.push({ key, text: value, speed: normalizedSpeed, resolve, reject });
		pump();
	});
}

export function clearTtsQueue() {
	generation++;
	queue.splice(0).forEach(item => item.resolve(false));
	pendingKeys.clear();
	if (activeAudio) { activeAudio.stop(); activeAudio.destroy(); activeAudio = null; }
	if (activeItem) {
		removeItemFile(activeItem);
		activeItem.resolve(false);
	}
	activeItem = null;
	playing = false;
}
