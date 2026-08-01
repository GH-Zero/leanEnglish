const mysql = require('mysql2/promise');

const databaseName = process.env.DB_NAME || 'english_learning';
if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error('DB_NAME 只能包含字母、数字和下划线');
}

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin123',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

const adminPool = mysql.createPool({
  ...connectionConfig,
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0
});

const pool = mysql.createPool({
  ...connectionConfig,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) UNIQUE NOT NULL,
    nickname VARCHAR(100) DEFAULT '英语学习者',
    avatar VARCHAR(500) DEFAULT '/static/logo.png',
    level INT DEFAULT 0,
    goal INT DEFAULT 0,
    study_duration INT DEFAULT 30,
    focus INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS learning_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    total_words_learned INT DEFAULT 0,
    total_grammar_mastered INT DEFAULT 0,
    total_phonetic_mastered INT DEFAULT 0,
    total_speak_practice INT DEFAULT 0,
    total_study_minutes INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    max_streak_days INT DEFAULT 0,
    last_study_date DATE,
    accuracy DECIMAL(5,2) DEFAULT 0,
    total_practice_count INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_learning_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS streak_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    last_study_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_streak_data_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS daily_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    words_learned INT DEFAULT 0,
    words_reviewed INT DEFAULT 0,
    grammar_practiced INT DEFAULT 0,
    phonetic_practiced INT DEFAULT 0,
    speak_practiced INT DEFAULT 0,
    study_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, date),
    CONSTRAINT fk_daily_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS word_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    word VARCHAR(100) NOT NULL,
    ease_factor DECIMAL(3,1) DEFAULT 2.5,
    \`interval\` INT DEFAULT 1,
    repetition INT DEFAULT 0,
    next_review_date DATE,
    last_review_date DATE,
    mastered TINYINT(1) DEFAULT 0,
    listen_done TINYINT(1) DEFAULT 0,
    read_done TINYINT(1) DEFAULT 0,
    write_done TINYINT(1) DEFAULT 0,
    speak_done TINYINT(1) DEFAULT 0,
    wrong_mode VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_word (user_id, word),
    CONSTRAINT fk_word_status_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS word_wrong_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    word VARCHAR(100) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    error_count INT DEFAULT 1,
    active TINYINT(1) DEFAULT 1,
    first_error_date DATE NOT NULL,
    last_error_date DATE NOT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_word_mode (user_id, word, mode),
    INDEX idx_wrong_user_active_mode (user_id, active, mode),
    CONSTRAINT fk_wrong_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,  `CREATE TABLE IF NOT EXISTS grammar_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    grammar_id INT NOT NULL,
    status VARCHAR(20) DEFAULT '未学习',
    score INT DEFAULT 0,
    last_practice_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_grammar (user_id, grammar_id),
    CONSTRAINT fk_grammar_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS phonetic_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    phonetic_id VARCHAR(50) NOT NULL,
    best_score INT DEFAULT 0,
    attempts INT DEFAULT 0,
    mastered TINYINT(1) DEFAULT 0,
    last_practice_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_phonetic (user_id, phonetic_id),
    CONSTRAINT fk_phonetic_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS dialogue_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    scene_name VARCHAR(100),
    scene_icon VARCHAR(50),
    messages JSON,
    average_score INT DEFAULT 0,
    duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dialogue_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS learning_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    daily_new_words INT DEFAULT 20,
    daily_review_words INT DEFAULT 50,
    daily_grammar_questions INT DEFAULT 10,
    difficulty INT DEFAULT 0,
    accent INT DEFAULT 0,
    auto_play TINYINT(1) DEFAULT 1,
    dark_mode TINYINT(1) DEFAULT 0,
    font_size INT DEFAULT 1,
    daily_reminder TINYINT(1) DEFAULT 1,
    reminder_time VARCHAR(10) DEFAULT '08:00',
    reminder_content INT DEFAULT 0,
    word_reminder TINYINT(1) DEFAULT 1,
    progress_reminder TINYINT(1) DEFAULT 1,
    achievement_reminder TINYINT(1) DEFAULT 1,
    do_not_disturb TINYINT(1) DEFAULT 1,
    dnd_start VARCHAR(10) DEFAULT '22:00',
    dnd_end VARCHAR(10) DEFAULT '07:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_learning_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS words (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(100) UNIQUE NOT NULL,
    phonetic_us VARCHAR(100),
    phonetic_uk VARCHAR(100),
    chinese TEXT,
    example TEXT,
    level INT DEFAULT 0,
    tag VARCHAR(50) DEFAULT '通用',
    category VARCHAR(30) DEFAULT '其他',
    frequency_rank INT NULL,
    source VARCHAR(30) DEFAULT 'manual',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_words_category_level_sort (category, level, sort_order),
    INDEX idx_words_category_sort (category, sort_order),
    INDEX idx_words_frequency_rank (frequency_rank)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS dialogue_scenes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    icon VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    initial_prompt TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS shadow_sentences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    text TEXT NOT NULL,
    chinese TEXT,
    level INT DEFAULT 0,
    tag VARCHAR(50) DEFAULT '通用',
    category VARCHAR(30) DEFAULT '其他',
    frequency_rank INT NULL,
    source VARCHAR(30) DEFAULT 'manual',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_words_category_level_sort (category, level, sort_order),
    INDEX idx_words_category_sort (category, sort_order),
    INDEX idx_words_frequency_rank (frequency_rank)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS grammar_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    grammar_id INT,
    sentence TEXT NOT NULL,
    answer TEXT NOT NULL,
    options TEXT NOT NULL,
    explanation TEXT,
    level INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS phonetics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    example VARCHAR(100),
    chinese VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS grammar_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    stage INT DEFAULT 1,
    explanation TEXT,
    examples TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

