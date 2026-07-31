const express = require('express');
const router = express.Router();
const { db } = require('../db');
function chinaDate(date = new Date()) {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
	}).format(date);
}

// 获取学习统计数据
router.get('/', async (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;

		// 获取基础统计
		const stats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		const streak = await db.prepare('SELECT * FROM streak_data WHERE user_id = ?').get(userId);
		const totalDaysRow = await db.prepare('SELECT COUNT(DISTINCT date) AS total FROM daily_records WHERE user_id = ? AND (words_learned > 0 OR grammar_practiced > 0 OR phonetic_practiced > 0 OR speak_practiced > 0 OR study_minutes > 0)').get(userId);

		// 获取学习日期
		const studyDateRows = await db.prepare(`
			SELECT DISTINCT date FROM daily_records
			WHERE user_id = ? AND (words_learned > 0 OR grammar_practiced > 0 OR phonetic_practiced > 0 OR speak_practiced > 0 OR study_minutes > 0)
			ORDER BY date DESC
			LIMIT 366
		`).all(userId);
		const studyDates = studyDateRows.map(r => r.date);

		// 获取本周数据
		const weekData = await getWeekData(userId);

		// 获取今日记录
		const today = chinaDate();
		const todayRecord = await db.prepare('SELECT * FROM daily_records WHERE user_id = ? AND date = ?').get(userId, today);

		res.json({
			code: 0,
			data: {
				totalDays: Number(totalDaysRow?.total || 0),
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
	const now = new Date();
	const chinaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
	const mondayOffset = (chinaNow.getDay() + 6) % 7;
	const monday = new Date(chinaNow);
	monday.setDate(chinaNow.getDate() - mondayOffset);
	const labels = ['一', '二', '三', '四', '五', '六', '日'];
	const dates = Array.from({ length: 7 }, (_, index) => {
		const date = new Date(monday);
		date.setDate(monday.getDate() + index);
		return chinaDate(date);
	});
	const rows = await db.prepare(`
		SELECT date, study_minutes FROM daily_records
		WHERE user_id = ? AND date BETWEEN ? AND ?
	`).all(userId, dates[0], dates[6]);
	const minutesByDate = new Map(rows.map(row => [String(row.date), Number(row.study_minutes || 0)]));
	const maxMinutes = Math.max(...dates.map(date => minutesByDate.get(date) || 0), 1);
	const today = chinaDate();
	return dates.map((date, index) => {
		const value = minutesByDate.get(date) || 0;
		return {
			label: labels[index],
			date,
			value,
			height: value > 0 ? Math.max(18, Math.round(value / maxMinutes * 160)) : 0,
			isToday: date === today
		};
	});
}

module.exports = router;
