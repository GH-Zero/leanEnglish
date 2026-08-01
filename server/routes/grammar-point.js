const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { translateGrammarSentence } = require('../utils/grammar-translation');

// 获取语法知识点列表（支持阶段筛选）
router.get('/list', async (req, res) => {
	try {
		const { stage } = req.query;
		let sql = 'SELECT * FROM grammar_points';
		const params = [];

		if (stage !== undefined && stage !== '') {
			sql += ' WHERE stage = ?';
			params.push(Number(stage));
		}

		sql += ' ORDER BY sort_order ASC';
		const points = await db.prepare(sql).all(...params);

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

// 获取阶段综合练习：返回该阶段全部不重复题，交由前端按历史轮换。
router.get('/stage/:stage', async (req, res) => {
	try {
		const stage = Number(req.params.stage);
		if (![1, 2, 3].includes(stage)) return res.status(400).json({ code: 400, message: '阶段参数无效' });
		const questions = await db.prepare(`
			SELECT q.*, p.title AS grammar_title
			FROM grammar_questions q
			INNER JOIN grammar_points p ON p.id = q.grammar_id
			WHERE p.stage = ?
			ORDER BY p.sort_order ASC, q.sort_order ASC, q.id ASC
		`).all(stage);
		const seen = new Set();
		const uniqueQuestions = [];
		for (const question of questions) {
			const key = String(question.sentence || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '');
			if (!key || seen.has(key)) continue;
			seen.add(key);
			try { question.options = JSON.parse(question.options); } catch (_) { question.options = []; }
			if (!Array.isArray(question.options) || question.options.length < 2 || !question.options.includes(question.answer)) continue;
			question.translation = question.translation || translateGrammarSentence(question); uniqueQuestions.push(question);
		}
		const names = ['', '基础句型', '核心语法', '进阶语法'];
		res.json({ code: 0, data: { id: 0, stage, title: names[stage] + '轮换练习', description: `从本阶段 ${uniqueQuestions.length} 道不重复题中依次练习，全部完成后开启新一轮`, explanation: '本练习覆盖阶段内全部语法知识点。系统优先安排你尚未做过的题目，完成整轮后才会重新抽取。', examples: [], questions: uniqueQuestions, questionCount: uniqueQuestions.length } });
	} catch (err) {
		console.error('获取阶段综合练习失败:', err);
		res.status(500).json({ code: 500, message: '获取阶段练习失败' });
	}
});
// 获取单个语法知识点详情
router.get('/detail/:id', async (req, res) => {
	try {
		const point = await db.prepare('SELECT * FROM grammar_points WHERE id = ?').get(req.params.id);
		if (!point) {
			return res.json({ code: -1, message: '知识点不存在' });
		}
		try { point.examples = JSON.parse(point.examples); } catch (e) { point.examples = []; }

		const userId = Number.parseInt(req.query.userId, 10) || 1;
		const questions = await db.prepare('SELECT * FROM grammar_questions WHERE grammar_id = ? ORDER BY sort_order ASC, id ASC').all(req.params.id);
		const uniqueQuestions = [];
		const seenQuestions = new Set();
		questions.forEach(question => {
			try { question.options = JSON.parse(question.options); } catch (_) { question.options = []; }
			const key = String(question.sentence || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '');
			if (key && !seenQuestions.has(key) && Array.isArray(question.options) && question.options.includes(question.answer)) { seenQuestions.add(key); question.translation = question.translation || translateGrammarSentence(question); uniqueQuestions.push(question); }
		});
		let completedRows = await db.prepare('SELECT question_id FROM grammar_question_progress WHERE user_id=? AND grammar_id=? AND correct=1').all(userId, req.params.id);
		let completedIds = new Set(completedRows.map(row => Number(row.question_id)));
		let cycleReset = false;
		if (uniqueQuestions.length >= 100 && completedIds.size >= uniqueQuestions.length) {
			await db.prepare('DELETE FROM grammar_question_progress WHERE user_id=? AND grammar_id=?').run(userId, req.params.id);
			completedIds = new Set();
			cycleReset = true;
		}
		point.questionCount = uniqueQuestions.length;
		point.completedCount = completedIds.size;
		point.remainingCount = uniqueQuestions.length - completedIds.size;
		point.cycleReset = cycleReset;
		point.questions = uniqueQuestions.filter(question => !completedIds.has(Number(question.id)));

		res.json({ code: 0, data: point });
	} catch (err) {
		console.error('获取语法知识点详情失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

module.exports = router;
