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

		<view class="section">
			<text class="section-title">免打扰时段</text>
			<view class="settings-list">
				<view class="settings-item">
					<text class="settings-label">开启免打扰</text>
					<switch :checked="doNotDisturb" @change="toggleDoNotDisturb" color="#1F3A5F" />
				</view>
				<view class="settings-item" v-if="doNotDisturb">
					<text class="settings-label">开始时间</text>
					<picker mode="time" :value="dndStart" @change="changeDndStart">
						<view class="picker-value">
							<text class="value-text">{{ dndStart }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
				<view class="settings-item" v-if="doNotDisturb">
					<text class="settings-label">结束时间</text>
					<picker mode="time" :value="dndEnd" @change="changeDndEnd">
						<view class="picker-value">
							<text class="value-text">{{ dndEnd }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">消息记录</text>
			<view class="message-list" v-if="messages.length > 0">
				<view class="message-item" v-for="(msg, index) in messages" :key="index">
					<view class="message-icon">{{ msg.icon }}</view>
					<view class="message-content">
						<text class="message-title">{{ msg.title }}</text>
						<text class="message-text">{{ msg.content }}</text>
						<text class="message-time">{{ msg.time }}</text>
					</view>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-text">暂无消息</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			dailyReminder: true,
			reminderTime: '08:00',
			reminderContentOptions: ['学习提醒', '温馨提醒', '激励提醒'],
			reminderContentIndex: 0,
			wordReminder: true,
			progressReminder: true,
			achievementReminder: true,
			doNotDisturb: true,
			dndStart: '22:00',
			dndEnd: '07:00',
			messages: [
				{ icon: '📢', title: '学习提醒', content: '今天还没有学习哦，快来背单词吧！', time: '2026-07-24 08:00' },
				{ icon: '🏆', title: '成就解锁', content: '恭喜你解锁"三天连续"徽章！', time: '2026-07-23 20:30' },
				{ icon: '📚', title: '复习提醒', content: '有15个单词需要复习，不要忘记了！', time: '2026-07-23 14:00' },
			]
		}
	},
	methods: {
		toggleDailyReminder(e) {
			this.dailyReminder = e.detail.value;
			this.saveSettings();
			if (this.dailyReminder) {
				uni.showToast({ title: '已开启每日提醒', icon: 'success' });
			} else {
				uni.showToast({ title: '已关闭每日提醒', icon: 'none' });
			}
		},
		changeReminderTime(e) {
			this.reminderTime = e.detail.value;
			this.saveSettings();
		},
		changeReminderContent(e) {
			this.reminderContentIndex = e.detail.value;
			this.saveSettings();
		},
		toggleWordReminder(e) {
			this.wordReminder = e.detail.value;
			this.saveSettings();
		},
		toggleProgressReminder(e) {
			this.progressReminder = e.detail.value;
			this.saveSettings();
		},
		toggleAchievementReminder(e) {
			this.achievementReminder = e.detail.value;
			this.saveSettings();
		},
		toggleDoNotDisturb(e) {
			this.doNotDisturb = e.detail.value;
			this.saveSettings();
		},
		changeDndStart(e) {
			this.dndStart = e.detail.value;
			this.saveSettings();
		},
		changeDndEnd(e) {
			this.dndEnd = e.detail.value;
			this.saveSettings();
		},
		saveSettings() {
			const settings = {
				dailyReminder: this.dailyReminder,
				reminderTime: this.reminderTime,
				reminderContentIndex: this.reminderContentIndex,
				wordReminder: this.wordReminder,
				progressReminder: this.progressReminder,
				achievementReminder: this.achievementReminder,
				doNotDisturb: this.doNotDisturb,
				dndStart: this.dndStart,
				dndEnd: this.dndEnd
			};
			uni.setStorageSync('notificationSettings', settings);
		},
		loadSettings() {
			const settings = uni.getStorageSync('notificationSettings');
			if (settings) {
				this.dailyReminder = settings.dailyReminder !== false;
				this.reminderTime = settings.reminderTime || '08:00';
				this.reminderContentIndex = settings.reminderContentIndex || 0;
				this.wordReminder = settings.wordReminder !== false;
				this.progressReminder = settings.progressReminder !== false;
				this.achievementReminder = settings.achievementReminder !== false;
				this.doNotDisturb = settings.doNotDisturb !== false;
				this.dndStart = settings.dndStart || '22:00';
				this.dndEnd = settings.dndEnd || '07:00';
			}
		}
	},
	onLoad() {
		this.loadSettings();
	}
}
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
	font-size: 48rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
}

.subtitle {
	font-size: 28rpx;
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
	font-size: 30rpx;
	color: #333333;
}

.picker-value {
	display: flex;
	align-items: center;
}

.value-text {
	font-size: 28rpx;
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
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.message-text {
	font-size: 26rpx;
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
