<template>
	<view class="container">
		<view class="header">
			<text class="title">学习统计</text>
			<text class="subtitle">查看你的学习数据</text>
		</view>

		<view class="overview-card">
			<view class="overview-item">
				<text class="overview-number">{{ stats.totalDays }}</text>
				<text class="overview-label">学习天数</text>
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
					<view class="chart-bar-item" v-for="(day, index) in weekData" :key="index">
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
					<text class="detail-text">发音准确率</text>
					<text class="detail-value">{{ stats.accuracy }}%</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">学习日历</text>
			<view class="calendar-card">
				<view class="calendar-header">
					<text class="calendar-month">2026年7月</text>
				</view>
				<view class="calendar-grid">
					<view class="calendar-day" v-for="day in 31" :key="day"
						:class="{ 'has-study': studyDays.includes(day), 'today': day === today }">
						<text class="day-text">{{ day }}</text>
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
			today: 24,
			studyDays: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24],
			stats: {
				totalDays: 21,
				totalWords: 156,
				totalHours: 18.5,
				wordsLearned: 156,
				grammarPractice: 42,
				speakPractice: 28,
				accuracy: 78
			},
			weekData: [
				{ label: '周一', value: 45, height: 90 },
				{ label: '周二', value: 60, height: 120 },
				{ label: '周三', value: 30, height: 60 },
				{ label: '周四', value: 75, height: 150 },
				{ label: '周五', value: 50, height: 100 },
				{ label: '周六', value: 80, height: 160 },
				{ label: '周日', value: 40, height: 80 },
			]
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

.overview-card {
	display: flex;
	justify-content: space-around;
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

.bar {
	width: 40rpx;
	background-color: #1F3A5F;
	border-radius: 10rpx 10rpx 0 0;
	min-height: 10rpx;
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
	font-size: 30rpx;
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
	text-align: center;
	margin-bottom: 20rpx;
}

.calendar-month {
	font-size: 30rpx;
	font-weight: bold;
	color: #1F3A5F;
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
