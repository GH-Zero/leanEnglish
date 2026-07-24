<template>
	<view class="container">
		<view class="header">
			<text class="title">成就系统</text>
			<text class="subtitle">解锁徽章，记录你的成长</text>
		</view>

		<view class="stats-bar">
			<view class="stats-item">
				<text class="stats-number">{{ unlockedCount }}</text>
				<text class="stats-label">已解锁</text>
			</view>
			<view class="stats-item">
				<text class="stats-number">{{ totalCount }}</text>
				<text class="stats-label">总徽章</text>
			</view>
			<view class="stats-item">
				<text class="stats-number">{{ progress }}%</text>
				<text class="stats-label">完成度</text>
			</view>
		</view>

		<view class="section">
			<text class="section-title">学习成就</text>
			<view class="badge-list">
				<view class="badge-item" v-for="(badge, index) in learningBadges" :key="index"
					:class="{ 'unlocked': badge.unlocked }">
					<view class="badge-icon">{{ badge.icon }}</view>
					<view class="badge-info">
						<text class="badge-name">{{ badge.name }}</text>
						<text class="badge-desc">{{ badge.description }}</text>
						<view class="badge-progress" v-if="!badge.unlocked">
							<view class="progress-bar">
								<view class="progress-fill" :style="{ width: badge.progress + '%' }"></view>
							</view>
							<text class="progress-text">{{ badge.progress }}%</text>
						</view>
					</view>
					<view class="badge-status">
						<text class="status-icon" v-if="badge.unlocked">✅</text>
						<text class="status-icon" v-else>🔒</text>
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">连续学习</text>
			<view class="badge-list">
				<view class="badge-item" v-for="(badge, index) in streakBadges" :key="index"
					:class="{ 'unlocked': badge.unlocked }">
					<view class="badge-icon">{{ badge.icon }}</view>
					<view class="badge-info">
						<text class="badge-name">{{ badge.name }}</text>
						<text class="badge-desc">{{ badge.description }}</text>
					</view>
					<view class="badge-status">
						<text class="status-icon" v-if="badge.unlocked">✅</text>
						<text class="status-icon" v-else>🔒</text>
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">特殊成就</text>
			<view class="badge-list">
				<view class="badge-item" v-for="(badge, index) in specialBadges" :key="index"
					:class="{ 'unlocked': badge.unlocked }">
					<view class="badge-icon">{{ badge.icon }}</view>
					<view class="badge-info">
						<text class="badge-name">{{ badge.name }}</text>
						<text class="badge-desc">{{ badge.description }}</text>
					</view>
					<view class="badge-status">
						<text class="status-icon" v-if="badge.unlocked">✅</text>
						<text class="status-icon" v-else>🔒</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	computed: {
		unlockedCount() {
			const all = [...this.learningBadges, ...this.streakBadges, ...this.specialBadges];
			return all.filter(b => b.unlocked).length;
		},
		totalCount() {
			return this.learningBadges.length + this.streakBadges.length + this.specialBadges.length;
		},
		progress() {
			return Math.round((this.unlockedCount / this.totalCount) * 100);
		}
	},
	data() {
		return {
			learningBadges: [
				{ icon: '🌱', name: '初学者', description: '完成第一次学习', unlocked: true, progress: 100 },
				{ icon: '📖', name: '单词达人', description: '学习100个单词', unlocked: true, progress: 100 },
				{ icon: '📚', name: '词汇大师', description: '学习500个单词', unlocked: false, progress: 31 },
				{ icon: '📝', name: '语法入门', description: '完成5个语法练习', unlocked: true, progress: 100 },
				{ icon: '🗣️', name: '口语新星', description: '完成10次跟读', unlocked: false, progress: 60 },
			],
			streakBadges: [
				{ icon: '🔥', name: '三天连续', description: '连续学习3天', unlocked: true },
				{ icon: '🔥', name: '一周坚持', description: '连续学习7天', unlocked: true },
				{ icon: '🔥', name: '半月达人', description: '连续学习15天', unlocked: false },
				{ icon: '🔥', name: '一月之星', description: '连续学习30天', unlocked: false },
			],
			specialBadges: [
				{ icon: '🎯', name: '发音高手', description: '发音准确率达到90%', unlocked: false },
				{ icon: '💬', name: '对话达人', description: '完成20次AI对话', unlocked: false },
				{ icon: '🏆', name: '全能学霸', description: '解锁所有徽章', unlocked: false },
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

.stats-bar {
	display: flex;
	justify-content: space-around;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.stats-item {
	text-align: center;
}

.stats-number {
	font-size: 48rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
}

.stats-label {
	font-size: 24rpx;
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

.badge-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.badge-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
	opacity: 0.6;
}

.badge-item.unlocked {
	opacity: 1;
}

.badge-icon {
	font-size: 60rpx;
	margin-right: 20rpx;
	width: 80rpx;
	text-align: center;
}

.badge-info {
	flex: 1;
}

.badge-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.badge-desc {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.badge-progress {
	display: flex;
	align-items: center;
	margin-top: 10rpx;
}

.progress-bar {
	flex: 1;
	height: 12rpx;
	background-color: #E0E0E0;
	border-radius: 6rpx;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background-color: #1F3A5F;
	border-radius: 6rpx;
}

.progress-text {
	font-size: 22rpx;
	color: #7A7A7A;
	margin-left: 15rpx;
}

.badge-status {
	margin-left: 20rpx;
}

.status-icon {
	font-size: 40rpx;
}
</style>
