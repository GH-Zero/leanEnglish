/**
 * API 调用封装
 * 统一管理所有后端接口调用
 */

// 服务器地址（开发环境）
export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://chatai.yanjy.top/api').replace(/\/$/, '');
// export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

// 当前微信授权用户，未登录时不再回退到公共测试账号
export function getCurrentUserId() { return Number(uni.getStorageSync('currentUserId') || 0); }

/**
 * 通用请求方法
 */
let loginPromise = null;

function createRequestError(res) {
	const error = new Error(res.data?.message || `请求失败（${res.statusCode}）`);
	error.statusCode = res.statusCode;
	error.code = res.data?.code;
	return error;
}

function rawRequest(url, method = 'GET', data = {}, token = '') {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + url,
			method,
			data,
			timeout: 15000,
			header: {
				'Content-Type': 'application/json; charset=utf-8',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			},
			success: (res) => {
				if (res.statusCode === 200 && res.data?.code === 0) {
					if (String(method).toUpperCase() !== 'GET' && url !== '/user/wechat-login') {
						setTimeout(() => uni.$emit('achievement:check'), 250);
					}
					resolve(res.data.data);
					return;
				}
				reject(createRequestError(res));
			},
			fail: (err) => {
				console.error('请求失败:', url, err);
				reject(new Error('网络请求失败，请检查网络、后端服务和 API 地址'));
			}
		});
	});
}

function loginWithWechat() {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		wx.login({
			timeout: 10000,
			success(loginResult) {
				if (!loginResult.code) return reject(new Error('未获取到微信登录凭证'));
				rawRequest('/user/wechat-login', 'POST', { code: loginResult.code })
					.then((result) => {
						if (!result?.token) throw new Error('登录接口未返回有效凭证');
						uni.setStorageSync('authToken', result.token);
						uni.setStorageSync('currentUserId', Number(result.user?.id || 0));
						uni.setStorageSync('userProfile', result.user || {});
						uni.$emit('auth:ready', result.user || {});
						resolve(result.user || {});
					})
					.catch(reject);
			},
			fail: () => reject(new Error('微信登录凭证获取失败'))
		});
		// #endif
		// #ifndef MP-WEIXIN
		reject(new Error('请在微信小程序中完成授权登录'));
		// #endif
	});
}

// 所有未登录请求共享同一个登录任务，相当于进入同一等待队列。
export function wechatLogin(options = {}) {
	const force = Boolean(options.force);
	if (!force && uni.getStorageSync('authToken')) {
		return Promise.resolve(uni.getStorageSync('userProfile') || {});
	}
	if (loginPromise) return loginPromise;
	loginPromise = loginWithWechat().finally(() => { loginPromise = null; });
	return loginPromise;
}

/**
 * 通用请求：未登录先排队等待登录；401 时刷新登录并自动重试一次。
 */
export async function request(url, method = 'GET', data = {}, retried = false) {
	if (url === '/user/wechat-login') return rawRequest(url, method, data);

	if (!uni.getStorageSync('authToken')) await wechatLogin();
	const requestToken = String(uni.getStorageSync('authToken') || '');

	try {
		return await rawRequest(url, method, data, requestToken);
	} catch (error) {
		if (Number(error?.statusCode) !== 401 || retried) throw error;

		// 只删除本次请求使用的过期令牌，避免覆盖其他请求刚刷新的新令牌。
		if (String(uni.getStorageSync('authToken') || '') === requestToken) {
			uni.removeStorageSync('authToken');
			uni.removeStorageSync('currentUserId');
		}
		await wechatLogin();
		return request(url, method, data, true);
	}
}
// ==================== 用户相关 ====================

/**
 * 获取用户信息
 */
export function getUserProfile(userId = getCurrentUserId()) {
	return request(`/user/profile?userId=${userId}`);
}

/**
 * 更新用户信息
 */
export function updateUserProfile(data, userId = getCurrentUserId()) {
	return request('/user/profile', 'PUT', { ...data, userId });
}

/**
 * 获取学习统计
 */
export function getLearningStats(userId = getCurrentUserId()) {
	return request(`/user/stats?userId=${userId}`);
}

/**
 * 增加单词学习统计
 */
export function updateWordStats(count = 1, isCorrect = true, userId = getCurrentUserId()) {
	return request('/user/stats/word', 'POST', { count, isCorrect, userId });
}

/**
 * 增加语法学习统计
 */
export function updateGrammarStats(count = 1, isCorrect = true, userId = getCurrentUserId()) {
	return request('/user/stats/grammar', 'POST', { count, isCorrect, userId });
}

/**
 * 增加音标学习统计
 */
export function updatePhoneticStats(count = 1, userId = getCurrentUserId()) {
	return request('/user/stats/phonetic', 'POST', { count, userId });
}

/**
 * 增加口语练习统计
 */
export function updateSpeakStats(count = 1, userId = getCurrentUserId()) {
	return request('/user/stats/speak', 'POST', { count, userId });
}

/**
 * 更新学习时长
 */
export function updateStudyTime(minutes = 1, userId = getCurrentUserId()) {
	return request('/user/stats/study-time', 'POST', { minutes, userId });
}

