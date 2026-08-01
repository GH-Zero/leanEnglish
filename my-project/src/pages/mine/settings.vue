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
					<text class="settings-label">每日语法练习</text>
					<view class="settings-value">
						<text class="value-text">{{ dailyGrammarQuestions }}题</text>
						<slider class="settings-slider" :value="dailyGrammarQuestions" :min="5" :max="30" :step="5" @change="changeDailyGrammarQuestions" activeColor="#1F3A5F" />
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
import { getSettings, updateSettings, resetLearningProgress } from '@/utils/api.js';
export default {
	data() {
		return {
			dailyNewWords: 20,
			dailyGrammarQuestions: 10,
			difficultyOptions: ['循序渐进（推荐）', '固定简单', '固定普通', '固定困难'],
			difficultyIndex: 0,
			accentOptions: ['美式发音', '英式发音'],
			accentIndex: 0,
			autoPlay: true,
			darkMode: false,
			fontSizeOptions: ['小', '中', '大'],
			fontSizeIndex: 1,
			cacheSize: '计算中'
		}
	},
	methods: {
		changeDailyNewWords(e) {
			this.dailyNewWords = e.detail.value;
			this.saveSettings();
		},
		changeDailyGrammarQuestions(e) {
			this.dailyGrammarQuestions = Number(e.detail.value);
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
		calculateCacheSize() {
			try {
				const info = uni.getStorageInfoSync();
				this.cacheSize = info.currentSize >= 1024 ? (info.currentSize / 1024).toFixed(1) + 'MB' : info.currentSize + 'KB';
			} catch (_) { this.cacheSize = '未知'; }
		},
		clearCache() {
			uni.showModal({ title: '清除缓存', content: '仅清除可重新获取的页面缓存，不会删除学习进度和个人设置。', success: (res) => {
				if (!res.confirm) return;
				['learningStats', 'streakData', 'userProfile'].forEach(key => uni.removeStorageSync(key));
				this.calculateCacheSize();
				uni.showToast({ title: '缓存已清除', icon: 'success' });
			} });
		},
		resetProgress() {
			uni.showModal({ title: '重置学习进度', content: '将永久清空单词、语法、音标、口语、错题、统计和成就进度，设置与个人资料会保留。此操作不可恢复。', confirmColor: '#D93025', success: async (res) => {
				if (!res.confirm) return;
				try {
					uni.showLoading({ title: '正在重置...' });
					await resetLearningProgress();
					['wordStatus','grammarProgress','grammar_done','grammar_wrong','speakHistory','phoneticProgress','learningStats','streakData','pendingStudySeconds'].forEach(key => uni.removeStorageSync(key));
					uni.hideLoading(); this.calculateCacheSize();
					uni.showToast({ title: '学习进度已重置', icon: 'success' });
				} catch (error) {
					uni.hideLoading(); console.error('重置学习进度失败:', error);
					uni.showToast({ title: '重置失败，请稍后重试', icon: 'none' });
				}
			} });
		},
		async saveSettings() {
			const local = {
				dailyNewWords: this.dailyNewWords,
				dailyGrammarQuestions: this.dailyGrammarQuestions,
				difficultyIndex: this.difficultyIndex, accentIndex: this.accentIndex,
				autoPlay: this.autoPlay, darkMode: this.darkMode, fontSizeIndex: this.fontSizeIndex
			};
			uni.setStorageSync('learningSettings', local);
			try {
				await updateSettings({
					daily_new_words: this.dailyNewWords,
					daily_grammar_questions: this.dailyGrammarQuestions,
					difficulty: this.difficultyIndex, accent: this.accentIndex,
					auto_play: this.autoPlay ? 1 : 0, dark_mode: this.darkMode ? 1 : 0,
					font_size: this.fontSizeIndex
				});
			} catch (error) {
				console.error('同步学习设置失败:', error);
				uni.showToast({ title: '设置已保存到本机', icon: 'none' });
			}
		},
		async loadSettings() {
			let settings = uni.getStorageSync('learningSettings') || {};
			try { settings = { ...settings, ...(await getSettings()) }; } catch (error) { console.error('加载学习设置失败:', error); }
			this.dailyNewWords = Number(settings.daily_new_words ?? settings.dailyNewWords ?? 20);
			this.dailyGrammarQuestions = Math.max(5, Math.min(30, Number(settings.daily_grammar_questions ?? settings.dailyGrammarQuestions ?? 10)));
			this.difficultyIndex = Math.max(0, Math.min(3, Number(settings.difficulty ?? settings.difficultyIndex ?? 0)));
			this.accentIndex = Number(settings.accent ?? settings.accentIndex ?? 0);
			this.autoPlay = Boolean(Number(settings.auto_play ?? (settings.autoPlay !== false)));
			this.darkMode = Boolean(Number(settings.dark_mode ?? settings.darkMode ?? 0));
			this.fontSizeIndex = Number(settings.font_size ?? settings.fontSizeIndex ?? 1);
		}
	},
	onShow() {
		this.loadSettings();
		this.calculateCacheSize();
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
	font-size: 28rpx;
	color: #333333;
}

.settings-value {
	display: flex;
	align-items: center;
}

.value-text {
	font-size: 26rpx;
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
