import { getSettings } from '@/utils/api.js';

export async function getAudioSettings() {
	let settings = uni.getStorageSync('learningSettings') || {};
	try {
		settings = { ...settings, ...(await getSettings()) };
	} catch (_) {}
	return {
		autoPlay: Boolean(Number(settings.auto_play ?? (settings.autoPlay !== false))),
		accentIndex: Math.max(0, Math.min(1, Number(settings.accent ?? settings.accentIndex ?? 0))),
		voiceType: Number(settings.accent ?? settings.accentIndex ?? 0) === 1 ? 2 : 1
	};
}