const { db } = require('../db');

let ready;
function ensureTables() {
  if (ready) return ready;
  ready = db.pool.query(`CREATE TABLE IF NOT EXISTS user_achievements (user_id INT NOT NULL,achievement_id VARCHAR(50) NOT NULL,unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (user_id,achievement_id),INDEX idx_ua_user (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    .then(() => db.pool.query(`CREATE TABLE IF NOT EXISTS user_rewards (user_id INT NOT NULL,reward_type VARCHAR(30) NOT NULL,count INT NOT NULL DEFAULT 0,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY (user_id,reward_type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`))
    .then(() => db.pool.query(`CREATE TABLE IF NOT EXISTS user_achievement_progress (user_id INT NOT NULL,stat_key VARCHAR(50) NOT NULL,value INT NOT NULL DEFAULT 0,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY (user_id,stat_key)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`));
  return ready;
}

const REWARD_MAP = {
  streak_3: [['star_shield', 1]],
  streak_15: [['star_shield', 1]],
  all_achievements: [['boss_key', 1]]
};

async function grantReward(userId, type, count) {
  await db.prepare('INSERT INTO user_rewards (user_id, reward_type, count) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE count = count + VALUES(count)').run(userId, type, count);
}

async function isUnlocked(userId, id) {
  const row = await db.prepare('SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(userId, id);
  return Boolean(row);
}

async function unlockAchievement(userId, id) {
  await ensureTables();
  const existing = await isUnlocked(userId, id);
  if (existing) return false;
  await db.prepare('INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, id);
  const rewards = REWARD_MAP[id] || [];
  for (const [type, count] of rewards) {
    await grantReward(userId, type, count);
  }
  return true;
}

function shanghaiHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', hour12: false }).format(date));
}

async function maybeUnlockMorningScholar(userId) {
  if (!userId) return false;
  await ensureTables();
  const hour = shanghaiHour();
  if (hour < 6 || hour >= 8) return false;
  await db.prepare("INSERT INTO user_achievement_progress (user_id, stat_key, value) VALUES (?, 'morning_study', 1) ON DUPLICATE KEY UPDATE value = 1").run(userId);
  return unlockAchievement(userId, 'morning_scholar');
}

async function maybeUnlockCombo(userId, bestStreak) {
  if (!userId || !Number(bestStreak)) return false;
  await ensureTables();
  const row = await db.prepare('SELECT value FROM user_achievement_progress WHERE user_id = ? AND stat_key = ?').get(userId, 'combo_best');
  const prev = Number(row?.value || 0);
  const value = Number(bestStreak);
  if (value > prev) {
    await db.prepare("INSERT INTO user_achievement_progress (user_id, stat_key, value) VALUES (?, 'combo_best', ?) ON DUPLICATE KEY UPDATE value = ?").run(userId, value, value);
  }
  if (value >= 10) return unlockAchievement(userId, 'combo_10');
  return false;
}

async function maybeUnlockWrongTerminator(userId) {
  if (!userId) return false;
  await ensureTables();
  const active = await db.prepare('SELECT COUNT(*) AS count FROM word_wrong_records WHERE user_id = ? AND active = 1').get(userId);
  if (Number(active?.count || 0) > 0) return false;
  const total = await db.prepare('SELECT COUNT(*) AS count FROM word_wrong_records WHERE user_id = ?').get(userId);
  if (Number(total?.count || 0) === 0) return false;
  return unlockAchievement(userId, 'wrong_terminator');
}

module.exports = { ensureTables, unlockAchievement, isUnlocked, grantReward, maybeUnlockMorningScholar, maybeUnlockCombo, maybeUnlockWrongTerminator, shanghaiHour };
