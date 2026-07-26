<template>
	<view class="container">
		<view class="header">
			<text class="title">学习中心</text>
		</view>
		
		<view class="search-bar">
			<input class="search-input" placeholder="搜索课程、单词、语法点" />
		</view>
		
		<view class="section">
			<text class="section-title">课程分类</text>
			<view class="course-list">
				<view class="course-item" @click="goToPage('/pages/phonetic/index')">
					<view class="course-icon">📢</view>
					<view class="course-info">
						<text class="course-name">音标课程</text>
						<text class="course-desc">48个英美音标逐个教学</text>
					</view>
					<text class="course-arrow">›</text>
				</view>
				<view class="course-item" @click="goToPage('/pages/word/index')">
					<view class="course-icon">📚</view>
					<view class="course-info">
						<text class="course-name">单词词库</text>
						<text class="course-desc">分级词库，科学记忆</text>
					</view>
					<text class="course-arrow">›</text>
				</view>
				<view class="course-item" @click="goToPage('/pages/grammar/index')">
					<view class="course-icon">📝</view>
					<view class="course-info">
						<text class="course-name">语法课程</text>
						<text class="course-desc">三阶段语法体系</text>
					</view>
					<text class="course-arrow">›</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">学习进度</text>
			<view class="progress-card">
				<view class="progress-item">
					<text class="progress-label">音标掌握</text>
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: phoneticPercent + '%' }"></view>
					</view>
					<text class="progress-percent">{{ phoneticPercent }}%</text>
				</view>
				<view class="progress-item">
					<text class="progress-label">单词积累</text>
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: wordPercent + '%' }"></view>
					</view>
					<text class="progress-percent">{{ wordPercent }}%</text>
				</view>
				<view class="progress-item">
					<text class="progress-label">语法掌握</text>
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: grammarPercent + '%' }"></view>
					</view>
					<text class="progress-percent">{{ grammarPercent }}%</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getLearningStats, getWordStatus } from '@/utils/api.js';

export default {
	data() {
		return {
			phoneticPercent: 0,
			wordPercent: 0,
			grammarPercent: 0
		}
	},
	onShow() {
		this.loadProgress();
	},
	methods: {
		async loadProgress() {
			try {
				// 音标进度
				const phoneticProgress = uni.getStorageSync('phoneticProgress') || {};
				const phoneticKeys = Object.keys(phoneticProgress);
				const phoneticMastered = phoneticKeys.filter(k => phoneticProgress[k] && phoneticProgress[k].mastered).length;
				this.phoneticPercent = phoneticKeys.length > 0 ? Math.round((phoneticMastered / 48) * 100) : 0;

				// 单词进度
				try {
					const wordStatus = await getWordStatus();
					if (wordStatus) {
						const totalWords = Object.keys(wordStatus).length;
						const masteredWords = Object.keys(wordStatus).filter(k => wordStatus[k].mastered).length;
						this.wordPercent = totalWords > 0 ? Math.round((masteredWords / Math.max(totalWords, 50)) * 100) : 0;
					}
				} catch (e) {
					const localWordStatus = uni.getStorageSync('wordStatus') || {};
					const totalWords = Object.keys(localWordStatus).length;
					this.wordPercent = totalWords > 0 ? Math.min(100, Math.round((totalWords / 50) * 100)) : 0;
				}

				// 语法进度
				const grammarProgress = uni.getStorageSync('grammarProgress') || {};
				const grammarKeys = Object.keys(grammarProgress);
				const grammarLearned = grammarKeys.filter(k => grammarProgress[k] && grammarProgress[k].status === '已学习').length;
				const totalGrammarPoints = 15; // 总语法点数
				this.grammarPercent = grammarKeys.length > 0 ? Math.round((grammarLearned / totalGrammarPoints) * 100) : 0;
			} catch (e) {
				console.error('加载进度失败:', e);
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
	background-color: #F7F5F0;
	min-height: 100vh;
}

.header {
	text-align: center;
	padding: 20rpx 0;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
}

.search-bar {
	margin: 20rpx 0;
}

.search-input {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 20rpx;
	font-size: 28rpx;
	box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
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

.course-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.course-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.course-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.course-info {
	flex: 1;
}

.course-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.course-desc {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.course-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}

.progress-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
}

.progress-item {
	margin-bottom: 20rpx;
}

.progress-item:last-child {
	margin-bottom: 0;
}

.progress-label {
	font-size: 28rpx;
	color: #333333;
	display: block;
	margin-bottom: 10rpx;
}

.progress-bar {
	height: 20rpx;
	background-color: #F0F0F0;
	border-radius: 10rpx;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background-color: #0D9488;
	border-radius: 10rpx;
}

.progress-percent {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	text-align: right;
	margin-top: 5rpx;
}
</style>