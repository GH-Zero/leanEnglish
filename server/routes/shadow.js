const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { normalizeEnglishText, englishWords } = require('../utils/english-text');
async function enrichPhonetics(sentences) {
	if (!Array.isArray(sentences) || !sentences.length) return sentences;
	const tokens = new Set();
	sentences.forEach(s => englishWords(s.text).forEach(w => tokens.add(w)));
	const list = [...tokens];
	let map = {};
	if (list.length) {
		try {
			const rows = await db.prepare(`SELECT word, phonetic_us FROM words WHERE word IN (${list.map(() => '?').join(',')})`).all(...list);
			map = Object.fromEntries(rows.map(r => [r.word, String(r.phonetic_us || '').replace(/^\/|\/$/g, '').trim()]));
		} catch (err) { map = {}; }
	}
	sentences.forEach(s => {
		const raw = englishWords(normalizeEnglishText(s.text));
		s.phonetic = raw.map(w => map[w.toLowerCase()] || w).join(' ');
	});
	return sentences;
}


// 获取跟读句子列表（支持等级筛选）
router.get('/list', async (req, res) => {
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

		const sentences = await db.prepare(sql).all(...params);
		res.json({ code: 0, data: await enrichPhonetics(sentences) });
	} catch (err) {
		console.error('获取跟读句子失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 随机获取跟读句子
router.get('/random', async (req, res) => {
	try {
		const { level, count = 10, exclude = '' } = req.query;
		const safeCount = Math.max(1, Math.min(30, Number(count) || 10));
		const excludedIds = String(exclude).split(',').map(Number).filter(id => Number.isInteger(id) && id > 0).slice(0, 1000);
		let sql = 'SELECT * FROM shadow_sentences';
		const conditions = [];
		const params = [];

		if (level !== undefined && level !== '') {
			conditions.push('level = ?');
			params.push(Number(level));
		}
		if (excludedIds.length) {
			conditions.push(`id NOT IN (${excludedIds.map(() => '?').join(',')})`);
			params.push(...excludedIds);
		}
		if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;

		sql += ' ORDER BY RAND() LIMIT ?';
		params.push(safeCount);

		const sentences = await db.prepare(sql).all(...params);
		res.json({ code: 0, data: await enrichPhonetics(sentences) });
	} catch (err) {
		console.error('随机获取句子失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

module.exports = router;
