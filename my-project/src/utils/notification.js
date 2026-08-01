import { getSettings } from '@/utils/api.js';
const MESSAGE_KEY = 'notificationMessages';
const DAILY_KEY = 'lastDailyReminderDate';
const CONTENTS = [
  { title: '学习提醒', content: '今天的英语学习任务还在等你，抽几分钟完成计划吧。', icon: '📚' },
  { title: '温馨提醒', content: '每天坚持一点点，英语能力会稳步提升。', icon: '🔔' },
  { title: '继续加油', content: '完成今天的学习计划，离目标更近一步。', icon: '🌟' }
];
const pad = value => String(value).padStart(2, '0');
export const timeToMinutes = value => { const match = /^(\d{2}):(\d{2})$/.exec(String(value || '')); return match ? Number(match[1]) * 60 + Number(match[2]) : null; };

export function saveNotificationMessage(message) {
  const list = uni.getStorageSync(MESSAGE_KEY);
  const messages = Array.isArray(list) ? list : [];
  const next = [{ id: `${Date.now()}-${Math.random()}`, ...message }, ...messages].slice(0, 50);
  uni.setStorageSync(MESSAGE_KEY, next);
  uni.$emit('notification:refresh');
  return next;
}
export function getNotificationMessages() { const list = uni.getStorageSync(MESSAGE_KEY); return Array.isArray(list) ? list : []; }
export async function checkDailyReminder() {
  let settings;
  try { settings = await getSettings(); } catch (_) { settings = uni.getStorageSync('notificationSettings') || {}; }
  if (!Boolean(Number(settings.daily_reminder ?? settings.dailyReminder ?? 0))) return false;
  const now = new Date();
  const target = timeToMinutes(settings.reminder_time || settings.reminderTime || '08:00');
  if (target === null || now.getHours() * 60 + now.getMinutes() < target) return false;
  const dateKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if (uni.getStorageSync(DAILY_KEY) === dateKey) return false;
  const index = Math.max(0, Math.min(2, Number(settings.reminder_content ?? settings.reminderContentIndex ?? 0)));
  const item = CONTENTS[index];
  const time = `${dateKey} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  saveNotificationMessage({ ...item, time, type: 'daily' });
  uni.setStorageSync(DAILY_KEY, dateKey);
  uni.showModal({ title: item.title, content: item.content, showCancel: false, confirmText: '去学习', success: result => { if (result.confirm) uni.switchTab({ url: '/pages/home/index' }); } });
  return true;
}