<template>
	<view class="container">
		<view class="header">
			<text class="title">学习设置</text>
			<text class="subtitle">个性化你的学习体验</text>
		</view>

		<view class="section">
			<text class="section-title">学习计划</text>
			<view class="settings-list">
				<view class="settings-item">
					<text class="settings-label">每日新词数量</text>
					<view class="settings-value">
						<text class="value-text">{{ dailyNewWords }}个</text>
						<slider class="settings-slider" :value="dailyNewWords" :min="5" :max="50" :step="5"
							@change="changeDailyNewWords" activeColor="#1F3A5F" />
					</view>
				</view>
				<view class="settings-item">
					<text class="settings-label">每日复习数量</text>
					<view class="settings-value">
						<text class="value-text">{{ dailyReviewWords }}个</text>
						<slider class="settings-slider" :value="dailyReviewWords" :min="10" :max="100" :step="10"
							@change="changeDailyReviewWords" activeColor="#1F3A5F" />
					</view>
				</view>
				<view class="settings-item">
					<text class="settings-label">学习难度</text>
					<picker :range="difficultyOptions" :value="difficultyIndex" @change="changeDifficulty">
						<view class="picker-value">
							<text class="value-text">{{ difficultyOptions[difficultyIndex] }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">发音设置</text>
			<view class="settings-list">
				<view class="settings-item">
					<text class="settings-label">发音偏好</text>
					<picker :range="accentOptions" :value="accentIndex" @change="changeAccent">
						<view class="picker-value">
							<text class="value-text">{{ accentOptions[accentIndex] }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
				<view class="settings-item">
					<text class="settings-label">自动播放发音</text>
					<switch :checked="autoPlay" @change="toggleAutoPlay" color="#1F3A5F" />
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">界面设置</text>
			<view class="settings-list">
				<view class="settings-item">
					<text class="settings-label">深色模式</text>
					<switch :checked="darkMode" @change="toggleDarkMode" color="#1F3A5F" />
				</view>
				<view class="settings-item">
					<text class="settings-label">字体大小</text>
					<picker :range="fontSizeOptions" :value="fontSizeIndex" @change="changeFontSize">
						<view class="picker-value">
							<text class="value-text">{{ fontSizeOptions[fontSizeIndex] }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">其他</text>
			<view class="settings-list">
				<view class="settings-item" @click="clearCache">
					<text class="settings-label">清除缓存</text>
					<view class="settings-value">
						<text class="value-text">{{ cacheSize }}</text>
						<text class="picker-arrow">›</text>
					</view>
				</view>
				<view class="settings-item" @click="resetProgress">
					<text class="settings-label">重置学习进度</text>
					<view class="settings-value">
						<text class="picker-arrow">›</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			dailyNewWords: 20,
			dailyReviewWords: 50,
			difficultyOptions: ['简单', '普通', '困难'],
			difficultyIndex: 1,
			accentOptions: ['美式发音', '英式发音'],
			accentIndex: 0,
			autoPlay: true,
			darkMode: false,
			fontSizeOptions: ['小', '中', '大'],
			fontSizeIndex: 1,
			cacheSize: '12.5MB'
		}
	},
	methods: {
		changeDailyNewWords(e) {
			this.dailyNewWords = e.detail.value;
			this.saveSettings();
		},
		changeDailyReviewWords(e) {
			this.dailyReviewWords = e.detail.value;
			this.saveSettings();
		},
		changeDifficulty(e) {
			this.difficultyIndex = e.detail.value;
			this.saveSettings();
		},
		changeAccent(e) {
			this.accentIndex = e.detail.value;
			this.saveSettings();
		},
		toggleAutoPlay(e) {
			this.autoPlay = e.detail.value;
			this.saveSettings();
		},
		toggleDarkMode(e) {
			this.darkMode = e.detail.value;
			this.saveSettings();
		},
		changeFontSize(e) {
			this.fontSizeIndex = e.detail.value;
			this.saveSettings();
		},
		clearCache() {
			uni.showModal({
				title: '清除缓存',
				content: '确定要清除所有缓存数据吗？',
				success: (res) => {
					if (res.confirm) {
						uni.clearStorageSync();
						this.cacheSize = '0MB';
						uni.showToast({ title: '清除成功', icon: 'success' });
					}
				}
			});
		},
		resetProgress() {
			uni.showModal({
				title: '重置进度',
				content: '确定要重置所有学习进度吗？此操作不可恢复！',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('wordStatus');
						uni.removeStorageSync('grammarProgress');
						uni.removeStorageSync('speakHistory');
						uni.showToast({ title: '已重置', icon: 'success' });
					}
				}
			});
		},
		saveSettings() {
			const settings = {
				dailyNewWords: this.dailyNewWords,
				dailyReviewWords: this.dailyReviewWords,
				difficultyIndex: this.difficultyIndex,
				accentIndex: this.accentIndex,
				autoPlay: this.autoPlay,
				darkMode: this.darkMode,
				fontSizeIndex: this.fontSizeIndex
			};
			uni.setStorageSync('learningSettings', settings);
		},
		loadSettings() {
			const settings = uni.getStorageSync('learningSettings');
			if (settings) {
				this.dailyNewWords = settings.dailyNewWords || 20;
				this.dailyReviewWords = settings.dailyReviewWords || 50;
				this.difficultyIndex = settings.difficultyIndex || 1;
				this.accentIndex = settings.accentIndex || 0;
				this.autoPlay = settings.autoPlay !== false;
				this.darkMode = settings.darkMode || false;
				this.fontSizeIndex = settings.fontSizeIndex || 1;
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

.settings-list {
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

.settings-value {
	display: flex;
	align-items: center;
}

.value-text {
	font-size: 28rpx;
	color: #7A7A7A;
	margin-right: 10rpx;
}

.settings-slider {
	width: 300rpx;
}

.picker-value {
	display: flex;
	align-items: center;
}

.picker-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}
</style>
