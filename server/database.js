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
    avatar VARCHAR(500) DEFAULT '/static/default-avatar.png',
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
  `CREATE TABLE IF NOT EXISTS grammar_progress (
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
    difficulty INT DEFAULT 1,
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
  await ensureWordSchema();
  await ensureWordStatusSchema();

  await pool.query(
    'INSERT IGNORE INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
    ['test_user_001', '英语学习者', '/static/default-avatar.png']
  );
  const [users] = await pool.query('SELECT id FROM users WHERE openid = ?', ['test_user_001']);
  const userId = users[0].id;
  await pool.query('INSERT IGNORE INTO learning_stats (user_id) VALUES (?)', [userId]);
  await pool.query('INSERT IGNORE INTO streak_data (user_id) VALUES (?)', [userId]);
  await pool.query('INSERT IGNORE INTO learning_settings (user_id) VALUES (?)', [userId]);

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



