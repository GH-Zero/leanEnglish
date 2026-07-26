<template>
	<view class="container">
		<view class="header">
			<text class="title">单词学习</text>
			<text class="subtitle">艾宾浩斯科学记忆</text>
		</view>

		<!-- 词库选择 -->
		<view class="section">
			<text class="section-title">词库选择</text>
			<view class="wordbook-list">
				<view class="wordbook-item" :class="{ active: currentLevel === 0 }" @click="selectLevel(0)">
					<view class="wordbook-info">
						<text class="wordbook-name">零基础入门词</text>
						<text class="wordbook-count">{{ levelCounts[0] || 0 }}词</text>
					</view>
					<text class="wordbook-arrow">›</text>
				</view>
				<view class="wordbook-item" :class="{ active: currentLevel === 1 }" @click="selectLevel(1)">
					<view class="wordbook-info">
						<text class="wordbook-name">日常交流核心词</text>
						<text class="wordbook-count">{{ levelCounts[1] || 0 }}词</text>
					</view>
					<text class="wordbook-arrow">›</text>
				</view>
				<view class="wordbook-item" :class="{ active: currentLevel === 2 }" @click="selectLevel(2)">
					<view class="wordbook-info">
						<text class="wordbook-name">进阶高频口语词</text>
						<text class="wordbook-count">{{ levelCounts[2] || 0 }}词</text>
					</view>
					<text class="wordbook-arrow">›</text>
				</view>
			</view>
		</view>

		<!-- 今日学习统计 -->
		<view class="section">
			<text class="section-title">今日学习</text>
			<view class="study-card">
				<view class="study-info">
					<text class="study-new">新词：{{ todayNew }}</text>
					<text class="study-review">复习：{{ todayReview }}</text>
				</view>
				<view class="study-plan">
					<text class="plan-text">每日计划：</text>
					<text class="plan-number">{{ dailyPlan }}</text>
					<text class="plan-text">词</text>
				</view>
			</view>
		</view>

		<!-- 学习模式选择 -->
		<view class="section" v-if="!learningMode">
			<text class="section-title">选择学习模式</text>
			<view class="mode-grid">
				<view class="mode-card" @click="startMode('listen')">
					<text class="mode-icon">👂</text>
					<text class="mode-name">听音辨义</text>
					<text class="mode-desc">播放发音，选择中文释义</text>
				</view>
				<view class="mode-card" @click="startMode('read')">
					<text class="mode-icon">👀</text>
					<text class="mode-name">看英文想中文</text>
					<text class="mode-desc">显示英文，回忆中文意思</text>
				</view>
				<view class="mode-card" @click="startMode('write')">
					<text class="mode-icon">✍️</text>
					<text class="mode-name">拼写默写</text>
					<text class="mode-desc">显示中文，拼写英文单词</text>
				</view>
				<view class="mode-card" @click="startMode('speak')">
					<text class="mode-icon">🗣️</text>
					<text class="mode-name">单词跟读</text>
					<text class="mode-desc">听发音，跟读练习</text>
				</view>
			</view>
		</view>

		<!-- 听音辨义模式 -->
		<view class="section" v-if="learningMode === 'listen'">
			<view class="mode-header">
				<text class="mode-title">听音辨义</text>
				<text class="mode-progress">{{ modeIndex + 1 }} / {{ modeWords.length }}</text>
				<text class="mode-close" @click="exitMode">✕ 退出</text>
			</view>
			<view class="listen-card" v-if="currentModeWord">
				<text class="listen-word">{{ currentModeWord.word }}</text>
				<text class="listen-phonetic">{{ currentModeWord.phonetic_us }}</text>
				<view class="listen-play" @click="playWord(currentModeWord.word)">
					<text class="play-icon">🔊</text>
					<text class="play-text">点击播放</text>
				</view>
				<text class="listen-hint">听发音，选择正确的中文释义</text>
				<view class="options-list">
					<view class="option-item" v-for="(opt, i) in currentOptions" :key="i"
						:class="{ correct: showResult && opt === currentModeWord.chinese, wrong: showResult && selectedOption === opt && opt !== currentModeWord.chinese }"
						@click="selectOption(opt)">
						<text class="option-text">{{ opt }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 看英文想中文模式 -->
		<view class="section" v-if="learningMode === 'read'">
			<view class="mode-header">
				<text class="mode-title">看英文想中文</text>
				<text class="mode-progress">{{ modeIndex + 1 }} / {{ modeWords.length }}</text>
				<text class="mode-close" @click="exitMode">✕ 退出</text>
			</view>
			<view class="read-card" v-if="currentModeWord">
				<view class="read-front" v-if="!showBack" @click="flipCard">
					<text class="read-word">{{ currentModeWord.word }}</text>
					<text class="read-phonetic">{{ currentModeWord.phonetic_us }}</text>
					<text class="read-hint">点击查看中文</text>
				</view>
				<view class="read-back" v-else>
					<text class="read-meaning">{{ currentModeWord.chinese }}</text>
					<text class="read-example">{{ currentModeWord.example }}</text>
					<view class="read-actions">
						<text class="action-btn know" @click="markKnown">认识</text>
						<text class="action-btn unknown" @click="markUnknown">不认识</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 拼写默写模式 -->
		<view class="section" v-if="learningMode === 'write'">
			<view class="mode-header">
				<text class="mode-title">拼写默写</text>
				<text class="mode-progress">{{ modeIndex + 1 }} / {{ modeWords.length }}</text>
				<text class="mode-close" @click="exitMode">✕ 退出</text>
			</view>
			<view class="write-card" v-if="currentModeWord">
				<text class="write-meaning">{{ currentModeWord.chinese }}</text>
				<text class="write-phonetic">{{ currentModeWord.phonetic_us }}</text>
				<input class="write-input" v-model="writeInput" placeholder="请输入英文单词"
					@confirm="checkSpelling" :disabled="showResult" />
				<view class="write-actions">
					<text class="action-btn submit" @click="checkSpelling" v-if="!showResult">确认</text>
					<text class="action-btn next" @click="nextModeWord" v-else>下一个</text>
				</view>
				<text class="write-result" v-if="showResult">
					{{ writeResult === 'correct' ? '✅ 正确！' : '❌ 正确答案：' + currentModeWord.word }}
				</text>
				<view class="write-actions" v-if="!showResult">
					<text class="action-btn hint" @click="showWriteHint">提示</text>
				</view>
				<text class="write-hint-text" v-if="writeHint">{{ writeHint }}</text>
			</view>
		</view>

		<!-- 单词跟读模式 -->
		<view class="section" v-if="learningMode === 'speak'">
			<view class="mode-header">
				<text class="mode-title">单词跟读</text>
				<text class="mode-progress">{{ modeIndex + 1 }} / {{ modeWords.length }}</text>
				<text class="mode-close" @click="exitMode">✕ 退出</text>
			</view>
			<view class="speak-card" v-if="currentModeWord">
				<text class="speak-word">{{ currentModeWord.word }}</text>
				<text class="speak-phonetic">{{ currentModeWord.phonetic_us }}</text>
				<text class="speak-meaning">{{ currentModeWord.chinese }}</text>
				<view class="speak-play" @click="playWord(currentModeWord.word)">
					<text class="play-icon">🔊</text>
					<text class="play-text">播放标准发音</text>
				</view>
				<view class="speak-record" :class="{ recording: isRecording }" @click="toggleRecord">
					<text class="record-icon">{{ isRecording ? '⏹️' : '🎤' }}</text>
					<text class="record-text">{{ isRecording ? '停止录音' : '点击跟读' }}</text>
				</view>
				<view class="speak-result" v-if="speakScore > 0">
					<text class="score-text">发音评分：{{ speakScore }}分</text>
					<view class="score-bar">
						<view class="score-fill" :style="{ width: speakScore + '%' }"></view>
					</view>
					<text class="speak-meaning">释义：{{ currentModeWord.chinese }}</text>
					<text class="action-btn next" @click="nextModeWord">下一个</text>
				</view>
			</view>
		</view>

		<!-- 记忆卡片（默认模式） -->
		<view class="section" v-if="!learningMode">
			<text class="section-title">记忆卡片</text>
			<view class="card-container" v-if="currentWord">
				<view class="card" @click="flipCard">
					<view class="card-front" v-if="!showBack">
						<text class="card-word">{{ currentWord.word }}</text>
						<text class="card-phonetic">{{ currentWord.phonetic_us }}</text>
						<text class="card-hint">点击翻转</text>
					</view>
					<view class="card-back" v-else>
						<text class="card-meaning">{{ currentWord.chinese }}</text>
						<text class="card-example">{{ currentWord.example }}</text>
						<view class="card-actions">
							<text class="action-btn know" @click="markKnown">认识</text>
							<text class="action-btn unknown" @click="markUnknown">不认识</text>
						</view>
					</view>
				</view>
			</view>
			<view class="empty-state" v-else>
				<text class="empty-icon">🎉</text>
				<text class="empty-text">今日学习已完成</text>
				<text class="empty-hint">明天再来继续学习吧</text>
			</view>
		</view>

		<!-- 学习统计 -->
		<view class="section" v-if="!learningMode">
			<text class="section-title">学习统计</text>
			<view class="stats-card">
				<view class="stat-item">
					<text class="stat-number">{{ masteredCount }}</text>
					<text class="stat-label">已掌握</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ totalLearned }}</text>
					<text class="stat-label">已学单词</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ accuracy }}%</text>
					<text class="stat-label">正确率</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { BASE_URL, getWordStatus, markWordAsKnown, markWordAsUnknown, getLearningStats } from '@/utils/api.js';


