<template>
	<view class="container">
		<AchievementUnlockNotifier />
		<view class="header">
			<text class="title">{{ entryType === 'daily' ? '今日单词任务' : '单词课程' }}</text>
			<text class="subtitle">艾宾浩斯科学记忆</text>
		</view>
		<!-- 固定学习统计：页面滚动时保持在顶部 -->
		<view class="sticky-stats">
			<view class="stat-item"><text class="stat-number">{{ masteredCount }}</text><text class="stat-label">已掌握</text></view>
			<view class="stat-item"><text class="stat-number">{{ totalLearned }}</text><text class="stat-label">已学单词</text></view>
			<view class="stat-item"><text class="stat-number">{{ accuracy }}%</text><text class="stat-label">正确率</text></view>
			<view class="stat-item wrong-entry" @click="openWrongBook"><text class="stat-number wrong-number">{{ wrongCount }}</text><text class="stat-label">错题</text></view>
		</view>		<!-- 每日单词类型 -->
		<view class="section">
			<text class="section-title">{{ progressiveMode ? '循序渐进学习' : '每日单词类型' }}</text>
			<view class="daily-category-card">
				<view class="category-main">
					<text class="category-label">今日学习</text>
					<text class="category-name">{{ todayCategory || '加载中' }}</text>
					<text class="category-desc">{{ todayCategoryDescription }}</text>
				</view>
				<view class="category-meta">
					<text>已完成 {{ categoryCompleted }}/{{ categoryCount }} 词</text>
					<text>下一类：{{ nextCategory || '--' }}</text>
				</view>
			</view>
			<scroll-view class="category-scroll" scroll-x v-if="!progressiveMode">
				<view class="category-list">
					<view class="category-chip" v-for="item in categoryStats" :key="item.category"
						:class="{ active: item.category === todayCategory }" @click="selectCategory(item.category)">
						<view class="chip-top"><text class="chip-name">{{ item.category }}</text><text class="chip-progress-text">{{ item.progress }}%</text></view>
						<text class="chip-count">已完成 {{ item.completed }}/{{ item.count }}</text>
						<view class="chip-progress"><view class="chip-progress-fill" :style="{ width: item.progress + '%' }"></view></view>
					</view>
				</view>
			</scroll-view>
		</view>
		<!-- 今日学习统计 -->
		<view class="section">
			<text class="section-title">今日学习</text>
			<view class="study-card progress-plan-card">
				<view><text class="plan-text">今日掌握进度</text><text class="plan-hint">今天完成四项学习才计入今日掌握</text></view>
				<view class="study-plan"><text class="plan-number">{{ todayMastered }}</text><text class="plan-text"> / {{ dailyNewWords }} 词</text></view>
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
					<text class="mode-name">中文选英文</text>
					<text class="mode-desc">显示中文，选择正确英文单词</text>
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
				<text class="mode-title">{{ isWrongBookMode ? '错题重练·听音辨义' : '听音辨义' }}</text>
				<text class="mode-progress">第 {{ modeIndex + 1 }} / {{ modeWords.length }} 词 · 本词完成 {{ currentModeProgress }} / 4 项</text>
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

				<view class="completed-next-action" v-if="currentModeCompleted && !showResult">
					<text class="action-btn next" @click="nextModeWord">下一题 ›</text>
				</view>
			</view>
		</view>

		<!-- 中文选英文模式 -->
		<view class="section" v-if="learningMode === 'read'">
			<view class="mode-header">
				<text class="mode-title">{{ isWrongBookMode ? '错题重练·中文选英文' : '中文选英文' }}</text>
				<text class="mode-progress">第 {{ modeIndex + 1 }} / {{ modeWords.length }} 词 · 本词完成 {{ currentModeProgress }} / 4 项</text>
				<text class="mode-close" @click="exitMode">✕ 退出</text>
			</view>
			<view class="read-card translation-card" v-if="currentModeWord">
				<text class="translation-label">请选择对应的英文单词</text>
				<text class="translation-meaning">{{ displayChinese(currentModeWord) }}</text>
				<view class="options-list translation-options">
					<view class="option-item" v-for="(opt, i) in currentOptions" :key="i"
						:class="{ correct: showResult && opt === currentModeWord.word, wrong: showResult && selectedOption === opt && opt !== currentModeWord.word }"
						@click="selectEnglishOption(opt)">
						<view class="english-option-content"><text class="option-text english-option">{{ opt }}</text><text class="option-phonetic">{{ optionPhonetic(opt) }}</text></view>
					</view>
				</view>

				<view class="completed-next-action" v-if="currentModeCompleted && !showResult">
					<text class="action-btn next" @click="nextModeWord">下一题 ›</text>
				</view>
			</view>
		</view>

		<!-- 拼写默写模式 -->
		<view class="section" v-if="learningMode === 'write'">
			<view class="mode-header">
				<text class="mode-title">{{ isWrongBookMode ? '错题重练·拼写默写' : '拼写默写' }}</text>
				<text class="mode-progress">第 {{ modeIndex + 1 }} / {{ modeWords.length }} 词 · 本词完成 {{ currentModeProgress }} / 4 项</text>
				<text class="mode-close" @click="exitMode">✕ 退出</text>
			</view>
			<view class="write-card" v-if="currentModeWord">
				<text class="write-meaning">{{ displayChinese(currentModeWord) }}</text>
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

				<view class="completed-next-action" v-if="currentModeCompleted && !showResult">
					<text class="action-btn next" @click="nextModeWord">下一题 ›</text>
				</view>
			</view>
		</view>

		<!-- 单词跟读模式 -->
		<view class="section" v-if="learningMode === 'speak'">
			<view class="mode-header">
				<text class="mode-title">{{ isWrongBookMode ? '错题重练·单词跟读' : '单词跟读' }}</text>
				<text class="mode-progress">第 {{ modeIndex + 1 }} / {{ modeWords.length }} 词 · 本词完成 {{ currentModeProgress }} / 4 项</text>
				<text class="mode-close" @click="exitMode">✕ 退出</text>
			</view>
			<view class="speak-card" v-if="currentModeWord">
				<text class="speak-word">{{ currentModeWord.word }}</text>
				<text class="speak-phonetic">{{ currentModeWord.phonetic_us }}</text>
				<text class="speak-meaning">{{ displayChinese(currentModeWord) }}</text>
				<view class="completed-next-action" v-if="currentModeCompleted && evaluationState === 'idle'">
					<text class="action-btn next" @click="nextModeWord">下一题 ›</text>
				</view>
				<view class="speak-actions">
					<view class="speak-play action-control" @click="playWord(currentModeWord.word)">
						<text class="play-icon">🔊</text>
						<text class="play-text">标准发音</text>
					</view>
					<view class="speak-record action-control" :class="{ recording: isRecording, evaluating: isEvaluating }" @click="toggleRecord">
						<text class="record-icon">{{ isEvaluating ? '⏳' : (isRecording ? '⏹️' : '🎤') }}</text>
						<text class="record-text">{{ isEvaluating ? '正在评测' : (isRecording ? '停止录音' : '开始跟读') }}</text>
					</view>
				</view>
				<view class="speak-result" v-if="evaluationState !== 'idle' && !isEvaluating">
					<text class="evaluation-status" :class="evaluationState">
						{{ evaluationState === 'passed' ? '✓ 发音通过' : (evaluationState === 'failed' ? '评测未通过' : '评测失败') }}
					</text>
					<text class="score-text" v-if="evaluationState !== 'error'">发音评分：{{ speakScore }}分</text>
					<view class="score-bar" v-if="evaluationState !== 'error'"><view class="score-fill" :style="{ width: speakScore + '%' }"></view></view>
					<text class="evaluation-message">{{ evaluationMessage }}</text>
					<view class="evaluation-actions">
						<text class="action-btn next" v-if="evaluationState === 'passed'" @click="nextModeWord">下一题</text>
						<text class="action-btn retry" v-else @click="resetSpeakEvaluation">重新跟读</text>
					</view>
				</view>
			</view>
		</view>


	</view>
