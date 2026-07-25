const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取用户语法进度
router.get('/progress', (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		const progress = db.prepare('SELECT * FROM grammar_progress WHERE user_id = ?').all(userId);

		const progressObj = {};
		progress.forEach(item => {
			progressObj[item.grammar_id] = {
				status: item.status,
				score: item.score,
				last_practice_date: item.last_practice_date
			};
		});

		res.json({ code: 0, data: progressObj });
	} catch (error) {
		console.error('获取语法进度失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新语法进度
router.post('/progress', (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { grammar_id, status, score } = req.body;

		if (!grammar_id) {
			return res.status(400).json({ code: 400, message: '缺少语法ID参数' });
		}

		const today = new Date().toISOString().split('T')[0];
		const existing = db.prepare('SELECT * FROM grammar_progress WHERE user_id = ? AND grammar_id = ?').get(userId, grammar_id);

		if (existing) {
			db.prepare(`
				UPDATE grammar_progress
				SET status = COALESCE(?, status),
					score = COALESCE(?, score),
					last_practice_date = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ? AND grammar_id = ?
			`).run(status, score, today, userId, grammar_id);
		} else {
			db.prepare(`
				INSERT INTO grammar_progress (user_id, grammar_id, status, score, last_practice_date)
				VALUES (?, ?, ?, ?, ?)
			`).run(userId, grammar_id, status || '已学习', score || 0, today);
		}

		// 如果完成学习，更新统计
		if (status === '已学习') {
			db.prepare(`
				UPDATE learning_stats
				SET total_grammar_mastered = total_grammar_mastered + 1,
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ?
			`).run(userId);
		}

		res.json({ code: 0, message: '更新成功' });
	} catch (error) {
		console.error('更新语法进度失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

module.exports = router;
