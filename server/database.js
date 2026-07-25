const mysql = require('mysql2/promise');

// 数据库配置 - 请根据你的MySQL配置修改
const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '', // 留空表示没有密码，请根据实际情况修改
	database: 'english_learning',
	charset: 'utf8mb4',
	timezone: '+08:00'
};

// 创建连接池
const pool = mysql.createPool({
	...dbConfig,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
	try {
		const connection = await pool.getConnection();
		console.log('✅ 数据库连接成功');
		connection.release();
		return true;
	} catch (error) {
		console.error('❌ 数据库连接失败:', error.message);
		return false;
	}
}

// 初始化数据库表
async function initDatabase() {
	const connection = await pool.getConnection();

	try {
		// 创建数据库（如果不存在）
		await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
		await connection.query(`USE ${dbConfig.database}`);

		// 用户表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS users (
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
			)
		`);

		// 学习统计表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS learning_stats (
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
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

		// 连续学习记录表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS streak_data (
				id INT PRIMARY KEY AUTO_INCREMENT,
				user_id INT UNIQUE NOT NULL,
				current_streak INT DEFAULT 0,
				max_streak INT DEFAULT 0,
				last_study_date DATE,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

		// 每日学习记录表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS daily_records (
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
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

		// 单词学习状态表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS word_status (
				id INT PRIMARY KEY AUTO_INCREMENT,
				user_id INT NOT NULL,
				word VARCHAR(100) NOT NULL,
				ease_factor DECIMAL(3,1) DEFAULT 2.5,
				interval INT DEFAULT 1,
				repetition INT DEFAULT 0,
				next_review_date DATE,
				last_review_date DATE,
				mastered TINYINT(1) DEFAULT 0,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				UNIQUE KEY unique_user_word (user_id, word),
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

		// 语法学习进度表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS grammar_progress (
				id INT PRIMARY KEY AUTO_INCREMENT,
				user_id INT NOT NULL,
				grammar_id INT NOT NULL,
				status VARCHAR(20) DEFAULT '未学习',
				score INT DEFAULT 0,
				last_practice_date DATE,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				UNIQUE KEY unique_user_grammar (user_id, grammar_id),
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

		// 音标学习进度表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS phonetic_progress (
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
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

		// 对话历史表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS dialogue_history (
				id INT PRIMARY KEY AUTO_INCREMENT,
				user_id INT NOT NULL,
				scene_name VARCHAR(100),
				scene_icon VARCHAR(50),
				messages JSON,
				average_score INT DEFAULT 0,
				duration INT DEFAULT 0,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

		// 学习设置表
		await connection.query(`
			CREATE TABLE IF NOT EXISTS learning_settings (
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
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

		// 插入默认用户（如果不存在）
		const [existingUser] = await connection.query('SELECT id FROM users WHERE openid = ?', ['test_user_001']);
		if (existingUser.length === 0) {
			const [result] = await connection.query(
				'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
				['test_user_001', '英语学习者', '/static/default-avatar.png']
			);
			const userId = result.insertId;

			// 初始化用户统计
			await connection.query('INSERT INTO learning_stats (user_id) VALUES (?)', [userId]);
			await connection.query('INSERT INTO streak_data (user_id) VALUES (?)', [userId]);
			await connection.query('INSERT INTO learning_settings (user_id) VALUES (?)', [userId]);

			console.log('✅ 默认用户创建成功');
		}

		console.log('✅ 数据库表初始化完成');
	} catch (error) {
		console.error('❌ 数据库初始化失败:', error.message);
		throw error;
	} finally {
		connection.release();
	}
}

module.exports = { pool, testConnection, initDatabase };
