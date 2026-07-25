const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取用户单词状态
router.get('/status', (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		const wordStatus = db.prepare('SELECT * FROM word_status WHERE user_id = ?').all(userId);

		// 转换为对象格式
		const statusObj = {};
		wordStatus.forEach(item => {
			statusObj[item.word] = {
				ease_factor: item.ease_factor,
				interval: item.interval,
				repetition: item.repetition,
				next_review_date: item.next_review_date,
				last_review_date: item.last_review_date,
				mastered: item.mastered === 1
			};
		});

		res.json({ code: 0, data: statusObj });
	} catch (error) {
		console.error('获取单词状态失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新单词状态（认识）
router.post('/status/known', (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { word } = req.body;

		if (!word) {
			return res.status(400).json({ code: 400, message: '缺少单词参数' });
		}

		const today = new Date().toISOString().split('T')[0];
		const existing = db.prepare('SELECT * FROM word_status WHERE user_id = ? AND word = ?').get(userId, word);

		if (existing) {
			const newRepetition = existing.repetition + 1;
			let newInterval = existing.interval;
			let newMastered = existing.mastered;

			// SRS算法
			if (newRepetition >= 3) {
				newMastered = 1;
				newInterval = Math.ceil(existing.interval * existing.ease_factor);
			} else {
				newInterval = 1;
			}

			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + newInterval);

			db.prepare(`
				UPDATE word_status
				SET repetition = ?,
					interval = ?,
					mastered = ?,
					next_review_date = ?,
					last_review_date = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ? AND word = ?
			`).run(newRepetition, newInterval, newMastered, nextDate.toISOString().split('T')[0], today, userId, word);
		} else {
			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 1);

			db.prepare(`
				INSERT INTO word_status (user_id, word, repetition, interval, next_review_date, last_review_date, mastered)
				VALUES (?, ?, 1, 1, ?, ?, 0)
			`).run(userId, word, nextDate.toISOString().split('T')[0], today);
		}

		// 更新学习统计
		const stats = db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		if (stats) {
			const newPracticeCount = stats.total_practice_count + 1;
			const newCorrectCount = stats.correct_count + 1;
			const newAccuracy = newPracticeCount > 0 ? Math.round((newCorrectCount / newPracticeCount) * 100) : 0;

			db.prepare(`
				UPDATE learning_stats
				SET total_words_learned = total_words_learned + 1,
					correct_count = ?,
					total_practice_count = ?,
					accuracy = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ?
			`).run(newCorrectCount, newPracticeCount, newAccuracy, userId);
		}

		res.json({ code: 0, message: '更新成功' });
	} catch (error) {
		console.error('更新单词状态失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新单词状态（不认识）
router.post('/status/unknown', (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { word } = req.body;

		if (!word) {
			return res.status(400).json({ code: 400, message: '缺少单词参数' });
		}

		const today = new Date().toISOString().split('T')[0];
		const existing = db.prepare('SELECT * FROM word_status WHERE user_id = ? AND word = ?').get(userId, word);

		if (existing) {
			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 1);

			db.prepare(`
				UPDATE word_status
				SET repetition = 0,
					interval = 1,
					mastered = 0,
					next_review_date = ?,
					last_review_date = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ? AND word = ?
			`).run(nextDate.toISOString().split('T')[0], today, userId, word);
		} else {
			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 1);

			db.prepare(`
				INSERT INTO word_status (user_id, word, repetition, interval, next_review_date, last_review_date, mastered)
				VALUES (?, ?, 0, 1, ?, ?, 0)
			`).run(userId, word, nextDate.toISOString().split('T')[0], today);
		}

		// 更新学习统计
		const stats = db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		if (stats) {
			const newPracticeCount = stats.total_practice_count + 1;
			const newAccuracy = newPracticeCount > 0 ? Math.round((stats.correct_count / newPracticeCount) * 100) : 0;

			db.prepare(`
				UPDATE learning_stats
				SET total_words_learned = total_words_learned + 1,
					total_practice_count = ?,
					accuracy = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ?
			`).run(newPracticeCount, newAccuracy, userId);
		}

		res.json({ code: 0, message: '更新成功' });
	} catch (error) {
		console.error('更新单词状态失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

module.exports = router;
