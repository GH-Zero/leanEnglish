<template>
	<view class="container">
		<view class="header">
			<text class="title">口语练习</text>
		</view>
		
		<view class="section">
			<text class="section-title">影子跟读</text>
			<view class="feature-card" @click="goToPage('/pages/phonetic/index')">
				<view class="feature-icon">📢</view>
				<view class="feature-info">
					<text class="feature-name">音标跟读</text>
					<text class="feature-desc">48个英美音标逐个教学，AI发音评估</text>
				</view>
				<text class="feature-arrow">›</text>
			</view>
			<view class="feature-card" @click="goToPage('/pages/word/index')">
				<view class="feature-icon">📖</view>
				<view class="feature-info">
					<text class="feature-name">单词跟读</text>
					<text class="feature-desc">标准发音，波形对比，错音标注</text>
				</view>
				<text class="feature-arrow">›</text>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">AI情景对话</text>
			<view class="dialogue-list">
				<view class="dialogue-item" @click="goToPage('/pages/dialogue/index')">
					<view class="dialogue-icon">🍽️</view>
					<view class="dialogue-info">
						<text class="dialogue-name">餐厅点餐</text>
						<text class="dialogue-desc">模拟在餐厅点餐的对话场景</text>
					</view>
					<text class="dialogue-arrow">›</text>
				</view>
				<view class="dialogue-item" @click="goToPage('/pages/dialogue/index')">
					<view class="dialogue-icon">🗺️</view>
					<view class="dialogue-info">
						<text class="dialogue-name">问路指路</text>
						<text class="dialogue-desc">模拟问路和指路的对话场景</text>
					</view>
					<text class="dialogue-arrow">›</text>
				</view>
				<view class="dialogue-item" @click="goToPage('/pages/dialogue/index')">
					<view class="dialogue-icon">🛒</view>
					<view class="dialogue-info">
						<text class="dialogue-name">购物消费</text>
						<text class="dialogue-desc">模拟购物和讨价还价的对话场景</text>
					</view>
					<text class="dialogue-arrow">›</text>
				</view>
				<view class="dialogue-item" @click="goToPage('/pages/dialogue/index')">
					<view class="dialogue-icon">💼</view>
					<view class="dialogue-info">
						<text class="dialogue-name">职场寒暄</text>
						<text class="dialogue-desc">模拟职场交流的对话场景</text>
					</view>
					<text class="dialogue-arrow">›</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">跟读历史</text>
			<view class="empty-state">
				<text class="empty-icon">📝</text>
				<text class="empty-text">暂无跟读记录</text>
				<text class="empty-hint">开始跟读练习，记录你的学习历程</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	methods: {
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

.feature-card {
	display: flex;
	align-items: center;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.feature-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.feature-info {
	flex: 1;
}

.feature-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.feature-desc {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.feature-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}

.dialogue-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.dialogue-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.dialogue-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.dialogue-info {
	flex: 1;
}

.dialogue-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.dialogue-desc {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.dialogue-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}

.empty-state {
	text-align: center;
	padding: 60rpx 0;
	background-color: #FFFFFF;
	border-radius: 20rpx;
}

.empty-icon {
	font-size: 80rpx;
	display: block;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #333333;
	display: block;
	margin-bottom: 10rpx;
}

.empty-hint {
	font-size: 26rpx;
	color: #7A7A7A;
	display: block;
}
</style>