/**
 * 获取连续学习数据
 */
export function getStreakData(userId = getCurrentUserId()) {
	return request(`/user/streak?userId=${userId}`);
}

// ==================== 单词相关 ====================

/**
 * 获取单词状态
 */
export function getWordStatus(userId = getCurrentUserId()) {
	return request(`/word/status?userId=${userId}`);
}

/**
 * 标记单词为认识
 */
export function markWordAsKnown(word, mode, userId = getCurrentUserId()) {
	return request('/word/status/known', 'POST', { word, mode, userId });
}

/**
 * 标记单词为不认识
 */
export function markWordAsUnknown(word, mode, userId = getCurrentUserId()) {
	return request('/word/status/unknown', 'POST', { word, mode, userId });
}

export function getWrongWords(mode = '', userId = getCurrentUserId()) {
	const modeQuery = mode ? `&mode=${encodeURIComponent(mode)}` : '';
	return request(`/words/wrong?userId=${userId}&limit=100${modeQuery}`);
}

export function clearWrongWord(word, mode = '', userId = getCurrentUserId()) {
	return request('/word/status/clear-wrong', 'POST', { word, mode, userId });
}
// ==================== 语法相关 ====================

/**
 * 获取语法进度
 */
export function getGrammarProgress(userId = getCurrentUserId()) {
	return request(`/grammar/progress?userId=${userId}`);
}

/**
 * 更新语法进度
 */
export function updateGrammarProgress(grammarId, status, score, userId = getCurrentUserId()) {
	return request('/grammar/progress', 'POST', { grammar_id: grammarId, status, score, userId });
}

// ==================== 音标相关 ====================

/**
 * 获取音标进度
 */
export function getPhoneticProgress(userId = getCurrentUserId()) {
	return request(`/phonetic/progress?userId=${userId}`);
}

/**
 * 更新音标进度
 */
export function updatePhoneticProgress(phoneticId, score, userId = getCurrentUserId()) {
	return request('/phonetic/progress', 'POST', { phonetic_id: phoneticId, score, userId });
}

// ==================== 对话相关 ====================

/**
 * 获取对话历史
 */
export function getDialogueHistory(userId = getCurrentUserId()) {
	return request(`/dialogue/history?userId=${userId}`);
}

/**
 * 保存对话记录
 */
export function saveDialogueHistory(data, userId = getCurrentUserId()) {
	return request('/dialogue/history', 'POST', { ...data, userId });
}

/**
 * 清空对话历史
 */
export function clearDialogueHistory(userId = getCurrentUserId()) {
	return request('/dialogue/history', 'DELETE', { userId });
}

// ==================== 统计相关 ====================

/**
 * 获取学习统计数据
 */
export function getStudyStatistics(userId = getCurrentUserId()) {
	return request(`/statistics?userId=${userId}`);
}

// ==================== 成就相关 ====================

/**
 * 获取成就数据
 */
export function getAchievements(userId = getCurrentUserId()) {
	return request(`/achievement?userId=${userId}`);
}

export function getAchievementRewards(userId = getCurrentUserId()) {
	return request(`/achievement/rewards?userId=${userId}`);
}

export function useAchievementReward(type, count = 1, userId = getCurrentUserId()) {
	return request('/achievement/rewards/use', 'POST', { type, count, userId });
}

// ==================== 设置相关 ====================

/**
 * 获取学习设置
 */
export function getSettings(userId = getCurrentUserId()) {
	return request(`/settings?userId=${userId}`);
}

/**
 * 更新学习设置
 */
export function updateSettings(data, userId = getCurrentUserId()) {
	return request('/settings', 'PUT', { ...data, userId });
}

export function resetLearningProgress(userId = getCurrentUserId()) {
	return request('/settings/progress', 'DELETE', { userId });
}

// ==================== 语音评测相关 ====================

/**
 * 语音评测
 */
export function evaluateSpeech(audioBase64, word, category = 'read_word', audioFormat = 'mp3') {
	return request('/speech/evaluate', 'POST', { audioBase64, word, category, audioFormat });
}

export function uploadUserAvatar(image, userId = getCurrentUserId()) {
	return request('/user/profile/avatar', 'POST', { image, userId });
}
export function transcribeSpeech(audioBase64, audioFormat = 'mp3') {
	return request('/speech/transcribe', 'POST', { audioBase64, audioFormat });
}

export default {
	getUserProfile,
	updateUserProfile,
	getLearningStats,
	updateWordStats,
	updateGrammarStats,
	updatePhoneticStats,
	updateSpeakStats,
	updateStudyTime,
	getStreakData,
	getWordStatus,
	getWrongWords,
	clearWrongWord,
	markWordAsKnown,
	markWordAsUnknown,
	getGrammarProgress,
	updateGrammarProgress,
	getPhoneticProgress,
	updatePhoneticProgress,
	getDialogueHistory,
	saveDialogueHistory,
	clearDialogueHistory,
	getStudyStatistics,
	getAchievements,
	getAchievementRewards,
	useAchievementReward,
	getSettings,
	updateSettings,
	resetLearningProgress,
	evaluateSpeech
};

