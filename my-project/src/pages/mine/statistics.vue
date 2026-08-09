<template>
	<view class="container">
		<view class="header">
			<text class="title">学习统计</text>
			<text class="subtitle">查看你的学习数据</text>
		</view>

		<animated-loading v-if="loading" text="正在加载学习统计"></animated-loading>
		<template v-else>
		<view class="overview-card">
			<view class="overview-item">
				<text class="overview-number">{{ stats.totalDays }}</text>
				<text class="overview-label">累计学习天数</text>
			</view>
			<view class="overview-item">
				<text class="overview-number">{{ stats.currentStreak }}</text>
				<text class="overview-label">连续学习天数</text>
			</view>
			<view class="overview-item">
				<text class="overview-number">{{ stats.totalWords }}</text>
				<text class="overview-label">已学单词</text>
			</view>
			<view class="overview-item">
				<text class="overview-number">{{ stats.totalHours }}</text>
				<text class="overview-label">学习时长(h)</text>
			</view>
		</view>

		<view class="section">
			<text class="section-title">本周学习</text>
			<view class="chart-card">
				<view class="chart-bars">
					<view class="chart-bar-item" v-for="(day, index) in weekData" :key="day.date || index" :class="{ today: day.isToday }">
						<view class="bar" :style="{ height: day.height + 'rpx' }"></view>
						<text class="bar-label">{{ day.label }}</text>
						<text class="bar-value">{{ day.value }}分</text>
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">学习详情</text>
			<view class="detail-list">
				<view class="detail-item">
					<text class="detail-icon">📖</text>
					<text class="detail-text">单词学习</text>
					<text class="detail-value">{{ stats.wordsLearned }}个</text>
				</view>
				<view class="detail-item">
					<text class="detail-icon">📝</text>
					<text class="detail-text">语法练习</text>
					<text class="detail-value">{{ stats.grammarPractice }}次</text>
				</view>
				<view class="detail-item">
					<text class="detail-icon">🗣️</text>
					<text class="detail-text">口语练习</text>
					<text class="detail-value">{{ stats.speakPractice }}次</text>
				</view>
				<view class="detail-item">
					<text class="detail-icon">🎯</text>
					<text class="detail-text">练习正确率</text>
					<text class="detail-value">{{ stats.accuracy }}%</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">学习日历</text>
			<view class="calendar-card">
				<view class="calendar-header">
					<text class="month-arrow" @click="previousMonth">‹</text>
					<text class="calendar-month" @click="backToCurrentMonth">{{ calendarMonth }}</text>
					<text class="month-arrow" :class="{ disabled: !canGoNextMonth }" @click="nextMonth">›</text>
				</view>
				<view class="calendar-weekdays">
					<text v-for="label in ['一','二','三','四','五','六','日']" :key="label">{{ label }}</text>
				</view>
				<view class="calendar-grid">
					<view class="calendar-day" v-for="(day, index) in calendarDays" :key="index"
						:class="{ blank: !day, 'has-study': day && isStudyDay(day), 'today': day && isToday(day) }">
						<text class="day-text" v-if="day">{{ day }}</text>
					</view>
				</view>
			</view>
		</view>
		</template>
	</view>
</template>

<script>
import { getStudyStatistics } from '@/utils/api.js';
import { isFirstLoad } from '@/utils/first-load.js';

