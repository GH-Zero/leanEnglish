<template>
	<view class="page">
		<!-- 答题界面 -->
		<template v-if="!completed">
			<!-- 固定头部 -->
			<view class="header">
				<text class="title">{{ challengeTitle }}</text>
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
				</view>
				<text class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</text>
			</view>

			<!-- 可滚动内容区 -->
			<scroll-view class="scroll-content" scroll-y>
				<view class="word-card" v-if="questions.length > 0">
					<!-- 单词闯关：显示英文，选中文 -->
					<template v-if="challengeType === 'word'">
						<view class="word-main">
							<text class="word-en">{{ currentQuestion.word }}</text>
							<text class="word-phonetic">{{ currentQuestion.phonetic }}</text>
							<view class="play-btn" @click="playWord">
								<text class="play-icon">🔊</text>
								<text class="play-text">播放发音</text>
							</view>
						</view>
						<view class="question-hint">请选择正确的中文释义</view>
					</template>

					<!-- 口语挑战：播放音频，选英文单词 -->
					<template v-if="challengeType === 'speak'">
						<view class="word-main">
							<view class="big-play-btn" @click="playWord">
								<text class="big-play-icon">🔊</text>
							</view>
							<text class="word-phonetic">{{ currentQuestion.phonetic }}</text>
						</view>
						<view class="question-hint">听发音，选择正确的单词</view>
					</template>

					<!-- 语法闯关：语法填空 -->
					<template v-if="challengeType === 'grammar'">
						<view class="grammar-main">
							<text class="grammar-sentence">{{ currentQuestion.sentence }}</text>
							<view class="play-btn" @click="playSentence">
								<text class="play-icon">🔊</text>
								<text class="play-text">播放句子</text>
							</view>
						</view>
						<view class="question-hint">选择正确的选项填入空格</view>
					</template>

					<view class="options">
						<view 
							v-for="(option, index) in currentQuestion.options" 
							:key="index"
							class="option-item"
							:class="{ 
								correct: showResult && isCorrectOption(index),
								wrong: showResult && selectedOption === index && !isCorrectOption(index)
							}"
							@click="selectOption(index)"
						>
							<text class="option-text">{{ option }}</text>
						</view>
					</view>

					<view class="result-card" v-if="showResult">
						<text class="result-icon">{{ isCorrect ? '🎉' : '😅' }}</text>
						<text class="result-text">{{ isCorrect ? '回答正确！' : '再接再厉！' }}</text>
						<text class="result-meaning" v-if="challengeType === 'word'">{{ currentQuestion.meaning }}</text>
						<text class="result-meaning" v-if="challengeType === 'speak'">{{ currentQuestion.word }} - {{ currentQuestion.meaning }}</text>
						<text class="result-meaning" v-if="challengeType === 'grammar'">{{ currentQuestion.explanation }}</text>
					</view>
				</view>
			</scroll-view>

			<!-- 固定底部按钮 -->
			<view class="bottom-bar">
				<view class="action-btn" @click="nextQuestion">
					<text class="btn-text">{{ currentIndex === questions.length - 1 ? '查看结果' : '下一题' }}</text>
				</view>
			</view>
		</template>

		<!-- 闯关完成界面 -->
		<view class="complete-card" v-if="completed">
			<text class="complete-icon">🏆</text>
			<text class="complete-title">闯关完成！</text>
			<view class="score-info">
				<text class="score-number">{{ correctCount }}</text>
				<text class="score-label">正确</text>
				<text class="score-divider">/</text>
				<text class="score-number">{{ questions.length }}</text>
				<text class="score-label">总题</text>
			</view>
			<text class="complete-msg">{{ scoreMessage }}</text>
			<view class="btn-group">
				<view class="action-btn" @click="restartChallenge">
					<text class="btn-text">再来一次</text>
				</view>
				<view class="action-btn secondary" @click="goBack">
					<text class="btn-text">返回首页</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
