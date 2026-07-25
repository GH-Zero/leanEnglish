<template>
	<view class="container">
		<view class="header">
			<text class="title">英语学习小程序</text>
			<text class="subtitle">从零基础到自由沟通</text>
		</view>

		<view class="stats-card">
			<view class="stat-item">
				<text class="stat-number">{{ stats.streakDays }}</text>
				<text class="stat-label">连续学习天数</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ stats.totalWordsLearned }}</text>
				<text class="stat-label">已学单词</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ stats.totalGrammarMastered }}</text>
				<text class="stat-label">语法掌握</text>
			</view>
		</view>

		<view class="section">
			<text class="section-title">今日学习任务</text>
			<view class="task-list">
				<view class="task-item" @click="goToPage('/pages/phonetic/index')">
					<text class="task-icon">📢</text>
					<text class="task-text">发音跟读</text>
					<text class="task-arrow">›</text>
				</view>
				<view class="task-item" @click="goToPage('/pages/word/index')">
					<text class="task-icon">📚</text>
					<text class="task-text">单词记忆</text>
					<text class="task-arrow">›</text>
				</view>
				<view class="task-item" @click="goToPage('/pages/grammar/index')">
					<text class="task-icon">📝</text>
					<text class="task-text">语法学习</text>
					<text class="task-arrow">›</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">每日闯关学习</text>
			<view class="challenge-list">
				<view class="challenge-item" @click="goToChallenge('word')">
					<view class="challenge-left">
						<text class="challenge-icon">🏆</text>
						<view class="challenge-info">
							<text class="challenge-title">每日单词闯关</text>
							<text class="challenge-desc">完成10个单词背诵挑战</text>
						</view>
					</view>
					<text class="challenge-arrow">›</text>
				</view>
				<view class="challenge-item" @click="goToChallenge('speak')">
					<view class="challenge-left">
						<text class="challenge-icon">🎤</text>
						<view class="challenge-info">
							<text class="challenge-title">口语挑战</text>
							<text class="challenge-desc">跟读3句标准发音</text>
						</view>
					</view>
					<text class="challenge-arrow">›</text>
				</view>
				<view class="challenge-item" @click="goToChallenge('grammar')">
					<view class="challenge-left">
						<text class="challenge-icon">📝</text>
						<view class="challenge-info">
							<text class="challenge-title">语法闯关</text>
							<text class="challenge-desc">掌握今日语法知识点</text>
						</view>
					</view>
					<text class="challenge-arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import {
	getLearningStats,
	getStreakData
} from '@/utils/api.js';

export default {
	data() {
		return {
			stats: {
				streakDays: 0,
				totalWordsLearned: 0,
				totalGrammarMastered: 0
			}
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				const [learningStats, streak] = await Promise.all([
					getLearningStats(),
					getStreakData()
				]);

				this.stats = {
					streakDays: streak ? streak.current_streak : 0,
					totalWordsLearned: learningStats ? learningStats.total_words_learned : 0,
					totalGrammarMastered: learningStats ? learningStats.total_grammar_mastered : 0
				};
			} catch (error) {
				console.error('加载数据失败:', error);
				this.loadLocalData();
			}
		},
		loadLocalData() {
			try {
				const stats = uni.getStorageSync('learningStats') || {};
				const streak = uni.getStorageSync('streakData') || {};
				this.stats = {
					streakDays: streak.currentStreak || 0,
					totalWordsLearned: stats.totalWordsLearned || 0,
					totalGrammarMastered: stats.totalGrammarMastered || 0
				};
			} catch (e) {
				console.error('读取本地数据失败:', e);
			}
		},
		goToPage(url) {
			const tabBarPages = ['/pages/home/index', '/pages/learn/index', '/pages/speak/index', '/pages/mine/index'];
			if (tabBarPages.includes(url)) {
				uni.switchTab({ url: url });
			} else {
				uni.navigateTo({ url: url });
			}
		},
		goToChallenge(type) {
			uni.navigateTo({ url: `/pages/challenge/index?type=${type}` });
		}
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

.task-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.task-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.task-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
}

.task-text {
	flex: 1;
	font-size: 30rpx;
	color: #333333;
}

.task-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}

.challenge-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.challenge-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.challenge-item:last-child {
	border-bottom: none;
}

.challenge-left {
	display: flex;
	align-items: center;
}

.challenge-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.challenge-info {
	display: flex;
	flex-direction: column;
}

.challenge-title {
	font-size: 30rpx;
	color: #333333;
	font-weight: bold;
}

.challenge-desc {
	font-size: 24rpx;
	color: #999999;
	margin-top: 8rpx;
}

.challenge-arrow {
	font-size: 36rpx;
	color: #CCCCCC;
}
</style>