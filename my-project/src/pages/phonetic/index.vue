<template>
	<view class="container">
		<view class="header">
			<text class="title">音标学习</text>
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
		
		<view class="section">
			<text class="section-title">音标列表</text>
			<view class="phonetic-list">
				<view class="phonetic-item" v-for="(item, index) in filteredPhonetics" :key="index">
					<view class="phonetic-symbol">{{ item.symbol }}</view>
					<view class="phonetic-info">
						<text class="phonetic-example">{{ item.example }}</text>
						<text class="phonetic-chinese">{{ item.chinese }}</text>
					</view>
					<view class="phonetic-actions">
						<text class="play-btn" @click="playSound(item.symbol, item.example)">🔊</text>
						<text class="practice-btn" @click="startPractice(item)">跟读</text>
					</view>
				</view>
			</view>
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
						<text class="action-btn play" @click="playSound(currentPractice.symbol, currentPractice.example)">播放标准发音</text>
						<text class="action-btn record" :class="{ recording: isRecording }" @click="toggleRecording">
							{{ isRecording ? '停止录音' : '开始录音' }}
						</text>
						<text class="action-btn retry" v-if="showScore" @click="retryPractice">重新跟读</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">学习进度</text>
			<view class="progress-card">
				<view class="progress-info">
					<text class="progress-text">已掌握：{{ masteredCount }}/48</text>
					<text class="progress-percent">{{ progressPercent }}%</text>
				</view>
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentCategory: 'vowel',
			phonetics: [
				{ symbol: '/iː/', example: 'see', chinese: '长衣音', category: 'vowel' },
				{ symbol: '/ɪ/', example: 'sit', chinese: '短衣音', category: 'vowel' },
				{ symbol: '/e/', example: 'bed', chinese: '耶音', category: 'vowel' },
				{ symbol: '/æ/', example: 'cat', chinese: '大嘴梅花音', category: 'vowel' },
				{ symbol: '/ɑː/', example: 'car', chinese: '长啊音', category: 'vowel' },
				{ symbol: '/ɒ/', example: 'hot', chinese: '短哦音', category: 'vowel' },
				{ symbol: '/ɔː/', example: 'call', chinese: '长哦音', category: 'vowel' },
				{ symbol: '/ʊ/', example: 'put', chinese: '短乌音', category: 'vowel' },
				{ symbol: '/uː/', example: 'food', chinese: '长乌音', category: 'vowel' },
				{ symbol: '/ʌ/', example: 'cup', chinese: '短啊音', category: 'vowel' },
				{ symbol: '/ɜː/', example: 'bird', chinese: '额长音', category: 'vowel' },
				{ symbol: '/ə/', example: 'about', chinese: '额短音', category: 'vowel' },
				{ symbol: '/p/', example: 'pen', chinese: '破音', category: 'consonant' },
				{ symbol: '/b/', example: 'big', chinese: '波音', category: 'consonant' },
				{ symbol: '/t/', example: 'tea', chinese: '特音', category: 'consonant' },
				{ symbol: '/d/', example: 'dog', chinese: '得音', category: 'consonant' },
				{ symbol: '/k/', example: 'cat', chinese: '科音', category: 'consonant' },
				{ symbol: '/g/', example: 'go', chinese: '哥音', category: 'consonant' },
				{ symbol: '/f/', example: 'fun', chinese: '夫音', category: 'consonant' },
				{ symbol: '/v/', example: 'van', chinese: '屋音', category: 'consonant' },
				{ symbol: '/θ/', example: 'think', chinese: '思音', category: 'consonant' },
				{ symbol: '/ð/', example: 'this', chinese: '兹音', category: 'consonant' },
				{ symbol: '/s/', example: 'see', chinese: '丝音', category: 'consonant' },
				{ symbol: '/z/', example: 'zoo', chinese: '子音', category: 'consonant' },
				{ symbol: '/ʃ/', example: 'she', chinese: '诗音', category: 'consonant' },
				{ symbol: '/ʒ/', example: 'measure', chinese: '日音', category: 'consonant' },
				{ symbol: '/h/', example: 'hat', chinese: '喝音', category: 'consonant' },
				{ symbol: '/tʃ/', example: 'chair', chinese: '吃音', category: 'consonant' },
				{ symbol: '/dʒ/', example: 'job', chinese: '知音', category: 'consonant' },
				{ symbol: '/tr/', example: 'tree', chinese: '戳音', category: 'consonant' },
				{ symbol: '/dr/', example: 'dry', chinese: '捉音', category: 'consonant' },
				{ symbol: '/ts/', example: 'cats', chinese: '次音', category: 'consonant' },
				{ symbol: '/dz/', example: 'beds', chinese: '子音', category: 'consonant' },
				{ symbol: '/m/', example: 'man', chinese: '么音', category: 'consonant' },
				{ symbol: '/n/', example: 'no', chinese: '呢音', category: 'consonant' },
				{ symbol: '/ŋ/', example: 'sing', chinese: '嗯音', category: 'consonant' },
				{ symbol: '/l/', example: 'let', chinese: '了音', category: 'consonant' },
				{ symbol: '/r/', example: 'red', chinese: '若音', category: 'consonant' },
				{ symbol: '/w/', example: 'we', chinese: '我音', category: 'consonant' },
				{ symbol: '/j/', example: 'yes', chinese: '呀音', category: 'consonant' },
				{ symbol: '/eɪ/', example: 'day', chinese: '诶衣', category: 'combination' },
				{ symbol: '/aɪ/', example: 'my', chinese: '啊衣', category: 'combination' },
				{ symbol: '/ɔɪ/', example: 'boy', chinese: '哦衣', category: 'combination' },
				{ symbol: '/aʊ/', example: 'how', chinese: '啊乌', category: 'combination' },
				{ symbol: '/əʊ/', example: 'go', chinese: '额乌', category: 'combination' },
				{ symbol: '/ɪə/', example: 'here', chinese: '衣额', category: 'combination' },
				{ symbol: '/eə/', example: 'there', chinese: '耶额', category: 'combination' },
				{ symbol: '/ʊə/', example: 'tour', chinese: '乌额', category: 'combination' }
			],
			showPracticeModal: false,
			currentPractice: {},
			isRecording: false,
			showScore: false,
			score: 0,
			scoreFeedback: '',
			recordManager: null,
			masteredCount: 0
		}
	},
	computed: {
		filteredPhonetics() {
			return this.phonetics.filter(item => item.category === this.currentCategory);
		},
		progressPercent() {
			return Math.round((this.masteredCount / 48) * 100);
		}
	},
	onLoad() {
		this.initRecorder();
	},
	methods: {
		switchCategory(category) {
			this.currentCategory = category;
		},
		playSound(symbol, example) {
			// 使用有道词典API播放单词发音
			const word = example || 'hello';
			const audio = uni.createInnerAudioContext();
			audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
			audio.play();
			audio.onError((err) => {
				console.error('音频播放失败:', err);
				uni.showToast({
					title: '播放失败，请检查网络',
					icon: 'none'
				});
			});
		},
		startPractice(item) {
			this.currentPractice = item;
			this.showPracticeModal = true;
			this.showScore = false;
			this.score = 0;
			this.scoreFeedback = '';
		},
		closePractice() {
			this.showPracticeModal = false;
			this.isRecording = false;
			if (this.recordManager) {
				this.recordManager.stop();
			}
		},
		initRecorder() {
			this.recordManager = uni.getRecorderManager();
			
			this.recordManager.onStop((res) => {
				console.log('录音结束:', res);
				this.isRecording = false;
				this.evaluateRecording(res.tempFilePath);
			});
			
			this.recordManager.onError((err) => {
				console.error('录音错误:', err);
				this.isRecording = false;
				uni.showToast({
					title: '录音失败，请重试',
					icon: 'none'
				});
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
			
			const options = {
				duration: 10000,
				sampleRate: 44100,
			 numberOfChannels: 1,
				format: 'mp3'
			};
			
			this.recordManager.start(options);
			
			// 自动停止录音（最长10秒）
			setTimeout(() => {
				if (this.isRecording) {
					this.recordManager.stop();
				}
			}, 10000);
		},
		evaluateRecording(filePath) {
			// 模拟语音评测（实际应调用第三方API）
			uni.showLoading({
				title: '正在评测...'
			});
			
			// 模拟评测过程
			setTimeout(() => {
				uni.hideLoading();
				
				// 模拟评分（实际应调用Azure或讯飞API）
				this.score = Math.floor(Math.random() * 40) + 60; // 60-100分
				
				if (this.score >= 90) {
					this.scoreFeedback = '发音很棒！继续保持！';
				} else if (this.score >= 80) {
					this.scoreFeedback = '发音不错，可以更标准一些。';
				} else if (this.score >= 70) {
					this.scoreFeedback = '发音需要改进，注意口型。';
				} else {
					this.scoreFeedback = '发音需要多练习，建议重新听标准发音。';
				}
				
				this.showScore = true;
			}, 1500);
		},
		retryPractice() {
			this.showScore = false;
			this.score = 0;
			this.scoreFeedback = '';
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

.subtitle {
	font-size: 28rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 10rpx;
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

.category-list {
	display: flex;
	justify-content: space-around;
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

.practice-actions {
	display: flex;
	justify-content: space-around;
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
</style>