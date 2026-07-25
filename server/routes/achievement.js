const express = require('express');
const router = express.Router();
const { db } = require('../database-sqlite');

// 获取成就数据
router.get('/', (req, res) => {
	try {
		const userId = parseInt(req.query.userId) || 1;

		// 获取学习统计
		const stats = db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
		const streak = db.prepare('SELECT * FROM streak_data WHERE user_id = ?').get(userId);

		const totalWords = stats ? stats.total_words_learned : 0;
		const totalGrammar = stats ? stats.total_grammar_mastered : 0;
		const totalSpeak = stats ? stats.total_speak_practice : 0;
		const accuracy = stats ? stats.accuracy : 0;
		const currentStreak = streak ? streak.current_streak : 0;
		const maxStreak = streak ? streak.max_streak : 0;

		// 学习成就
		const learning = [
			{
				id: 'beginner',
				name: '初学者',
				description: '完成第一次学习',
				unlocked: totalWords > 0 || totalGrammar > 0,
				progress: 100,
				icon: '🌱'
			},
			{
				id: 'word_master_100',
				name: '单词达人',
				description: '学习100个单词',
				unlocked: totalWords >= 100,
				progress: Math.min(100, Math.round((totalWords / 100) * 100)),
				icon: '📖'
			},
			{
				id: 'word_master_500',
				name: '词汇大师',
				description: '学习500个单词',
				unlocked: totalWords >= 500,
				progress: Math.min(100, Math.round((totalWords / 500) * 100)),
				icon: '📚'
			},
			{
				id: 'grammar_beginner',
				name: '语法入门',
				description: '完成5个语法练习',
				unlocked: totalGrammar >= 5,
				progress: Math.min(100, Math.round((totalGrammar / 5) * 100)),
				icon: '📝'
			},
			{
				id: 'speak_beginner',
				name: '口语新星',
				description: '完成10次跟读',
				unlocked: totalSpeak >= 10,
				progress: Math.min(100, Math.round((totalSpeak / 10) * 100)),
				icon: '🗣️'
			}
		];

		// 连续学习成就
		const streakBadges = [
			{
				id: 'streak_3',
				name: '三天连续',
				description: '连续学习3天',
				unlocked: currentStreak >= 3 || maxStreak >= 3,
				icon: '🔥'
			},
			{
				id: 'streak_7',
				name: '一周坚持',
				description: '连续学习7天',
				unlocked: currentStreak >= 7 || maxStreak >= 7,
				icon: '🔥'
			},
			{
				id: 'streak_15',
				name: '半月达人',
				description: '连续学习15天',
				unlocked: currentStreak >= 15 || maxStreak >= 15,
				icon: '🔥'
			},
			{
				id: 'streak_30',
				name: '一月之星',
				description: '连续学习30天',
				unlocked: currentStreak >= 30 || maxStreak >= 30,
				icon: '🔥'
			}
		];

		// 特殊成就
		const special = [
			{
				id: 'pronunciation_master',
				name: '发音高手',
				description: '发音准确率达到90%',
				unlocked: accuracy >= 90,
				icon: '🎯'
			},
			{
				id: 'dialogue_master',
				name: '对话达人',
				description: '完成20次AI对话',
				unlocked: totalSpeak >= 20,
				icon: '💬'
			},
			{
				id: 'all_achievements',
				name: '全能学霸',
				description: '解锁所有徽章',
				unlocked: false,
				icon: '🏆'
			}
		];

		// 检查是否解锁所有徽章
		const allUnlocked = [...learning, ...streakBadges, ...special].filter(a => a.id !== 'all_achievements').every(a => a.unlocked);
		special.find(a => a.id === 'all_achievements').unlocked = allUnlocked;

		res.json({
			code: 0,
			data: {
				learning,
				streak: streakBadges,
				special
			}
		});
	} catch (error) {
		console.error('获取成就数据失败:', error);
		res.status(500).json({ code: 500, message: '服务器错误' });
	}
});

module.exports = router;
