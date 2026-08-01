/**
 * 统一数据存储管理
 * 所有页面通过此模块读写数据，确保数据一致性
 */

// 存储键名常量
const STORAGE_KEYS = {
	USER_PROFILE: 'userProfile',           // 用户信息
	WORD_STATUS: 'wordStatus',             // 单词学习状态
	GRAMMAR_PROGRESS: 'grammarProgress',   // 语法学习进度
	PHONETIC_PROGRESS: 'phoneticProgress', // 音标学习进度
	LEARNING_STATS: 'learningStats',       // 学习统计数据
	DIALOGUE_HISTORY: 'dialogueHistory',   // 对话历史
	SETTINGS: 'learningSettings',          // 学习设置
	STREAK_DATA: 'streakData',             // 连续学习数据
	DAILY_RECORD: 'dailyRecord'            // 每日学习记录
};

// 默认数据
const DEFAULT_DATA = {
	userProfile: {
		avatar: '/static/logo.png',
		nickname: '英语学习者',
		goalIndex: 0,
		levelIndex: 0,
		durationIndex: 1,
		focusIndex: 0,
		createdAt: new Date().toISOString()
	},
	learningStats: {
		totalWordsLearned: 0,
		totalGrammarMastered: 0,
		totalPhoneticMastered: 0,
		totalSpeakPractice: 0,
		totalStudyMinutes: 0,
		streakDays: 0,
		maxStreakDays: 0,
		lastStudyDate: null,
		accuracy: 0,
		totalPracticeCount: 0,
		correctCount: 0
	},
	streakData: {
		currentStreak: 0,
		maxStreak: 0,
		lastStudyDate: null,
		studyDates: []
	},
	dailyRecord: {
		date: null,
		wordsLearned: 0,
		wordsReviewed: 0,
		grammarPracticed: 0,
		phoneticPracticed: 0,
		speakPracticed: 0,
		studyMinutes: 0
	}
};

/**
 * 获取存储数据
 */
export function getData(key) {
	try {
		const data = uni.getStorageSync(key);
		return data || null;
	} catch (e) {
		console.error('读取数据失败:', key, e);
		return null;
	}
}

/**
 * 设置存储数据
 */
export function setData(key, data) {
	try {
		uni.setStorageSync(key, data);
		return true;
	} catch (e) {
		console.error('保存数据失败:', key, e);
		return false;
	}
}

/**
 * 获取用户档案
 */
export function getUserProfile() {
	return getData(STORAGE_KEYS.USER_PROFILE) || { ...DEFAULT_DATA.userProfile };
}

/**
 * 保存用户档案
 */
export function saveUserProfile(profile) {
	const existing = getUserProfile();
	const updated = { ...existing, ...profile };
	return setData(STORAGE_KEYS.USER_PROFILE, updated);
}

/**
 * 获取学习统计
 */
export function getLearningStats() {
	return getData(STORAGE_KEYS.LEARNING_STATS) || { ...DEFAULT_DATA.learningStats };
}

/**
 * 保存学习统计
 */
export function saveLearningStats(stats) {
	const existing = getLearningStats();
	const updated = { ...existing, ...stats };
	return setData(STORAGE_KEYS.LEARNING_STATS, updated);
}

/**
 * 更新学习统计 - 单词学习
 */
export function updateWordStats(count = 1, isCorrect = true) {
	const stats = getLearningStats();
	stats.totalWordsLearned += count;
	if (isCorrect) {
		stats.correctCount += count;
	}
	stats.totalPracticeCount += count;
	stats.accuracy = stats.totalPracticeCount > 0 
		? Math.round((stats.correctCount / stats.totalPracticeCount) * 100) 
		: 0;
	
	// 更新今日记录
	updateDailyRecord({ wordsLearned: count });
	
	// 更新连续学习天数
	updateStreak();
	
	return saveLearningStats(stats);
}

/**
 * 更新学习统计 - 语法练习
 */
