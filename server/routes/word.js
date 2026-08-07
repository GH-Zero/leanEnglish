const express = require('express');
const router = express.Router();
const { db } = require('../db');
const ach = require('../utils/achievements');
function chinaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

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
    const rows = await db.prepare('SELECT ws.*, w.category, w.level FROM word_status ws LEFT JOIN words w ON w.word = ws.word WHERE ws.user_id = ?').all(userId);
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
        updated_at: item.updated_at,
        category: item.category || '',
        level: Number(item.level || 0),
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

    const today = chinaDate();
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
      `).run(mode, mastered, chinaDate(nextDate), today, userId, word);
    } else {
      await db.prepare(`
        INSERT INTO word_status (user_id, word, repetition, \`interval\`, next_review_date, last_review_date, mastered, listen_done, read_done, write_done, speak_done, wrong_mode)
        VALUES (?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).run(userId, word, chinaDate(nextDate), today, mastered, completed.listen ? 1 : 0, completed.read ? 1 : 0, completed.write ? 1 : 0, completed.speak ? 1 : 0);
    }
    await db.prepare('UPDATE word_wrong_records SET active = 0, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND word = ? AND mode = ?').run(userId, word, mode);
    await updateLearningStats(userId, true);
    await ach.maybeUnlockWrongTerminator(userId);
    await ach.maybeUnlockMorningScholar(userId);
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

    const today = chinaDate();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    const column = MODE_COLUMNS[mode];
    const existing = await db.prepare('SELECT * FROM word_status WHERE user_id = ? AND word = ?').get(userId, word);
    if (existing) {
      await db.prepare(`
        UPDATE word_status
        SET ${column} = 0, wrong_mode = ?, repetition = 0, mastered = 0, next_review_date = ?, last_review_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND word = ?
      `).run(mode, chinaDate(nextDate), today, userId, word);
    } else {
      await db.prepare(`
        INSERT INTO word_status (user_id, word, repetition, \`interval\`, next_review_date, last_review_date, mastered, listen_done, read_done, write_done, speak_done, wrong_mode)
        VALUES (?, ?, 0, 1, ?, ?, 0, 0, 0, 0, 0, ?)
      `).run(userId, word, chinaDate(nextDate), today, mode);
    }
    await db.prepare(`
      INSERT INTO word_wrong_records (user_id, word, mode, error_count, active, first_error_date, last_error_date, resolved_at)
      VALUES (?, ?, ?, 1, 1, ?, ?, NULL)
      ON DUPLICATE KEY UPDATE error_count = error_count + 1, active = 1, last_error_date = VALUES(last_error_date), resolved_at = NULL, updated_at = CURRENT_TIMESTAMP
    `).run(userId, word, mode, today, today);
    await updateLearningStats(userId, false);
    await ach.maybeUnlockMorningScholar(userId);
    res.json({ code: 0, message: '已加入错题本' });
  } catch (error) {
    console.error('更新单词模块状态失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 从错题本/生词本移除，但保留该词的历史学习记录
router.post('/status/clear-wrong', async (req, res) => {
  try {
    const userId = Number.parseInt(req.body.userId, 10) || 1;
    const word = String(req.body.word || '').trim();
    const mode = String(req.body.mode || '').trim();
    if (!word) return res.status(400).json({ code: 400, message: '缺少单词参数' });
    if (mode && !MODE_COLUMNS[mode]) return res.status(400).json({ code: 400, message: '错误类型无效' });
    if (mode) {
      await db.prepare('UPDATE word_wrong_records SET active = 0, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND word = ? AND mode = ?').run(userId, word, mode);
    } else {
      await db.prepare('UPDATE word_wrong_records SET active = 0, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND word = ?').run(userId, word);
    }
    await db.prepare('UPDATE word_status SET wrong_mode = NULL, repetition = GREATEST(repetition, 1), updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND word = ?').run(userId, word);
    res.json({ code: 0, data: true, message: '已移除' });
  } catch (error) {
    console.error('移除错题失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});
module.exports = router;


