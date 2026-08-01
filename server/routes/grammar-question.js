const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { translateGrammarSentence } = require('../utils/grammar-translation');

function normalizeQuestion(question) {
  return String(question.sentence || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '');
}

function parseAndDedupe(rows, count) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const key = `${row.grammar_id || ''}:${normalizeQuestion(row)}`;
    if (!normalizeQuestion(row) || /^choose the correct answer\\s*\\(\\d+\\)\\.?$/i.test(String(row.sentence || '').replace(/^[\\u4e00-\\u9fff]{2,12}[：:]\\s*/, '').trim()) || seen.has(key)) continue;
    seen.add(key);
    try { row.options = JSON.parse(row.options); } catch (_) { row.options = []; }
    if (!Array.isArray(row.options) || row.options.length < 2 || !row.options.includes(row.answer)) continue;
    row.translation = row.translation || translateGrammarSentence(row);
    result.push(row);
    if (result.length >= count) break;
  }
  return result;
}

router.get('/list', async (req, res) => {
  try {
    const { level, grammar_id, count = 20 } = req.query;
    const limit = Math.max(1, Math.min(100, Number(count) || 20));
    let sql = 'SELECT * FROM grammar_questions WHERE 1=1';
    const params = [];
    if (level !== undefined && level !== '') { sql += ' AND level = ?'; params.push(Number(level)); }
    if (grammar_id !== undefined && grammar_id !== '') { sql += ' AND grammar_id = ?'; params.push(Number(grammar_id)); }
    sql += ' ORDER BY sort_order ASC, id ASC';
    const rows = await db.prepare(sql).all(...params);
    res.json({ code: 0, data: parseAndDedupe(rows, limit) });
  } catch (err) {
    console.error('获取语法题失败:', err);
    res.json({ code: -1, message: '获取失败' });
  }
});

router.get('/random', async (req, res) => {
  try {
    const { level, grammar_id, count = 10 } = req.query;
    const limit = Math.max(1, Math.min(100, Number(count) || 10));
    let sql = 'SELECT * FROM grammar_questions WHERE 1=1';
    const params = [];
    if (level !== undefined && level !== '') { sql += ' AND level = ?'; params.push(Number(level)); }
    if (grammar_id !== undefined && grammar_id !== '') { sql += ' AND grammar_id = ?'; params.push(Number(grammar_id)); }
    sql += ' ORDER BY RAND()';
    const rows = await db.prepare(sql).all(...params);
    res.json({ code: 0, data: parseAndDedupe(rows, limit) });
  } catch (err) {
    console.error('随机获取语法题失败:', err);
    res.json({ code: -1, message: '获取失败' });
  }
});

router.post('/progress', async (req, res) => {
  try {
    const userId = Number.parseInt(req.body.userId, 10) || 1;
    const questionId = Number(req.body.question_id);
    if (!questionId) return res.status(400).json({ code: 400, message: '题目参数无效' });
    const question = await db.prepare('SELECT id,grammar_id FROM grammar_questions WHERE id=?').get(questionId);
    if (!question) return res.status(404).json({ code: 404, message: '题目不存在' });
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    await db.prepare(`INSERT INTO grammar_question_progress (user_id,question_id,grammar_id,correct,correct_date) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE correct=1,correct_date=VALUES(correct_date),updated_at=CURRENT_TIMESTAMP`).run(userId, question.id, question.grammar_id, 1, today);
    const totalRow = await db.prepare('SELECT COUNT(DISTINCT LOWER(TRIM(sentence))) AS total FROM grammar_questions WHERE grammar_id=?').get(question.grammar_id);
    const completedRow = await db.prepare('SELECT COUNT(*) AS total FROM grammar_question_progress WHERE user_id=? AND grammar_id=? AND correct=1').get(userId, question.grammar_id);
    const total = Number(totalRow?.total || 0);
    const completed = Number(completedRow?.total || 0);
    const mastered = total >= 100 && completed >= total;
    if (mastered) {
      await db.prepare(`INSERT INTO grammar_progress (user_id,grammar_id,status,score,attempts,total_questions,correct_answers,last_score,mastered,last_practice_date) VALUES (?,?, '已掌握',100,1,?,?,100,1,?) ON DUPLICATE KEY UPDATE status='已掌握',score=100,total_questions=GREATEST(total_questions,VALUES(total_questions)),correct_answers=GREATEST(correct_answers,VALUES(correct_answers)),last_score=100,mastered=1,last_practice_date=VALUES(last_practice_date),updated_at=CURRENT_TIMESTAMP`).run(userId, question.grammar_id, total, total, today);
      const masteredRow = await db.prepare('SELECT COUNT(*) AS total FROM grammar_progress WHERE user_id=? AND mastered=1').get(userId);
      await db.prepare('UPDATE learning_stats SET total_grammar_mastered=? WHERE user_id=?').run(Number(masteredRow?.total || 0), userId);
    }
    res.json({ code: 0, data: { grammarId: question.grammar_id, completed, total, remaining: Math.max(0,total-completed), mastered } });
  } catch (error) {
    console.error('保存语法逐题进度失败:', error);
    res.status(500).json({ code: 500, message: '保存失败' });
  }
});
module.exports = router;