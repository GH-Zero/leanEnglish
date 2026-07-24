<template>
	<view class="container">
		<view class="header">
			<text class="title">AI对话练习</text>
			<text class="subtitle">模拟真实场景，锻炼口语反应</text>
		</view>
		
		<!-- 场景选择 -->
		<view class="section" v-if="!isDialogueActive">
			<text class="section-title">对话场景</text>
			<view class="scene-list">
				<view class="scene-item" v-for="(item, index) in scenes" :key="index" @click="startDialogue(item)">
					<view class="scene-icon">{{ item.icon }}</view>
					<view class="scene-info">
						<text class="scene-name">{{ item.name }}</text>
						<text class="scene-desc">{{ item.description }}</text>
					</view>
					<text class="scene-arrow">›</text>
				</view>
			</view>
		</view>
		
		<!-- 对话进行中 -->
		<view class="section" v-if="isDialogueActive">
			<view class="dialogue-container">
				<view class="dialogue-header">
					<text class="dialogue-title">{{ currentScene.name }}</text>
					<text class="dialogue-status">进行中</text>
				</view>
				
				<view class="message-list" ref="messageList">
					<view class="message-item" :class="{ ai: msg.type === 'ai', user: msg.type === 'user' }" v-for="(msg, index) in messages" :key="index">
						<view class="message-avatar" v-if="msg.type === 'ai'">🤖</view>
						<view class="message-content">
							<text class="message-text">{{ msg.text }}</text>
							<text class="message-score" v-if="msg.score">发音评分：{{ msg.score }}分</text>
							<text class="message-feedback" v-if="msg.feedback">{{ msg.feedback }}</text>
							<text class="message-time">{{ msg.time }}</text>
						</view>
						<view class="message-avatar" v-if="msg.type === 'user'">👤</view>
					</view>
				</view>
				
				<view class="input-area">
					<view class="recording-status" v-if="isRecording">
						<view class="recording-animation"></view>
						<text class="recording-text">正在录音...</text>
					</view>
					<view class="input-actions">
						<input class="message-input" v-model="inputText" placeholder="输入或点击麦克风说话..." @confirm="sendMessage" />
						<view class="mic-btn" :class="{ recording: isRecording }" @click="toggleRecording">🎤</view>
						<view class="send-btn" @click="sendMessage">发送</view>
					</view>
				</view>
				
				<view class="dialogue-actions">
					<text class="action-btn" @click="endDialogue">结束对话</text>
					<text class="action-btn" @click="clearDialogue">清空记录</text>
				</view>
			</view>
		</view>
		
		<!-- 对话历史 -->
		<view class="section">
			<text class="section-title">对话历史</text>
			<view class="history-list" v-if="dialogueHistory.length > 0">
				<view class="history-item" v-for="(item, index) in dialogueHistory" :key="index">
					<view class="history-icon">{{ item.scene.icon }}</view>
					<view class="history-info">
						<text class="history-name">{{ item.scene.name }}</text>
						<text class="history-time">{{ item.time }}</text>
					</view>
					<text class="history-score">平均分：{{ item.averageScore }}</text>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-icon">💬</text>
				<text class="empty-text">暂无对话记录</text>
				<text class="empty-hint">开始AI对话练习，记录你的学习历程</text>
			</view>
		</view>
		
		<!-- 对话报告 -->
		<view class="report-modal" v-if="showReport">
			<view class="report-content">
				<view class="report-header">
					<text class="report-title">对话报告</text>
					<text class="report-close" @click="closeReport">×</text>
				</view>
				<view class="report-body">
					<text class="report-scene">{{ currentScene.name }}</text>
					<view class="report-stats">
						<view class="stat-item">
							<text class="stat-number">{{ dialogueStats.totalMessages }}</text>
							<text class="stat-label">总消息数</text>
						</view>
						<view class="stat-item">
							<text class="stat-number">{{ dialogueStats.averageScore }}</text>
							<text class="stat-label">平均发音分</text>
						</view>
						<view class="stat-item">
							<text class="stat-number">{{ dialogueStats.duration }}</text>
							<text class="stat-label">对话时长</text>
						</view>
					</view>
					<view class="report-tips">
						<text class="tips-title">学习建议：</text>
						<text class="tips-item" v-for="(tip, idx) in dialogueStats.tips" :key="idx">{{ tip }}</text>
					</view>
					<text class="report-btn" @click="closeReport">返回</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			scenes: [
				{ icon: '🍽️', name: '餐厅点餐', description: '模拟在餐厅点餐的对话场景', initialPrompt: 'Hello! Welcome to our restaurant. Are you ready to order?' },
				{ icon: '🗺️', name: '问路指路', description: '模拟问路和指路的对话场景', initialPrompt: 'Excuse me, can you help me find the nearest subway station?' },
				{ icon: '🛒', name: '购物消费', description: '模拟购物和讨价还价的对话场景', initialPrompt: 'Hi! Welcome to our store. What are you looking for today?' },
				{ icon: '💼', name: '职场寒暄', description: '模拟职场交流的对话场景', initialPrompt: 'Good morning! How was your weekend?' }
			],
			isDialogueActive: false,
			currentScene: {},
			messages: [],
			inputText: '',
			isRecording: false,
			recordManager: null,
			dialogueHistory: [],
			showReport: false,
			dialogueStats: {
				totalMessages: 0,
				averageScore: 0,
				duration: '0分钟',
				tips: []
			},
			startTime: null,
			scoreSum: 0,
			scoreCount: 0
		}
	},
	onLoad() {
		this.initRecorder();
		this.loadDialogueHistory();
	},
	methods: {
		startDialogue(scene) {
			this.currentScene = scene;
			this.messages = [];
			this.isDialogueActive = true;
			this.startTime = new Date();
			this.scoreSum = 0;
			this.scoreCount = 0;
			
			// 添加AI的初始消息
			this.addMessage({
				type: 'ai',
				text: scene.initialPrompt,
				time: this.getCurrentTime()
			});
		},
		endDialogue() {
			if (this.messages.length < 2) {
				uni.showToast({
					title: '对话消息太少，请多聊几句',
					icon: 'none'
				});
				return;
			}
			
			// 计算统计信息
			this.calculateStats();
			
			// 保存对话历史
			const historyItem = {
				scene: this.currentScene,
				messages: this.messages,
				time: new Date().toLocaleString(),
				averageScore: this.dialogueStats.averageScore
			};
			this.dialogueHistory.unshift(historyItem);
			this.saveDialogueHistory();
			
			// 显示报告
			this.showReport = true;
			this.isDialogueActive = false;
		},
		clearDialogue() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空当前对话记录吗？',
				success: (res) => {
					if (res.confirm) {
						this.messages = [];
						this.isDialogueActive = false;
					}
				}
			});
		},
		addMessage(msg) {
			this.messages.push(msg);
			// 滚动到底部
			this.$nextTick(() => {
				if (this.$refs.messageList) {
					this.$refs.messageList.scrollTop = this.$refs.messageList.scrollHeight;
				}
			});
		},
		sendMessage() {
			const text = this.inputText.trim();
			if (!text) {
				uni.showToast({
					title: '请输入消息内容',
					icon: 'none'
				});
				return;
			}
			
			// 添加用户消息
			this.addMessage({
				type: 'user',
				text: text,
				time: this.getCurrentTime()
			});
			
			this.inputText = '';
			
			// 模拟AI回复
			setTimeout(() => {
				this.generateAIResponse(text);
			}, 1000);
		},
		generateAIResponse(userText) {
			// 模拟AI回复（实际应调用GPT API）
			const responses = {
				'餐厅点餐': [
					'Great choice! Would you like anything else?',
					'Anything to drink?',
					'Your order will be ready in 10 minutes.',
					'Enjoy your meal!'
				],
				'问路指路': [
					'Go straight for two blocks, then turn left.',
					'The subway station is about 5 minutes walk from here.',
					'You can take bus number 15 to get there.',
					'Don\'t worry, it\'s not far from here.'
				],
				'购物消费': [
					'This shirt is on sale for 50% off.',
					'We have many colors available.',
					'Would you like to try it on?',
					'You can pay by cash or credit card.'
				],
				'职场寒暄': [
					'I had a great weekend. How about you?',
					'Did you watch the game last night?',
					'Let\'s grab lunch together.',
					'The meeting is at 3pm this afternoon.'
				]
			};
			
			const sceneResponses = responses[this.currentScene.name] || responses['餐厅点餐'];
			const randomResponse = sceneResponses[Math.floor(Math.random() * sceneResponses.length)];
			
			// 模拟发音评分
			const score = Math.floor(Math.random() * 30) + 70; // 70-100分
			this.scoreSum += score;
			this.scoreCount++;
			
			// 添加AI回复
			this.addMessage({
				type: 'ai',
				text: randomResponse,
				time: this.getCurrentTime()
			});
			
			// 更新用户消息的评分
			const lastUserMsg = this.messages.filter(msg => msg.type === 'user').pop();
			if (lastUserMsg) {
				lastUserMsg.score = score;
				if (score >= 90) {
					lastUserMsg.feedback = '发音很棒！继续保持！';
				} else if (score >= 80) {
					lastUserMsg.feedback = '发音不错，可以更标准一些。';
				} else {
					lastUserMsg.feedback = '发音需要改进，注意语调。';
				}
			}
		},
		initRecorder() {
			this.recordManager = uni.getRecorderManager();
			
			this.recordManager.onStop((res) => {
				console.log('录音结束:', res);
				this.isRecording = false;
				this.processRecording(res.tempFilePath);
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
		processRecording(filePath) {
			// 模拟语音识别（实际应调用语音识别API）
			uni.showLoading({
				title: '识别中...'
			});
			
			setTimeout(() => {
				uni.hideLoading();
				
				// 模拟识别结果
				const mockTexts = [
					'I would like to order a coffee, please.',
					'Can you help me find the subway station?',
					'I\'m looking for a new shirt.',
					'How was your weekend?'
				];
				
				const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
				this.inputText = randomText;
				
				uni.showToast({
					title: '语音识别完成',
					icon: 'success'
				});
			}, 1500);
		},
		calculateStats() {
			const endTime = new Date();
			const durationMs = endTime - this.startTime;
			const durationMin = Math.round(durationMs / 60000);
			
			this.dialogueStats = {
				totalMessages: this.messages.length,
				averageScore: this.scoreCount > 0 ? Math.round(this.scoreSum / this.scoreCount) : 0,
				duration: durationMin + '分钟',
				tips: this.generateTips()
			};
		},
		generateTips() {
			const tips = [];
			const avgScore = this.dialogueStats.averageScore;
			
			if (avgScore >= 90) {
				tips.push('发音非常标准，继续保持！');
				tips.push('可以尝试更复杂的句型。');
			} else if (avgScore >= 80) {
				tips.push('发音不错，注意一些细节。');
				tips.push('多练习连读和弱读。');
			} else {
				tips.push('需要加强基础发音练习。');
				tips.push('建议先学习音标课程。');
			}
			
			return tips;
		},
		closeReport() {
			this.showReport = false;
			this.isDialogueActive = false;
		},
		getCurrentTime() {
			const now = new Date();
			return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
		},
		loadDialogueHistory() {
			try {
				const history = uni.getStorageSync('dialogueHistory');
				if (history) {
					this.dialogueHistory = history;
				}
			} catch (e) {
				console.error('加载对话历史失败:', e);
			}
		},
		saveDialogueHistory() {
			try {
				// 只保存最近20条记录
				const historyToSave = this.dialogueHistory.slice(0, 20);
				uni.setStorageSync('dialogueHistory', historyToSave);
			} catch (e) {
				console.error('保存对话历史失败:', e);
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

.scene-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.scene-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.scene-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.scene-info {
	flex: 1;
}

.scene-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.scene-desc {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.scene-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}

.dialogue-container {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.dialogue-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.dialogue-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
}

.dialogue-status {
	font-size: 24rpx;
	color: #0D9488;
	background-color: #E6F7F5;
	padding: 5rpx 15rpx;
	border-radius: 10rpx;
}

.message-list {
	padding: 20rpx 30rpx;
	max-height: 600rpx;
	overflow-y: auto;
}

.message-item {
	display: flex;
	margin-bottom: 20rpx;
}

.message-item.ai {
	justify-content: flex-start;
}

.message-item.user {
	justify-content: flex-end;
}

.message-avatar {
	font-size: 40rpx;
	margin: 0 15rpx;
}

.message-content {
	max-width: 70%;
}

.message-item.ai .message-content {
	background-color: #F0F0F0;
	border-radius: 20rpx 20rpx 20rpx 0;
	padding: 20rpx;
}

.message-item.user .message-content {
	background-color: #1F3A5F;
	border-radius: 20rpx 20rpx 0 20rpx;
	padding: 20rpx;
}

.message-text {
	font-size: 28rpx;
	color: #333333;
	display: block;
	margin-bottom: 10rpx;
}

.message-item.user .message-text {
	color: #FFFFFF;
}

.message-score {
	font-size: 22rpx;
	color: #0D9488;
	display: block;
	margin-bottom: 5rpx;
}

.message-feedback {
	font-size: 22rpx;
	color: #0D9488;
	display: block;
	margin-bottom: 5rpx;
}

.message-time {
	font-size: 20rpx;
	color: #7A7A7A;
	display: block;
	text-align: right;
}

.message-item.user .message-time {
	color: #C8D3E6;
}

.input-area {
	padding: 20rpx 30rpx;
	border-top: 1rpx solid #F0F0F0;
}

.recording-status {
	text-align: center;
	margin-bottom: 20rpx;
}

.recording-animation {
	width: 100rpx;
	height: 100rpx;
	background-color: #FF4444;
	border-radius: 50%;
	margin: 0 auto 10rpx;
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

.input-actions {
	display: flex;
	align-items: center;
}

.message-input {
	flex: 1;
	background-color: #F0F0F0;
	border-radius: 20rpx;
	padding: 15rpx 20rpx;
	font-size: 28rpx;
	margin-right: 20rpx;
}

.mic-btn {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.mic-btn.recording {
	color: #FF4444;
}

.send-btn {
	background-color: #0D9488;
	color: #FFFFFF;
	border-radius: 10rpx;
	padding: 10rpx 20rpx;
	font-size: 28rpx;
}

.dialogue-actions {
	display: flex;
	justify-content: space-around;
	padding: 20rpx 30rpx;
	border-top: 1rpx solid #F0F0F0;
}

.action-btn {
	font-size: 28rpx;
	color: #1F3A5F;
}

.history-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.history-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.history-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
}

.history-info {
	flex: 1;
}

.history-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.history-time {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.history-score {
	font-size: 26rpx;
	color: #0D9488;
	font-weight: bold;
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

/* 报告弹窗样式 */
.report-modal {
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

.report-content {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	width: 90%;
	max-width: 600rpx;
	overflow: hidden;
}

.report-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.report-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
}

.report-close {
	font-size: 40rpx;
	color: #7A7A7A;
}

.report-body {
	padding: 30rpx;
	text-align: center;
}

.report-scene {
	font-size: 36rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 30rpx;
}

.report-stats {
	display: flex;
	justify-content: space-around;
	margin-bottom: 30rpx;
}

.stat-item {
	text-align: center;
}

.stat-number {
	font-size: 48rpx;
	font-weight: bold;
	color: #0D9488;
	display: block;
}

.stat-label {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
}

.report-tips {
	text-align: left;
	background-color: #F7F5F0;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 30rpx;
}

.tips-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 10rpx;
}

.tips-item {
	font-size: 26rpx;
	color: #333333;
	display: block;
	margin-bottom: 8rpx;
}

.report-btn {
	background-color: #0D9488;
	color: #FFFFFF;
	text-align: center;
	padding: 15rpx;
	border-radius: 10rpx;
	font-size: 28rpx;
	font-weight: bold;
	display: block;
}
</style>