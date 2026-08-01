const express = require('express');
const router = express.Router();
const { db } = require('../db');

function progress(current, target) {
  return Math.min(100, Math.max(0, Math.round(Number(current || 0) / target * 100)));
}

router.get('/', async (req, res) => {
  try {
    const userId = Number.parseInt(req.query.userId, 10) || 1;
    const stats = await db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId);
    const streak = await db.prepare('SELECT * FROM streak_data WHERE user_id = ?').get(userId);
    const dialogueRow = await db.prepare('SELECT COUNT(*) AS count FROM dialogue_history WHERE user_id = ?').get(userId);
    const pronunciationRow = await db.prepare(
      'SELECT AVG(best_score) AS average_score FROM phonetic_progress WHERE user_id = ? AND attempts > 0'
    ).get(userId);

    const totalWords = Number(stats?.total_words_learned || 0);
    const totalGrammar = Number(stats?.total_grammar_mastered || 0);
    const totalSpeak = Number(stats?.total_speak_practice || 0);
    const totalPhonetic = Number(stats?.total_phonetic_mastered || 0);
    const totalMinutes = Number(stats?.total_study_minutes || 0);
    const totalDialogues = Number(dialogueRow?.count || 0);
    const maxStreak = Number(streak?.max_streak || 0);
    const pronunciationScore = Math.round(Number(pronunciationRow?.average_score || 0));
    const hasStarted = totalWords > 0 || totalGrammar > 0 || totalSpeak > 0 ||
      totalPhonetic > 0 || totalMinutes > 0 || totalDialogues > 0;

    const learning = [
      { id: 'beginner', name: '初学者', description: '完成第一次学习', unlocked: hasStarted, progress: hasStarted ? 100 : 0, icon: '🌱' },
      { id: 'word_master_100', name: '单词达人', description: '学习100个单词', unlocked: totalWords >= 100, progress: progress(totalWords, 100), icon: '📖' },
      { id: 'word_master_500', name: '词汇大师', description: '学习500个单词', unlocked: totalWords >= 500, progress: progress(totalWords, 500), icon: '📚' },
      { id: 'grammar_beginner', name: '语法入门', description: '掌握5个语法知识点', unlocked: totalGrammar >= 5, progress: progress(totalGrammar, 5), icon: '📝' },
      { id: 'speak_beginner', name: '口语新星', description: '完成10次跟读', unlocked: totalSpeak >= 10, progress: progress(totalSpeak, 10), icon: '🗣️' }
    ];

    const streakBadges = [
      { id: 'streak_3', name: '三天连续', description: '连续学习3天', unlocked: maxStreak >= 3, progress: progress(maxStreak, 3), icon: '🔥' },
      { id: 'streak_7', name: '一周坚持', description: '连续学习7天', unlocked: maxStreak >= 7, progress: progress(maxStreak, 7), icon: '🔥' },
      { id: 'streak_15', name: '半月达人', description: '连续学习15天', unlocked: maxStreak >= 15, progress: progress(maxStreak, 15), icon: '🔥' },
      { id: 'streak_30', name: '一月之星', description: '连续学习30天', unlocked: maxStreak >= 30, progress: progress(maxStreak, 30), icon: '🔥' }
    ];

    const special = [
      { id: 'pronunciation_master', name: '发音高手', description: '发音平均成绩达到90分', unlocked: pronunciationScore >= 90, progress: progress(pronunciationScore, 90), icon: '🎯' },
      { id: 'dialogue_master', name: '对话达人', description: '完成20次AI对话', unlocked: totalDialogues >= 20, progress: progress(totalDialogues, 20), icon: '💬' },
      { id: 'all_achievements', name: '全能学霸', description: '解锁其他全部徽章', unlocked: false, progress: 0, icon: '🏆' }
    ];

    const regularBadges = [...learning, ...streakBadges, ...special].filter(item => item.id !== 'all_achievements');
    const unlockedRegular = regularBadges.filter(item => item.unlocked).length;
    const allBadge = special.find(item => item.id === 'all_achievements');
    allBadge.unlocked = unlockedRegular === regularBadges.length;
    allBadge.progress = progress(unlockedRegular, regularBadges.length);

    res.json({ code: 0, data: { learning, streak: streakBadges, special } });
  } catch (error) {
    console.error('获取成就数据失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;