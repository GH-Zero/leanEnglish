/**
 * API 调用封装
 * 统一管理所有后端接口调用
 */

// 服务器地址（开发环境）
const BASE_URL = 'http://localhost:3000/api';

// 默认用户ID
const DEFAULT_USER_ID = 1;

/**
 * 通用请求方法
 */
function request(url, method = 'GET', data = {}) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + url,
			method: method,
			data: data,
			header: {
				'Content-Type': 'application/json'
			},
			success: (res) => {
				if (res.statusCode === 200 && res.data.code === 0) {
					resolve(res.data.data);
				} else {
					reject(res.data.message || '请求失败');
				}
			},
			fail: (err) => {
				console.error('请求失败:', url, err);
				reject('网络请求失败');
			}
		});
	});
}

// ==================== 用户相关 ====================

/**
 * 获取用户信息
 */
export function getUserProfile(userId = DEFAULT_USER_ID) {
	return request(`/user/profile?userId=${userId}`);
}

/**
 * 更新用户信息
 */
export function updateUserProfile(data, userId = DEFAULT_USER_ID) {
	return request('/user/profile', 'PUT', { ...data, userId });
}

/**
 * 获取学习统计
 */
export function getLearningStats(userId = DEFAULT_USER_ID) {
	return request(`/user/stats?userId=${userId}`);
}

/**
 * 增加单词学习统计
 */
export function updateWordStats(count = 1, isCorrect = true, userId = DEFAULT_USER_ID) {
	return request('/user/stats/word', 'POST', { count, isCorrect, userId });
}

/**
 * 增加语法学习统计
 */
export function updateGrammarStats(count = 1, isCorrect = true, userId = DEFAULT_USER_ID) {
	return request('/user/stats/grammar', 'POST', { count, isCorrect, userId });
}

/**
 * 增加音标学习统计
 */
export function updatePhoneticStats(count = 1, userId = DEFAULT_USER_ID) {
	return request('/user/stats/phonetic', 'POST', { count, userId });
}

/**
 * 增加口语练习统计
 */
export function updateSpeakStats(count = 1, userId = DEFAULT_USER_ID) {
	return request('/user/stats/speak', 'POST', { count, userId });
}

/**
 * 更新学习时长
 */
export function updateStudyTime(minutes = 1, userId = DEFAULT_USER_ID) {
	return request('/user/stats/study-time', 'POST', { minutes, userId });
}

/**
 * 获取连续学习数据
 */
export function getStreakData(userId = DEFAULT_USER_ID) {
	return request(`/user/streak?userId=${userId}`);
}

// ==================== 单词相关 ====================

/**
 * 获取单词状态
 */
export function getWordStatus(userId = DEFAULT_USER_ID) {
	return request(`/word/status?userId=${userId}`);
}

/**
 * 标记单词为认识
 */
export function markWordAsKnown(word, userId = DEFAULT_USER_ID) {
	return request('/word/status/known', 'POST', { word, userId });
}

/**
 * 标记单词为不认识
 */
export function markWordAsUnknown(word, userId = DEFAULT_USER_ID) {
	return request('/word/status/unknown', 'POST', { word, userId });
}

// ==================== 语法相关 ====================

/**
 * 获取语法进度
 */
export function getGrammarProgress(userId = DEFAULT_USER_ID) {
	return request(`/grammar/progress?userId=${userId}`);
}

/**
 * 更新语法进度
 */
export function updateGrammarProgress(grammarId, status, score, userId = DEFAULT_USER_ID) {
	return request('/grammar/progress', 'POST', { grammar_id: grammarId, status, score, userId });
}

// ==================== 音标相关 ====================

/**
 * 获取音标进度
 */
export function getPhoneticProgress(userId = DEFAULT_USER_ID) {
	return request(`/phonetic/progress?userId=${userId}`);
}

/**
 * 更新音标进度
 */
export function updatePhoneticProgress(phoneticId, score, userId = DEFAULT_USER_ID) {
	return request('/phonetic/progress', 'POST', { phonetic_id: phoneticId, score, userId });
}

// ==================== 对话相关 ====================

/**
 * 获取对话历史
 */
export function getDialogueHistory(userId = DEFAULT_USER_ID) {
	return request(`/dialogue/history?userId=${userId}`);
}

/**
 * 保存对话记录
 */
export function saveDialogueHistory(data, userId = DEFAULT_USER_ID) {
	return request('/dialogue/history', 'POST', { ...data, userId });
}

/**
 * 清空对话历史
 */
export function clearDialogueHistory(userId = DEFAULT_USER_ID) {
	return request('/dialogue/history', 'DELETE', { userId });
}

// ==================== 统计相关 ====================

/**
 * 获取学习统计数据
 */
export function getStudyStatistics(userId = DEFAULT_USER_ID) {
	return request(`/statistics?userId=${userId}`);
}

// ==================== 成就相关 ====================

/**
 * 获取成就数据
 */
export function getAchievements(userId = DEFAULT_USER_ID) {
	return request(`/achievement?userId=${userId}`);
}

// ==================== 设置相关 ====================

/**
 * 获取学习设置
 */
export function getSettings(userId = DEFAULT_USER_ID) {
	return request(`/settings?userId=${userId}`);
}

/**
 * 更新学习设置
 */
export function updateSettings(data, userId = DEFAULT_USER_ID) {
	return request('/settings', 'PUT', { ...data, userId });
}

// ==================== 语音评测相关 ====================

/**
 * 语音评测
 */
export function evaluateSpeech(audioBase64, word, category = 'read_word') {
	return request('/speech/evaluate', 'POST', { audioBase64, word, category });
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
	getSettings,
	updateSettings,
	evaluateSpeech
};
