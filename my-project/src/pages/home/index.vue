<template>
	<view class="container">
		<view class="header">
			<text class="title">英语学习小程序</text>
			<text class="subtitle">从零基础到自由沟通</text>
		</view>
		
		<view class="stats-card">
			<view class="stat-item">
				<text class="stat-number">0</text>
				<text class="stat-label">连续学习天数</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">0</text>
				<text class="stat-label">已学单词</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">0</text>
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
			<text class="section-title">快捷入口</text>
			<view class="quick-entry">
				<view class="entry-item" @click="goToPage('/pages/learn/index')">
					<text class="entry-icon">🎯</text>
					<text class="entry-text">开始学习</text>
				</view>
				<view class="entry-item" @click="goToPage('/pages/speak/index')">
					<text class="entry-icon">🗣️</text>
					<text class="entry-text">AI对话</text>
				</view>
				<view class="entry-item" @click="goToPage('/pages/mine/index')">
					<text class="entry-icon">📊</text>
					<text class="entry-text">学习统计</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	methods: {
		goToPage(url) {
			// TabBar页面需要使用switchTab
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

.quick-entry {
	display: flex;
	justify-content: space-around;
}

.entry-item {
	text-align: center;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	width: 200rpx;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.entry-icon {
	font-size: 60rpx;
	display: block;
	margin-bottom: 10rpx;
}

.entry-text {
	font-size: 26rpx;
	color: #333333;
	display: block;
}
</style>