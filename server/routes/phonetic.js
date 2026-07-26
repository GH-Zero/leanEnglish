const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');
// 获取用户音标学习进度
router.get('/progress', (req, res) => {
	try {
		const userId = parseInt(req.query.userId, 10) || 1;
		const rows = db.prepare('SELECT * FROM phonetic_progress WHERE user_id = ?').all(userId);
		const data = {};
		rows.forEach(item => {
			data[item.phonetic_id] = {
				best_score: item.best_score,
				attempts: item.attempts,
				mastered: item.mastered === 1,
				last_practice_date: item.last_practice_date
			};
		});
		res.json({ code: 0, data });
	} catch (error) {
		console.error('获取音标进度失败:', error);
		res.status(500).json({ code: 500, message: '获取音标进度失败' });
	}
});

// 保存真实语音评测产生的音标进度
router.post('/progress', (req, res) => {
	try {
		const userId = parseInt(req.body.userId, 10) || 1;
		const phoneticId = String(req.body.phonetic_id || '').trim();
		const score = Number(req.body.score);
		if (!phoneticId || !Number.isFinite(score) || score < 0 || score > 100) {
			return res.status(400).json({ code: 400, message: '音标和有效评分不能为空' });
		}
		const today = new Date().toISOString().split('T')[0];
		const existing = db.prepare('SELECT * FROM phonetic_progress WHERE user_id = ? AND phonetic_id = ?').get(userId, phoneticId);
		const bestScore = Math.max(existing ? existing.best_score : 0, Math.round(score));
		const mastered = bestScore >= 80 ? 1 : 0;
		if (existing) {
			db.prepare(`UPDATE phonetic_progress SET best_score = ?, attempts = attempts + 1, mastered = ?, last_practice_date = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND phonetic_id = ?`).run(bestScore, mastered, today, userId, phoneticId);
		} else {
			db.prepare(`INSERT INTO phonetic_progress (user_id, phonetic_id, best_score, attempts, mastered, last_practice_date) VALUES (?, ?, ?, 1, ?, ?)`).run(userId, phoneticId, bestScore, mastered, today);
		}
		res.json({ code: 0, data: { best_score: bestScore, mastered: mastered === 1 } });
	} catch (error) {
		console.error('更新音标进度失败:', error);
		res.status(500).json({ code: 500, message: '更新音标进度失败' });
	}
});

// 获取音标列表（支持分类筛选）
router.get('/list', (req, res) => {
	try {
		const { category } = req.query;
		let sql = 'SELECT * FROM phonetics';
		const params = [];

		if (category) {
			sql += ' WHERE category = ?';
			params.push(category);
		}

		sql += ' ORDER BY sort_order ASC';
		const phonetics = db.prepare(sql).all(...params);
		res.json({ code: 0, data: phonetics });
	} catch (err) {
		console.error('获取音标列表失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 获取所有音标（按分类分组）
router.get('/all', (req, res) => {
	try {
		const phonetics = db.prepare('SELECT * FROM phonetics ORDER BY sort_order ASC').all();
		res.json({ code: 0, data: phonetics });
	} catch (err) {
		console.error('获取音标失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

module.exports = router;
