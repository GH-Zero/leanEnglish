<template>
	<view class="container">
		<view class="header">
			<text class="title">生词本</text>
			<text class="subtitle">收藏不认识的单词</text>
		</view>

		<view class="search-bar">
			<input class="search-input" placeholder="搜索单词..." v-model="searchText" @input="searchWords" />
		</view>

		<view class="word-list" v-if="filteredWords.length > 0">
			<view class="word-item" v-for="(word, index) in filteredWords" :key="index">
				<view class="word-main">
					<text class="word-english">{{ word.english }}</text>
					<text class="word-phonetic">{{ word.phonetic }}</text>
				</view>
				<view class="word-meaning">
					<text class="word-chinese">{{ word.chinese }}</text>
				</view>
				<view class="word-source">
					<text class="source-text">来源：{{ word.source }}</text>
					<text class="add-time">{{ word.addTime }}</text>
				</view>
				<view class="word-actions">
					<text class="action-btn listen" @click="listenWord(word)">🔊</text>
					<text class="action-btn remove" @click="removeWord(index)">移除</text>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<text class="empty-icon">📖</text>
			<text class="empty-text">暂无收藏单词</text>
			<text class="empty-sub">在学习过程中点击"收藏"添加单词</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			searchText: '',
			words: [
				{ english: 'ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', chinese: '无处不在的', source: '单词学习', addTime: '2026-07-24' },
				{ english: 'serendipity', phonetic: '/ˌserənˈdɪpəti/', chinese: '意外发现的美好事物', source: '阅读材料', addTime: '2026-07-23' },
				{ english: 'ephemeral', phonetic: '/ɪˈfemərəl/', chinese: '短暂的', source: '单词学习', addTime: '2026-07-22' },
			]
		}
	},
	computed: {
		filteredWords() {
			if (!this.searchText) return this.words;
			return this.words.filter(w => 
				w.english.toLowerCase().includes(this.searchText.toLowerCase()) ||
				w.chinese.includes(this.searchText)
			);
		}
	},
	methods: {
		searchWords() {
			// 搜索逻辑已在 computed 中处理
		},
		listenWord(word) {
			// 播放发音
			const audio = uni.createInnerAudioContext();
			audio.src = `https://dict.youdao.com/dictvoice?audio=${word.english}&type=1`;
			audio.play();
		},
		removeWord(index) {
			uni.showModal({
				title: '确认移除',
				content: '确定要将此单词从生词本中移除吗？',
				success: (res) => {
					if (res.confirm) {
						this.words.splice(index, 1);
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

.search-bar {
	margin-bottom: 20rpx;
}

.search-input {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 20rpx 30rpx;
	font-size: 30rpx;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
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

.word-source {
	display: flex;
	justify-content: space-between;
	margin-bottom: 15rpx;
}

.source-text {
	font-size: 24rpx;
	color: #7A7A7A;
}

.add-time {
	font-size: 24rpx;
	color: #7A7A7A;
}

.word-actions {
	display: flex;
	justify-content: flex-end;
	gap: 20rpx;
}

.action-btn {
	font-size: 32rpx;
	padding: 10rpx 25rpx;
	border-radius: 15rpx;
}

.action-btn.listen {
	background-color: #E8F4FC;
	color: #1F3A5F;
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
