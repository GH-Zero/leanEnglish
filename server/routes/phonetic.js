const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取用户音标进度
router.get('/progress', (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		const progress = db.prepare('SELECT * FROM phonetic_progress WHERE user_id = ?').all(userId);

		const progressObj = {};
		progress.forEach(item => {
			progressObj[item.phonetic_id] = {
				best_score: item.best_score,
				attempts: item.attempts,
				mastered: item.mastered === 1,
				last_practice_date: item.last_practice_date
			};
		});

		res.json({ code: 0, data: progressObj });
	} catch (error) {
		console.error('获取音标进度失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新音标进度
router.post('/progress', (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { phonetic_id, score } = req.body;

		if (!phonetic_id) {
			return res.status(400).json({ code: 400, message: '缺少音标ID参数' });
		}

		const today = new Date().toISOString().split('T')[0];
		const existing = db.prepare('SELECT * FROM phonetic_progress WHERE user_id = ? AND phonetic_id = ?').get(userId, phonetic_id);

		if (existing) {
			const newBestScore = Math.max(existing.best_score, score || 0);
			const newAttempts = existing.attempts + 1;
			const newMastered = newBestScore >= 80 ? 1 : 0;

			db.prepare(`
				UPDATE phonetic_progress
				SET best_score = ?,
					attempts = ?,
					mastered = ?,
					last_practice_date = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ? AND phonetic_id = ?
			`).run(newBestScore, newAttempts, newMastered, today, userId, phonetic_id);
		} else {
			const mastered = (score || 0) >= 80 ? 1 : 0;
			db.prepare(`
				INSERT INTO phonetic_progress (user_id, phonetic_id, best_score, attempts, mastered, last_practice_date)
				VALUES (?, ?, ?, 1, ?, ?)
			`).run(userId, phonetic_id, score || 0, mastered, today);
		}

		// 更新学习统计
		db.prepare(`
			UPDATE learning_stats
			SET total_phonetic_mastered = total_phonetic_mastered + 1,
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`).run(userId);

		res.json({ code: 0, message: '更新成功' });
	} catch (error) {
		console.error('更新音标进度失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

module.exports = router;
