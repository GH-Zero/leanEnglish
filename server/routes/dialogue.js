const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取对话历史
router.get('/history', (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;
		const history = db.prepare('SELECT * FROM dialogue_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId);

		// 解析messages JSON
		const formattedHistory = history.map(item => ({
			...item,
			messages: typeof item.messages === 'string' ? JSON.parse(item.messages) : item.messages
		}));

		res.json({ code: 0, data: formattedHistory });
	} catch (error) {
		console.error('获取对话历史失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 保存对话记录
router.post('/history', (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		const { scene_name, scene_icon, messages, average_score, duration } = req.body;

		const result = db.prepare(`
			INSERT INTO dialogue_history (user_id, scene_name, scene_icon, messages, average_score, duration)
			VALUES (?, ?, ?, ?, ?, ?)
		`).run(userId, scene_name, scene_icon, JSON.stringify(messages || []), average_score || 0, duration || 0);

		// 更新口语练习统计
		db.prepare(`
			UPDATE learning_stats
			SET total_speak_practice = total_speak_practice + 1,
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`).run(userId);

		res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '保存成功' });
	} catch (error) {
		console.error('保存对话记录失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

// 清空对话历史
router.delete('/history', (req, res) => {
	try {
		const userId = parseInt(req.body.userId) || 1;
		db.prepare('DELETE FROM dialogue_history WHERE user_id = ?').run(userId);
		res.json({ code: 0, message: '清空成功' });
	} catch (error) {
		console.error('清空对话历史失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

module.exports = router;
