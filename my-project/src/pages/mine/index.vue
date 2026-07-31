<template>
	<view class="container">
		<view class="header">
			<view class="user-info">
				<image class="avatar" :src="userProfile.avatar || '/static/logo.png'" mode="aspectFill"></image>
				<view class="user-details">
					<text class="username">{{ userProfile.nickname || '英语学习者' }}</text>
					<text class="user-level">{{ levelOptions[Number(userProfile.level ?? userProfile.levelIndex ?? 0)] || levelOptions[0] }}</text>
				</view>
			</view>
		</view>
		<text class="load-tip" v-if="loading">数据加载中...</text>
		<text class="load-tip error" v-else-if="loadError" @click="loadData">部分数据加载失败，当前显示可用数据，点击重试</text>
		
		<view class="stats-card">
			<view class="stat-item">
				<text class="stat-number">{{ stats.streakDays }}</text>
				<text class="stat-label">连续学习</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ stats.totalWordsLearned }}</text>
				<text class="stat-label">已学单词</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ studyHours }}</text>
				<text class="stat-label">学习时长(h)</text>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">学习工具</text>
			<view class="tool-list">
				<view class="tool-item" @click="goToPage('/pages/mine/wrong-book')">
					<text class="tool-icon">📝</text>
					<text class="tool-text">错题本</text>
					<text class="tool-arrow">›</text>
				</view>
				<view class="tool-item" @click="goToPage('/pages/mine/word-book')">
					<text class="tool-icon">🔎</text>
					<text class="tool-text">单词词典</text>
					<text class="tool-arrow">›</text>
				</view>
				<view class="tool-item" @click="goToPage('/pages/mine/statistics')">
					<text class="tool-icon">📊</text>
					<text class="tool-text">学习统计</text>
					<text class="tool-arrow">›</text>
				</view>
				<view class="tool-item" @click="goToPage('/pages/mine/achievement')">
					<text class="tool-icon">🏆</text>
					<text class="tool-text">成就系统</text>
					<text class="tool-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">设置</text>
			<view class="settings-list">
				<view class="settings-item" @click="goToPage('/pages/mine/settings')">
					<text class="settings-icon">⚙️</text>
					<text class="settings-text">学习设置</text>
					<text class="settings-arrow">›</text>
				</view>
				<view class="settings-item" @click="goToPage('/pages/mine/notification')">
					<text class="settings-icon">🔔</text>
					<text class="settings-text">消息提醒</text>
					<text class="settings-arrow">›</text>
				</view>
				<view class="settings-item" @click="goToPage('/pages/mine/profile')">
					<text class="settings-icon">👤</text>
					<text class="settings-text">个人信息</text>
					<text class="settings-arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getLearningStats, getStreakData, getUserProfile } from '@/utils/api.js';

export default {
	data() {
		return {
			loading: false,
			loadError: false,
			stats: {
				streakDays: 0,
				totalWordsLearned: 0,
				totalStudyMinutes: 0
			},
			studyHours: '0.0',
			userProfile: {
				nickname: '英语学习者',
				avatar: '/static/logo.png',
				level: 0
			},
			levelOptions: ['零基础入门', '初级水平', '中级水平', '高级水平']
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			this.loading = true;
			this.loadError = false;
			const [statsResult, streakResult, profileResult] = await Promise.allSettled([
				getLearningStats(), getStreakData(), getUserProfile()
			]);
			const local = this.getLocalData();
			const learningStats = statsResult.status === 'fulfilled' ? statsResult.value : local.stats;
			const streak = streakResult.status === 'fulfilled' ? streakResult.value : local.streak;
			const profile = profileResult.status === 'fulfilled' ? profileResult.value : local.profile;
			this.loadError = [statsResult, streakResult, profileResult].some(item => item.status === 'rejected');
			this.stats = {
				streakDays: Number(streak?.current_streak ?? streak?.currentStreak ?? 0),
				totalWordsLearned: Number(learningStats?.total_words_learned ?? learningStats?.totalWordsLearned ?? 0),
				totalStudyMinutes: Number(learningStats?.total_study_minutes ?? learningStats?.totalStudyMinutes ?? 0)
			};
			this.studyHours = (this.stats.totalStudyMinutes / 60).toFixed(1);
			this.userProfile = { nickname: '英语学习者', avatar: '/static/logo.png', level: 0, ...(profile || {}) };
			this.loading = false;
		},
		getLocalData() {
			return {
				stats: uni.getStorageSync('learningStats') || {},
				streak: uni.getStorageSync('streakData') || {},
				profile: uni.getStorageSync('userProfile') || {}
			};
		},
		loadLocalData() {
			try {
				const stats = uni.getStorageSync('learningStats') || {};
				const streak = uni.getStorageSync('streakData') || {};
				const profile = uni.getStorageSync('userProfile') || {};

				this.stats = {
					streakDays: streak.currentStreak || 0,
					totalWordsLearned: stats.totalWordsLearned || 0,
					totalStudyMinutes: stats.totalStudyMinutes || 0
				};

				this.studyHours = (this.stats.totalStudyMinutes / 60).toFixed(1);
				this.userProfile = profile;
			} catch (e) {
				console.error('读取本地数据失败:', e);
			}
		},
		goToPage(url) {
			const tabBarPages = ['/pages/home/index', '/pages/learn/index', '/pages/speak/index', '/pages/mine/index'];
			if (tabBarPages.includes(url)) {
				uni.switchTab({
					url: url
				});
			} else {
				uni.navigateTo({
					url: url
				});
			}
		}
	}
}
</script>

<style>
.container {
	padding: 20rpx;
	padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	background-color: #F7F5F0;
	min-height: 100vh;
}

.load-tip { display: block; text-align: center; color: #7A7A7A; font-size: 24rpx; margin: 12rpx 0; }
.load-tip.error { color: #C24141; }

.header {
	background-color: #1F3A5F;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 20rpx;
}

.user-info {
	display: flex;
	align-items: center;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	margin-right: 30rpx;
}

.user-details {
	flex: 1;
}

.username {
	font-size: 36rpx;
	font-weight: bold;
	color: #FFFFFF;
	display: block;
}

.user-level {
	font-size: 28rpx;
	color: #C8D3E6;
	display: block;
	margin-top: 10rpx;
}

.stats-card {
	display: flex;
	justify-content: space-around;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin: 20rpx 0;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.stat-item {
	text-align: center;
}

.stat-number {
	font-size: 48rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
}

.stat-label {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
}

.section {
	margin: 30rpx 0;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-bottom: 20rpx;
	display: block;
}

.tool-list, .settings-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.tool-item, .settings-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.tool-icon, .settings-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
}

.tool-text, .settings-text {
	flex: 1;
	font-size: 30rpx;
	color: #333333;
}

.tool-arrow, .settings-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}
</style>