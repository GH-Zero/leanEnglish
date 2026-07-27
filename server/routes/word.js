const express = require('express');
const router = express.Router();
const { db } = require('../db');

const MODE_COLUMNS = {
  listen: 'listen_done',
  read: 'read_done',
  write: 'write_done',
  speak: 'speak_done'
};

function getMode(req) {
  const mode = String(req.body.mode || '');
  return MODE_COLUMNS[mode] ? mode : null;
}

async function updateLearningStats(userId, isCorrect) {
  const stats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
  if (!stats) return;
  const totalPractice = stats.total_practice_count + 1;
  const correctCount = stats.correct_count + (isCorrect ? 1 : 0);
  const accuracy = totalPractice ? Math.round(correctCount * 100 / totalPractice) : 0;
  const learned = await db.prepare('SELECT COUNT(*) AS count FROM word_status WHERE user_id = ?').get(userId);
  await db.prepare(`
    UPDATE learning_stats
    SET total_words_learned = ?, correct_count = ?, total_practice_count = ?, accuracy = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(Number(learned?.count || 0), correctCount, totalPractice, accuracy, userId);
}

// 获取用户单词状态及四个模块的完成情况
router.get('/status', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10) || 1;
    const rows = await db.prepare('SELECT * FROM word_status WHERE user_id = ?').all(userId);
    const status = {};
    rows.forEach((item) => {
      const modes = {
        listen: item.listen_done === 1,
        read: item.read_done === 1,
        write: item.write_done === 1,
        speak: item.speak_done === 1
      };
      status[item.word] = {
        repetition: item.repetition,
        next_review_date: item.next_review_date,
        last_review_date: item.last_review_date,
        mastered: item.mastered === 1,
        modes,
        completed_modes: Object.values(modes).filter(Boolean).length
      };
    });
    res.json({ code: 0, data: status });
  } catch (error) {
    console.error('获取单词状态失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 某模块答对：只有四个模块全部完成时才标记为已掌握
router.post('/status/known', async (req, res) => {
  try {
    const userId = parseInt(req.body.userId, 10) || 1;
    const { word } = req.body;
    const mode = getMode(req);
    if (!word || !mode) return res.status(400).json({ code: 400, message: '缺少单词或学习模块参数' });

    const today = new Date().toISOString().split('T')[0];
    const column = MODE_COLUMNS[mode];
    const existing = await db.prepare('SELECT * FROM word_status WHERE user_id = ? AND word = ?').get(userId, word);
    let completed = { listen: false, read: false, write: false, speak: false };
    if (existing) {
      completed = {
        listen: existing.listen_done === 1,
        read: existing.read_done === 1,
        write: existing.write_done === 1,
        speak: existing.speak_done === 1
      };
    }
    completed[mode] = true;
    const mastered = Object.values(completed).every(Boolean) ? 1 : 0;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (mastered ? 7 : 1));

    if (existing) {
      await db.prepare(`
        UPDATE word_status
        SET ${column} = 1, wrong_mode = CASE WHEN wrong_mode = ? THEN NULL ELSE wrong_mode END, repetition = GREATEST(repetition, 1), mastered = ?, next_review_date = ?, last_review_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND word = ?
      `).run(mode, mastered, nextDate.toISOString().split('T')[0], today, userId, word);
    } else {
      await db.prepare(`
        INSERT INTO word_status (user_id, word, repetition, \`interval\`, next_review_date, last_review_date, mastered, listen_done, read_done, write_done, speak_done, wrong_mode)
        VALUES (?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).run(userId, word, nextDate.toISOString().split('T')[0], today, mastered, completed.listen ? 1 : 0, completed.read ? 1 : 0, completed.write ? 1 : 0, completed.speak ? 1 : 0);
    }

    await updateLearningStats(userId, true);
    res.json({ code: 0, data: { mastered, completedModes: Object.values(completed).filter(Boolean).length }, message: mastered ? '四项学习已完成' : '本模块已完成' });
  } catch (error) {
    console.error('更新单词模块状态失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 某模块答错：该模块重新待完成，并进入错题本
router.post('/status/unknown', async (req, res) => {
  try {
    const userId = parseInt(req.body.userId, 10) || 1;
    const { word } = req.body;
    const mode = getMode(req);
    if (!word || !mode) return res.status(400).json({ code: 400, message: '缺少单词或学习模块参数' });

    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    const column = MODE_COLUMNS[mode];
    const existing = await db.prepare('SELECT * FROM word_status WHERE user_id = ? AND word = ?').get(userId, word);
    if (existing) {
      await db.prepare(`
        UPDATE word_status
        SET ${column} = 0, wrong_mode = ?, repetition = 0, mastered = 0, next_review_date = ?, last_review_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND word = ?
      `).run(mode, nextDate.toISOString().split('T')[0], today, userId, word);
    } else {
      await db.prepare(`
        INSERT INTO word_status (user_id, word, repetition, \`interval\`, next_review_date, last_review_date, mastered, listen_done, read_done, write_done, speak_done, wrong_mode)
        VALUES (?, ?, 0, 1, ?, ?, 0, 0, 0, 0, 0, ?)
      `).run(userId, word, nextDate.toISOString().split('T')[0], today, mode);
    }
    await updateLearningStats(userId, false);
    res.json({ code: 0, message: '已加入错题本' });
  } catch (error) {
    console.error('更新单词模块状态失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;


