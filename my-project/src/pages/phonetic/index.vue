<template>
	<view class="container">
		<AchievementUnlockNotifier />
		<view class="section progress-section">
			<text class="section-title">{{ entryType === 'daily' ? '今日练习进度' : '总学习进度' }}</text>
			<view class="progress-card">
				<view class="progress-info">
					<text class="progress-text">{{ entryType === 'daily' ? '今日达标' : '已掌握' }}：{{ displayProgressCount }}/48</text>
					<text class="progress-percent">{{ progressPercent }}%</text>
				</view>
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
				</view>
			</view>
		</view>
		<view class="header">
			<text class="title">{{ entryType === 'daily' ? '今日发音任务' : '音标课程' }}</text>
			<text class="subtitle">48个英美音标逐个教学</text>
		</view>
		
		<view class="section">
			<text class="section-title">音标分类</text>
			<view class="category-list">
				<view class="category-item" :class="{ active: currentCategory === 'vowel' }" @click="switchCategory('vowel')">
					<text class="category-text">元音</text>
				</view>
				<view class="category-item" :class="{ active: currentCategory === 'consonant' }" @click="switchCategory('consonant')">
					<text class="category-text">辅音</text>
				</view>
				<view class="category-item" :class="{ active: currentCategory === 'combination' }" @click="switchCategory('combination')">
					<text class="category-text">组合音</text>
				</view>
			</view>
		</view>
		
		<view class="section list-section">
			<text class="section-title">音标列表</text>
			<scroll-view class="phonetic-list phonetic-scroll" scroll-y="true" :show-scrollbar="true" enhanced="true">
				<animated-loading v-if="listLoading" text="正在加载音标"></animated-loading>
				<view class="phonetic-item" :class="{ mastered: isPhoneticPassed(item) }" v-for="item in filteredPhonetics" :key="item.id || item.symbol" v-else-if="filteredPhonetics.length">
					<view class="phonetic-symbol">{{ item.symbol }}</view>
					<view class="phonetic-info">
						<text class="phonetic-example">{{ item.example }}</text>
						<text class="phonetic-chinese">{{ item.chinese }}</text>
					</view>
					<view class="phonetic-actions">
						<view class="score-status" :class="{ passed: isPhoneticPassed(item) }">
							<text class="best-score">{{ phoneticScoreLabel(item) }}</text>
							<text class="passed-label" v-if="isPhoneticPassed(item)">{{ entryType === 'daily' ? '今日达标' : '已掌握' }}</text>
						</view>
						<text class="play-btn" @click="playSound(item.symbol, item.example, item.chinese)">🔊</text>
						<text class="practice-btn" @click="startPractice(item)">跟读</text>
					</view>
				</view>
				<view class="list-status" v-else @click="loadPhonetics">
					<animated-empty icon="📭" text="暂无音标数据" :sub="listError ? '加载失败，点击重新加载' : '当前分类下暂无内容'"></animated-empty>
				</view>
			</scroll-view>
		</view>
		
		<!-- 练习弹窗 -->
		<view class="practice-modal" v-if="showPracticeModal">
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">跟读练习</text>
					<text class="modal-close" @click="closePractice">×</text>
				</view>
				
				<view class="practice-area">
					<view class="target-symbol">{{ currentPractice.symbol }}</view>
					<view class="target-example">{{ currentPractice.example }}</view>
					<view class="target-chinese">{{ currentPractice.chinese }}</view>
					
					<view class="recording-status" v-if="isRecording">
						<view class="recording-animation"></view>
						<text class="recording-text">正在录音...</text>
					</view>
					
					<view class="score-display" v-if="showScore">
						<text class="score-number">{{ score }}</text>
						<text class="score-label">发音评分</text>
						<text class="score-feedback">{{ scoreFeedback }}</text>
					</view>
					
					<view class="practice-actions">
						<text class="action-btn play" @click="playSound(currentPractice.symbol, currentPractice.example, currentPractice.chinese)">标准发音</text>
						<text class="action-btn play-my" v-if="recordedFilePath" @click="playMyRecording">{{ playbackState === 'downloading' ? '加载中' : playbackState === 'playing' ? '播放中' : '我的录音' }}</text>
						<text class="action-btn record" :class="{ recording: isRecording }" @click="toggleRecording">
							{{ isRecording ? '停止' : (showScore ? '再录一次' : '开始录音') }}
						</text>
					</view>
				</view>
			</view>
		</view>
		
	</view>