export default {
	data() {
		return {
			currentLevel: 0,
			dailyPlan: 10,
			showBack: false,
			currentWordIndex: 0,
			// 从API获取的单词
			wordList: [],
			wordStatus: {},
			// 学习模式
			learningMode: '',
			modeWords: [],
			modeIndex: 0,
			// 听音辨义
			currentOptions: [],
			selectedOption: '',
			// 拼写默写
			writeInput: '',
			writeResult: '',
			writeHint: '',
			// 跟读
			isRecording: false,
			speakScore: 0,
			recordManager: null,
			// 统计
			todayNew: 0,
			todayReview: 0,
			totalLearned: 0,
			masteredCount: 0,
			correctCount: 0,
			totalAttempts: 0,
			levelCounts: {},
			loading: false
		}
	},
	computed: {
		currentWord() {
			return this.wordList[this.currentWordIndex] || null;
		},
		currentModeWord() {
			return this.modeWords[this.modeIndex] || null;
		},
		showResult() {
			return this.writeResult !== '' || this.selectedOption !== '';
		},
		accuracy() {
			if (this.totalAttempts === 0) return 0;
			return Math.round((this.correctCount / this.totalAttempts) * 100);
		}
	},
	onLoad() {
		this.initRecorder();
	},
	onShow() {
		this.loadWordCounts();
		this.loadWords();
		this.loadStats();
	},
	methods: {
		initRecorder() {
			this.recordManager = uni.getRecorderManager();
			this.recordManager.onStop((res) => {
				this.isRecording = false;
				this.evaluateWordRecording(res.tempFilePath);
			});
			this.recordManager.onError(() => {
				this.isRecording = false;
				uni.showToast({ title: '录音失败', icon: 'none' });
			});
		},
		evaluateWordRecording(filePath) {
			uni.showLoading({ title: '评测中...' });
			const fs = uni.getFileSystemManager();
			fs.readFile({
				filePath: filePath,
				encoding: 'base64',
				success: (res) => {
					const audioBase64 = res.data;
					const word = this.currentModeWord ? this.currentModeWord.word : 'hello';
					uni.request({
						url: BASE_URL + '/speech/evaluate',
						method: 'POST',
						header: { 'Content-Type': 'application/json' },
						data: { audioBase64, word, category: 'read_word' },
						success: (response) => {
							uni.hideLoading();
							if (response.statusCode === 200 && response.data.code === 0) {
								const result = response.data.data;
								this.speakScore = result.score;
								this.totalAttempts++;
								if (result.score >= 70) {
									this.correctCount++;
									this.markWordKnownAPI(this.currentModeWord.word);
								} else {
									this.markWordUnknownAPI(this.currentModeWord.word);
								}
							} else {
								uni.showToast({ title: '评测失败', icon: 'none' });
							}
						},
						fail: () => {
							uni.hideLoading();
							uni.showToast({ title: '评测服务异常', icon: 'none' });
						}
					});
				},
				fail: () => {
					uni.hideLoading();
					uni.showToast({ title: '录音读取失败', icon: 'none' });
				}
			});
		},
		async loadWordCounts() {
			try {
				const res = await this.request('/words/count');
				if (res && res.stats) {
					const counts = {};
					res.stats.forEach(s => counts[s.level] = s.count);
					this.levelCounts = counts;
				}
			} catch (e) {
				console.error('加载词数统计失败:', e);
			}
		},
		async loadWords() {
			this.loading = true;
			try {
				const res = await this.request(`/words/unlearned?userId=1&level=${this.currentLevel}&limit=${this.dailyPlan}`);
				if (res && res.words) {
					this.wordList = res.words;
					this.todayNew = res.newCount || 0;
					this.todayReview = res.reviewCount || 0;
					this.currentWordIndex = 0;
					this.showBack = false;
				}
			} catch (e) {
				console.error('加载单词失败:', e);
			} finally {
				this.loading = false;
			}
		},
		async loadStats() {
			try {
				const statusRes = await getWordStatus();
				if (statusRes) {
					this.wordStatus = {};
					let mastered = 0;
					let learned = 0;
					for (const word in statusRes) {
						learned++;
						if (statusRes[word].mastered) mastered++;
					}
					this.totalLearned = learned;
					this.masteredCount = mastered;
				}
			} catch (e) {
				console.error('加载统计失败:', e);
			}
			try {
				const statsRes = await getLearningStats();
				if (statsRes) {
					this.correctCount = statsRes.correct_count || 0;
					this.totalAttempts = statsRes.total_practice_count || 0;
				}
			} catch (e) {}
		},
		selectLevel(level) {
			this.currentLevel = level;
			this.loadWords();
		},
		flipCard() {
			this.showBack = !this.showBack;
		},
		async markKnown() {
			const word = this.currentWord ? this.currentWord.word : (this.currentModeWord ? this.currentModeWord.word : '');
			if (!word) return;
			try {
				await markWordAsKnown(word);
				this.correctCount++;
				this.totalAttempts++;
				this.saveLocalStatus(word, true);
			} catch (e) {
				console.error('标记认识失败:', e);
			}
			if (this.learningMode) {
				this.nextModeWord();
			} else {
				this.nextWord();
			}
		},
		async markUnknown() {
			const word = this.currentWord ? this.currentWord.word : (this.currentModeWord ? this.currentModeWord.word : '');
			if (!word) return;
			try {
				await markWordAsUnknown(word);
				this.totalAttempts++;
				this.saveLocalStatus(word, false);
			} catch (e) {
				console.error('标记不认识失败:', e);
			}
			if (this.learningMode) {
				this.nextModeWord();
			} else {
				this.nextWord();
			}
		},
		saveLocalStatus(word, known) {
			if (!this.wordStatus[word]) {
				this.wordStatus[word] = { mastered: false, repetition: 0 };
			}
			if (known) {
				this.wordStatus[word].repetition++;
				if (this.wordStatus[word].repetition >= 3) {
					this.wordStatus[word].mastered = true;
					this.masteredCount++;
				}
			} else {
				this.wordStatus[word].repetition = 0;
				this.wordStatus[word].mastered = false;
			}
		},
		nextWord() {
			this.showBack = false;
			this.currentWordIndex++;
			if (this.currentWordIndex >= this.wordList.length) {
				uni.showToast({ title: '本轮学习完成！', icon: 'success' });
				this.loadWords();
			}
		},

		// ========== 学习模式 ==========
		async startMode(mode) {
			if (this.wordList.length === 0) {
				uni.showToast({ title: '请先加载单词', icon: 'none' });
				return;
			}
			this.learningMode = mode;
			this.modeWords = [...this.wordList];
			this.modeIndex = 0;
			this.showBack = false;
			this.selectedOption = '';
			this.writeInput = '';
			this.writeResult = '';
			this.writeHint = '';
			this.speakScore = 0;
			this.isRecording = false;

			if (mode === 'listen') {
				this.generateOptions();
				// 自动播放
				setTimeout(() => {
					if (this.currentModeWord) {
						this.playWord(this.currentModeWord.word);
					}
				}, 500);
			}
		},
		exitMode() {
			this.learningMode = '';
			this.modeWords = [];
			this.modeIndex = 0;
		},
		nextModeWord() {
			this.modeIndex++;
			this.showBack = false;
			this.selectedOption = '';
			this.writeInput = '';
			this.writeResult = '';
			this.writeHint = '';
			this.speakScore = 0;
			this.isRecording = false;

			if (this.modeIndex >= this.modeWords.length) {
				uni.showToast({ title: '本轮练习完成！', icon: 'success' });
				setTimeout(() => this.exitMode(), 1500);
				return;
			}

			if (this.learningMode === 'listen') {
				this.generateOptions();
				setTimeout(() => {
					if (this.currentModeWord) {
						this.playWord(this.currentModeWord.word);
					}
				}, 300);
			}
		},
		generateOptions() {
			if (!this.currentModeWord) return;
			const correct = this.currentModeWord.chinese;
			// 从所有单词中随机选3个干扰项
			const allWords = this.wordList.filter(w => w.chinese !== correct);
			const shuffled = allWords.sort(() => Math.random() - 0.5).slice(0, 3);
			const options = [correct, ...shuffled.map(w => w.chinese)].sort(() => Math.random() - 0.5);
			this.currentOptions = options;
		},
		async selectOption(opt) {
			if (this.selectedOption) return;
			this.selectedOption = opt;
			const isCorrect = opt === this.currentModeWord.chinese;
			this.totalAttempts++;
			if (isCorrect) {
				this.correctCount++;
				await this.markWordKnownAPI(this.currentModeWord.word);
			} else {
				await this.markWordUnknownAPI(this.currentModeWord.word);
			}
			setTimeout(() => this.nextModeWord(), 1000);
		},
		checkSpelling() {
			if (this.showResult) return;
			if (!this.writeInput.trim()) {
				uni.showToast({ title: '请输入单词', icon: 'none' });
				return;
			}
			const correct = this.currentModeWord.word.toLowerCase();
			const input = this.writeInput.trim().toLowerCase();
			this.writeResult = input === correct ? 'correct' : 'wrong';
			this.totalAttempts++;
			if (input === correct) {
				this.correctCount++;
				this.markWordKnownAPI(this.currentModeWord.word);
			} else {
				this.markWordUnknownAPI(this.currentModeWord.word);
			}
		},
		showWriteHint() {
			if (!this.currentModeWord) return;
			const word = this.currentModeWord.word;
			// 显示前两个字母 + 下划线
			this.writeHint = word.substring(0, 2) + '_'.repeat(word.length - 2);
		},
		playWord(word) {
			const audio = uni.createInnerAudioContext();
			audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
			audio.play();
			audio.onError((err) => {
				console.error('音频播放失败:', err);
			});
		},
		toggleRecord() {
			if (this.isRecording) {
				this.recordManager.stop();
			} else {
				this.speakScore = 0;
				this.isRecording = true;
				this.recordManager.start({
					duration: 10000,
					sampleRate: 16000,
					numberOfChannels: 1,
					format: 'wav'
				});
				setTimeout(() => {
					if (this.isRecording) {
						this.recordManager.stop();
					}
				}, 5000);
			}
		},
		async markWordKnownAPI(word) {
			try { await markWordAsKnown(word); } catch (e) {}
		},
		async markWordUnknownAPI(word) {
			try { await markWordAsUnknown(word); } catch (e) {}
		},

		// ========== 通用请求 ==========
		request(url) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: BASE_URL + url,
					method: 'GET',
					header: { 'Content-Type': 'application/json' },
					success: (res) => {
						if (res.statusCode === 200 && res.data.code === 0) {
							resolve(res.data.data);
						} else {
							reject(res.data.message || '请求失败');
						}
					},
					fail: (err) => reject(err)
				});
			});
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
/* 词库 */
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
.wordbook-item:last-child { border-bottom: none; }
.wordbook-item.active { background-color: #E6F7F5; }
.wordbook-info { flex: 1; }
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
.wordbook-arrow { font-size: 30rpx; color: #7A7A7A; }
/* 今日学习 */
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
.study-plan { display: flex; align-items: center; }
.plan-text { font-size: 28rpx; color: #333333; }
.plan-number {
	font-size: 36rpx;
	font-weight: bold;
	color: #0D9488;
	margin: 0 10rpx;
}
/* 学习模式选择 */
.mode-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}
.mode-card {
	width: 48%;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx 20rpx;
	margin-bottom: 20rpx;
	text-align: center;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
}
.mode-icon {
	font-size: 56rpx;
	display: block;
	margin-bottom: 12rpx;
}
.mode-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 8rpx;
}
.mode-desc {
	font-size: 22rpx;
	color: #999999;
	display: block;
}
/* 模式头部 */
.mode-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}
.mode-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #1F3A5F;
}
.mode-progress {
	font-size: 26rpx;
	color: #7A7A7A;
}
.mode-close {
	font-size: 28rpx;
	color: #999999;
	padding: 10rpx;
}
/* 听音辨义 */
.listen-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 40rpx;
	text-align: center;
}
.listen-word {
	font-size: 64rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 16rpx;
}
.listen-phonetic {
	font-size: 32rpx;
	color: #7A7A7A;
	display: block;
	margin-bottom: 30rpx;
}
.listen-play {
	display: inline-flex;
	align-items: center;
	background-color: #E6F7F5;
	padding: 20rpx 40rpx;
	border-radius: 40rpx;
	margin-bottom: 30rpx;
}
.play-icon { font-size: 40rpx; margin-right: 10rpx; }
.play-text { font-size: 28rpx; color: #0D9488; }
.listen-hint {
	font-size: 26rpx;
	color: #999999;
	display: block;
	margin-bottom: 30rpx;
}
.options-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.option-item {
	background-color: #F7F5F0;
	padding: 24rpx;
	border-radius: 16rpx;
	text-align: left;
}
.option-item.correct { background-color: #D1FAE5; }
.option-item.wrong { background-color: #FEE2E2; }
.option-text {
	font-size: 30rpx;
	color: #333333;
}
/* 看英文想中文 */
.read-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}
.read-front, .read-back {
	padding: 60rpx 40rpx;
	text-align: center;
}
.read-front { min-height: 400rpx; }
.read-word {
	font-size: 72rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 16rpx;
}
.read-phonetic {
	font-size: 32rpx;
	color: #7A7A7A;
	display: block;
	margin-bottom: 30rpx;
}
.read-hint {
	font-size: 26rpx;
	color: #0D9488;
	display: block;
}
.read-meaning {
	font-size: 56rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 20rpx;
}
.read-example {
	font-size: 28rpx;
	color: #333333;
	display: block;
	margin-bottom: 30rpx;
	text-align: center;
}
.read-actions {
	display: flex;
	justify-content: space-around;
	padding: 0 40rpx 40rpx;
}
/* 拼写默写 */
.write-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 40rpx;
	text-align: center;
}
.write-meaning {
	font-size: 56rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 16rpx;
}
.write-phonetic {
	font-size: 28rpx;
	color: #7A7A7A;
	display: block;
	margin-bottom: 30rpx;
}
.write-input {
	border: 2rpx solid #E0E0E0;
	border-radius: 16rpx;
	padding: 24rpx;
	font-size: 36rpx;
	text-align: center;
	margin-bottom: 20rpx;
}
.write-actions {
	display: flex;
	justify-content: center;
	gap: 20rpx;
	margin-bottom: 20rpx;
}
.write-result {
	font-size: 30rpx;
	display: block;
	margin-top: 16rpx;
}
.write-hint-text {
	font-size: 28rpx;
	color: #0D9488;
	display: block;
	margin-top: 10rpx;
}
/* 单词跟读 */
.speak-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 40rpx;
	text-align: center;
}
.speak-word {
	font-size: 64rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 16rpx;
}
.speak-phonetic {
	font-size: 32rpx;
	color: #7A7A7A;
	display: block;
	margin-bottom: 12rpx;
}
.speak-meaning {
	font-size: 30rpx;
	color: #333333;
	display: block;
	margin-bottom: 30rpx;
}
.speak-play {
	display: inline-flex;
	align-items: center;
	background-color: #E6F7F5;
	padding: 20rpx 40rpx;
	border-radius: 40rpx;
	margin-bottom: 30rpx;
}
.speak-record {
	display: inline-flex;
	align-items: center;
	background-color: #1F3A5F;
	padding: 30rpx 60rpx;
	border-radius: 50rpx;
	margin-bottom: 30rpx;
}
.speak-record.recording { background-color: #EF4444; }
.record-icon { font-size: 48rpx; margin-right: 10rpx; }
.record-text { font-size: 30rpx; color: #FFFFFF; }
.speak-result {
	margin-top: 20rpx;
}
.score-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #0D9488;
	display: block;
	margin-bottom: 16rpx;
}
.score-bar {
	width: 80%;
	height: 16rpx;
	background-color: #E0E0E0;
	border-radius: 8rpx;
	margin: 0 auto 20rpx;
	overflow: hidden;
}
.score-fill {
	height: 100%;
	background-color: #0D9488;
	border-radius: 8rpx;
	transition: width 0.3s;
}
/* 记忆卡片 */
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
.card-hint { font-size: 24rpx; color: #0D9488; }
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
	text-align: center;
	display: inline-block;
}
.action-btn.know { background-color: #0D9488; color: #FFFFFF; }
.action-btn.unknown { background-color: #F0F0F0; color: #333333; }
.action-btn.submit { background-color: #0D9488; color: #FFFFFF; padding: 20rpx 60rpx; }
.action-btn.next { background-color: #1F3A5F; color: #FFFFFF; padding: 20rpx 60rpx; }
.action-btn.hint { background-color: #FEF3C7; color: #92400E; }
/* 统计 */
.stats-card {
	display: flex;
	justify-content: space-around;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
}
.stat-item { text-align: center; }
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
