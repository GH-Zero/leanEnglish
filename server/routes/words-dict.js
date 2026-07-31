const express = require('express');
const router = express.Router();
const { db } = require('../db');

const DAILY_CATEGORIES = ['名词', '动词', '形容词', '副词', '功能词', '其他'];
const TOTAL_WORDS = 36000;
const CATEGORY_COUNTS = {
  名词: 19996,
  动词: 3566,
  形容词: 7780,
  副词: 1737,
  功能词: 212,
  其他: 2709
};
const LEVEL_COUNTS = { 0: 5811, 1: 12076, 2: 18113 };
const CATEGORY_DESCRIPTIONS = {
  名词: '人物、事物、地点与抽象概念',
  动词: '动作、行为与状态变化',
  形容词: '描述性质、状态与特征',
  副词: '修饰动作、程度、时间与方式',
  功能词: '介词、连词、代词与数词',
  其他: '常用短语、缩写与补充词汇'
};

function chinaDate(dateValue) {
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function categoryForDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  const index = ((dayNumber % DAILY_CATEGORIES.length) + DAILY_CATEGORIES.length) % DAILY_CATEGORIES.length;
  return {
    category: DAILY_CATEGORIES[index],
    nextCategory: DAILY_CATEGORIES[(index + 1) % DAILY_CATEGORIES.length],
    index
  };
}

function safeLimit(value, fallback = 20) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 100);
}

