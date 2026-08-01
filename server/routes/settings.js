const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 获取学习设置
router.get('/', async (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		let settings = await db.prepare('SELECT * FROM learning_settings WHERE user_id = ?').get(userId);

		if (!settings) {
			// 创建默认设置
			await db.prepare('INSERT INTO learning_settings (user_id) VALUES (?)').run(userId);
			settings = await db.prepare('SELECT * FROM learning_settings WHERE user_id = ?').get(userId);
		}

		res.json({ code: 0, data: settings });
	} catch (error) {
		console.error('获取学习设置失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 更新学习设置
router.put('/', async (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const {
			daily_new_words,
			daily_review_words,
			daily_grammar_questions,
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

		const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
		for (const [name, value] of [['reminder_time', reminder_time], ['dnd_start', dnd_start], ['dnd_end', dnd_end]]) {
			if (value !== undefined && !timePattern.test(String(value))) return res.status(400).json({ code: 400, message: `${name} 时间格式无效` });
		}
		if (reminder_content !== undefined && ![0, 1, 2].includes(Number(reminder_content))) return res.status(400).json({ code: 400, message: '提醒内容参数无效' });
		for (const [name, value] of [['daily_reminder', daily_reminder], ['word_reminder', word_reminder], ['progress_reminder', progress_reminder], ['achievement_reminder', achievement_reminder], ['do_not_disturb', do_not_disturb]]) {
			if (value !== undefined && ![0, 1, false, true].includes(value)) return res.status(400).json({ code: 400, message: `${name} 开关参数无效` });
		}
		if (do_not_disturb && dnd_start && dnd_end && dnd_start === dnd_end) return res.status(400).json({ code: 400, message: '免打扰开始和结束时间不能相同' });

		// 检查设置是否存在
		const existing = await db.prepare('SELECT * FROM learning_settings WHERE user_id = ?').get(userId);

		if (existing) {
			await db.prepare(`
				UPDATE learning_settings
				SET daily_new_words = COALESCE(?, daily_new_words),
					daily_review_words = COALESCE(?, daily_review_words),
					daily_grammar_questions = COALESCE(?, daily_grammar_questions),
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
				daily_new_words, daily_review_words, daily_grammar_questions, difficulty, accent,
				auto_play, dark_mode, font_size, daily_reminder,
				reminder_time, reminder_content, word_reminder,
				progress_reminder, achievement_reminder, do_not_disturb,
				dnd_start, dnd_end, userId
			);
		} else {
			await db.prepare(`
				INSERT INTO learning_settings (user_id, daily_new_words, daily_review_words, daily_grammar_questions, difficulty, accent, auto_play, dark_mode, font_size, daily_reminder, reminder_time, reminder_content, word_reminder, progress_reminder, achievement_reminder, do_not_disturb, dnd_start, dnd_end)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).run(
				userId, daily_new_words || 20, daily_review_words || 50, daily_grammar_questions || 10,
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

		const updatedSettings = await db.prepare('SELECT * FROM learning_settings WHERE user_id = ?').get(userId);
		res.json({ code: 0, data: updatedSettings, message: '更新成功' });
	} catch (error) {
		console.error('更新学习设置失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

router.delete('/progress', async (req, res) => {
	try {
		const userId = Number.parseInt(req.body.userId, 10) || 1;
		for (const table of ['word_wrong_records','word_status','grammar_progress','phonetic_progress','dialogue_history','daily_records']) {
			await db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId);
		}
		await db.prepare(`UPDATE learning_stats SET total_words_learned=0,total_grammar_mastered=0,total_phonetic_mastered=0,total_speak_practice=0,total_study_minutes=0,streak_days=0,max_streak_days=0,last_study_date=NULL,accuracy=0,total_practice_count=0,correct_count=0 WHERE user_id=?`).run(userId);
		await db.prepare('UPDATE streak_data SET current_streak=0,max_streak=0,last_study_date=NULL WHERE user_id=?').run(userId);
		res.json({ code: 0, data: { reset: true }, message: '学习进度已重置' });
	} catch (error) {
		console.error('重置学习进度失败:', error);
		res.status(500).json({ code: 500, message: '重置学习进度失败' });
	}
});
module.exports = router;