export function updateGrammarStats(count = 1, isCorrect = true) {
	const stats = getLearningStats();
	stats.totalGrammarMastered += count;
	if (isCorrect) {
		stats.correctCount += count;
	}
	stats.totalPracticeCount += count;
	stats.accuracy = stats.totalPracticeCount > 0 
		? Math.round((stats.correctCount / stats.totalPracticeCount) * 100) 
		: 0;
	
	updateDailyRecord({ grammarPracticed: count });
	updateStreak();
	
	return saveLearningStats(stats);
}

/**
 * 更新学习统计 - 音标练习
 */
export function updatePhoneticStats(count = 1) {
	const stats = getLearningStats();
	stats.totalPhoneticMastered += count;
	
	updateDailyRecord({ phoneticPracticed: count });
	updateStreak();
	
	return saveLearningStats(stats);
}

/**
 * 更新学习统计 - 口语练习
 */
export function updateSpeakStats(count = 1, score = 0) {
	const stats = getLearningStats();
	stats.totalSpeakPractice += count;
	
	updateDailyRecord({ speakPracticed: count });
	updateStreak();
	
	return saveLearningStats(stats);
}

/**
 * 更新学习时长
 */
export function updateStudyTime(minutes) {
	const stats = getLearningStats();
	stats.totalStudyMinutes += minutes;
	
	updateDailyRecord({ studyMinutes: minutes });
	
	return saveLearningStats(stats);
}

/**
 * 获取连续学习数据
 */
export function getStreakData() {
	return getData(STORAGE_KEYS.STREAK_DATA) || { ...DEFAULT_DATA.streakData };
}

/**
 * 更新连续学习天数
 */
export function updateStreak() {
	const today = new Date().toISOString().split('T')[0];
	const streak = getStreakData();
	
	// 如果今天已经记录过，不重复更新
	if (streak.lastStudyDate === today) {
		return streak;
	}
	
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = yesterday.toISOString().split('T')[0];
	
	if (streak.lastStudyDate === yesterdayStr) {
		// 连续学习
		streak.currentStreak += 1;
	} else if (streak.lastStudyDate !== today) {
		// 断了，重新开始
		streak.currentStreak = 1;
	}
	
	// 更新最大连续天数
	if (streak.currentStreak > streak.maxStreak) {
		streak.maxStreak = streak.currentStreak;
	}
	
	streak.lastStudyDate = today;
	if (!streak.studyDates) streak.studyDates = [];
	if (!streak.studyDates.includes(today)) {
		streak.studyDates.push(today);
		// 只保留最近30天的记录
		if (streak.studyDates.length > 30) {
			streak.studyDates = streak.studyDates.slice(-30);
		}
	}
	
	setData(STORAGE_KEYS.STREAK_DATA, streak);
	
	// 同步更新学习统计
	const stats = getLearningStats();
	stats.streakDays = streak.currentStreak;
	stats.maxStreakDays = streak.maxStreak;
	stats.lastStudyDate = today;
	saveLearningStats(stats);
	
	return streak;
}

/**
 * 获取今日学习记录
 */
export function getDailyRecord() {
	const today = new Date().toISOString().split('T')[0];
	const record = getData(STORAGE_KEYS.DAILY_RECORD);
	
	// 如果不是今天的记录，重置
	if (!record || record.date !== today) {
		return {
			date: today,
			wordsLearned: 0,
			wordsReviewed: 0,
			grammarPracticed: 0,
			phoneticPracticed: 0,
			speakPracticed: 0,
			studyMinutes: 0
		};
	}
	
	return record;
}

/**
 * 更新今日学习记录
 */