export default {
	data() {
		const firstLoad = isFirstLoad('pages/mine/statistics')
		return {
			loading: firstLoad,
			firstLoad,
			currentDate: new Date(),
			studyDates: [],
			stats: {
				totalDays: 0,
				currentStreak: 0,
				totalWords: 0,
				totalHours: '0',
				wordsLearned: 0,
				grammarPractice: 0,
				speakPractice: 0,
				accuracy: 0
			},
			weekData: []
		}
	},
	computed: {
		calendarMonth() { return `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`; },
		canGoNextMonth() { const now = new Date(); return this.currentDate.getFullYear() < now.getFullYear() || (this.currentDate.getFullYear() === now.getFullYear() && this.currentDate.getMonth() < now.getMonth()); },
		calendarDays() {
			const year = this.currentDate.getFullYear(); const month = this.currentDate.getMonth();
			const offset = (new Date(year, month, 1).getDay() + 6) % 7;
			const count = new Date(year, month + 1, 0).getDate();
			return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
		}
	},
	onShow() {
		this.loadStatistics();
	},
	methods: {
		previousMonth() { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1); },
		nextMonth() { if (this.canGoNextMonth) this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1); },
		backToCurrentMonth() { const now = new Date(); this.currentDate = new Date(now.getFullYear(), now.getMonth(), 1); },
		isToday(day) { const now = new Date(); return now.getFullYear() === this.currentDate.getFullYear() && now.getMonth() === this.currentDate.getMonth() && now.getDate() === day; },
		isStudyDay(day) { const year = this.currentDate.getFullYear(); const month = this.currentDate.getMonth(); return this.studyDates.some(value => { const date = new Date(value); return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day; }); },
		async loadStatistics() {
			try {
				const statistics = await getStudyStatistics();

				this.stats = {
					totalDays: statistics.totalDays || 0,
					currentStreak: statistics.currentStreak || 0,
					totalWords: statistics.totalWords || 0,
					totalHours: statistics.totalHours || '0',
					wordsLearned: statistics.wordsLearned || 0,
					grammarPractice: statistics.grammarPractice || 0,
					speakPractice: statistics.speakPractice || 0,
					accuracy: statistics.accuracy || 0
				};

				this.studyDates = statistics.studyDates || [];

				this.weekData = statistics.weekData || [];
			} catch (error) {
				console.error('加载统计数据失败:', error);
				this.loadLocalStatistics();
			} finally {
				this.loading = false;
			}
		},
		loadLocalStatistics() {
			try {
				const stats = uni.getStorageSync('learningStats') || {};
				const streak = uni.getStorageSync('streakData') || {};

				this.stats = {
					totalDays: Number(streak.totalStudyDays ?? streak.total_study_days ?? (streak.studyDates || streak.study_dates || []).length),
					currentStreak: Number(streak.currentStreak ?? streak.current_streak ?? 0),
					totalWords: stats.totalWordsLearned || 0,
					totalHours: ((stats.totalStudyMinutes || 0) / 60).toFixed(1),
					wordsLearned: stats.totalWordsLearned || 0,
					grammarPractice: stats.totalGrammarMastered || 0,
					speakPractice: stats.totalSpeakPractice || 0,
					accuracy: stats.accuracy || 0
				};

				this.studyDates = streak.studyDates || streak.study_dates || [];
			} catch (e) {
				console.error('读取本地数据失败:', e);
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
	box-sizing: border-box;
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

.overview-card {
	position: sticky;
	top: 12rpx;
	z-index: 5;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 28rpx 12rpx;
	background-color: #1F3A5F;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
}

.overview-item {
	text-align: center;
}

.overview-number {
	font-size: 56rpx;
	font-weight: bold;
	color: #FFFFFF;
	display: block;
}

.overview-label {
	font-size: 24rpx;
	color: #C8D3E6;
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

.chart-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.chart-bars {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	height: 200rpx;
	padding-top: 20rpx;
}

.chart-bar-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.chart-bar-item.today .bar { background-color: #0D9488; }

.bar {
	width: 40rpx;
	background-color: #1F3A5F;
	border-radius: 10rpx 10rpx 0 0;
	min-height: 0;
}

.bar-label {
	font-size: 22rpx;
	color: #7A7A7A;
	margin-top: 10rpx;
}

.bar-value {
	font-size: 20rpx;
	color: #1F3A5F;
	margin-top: 5rpx;
}

.detail-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.detail-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.detail-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
}

.detail-text {
	flex: 1;
	font-size: 28rpx;
	color: #333333;
}

.detail-value {
	font-size: 30rpx;
	font-weight: bold;
	color: #1F3A5F;
}

.calendar-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.calendar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.month-arrow {
	width: 64rpx;
	height: 58rpx;
	line-height: 54rpx;
	text-align: center;
	font-size: 44rpx;
	color: #1F3A5F;
	background: #F1F5F9;
	border-radius: 14rpx;
}

.month-arrow.disabled { opacity: .3; }

.calendar-month {
	font-size: 30rpx;
	font-weight: bold;
	color: #1F3A5F;
}

.calendar-weekdays {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	margin-bottom: 12rpx;
	text-align: center;
	color: #7A7A7A;
	font-size: 22rpx;
}
.calendar-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
}

.calendar-day {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background-color: #F0F0F0;
}

.calendar-day.blank { background: transparent; }

.calendar-day.has-study {
	background-color: #1F3A5F;
}

.calendar-day.today {
	border: 3rpx solid #E74C3C;
}

.day-text {
	font-size: 26rpx;
	color: #333333;
}

.calendar-day.has-study .day-text {
	color: #FFFFFF;
}
</style>
