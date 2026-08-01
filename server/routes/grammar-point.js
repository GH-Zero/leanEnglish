const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { translateGrammarSentence, cleanSource } = require('../utils/grammar-translation');

function parseJson(value, fallback = []) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : fallback; }
  catch (_) { return fallback; }
}

function normalizeSentence(value) {
  return cleanSource(value).toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '');
}

function isPlaceholder(value) {
  const text = cleanSource(value);
  return !text || /^choose the correct answer\s*\(\d+\)\.?$/i.test(text) || /^(question|practice|example)\s*\d+\.?$/i.test(text);
}

function buildExamples(savedExamples, questions = [], limit = 6) {
  const candidates = [
    ...(Array.isArray(savedExamples) ? savedExamples : []),
    ...questions.map(question => cleanSource(question.sentence).replace('___', (question.answer === '/' || question.answer === '∅') ? '' : (question.answer || '')))
  ];
  const seen = new Set();
  const result = [];
  for (const candidate of candidates) {
    const text = cleanSource(typeof candidate === 'string' ? candidate : candidate?.sentence);
    const key = normalizeSentence(text);
    if (isPlaceholder(text) || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function parseQuestions(rows) {
  const unique = [];
  const seen = new Set();
  for (const question of rows) {
    question.options = parseJson(question.options);
    const semantic = cleanSource(question.sentence);
    const key = semantic.toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '');
    if (isPlaceholder(semantic) || !key || seen.has(key) || question.options.length < 2 || !question.options.includes(question.answer)) continue;
    seen.add(key);
    question.translation = question.translation || translateGrammarSentence(question);
    if (/[A-Za-z]{2,}/.test(String(question.translation || ''))) question.translation = '';
    unique.push(question);
  }
  return unique;
}

router.get('/list', async (req, res) => {
  try {
    const { stage } = req.query;
    let sql = 'SELECT * FROM grammar_points';
    const params = [];
    if (stage !== undefined && stage !== '') { sql += ' WHERE stage = ?'; params.push(Number(stage)); }
    sql += ' ORDER BY sort_order ASC';
    const points = await db.prepare(sql).all(...params);
    points.forEach(point => { point.examples = buildExamples(parseJson(point.examples)); });
    res.json({ code: 0, data: points });
  } catch (error) {
    console.error('获取语法知识点失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

router.get('/stage/:stage', async (req, res) => {
  try {
    const stage = Number(req.params.stage);
    if (![1, 2, 3].includes(stage)) return res.status(400).json({ code: 400, message: '阶段参数无效' });
    const rows = await db.prepare(`SELECT q.*, p.title AS grammar_title FROM grammar_questions q INNER JOIN grammar_points p ON p.id=q.grammar_id WHERE p.stage=? ORDER BY p.sort_order,q.sort_order,q.id`).all(stage);
    const questions = parseQuestions(rows);
    const names = ['', '基础句型', '核心语法', '进阶语法'];
    res.json({ code: 0, data: { id: 0, stage, title: `${names[stage]}综合练习`, description: `从本阶段题库中依次练习，答对的题在本轮不再出现。`, explanation: '覆盖本阶段全部语法知识点，完成整轮后开启新一轮。', examples: [], questions, questionCount: questions.length } });
  } catch (error) {
    console.error('获取阶段练习失败:', error);
    res.status(500).json({ code: 500, message: '获取阶段练习失败' });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const point = await db.prepare('SELECT * FROM grammar_points WHERE id=?').get(req.params.id);
    if (!point) return res.status(404).json({ code: 404, message: '知识点不存在' });
    const savedExamples = parseJson(point.examples);
    const rows = await db.prepare('SELECT * FROM grammar_questions WHERE grammar_id=? ORDER BY sort_order,id').all(req.params.id);
    const questions = parseQuestions(rows);
    point.examples = buildExamples(savedExamples, questions);

    const userId = Number.parseInt(req.query.userId, 10) || 1;
    const completedRows = await db.prepare('SELECT question_id FROM grammar_question_progress WHERE user_id=? AND grammar_id=? AND correct=1').all(userId, req.params.id);
    let completedIds = new Set(completedRows.map(row => Number(row.question_id)));
    let cycleReset = false;
    if (questions.length >= 100 && completedIds.size >= questions.length) {
      await db.prepare('DELETE FROM grammar_question_progress WHERE user_id=? AND grammar_id=?').run(userId, req.params.id);
      completedIds = new Set();
      cycleReset = true;
    }
    point.questionCount = questions.length;
    point.completedCount = completedIds.size;
    point.remainingCount = questions.length - completedIds.size;
    point.cycleReset = cycleReset;
    point.questions = questions.filter(question => !completedIds.has(Number(question.id)));
    res.json({ code: 0, data: point });
  } catch (error) {
    console.error('获取语法知识点详情失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

module.exports = router;