async function ensureLearningSettingsSchema() {
  const [columns] = await pool.query('SHOW COLUMNS FROM learning_settings');
  if (!columns.some((column) => column.Field === 'daily_grammar_questions')) {
    await pool.query('ALTER TABLE learning_settings ADD COLUMN daily_grammar_questions INT DEFAULT 10 AFTER daily_review_words');
  }
}

async function ensureWordSchema() {
  const [columns] = await pool.query('SHOW COLUMNS FROM words');
  const columnNames = new Set(columns.map((column) => column.Field));
  if (!columnNames.has('category')) {
    await pool.query("ALTER TABLE words ADD COLUMN category VARCHAR(30) DEFAULT '其他' AFTER tag");
  }
  if (!columnNames.has('frequency_rank')) {
    await pool.query('ALTER TABLE words ADD COLUMN frequency_rank INT NULL AFTER category');
  }
  if (!columnNames.has('source')) {
    await pool.query("ALTER TABLE words ADD COLUMN source VARCHAR(30) DEFAULT 'manual' AFTER frequency_rank");
  }
  const [indexes] = await pool.query('SHOW INDEX FROM words');
  const indexNames = new Set(indexes.map((index) => index.Key_name));
  if (!indexNames.has('idx_words_category_level_sort')) {
    await pool.query('ALTER TABLE words ADD INDEX idx_words_category_level_sort (category, level, sort_order)');
  }
  if (!indexNames.has('idx_words_category_sort')) {
    await pool.query('ALTER TABLE words ADD INDEX idx_words_category_sort (category, sort_order)');
  }
  if (!indexNames.has('idx_words_frequency_rank')) {
    await pool.query('ALTER TABLE words ADD INDEX idx_words_frequency_rank (frequency_rank)');
  }
}
async function ensureAdventureSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS adventure_levels (id INT PRIMARY KEY AUTO_INCREMENT,chapter_no INT NOT NULL DEFAULT 1,level_no INT UNIQUE NOT NULL,title VARCHAR(100) NOT NULL,subtitle VARCHAR(200),icon VARCHAR(20) DEFAULT '🗺️',difficulty INT DEFAULT 1,pass_score INT DEFAULT 80,is_boss TINYINT(1) DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS user_adventure_progress (id INT PRIMARY KEY AUTO_INCREMENT,user_id INT NOT NULL,level_id INT NOT NULL,status VARCHAR(20) DEFAULT 'not_started',best_score INT DEFAULT 0,stars INT DEFAULT 0,attempts INT DEFAULT 0,passed_at TIMESTAMP NULL,last_attempt_at TIMESTAMP NULL,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,UNIQUE KEY unique_user_level(user_id,level_id),INDEX idx_adventure_user_status(user_id,status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS adventure_wrong_records (id INT PRIMARY KEY AUTO_INCREMENT,user_id INT NOT NULL,level_id INT NOT NULL,question_key VARCHAR(100),question_type VARCHAR(30),prompt TEXT,user_answer TEXT,correct_answer TEXT,explanation TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX idx_adventure_wrong_user_level(user_id,level_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const levels=[
    [1,'基础问候','认识常用问候与简单句','👋',1,80,0],[2,'自我介绍','姓名、身份与主系表','🙂',1,80,0],[3,'家庭成员','家庭词汇与物主表达','🏠',1,80,0],[4,'阶段检测','复习前三关核心内容','🧭',1,80,0],[5,'每日活动','高频动作与一般现在时','☀️',2,80,0],[6,'时间表达','时间、日期与常用介词','🕐',2,80,0],[7,'食物饮料','餐饮词汇与数量表达','🍎',2,80,0],[8,'餐厅交流','点餐表达与听力辨义','🍽️',2,80,0],[9,'综合练习','混合检验本章知识','📝',2,80,0],[10,'启程挑战','第一章综合 Boss 关','🏆',3,85,1]
  ];
  for(const item of levels)await pool.query(`INSERT INTO adventure_levels(chapter_no,level_no,title,subtitle,icon,difficulty,pass_score,is_boss) VALUES (1,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),subtitle=VALUES(subtitle),icon=VALUES(icon),difficulty=VALUES(difficulty),pass_score=VALUES(pass_score),is_boss=VALUES(is_boss)`,item);
}
async function ensureShadowSentenceSchema() {
  const [columns] = await pool.query('SHOW COLUMNS FROM shadow_sentences');
  const names = new Set(columns.map(column => column.Field));
  if (!names.has('category')) await pool.query("ALTER TABLE shadow_sentences ADD COLUMN category VARCHAR(30) DEFAULT '其他' AFTER tag");
  if (!names.has('frequency_rank')) await pool.query('ALTER TABLE shadow_sentences ADD COLUMN frequency_rank INT NULL AFTER category');
  if (!names.has('source')) await pool.query("ALTER TABLE shadow_sentences ADD COLUMN source VARCHAR(30) DEFAULT 'manual' AFTER frequency_rank");
}
async function ensureShadowSentenceBank() {
  const { buildShadowSentenceBank } = require('./shadow-sentence-bank');
  const bank = buildShadowSentenceBank();
  const normalized = new Set();
  for (const item of bank) {
    const key = String(item.text || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key || !String(item.chinese || '').trim() || normalized.has(key)) throw new Error('跟读题库存在空内容或重复句子');
    normalized.add(key);
  }
  if (bank.length !== 600) throw new Error(`跟读题库数量异常：${bank.length}`);
  await pool.query(`DELETE duplicate FROM shadow_sentences duplicate INNER JOIN shadow_sentences original ON LOWER(TRIM(duplicate.text)) = LOWER(TRIM(original.text)) AND duplicate.id > original.id`);
  const [indexes] = await pool.query('SHOW INDEX FROM shadow_sentences');
  if (!indexes.some(index => index.Key_name === 'unique_shadow_text')) await pool.query('ALTER TABLE shadow_sentences ADD UNIQUE INDEX unique_shadow_text (text(255))');
  for (let offset = 0; offset < bank.length; offset += 100) {
    const batch = bank.slice(offset, offset + 100);
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?)').join(',');
    const values = batch.flatMap((item, index) => [item.text, item.chinese, item.level, item.tag, item.category, item.source, 1000 + offset + index]);
    await pool.query(`INSERT INTO shadow_sentences (text,chinese,level,tag,category,source,sort_order) VALUES ${placeholders} ON DUPLICATE KEY UPDATE chinese=VALUES(chinese),level=VALUES(level),tag=VALUES(tag),category=VALUES(category),source=VALUES(source)`, values);
  }
}
async function ensureWordStatusSchema() {
  const [columns] = await pool.query('SHOW COLUMNS FROM word_status');
  const columnNames = new Set(columns.map((column) => column.Field));
  const modeColumns = [
    ['listen_done', 'TINYINT(1) DEFAULT 0'],
    ['read_done', 'TINYINT(1) DEFAULT 0'],
    ['write_done', 'TINYINT(1) DEFAULT 0'],
    ['speak_done', 'TINYINT(1) DEFAULT 0'],
    ['wrong_mode', 'VARCHAR(20) NULL']
  ];
  for (const [name, definition] of modeColumns) {
    if (!columnNames.has(name)) {
      await pool.query(`ALTER TABLE word_status ADD COLUMN ${name} ${definition} AFTER mastered`);
    }
  }
}
async function ensureGrammarQuestionProgressSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS grammar_question_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    grammar_id INT NOT NULL,
    correct TINYINT(1) DEFAULT 0,
    correct_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_question (user_id, question_id),
    INDEX idx_grammar_question_cycle (user_id, grammar_id, correct)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}
async function ensureGrammarProgressSchema() {
  const [columns] = await pool.query('SHOW COLUMNS FROM grammar_progress');
  const names = new Set(columns.map(column => column.Field));
  const additions = [
    ['attempts', 'INT DEFAULT 0'],
    ['total_questions', 'INT DEFAULT 0'],
    ['correct_answers', 'INT DEFAULT 0'],
    ['last_score', 'INT DEFAULT 0'],
    ['mastered', 'TINYINT(1) DEFAULT 0']
  ];
  for (const [name, definition] of additions) {
    if (!names.has(name)) await pool.query(`ALTER TABLE grammar_progress ADD COLUMN ${name} ${definition}`);
  }
  // 旧版“已学习”没有足够练习证据，只迁移为学习中，不直接视为掌握。
  await pool.query(`UPDATE grammar_progress SET status = '学习中' WHERE status = '已学习' AND mastered = 0`);
}
async function ensureGrammarQuestionVolume() {
  const contexts = ['基础应用：','日常表达：','课堂练习：','语境填空：','形式辨析：','综合应用：','书面表达：','口语情境：','规则检测：','进阶巩固：'];
  const [points] = await pool.query('SELECT id, stage FROM grammar_points ORDER BY id');
  for (const point of points) {
    const [rows] = await pool.query('SELECT sentence, answer, options, explanation FROM grammar_questions WHERE grammar_id=? ORDER BY sort_order,id', [point.id]);
    const seen = new Set(rows.map(row => String(row.sentence || '').trim().toLowerCase().replace(/\s+/g, ' ')));
    const seeds = rows.slice(0, Math.max(10, Math.min(rows.length, 20)));
    if (!seeds.length) continue;
    let sequence = 0;
    while (seen.size < 100 && sequence < 1000) {
      const seed = seeds[sequence % seeds.length];
      const round = Math.floor(sequence / seeds.length);
      const prefix = contexts[round % contexts.length];
      const sentence = `${prefix}${seed.sentence}`;
      const key = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
      sequence++;
      if (seen.has(key)) continue;
      await pool.query('INSERT INTO grammar_questions (grammar_id,sentence,answer,options,explanation,level,sort_order) VALUES (?,?,?,?,?,?,?)', [point.id, sentence, seed.answer, seed.options, seed.explanation, Math.max(0, Number(point.stage)-1), seen.size+1]);
      seen.add(key);
    }
  }
}
async function ensureGrammarQuestionBank() {
  const { questionBank } = require('./grammar-question-bank');
  // 旧数据曾被重复导入：保留最早一条，不影响用户学习进度和错题记录。
  await pool.query(`
    DELETE duplicate FROM grammar_questions duplicate
    INNER JOIN grammar_questions original
      ON duplicate.grammar_id = original.grammar_id
      AND LOWER(TRIM(duplicate.sentence)) = LOWER(TRIM(original.sentence))
      AND duplicate.id > original.id
  `);

  const [points] = await pool.query('SELECT id, title, stage FROM grammar_points');
  for (const point of points) {
    const additions = questionBank[point.title] || [];
    const [existingRows] = await pool.query('SELECT sentence FROM grammar_questions WHERE grammar_id = ?', [point.id]);
    const seen = new Set(existingRows.map(row => String(row.sentence || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '')));
    let sortOrder = existingRows.length + 1;
    for (const item of additions) {
      const key = String(item.sentence || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '');
      if (!key || seen.has(key)) continue;
      await pool.query(
        'INSERT INTO grammar_questions (grammar_id, sentence, answer, options, explanation, level, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [point.id, item.sentence, item.answer, JSON.stringify(item.options), item.explanation, Math.max(0, Number(point.stage || 1) - 1), sortOrder++]
      );
      seen.add(key);
    }
  }
}
async function testConnection() {
  try {
    await adminPool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('MySQL 连接失败:', error.message);
    return false;
  }
}

async function initDatabase() {
  await adminPool.query(
    `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  for (const statement of schemaStatements) {
    await pool.query(statement);
  }
  // 兼容旧版 wrong_mode：每条旧错题只迁移一次，初始错误次数为 1。
  await pool.query(`
    INSERT IGNORE INTO word_wrong_records (user_id, word, mode, error_count, active, first_error_date, last_error_date)
    SELECT user_id, word, wrong_mode, 1, 1, COALESCE(last_review_date, CURDATE()), COALESCE(last_review_date, CURDATE())
    FROM word_status WHERE wrong_mode IS NOT NULL AND wrong_mode <> ''
  `);
  await pool.query("UPDATE users SET avatar='/static/logo.png' WHERE avatar IS NULL OR avatar='' OR avatar='/static/default-avatar.png'");  await pool.query("UPDATE users SET nickname='英语学习者' WHERE nickname IS NULL OR TRIM(nickname)='' OR nickname REGEXP '^[?]+$'");  await ensureLearningSettingsSchema();
  await ensureWordSchema();
  await ensureWordStatusSchema();
  await ensureAdventureSchema();
  await ensureShadowSentenceSchema();
  await ensureShadowSentenceBank();
  await ensureGrammarQuestionProgressSchema();
  await ensureGrammarProgressSchema();
  await ensureGrammarQuestionBank();
  await ensureGrammarQuestionVolume();

  await pool.query(
    'INSERT IGNORE INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
    ['test_user_001', '英语学习者', '/static/logo.png']
  );
  const [users] = await pool.query('SELECT id FROM users WHERE openid = ?', ['test_user_001']);
  const userId = users[0].id;
  await pool.query('INSERT IGNORE INTO learning_stats (user_id) VALUES (?)', [userId]);
  await pool.query('INSERT IGNORE INTO streak_data (user_id) VALUES (?)', [userId]);
  await pool.query('INSERT IGNORE INTO learning_settings (user_id) VALUES (?)', [userId]);
  await pool.query('UPDATE learning_stats SET total_grammar_mastered = (SELECT COUNT(*) FROM grammar_progress WHERE user_id = ? AND mastered = 1) WHERE user_id = ?', [userId, userId]);

  console.log('MySQL 数据库和表结构初始化完成');
}

async function closeDatabase() {
  await Promise.all([pool.end(), adminPool.end()]);
}

module.exports = {
  pool,
  adminPool,
  databaseName,
  testConnection,
  initDatabase,
  closeDatabase
};



