const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取学习设置
router.get('/', (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		let settings = db.prepare('SELECT * FROM learning_settings WHERE user_id = ?').get(userId);

		if (!settings) {
			// 创建默认设置
			db.prepare('INSERT INTO learning_settings (user_id) VALUES (?)').run(userId);
			settings = db.prepare('SELECT * FROM learning_settings WHERE user_id = ?').get(userId);
		}

		res.json({ code: 0, data: settings });
	} catch (error) {
		console.error('获取学习设置失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新学习设置
router.put('/', (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const {
			daily_new_words,
			daily_review_words,
			difficulty,
			accent,
			auto_play,
			dark_mode,
			font_size,
			daily_reminder,
			reminder_time,
			reminder_content,
			word_reminder,
			progress_reminder,
			achievement_reminder,
			do_not_disturb,
			dnd_start,
			dnd_end
		} = req.body;

		// 检查设置是否存在
		const existing = db.prepare('SELECT * FROM learning_settings WHERE user_id = ?').get(userId);

		if (existing) {
			db.prepare(`
				UPDATE learning_settings
				SET daily_new_words = COALESCE(?, daily_new_words),
					daily_review_words = COALESCE(?, daily_review_words),
					difficulty = COALESCE(?, difficulty),
					accent = COALESCE(?, accent),
					auto_play = COALESCE(?, auto_play),
					dark_mode = COALESCE(?, dark_mode),
					font_size = COALESCE(?, font_size),
					daily_reminder = COALESCE(?, daily_reminder),
					reminder_time = COALESCE(?, reminder_time),
					reminder_content = COALESCE(?, reminder_content),
					word_reminder = COALESCE(?, word_reminder),
					progress_reminder = COALESCE(?, progress_reminder),
					achievement_reminder = COALESCE(?, achievement_reminder),
					do_not_disturb = COALESCE(?, do_not_disturb),
					dnd_start = COALESCE(?, dnd_start),
					dnd_end = COALESCE(?, dnd_end),
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ?
			`).run(
				daily_new_words, daily_review_words, difficulty, accent,
				auto_play, dark_mode, font_size, daily_reminder,
				reminder_time, reminder_content, word_reminder,
				progress_reminder, achievement_reminder, do_not_disturb,
				dnd_start, dnd_end, userId
			);
		} else {
			db.prepare(`
				INSERT INTO learning_settings (user_id, daily_new_words, daily_review_words, difficulty, accent, auto_play, dark_mode, font_size, daily_reminder, reminder_time, reminder_content, word_reminder, progress_reminder, achievement_reminder, do_not_disturb, dnd_start, dnd_end)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).run(
				userId, daily_new_words || 20, daily_review_words || 50,
				difficulty || 1, accent || 0, auto_play !== undefined ? auto_play : 1,
				dark_mode || 0, font_size || 1, daily_reminder !== undefined ? daily_reminder : 1,
				reminder_time || '08:00', reminder_content || 0,
				word_reminder !== undefined ? word_reminder : 1,
				progress_reminder !== undefined ? progress_reminder : 1,
				achievement_reminder !== undefined ? achievement_reminder : 1,
				do_not_disturb !== undefined ? do_not_disturb : 1,
				dnd_start || '22:00', dnd_end || '07:00'
			);
		}

		const updatedSettings = db.prepare('SELECT * FROM learning_settings WHERE user_id = ?').get(userId);
		res.json({ code: 0, data: updatedSettings, message: '更新成功' });
	} catch (error) {
		console.error('更新学习设置失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

module.exports = router;
