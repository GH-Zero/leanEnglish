const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 获取所有对话场景
router.get('/list', async (req, res) => {
	try {
		const scenes = await db.prepare('SELECT * FROM dialogue_scenes ORDER BY sort_order ASC').all();
		res.json({ code: 0, data: scenes });
	} catch (err) {
		console.error('获取对话场景失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

// 获取单个场景详情
router.get('/detail/:id', async (req, res) => {
	try {
		const scene = await db.prepare('SELECT * FROM dialogue_scenes WHERE id = ?').get(req.params.id);
		if (!scene) {
			return res.json({ code: -1, message: '场景不存在' });
		}
		res.json({ code: 0, data: scene });
	} catch (err) {
		console.error('获取场景详情失败:', err);
		res.json({ code: -1, message: '获取失败' });
	}
});

module.exports = router;