// 获取单词列表（分页 + 筛选）
router.get('/list', async (req, res) => {
  try {
    const { level, page = 1, pageSize = 20, tag, category, keyword } = req.query;
    const safePage = Math.max(Number(page) || 1, 1);
    const safePageSize = safeLimit(pageSize);
    const offset = (safePage - 1) * safePageSize;
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
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (keyword && String(keyword).trim()) {
      const search = '%' + String(keyword).trim() + '%';
      sql += ' AND (word LIKE ? OR chinese LIKE ?)';
      params.push(search, search);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS total');
    const { total } = await db.prepare(countSql).get(...params);
    sql += ' ORDER BY sort_order ASC LIMIT ? OFFSET ?';
    const words = await db.prepare(sql).all(...params, safePageSize, offset);

    res.json({
      code: 0,
      data: {
        list: words,
        total,
        page: safePage,
        pageSize: safePageSize,
        pages: Math.ceil(total / safePageSize)
      }
    });
  } catch (error) {
    console.error('获取单词列表失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

// 每日闯关：优先返回用户已经学习过的单词，不足时再用词库补齐
router.get('/challenge', async (req, res) => {
  try {
    const userId = Number.parseInt(req.query.userId, 10) || 1;
    const count = safeLimit(req.query.count, 20);
    const words = await db.prepare(`
      SELECT w.* FROM words w
      LEFT JOIN word_status ws ON ws.word = w.word AND ws.user_id = ?
      ORDER BY CASE WHEN ws.id IS NULL THEN 1 ELSE 0 END, RAND()
      LIMIT ?
    `).all(userId, count);
    const learnedCount = words.filter(word => word.id).length;
    res.json({ code: 0, data: words, meta: { preferredLearned: true, count: learnedCount } });
  } catch (error) {
    console.error('获取闯关单词失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});
// 随机获取单词
router.get('/random', async (req, res) => {
  try {
    const { level, category } = req.query;
    const count = safeLimit(req.query.count);
    let sql = 'SELECT * FROM words WHERE 1=1';
    const params = [];
    if (level !== undefined) {
      sql += ' AND level = ?';
      params.push(Number(level));
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
   sql += ' ORDER BY RAND() LIMIT ?';
    const words = await db.prepare(sql).all(...params, count);
    res.json({ code: 0, data: words });
  } catch (error) {
    console.error('随机获取单词失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

// 每日学习：每天固定轮换一个单词类型
router.get('/daily', async (req, res) => {
  try {
    const userId = Number.parseInt(req.query.userId, 10) || 1;
    const limit = safeLimit(req.query.limit, 10);
    const date = chinaDate(req.query.date);
    const dailyCategory = categoryForDate(date);
    const requestedCategory = req.query.category;
    const category = DAILY_CATEGORIES.includes(requestedCategory)
      ? requestedCategory
      : DAILY_CATEGORIES[0];
    const nextCategory = DAILY_CATEGORIES[
      (DAILY_CATEGORIES.indexOf(category) + 1) % DAILY_CATEGORIES.length
    ];

    const reviewWords = await db.prepare(`
      SELECT w.* FROM words w
      INNER JOIN word_status ws ON ws.word = w.word
      WHERE ws.user_id = ?
        AND ws.mastered = 0
        AND w.category = ?
      ORDER BY ws.updated_at ASC, w.sort_order ASC
      LIMIT ?
    `).all(userId, category, limit);

    const remaining = Math.max(limit - reviewWords.length, 0);
    let newWords = [];
    if (remaining > 0) {
      newWords = await db.prepare(`
        SELECT w.* FROM words w
        WHERE w.category = ?
          AND NOT EXISTS (
            SELECT 1 FROM word_status ws
            WHERE ws.user_id = ? AND ws.word = w.word
          )
        ORDER BY w.sort_order ASC
        LIMIT ?
      `).all(category, userId, remaining);
    }

    const masteredStats = await db.prepare(`
      SELECT COUNT(*) AS count FROM word_status ws
      INNER JOIN words w ON w.word = ws.word
      WHERE ws.user_id = ? AND ws.mastered = 1 AND w.category = ?
    `).get(userId, category);

    res.json({
      code: 0,
      data: {
        date,
        category,
        categoryDescription: CATEGORY_DESCRIPTIONS[category],
        nextCategory,
        words: [...reviewWords, ...newWords],
        reviewCount: reviewWords.length,
        newCount: newWords.length,
        masteredCount: masteredStats.count,
        categoryCount: CATEGORY_COUNTS[category],
        totalInDb: TOTAL_WORDS
      }
    });
  } catch (error) {
    console.error('获取每日分类单词失败:', error);
    res.status(500).json({ code: 500, message: '获取每日学习计划失败' });
  }
});

// 获取各等级和类型数量统计
router.get('/count', async (req, res) => {
  try {
    const userId = Number.parseInt(req.query.userId, 10) || 1;
    const completedRows = await db.prepare(`
      SELECT w.category, COUNT(*) AS completed
      FROM word_status ws
      INNER JOIN words w ON w.word = ws.word
      WHERE ws.user_id = ? AND ws.mastered = 1
      GROUP BY w.category
    `).all(userId);
    const completedMap = Object.fromEntries(completedRows.map((item) => [item.category, Number(item.completed)]));
    const stats = Object.entries(LEVEL_COUNTS).map(([level, count]) => ({ level: Number(level), count }));
    const categories = DAILY_CATEGORIES.map((category) => {
      const count = CATEGORY_COUNTS[category];
      const completed = completedMap[category] || 0;
      return { category, count, completed, progress: count ? Number((completed * 100 / count).toFixed(2)) : 0 };
    });
    res.json({ code: 0, data: { stats, categories, total: TOTAL_WORDS } });
  } catch (error) {
    console.error('获取词类进度失败:', error);
    res.status(500).json({ code: 500, message: '获取词类进度失败' });
  }
});
// 获取单词详情
router.get('/detail/:id', async (req, res) => {
  try {
    const word = await db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id);
    if (!word) return res.status(404).json({ code: 404, message: '单词不存在' });
    res.json({ code: 0, data: word });
  } catch (error) {
    console.error('获取单词详情失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

// 兼容原有按等级获取未学习单词接口
router.get('/unlearned', async (req, res) => {
  try {
    const userId = Number.parseInt(req.query.userId, 10) || 1;
    const level = Number.parseInt(req.query.level, 10);
    const limit = safeLimit(req.query.limit);
    const levelFilter = Number.isNaN(level) ? '' : 'AND w.level = ?';
    const levelParams = Number.isNaN(level) ? [] : [level];
    const date = chinaDate();

    const reviewWords = await db.prepare(`
      SELECT w.* FROM words w
      INNER JOIN word_status ws ON w.word = ws.word
      WHERE ws.user_id = ? AND ws.mastered = 0
        AND ws.next_review_date <= ? ${levelFilter}
      ORDER BY ws.next_review_date ASC
      LIMIT ?
    `).all(userId, date, ...levelParams, limit);

    const remaining = Math.max(limit - reviewWords.length, 0);
    let newWords = [];
    if (remaining > 0) {
      newWords = await db.prepare(`
        SELECT w.* FROM words w
        WHERE NOT EXISTS (
          SELECT 1 FROM word_status ws WHERE ws.user_id = ? AND ws.word = w.word
        ) ${levelFilter}
        ORDER BY w.sort_order ASC
        LIMIT ?
      `).all(userId, ...levelParams, remaining);
    }

    const mastered = await db.prepare('SELECT COUNT(*) AS count FROM word_status WHERE user_id = ? AND mastered = 1').get(userId);
    const totalInDb = Number.isNaN(level) ? TOTAL_WORDS : (LEVEL_COUNTS[level] || 0);

    res.json({
      code: 0,
      data: {
        words: [...reviewWords, ...newWords],
        reviewCount: reviewWords.length,
        newCount: newWords.length,
        masteredCount: mastered.count,
        totalInDb
      }
    });
  } catch (error) {
    console.error('获取未学习单词失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

// 获取错题本：按单词和错误模式独立记录，可累计错误次数
router.get('/wrong', async (req, res) => {
  try {
    const userId = Number.parseInt(req.query.userId, 10) || 1;
    const limit = safeLimit(req.query.limit, 50);
    const category = DAILY_CATEGORIES.includes(req.query.category) ? req.query.category : null;
    const validModes = ['listen', 'read', 'write', 'speak'];
    const mode = validModes.includes(req.query.mode) ? req.query.mode : null;
    const filters = ['wr.user_id = ?', 'wr.active = 1'];
    const params = [userId];
    if (category) { filters.push('w.category = ?'); params.push(category); }
    if (mode) { filters.push('wr.mode = ?'); params.push(mode); }
    const where = filters.join(' AND ');
    const words = await db.prepare(`
      SELECT w.*, wr.mode AS wrong_mode, wr.error_count, wr.first_error_date, wr.last_error_date
      FROM word_wrong_records wr
      INNER JOIN words w ON w.word = wr.word
      WHERE ${where}
      ORDER BY wr.last_error_date DESC, wr.updated_at DESC, w.sort_order ASC
      LIMIT ?
    `).all(...params, limit);
    const totalRow = await db.prepare(`
      SELECT COUNT(*) AS total FROM word_wrong_records wr
      INNER JOIN words w ON w.word = wr.word WHERE ${where}
    `).get(...params);
    const modeRows = await db.prepare(`
      SELECT wr.mode, COUNT(*) AS count FROM word_wrong_records wr
      INNER JOIN words w ON w.word = wr.word
      WHERE wr.user_id = ? AND wr.active = 1 ${category ? 'AND w.category = ?' : ''}
      GROUP BY wr.mode
    `).all(...(category ? [userId, category] : [userId]));
    const byMode = { listen: 0, read: 0, write: 0, speak: 0 };
    modeRows.forEach(row => { if (row.mode in byMode) byMode[row.mode] = Number(row.count || 0); });
    res.json({ code: 0, data: { words, total: Number(totalRow?.total || 0), byMode } });
  } catch (error) {
    console.error('获取错题本失败:', error);
    res.status(500).json({ code: 500, message: '获取错题本失败' });
  }
});

router.get('/categories', (req, res) => {
  const categories = DAILY_CATEGORIES.map((category) => ({
    category,
    count: CATEGORY_COUNTS[category],
    description: CATEGORY_DESCRIPTIONS[category]
  }));
  res.json({ code: 0, data: categories });
});

router.get('/tags', async (req, res) => {
  try {
    const tags = await db.prepare('SELECT DISTINCT tag FROM words ORDER BY tag').all();
    res.json({ code: 0, data: tags.map((item) => item.tag) });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

module.exports = router;








