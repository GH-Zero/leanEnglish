const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取单词列表（分页 + 筛选）
router.get('/list', (req, res) => {
	try {
		const { level, page = 1, pageSize = 20, tag } = req.query;
		const offset = (page - 1) * pageSize;

		let sql = 'SELECT * FROM words WHERE 1=1';
		const params = [];

		if (level !== undefined) {
			sql += ' AND level = ?';
			params.push(Number(level));
		}
		if (tag) {
			sql += ' AND tag = ?';
			params.push(tag);
		}

		// 总数
		const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
		const { total } = db.prepare(countSql).get(...params);

		// 分页数据
		sql += ' ORDER BY sort_order ASC LIMIT ? OFFSET ?';
		params.push(Number(pageSize), Number(offset));
		const words = db.prepare(sql).all(...params);

		res.json({
			code: 0,
			data: {
				list: words,
				total,
				page: Number(page),
				pageSize: Number(pageSize),
				pages: Math.ceil(total / pageSize)
			}
		});
	} catch (err) {
		console.error('获取单词列表失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 随机获取单词
router.get('/random', (req, res) => {
	try {
		const { level, count = 20 } = req.query;

		let sql = 'SELECT * FROM words';
		const params = [];

		if (level !== undefined) {
			sql += ' WHERE level = ?';
			params.push(Number(level));
		}

		sql += ' ORDER BY RANDOM() LIMIT ?';
		params.push(Number(count));

		const words = db.prepare(sql).all(...params);

		res.json({ code: 0, data: words });
	} catch (err) {
		console.error('随机获取单词失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 获取单词详情
router.get('/detail/:id', (req, res) => {
	try {
		const word = db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id);
		if (!word) {
			return res.json({ code: -1, message: '单词不存在' });
		}
		res.json({ code: 0, data: word });
	} catch (err) {
		console.error('获取单词详情失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 获取各等级单词数量统计
router.get('/count', (req, res) => {
	try {
		const stats = db.prepare('SELECT level, COUNT(*) as count FROM words GROUP BY level').all();
		const total = db.prepare('SELECT COUNT(*) as count FROM words').get().count;
		res.json({ code: 0, data: { stats, total } });
	} catch (err) {
		console.error('获取统计失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 获取未学习的单词（跳过已掌握的）
router.get('/unlearned', (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		const level = parseInt(req.query.level);
		const limit = parseInt(req.query.limit) || 20;

		// 获取用户已掌握的单词
		const masteredWords = db.prepare(
			'SELECT word FROM word_status WHERE user_id = ? AND mastered = 1'
		).all(userId).map(r => r.word);

		// 获取用户已学过的单词（包含未掌握的，需要复习的）
		const learnedWords = db.prepare(
			'SELECT word FROM word_status WHERE user_id = ?'
		).all(userId).map(r => r.word);

		let sql = 'SELECT * FROM words WHERE word NOT IN (SELECT word FROM word_status WHERE user_id = ? AND mastered = 1)';
		const params = [userId];

		if (!isNaN(level)) {
			sql += ' AND level = ?';
			params.push(level);
		}

		// 优先返回需要复习的单词
		const today = new Date().toISOString().split('T')[0];
		const reviewSql = `
			SELECT w.* FROM words w
			INNER JOIN word_status ws ON w.word = ws.word
			WHERE ws.user_id = ? AND ws.mastered = 0
			AND ws.next_review_date <= ?
			${!isNaN(level) ? 'AND w.level = ?' : ''}
			ORDER BY ws.next_review_date ASC
			LIMIT ?
		`;
		const reviewParams = [userId, today, ...(isNaN(level) ? [] : [level]), limit];
		const reviewWords = db.prepare(reviewSql).all(...reviewParams);

		// 新单词（从未学过的）
		sql += ' AND word NOT IN (SELECT word FROM word_status WHERE user_id = ?)';
		params.push(userId);
		if (!isNaN(level)) {
			// level already added above, need to not duplicate
		} else {
			// no level filter
		}
		sql += ' ORDER BY sort_order ASC LIMIT ?';
		params.push(limit);

		const newWords = db.prepare(sql).all(...params);

		// 合并：复习单词优先，不足则补新单词
		const allWords = [...reviewWords, ...newWords].slice(0, limit);

		const totalInDb = db.prepare(
			!isNaN(level) ? 'SELECT COUNT(*) as c FROM words WHERE level = ?' : 'SELECT COUNT(*) as c FROM words'
		).get(...(isNaN(level) ? [] : [level])).c;

		res.json({
			code: 0,
			data: {
				words: allWords,
				reviewCount: reviewWords.length,
				newCount: newWords.length,
				masteredCount: masteredWords.length,
				totalInDb
			}
		});
	} catch (err) {
		console.error('获取未学习单词失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 获取所有标签
router.get('/tags', (req, res) => {
	try {
		const tags = db.prepare('SELECT DISTINCT tag FROM words ORDER BY tag').all();
		res.json({ code: 0, data: tags.map(t => t.tag) });
	} catch (err) {
		console.error('获取标签失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

module.exports = router;
