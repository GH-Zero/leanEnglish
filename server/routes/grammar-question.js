const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 获取语法练习题列表
router.get('/list', async (req, res) => {
	try {
		const { level, grammar_id, count = 20 } = req.query;
		let sql = 'SELECT * FROM grammar_questions WHERE 1=1';
		const params = [];

		if (level !== undefined && level !== '') {
			sql += ' AND level = ?';
			params.push(Number(level));
		}
		if (grammar_id !== undefined && grammar_id !== '') {
			sql += ' AND grammar_id = ?';
			params.push(Number(grammar_id));
		}

		sql += ' ORDER BY sort_order ASC LIMIT ?';
		params.push(Number(count));

		const questions = await db.prepare(sql).all(...params);
		// 解析 options JSON 字符串
		questions.forEach(q => {
			try { q.options = JSON.parse(q.options); } catch (e) { q.options = []; }
		});
		res.json({ code: 0, data: questions });
	} catch (err) {
		console.error('获取语法题失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 随机获取语法练习题
router.get('/random', async (req, res) => {
	try {
		const { level, count = 10 } = req.query;
		let sql = 'SELECT * FROM grammar_questions WHERE 1=1';
		const params = [];

		if (level !== undefined && level !== '') {
			sql += ' AND level = ?';
			params.push(Number(level));
		}

		sql += ' ORDER BY RAND() LIMIT ?';
		params.push(Number(count));

		const questions = await db.prepare(sql).all(...params);
		questions.forEach(q => {
			try { q.options = JSON.parse(q.options); } catch (e) { q.options = []; }
		});
		res.json({ code: 0, data: questions });
	} catch (err) {
		console.error('随机获取语法题失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

module.exports = router;
