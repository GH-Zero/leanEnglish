<template>
	<view class="container">
		<view class="header">
			<text class="title">消息提醒</text>
			<text class="subtitle">管理你的学习提醒</text>
		</view>

		<view class="section">
			<text class="section-title">每日提醒</text>
			<view class="settings-list">
				<view class="settings-item">
					<text class="settings-label">开启每日提醒</text>
					<switch :checked="dailyReminder" @change="toggleDailyReminder" color="#1F3A5F" />
				</view>
				<view class="settings-item" v-if="dailyReminder">
					<text class="settings-label">提醒时间</text>
					<picker mode="time" :value="reminderTime" @change="changeReminderTime">
						<view class="picker-value">
							<text class="value-text">{{ reminderTime }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
				<view class="settings-item" v-if="dailyReminder">
					<text class="settings-label">提醒内容</text>
					<picker :range="reminderContentOptions" :value="reminderContentIndex" @change="changeReminderContent">
						<view class="picker-value">
							<text class="value-text">{{ reminderContentOptions[reminderContentIndex] }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">学习提醒</text>
			<view class="settings-list">
				<view class="settings-item">
					<text class="settings-label">单词复习提醒</text>
					<switch :checked="wordReminder" @change="toggleWordReminder" color="#1F3A5F" />
				</view>
				<view class="settings-item">
					<text class="settings-label">学习进度提醒</text>
					<switch :checked="progressReminder" @change="toggleProgressReminder" color="#1F3A5F" />
				</view>
				<view class="settings-item">
					<text class="settings-label">成就解锁提醒</text>
					<switch :checked="achievementReminder" @change="toggleAchievementReminder" color="#1F3A5F" />
				</view>
			</view>
		</view>

		
	</view>
</template>

<script>
import { getSettings, updateSettings } from '@/utils/api.js';

export default {
  data() { return {
    dailyReminder: true, reminderTime: '08:00',
    reminderContentOptions: ['学习提醒', '温馨提醒', '激励提醒'], reminderContentIndex: 0,
    wordReminder: true, progressReminder: true, achievementReminder: true,
    saving: false, saveQueue: Promise.resolve()
  }; },
  methods: {
    currentPayload() { return {
      daily_reminder: this.dailyReminder ? 1 : 0, reminder_time: this.reminderTime,
      reminder_content: this.reminderContentIndex, word_reminder: this.wordReminder ? 1 : 0,
      progress_reminder: this.progressReminder ? 1 : 0, achievement_reminder: this.achievementReminder ? 1 : 0
    }; },
    localSettings() { return {
      dailyReminder: this.dailyReminder, reminderTime: this.reminderTime, reminderContentIndex: this.reminderContentIndex,
      wordReminder: this.wordReminder, progressReminder: this.progressReminder, achievementReminder: this.achievementReminder
    }; },
    async saveSettings() {
      const payload = this.currentPayload();
      uni.setStorageSync('notificationSettings', this.localSettings());
      this.saving = true;
      this.saveQueue = this.saveQueue.then(() => updateSettings(payload));
      try { await this.saveQueue; return true; }
      catch (error) { console.error('同步提醒设置失败:', error); uni.showToast({ title: '保存失败，已恢复原设置', icon: 'none' }); await this.loadSettings(); return false; }
      finally { this.saving = false; }
    },
    async toggleDailyReminder(e) {
      this.dailyReminder = e.detail.value;
      if (await this.saveSettings()) {
        if (this.dailyReminder) { await this.requestSubscription(); uni.showToast({ title: '已开启应用内提醒', icon: 'success' }); }
        else uni.showToast({ title: '已关闭每日提醒', icon: 'none' });
      }
    },
    async requestSubscription() {
      const templateId = import.meta.env.VITE_WECHAT_REMINDER_TEMPLATE_ID || '';
      if (!templateId) return false;
      // #ifdef MP-WEIXIN
      try { const result = await new Promise((resolve, reject) => wx.requestSubscribeMessage({ tmplIds: [templateId], success: resolve, fail: reject })); return result[templateId] === 'accept'; }
      catch (_) { uni.showToast({ title: '未获得微信通知授权', icon: 'none' }); return false; }
      // #endif
      return false;
    },
    async changeReminderTime(e) { this.reminderTime = e.detail.value; await this.saveSettings(); },
    async changeReminderContent(e) { this.reminderContentIndex = Math.max(0, Math.min(this.reminderContentOptions.length - 1, Number(e.detail.value))); await this.saveSettings(); },
    async toggleWordReminder(e) { this.wordReminder = e.detail.value; await this.saveSettings(); },
    async toggleProgressReminder(e) { this.progressReminder = e.detail.value; await this.saveSettings(); },
    async toggleAchievementReminder(e) { this.achievementReminder = e.detail.value; await this.saveSettings(); },
    async loadSettings() {
      let settings = uni.getStorageSync('notificationSettings') || {};
      try { settings = { ...settings, ...(await getSettings()) }; } catch (error) { console.error('加载提醒设置失败:', error); }
      this.dailyReminder = Boolean(Number(settings.daily_reminder ?? (settings.dailyReminder !== false)));
      this.reminderTime = /^\d{2}:\d{2}$/.test(settings.reminder_time || settings.reminderTime || '') ? (settings.reminder_time || settings.reminderTime) : '08:00';
      this.reminderContentIndex = Math.max(0, Math.min(2, Number(settings.reminder_content ?? settings.reminderContentIndex ?? 0)));
      this.wordReminder = Boolean(Number(settings.word_reminder ?? (settings.wordReminder !== false)));
      this.progressReminder = Boolean(Number(settings.progress_reminder ?? (settings.progressReminder !== false)));
      this.achievementReminder = Boolean(Number(settings.achievement_reminder ?? (settings.achievementReminder !== false)));
      uni.setStorageSync('notificationSettings', this.localSettings());
    }
  },
  onLoad() { this.loadSettings(); },
};
</script>

<style>
.container {
	padding: 20rpx;
	background-color: #F7F5F0;
	min-height: 100vh;
}

.header {
	text-align: center;
	padding: 40rpx 0;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
}

.subtitle {
	font-size: 22rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 10rpx;
}

.section {
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-bottom: 20rpx;
	display: block;
}

.settings-list, .message-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.settings-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.settings-label {
	font-size: 28rpx;
	color: #333333;
}

.picker-value {
	display: flex;
	align-items: center;
}

.value-text {
	font-size: 26rpx;
	color: #7A7A7A;
	margin-right: 10rpx;
}

.picker-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}

.message-item {
	display: flex;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.message-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
}

.message-content {
	flex: 1;
}

.message-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.message-text {
	font-size: 22rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.message-time {
	font-size: 22rpx;
	color: #AAAAAA;
	display: block;
	margin-top: 10rpx;
}

.empty-state {
	text-align: center;
	padding: 40rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #7A7A7A;
}
</style>
