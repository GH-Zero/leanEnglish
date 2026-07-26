const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取跟读句子列表（支持等级筛选）
router.get('/list', (req, res) => {
	try {
		const { level, count = 10 } = req.query;
		let sql = 'SELECT * FROM shadow_sentences';
		const params = [];

		if (level !== undefined && level !== '') {
			sql += ' WHERE level = ?';
			params.push(Number(level));
		}

		sql += ' ORDER BY sort_order ASC LIMIT ?';
		params.push(Number(count));

		const sentences = db.prepare(sql).all(...params);
		res.json({ code: 0, data: sentences });
	} catch (err) {
		console.error('获取跟读句子失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 随机获取跟读句子
router.get('/random', (req, res) => {
	try {
		const { level, count = 10 } = req.query;
		let sql = 'SELECT * FROM shadow_sentences';
		const params = [];

		if (level !== undefined && level !== '') {
			sql += ' WHERE level = ?';
			params.push(Number(level));
		}

		sql += ' ORDER BY RANDOM() LIMIT ?';
		params.push(Number(count));

		const sentences = db.prepare(sql).all(...params);
		res.json({ code: 0, data: sentences });
	} catch (err) {
		console.error('随机获取句子失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

module.exports = router;
