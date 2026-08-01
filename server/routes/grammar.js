const express = require('express');
const router = express.Router();
const { db } = require('../db');

const MASTERY_RULES = { minAttempts: 1, minQuestions: 10, minAccuracy: 80, minLastScore: 80 };

async function syncMasteredCount(userId) {
	const row = await db.prepare('SELECT COUNT(*) AS total FROM grammar_progress WHERE user_id = ? AND mastered = 1').get(userId);
	await db.prepare('UPDATE learning_stats SET total_grammar_mastered = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(Number(row?.total || 0), userId);
}

router.get('/progress', async (req, res) => {
	try {
		const userId = parseInt(req.query.userId, 10) || 1;
		const progress = await db.prepare('SELECT * FROM grammar_progress WHERE user_id = ?').all(userId);
		const data = {};
		progress.forEach(item => {
			const totalQuestions = Number(item.total_questions || 0);
			const correctAnswers = Number(item.correct_answers || 0);
			data[item.grammar_id] = {
				status: item.mastered === 1 ? '已掌握' : '学习中',
				mastered: item.mastered === 1,
				score: Number(item.score || 0),
				lastScore: Number(item.last_score || 0),
				attempts: Number(item.attempts || 0),
				totalQuestions,
				correctAnswers,
				accuracy: totalQuestions ? Math.round(correctAnswers * 100 / totalQuestions) : 0,
				last_practice_date: item.last_practice_date,
				rules: MASTERY_RULES
			};
		});
		res.json({ code: 0, data, rules: MASTERY_RULES });
	} catch (error) {
		console.error('获取语法进度失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

router.post('/progress', async (req, res) => {
	try {
		const userId = parseInt(req.body.userId, 10) || 1;
		const grammarId = Number(req.body.grammar_id);
		const totalQuestions = Math.max(0, Number(req.body.total_questions || 0));
		const correctCount = Math.max(0, Math.min(totalQuestions, Number(req.body.correct_count || 0)));
		if (!grammarId || !Number.isInteger(totalQuestions) || totalQuestions <= 0 || !Number.isInteger(correctCount)) {
			return res.status(400).json({ code: 400, message: '缺少有效的语法练习结果' });
		}

		const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
		const existing = await db.prepare('SELECT * FROM grammar_progress WHERE user_id = ? AND grammar_id = ?').get(userId, grammarId);
		const attempts = Number(existing?.attempts || 0) + 1;
		const accumulatedQuestions = Number(existing?.total_questions || 0) + totalQuestions;
		const accumulatedCorrect = Number(existing?.correct_answers || 0) + correctCount;
		const lastScore = Math.round(correctCount * 100 / totalQuestions);
		const accuracy = Math.round(accumulatedCorrect * 100 / accumulatedQuestions);
		const mastered = attempts >= MASTERY_RULES.minAttempts && accumulatedQuestions >= MASTERY_RULES.minQuestions && accuracy >= MASTERY_RULES.minAccuracy && lastScore >= MASTERY_RULES.minLastScore;
		const status = mastered ? '已掌握' : '学习中';

		if (existing) {
			await db.prepare(`UPDATE grammar_progress SET status=?, score=?, attempts=?, total_questions=?, correct_answers=?, last_score=?, mastered=?, last_practice_date=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND grammar_id=?`).run(status, accuracy, attempts, accumulatedQuestions, accumulatedCorrect, lastScore, mastered ? 1 : 0, today, userId, grammarId);
		} else {
			await db.prepare(`INSERT INTO grammar_progress (user_id, grammar_id, status, score, attempts, total_questions, correct_answers, last_score, mastered, last_practice_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(userId, grammarId, status, accuracy, attempts, accumulatedQuestions, accumulatedCorrect, lastScore, mastered ? 1 : 0, today);
		}
		await syncMasteredCount(userId);
		res.json({ code: 0, data: { status, mastered, attempts, totalQuestions: accumulatedQuestions, correctAnswers: accumulatedCorrect, accuracy, lastScore, rules: MASTERY_RULES } });
	} catch (error) {
		console.error('更新语法进度失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

module.exports = router;