export function updateDailyRecord(data) {
	const today = new Date().toISOString().split('T')[0];
	let record = getDailyRecord();
	
	if (record.date !== today) {
		record = {
			date: today,
			wordsLearned: 0,
			wordsReviewed: 0,
			grammarPracticed: 0,
			phoneticPracticed: 0,
			speakPracticed: 0,
			studyMinutes: 0
		};
	}
	
	record = { ...record, ...data };
	setData(STORAGE_KEYS.DAILY_RECORD, record);
	
	// 保存到历史记录中
	const history = getData('dailyRecordHistory') || {};
	history[today] = record;
	setData('dailyRecordHistory', history);
	
	return true;
}

/**
 * 获取单词状态
 */
export function getWordStatus() {
	return getData(STORAGE_KEYS.WORD_STATUS) || {};
}

/**
 * 保存单词状态
 */
export function saveWordStatus(wordId, status) {
	const allStatus = getWordStatus();
	allStatus[wordId] = {
		...allStatus[wordId],
		...status,
		lastReviewDate: new Date().toISOString()
	};
	return setData(STORAGE_KEYS.WORD_STATUS, allStatus);
}

/**
 * 获取语法进度
 */
export function getGrammarProgress() {
	return getData(STORAGE_KEYS.GRAMMAR_PROGRESS) || {};
}

/**
 * 保存语法进度
 */
export function saveGrammarProgress(grammarId, progress) {
	const allProgress = getGrammarProgress();
	allProgress[grammarId] = {
		...allProgress[grammarId],
		...progress,
		lastPracticeDate: new Date().toISOString()
	};
	return setData(STORAGE_KEYS.GRAMMAR_PROGRESS, allProgress);
}

/**
 * 获取音标进度
 */
export function getPhoneticProgress() {
	return getData(STORAGE_KEYS.PHONETIC_PROGRESS) || {};
}

/**
 * 保存音标进度
 */
export function savePhoneticProgress(phoneticId, progress) {
	const allProgress = getPhoneticProgress();
	allProgress[phoneticId] = {
		...allProgress[phoneticId],
		...progress,
		lastPracticeDate: new Date().toISOString()
	};
	return setData(STORAGE_KEYS.PHONETIC_PROGRESS, allProgress);
}

/**
 * 获取成就数据
 */
export function getAchievements() {
	const stats = getLearningStats();
	const streak = getStreakData();
	
	return {
		// 学习成就
		learning: [
			{ 
				id: 'beginner', 
				name: '初学者', 
				description: '完成第一次学习', 
				unlocked: stats.totalWordsLearned > 0 || stats.totalGrammarMastered > 0,
				progress: 100,
				icon: '🌱'
			},
			{ 
				id: 'word_master_100', 
				name: '单词达人', 
				description: '学习100个单词', 
				unlocked: stats.totalWordsLearned >= 100,
				progress: Math.min(100, Math.round((stats.totalWordsLearned / 100) * 100)),
				icon: '📖'
			},
			{ 
				id: 'word_master_500', 
				name: '词汇大师', 
				description: '学习500个单词', 
				unlocked: stats.totalWordsLearned >= 500,
				progress: Math.min(100, Math.round((stats.totalWordsLearned / 500) * 100)),
				icon: '📚'
			},
			{ 
				id: 'grammar_beginner', 
				name: '语法入门', 
				description: '完成5个语法练习', 
				unlocked: stats.totalGrammarMastered >= 5,
				progress: Math.min(100, Math.round((stats.totalGrammarMastered / 5) * 100)),
				icon: '📝'
			},
			{ 
				id: 'speak_beginner', 
				name: '口语新星', 
				description: '完成10次跟读', 
				unlocked: stats.totalSpeakPractice >= 10,
				progress: Math.min(100, Math.round((stats.totalSpeakPractice / 10) * 100)),
				icon: '🗣️'
			}
		],
		// 连续学习成就
		streak: [
			{ 
				id: 'streak_3', 
				name: '三天连续', 
				description: '连续学习3天', 
				unlocked: streak.currentStreak >= 3 || streak.maxStreak >= 3,
				icon: '🔥'
			},
			{ 
				id: 'streak_7', 
				name: '一周坚持', 
				description: '连续学习7天', 
				unlocked: streak.currentStreak >= 7 || streak.maxStreak >= 7,
				icon: '🔥'
			},
			{ 
				id: 'streak_15', 
				name: '半月达人', 
				description: '连续学习15天', 
				unlocked: streak.currentStreak >= 15 || streak.maxStreak >= 15,
				icon: '🔥'
			},
			{ 
				id: 'streak_30', 
				name: '一月之星', 
				description: '连续学习30天', 
				unlocked: streak.currentStreak >= 30 || streak.maxStreak >= 30,
				icon: '🔥'
			}
		],
		// 特殊成就
		special: [
			{ 
				id: 'pronunciation_master', 
				name: '发音高手', 
				description: '发音准确率达到90%', 
				unlocked: stats.accuracy >= 90,
				icon: '🎯'
			},
			{ 
				id: 'dialogue_master', 
				name: '对话达人', 
				description: '完成20次AI对话', 
				unlocked: stats.totalSpeakPractice >= 20,
				icon: '💬'
			},
			{ 
				id: 'all_achievements', 
				name: '全能学霸', 
				description: '解锁所有徽章', 
				unlocked: false, // 需要特殊计算
				icon: '🏆'
			}
		]
	};
}

