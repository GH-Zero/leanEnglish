<template>
	<view class="container">
		<view class="header">
			<text class="title">单词学习</text>
			<text class="subtitle">艾宾浩斯科学记忆</text>
		</view>
		
		<view class="section">
			<text class="section-title">词库选择</text>
			<view class="wordbook-list">
				<view class="wordbook-item" :class="{ active: currentWordbook === 'basic' }" @click="selectWordbook('basic')">
					<view class="wordbook-info">
						<text class="wordbook-name">零基础入门词</text>
						<text class="wordbook-count">500词</text>
					</view>
					<text class="wordbook-arrow">›</text>
				</view>
				<view class="wordbook-item" :class="{ active: currentWordbook === 'daily' }" @click="selectWordbook('daily')">
					<view class="wordbook-info">
						<text class="wordbook-name">日常交流核心词</text>
						<text class="wordbook-count">1500词</text>
					</view>
					<text class="wordbook-arrow">›</text>
				</view>
				<view class="wordbook-item" :class="{ active: currentWordbook === 'advanced' }" @click="selectWordbook('advanced')">
					<view class="wordbook-info">
						<text class="wordbook-name">3000高频口语词</text>
						<text class="wordbook-count">3000词</text>
					</view>
					<text class="wordbook-arrow">›</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">今日学习</text>
			<view class="study-card">
				<view class="study-info">
					<text class="study-new">新词：{{ newWordsCount }}</text>
					<text class="study-review">复习：{{ reviewWordsCount }}</text>
				</view>
				<view class="study-plan">
					<text class="plan-text">每日计划：</text>
					<text class="plan-number">{{ dailyPlan }}</text>
					<text class="plan-text">词</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">记忆卡片</text>
			<view class="card-container" v-if="currentWord">
				<view class="card" @click="flipCard">
					<view class="card-front" v-if="!showBack">
						<text class="card-word">{{ currentWord.word }}</text>
						<text class="card-phonetic">{{ currentWord.phonetic }}</text>
						<text class="card-hint">点击翻转</text>
					</view>
					<view class="card-back" v-else>
						<text class="card-meaning">{{ currentWord.chinese }}</text>
						<text class="card-example">{{ currentWord.example }}</text>
						<view class="card-actions">
							<text class="action-btn know" @click="markAsKnow">认识</text>
							<text class="action-btn unknown" @click="markAsUnknown">不认识</text>
						</view>
					</view>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-icon">📚</text>
				<text class="empty-text">今日学习已完成</text>
				<text class="empty-hint">明天再来继续学习吧</text>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">学习统计</text>
			<view class="stats-card">
				<view class="stat-item">
					<text class="stat-number">{{ totalLearned }}</text>
					<text class="stat-label">已学单词</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ masteredCount }}</text>
					<text class="stat-label">掌握单词</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ accuracy }}%</text>
					<text class="stat-label">正确率</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">学习模式</text>
			<view class="mode-list">
				<view class="mode-item" @click="startMode('listen')">
					<text class="mode-icon">👂</text>
					<text class="mode-text">听音辨义</text>
				</view>
				<view class="mode-item" @click="startMode('read')">
					<text class="mode-icon">👀</text>
					<text class="mode-text">看英文想中文</text>
				</view>
				<view class="mode-item" @click="startMode('write')">
					<text class="mode-icon">✍️</text>
					<text class="mode-text">拼写默写</text>
				</view>
				<view class="mode-item" @click="startMode('speak')">
					<text class="mode-icon">🗣️</text>
					<text class="mode-text">单词跟读</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentWordbook: 'basic',
			dailyPlan: 10,
			showBack: false,
			currentWordIndex: 0,
			wordLists: {
				basic: [
					{ word: 'hello', phonetic: '/həˈləʊ/', chinese: '你好', example: 'Hello, how are you?' },
					{ word: 'goodbye', phonetic: '/ɡʊdˈbaɪ/', chinese: '再见', example: 'Goodbye, see you tomorrow.' },
					{ word: 'thank', phonetic: '/θæŋk/', chinese: '感谢', example: 'Thank you very much.' },
					{ word: 'please', phonetic: '/pliːz/', chinese: '请', example: 'Please sit down.' },
					{ word: 'sorry', phonetic: '/ˈsɒri/', chinese: '对不起', example: 'I am sorry for being late.' },
					{ word: 'water', phonetic: '/ˈwɔːtə/', chinese: '水', example: 'Can I have some water?' },
					{ word: 'food', phonetic: '/fuːd/', chinese: '食物', example: 'The food is delicious.' },
					{ word: 'house', phonetic: '/haʊs/', chinese: '房子', example: 'This is my house.' },
					{ word: 'book', phonetic: '/bʊk/', chinese: '书', example: 'I like reading books.' },
					{ word: 'cat', phonetic: '/kæt/', chinese: '猫', example: 'The cat is sleeping.' }
				],
				daily: [
					{ word: 'important', phonetic: '/ɪmˈpɔːtənt/', chinese: '重要的', example: 'This is very important.' },
					{ word: 'different', phonetic: '/ˈdɪfrənt/', chinese: '不同的', example: 'They are different.' },
					{ word: 'beautiful', phonetic: '/ˈbjuːtɪfəl/', chinese: '美丽的', example: 'What a beautiful day!' },
					{ word: 'understand', phonetic: '/ˌʌndəˈstænd/', chinese: '理解', example: 'I understand now.' },
					{ word: 'remember', phonetic: '/rɪˈmembə/', chinese: '记住', example: 'Please remember this.' }
				],
				advanced: [
					{ word: 'phenomenon', phonetic: '/fəˈnɒmɪnən/', chinese: '现象', example: 'This is a natural phenomenon.' },
					{ word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', chinese: '环境', example: 'We must protect the environment.' },
					{ word: 'experience', phonetic: '/ɪkˈspɪərɪəns/', chinese: '经验', example: 'He has a lot of experience.' },
					{ word: 'opportunity', phonetic: '/ˌɒpəˈtjuːnɪti/', chinese: '机会', example: 'This is a great opportunity.' },
					{ word: 'responsibility', phonetic: '/rɪˌspɒnsəˈbɪlɪti/', chinese: '责任', example: 'It is your responsibility.' }
				]
			},
			wordStatus: {},
			totalLearned: 0,
			masteredCount: 0,
			correctCount: 0,
			totalAttempts: 0
		}
	},
	computed: {
		currentWords() {
			return this.wordLists[this.currentWordbook] || [];
		},
		currentWord() {
			return this.currentWords[this.currentWordIndex] || null;
		},
		newWordsCount() {
			const words = this.currentWords;
			let count = 0;
			for (let word of words) {
				if (!this.wordStatus[word.word]) {
					count++;
				}
			}
			return Math.min(count, this.dailyPlan);
		},
		reviewWordsCount() {
			const today = new Date().toDateString();
			let count = 0;
			for (let word in this.wordStatus) {
				const status = this.wordStatus[word];
				if (status.nextReview === today && status.reviewed !== today) {
					count++;
				}
			}
			return count;
		},
		accuracy() {
			if (this.totalAttempts === 0) return 0;
			return Math.round((this.correctCount / this.totalAttempts) * 100);
		}
	},
	onLoad() {
		this.loadWordStatus();
		this.startNewSession();
	},
	methods: {
		selectWordbook(type) {
			this.currentWordbook = type;
			this.currentWordIndex = 0;
			this.showBack = false;
			this.startNewSession();
		},
		flipCard() {
			this.showBack = !this.showBack;
		},
		markAsKnow() {
			const word = this.currentWord.word;
			const today = new Date().toDateString();
			
			if (!this.wordStatus[word]) {
				this.wordStatus[word] = {
					easeFactor: 2.5,
					interval: 1,
					repetition: 0,
					nextReview: today,
					mastered: false
				};
			}
			
			const status = this.wordStatus[word];
			status.repetition++;
			status.reviewed = today;
			
			// SRS算法更新
			if (status.repetition >= 3) {
				status.mastered = true;
				status.interval = Math.ceil(status.interval * status.easeFactor);
			} else {
				status.interval = 1;
			}
			
			// 更新下次复习时间
			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + status.interval);
			status.nextReview = nextDate.toDateString();
			
			this.correctCount++;
			this.totalAttempts++;
			this.updateStats();
			this.saveWordStatus();
			this.nextWord();
		},
		markAsUnknown() {
			const word = this.currentWord.word;
			const today = new Date().toDateString();
			
			if (!this.wordStatus[word]) {
				this.wordStatus[word] = {
					easeFactor: 2.5,
					interval: 1,
					repetition: 0,
					nextReview: today,
					mastered: false
				};
			}
			
			const status = this.wordStatus[word];
			status.repetition = 0;
			status.interval = 1;
			status.reviewed = today;
			status.mastered = false;
			
			// 更新下次复习时间为明天
			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 1);
			status.nextReview = nextDate.toDateString();
			
			this.totalAttempts++;
			this.updateStats();
			this.saveWordStatus();
			this.nextWord();
		},
		nextWord() {
			this.showBack = false;
			this.currentWordIndex++;
			
			// 检查是否完成今日学习
			if (this.currentWordIndex >= this.currentWords.length) {
				this.currentWordIndex = 0;
				uni.showToast({
					title: '今日学习完成！',
					icon: 'success'
				});
			}
		},
		startMode(mode) {
			const modeNames = {
				listen: '听音辨义',
				read: '看英文想中文',
				write: '拼写默写',
				speak: '单词跟读'
			};
			uni.showToast({
				title: '开始' + modeNames[mode] + '模式',
				icon: 'none'
			});
		},
		loadWordStatus() {
			try {
				const status = uni.getStorageSync('wordStatus');
				if (status) {
					this.wordStatus = status;
				}
			} catch (e) {
				console.error('加载单词状态失败:', e);
			}
		},
		saveWordStatus() {
			try {
				uni.setStorageSync('wordStatus', this.wordStatus);
			} catch (e) {
				console.error('保存单词状态失败:', e);
			}
		},
		updateStats() {
			this.totalLearned = Object.keys(this.wordStatus).length;
			this.masteredCount = 0;
			for (let word in this.wordStatus) {
				if (this.wordStatus[word].mastered) {
					this.masteredCount++;
				}
			}
		},
		startNewSession() {
			// 重置今日学习状态
			const today = new Date().toDateString();
			for (let word in this.wordStatus) {
				if (this.wordStatus[word].nextReview === today) {
					this.wordStatus[word].reviewed = null;
				}
			}
			this.saveWordStatus();
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

.wordbook-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.wordbook-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.wordbook-item.active {
	background-color: #E6F7F5;
}

.wordbook-info {
	flex: 1;
}

.wordbook-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.wordbook-count {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.wordbook-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}

.study-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.study-info {
	display: flex;
	flex-direction: column;
}

.study-new, .study-review {
	font-size: 28rpx;
	color: #333333;
	margin-bottom: 10rpx;
}

.study-plan {
	display: flex;
	align-items: center;
}

.plan-text {
	font-size: 28rpx;
	color: #333333;
}

.plan-number {
	font-size: 36rpx;
	font-weight: bold;
	color: #0D9488;
	margin: 0 10rpx;
}

.card-container {
	display: flex;
	justify-content: center;
	padding: 20rpx 0;
}

.card {
	width: 500rpx;
	height: 600rpx;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
	overflow: hidden;
}

.card-front, .card-back {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 30rpx;
}

.card-word {
	font-size: 60rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-bottom: 20rpx;
}

.card-phonetic {
	font-size: 32rpx;
	color: #7A7A7A;
	margin-bottom: 20rpx;
}

.card-hint {
	font-size: 24rpx;
	color: #0D9488;
}

.card-meaning {
	font-size: 48rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-bottom: 20rpx;
}

.card-example {
	font-size: 28rpx;
	color: #333333;
	text-align: center;
	margin-bottom: 30rpx;
}

.card-actions {
	display: flex;
	justify-content: space-around;
	width: 100%;
}

.action-btn {
	padding: 15rpx 40rpx;
	border-radius: 10rpx;
	font-size: 28rpx;
	font-weight: bold;
}

.action-btn.know {
	background-color: #0D9488;
	color: #FFFFFF;
}

.action-btn.unknown {
	background-color: #F0F0F0;
	color: #333333;
}

.stats-card {
	display: flex;
	justify-content: space-around;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
}

.stat-item {
	text-align: center;
}

.stat-number {
	font-size: 48rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
}

.stat-label {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
}

.mode-list {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.mode-item {
	width: 48%;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	text-align: center;
	box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
}

.mode-icon {
	font-size: 48rpx;
	display: block;
	margin-bottom: 10rpx;
}

.mode-text {
	font-size: 28rpx;
	color: #333333;
	display: block;
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
</style>