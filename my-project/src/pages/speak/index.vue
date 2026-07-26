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
			<view class="feature-card" @click="startShadowReading">
				<view class="feature-icon">🗣️</view>
				<view class="feature-info">
					<text class="feature-name">句子跟读</text>
					<text class="feature-desc">逐句跟读，提升口语流利度</text>
				</view>
				<text class="feature-arrow">›</text>
			</view>
		</view>

		<!-- 句子跟读练习 -->
		<view class="section" v-if="isShadowActive">
			<view class="shadow-card">
				<view class="shadow-header">
					<text class="shadow-title">句子跟读</text>
					<text class="shadow-close" @click="stopShadowReading">✕ 退出</text>
				</view>
				<view class="shadow-progress">{{ shadowIndex + 1 }} / {{ shadowSentences.length }}</view>
				<view class="shadow-sentence" v-if="currentShadow">
					<text class="sentence-text">{{ currentShadow.text }}</text>
					<text class="sentence-chinese">{{ currentShadow.chinese }}</text>
					<view class="shadow-actions">
						<text class="shadow-btn play" @click="playShadowSentence">播放句子</text>
						<text class="shadow-btn record" :class="{ recording: isRecording }" @click="toggleRecord">
							{{ isRecording ? '停止录音' : '跟读录音' }}
						</text>
					</view>
					<view class="shadow-score" v-if="shadowScore > 0">
						<text class="score-label">发音评分：{{ shadowScore }}分</text>
						<view class="score-bar">
							<view class="score-fill" :style="{ width: shadowScore + '%' }"></view>
						</view>
						<text class="shadow-feedback">{{ shadowFeedback }}</text>
					</view>
					<text class="shadow-btn next" v-if="shadowScore > 0" @click="nextShadowSentence">下一个句子</text>
				</view>
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
import { BASE_URL, updateSpeakStats } from '@/utils/api.js';

