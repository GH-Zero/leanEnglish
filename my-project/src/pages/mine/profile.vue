<template>
	<view class="container">
		<view class="header">
			<text class="title">个人信息</text>
			<text class="subtitle">管理你的账户信息</text>
		</view>

		<view class="avatar-section">
			<view class="avatar-wrapper" @click="changeAvatar">
				<image class="avatar" :src="avatar" mode="aspectFill"></image>
				<view class="avatar-edit">
					<text class="edit-icon">📷</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">基本信息</text>
			<view class="info-list">
				<view class="info-item">
					<text class="info-label">昵称</text>
					<view class="info-value">
						<input class="info-input" v-model="nickname" placeholder="请输入昵称" @blur="saveProfile" />
						<text class="edit-icon">›</text>
					</view>
				</view>
				<view class="info-item">
					<text class="info-label">学习目标</text>
					<picker :range="goalOptions" :value="goalIndex" @change="changeGoal">
						<view class="picker-value">
							<text class="value-text">{{ goalOptions[goalIndex] }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
				<view class="info-item">
					<text class="info-label">英语水平</text>
					<picker :range="levelOptions" :value="levelIndex" @change="changeLevel">
						<view class="picker-value">
							<text class="value-text">{{ levelOptions[levelIndex] }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">学习偏好</text>
			<view class="info-list">
				<view class="info-item">
					<text class="info-label">每日学习时长</text>
					<picker :range="durationOptions" :value="durationIndex" @change="changeDuration">
						<view class="picker-value">
							<text class="value-text">{{ durationOptions[durationIndex] }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
				<view class="info-item">
					<text class="info-label">学习重点</text>
					<picker :range="focusOptions" :value="focusIndex" @change="changeFocus">
						<view class="picker-value">
							<text class="value-text">{{ focusOptions[focusIndex] }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">账户操作</text>
			<view class="info-list">
				<view class="info-item" @click="exportData">
					<text class="info-label">导出学习数据</text>
					<view class="info-value">
						<text class="picker-arrow">›</text>
					</view>
				</view>
				<view class="info-item" @click="logout">
					<text class="info-label" style="color: #E74C3C;">退出登录</text>
					<view class="info-value">
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
			avatar: '/static/default-avatar.png',
			nickname: '英语学习者',
			goalOptions: ['日常交流', '考试备考', '工作需要', '兴趣爱好'],
			goalIndex: 0,
			levelOptions: ['零基础', '初级', '中级', '高级'],
			levelIndex: 0,
			durationOptions: ['15分钟', '30分钟', '45分钟', '60分钟'],
			durationIndex: 1,
			focusOptions: ['均衡发展', '口语为主', '词汇为主', '语法为主'],
			focusIndex: 0
		}
	},
	methods: {
		changeAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.avatar = res.tempFilePaths[0];
					this.saveProfile();
				}
			});
		},
		changeGoal(e) {
			this.goalIndex = e.detail.value;
			this.saveProfile();
		},
		changeLevel(e) {
			this.levelIndex = e.detail.value;
			this.saveProfile();
		},
		changeDuration(e) {
			this.durationIndex = e.detail.value;
			this.saveProfile();
		},
		changeFocus(e) {
			this.focusIndex = e.detail.value;
			this.saveProfile();
		},
		saveProfile() {
			const profile = {
				avatar: this.avatar,
				nickname: this.nickname,
				goalIndex: this.goalIndex,
				levelIndex: this.levelIndex,
				durationIndex: this.durationIndex,
				focusIndex: this.focusIndex
			};
			uni.setStorageSync('userProfile', profile);
			uni.showToast({ title: '已保存', icon: 'success' });
		},
		loadProfile() {
			const profile = uni.getStorageSync('userProfile');
			if (profile) {
				this.avatar = profile.avatar || '/static/default-avatar.png';
				this.nickname = profile.nickname || '英语学习者';
				this.goalIndex = profile.goalIndex || 0;
				this.levelIndex = profile.levelIndex || 0;
				this.durationIndex = profile.durationIndex || 1;
				this.focusIndex = profile.focusIndex || 0;
			}
		},
		exportData() {
			uni.showModal({
				title: '导出数据',
				content: '确定要导出学习数据吗？',
				success: (res) => {
					if (res.confirm) {
						const data = {
							profile: uni.getStorageSync('userProfile'),
							wordStatus: uni.getStorageSync('wordStatus'),
							grammarProgress: uni.getStorageSync('grammarProgress'),
							exportTime: new Date().toISOString()
						};
						console.log('导出数据:', data);
						uni.showToast({ title: '导出成功', icon: 'success' });
					}
				}
			});
		},
		logout() {
			uni.showModal({
				title: '退出登录',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.reLaunch({
							url: '/pages/home/index'
						});
					}
				}
			});
		}
	},
	onLoad() {
		this.loadProfile();
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

.avatar-section {
	display: flex;
	justify-content: center;
	margin-bottom: 30rpx;
}

.avatar-wrapper {
	position: relative;
}

.avatar {
	width: 160rpx;
	height: 160rpx;
	border-radius: 80rpx;
	border: 4rpx solid #FFFFFF;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.2);
}

.avatar-edit {
	position: absolute;
	bottom: 0;
	right: 0;
	background-color: #1F3A5F;
	width: 50rpx;
	height: 50rpx;
	border-radius: 25rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.edit-icon {
	font-size: 24rpx;
	color: #FFFFFF;
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

.info-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.info-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.info-label {
	font-size: 30rpx;
	color: #333333;
}

.info-value {
	display: flex;
	align-items: center;
	flex: 1;
	justify-content: flex-end;
}

.info-input {
	text-align: right;
	font-size: 28rpx;
	color: #7A7A7A;
	flex: 1;
}

.picker-value {
	display: flex;
	align-items: center;
}

.value-text {
	font-size: 28rpx;
	color: #7A7A7A;
	margin-right: 10rpx;
}

.picker-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}
</style>