</template>

<script>
import { BASE_URL, evaluateSpeech, getPhoneticProgress, updatePhoneticProgress, updatePhoneticStats } from '@/utils/api.js';
import { getAudioSettings } from '@/utils/learning-settings.js';
import { playTts, clearTtsQueue } from '@/utils/tts-player.js';
import { PRONUNCIATION_PASS_SCORE } from '@/utils/scoring-rules.js';
import { playAnswerFeedback } from '@/utils/answer-feedback.js';
import { isFirstLoad } from '@/utils/first-load.js';


export default {
	data() {
		const firstLoad = isFirstLoad('pages/phonetic/index')
		return {
			entryType: 'course',
			currentCategory: 'vowel',
			phonetics: [],
			phoneticProgress: {},
			showPracticeModal: false,
			currentPractice: {},
			isRecording: false,
			showScore: false,
			score: 0,
			scoreFeedback: '',
			recordManager: null,
			masteredCount: 0,
			recordedFilePath: '',
			recordedPlaybackUrl: '',
			playbackState: 'idle',
			myAudioContext: null,
			apiKeyConfigured: false,
			listLoading: firstLoad,
			firstLoad,
			listError: false,
			voiceType: 1
		}
	},
	computed: {
		filteredPhonetics() {
			return this.phonetics.filter(item => item.category === this.currentCategory);
		},
		todayPassedCount() {
			const today = this.dateKey();
			return Object.values(this.phoneticProgress || {}).filter(item => String(item?.last_practice_date || '').slice(0, 10) === today && Number(item?.last_score || 0) >= PRONUNCIATION_PASS_SCORE).length;
		},
		displayProgressCount() {
			return this.entryType === 'daily' ? this.todayPassedCount : this.masteredCount;
		},
		progressPercent() {
			return Math.round((this.displayProgressCount / 48) * 100);
		}
	},
	async onLoad(options = {}) {
		this.entryType = options.entry === 'daily' ? 'daily' : 'course';
		const audioSettings = await getAudioSettings();
		this.voiceType = audioSettings.voiceType;
		this.initRecorder();
		this.loadPhonetics();
		this.loadProgress();
	},
	onUnload() {
		clearTtsQueue();
		if (this.myAudioContext) { this.myAudioContext.stop(); this.myAudioContext.destroy(); this.myAudioContext = null; }
	},
	methods: {
		dateKey(date = new Date()) {
			const pad = value => String(value).padStart(2, '0');
			return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
		},
		async loadPhonetics() {
			if (this.firstLoad) { this.listLoading = true; this.firstLoad = false }
			this.listError = false;
			try {
				const res = await new Promise((resolve, reject) => {
					uni.request({
						url: BASE_URL + '/phonetic/all',
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
				this.phonetics = res || [];
			} catch (e) {
				console.error('加载音标失败:', e);
				this.phonetics = [];
				this.listError = true;
			} finally {
				this.listLoading = false;
			}
		},
		phoneticProgressOf(item) {
			return this.phoneticProgress?.[item?.symbol] || null;
		},
		isPhoneticMastered(item) {
			return Boolean(this.phoneticProgressOf(item)?.mastered);
		},
		isPhoneticPassed(item) {
			if (this.entryType !== 'daily') return this.isPhoneticMastered(item);
			const progress = this.phoneticProgressOf(item);
			return String(progress?.last_practice_date || '').slice(0, 10) === this.dateKey() && Number(progress?.last_score || 0) >= PRONUNCIATION_PASS_SCORE;
		},
		phoneticScoreLabel(item) {
			const progress = this.phoneticProgressOf(item);
			if (this.entryType === 'daily') {
				return String(progress?.last_practice_date || '').slice(0, 10) === this.dateKey() ? '今日 ' + Number(progress?.last_score || 0) + '分' : '今日未练';
			}
			return progress && Number(progress.attempts || 0) > 0 ? `最高 ${Number(progress.best_score || progress.score || 0)}分` : '未进行';
		},
		async loadProgress() {
			try {
				const progress = await getPhoneticProgress();
				if (progress) {
					this.phoneticProgress = progress;
					let count = 0;
					for (const key in progress) {
						if (progress[key] && progress[key].mastered) count++;
					}
					this.masteredCount = count;
				}
			} catch (e) {
				console.error('加载音标进度失败:', e);
				// 从本地 storage 读取
				try {
					const local = uni.getStorageSync('phoneticProgress') || {};
					this.phoneticProgress = local;
					let count = 0;
					for (const key in local) {
						if (local[key] && local[key].mastered) count++;
					}
					this.masteredCount = count;
				} catch (err) {}
			}
		},
		switchCategory(category) {
			this.currentCategory = category;
		},
		playSound(symbol, example, chinese) {
			const word = example || 'hello';
			this.playWordAudio(word);
		},
		playWordAudio(word) {
			playTts(word, 3).catch(error => {
				console.error('音标示例播放失败:', error);
				uni.showToast({ title: error?.message || '播放失败，请重试', icon: 'none' });
			});
		},
		startPractice(item) {
			if (this.myAudioContext) {
				this.myAudioContext.stop();
				this.myAudioContext.destroy();
				this.myAudioContext = null;
			}
			this.currentPractice = item;
			this.showPracticeModal = true;
			this.showScore = false;
			this.score = 0;
			this.scoreFeedback = '';
			this.recordedFilePath = '';
			this.recordedPlaybackUrl = '';
			this.playbackState = 'idle';
		},
		closePractice() {
			const wasRecording = this.isRecording;
			this.showPracticeModal = false;
			this.isRecording = false;
			if (this.recordStopTimer) {
				clearTimeout(this.recordStopTimer);
				this.recordStopTimer = null;
			}
			// 关闭弹窗属于主动取消，不应显示“录音失败”。
			this.cancelRecording = wasRecording;
			if (wasRecording && this.recordManager) this.recordManager.stop();
		},
		initRecorder() {
			this.recordManager = uni.getRecorderManager();
			
			this.recordManager.onStop((res) => {
				if (this.recordStopTimer) {
					clearTimeout(this.recordStopTimer);
					this.recordStopTimer = null;
				}
				this.isRecording = false;
				if (this.cancelRecording || !this.showPracticeModal) {
					this.cancelRecording = false;
					return;
				}
				if (!res.tempFilePath) {
					uni.showToast({ title: '未获取到录音，请重试', icon: 'none' });
					return;
				}
				this.recordedFilePath = res.tempFilePath;
				this.evaluateRecording(res.tempFilePath);
			});
			
			this.recordManager.onError((err) => {
				if (this.recordStopTimer) {
					clearTimeout(this.recordStopTimer);
					this.recordStopTimer = null;
				}
				const cancelled = this.cancelRecording || !this.showPracticeModal;
				this.cancelRecording = false;
				this.isRecording = false;
				if (cancelled) return;
				console.error('录音错误:', err);
				uni.showToast({ title: '录音失败，请重试', icon: 'none' });
			});
		},
		toggleRecording() {
			if (this.isRecording) {
				this.recordManager.stop();
				this.isRecording = false;
			} else {
				this.startRecording();
			}
		},
		startRecording() {
			this.showScore = false;
			this.isRecording = true;
			this.recordedFilePath = '';
			this.recordedPlaybackUrl = '';
			this.playbackState = 'idle';
			
			const options = {
				duration: 10000,
				sampleRate: 16000,
				numberOfChannels: 1,
				format: 'mp3'
			};
			
			this.recordManager.start(options);
			
			// 自动停止录音（最长10秒）
			this.recordStopTimer = setTimeout(() => {
				this.recordStopTimer = null;
				if (this.isRecording) this.recordManager.stop();
			}, 10000);
		},
		evaluateRecording(filePath) {
			// 调用语音评测API
			uni.showLoading({
				title: '正在评测...'
			});

			// 将音频文件转换为base64
			const fs = uni.getFileSystemManager();
			fs.readFile({
				filePath: filePath,
				encoding: 'base64',
				success: (res) => {
					const audioBase64 = res.data;
					const word = this.currentPractice.example || 'hello';
					
					// 调用评测API
					this.callEvaluateAPI(audioBase64, word);
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('读取音频文件失败:', err);
					uni.showToast({
						title: '录音读取失败',
						icon: 'none'
					});
				}
			});
		},
		async callEvaluateAPI(audioBase64, word) {
			try {
				const result = await evaluateSpeech(audioBase64, word, 'read_word', 'mp3');
				
				uni.hideLoading();
				
				if (result && Number.isFinite(Number(result.score))) {
					this.score = result.score;
					playAnswerFeedback(Number(this.score) >= PRONUNCIATION_PASS_SCORE);
					this.scoreFeedback = result.feedback || '';
					this.recordedPlaybackUrl = result.playbackPath ? BASE_URL + result.playbackPath : '';
					this.showScore = true;
					
					// 调用API更新统计
					this.updatePhoneticStatsAPI();
				} else {
					uni.showToast({
						title: '评测失败，请重试',
						icon: 'none'
					});
				}
			} catch (error) {
				uni.hideLoading();
				console.error('语音评测API失败:', error);
				this.score = 0;
				this.scoreFeedback = error?.message || '真实语音评测暂不可用，请检查服务配置后重试';
				this.showScore = false;
				uni.showToast({ title: this.scoreFeedback, icon: 'none', duration: 3000 });
			}
		},
		async updatePhoneticStatsAPI() {
			try {
				await updatePhoneticStats(1);
				// 更新本地音标进度
				const phoneticId = this.currentPractice.symbol;
				const previous = this.phoneticProgress[phoneticId] || {};
				// 无论是否通过都保存，服务端负责保留历史最高分。
				const progressResult = await updatePhoneticProgress(phoneticId, this.score);
				const nextProgress = { ...previous, ...progressResult, attempts: Number(previous.attempts || 0) + 1 };
				this.phoneticProgress = { ...this.phoneticProgress, [phoneticId]: nextProgress };
				const local = uni.getStorageSync('phoneticProgress') || {};
				local[phoneticId] = nextProgress;
				uni.setStorageSync('phoneticProgress', local);
				this.masteredCount = Object.values(this.phoneticProgress).filter(item => item?.mastered).length;
				updatePhoneticStats(1).catch(error => console.error('更新音标练习统计失败:', error));
			}
			catch (error) {
				console.error('更新音标统计API失败:', error);
			}
		},
		playMyRecording() {
			if (this.playbackState === 'downloading' || this.playbackState === 'playing') return;
			if (this.recordedFilePath) {
				this.doPlayRecording(this.recordedFilePath);
				return;
			}
			if (!this.recordedPlaybackUrl) {
				uni.showToast({ title: '没有录音，请先录音', icon: 'none' });
				return;
			}
			this.playbackState = 'downloading';
			uni.showLoading({ title: '加载录音中...' });
			uni.downloadFile({
				url: this.recordedPlaybackUrl,
				success: (res) => {
					uni.hideLoading();
					if (res.statusCode === 200 && res.tempFilePath) {
						this.doPlayRecording(res.tempFilePath);
					} else {
						this.playbackState = 'idle';
						uni.showToast({ title: '录音加载失败', icon: 'none' });
					}
				},
				fail: () => {
					uni.hideLoading();
					this.playbackState = 'idle';
					uni.showToast({ title: '录音加载失败', icon: 'none' });
				}
			});
		},
		doPlayRecording(filePath) {
			if (this.myAudioContext) {
				this.myAudioContext.stop();
				this.myAudioContext.destroy();
				this.myAudioContext = null;
			}
			this.playbackState = 'playing';
			const audio = uni.createInnerAudioContext();
			this.myAudioContext = audio;
			audio.autoplay = false;
			audio.obeyMuteSwitch = false;
			audio.volume = 1;
			audio.startTime = 0;
			audio.src = filePath;
			audio.onCanplay(() => {
				audio.play();
			});
			audio.onEnded(() => {
				this.playbackState = 'ready';
			});
			audio.onError((error) => {
				console.error('播放录音失败:', error);
				this.playbackState = 'ready';
				uni.showToast({ title: '播放失败', icon: 'none' });
			});
		},
		retryPractice() {
			this.showScore = false;
			this.score = 0;
			this.scoreFeedback = '';
			this.recordedFilePath = '';
			this.recordedPlaybackUrl = '';
			this.playbackState = 'idle';
		}
	}
}
</script>

<style>
.container {
	padding: 20rpx;
	background-color: #F7F5F0;
	height: 100vh;
	box-sizing: border-box;
	overflow: hidden;
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

.subtitle {
	font-size: 22rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 10rpx;
}

.section {
	margin: 30rpx 0;
}

.progress-section {
	margin-top: 0;
	margin-bottom: 20rpx;
}

.list-section {
	margin-bottom: 0;
}

.phonetic-scroll {
	height: calc(100vh - 600rpx);
	min-height: 360rpx;
	box-sizing: border-box;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-bottom: 20rpx;
	display: block;
}

.category-list {
	display: flex;
	justify-content: center;
	gap: 12rpx;
	margin-bottom: 20rpx;
}

.category-item {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 20rpx 40rpx;
	box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
}

.category-item.active {
	background-color: #1F3A5F;
}

.category-text {
	font-size: 28rpx;
	color: #333333;
}

.category-item.active .category-text {
	color: #FFFFFF;
}

.phonetic-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.list-status {
	height: 100%;
	min-height: 360rpx;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
	padding: 60rpx 30rpx;
}

.empty-state {
	color: #7A7A7A;
}

.empty-icon {
	font-size: 64rpx;
	margin-bottom: 20rpx;
}

.status-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-bottom: 12rpx;
}

.status-text {
	font-size: 25rpx;
	color: #999999;
}

.phonetic-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.phonetic-symbol {
	font-size: 36rpx;
	font-weight: bold;
	color: #0D9488;
	width: 150rpx;
	text-align: center;
}

.phonetic-info {
	flex: 1;
}

.phonetic-example {
	font-size: 28rpx;
	color: #333333;
	display: block;
}

.phonetic-chinese {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.phonetic-actions {
	display: flex;
	align-items: center;
}

.play-btn {
	font-size: 40rpx;
	margin-right: 20rpx;
}

.practice-btn {
	background-color: #0D9488;
	color: #FFFFFF;
	border-radius: 10rpx;
	padding: 10rpx 20rpx;
	font-size: 24rpx;
}

.progress-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
}

.progress-info {
	display: flex;
	justify-content: space-between;
	margin-bottom: 15rpx;
}

.progress-text {
	font-size: 28rpx;
	color: #333333;
}

.progress-percent {
	font-size: 28rpx;
	color: #0D9488;
	font-weight: bold;
}

.progress-bar {
	height: 20rpx;
	background-color: #F0F0F0;
	border-radius: 10rpx;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background-color: #0D9488;
	border-radius: 10rpx;
}

/* 练习弹窗样式 */
.practice-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0,0,0,0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.modal-content {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	width: 80%;
	max-width: 600rpx;
	overflow: hidden;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
}

.modal-close {
	font-size: 40rpx;
	color: #7A7A7A;
}

.practice-area {
	padding: 30rpx;
	text-align: center;
}

.target-symbol {
	font-size: 72rpx;
	font-weight: bold;
	color: #0D9488;
	margin-bottom: 20rpx;
}

.target-example {
	font-size: 36rpx;
	color: #333333;
	margin-bottom: 10rpx;
}

.target-chinese {
	font-size: 28rpx;
	color: #7A7A7A;
	margin-bottom: 30rpx;
}

.recording-status {
	margin: 30rpx 0;
}

.recording-animation {
	width: 100rpx;
	height: 100rpx;
	background-color: #FF4444;
	border-radius: 50%;
	margin: 0 auto 20rpx;
	animation: pulse 1.5s infinite;
}

@keyframes pulse {
	0% { transform: scale(0.95); }
	50% { transform: scale(1.05); }
	100% { transform: scale(0.95); }
}

.recording-text {
	font-size: 28rpx;
	color: #FF4444;
}

.score-display {
	margin: 30rpx 0;
}

.score-number {
	font-size: 72rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
}

.score-label {
	font-size: 28rpx;
	color: #7A7A7A;
	display: block;
	margin-bottom: 10rpx;
}

.score-feedback {
	font-size: 28rpx;
	color: #0D9488;
	display: block;
}

.score-tip {
	font-size: 22rpx;
	color: #999;
	display: block;
	margin-top: 10rpx;
	font-style: italic;
}

.practice-actions {
	display: flex;
	justify-content: center;
	gap: 12rpx;
	margin-top: 30rpx;
}

.action-btn {
	padding: 15rpx 30rpx;
	border-radius: 10rpx;
	font-size: 28rpx;
	font-weight: bold;
}

.action-btn.play {
	background-color: #1F3A5F;
	color: #FFFFFF;
}

.action-btn.play-my {
	background-color: #6366F1;
	color: #FFFFFF;
}

.action-btn.record {
	background-color: #0D9488;
	color: #FFFFFF;
}

.action-btn.record.recording {
	background-color: #FF4444;
}

.action-btn.retry {
	background-color: #F0F0F0;
	color: #333333;
}

/* 紧凑版课程布局 */
.header{padding:8rpx 0 10rpx}.title{font-size:32rpx}.subtitle{margin-top:4rpx;font-size:19rpx}.section{margin:15rpx 0}.progress-section{margin-bottom:12rpx}.progress-card{padding:20rpx 22rpx}.progress-info{margin-bottom:10rpx}.progress-text,.progress-percent{font-size:24rpx}.progress-bar{height:14rpx}.section-title{margin-bottom:10rpx;font-size:27rpx}.category-list{margin-bottom:8rpx}.category-item{padding:14rpx 34rpx;border-radius:15rpx}.category-text{font-size:24rpx}.phonetic-scroll{height:calc(100vh - 490rpx)}.phonetic-item{padding:19rpx 20rpx}.phonetic-symbol{width:120rpx;font-size:32rpx}.phonetic-example{font-size:25rpx}.phonetic-chinese{margin-top:2rpx;font-size:20rpx}.phonetic-actions{gap:12rpx}.play-btn{margin-right:2rpx;font-size:32rpx}.practice-btn{padding:8rpx 16rpx;font-size:22rpx}.score-status{flex-shrink:0;min-width:72rpx;text-align:center;color:#9aa3ab}.best-score,.passed-label{display:block;font-size:17rpx;line-height:1.35}.score-status.passed{color:#0b8f83}.passed-label{font-weight:700}.phonetic-item.mastered{background:#fbfefd}</style>








