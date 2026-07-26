const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 获取学习统计数据
router.get('/', async (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;

		// 获取基础统计
		const stats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		const streak = await db.prepare('SELECT * FROM streak_data WHERE user_id = ?').get(userId);

		// 获取学习日期
		const studyDateRows = await db.prepare(`
			SELECT DISTINCT date FROM daily_records
			WHERE user_id = ? AND (words_learned > 0 OR grammar_practiced > 0 OR phonetic_practiced > 0 OR speak_practiced > 0)
			ORDER BY date DESC
			LIMIT 30
		`).all(userId);
		const studyDates = studyDateRows.map(r => r.date);

		// 获取本周数据
		const weekData = await getWeekData(userId);

		// 获取今日记录
		const today = new Date().toISOString().split('T')[0];
		const todayRecord = await db.prepare('SELECT * FROM daily_records WHERE user_id = ? AND date = ?').get(userId, today);

		res.json({
			code: 0,
			data: {
				totalDays: studyDates.length,
				totalWords: stats ? stats.total_words_learned : 0,
				totalHours: stats ? (stats.total_study_minutes / 60).toFixed(1) : '0',
				wordsLearned: stats ? stats.total_words_learned : 0,
				grammarPractice: stats ? stats.total_grammar_mastered : 0,
				speakPractice: stats ? stats.total_speak_practice : 0,
				accuracy: stats ? stats.accuracy : 0,
				currentStreak: streak ? streak.current_streak : 0,
				maxStreak: streak ? streak.max_streak : 0,
				studyDates: studyDates,
				weekData: weekData,
				todayRecord: todayRecord || {
					words_learned: 0,
					grammar_practiced: 0,
					phonetic_practiced: 0,
					speak_practiced: 0,
					study_minutes: 0
				}
			}
		});
	} catch (error) {
		console.error('获取学习统计数据失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 获取本周学习数据
async function getWeekData(userId) {
	const today = new Date();
	const dayOfWeek = today.getDay();
	const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

	const weekData = [];
	for (let i = 0; i < 7; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() - dayOfWeek + i);
		const dateStr = date.toISOString().split('T')[0];

		// 查询当天学习记录
		const record = await db.prepare('SELECT * FROM daily_records WHERE user_id = ? AND date = ?').get(userId, dateStr);
		const hasStudy = record && (record.words_learned > 0 || record.grammar_practiced > 0 || record.phonetic_practiced > 0 || record.speak_practiced > 0);

		weekData.push({
			label: weekDays[i],
			value: hasStudy ? (record.study_minutes || 30) : 0,
			height: hasStudy ? Math.max(20, (record.study_minutes || 30) * 2) : 10,
			isToday: i === dayOfWeek
		});
	}

	return weekData;
}

module.exports = router;
