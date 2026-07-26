const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 获取用户信息
router.get('/profile', async (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

		if (!user) {
			return res.status(404).json({ code: 404, message: '用户不存在' });
		}

		res.json({ code: 0, data: user });
	} catch (error) {
		console.error('获取用户信息失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新用户信息
router.put('/profile', async (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { nickname, avatar, level, goal, study_duration, focus } = req.body;

		await db.prepare(`
			UPDATE users
			SET nickname = COALESCE(?, nickname),
				avatar = COALESCE(?, avatar),
				level = COALESCE(?, level),
				goal = COALESCE(?, goal),
				study_duration = COALESCE(?, study_duration),
				focus = COALESCE(?, focus),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`).run(nickname, avatar, level, goal, study_duration, focus, userId);

		const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
		res.json({ code: 0, data: user, message: '更新成功' });
	} catch (error) {
		console.error('更新用户信息失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 获取学习统计
router.get('/stats', async (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		const stats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);

		if (!stats) {
			return res.json({ code: 0, data: null });
		}

		res.json({ code: 0, data: stats });
	} catch (error) {
		console.error('获取学习统计失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 增加单词学习统计
router.post('/stats/word', async (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { count = 1, isCorrect = true } = req.body;

		const stats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		if (!stats) {
			return res.status(404).json({ code: 404, message: '用户统计不存在' });
		}

		const newTotalWords = stats.total_words_learned + count;
		const newCorrectCount = isCorrect ? stats.correct_count + count : stats.correct_count;
		const newPracticeCount = stats.total_practice_count + count;
		const newAccuracy = newPracticeCount > 0 ? Math.round((newCorrectCount / newPracticeCount) * 100) : 0;

		await db.prepare(`
			UPDATE learning_stats
			SET total_words_learned = ?,
				correct_count = ?,
				total_practice_count = ?,
				accuracy = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`).run(newTotalWords, newCorrectCount, newPracticeCount, newAccuracy, userId);

		// 更新今日记录
		await updateDailyRecord(userId, { words_learned: count });

		// 更新连续学习
		await updateStreak(userId);

		const updatedStats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		res.json({ code: 0, data: updatedStats, message: '更新成功' });
	} catch (error) {
		console.error('更新单词统计失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 增加语法学习统计
router.post('/stats/grammar', async (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { count = 1, isCorrect = true } = req.body;

		const stats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		if (!stats) {
			return res.status(404).json({ code: 404, message: '用户统计不存在' });
		}

		const newTotalGrammar = stats.total_grammar_mastered + count;
		const newCorrectCount = isCorrect ? stats.correct_count + count : stats.correct_count;
		const newPracticeCount = stats.total_practice_count + count;
		const newAccuracy = newPracticeCount > 0 ? Math.round((newCorrectCount / newPracticeCount) * 100) : 0;

		await db.prepare(`
			UPDATE learning_stats
			SET total_grammar_mastered = ?,
				correct_count = ?,
				total_practice_count = ?,
				accuracy = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`).run(newTotalGrammar, newCorrectCount, newPracticeCount, newAccuracy, userId);

		await updateDailyRecord(userId, { grammar_practiced: count });
		await updateStreak(userId);

		const updatedStats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		res.json({ code: 0, data: updatedStats, message: '更新成功' });
	} catch (error) {
		console.error('更新语法统计失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 增加音标学习统计
router.post('/stats/phonetic', async (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { count = 1 } = req.body;

		await db.prepare(`
			UPDATE learning_stats
			SET total_phonetic_mastered = total_phonetic_mastered + ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`).run(count, userId);

		await updateDailyRecord(userId, { phonetic_practiced: count });
		await updateStreak(userId);

		const updatedStats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		res.json({ code: 0, data: updatedStats, message: '更新成功' });
	} catch (error) {
		console.error('更新音标统计失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 增加口语练习统计
router.post('/stats/speak', async (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { count = 1 } = req.body;

		await db.prepare(`
			UPDATE learning_stats
			SET total_speak_practice = total_speak_practice + ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`).run(count, userId);

		await updateDailyRecord(userId, { speak_practiced: count });
		await updateStreak(userId);

		const updatedStats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		res.json({ code: 0, data: updatedStats, message: '更新成功' });
	} catch (error) {
		console.error('更新口语统计失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新学习时长
router.post('/stats/study-time', async (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { minutes = 1 } = req.body;

		await db.prepare(`
			UPDATE learning_stats
			SET total_study_minutes = total_study_minutes + ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`).run(minutes, userId);

		await updateDailyRecord(userId, { study_minutes: minutes });

		const updatedStats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		res.json({ code: 0, data: updatedStats, message: '更新成功' });
	} catch (error) {
		console.error('更新学习时长失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 获取连续学习数据
router.get('/streak', async (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		const streak = await db.prepare('SELECT * FROM streak_data WHERE user_id = ?').get(userId);

		if (!streak) {
			return res.json({ code: 0, data: null });
		}

		// 获取学习日期列表
		const studyDateRows = await db.prepare(`
			SELECT DISTINCT date FROM daily_records
			WHERE user_id = ? AND (words_learned > 0 OR grammar_practiced > 0 OR phonetic_practiced > 0 OR speak_practiced > 0)
			ORDER BY date DESC
			LIMIT 30
		`).all(userId);
		const studyDates = studyDateRows.map(r => r.date);

		res.json({ code: 0, data: { ...streak, study_dates: studyDates } });
	} catch (error) {
		console.error('获取连续学习数据失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新连续学习天数
async function updateStreak(userId) {
	const today = new Date().toISOString().split('T')[0];
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = yesterday.toISOString().split('T')[0];

	const streak = await db.prepare('SELECT * FROM streak_data WHERE user_id = ?').get(userId);
	if (!streak) return;

	if (streak.last_study_date === today) {
		return; // 今天已经记录过
	}

	let newStreak;
	if (streak.last_study_date === yesterdayStr) {
		newStreak = streak.current_streak + 1;
	} else {
		newStreak = 1;
	}

	const maxStreak = Math.max(newStreak, streak.max_streak);

	await db.prepare(`
		UPDATE streak_data
		SET current_streak = ?,
			max_streak = ?,
			last_study_date = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE user_id = ?
	`).run(newStreak, maxStreak, today, userId);

	// 同步更新学习统计
	await db.prepare(`
		UPDATE learning_stats
		SET streak_days = ?,
			max_streak_days = ?,
			last_study_date = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE user_id = ?
	`).run(newStreak, maxStreak, today, userId);
}

// 更新每日记录
async function updateDailyRecord(userId, data) {
	const today = new Date().toISOString().split('T')[0];
	const existing = await db.prepare('SELECT * FROM daily_records WHERE user_id = ? AND date = ?').get(userId, today);

	if (existing) {
		const updates = [];
		const values = [];

		if (data.words_learned) {
			updates.push('words_learned = words_learned + ?');
			values.push(data.words_learned);
		}
		if (data.words_reviewed) {
			updates.push('words_reviewed = words_reviewed + ?');
			values.push(data.words_reviewed);
		}
		if (data.grammar_practiced) {
			updates.push('grammar_practiced = grammar_practiced + ?');
			values.push(data.grammar_practiced);
		}
		if (data.phonetic_practiced) {
			updates.push('phonetic_practiced = phonetic_practiced + ?');
			values.push(data.phonetic_practiced);
		}
		if (data.speak_practiced) {
			updates.push('speak_practiced = speak_practiced + ?');
			values.push(data.speak_practiced);
		}
		if (data.study_minutes) {
			updates.push('study_minutes = study_minutes + ?');
			values.push(data.study_minutes);
		}

		if (updates.length > 0) {
			values.push(userId, today);
			await db.prepare(`UPDATE daily_records SET ${updates.join(', ')} WHERE user_id = ? AND date = ?`).run(...values);
		}
	} else {
		await db.prepare(`
			INSERT INTO daily_records (user_id, date, words_learned, words_reviewed, grammar_practiced, phonetic_practiced, speak_practiced, study_minutes)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`).run(
			userId,
			today,
			data.words_learned || 0,
			data.words_reviewed || 0,
			data.grammar_practiced || 0,
			data.phonetic_practiced || 0,
			data.speak_practiced || 0,
			data.study_minutes || 0
		);
	}
}

module.exports = router;
