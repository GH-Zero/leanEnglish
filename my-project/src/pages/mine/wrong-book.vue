<template>
	<view class="container">
		<view class="header">
			<text class="title">错题本</text>
			<text class="subtitle">自动收集发音错误的单词</text>
		</view>

		<view class="filter-bar">
			<view class="filter-item" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">
				<text class="filter-text">全部</text>
			</view>
			<view class="filter-item" :class="{ active: currentFilter === 'phonetic' }" @click="setFilter('phonetic')">
				<text class="filter-text">发音错误</text>
			</view>
			<view class="filter-item" :class="{ active: currentFilter === 'spelling' }" @click="setFilter('spelling')">
				<text class="filter-text">拼写错误</text>
			</view>
		</view>

		<view class="word-list" v-if="wrongWords.length > 0">
			<view class="word-item" v-for="(word, index) in filteredWords" :key="index">
				<view class="word-main">
					<text class="word-english">{{ word.english }}</text>
					<text class="word-phonetic">{{ word.phonetic }}</text>
				</view>
				<view class="word-meaning">
					<text class="word-chinese">{{ word.chinese }}</text>
				</view>
				<view class="word-error">
					<text class="error-type">{{ word.errorType === 'phonetic' ? '发音错误' : '拼写错误' }}</text>
					<text class="error-count">错误{{ word.errorCount }}次</text>
				</view>
				<view class="word-actions">
					<text class="action-btn practice" @click="practiceWord(word)">重新练习</text>
					<text class="action-btn remove" @click="removeWord(index)">移除</text>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<text class="empty-icon">🎉</text>
			<text class="empty-text">暂无错题</text>
			<text class="empty-sub">继续保持，加油学习！</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentFilter: 'all',
			wrongWords: [
				{ english: 'beautiful', phonetic: '/ˈbjuːtɪfl/', chinese: '美丽的', errorType: 'phonetic', errorCount: 3 },
				{ english: 'restaurant', phonetic: '/ˈrestrɒnt/', chinese: '餐厅', errorType: 'spelling', errorCount: 2 },
				{ english: 'necessary', phonetic: '/ˈnesəsəri/', chinese: '必要的', errorType: 'spelling', errorCount: 4 },
				{ english: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', chinese: '环境', errorType: 'phonetic', errorCount: 2 },
			]
		}
	},
	computed: {
		filteredWords() {
			if (this.currentFilter === 'all') return this.wrongWords;
			return this.wrongWords.filter(w => w.errorType === this.currentFilter);
		}
	},
	methods: {
		setFilter(filter) {
			this.currentFilter = filter;
		},
		practiceWord(word) {
			uni.navigateTo({
				url: `/pages/word/index?practice=${word.english}`
			});
		},
		removeWord(index) {
			uni.showModal({
				title: '确认移除',
				content: '确定要将此单词从错题本中移除吗？',
				success: (res) => {
					if (res.confirm) {
						this.wrongWords.splice(index, 1);
						uni.showToast({ title: '已移除', icon: 'success' });
					}
				}
			});
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

.filter-bar {
	display: flex;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 10rpx;
	margin-bottom: 20rpx;
}

.filter-item {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	border-radius: 15rpx;
}

.filter-item.active {
	background-color: #1F3A5F;
}

.filter-text {
	font-size: 28rpx;
	color: #333333;
}

.filter-item.active .filter-text {
	color: #FFFFFF;
}

.word-list {
	margin-top: 20rpx;
}

.word-item {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.word-main {
	display: flex;
	align-items: baseline;
	margin-bottom: 10rpx;
}

.word-english {
	font-size: 36rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-right: 15rpx;
}

.word-phonetic {
	font-size: 26rpx;
	color: #7A7A7A;
}

.word-meaning {
	margin-bottom: 10rpx;
}

.word-chinese {
	font-size: 30rpx;
	color: #333333;
}

.word-error {
	display: flex;
	justify-content: space-between;
	margin-bottom: 15rpx;
}

.error-type {
	font-size: 24rpx;
	color: #E74C3C;
	background-color: #FDEDEC;
	padding: 5rpx 15rpx;
	border-radius: 10rpx;
}

.error-count {
	font-size: 24rpx;
	color: #7A7A7A;
}

.word-actions {
	display: flex;
	justify-content: flex-end;
	gap: 20rpx;
}

.action-btn {
	font-size: 26rpx;
	padding: 10rpx 25rpx;
	border-radius: 15rpx;
}

.action-btn.practice {
	background-color: #1F3A5F;
	color: #FFFFFF;
}

.action-btn.remove {
	background-color: #F0F0F0;
	color: #7A7A7A;
}

.empty-state {
	text-align: center;
	padding: 100rpx 0;
}

.empty-icon {
	font-size: 120rpx;
	display: block;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #333333;
	display: block;
}

.empty-sub {
	font-size: 26rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 10rpx;
}
</style>
