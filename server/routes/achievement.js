const express = require('express');
const router = express.Router();
const { db } = require('../db');
const ach = require('../utils/achievements');

function progress(current, target) {
  return Math.min(100, Math.max(0, Math.round(Number(current || 0) / target * 100)));
}

router.get('/', async (req, res) => {
  try {
    const userId = Number.parseInt(req.query.userId, 10) || 1;
    await ach.ensureTables();
    const [stats, streak, dialogueRow, pronunciationRow, unlockedRows, progressRows, activeWrong] = await Promise.all([
      db.prepare('SELECT * FROM learning_stats WHERE user_id = ?').get(userId),
      db.prepare('SELECT * FROM streak_data WHERE user_id = ?').get(userId),
      db.prepare('SELECT COUNT(*) AS count FROM dialogue_history WHERE user_id = ?').get(userId),
      db.prepare('SELECT AVG(best_score) AS average_score FROM phonetic_progress WHERE user_id = ? AND attempts > 0').get(userId),
      db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').all(userId),
      db.prepare('SELECT stat_key, value FROM user_achievement_progress WHERE user_id = ?').all(userId),
      db.prepare('SELECT COUNT(*) AS count FROM word_wrong_records WHERE user_id = ? AND active = 1').get(userId)
    ]);
    const unlocked = new Set((unlockedRows || []).map(item => item.achievement_id));
    const progressMap = {};
    (progressRows || []).forEach(item => { progressMap[item.stat_key] = Number(item.value || 0); });

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
      { id: 'beginner', name: '初学者', description: '完成第一次学习', unlocked: hasStarted, progress: hasStarted ? 100 : 0, current: hasStarted ? 1 : 0, target: 1, icon: '🌱', reward: '开启成就收集之旅' },
      { id: 'word_master_100', name: '单词达人', description: '学习100个单词', unlocked: totalWords >= 100, progress: progress(totalWords, 100), current: totalWords, target: 100, icon: '📖', reward: '' },
      { id: 'word_master_500', name: '词汇大师', description: '学习500个单词', unlocked: totalWords >= 500, progress: progress(totalWords, 500), current: totalWords, target: 500, icon: '📚', reward: '' },
      { id: 'grammar_beginner', name: '语法入门', description: '掌握5个语法知识点', unlocked: totalGrammar >= 5, progress: progress(totalGrammar, 5), current: totalGrammar, target: 5, icon: '📝', reward: '' },
      { id: 'speak_beginner', name: '口语新星', description: '完成10次跟读', unlocked: totalSpeak >= 10, progress: progress(totalSpeak, 10), current: totalSpeak, target: 10, icon: '🗣️', reward: '' }
    ];

    const streakBadges = [
      { id: 'streak_3', name: '三天连续', description: '连续学习3天', unlocked: maxStreak >= 3, progress: progress(maxStreak, 3), current: maxStreak, target: 3, icon: '🔥', reward: '闯关失败免扣星 1 次' },
      { id: 'streak_7', name: '一周坚持', description: '连续学习7天', unlocked: maxStreak >= 7, progress: progress(maxStreak, 7), current: maxStreak, target: 7, icon: '🔥', reward: '解锁限定闯关皮肤' },
      { id: 'streak_15', name: '半月达人', description: '连续学习15天', unlocked: maxStreak >= 15, progress: progress(maxStreak, 15), current: maxStreak, target: 15, icon: '🔥', reward: '每日免扣星 +1' },
      { id: 'streak_30', name: '一月之星', description: '连续学习30天', unlocked: maxStreak >= 30, progress: progress(maxStreak, 30), current: maxStreak, target: 30, icon: '🔥', reward: '传奇称号「一月之星」' }
    ];

    const special = [
      { id: 'pronunciation_master', name: '发音高手', description: '发音平均成绩达到90分', unlocked: pronunciationScore >= 90, progress: progress(pronunciationScore, 90), current: pronunciationScore, target: 90, icon: '🎯', reward: '' },
      { id: 'dialogue_master', name: '对话达人', description: '完成20次AI对话', unlocked: totalDialogues >= 20, progress: progress(totalDialogues, 20), current: totalDialogues, target: 20, icon: '💬', reward: '' },
      { id: 'all_achievements', name: '全能学霸', description: '解锁其他全部徽章', unlocked: false, progress: 0, current: 0, target: 11, icon: '🏆', reward: '解锁隐藏 Boss 关' }
    ];

    // 统计类成就达标后补记解锁并发放奖励（只发放一次）
    const allRegular = [...learning, ...streakBadges, ...special];
    for (const badge of allRegular) {
      if (badge.unlocked && !unlocked.has(badge.id)) await ach.unlockAchievement(userId, badge.id);
    }
    const regularBadges = allRegular.filter(item => item.id !== 'all_achievements');
    const unlockedRegular = regularBadges.filter(item => item.unlocked).length;
    const allBadge = special.find(item => item.id === 'all_achievements');
    allBadge.unlocked = unlockedRegular === regularBadges.length;
    allBadge.progress = progress(unlockedRegular, regularBadges.length);
    allBadge.current = unlockedRegular;
    if (allBadge.unlocked && !unlocked.has('all_achievements')) await ach.unlockAchievement(userId, 'all_achievements');

    const comboBest = Number(progressMap['combo_best'] || 0);
    const morning = Number(progressMap['morning_study'] || 0);
    const activeWrongCount = Number(activeWrong?.count || 0);
    const hidden = [
      { id: 'combo_10', name: '连击大师', description: '单次闯关连续答对10题', hidden: true, unlocked: unlocked.has('combo_10'), progress: progress(comboBest, 10), current: comboBest, target: 10, icon: '⚡', reward: '' },
      { id: 'wrong_terminator', name: '错题终结者', description: '清空错题本全部错题', hidden: true, unlocked: unlocked.has('wrong_terminator'), progress: activeWrongCount === 0 && unlocked.has('wrong_terminator') ? 100 : 0, current: activeWrongCount === 0 ? 1 : 0, target: 1, icon: '🧹', reward: '' },
      { id: 'morning_scholar', name: '晨光学者', description: '早晨6-8点完成学习', hidden: true, unlocked: unlocked.has('morning_scholar'), progress: morning ? 100 : 0, current: morning ? 1 : 0, target: 1, icon: '🌅', reward: '' }
    ];

    res.json({ code: 0, data: { learning, streak: streakBadges, special, hidden } });
  } catch (error) {
    console.error('获取成就数据失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 我的道具
router.get('/rewards', async (req, res) => {
  try {
    const userId = Number.parseInt(req.query.userId, 10) || 1;
    await ach.ensureTables();
    const rows = await db.prepare('SELECT reward_type, count FROM user_rewards WHERE user_id = ?').all(userId);
    const map = {};
    rows.forEach(item => { map[item.reward_type] = Number(item.count || 0); });
    res.json({ code: 0, data: { hint_card: map.hint_card || 0, star_shield: map.star_shield || 0, boss_key: map.boss_key || 0 } });
  } catch (error) {
    console.error('获取道具失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 使用道具
router.post('/rewards/use', async (req, res) => {
  try {
    const userId = Number.parseInt(req.body.userId, 10) || 1;
    const type = String(req.body.type || '');
    const count = Math.max(1, Number.parseInt(req.body.count, 10) || 1);
    if (!['hint_card', 'star_shield'].includes(type)) return res.status(400).json({ code: 400, message: '道具类型无效' });
    await ach.ensureTables();
    const row = await db.prepare('SELECT count FROM user_rewards WHERE user_id = ? AND reward_type = ?').get(userId, type);
    const balance = Number(row?.count || 0);
    if (balance < count) return res.status(400).json({ code: 400, message: '道具数量不足' });
    await db.prepare('UPDATE user_rewards SET count = count - ? WHERE user_id = ? AND reward_type = ?').run(count, userId, type);
    res.json({ code: 0, data: { type, used: count, remaining: balance - count } });
  } catch (error) {
    console.error('使用道具失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