export default {
	data() {
		return {
			isShadowActive: false,
			shadowIndex: 0,
			shadowScore: 0,
			shadowFeedback: '',
			isRecording: false,
			recordManager: null,
			shadowSentences: []
		}
	},
	computed: {
		currentShadow() {
			return this.shadowSentences[this.shadowIndex] || null;
		}
	},
	onLoad() {
		this.initRecorder();
	},
	methods: {
		initRecorder() {
			this.recordManager = uni.getRecorderManager();
			this.recordManager.onStop((res) => {
				this.isRecording = false;
				this.evaluateShadowRecording(res.tempFilePath);
			});
			this.recordManager.onError(() => {
				this.isRecording = false;
				uni.showToast({ title: '录音失败', icon: 'none' });
			});
		},
		evaluateShadowRecording(filePath) {
			uni.showLoading({ title: '评测中...' });
			const fs = uni.getFileSystemManager();
			fs.readFile({
				filePath: filePath,
				encoding: 'base64',
				success: (res) => {
					const audioBase64 = res.data;
					const word = this.currentShadow ? this.currentShadow.text : 'hello';
					uni.request({
						url: BASE_URL + '/speech/evaluate',
						method: 'POST',
						header: { 'Content-Type': 'application/json' },
						data: { audioBase64, word, category: 'read_sentence' },
						success: (response) => {
							uni.hideLoading();
							if (response.statusCode === 200 && response.data.code === 0) {
								const result = response.data.data;
								this.shadowScore = result.score;
								this.shadowFeedback = result.feedback;
							} else {
								uni.showToast({ title: '评测失败', icon: 'none' });
							}
							updateSpeakStats(1);
						},
						fail: () => {
							uni.hideLoading();
							uni.showToast({ title: '评测服务异常', icon: 'none' });
							updateSpeakStats(1);
						}
					});
				},
				fail: () => {
					uni.hideLoading();
					uni.showToast({ title: '录音读取失败', icon: 'none' });
				}
			});
		},
		async loadShadowSentences() {
			try {
				const res = await new Promise((resolve, reject) => {
					uni.request({
						url: BASE_URL + '/shadow/random?count=10',
						method: 'GET',
						success: (res) => {
							if (res.statusCode === 200 && res.data.code === 0) {
								resolve(res.data.data);
							} else {
								reject(res.data.message);
							}
						},
						fail: reject
					});
				});
				this.shadowSentences = res || [];
			} catch (e) {
				console.error('加载跟读句子失败:', e);
			}
		},
		async startShadowReading() {
			await this.loadShadowSentences();
			if (this.shadowSentences.length === 0) {
				uni.showToast({ title: '暂无跟读数据', icon: 'none' });
				return;
			}
			this.isShadowActive = true;
			this.shadowIndex = 0;
			this.shadowScore = 0;
		},
		stopShadowReading() {
			this.isShadowActive = false;
			this.isRecording = false;
			if (this.recordManager) this.recordManager.stop();
		},
		playShadowSentence() {
			if (!this.currentShadow) return;
			const audio = uni.createInnerAudioContext();
			audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(this.currentShadow.text)}&type=2`;
			audio.play();
			audio.onError(() => {
				uni.showToast({ title: '播放失败', icon: 'none' });
			});
		},
		toggleRecord() {
			if (this.isRecording) {
				this.recordManager.stop();
			} else {
				this.shadowScore = 0;
				this.isRecording = true;
				this.recordManager.start({
					duration: 10000,
					sampleRate: 16000,
					numberOfChannels: 1,
					format: 'wav'
				});
				setTimeout(() => {
					if (this.isRecording) this.recordManager.stop();
				}, 10000);
			}
		},
		nextShadowSentence() {
			this.shadowIndex++;
			this.shadowScore = 0;
			this.shadowFeedback = '';
			if (this.shadowIndex >= this.shadowSentences.length) {
				uni.showToast({ title: '跟读完成！', icon: 'success' });
				this.isShadowActive = false;
			}
		},
		goToPage(url) {
			const tabBarPages = ['/pages/home/index', '/pages/learn/index', '/pages/speak/index', '/pages/mine/index'];
			if (tabBarPages.includes(url)) {
				uni.switchTab({ url: url });
			} else {
				uni.navigateTo({ url: url });
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

/* 句子跟读样式 */
.shadow-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}
.shadow-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}
.shadow-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
}
.shadow-close {
	font-size: 28rpx;
	color: #999999;
}
.shadow-progress {
	text-align: center;
	font-size: 26rpx;
	color: #7A7A7A;
	padding: 10rpx;
}
.shadow-sentence {
	padding: 30rpx;
	text-align: center;
}
.sentence-text {
	font-size: 36rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 10rpx;
}
.sentence-chinese {
	font-size: 28rpx;
	color: #7A7A7A;
	display: block;
	margin-bottom: 30rpx;
}
.shadow-actions {
	display: flex;
	justify-content: center;
	gap: 20rpx;
	margin-bottom: 20rpx;
}
.shadow-btn {
	padding: 15rpx 30rpx;
	border-radius: 10rpx;
	font-size: 28rpx;
	font-weight: bold;
	display: inline-block;
}
.shadow-btn.play {
	background-color: #1F3A5F;
	color: #FFFFFF;
}
.shadow-btn.record {
	background-color: #0D9488;
	color: #FFFFFF;
}
.shadow-btn.record.recording {
	background-color: #EF4444;
}
.shadow-btn.next {
	background-color: #0D9488;
	color: #FFFFFF;
	margin-top: 20rpx;
}
.shadow-score {
	margin-top: 20rpx;
}
.score-label {
	font-size: 30rpx;
	font-weight: bold;
	color: #0D9488;
	display: block;
	margin-bottom: 10rpx;
}
.score-bar {
	width: 80%;
	height: 16rpx;
	background-color: #E0E0E0;
	border-radius: 8rpx;
	margin: 0 auto 10rpx;
	overflow: hidden;
}
.score-fill {
	height: 100%;
	background-color: #0D9488;
	border-radius: 8rpx;
	transition: width 0.3s;
}
.shadow-feedback {
	font-size: 26rpx;
	color: #7A7A7A;
	display: block;
}
</style>