</template>

<script>
import { BASE_URL, request as apiRequest, getWordStatus, markWordAsKnown, markWordAsUnknown, getLearningStats, getSettings } from '@/utils/api.js';
import { playTts, clearTtsQueue } from '@/utils/tts-player.js';
import { PRONUNCIATION_PASS_SCORE } from '@/utils/scoring-rules.js';
import { playAnswerFeedback } from '@/utils/answer-feedback.js';


export default {
	data() {
		return {
			currentLevel: 0,
			todayCategory: '',
			todayCategoryDescription: '',
			nextCategory: '',
			categoryCount: 0,
			categoryCompleted: 0,
			categoryStats: [],
			selectedCategory: '名词',
			wrongCount: 0,
			wrongModeCounts: { listen: 0, read: 0, write: 0, speak: 0 },
			pendingWrongMode: '',
			dailyNewWords: 20,
			difficultyMode: 0,
			progressiveMode: true,
			accentIndex: 0,
			autoPlay: true,
			showBack: false,
			currentWordIndex: 0,
			// 从API获取的单词
			entryType: 'course',
			wordList: [],
			wordStatus: {},
			// 学习模式
			learningMode: '',
			isWrongBookMode: false,
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
			isEvaluating: false,
			recordTimer: null,
			autoNextTimer: null,
			questionAudioTimer: null,
			modeAdvanceTimer: null,
			nextUnlockTimer: null,
			nextSwitching: false,
			speakScore: 0,
			evaluationState: 'idle',
			evaluationMessage: '',
			recordManager: null,
			// 统计
			todayLearned: 0,
			todayStudiedWords: [],
			todayMastered: 0,
			todayMasteredWords: [],
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
		},
		currentModeProgress() {
			const status = this.currentModeWord ? this.wordStatus[this.currentModeWord.word] : null;
			return status?.completed_modes || 0;
		},
		currentModeCompleted() {
			const status = this.currentModeWord ? this.wordStatus[this.currentModeWord.word] : null;
			return Boolean(status?.modes?.[this.learningMode]);
		}
	},
	onLoad(options = {}) {
		this.entryType = options.entry === 'daily' ? 'daily' : 'course';
		this.pendingWrongMode = options.wrongMode || '';
		this.initRecorder();
	},
	async onShow() {
		await this.loadLearningSettings();
		await Promise.all([this.loadWordCounts(), this.loadWords(), this.loadStats(), this.loadWrongCount()]);
		this.syncTodayMastered();
		if (this.pendingWrongMode) {
			const mode = this.pendingWrongMode;
			this.pendingWrongMode = '';
			await this.startWrongMode(mode);
		}
	},
	onUnload() {
		this.clearModeTimers();
		clearTtsQueue();
	},
	methods: {
		todayDateKey(value = new Date()) {
			if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.slice(0, 10))) return value.slice(0, 10);
			const date = value instanceof Date ? value : new Date(value);
			if (Number.isNaN(date.getTime())) return '';
			const pad = number => String(number).padStart(2, '0');
			return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
		},
		syncTodayMastered() {
			const today = this.todayDateKey();
			const latest = Object.entries(this.wordStatus).filter(([, status]) => {
				if (!status?.mastered) return false;
				const inScope = this.progressiveMode
					? Number(status.level || 0) === Number(this.currentLevel)
					: (!status.category || status.category === this.todayCategory);
				if (!inScope) return false;
				return this.todayDateKey(status.last_review_date) === today || this.todayDateKey(status.updated_at) === today;
			}).map(([word]) => word);
			this.todayMasteredWords = [...new Set([...(this.todayMasteredWords || []), ...latest])];
			this.todayMastered = this.todayMasteredWords.length;
		},		clearAutoNextTimer() {
			if (this.autoNextTimer) {
				clearTimeout(this.autoNextTimer);
				this.autoNextTimer = null;
			}
		},
		clearQuestionAudioTimer() {
			if (this.questionAudioTimer) clearTimeout(this.questionAudioTimer);
			this.questionAudioTimer = null;
		},
		clearModeAdvanceTimer() {
			if (this.modeAdvanceTimer) clearTimeout(this.modeAdvanceTimer);
			this.modeAdvanceTimer = null;
		},
		clearModeTimers() {
			this.clearAutoNextTimer();
			this.clearQuestionAudioTimer();
			this.clearModeAdvanceTimer();
			if (this.nextUnlockTimer) clearTimeout(this.nextUnlockTimer);
			this.nextUnlockTimer = null;
			this.nextSwitching = false;
		},
		scheduleCurrentWordAudio(delay = 300) {
			this.clearQuestionAudioTimer();
			const index = this.modeIndex;
			const word = this.currentModeWord?.word;
			if (!this.autoPlay || !word) return;
			this.questionAudioTimer = setTimeout(() => {
				this.questionAudioTimer = null;
				if (this.modeIndex === index && this.currentModeWord?.word === word) this.playWord(word);
			}, delay);
		},
		scheduleModeNext(delay = 350) {
			this.clearModeAdvanceTimer();
			const index = this.modeIndex;
			this.modeAdvanceTimer = setTimeout(() => {
				this.modeAdvanceTimer = null;
				if (this.modeIndex === index) this.nextModeWord();
			}, delay);
		},
		scheduleSpeakAutoNext() {
			this.clearAutoNextTimer();
			const word = this.currentModeWord?.word;
			const index = this.modeIndex;
			this.autoNextTimer = setTimeout(() => {
				this.autoNextTimer = null;
				if (this.evaluationState === 'passed' && this.modeIndex === index && this.currentModeWord?.word === word) {
					this.nextModeWord();
				}
			}, 700);
		},
		async loadLearningSettings() {
			let settings = uni.getStorageSync('learningSettings') || {};
			try { settings = { ...settings, ...(await getSettings()) }; } catch (_) {}
			this.dailyNewWords = Number(settings.daily_new_words ?? settings.dailyNewWords ?? 20);
			this.difficultyMode = Math.max(0, Math.min(3, Number(settings.difficulty ?? settings.difficultyIndex ?? 0)));
			this.progressiveMode = this.difficultyMode === 0;
			this.currentLevel = this.progressiveMode ? 0 : this.difficultyMode - 1;
			this.accentIndex = Number(settings.accent ?? settings.accentIndex ?? 0);
			this.autoPlay = Boolean(Number(settings.auto_play ?? (settings.autoPlay !== false)));
		},		openWrongBook() { uni.navigateTo({ url: '/pages/mine/wrong-book' }); },
		initRecorder() {
			this.recordManager = uni.getRecorderManager();
			this.recordManager.onStop((res) => {
				this.isRecording = false;
				if (this.recordTimer) { clearTimeout(this.recordTimer); this.recordTimer = null; }
				this.evaluateWordRecording(res.tempFilePath);
			});
			this.recordManager.onError(() => {
				this.isRecording = false;
				this.isEvaluating = false;
				if (this.recordTimer) { clearTimeout(this.recordTimer); this.recordTimer = null; }
				this.evaluationState = 'error';
				this.evaluationMessage = '录音失败，请检查麦克风权限后重试。';
			});
		},
		evaluateWordRecording(filePath) {
			const system = uni.getSystemInfoSync();
			this.isEvaluating = true;
			uni.showLoading({ title: '评测中...' });
			const fs = uni.getFileSystemManager();
			fs.readFile({
				filePath: filePath,
				encoding: 'base64',
				success: (res) => {
					const audioBase64 = res.data;
					const normalizedPath = String(filePath || '').toLowerCase();
					const isMp3 = normalizedPath.endsWith('.mp3') || /^SUQz/.test(audioBase64) || audioBase64.startsWith('//');
					const audioFormat = isMp3 ? 'mp3' : 'wav';
					if (system.platform === 'devtools' && isMp3) {
						uni.hideLoading();
						this.isEvaluating = false;
						this.evaluationState = 'error';
						this.evaluationMessage = '开发者工具录音为 MP3，无法稳定评测。请使用真机预览测试评分。';
						return;
					}
					const word = this.currentModeWord ? this.currentModeWord.word : 'hello';
					uni.request({
						url: BASE_URL + '/speech/evaluate',
						method: 'POST',
						header: { 'Content-Type': 'application/json' },
						data: { audioBase64, word, category: 'read_word', audioFormat },
						timeout: 20000,
						success: (response) => {
							uni.hideLoading();
							this.isEvaluating = false;
							if (response.statusCode === 200 && response.data.code === 0) {
								const result = response.data.data;
								this.speakScore = Number(result.score || 0);
								this.evaluationState = this.speakScore >= PRONUNCIATION_PASS_SCORE ? 'passed' : 'failed';
								playAnswerFeedback(this.speakScore >= PRONUNCIATION_PASS_SCORE);
								this.evaluationMessage = result.feedback || (this.speakScore >= PRONUNCIATION_PASS_SCORE ? '发音达标，即将进入下一题。' : '还未达到 '+PRONUNCIATION_PASS_SCORE+' 分，请重新跟读。');
								this.totalAttempts++;
								if (this.speakScore >= PRONUNCIATION_PASS_SCORE) {
									this.correctCount++;
									this.markWordKnownAPI(this.currentModeWord.word, 'speak');
									this.scheduleSpeakAutoNext();
								} else {
									this.markWordUnknownAPI(this.currentModeWord.word, 'speak');
								}
							} else {
								console.error('语音评测失败详情:', response.data);
								this.evaluationState = 'error';
								this.evaluationMessage = response.data?.message || '评测服务暂时不可用，请重新跟读。';
							}
						},
						fail: () => {
							uni.hideLoading();
							this.isEvaluating = false;
							this.evaluationState = 'error';
							this.evaluationMessage = '评测服务连接异常，请重新跟读。';
						}
					});
				},
				fail: () => {
					uni.hideLoading();
					this.isEvaluating = false;
					this.evaluationState = 'error';
					this.evaluationMessage = '录音读取失败，请重新跟读。';
				}
			});
		},
		async loadWordCounts() {
			try {
				const res = await apiRequest('/words/count');
				if (res) {
					const counts = {};
					(res.stats || []).forEach(item => counts[item.level] = item.count);
					this.levelCounts = counts;
					this.categoryStats = res.categories || [];
				}
			} catch (error) {
				console.error('加载单词统计失败:', error);
			}
		},
		async loadWords() {
			this.loading = true;
			try {
				const categoryQuery = !this.progressiveMode && this.selectedCategory ? `&category=${encodeURIComponent(this.selectedCategory)}` : '';
				const modeQuery = this.progressiveMode ? '&progressive=1' : `&level=${this.currentLevel}`;
				const res = await apiRequest(`/words/daily?limit=${this.dailyNewWords}${modeQuery}${categoryQuery}`);
				if (res && res.words) {
					this.wordList = res.words;
					this.todayStudiedWords = res.todayStudiedWords || [];
					this.todayLearned = this.todayStudiedWords.length;
					this.todayMasteredWords = res.todayMasteredWords || [];
					this.todayMastered = this.todayMasteredWords.length;
					this.todayCategory = res.category || '';
					this.selectedCategory = this.todayCategory;
					this.todayCategoryDescription = res.categoryDescription || '';
					this.nextCategory = res.nextCategory || '';
					this.categoryCount = res.categoryCount || 0;
					this.categoryCompleted = res.masteredCount || 0;
					this.currentWordIndex = 0;
					this.showBack = false;
				}
			} catch (error) {
				console.error('加载每日分类单词失败:', error);
				uni.showToast({ title: '加载每日单词失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},		async loadStats() {
			try {
				const statusRes = await getWordStatus();
				if (statusRes) {
					this.wordStatus = { ...statusRes };
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
		async selectCategory(category) {
			if (this.progressiveMode) return;
			if (this.loading || category === this.selectedCategory) return;
			this.selectedCategory = category;
			this.learningMode = '';
			await this.loadWords();
		},
		async loadWrongCount() {
			try {
				const res = await apiRequest('/words/wrong?limit=1');
				this.wrongCount = Number(res?.total || 0);
				this.wrongModeCounts = res?.byMode || { listen: 0, read: 0, write: 0, speak: 0 };
			} catch (error) {
				console.error('加载错题数量失败:', error);
			}
		},
		async startWrongBook() {
			if (!this.wrongCount) {
				uni.showToast({ title: '错题本还是空的', icon: 'none' });
				return;
			}
			const configs = [
				{ mode: 'listen', label: `听音辨义错题（${this.wrongModeCounts.listen || 0}）` },
				{ mode: 'read', label: `中文选英文错题（${this.wrongModeCounts.read || 0}）` },
				{ mode: 'write', label: `拼写默写错题（${this.wrongModeCounts.write || 0}）` },
				{ mode: 'speak', label: `单词跟读错题（${this.wrongModeCounts.speak || 0}）` }
			].filter((item) => Number(this.wrongModeCounts[item.mode] || 0) > 0);
			if (configs.length === 1) {
				this.startWrongMode(configs[0].mode);
				return;
			}
			uni.showActionSheet({
				itemList: configs.map((item) => item.label),
				success: ({ tapIndex }) => this.startWrongMode(configs[tapIndex].mode)
			});
		},
		async startWrongMode(mode) {
			try {
				const res = await apiRequest(`/words/wrong?limit=100&mode=${mode}`);
				if (!res.words?.length) {
					uni.showToast({ title: '该类型错题已完成', icon: 'none' });
					this.loadWrongCount();
					return;
				}
				this.learningMode = mode;
				this.isWrongBookMode = true;
				this.modeWords = res.words;
				this.modeIndex = 0;
				this.showBack = false;
				this.selectedOption = '';
				this.writeInput = '';
				this.writeResult = '';
				if (mode === 'listen') {
					this.generateOptions();
					if (this.autoPlay) setTimeout(() => this.currentModeWord && this.playWord(this.currentModeWord.word), 300);
				} else if (mode === 'read') {
					this.generateEnglishOptions();
				}
			} catch (error) {
				uni.showToast({ title: '加载错题本失败', icon: 'none' });
			}
		},		selectLevel(level) {
			this.currentLevel = level;
			this.loadWords();
		},
		flipCard() {
			this.showBack = !this.showBack;
		},
		markKnown() {
			// 记忆卡片只用于自测，不计入四个必修模块完成进度。
			this.nextWord();
		},
		markUnknown() {
			this.nextWord();
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
			clearTtsQueue();
			this.showBack = false;
			this.currentWordIndex++;
			if (this.currentWordIndex >= this.wordList.length) {
				uni.showToast({ title: '本轮学习完成！', icon: 'success' });
				this.loadWords();
			}
		},

		// ========== 学习模式 ==========
		async startMode(mode) {
			this.clearModeTimers();
			clearTtsQueue();
			if (this.wordList.length === 0) {
				uni.showToast({ title: '请先加载单词', icon: 'none' });
				return;
			}
			this.learningMode = mode;
			this.isWrongBookMode = false;
			this.modeWords = [...this.wordList];
			this.modeIndex = 0;
			this.showBack = false;
			this.selectedOption = '';
			this.writeInput = '';
			this.writeResult = '';
			this.writeHint = '';
			this.speakScore = 0;
			this.evaluationState = 'idle';
			this.evaluationMessage = '';
			this.isRecording = false;

			if (mode === 'read') {
				this.generateEnglishOptions();
			}

			if (mode === 'listen') {
				this.generateOptions();
				this.scheduleCurrentWordAudio(500);
			}
		},
		async exitMode() {
			this.clearModeTimers();
			clearTtsQueue();
			this.learningMode = '';
			this.isWrongBookMode = false;
			this.modeWords = [];
			this.modeIndex = 0;
			this.showBack = false;
			this.selectedOption = '';
			this.writeInput = '';
			this.writeResult = '';
			this.speakScore = 0;
			await Promise.all([
				this.loadWordCounts(),
				this.loadWords(),
				this.loadStats(),
				this.loadWrongCount()
			]);
		},
		nextModeWord() {
			if (this.nextSwitching) return;
			this.nextSwitching = true;
			this.clearAutoNextTimer();
			this.clearQuestionAudioTimer();
			this.clearModeAdvanceTimer();
			clearTtsQueue();
			this.modeIndex++;
			this.showBack = false;
			this.selectedOption = '';
			this.writeInput = '';
			this.writeResult = '';
			this.writeHint = '';
			this.speakScore = 0;
			this.evaluationState = 'idle';
			this.evaluationMessage = '';
			this.isRecording = false;

			if (this.modeIndex >= this.modeWords.length) {
				this.nextSwitching = false;
				uni.showToast({ title: '本轮练习完成！', icon: 'success' });
				setTimeout(() => this.exitMode(), 1500);
				return;
			}

			if (this.learningMode === 'read') {
				this.generateEnglishOptions();
			}

			if (this.learningMode === 'listen') {
				this.generateOptions();
				this.scheduleCurrentWordAudio(300);
			}
			this.nextUnlockTimer = setTimeout(() => {
				this.nextUnlockTimer = null;
				this.nextSwitching = false;
			}, 350);
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
		generateEnglishOptions() {
			if (!this.currentModeWord) return;
			const correct = this.currentModeWord.word;
			const candidates = this.wordList.filter((item) => item.word !== correct);
			const distractors = [...candidates].sort(() => Math.random() - 0.5).slice(0, 3);
			this.currentOptions = [correct, ...distractors.map((item) => item.word)]
				.sort(() => Math.random() - 0.5);
		},
		selectEnglishOption(option) {
			if (this.selectedOption) return;
			this.selectedOption = option;
			const word = this.currentModeWord.word;
			const isCorrect = option === word;
			playAnswerFeedback(isCorrect);
			this.totalAttempts++;
			if (isCorrect) {
				this.correctCount++;
				this.markWordKnownAPI(word, 'read');
			} else {
				this.markWordUnknownAPI(word, 'read');
			}
			this.scheduleModeNext(350);
		},
		selectOption(opt) {
			if (this.selectedOption) return;
			this.selectedOption = opt;
			const word = this.currentModeWord.word;
			const isCorrect = opt === this.currentModeWord.chinese;
			playAnswerFeedback(isCorrect);
			this.totalAttempts++;
			if (isCorrect) {
				this.correctCount++;
				this.markWordKnownAPI(word, 'listen');
			} else {
				this.markWordUnknownAPI(word, 'listen');
			}
			this.scheduleModeNext(350);
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
			playAnswerFeedback(input === correct);
			this.totalAttempts++;
			if (input === correct) {
				this.correctCount++;
				this.markWordKnownAPI(this.currentModeWord.word, 'write');
			} else {
				this.markWordUnknownAPI(this.currentModeWord.word, 'write');
			}
		},
		showWriteHint() {
			if (!this.currentModeWord) return;
			const word = this.currentModeWord.word;
			// 显示前两个字母 + 下划线
			this.writeHint = word.substring(0, 2) + '_'.repeat(word.length - 2);
		},
		optionPhonetic(word) {
			const item = [...this.modeWords, ...this.wordList].find(candidate => candidate.word === word);
			return item?.phonetic_us || item?.phonetic_uk || '';
		},
		displayChinese(item) {
			if (!item) return '';
			const word = String(item.word || '').toLowerCase();
			const chinese = String(item.chinese || '').trim();
			if (word === 'one' && chinese === '一') return '一（数字 1）';
			return chinese || '暂无中文释义';
		},
		playWord(word) {
			playTts(word, 3).catch(error => {
				console.error('单词播放失败:', error);
				uni.showToast({ title: error?.message || '播放失败，请重试', icon: 'none' });
			});
		},		async toggleRecord() {
			if (this.isEvaluating) return;
			if (this.isRecording) {
				this.recordManager.stop();
				return;
			}
			const granted = await this.ensureRecordPermission();
			if (!granted) return;
			this.speakScore = 0;
			this.isRecording = true;
			this.recordManager.start({ duration: 4000, sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 48000, format: 'mp3' });
			this.recordTimer = setTimeout(() => { if (this.isRecording) this.recordManager.stop(); }, 4000);
		},
		ensureRecordPermission() {
			return new Promise((resolve) => {
				uni.getSetting({
					success: (settings) => {
						const state = settings.authSetting['scope.record'];
						if (state === true) {
							resolve(true);
							return;
						}
						if (state === false) {
							uni.showModal({
								title: '需要麦克风权限',
								content: '请在设置中开启麦克风权限后继续跟读。',
								confirmText: '去设置',
								success: (modal) => {
									if (!modal.confirm) { resolve(false); return; }
									uni.openSetting({
										success: (result) => resolve(result.authSetting['scope.record'] === true),
										fail: () => { uni.showToast({ title: '无法打开权限设置', icon: 'none' }); resolve(false); }
									});
								}
							});
							return;
						}
						uni.authorize({
							scope: 'scope.record',
							success: () => resolve(true),
							fail: () => resolve(false)
						});
					},
					fail: () => {
						if (uni.getSystemInfoSync().platform === 'devtools') {
							resolve(true);
							return;
						}
						uni.showToast({ title: '无法读取麦克风权限', icon: 'none' });
						resolve(false);
					}
				});
			});
		},
		resetSpeakEvaluation() {
			this.speakScore = 0;
			this.evaluationState = 'idle';
			this.evaluationMessage = '';
		},
		markTodayStudied(word) { if (!this.todayStudiedWords.includes(word)) { this.todayStudiedWords.push(word); this.todayLearned = this.todayStudiedWords.length; } },
		async markWordKnownAPI(word, mode) {
			try {
				const result = await markWordAsKnown(word, mode);

				const previous = this.wordStatus[word] || { modes: {}, completed_modes: 0, mastered: false };
				if (!this.wordStatus[word]) this.totalLearned++;
				const modes = { ...(previous.modes || {}), [mode]: true };
				const completedModes = Number(result?.completedModes ?? Object.values(modes).filter(Boolean).length);
				const mastered = Boolean(result?.mastered) || completedModes >= 4;
				this.wordStatus = { ...this.wordStatus, [word]: { ...previous, modes, completed_modes: completedModes, mastered } };
				if (mastered && !this.todayMasteredWords.includes(word)) {
					this.todayMasteredWords.push(word);
					this.todayMastered = this.todayMasteredWords.length;
					if (!previous.mastered) { this.categoryCompleted++; this.masteredCount++; }
				}
				this.markTodayStudied(word); this.loadWrongCount();
			} catch (e) { console.error('记录模块完成失败:', e); }
		},
		async markWordUnknownAPI(word, mode) {
			try {
				await markWordAsUnknown(word, mode);
				const previous = this.wordStatus[word] || { modes: {}, completed_modes: 0, mastered: false };
				if (!this.wordStatus[word]) this.totalLearned++;
				if (previous.mastered) { this.masteredCount = Math.max(0, this.masteredCount - 1); this.categoryCompleted = Math.max(0, this.categoryCompleted - 1); }
				const modes = { ...(previous.modes || {}), [mode]: false };
				this.wordStatus = { ...this.wordStatus, [word]: { ...previous, modes, completed_modes: Object.values(modes).filter(Boolean).length, mastered: false } };
				this.todayMasteredWords = this.todayMasteredWords.filter(item => item !== word); this.todayMastered = this.todayMasteredWords.length;
				this.markTodayStudied(word); this.loadWrongCount();
			} catch (e) { console.error('记录模块错题失败:', e); }
		},

	}
}
</script>

<style>
.container {
	padding: 20rpx;
	background-color: #F7F5F0;
	min-height: 100vh;
}
.sticky-stats {
	position: sticky;
	top: 0;
	z-index: 20;
	display: flex;
	justify-content: space-around;
	background: rgba(255,255,255,0.98);
	border-radius: 18rpx;
	padding: 18rpx 8rpx;
	box-shadow: 0 6rpx 20rpx rgba(31,58,95,0.12);
}
.sticky-stats .stat-item { flex: 1; text-align: center; border-right: 1rpx solid #EEF0F2; }
.sticky-stats .stat-item:last-child { border-right: none; }
.sticky-stats .stat-number { display: block; font-size: 30rpx; font-weight: bold; color: #0D9488; }
.sticky-stats .stat-label { display: block; margin-top: 4rpx; font-size: 21rpx; color: #7A7A7A; }
.sticky-stats .wrong-number { color: #DC5A5A; }
.sticky-stats .wrong-entry { cursor: pointer; }
.sticky-stats .wrong-entry:active { background: #FFF1F1; }
.memory-heading { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 20rpx; }
.memory-heading > view:first-child { flex: 1; }
.memory-title { margin-bottom: 6rpx; }
.memory-desc { display: block; font-size: 22rpx; line-height: 1.5; color: #7A7A7A; }
.wrong-book-btn { flex-shrink: 0; padding: 14rpx 20rpx; color: #C24141; background: #FFF1F1; border: 1rpx solid #F4BABA; border-radius: 28rpx; font-size: 23rpx; }
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
.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-bottom: 20rpx;
	display: block;
}
/* 每日类型 */
.daily-category-card {
	background: linear-gradient(135deg, #0D9488, #0F766E);
	border-radius: 20rpx;
	padding: 30rpx;
	color: #FFFFFF;
}
.category-main { display: flex; flex-direction: column; }
.category-label { font-size: 24rpx; opacity: 0.82; }
.category-name { font-size: 52rpx; font-weight: bold; margin: 8rpx 0; }
.category-desc { font-size: 25rpx; opacity: 0.92; }
.category-meta {
	display: flex;
	justify-content: space-between;
	font-size: 24rpx;
	margin-top: 24rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(255,255,255,0.25);
}
.category-scroll { white-space: nowrap; margin-top: 18rpx; }
.category-list { display: inline-flex; gap: 14rpx; padding-bottom: 4rpx; }
.category-chip {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	min-width: 170rpx;
	gap: 4rpx;
	background: #FFFFFF;
	border: 2rpx solid #E5E7EB;
	border-radius: 30rpx;
	padding: 12rpx 20rpx;
}
.category-chip.active { background: #E6F7F5; border-color: #0D9488; }
.chip-name { font-size: 25rpx; color: #1F3A5F; font-weight: 600; }
.chip-count { font-size: 22rpx; color: #7A7A7A; }
.chip-top { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.chip-progress-text { font-size: 20rpx; color: #0D9488; font-weight: 600; }
.chip-count { margin-top: 5rpx; }
.chip-progress { width: 150rpx; height: 6rpx; margin-top: 8rpx; overflow: hidden; border-radius: 6rpx; background: #E5E7EB; }
.chip-progress-fill { height: 100%; border-radius: 6rpx; background: #0D9488; }
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
.completed-next-action { position: absolute; top: 18rpx; right: 18rpx; z-index: 3; display: flex; margin: 0; }
.completed-next-action .action-btn.next { padding: 12rpx 22rpx; border-radius: 28rpx; font-size: 23rpx; line-height: 1.2; box-shadow: 0 5rpx 14rpx rgba(31,58,95,.2); }
.plan-text { display: block; font-size: 28rpx; color: #333333; }
.plan-hint { display: block; margin-top: 8rpx; font-size: 22rpx; color: #8A8A8A; }
.plan-number {
	font-size: 36rpx;
	font-weight: bold;
	color: #0D9488;
	margin: 0 10rpx;
}
/* 学习模式选择 */
.mode-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20rpx;
}
.mode-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx 15rpx;
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
	position: relative;
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
/* 中文选英文 */
.translation-card { padding: 38rpx 30rpx; text-align: center; }
.translation-label { display: block; font-size: 24rpx; color: #7A7A7A; }
.translation-meaning { display: block; margin: 26rpx 0 34rpx; font-size: 46rpx; line-height: 1.4; font-weight: bold; color: #1F3A5F; }
.translation-options { text-align: left; }
.english-option { font-weight: 600; color: #1F3A5F; }
.read-card {
	position: relative;
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
	position: relative;
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
	position: relative;
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
.speak-actions { display: flex; gap: 18rpx; margin: 8rpx 0 30rpx; }
.action-control { flex: 1; min-height: 88rpx; box-sizing: border-box; justify-content: center; margin: 0; padding: 18rpx 16rpx; }
.speak-play { display: flex; align-items: center; background-color: #E6F7F5; border-radius: 18rpx; }
.speak-record { display: flex; align-items: center; background-color: #1F3A5F; border-radius: 18rpx; }
.speak-record.recording { background-color: #EF4444; }
.speak-record.evaluating { background-color: #64748B; }
.record-icon { font-size: 34rpx; margin-right: 8rpx; }
.record-text { font-size: 26rpx; color: #FFFFFF; white-space: nowrap; }
.evaluation-status { display: block; font-size: 32rpx; font-weight: bold; margin-bottom: 12rpx; }
.evaluation-status.passed { color: #059669; }
.evaluation-status.failed, .evaluation-status.error { color: #DC2626; }
.evaluation-message { display: block; margin: 18rpx 0; font-size: 26rpx; color: #64748B; line-height: 1.5; }
.evaluation-actions { display: flex; justify-content: center; }
.action-btn.retry { background: #F59E0B; color: #FFFFFF; }
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
	font-size: 28rpx;
	color: #333333;
	display: block;
	margin-bottom: 10rpx;
}
.empty-hint {
	font-size: 22rpx;
	color: #7A7A7A;
	display: block;
}

.english-option-content{display:flex;align-items:center;justify-content:space-between;width:100%;gap:18rpx}.option-phonetic{flex-shrink:0;color:#8a97a3;font-size:22rpx}
</style>






















