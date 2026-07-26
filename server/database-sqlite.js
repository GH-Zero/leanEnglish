const Database = require('better-sqlite3');
const path = require('path');

// SQLite数据库文件路径
const DB_PATH = path.join(__dirname, 'data', 'english_learning.db');

// 确保data目录存在
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
let db;

try {
	db = new Database(DB_PATH);
	console.log('✅ SQLite数据库连接成功');
} catch (error) {
	console.error('❌ SQLite数据库连接失败:', error.message);
	throw error;
}

// 启用WAL模式提高性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化数据库表
function initDatabase() {
	// 用户表
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			openid TEXT UNIQUE NOT NULL,
			nickname TEXT DEFAULT '英语学习者',
			avatar TEXT DEFAULT '/static/default-avatar.png',
			level INTEGER DEFAULT 0,
			goal INTEGER DEFAULT 0,
			study_duration INTEGER DEFAULT 30,
			focus INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 学习统计表
	db.exec(`
		CREATE TABLE IF NOT EXISTS learning_stats (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER UNIQUE NOT NULL,
			total_words_learned INTEGER DEFAULT 0,
			total_grammar_mastered INTEGER DEFAULT 0,
			total_phonetic_mastered INTEGER DEFAULT 0,
			total_speak_practice INTEGER DEFAULT 0,
			total_study_minutes INTEGER DEFAULT 0,
			streak_days INTEGER DEFAULT 0,
			max_streak_days INTEGER DEFAULT 0,
			last_study_date TEXT,
			accuracy REAL DEFAULT 0,
			total_practice_count INTEGER DEFAULT 0,
			correct_count INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// 连续学习记录表
	db.exec(`
		CREATE TABLE IF NOT EXISTS streak_data (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER UNIQUE NOT NULL,
			current_streak INTEGER DEFAULT 0,
			max_streak INTEGER DEFAULT 0,
			last_study_date TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// 每日学习记录表
	db.exec(`
		CREATE TABLE IF NOT EXISTS daily_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			date TEXT NOT NULL,
			words_learned INTEGER DEFAULT 0,
			words_reviewed INTEGER DEFAULT 0,
			grammar_practiced INTEGER DEFAULT 0,
			phonetic_practiced INTEGER DEFAULT 0,
			speak_practiced INTEGER DEFAULT 0,
			study_minutes INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, date),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// 单词学习状态表
	db.exec(`
		CREATE TABLE IF NOT EXISTS word_status (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			word TEXT NOT NULL,
			ease_factor REAL DEFAULT 2.5,
			interval INTEGER DEFAULT 1,
			repetition INTEGER DEFAULT 0,
			next_review_date TEXT,
			last_review_date TEXT,
			mastered INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, word),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// 语法学习进度表
	db.exec(`
		CREATE TABLE IF NOT EXISTS grammar_progress (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			grammar_id INTEGER NOT NULL,
			status TEXT DEFAULT '未学习',
			score INTEGER DEFAULT 0,
			last_practice_date TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, grammar_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// 音标学习进度表
	db.exec(`
		CREATE TABLE IF NOT EXISTS phonetic_progress (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			phonetic_id TEXT NOT NULL,
			best_score INTEGER DEFAULT 0,
			attempts INTEGER DEFAULT 0,
			mastered INTEGER DEFAULT 0,
			last_practice_date TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, phonetic_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// 对话历史表
	db.exec(`
		CREATE TABLE IF NOT EXISTS dialogue_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			scene_name TEXT,
			scene_icon TEXT,
			messages TEXT,
			average_score INTEGER DEFAULT 0,
			duration INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// 学习设置表
	db.exec(`
		CREATE TABLE IF NOT EXISTS learning_settings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER UNIQUE NOT NULL,
			daily_new_words INTEGER DEFAULT 20,
			daily_review_words INTEGER DEFAULT 50,
			difficulty INTEGER DEFAULT 1,
			accent INTEGER DEFAULT 0,
			auto_play INTEGER DEFAULT 1,
			dark_mode INTEGER DEFAULT 0,
			font_size INTEGER DEFAULT 1,
			daily_reminder INTEGER DEFAULT 1,
			reminder_time TEXT DEFAULT '08:00',
			reminder_content INTEGER DEFAULT 0,
			word_reminder INTEGER DEFAULT 1,
			progress_reminder INTEGER DEFAULT 1,
			achievement_reminder INTEGER DEFAULT 1,
			do_not_disturb INTEGER DEFAULT 1,
			dnd_start TEXT DEFAULT '22:00',
			dnd_end TEXT DEFAULT '07:00',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// 单词字典表
	db.exec(`
		CREATE TABLE IF NOT EXISTS words (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			word TEXT UNIQUE NOT NULL,
			phonetic_us TEXT,
			phonetic_uk TEXT,
			chinese TEXT,
			example TEXT,
			level INTEGER DEFAULT 0,
			tag TEXT DEFAULT '通用',
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 对话场景表
	db.exec(`
		CREATE TABLE IF NOT EXISTS dialogue_scenes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			icon TEXT NOT NULL,
			name TEXT NOT NULL,
			description TEXT,
			initial_prompt TEXT,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 影子跟读句子表
	db.exec(`
		CREATE TABLE IF NOT EXISTS shadow_sentences (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			text TEXT NOT NULL,
			chinese TEXT,
			level INTEGER DEFAULT 0,
			tag TEXT DEFAULT '通用',
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 语法练习题表
	db.exec(`
		CREATE TABLE IF NOT EXISTS grammar_questions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			grammar_id INTEGER,
			sentence TEXT NOT NULL,
			answer TEXT NOT NULL,
			options TEXT NOT NULL,
			explanation TEXT,
			level INTEGER DEFAULT 0,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 音标表
	db.exec(`
		CREATE TABLE IF NOT EXISTS phonetics (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			symbol TEXT UNIQUE NOT NULL,
			example TEXT,
			chinese TEXT,
			category TEXT NOT NULL,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 语法知识点表
	db.exec(`
		CREATE TABLE IF NOT EXISTS grammar_points (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT,
			stage INTEGER DEFAULT 1,
			explanation TEXT,
			examples TEXT,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 插入默认用户（如果不存在）
	const existingUser = db.prepare('SELECT id FROM users WHERE openid = ?').get('test_user_001');
	if (!existingUser) {
		const result = db.prepare('INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)').run('test_user_001', '英语学习者', '/static/default-avatar.png');
		const userId = result.lastInsertRowid;

		// 初始化用户统计
		db.prepare('INSERT INTO learning_stats (user_id) VALUES (?)').run(userId);
		db.prepare('INSERT INTO streak_data (user_id) VALUES (?)').run(userId);
		db.prepare('INSERT INTO learning_settings (user_id) VALUES (?)').run(userId);

		console.log('✅ 默认用户创建成功');
	}

	console.log('✅ 数据库表初始化完成');
}

module.exports = { db, initDatabase };
