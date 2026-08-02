<template>
	<view class="page">
		<AchievementUnlockNotifier />
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
							<text v-if="currentQuestion.translation" class="grammar-translation">中文：{{ currentQuestion.translation }}</text>
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
							<text class="option-meaning" v-if="challengeType === 'speak'">{{ optionMeaning(option) }}</text>
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
import { request as apiRequest, updateWordStats, updateGrammarStats, updateSpeakStats } from '@/utils/api.js';
import { getAudioSettings } from '@/utils/learning-settings.js';
import { playTts, clearTtsQueue } from '@/utils/tts-player.js';


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
			audioContext: null,
			audioRequestId: 0,
			autoPlay: true,
			voiceType: 1
		}
	},
	computed: {
		currentQuestion() {
			return this.questions[this.currentIndex] || {};
		},
		progressPercent() {
			if (!this.questions.length) return 0;
			return (this.currentIndex / this.questions.length) * 100;
		},
		scoreMessage() {
			const rate = this.correctCount / this.questions.length;
			if (rate >= 0.9) return '太棒了！你是闯关大师！';
			if (rate >= 0.7) return '很不错！继续加油！';
			if (rate >= 0.5) return '还可以，多练习几次！';
			return '需要更多努力，加油！';
		}
	},
	async onLoad(options) {
		const audioSettings = await getAudioSettings();
		this.autoPlay = audioSettings.autoPlay;
		this.voiceType = audioSettings.voiceType;
		if (options.type) {
			this.challengeType = options.type;
			this.setChallengeTitle(options.type);
		}
		await this.loadQuestions();
	},
	onUnload() {
		clearTtsQueue();
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
		async loadQuestions() {
			uni.showLoading({ title: '加载中...' });
			try {
				if (this.challengeType === 'word') {
					await this.loadWordQuestions();
				} else if (this.challengeType === 'speak') {
					await this.loadSpeakQuestions();
				} else if (this.challengeType === 'grammar') {
					await this.loadGrammarQuestions();
				}
			} catch (e) {
				console.error('加载题目失败:', e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				uni.hideLoading();
			}
			if (this.autoPlay && this.challengeType !== 'grammar' && this.questions.length && !this.completed) {
				setTimeout(() => this.autoPlayCurrent(), 300);
			}
		},
		async loadWordQuestions() {
			// 与口语挑战保持一致：每次都从完整词库随机抽取候选词。
			const words = await apiRequest('/words/random?count=20');
			if (!words || words.length === 0) {
				uni.showToast({ title: '暂无单词数据', icon: 'none' });
				return;
			}
			// 从所有单词中随机选3个作为干扰项
			const allMeanings = words.map(w => w.chinese);
			this.questions = words.slice(0, 10).map(item => {
				const others = allMeanings.filter(m => m !== item.chinese);
				const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
				return {
					word: item.word,
					phonetic: item.phonetic_us,
					meaning: item.chinese,
					options: [item.chinese, ...shuffled].sort(() => Math.random() - 0.5)
				};
			});
		},
		async loadSpeakQuestions() {
			const words = await apiRequest('/words/random?count=20');
			if (!words || words.length === 0) {
				uni.showToast({ title: '暂无单词数据', icon: 'none' });
				return;
			}
			const allWords = words.map(w => w.word);
			const meaningMap = Object.fromEntries(words.map(word => [word.word, word.chinese || '暂无中文释义']));
			this.questions = words.slice(0, 10).map(item => {
				const others = allWords.filter(w => w !== item.word);
				const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
				return {
					word: item.word,
					phonetic: item.phonetic_us,
					meaning: item.chinese,
					optionMeanings: meaningMap,
					options: [item.word, ...shuffled].sort(() => Math.random() - 0.5)
				};
			});
		},
		async loadGrammarQuestions() {
			const questions = await apiRequest('/grammar-question/random?count=10');
			if (!questions || questions.length === 0) {
				uni.showToast({ title: '暂无语法题', icon: 'none' });
				return;
			}
			this.questions = questions.map(q => ({
				sentence: q.sentence,
				answer: q.answer,
				options: q.options,
				explanation: q.explanation
			}));
		},
		optionMeaning(option) {
			return this.currentQuestion?.optionMeanings?.[option] || '暂无中文释义';
		},
		autoPlayCurrent() {
			if (!this.autoPlay || this.completed || !this.questions.length) return;
			if (this.challengeType === 'grammar') return;
			else this.playWord();
		},
		playWord() {
			const word = this.currentQuestion.word;
			if (!word) return;
			this.playAudioText(word, this.voiceType);
		},
		playSentence() {
			// 将句子中的 ___ 替换为正确答案来朗读完整句子
			const question = this.currentQuestion || {};
			if (!question.sentence) {
				uni.showToast({ title: '当前题目暂无语音', icon: 'none' });
				return;
			}
			const sentence = String(question.sentence).replace('___', question.answer || '');
			this.playAudioText(sentence, this.voiceType);
		},
		playAudioText(text) {
			const value = String(text || '').trim();
			if (!value) return;
			playTts(value, 3).catch(error => {
				console.error('语音播放失败:', error);
				uni.showToast({ title: error?.message || '语音播放失败', icon: 'none' });
			});
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
				this.recordChallengeResult();
				return;
			}
			this.currentIndex++;
			this.selectedOption = -1;
			this.showResult = false;
			this.isCorrect = false;
			if (this.autoPlay && this.challengeType !== 'grammar') setTimeout(() => this.autoPlayCurrent(), 250);
		},
		async recordChallengeResult() {
			const accuracy = this.correctCount / this.questions.length;
			const isCorrect = accuracy >= 0.6;
			try {
				if (this.challengeType === 'word') {
					await updateWordStats(this.correctCount, isCorrect);
				} else if (this.challengeType === 'grammar') {
					await updateGrammarStats(this.correctCount, isCorrect);
				} else if (this.challengeType === 'speak') {
					await updateSpeakStats(this.correctCount);
				}
			} catch (e) {
				console.error('记录闯关结果失败:', e);
			}
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

.grammar-translation { display:block; margin-top:14rpx; padding:14rpx 18rpx; border-radius:12rpx; background:#f5f8fa; color:#667786; font-size:25rpx; line-height:1.55; }
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
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
}

.option-meaning {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: #7B8794;
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