/**
 * 获取学习统计数据（用于统计页面）
 */
export function getStudyStatistics() {
	const stats = getLearningStats();
	const streak = getStreakData();
	const daily = getDailyRecord();
	
	// 计算本周学习数据
	const weekData = calculateWeekData();
	
	return {
		totalDays: streak.studyDates ? streak.studyDates.length : 0,
		totalWords: stats.totalWordsLearned,
		totalHours: (stats.totalStudyMinutes / 60).toFixed(1),
		wordsLearned: stats.totalWordsLearned,
		grammarPractice: stats.totalGrammarMastered,
		speakPractice: stats.totalSpeakPractice,
		accuracy: stats.accuracy,
		currentStreak: streak.currentStreak,
		maxStreak: streak.maxStreak,
		todayRecord: daily,
		weekData: weekData
	};
}

/**
 * 计算本周学习数据
 */
function calculateWeekData() {
	const streak = getStreakData();
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0-6, 0是周日
	const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
	
	// 获取每日记录历史
	const dailyRecords = getData('dailyRecordHistory') || {};
	
	const weekData = [];
	for (let i = 0; i < 7; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() - dayOfWeek + i);
		const dateStr = date.toISOString().split('T')[0];
		
		let studyMinutes = 0;
		if (dailyRecords[dateStr]) {
			const r = dailyRecords[dateStr];
			studyMinutes = (r.wordsLearned || 0) * 1 + (r.grammarPracticed || 0) * 2 + (r.phoneticPracticed || 0) * 1 + (r.speakPracticed || 0) * 2 + (r.studyMinutes || 0);
		} else if (streak.studyDates && streak.studyDates.includes(dateStr)) {
			// 有学习记录但无详细数据，给一个基础值
			studyMinutes = 30;
		}
		
		const height = studyMinutes > 0 ? Math.min(150, Math.max(20, studyMinutes)) : 10;
		
		weekData.push({
			label: weekDays[i],
			value: studyMinutes,
			height: height,
			isToday: i === dayOfWeek
		});
	}
	
	return weekData;
}

export default {
	getData,
	setData,
	getUserProfile,
	saveUserProfile,
	getLearningStats,
	saveLearningStats,
	updateWordStats,
	updateGrammarStats,
	updatePhoneticStats,
	updateSpeakStats,
	updateStudyTime,
	getStreakData,
	updateStreak,
	getDailyRecord,
	updateDailyRecord,
	getWordStatus,
	saveWordStatus,
	getGrammarProgress,
	saveGrammarProgress,
	getPhoneticProgress,
	savePhoneticProgress,
	getAchievements,
	getStudyStatistics,
	STORAGE_KEYS
};
