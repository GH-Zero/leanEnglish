const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取语法知识点列表（支持阶段筛选）
router.get('/list', (req, res) => {
	try {
		const { stage } = req.query;
		let sql = 'SELECT * FROM grammar_points';
		const params = [];

		if (stage !== undefined && stage !== '') {
			sql += ' WHERE stage = ?';
			params.push(Number(stage));
		}

		sql += ' ORDER BY sort_order ASC';
		const points = db.prepare(sql).all(...params);

		// 解析 examples JSON
		points.forEach(p => {
			try { p.examples = JSON.parse(p.examples); } catch (e) { p.examples = []; }
		});

		res.json({ code: 0, data: points });
	} catch (err) {
		console.error('获取语法知识点失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 获取单个语法知识点详情
router.get('/detail/:id', (req, res) => {
	try {
		const point = db.prepare('SELECT * FROM grammar_points WHERE id = ?').get(req.params.id);
		if (!point) {
			return res.json({ code: -1, message: '知识点不存在' });
		}
		try { point.examples = JSON.parse(point.examples); } catch (e) { point.examples = []; }

		// 获取该知识点的练习题
		const questions = db.prepare('SELECT * FROM grammar_questions WHERE grammar_id = ? ORDER BY sort_order ASC').all(req.params.id);
		questions.forEach(q => {
			try { q.options = JSON.parse(q.options); } catch (e) { q.options = []; }
		});
		point.questions = questions;

		res.json({ code: 0, data: point });
	} catch (err) {
		console.error('获取语法知识点详情失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

module.exports = router;