// 单词库
const wordLibrary = [
	{ word: 'apple', phonetic: '/ˈæpl/', meaning: '苹果' },
	{ word: 'book', phonetic: '/bʊk/', meaning: '书' },
	{ word: 'cat', phonetic: '/kæt/', meaning: '猫' },
	{ word: 'dog', phonetic: '/dɒɡ/', meaning: '狗' },
	{ word: 'elephant', phonetic: '/ˈelɪfənt/', meaning: '大象' },
	{ word: 'fish', phonetic: '/fɪʃ/', meaning: '鱼' },
	{ word: 'good', phonetic: '/ɡʊd/', meaning: '好的' },
	{ word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的' },
	{ word: 'ice', phonetic: '/aɪs/', meaning: '冰' },
	{ word: 'juice', phonetic: '/dʒuːs/', meaning: '果汁' },
	{ word: 'kind', phonetic: '/kaɪnd/', meaning: '善良的' },
	{ word: 'love', phonetic: '/lʌv/', meaning: '爱' },
	{ word: 'music', phonetic: '/ˈmjuːzɪk/', meaning: '音乐' },
	{ word: 'night', phonetic: '/naɪt/', meaning: '夜晚' },
	{ word: 'open', phonetic: '/ˈəʊpən/', meaning: '打开' },
	{ word: 'queen', phonetic: '/kwiːn/', meaning: '女王' },
	{ word: 'run', phonetic: '/rʌn/', meaning: '跑' },
	{ word: 'sun', phonetic: '/sʌn/', meaning: '太阳' },
	{ word: 'tree', phonetic: '/triː/', meaning: '树' },
	{ word: 'water', phonetic: '/ˈwɔːtə/', meaning: '水' },
	{ word: 'young', phonetic: '/jʌŋ/', meaning: '年轻的' },
	{ word: 'beautiful', phonetic: '/ˈbjuːtɪfl/', meaning: '美丽的' },
	{ word: 'dangerous', phonetic: '/ˈdeɪndʒərəs/', meaning: '危险的' },
	{ word: 'expensive', phonetic: '/ɪkˈspensɪv/', meaning: '昂贵的' },
	{ word: 'important', phonetic: '/ɪmˈpɔːtənt/', meaning: '重要的' },
	{ word: 'interesting', phonetic: '/ˈɪntrəstɪŋ/', meaning: '有趣的' },
	{ word: 'wonderful', phonetic: '/ˈwʌndəfl/', meaning: '精彩的' },
	{ word: 'difficult', phonetic: '/ˈdɪfɪkəlt/', meaning: '困难的' },
	{ word: 'delicious', phonetic: '/dɪˈlɪʃəs/', meaning: '美味的' }
];

// 语法题库
const grammarLibrary = [
	{ sentence: 'I ___ a student.', answer: 'am', options: ['am', 'is', 'are', 'be'], explanation: '主语 I 用 am' },
	{ sentence: 'She ___ English every day.', answer: 'speaks', options: ['speak', 'speaks', 'speaking', 'spoke'], explanation: '主语 She 是第三人称单数，动词加 s' },
	{ sentence: 'They ___ playing football.', answer: 'are', options: ['is', 'am', 'are', 'was'], explanation: '主语 They 用 are' },
	{ sentence: 'I ___ to school yesterday.', answer: 'went', options: ['go', 'goes', 'went', 'going'], explanation: 'yesterday 表示过去时，用 went' },
	{ sentence: 'He ___ like apples.', answer: 'does not', options: ['do not', 'does not', 'is not', 'are not'], explanation: '主语 He 是第三人称单数，用 does not' },
	{ sentence: '___ you like coffee?', answer: 'Do', options: ['Do', 'Does', 'Is', 'Are'], explanation: '主语 you 用 Do' },
	{ sentence: 'The cat ___ on the table.', answer: 'is', options: ['is', 'are', 'am', 'be'], explanation: '主语 The cat 是单数，用 is' },
	{ sentence: 'We ___ happy.', answer: 'are', options: ['is', 'am', 'are', 'was'], explanation: '主语 We 用 are' },
	{ sentence: 'She ___ a book now.', answer: 'is reading', options: ['read', 'reads', 'is reading', 'readed'], explanation: 'now 表示现在进行时，用 is reading' },
	{ sentence: 'I ___ finished my homework.', answer: 'have', options: ['have', 'has', 'had', 'having'], explanation: '主语 I 用 have' },
	{ sentence: '___ it rain yesterday?', answer: 'Did', options: ['Do', 'Does', 'Did', 'Was'], explanation: 'yesterday 表示过去时，用 Did' },
	{ sentence: 'He ___ two brothers.', answer: 'has', options: ['have', 'has', 'having', 'haves'], explanation: '主语 He 是第三人称单数，用 has' }
];

// 中文干扰项
const chineseDistractors = ['快乐的', '悲伤的', '愤怒的', '害怕的', '惊讶的', '无聊的', '有趣的', '简单的', '困难的', '容易的', '重要的', '普通的', '美丽的', '丑陋的', '便宜的', '昂贵的', '安全的', '免费的'];

// 英文干扰项
const englishDistractors = ['apple', 'book', 'cat', 'dog', 'fish', 'good', 'happy', 'love', 'run', 'sun', 'tree', 'water', 'beautiful', 'dangerous', 'expensive', 'important'];

export default {
	data() {
		return {
			challengeType: 'word',
			challengeTitle: '每日单词闯关',
			questions: [],
			currentIndex: 0,
			selectedOption: -1,
			showResult: false,
			isCorrect: false,
			correctCount: 0,
			completed: false,
			audioContext: null
		}
	},
	computed: {
		currentQuestion() {
			return this.questions[this.currentIndex] || {};
		},
		progressPercent() {
			return ((this.currentIndex) / this.questions.length) * 100;
		},
		scoreMessage() {
			const rate = this.correctCount / this.questions.length;
			if (rate >= 0.9) return '太棒了！你是闯关大师！';
			if (rate >= 0.7) return '很不错！继续加油！';
			if (rate >= 0.5) return '还可以，多练习几次！';
			return '需要更多努力，加油！';
		}
	},
	onLoad(options) {
		if (options.type) {
			this.challengeType = options.type;
			this.setChallengeTitle(options.type);
		}
		this.loadQuestions();
	},
	onUnload() {
		if (this.audioContext) {
			this.audioContext.destroy();
		}
	},
	methods: {
		setChallengeTitle(type) {
			const titles = {
				'word': '每日单词闯关',
				'speak': '口语挑战',
				'grammar': '语法闯关'
			};
			this.challengeTitle = titles[type] || '每日单词闯关';
		},
		loadQuestions() {
			if (this.challengeType === 'word') {
				this.loadWordQuestions();
			} else if (this.challengeType === 'speak') {
				this.loadSpeakQuestions();
			} else if (this.challengeType === 'grammar') {
				this.loadGrammarQuestions();
			}
		},
		loadWordQuestions() {
			const shuffled = [...wordLibrary].sort(() => Math.random() - 0.5);
			this.questions = shuffled.slice(0, 10).map(item => ({
				...item,
				options: this.generateChineseOptions(item.meaning)
			}));
		},
		loadSpeakQuestions() {
			const shuffled = [...wordLibrary].sort(() => Math.random() - 0.5);
			this.questions = shuffled.slice(0, 10).map(item => ({
				...item,
				options: this.generateEnglishOptions(item.word)
			}));
		},
		loadGrammarQuestions() {
			const shuffled = [...grammarLibrary].sort(() => Math.random() - 0.5);
			this.questions = shuffled.slice(0, 10);
		},
		generateChineseOptions(correctMeaning) {
			const others = chineseDistractors.filter(d => d !== correctMeaning);
			const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
			return [correctMeaning, ...shuffled].sort(() => Math.random() - 0.5);
		},
		generateEnglishOptions(correctWord) {
			const others = englishDistractors.filter(d => d !== correctWord);
			const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
			return [correctWord, ...shuffled].sort(() => Math.random() - 0.5);
		},
		playWord() {
			const word = this.currentQuestion.word;
			if (!word) return;
			if (this.audioContext) {
				this.audioContext.destroy();
			}
			this.audioContext = uni.createInnerAudioContext();
			this.audioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
			this.audioContext.play();
		},
		playSentence() {
			// 将句子中的 ___ 替换为正确答案来朗读完整句子
			const sentence = this.currentQuestion.sentence.replace('___', this.currentQuestion.answer);
			if (!sentence) return;
			if (this.audioContext) {
				this.audioContext.destroy();
			}
			this.audioContext = uni.createInnerAudioContext();
			this.audioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(sentence)}&type=2`;
			this.audioContext.play();
		},
		isCorrectOption(index) {
			const option = this.currentQuestion.options[index];
			if (this.challengeType === 'word') {
				return option === this.currentQuestion.meaning;
			} else if (this.challengeType === 'speak') {
				return option === this.currentQuestion.word;
			} else if (this.challengeType === 'grammar') {
				return option === this.currentQuestion.answer;
			}
			return false;
		},
		selectOption(index) {
			if (this.showResult) return;
			
			this.selectedOption = index;
			this.showResult = true;
			this.isCorrect = this.isCorrectOption(index);
			if (this.isCorrect) {
				this.correctCount++;
			}
		},
		nextQuestion() {
			if (this.currentIndex === this.questions.length - 1) {
				this.completed = true;
				return;
			}
			this.currentIndex++;
			this.selectedOption = -1;
			this.showResult = false;
			this.isCorrect = false;
		},
		restartChallenge() {
			this.currentIndex = 0;
			this.selectedOption = -1;
			this.showResult = false;
			this.isCorrect = false;
			this.correctCount = 0;
			this.completed = false;
			this.loadQuestions();
		},
		goBack() {
			uni.switchTab({ url: '/pages/home/index' });
		}
	}
}
</script>

<style>
.page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #F7F5F0;
}

.header {
	text-align: center;
	padding: 20rpx 20rpx 10rpx;
	background-color: #F7F5F0;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 16rpx;
}

.progress-bar {
	height: 12rpx;
	background-color: #E5E7EB;
	border-radius: 6rpx;
	overflow: hidden;
	margin: 16rpx 0;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #1F3A5F, #3B82F6);
	border-radius: 6rpx;
	transition: width 0.3s ease;
}

.progress-text {
	font-size: 26rpx;
	color: #666;
}

.scroll-content {
	flex: 1;
	overflow: hidden;
	padding: 0 20rpx;
}

.word-card {
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 40rpx;
	box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}

.word-main {
	text-align: center;
	padding: 30rpx 0;
	border-bottom: 1rpx solid #F0F0F0;
	margin-bottom: 20rpx;
}

.word-en {
	font-size: 56rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 16rpx;
}

.word-phonetic {
	font-size: 28rpx;
	color: #999;
	display: block;
	margin-bottom: 20rpx;
}

.grammar-main {
	text-align: center;
	padding: 30rpx 0;
	border-bottom: 1rpx solid #F0F0F0;
	margin-bottom: 20rpx;
}

.grammar-sentence {
	font-size: 36rpx;
	color: #333;
	line-height: 1.6;
}

.question-hint {
	text-align: center;
	font-size: 26rpx;
	color: #666;
	margin-bottom: 20rpx;
}

.play-btn {
	display: inline-flex;
	align-items: center;
	padding: 12rpx 24rpx;
	background: linear-gradient(135deg, #3B82F6, #2563EB);
	border-radius: 30rpx;
	margin-top: 10rpx;
}

.play-btn:active {
	transform: scale(0.95);
}

.play-icon {
	font-size: 28rpx;
	margin-right: 8rpx;
}

.play-text {
	font-size: 24rpx;
	color: #FFFFFF;
}

.big-play-btn {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #3B82F6, #2563EB);
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 20rpx;
}

.big-play-btn:active {
	transform: scale(0.95);
}

.big-play-icon {
	font-size: 48rpx;
}

.options {
	margin: 30rpx 0;
}

.option-item {
	padding: 28rpx 32rpx;
	background-color: #F8FAFC;
	border: 2rpx solid #E2E8F0;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	transition: all 0.2s ease;
}

.option-item:active {
	transform: scale(0.98);
}

.option-item.correct {
	background-color: #D1FAE5;
	border-color: #10B981;
}

.option-item.wrong {
	background-color: #FEE2E2;
	border-color: #EF4444;
}

.option-text {
	font-size: 30rpx;
	color: #333;
}

.result-card {
	text-align: center;
	padding: 30rpx;
	background-color: #F8FAFC;
	border-radius: 16rpx;
	margin-top: 20rpx;
}

.result-icon {
	font-size: 60rpx;
	display: block;
	margin-bottom: 16rpx;
}

.result-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 12rpx;
}

.result-meaning {
	font-size: 28rpx;
	color: #666;
	display: block;
}

.bottom-bar {
	padding: 20rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background-color: #F7F5F0;
}

.action-btn {
	text-align: center;
	padding: 28rpx;
	background: linear-gradient(135deg, #1F3A5F, #3B82F6);
	border-radius: 16rpx;
}

.action-btn.secondary {
	background: linear-gradient(135deg, #6B7280, #9CA3AF);
}

.action-btn:active {
	transform: scale(0.98);
}

.btn-text {
	font-size: 32rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.complete-card {
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 80rpx 40rpx;
	margin: 100rpx 20rpx 0;
	text-align: center;
	box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
}

.complete-icon {
	font-size: 100rpx;
	display: block;
	margin-bottom: 20rpx;
}

.complete-title {
	font-size: 44rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 30rpx;
}

.score-info {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 30rpx;
}

.score-number {
	font-size: 56rpx;
	font-weight: bold;
	color: #1F3A5F;
}

.score-label {
	font-size: 26rpx;
	color: #666;
	margin-left: 8rpx;
}

.score-divider {
	font-size: 40rpx;
	color: #CCC;
	margin: 0 20rpx;
}

.complete-msg {
	font-size: 28rpx;
	color: #666;
	display: block;
	margin-bottom: 40rpx;
}

.btn-group {
	display: flex;
	gap: 20rpx;
}

.btn-group .action-btn {
	flex: 1;
	margin-top: 0;
}
</style>
