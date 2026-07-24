<template>
	<view class="container">
		<view class="header">
			<text class="title">语法学习</text>
			<text class="subtitle">三阶段语法课程体系</text>
		</view>
		
		<view class="section">
			<text class="section-title">语法阶段</text>
			<view class="stage-list">
				<view class="stage-item" :class="{ active: currentStage === 1 }" @click="selectStage(1)">
					<view class="stage-number">1</view>
					<view class="stage-info">
						<text class="stage-name">基础句型</text>
						<text class="stage-desc">主谓宾、主系表、疑问句、时态入门</text>
					</view>
					<text class="stage-arrow">›</text>
				</view>
				<view class="stage-item" :class="{ active: currentStage === 2 }" @click="selectStage(2)">
					<view class="stage-number">2</view>
					<view class="stage-info">
						<text class="stage-name">核心语法</text>
						<text class="stage-desc">8大核心时态、冠词、介词、代词用法</text>
					</view>
					<text class="stage-arrow">›</text>
				</view>
				<view class="stage-item" :class="{ active: currentStage === 3 }" @click="selectStage(3)">
					<view class="stage-number">3</view>
					<view class="stage-info">
						<text class="stage-name">进阶语法</text>
						<text class="stage-desc">从句、非谓语动词等进阶口语必备语法</text>
					</view>
					<text class="stage-arrow">›</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">语法点列表</text>
			<view class="grammar-list">
				<view class="grammar-item" v-for="(item, index) in filteredGrammarPoints" :key="index" @click="startLearning(item)">
					<view class="grammar-icon">📝</view>
					<view class="grammar-info">
						<text class="grammar-title">{{ item.title }}</text>
						<text class="grammar-desc">{{ item.description }}</text>
					</view>
					<view class="grammar-status">
						<text class="status-text">{{ item.status }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 学习弹窗 -->
		<view class="learning-modal" v-if="showLearningModal">
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">{{ currentGrammar.title }}</text>
					<text class="modal-close" @click="closeLearning">×</text>
				</view>
				
				<view class="learning-content">
					<!-- 讲解部分 -->
					<view class="explanation-section" v-if="learningStep === 'explain'">
						<text class="section-label">语法讲解</text>
						<text class="explanation-text">{{ currentGrammar.explanation }}</text>
						<view class="examples">
							<text class="example-label">例句：</text>
							<text class="example-item" v-for="(example, idx) in currentGrammar.examples" :key="idx">{{ example }}</text>
						</view>
						<text class="next-btn" @click="nextStep">下一步：练习</text>
					</view>
					
					<!-- 练习部分 -->
					<view class="practice-section" v-if="learningStep === 'practice'">
						<text class="section-label">语法练习</text>
						<view class="question-card">
							<text class="question-text">{{ currentQuestion.question }}</text>
							<view class="options">
								<view class="option-item" v-for="(option, idx) in currentQuestion.options" :key="idx" @click="selectOption(idx)" :class="{ selected: selectedOption === idx }">
									<text class="option-text">{{ option }}</text>
								</view>
							</view>
						</view>
						<view class="practice-actions">
							<text class="action-btn check" @click="checkAnswer">检查答案</text>
							<text class="action-btn next" v-if="showResult" @click="nextQuestion">下一题</text>
						</view>
						<view class="result-card" v-if="showResult">
							<text class="result-icon">{{ isCorrect ? '✅' : '❌' }}</text>
							<text class="result-text">{{ isCorrect ? '回答正确！' : '回答错误' }}</text>
							<text class="result-explanation">{{ currentQuestion.explanation }}</text>
						</view>
					</view>
					
					<!-- 完成部分 -->
					<view class="complete-section" v-if="learningStep === 'complete'">
						<text class="complete-icon">🎉</text>
						<text class="complete-text">恭喜完成学习！</text>
						<text class="complete-score">练习得分：{{ practiceScore }}%</text>
						<text class="next-btn" @click="closeLearning">返回列表</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">学习进度</text>
			<view class="progress-card">
				<view class="progress-item">
					<text class="progress-label">阶段1：基础句型</text>
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: stageProgress[1] + '%' }"></view>
					</view>
					<text class="progress-percent">{{ stageProgress[1] }}%</text>
				</view>
				<view class="progress-item">
					<text class="progress-label">阶段2：核心语法</text>
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: stageProgress[2] + '%' }"></view>
					</view>
					<text class="progress-percent">{{ stageProgress[2] }}%</text>
				</view>
				<view class="progress-item">
					<text class="progress-label">阶段3：进阶语法</text>
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: stageProgress[3] + '%' }"></view>
					</view>
					<text class="progress-percent">{{ stageProgress[3] }}%</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">语法练习</text>
			<view class="practice-card" @click="startQuickPractice">
				<text class="practice-icon">✏️</text>
				<text class="practice-title">快速练习</text>
				<text class="practice-desc">随机抽取10道语法题进行练习</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentStage: 1,
			showLearningModal: false,
			currentGrammar: {},
			learningStep: 'explain',
			currentQuestionIndex: 0,
			selectedOption: -1,
			showResult: false,
			isCorrect: false,
			correctCount: 0,
			totalQuestions: 0,
			grammarPoints: [
				// 阶段1：基础句型
				{
					id: 1,
					title: '一般现在时',
					description: '表示经常性、习惯性的动作或状态',
					stage: 1,
					status: '未学习',
					explanation: '一般现在时表示经常发生的动作或存在的状态。常与always, usually, often, sometimes, every day等时间状语连用。\n\n结构：主语 + 动词原形（第三人称单数加s/es）\n否定句：主语 + don\'t/doesn\'t + 动词原形\n疑问句：Do/Does + 主语 + 动词原形？',
					examples: [
						'I go to school every day.',
						'She likes reading books.',
						'They don\'t play football.',
						'Does he speak English?'
					],
					questions: [
						{
							question: 'She ___ to school every day.',
							options: ['go', 'goes', 'going', 'went'],
							answer: 1,
							explanation: '主语是第三人称单数she，动词要用goes。'
						},
						{
							question: 'They ___ like coffee.',
							options: ['don\'t', 'doesn\'t', 'isn\'t', 'aren\'t'],
							answer: 0,
							explanation: '主语是复数they，否定用don\'t。'
						},
						{
							question: '___ he speak Chinese?',
							options: ['Do', 'Does', 'Is', 'Are'],
							answer: 1,
							explanation: '主语是第三人称单数he，疑问句用Does。'
						}
					]
				},
				{
					id: 2,
					title: '一般过去时',
					description: '表示过去发生的动作或状态',
					stage: 1,
					status: '未学习',
					explanation: '一般过去时表示过去某个时间发生的动作或存在的状态。常与yesterday, last week, in 2020等时间状语连用。\n\n结构：主语 + 动词过去式\n否定句：主语 + didn\'t + 动词原形\n疑问句：Did + 主语 + 动词原形？',
					examples: [
						'I went to Beijing last year.',
						'She watched TV yesterday.',
						'They didn\'t go to school.',
						'Did you see him?'
					],
					questions: [
						{
							question: 'I ___ to the park yesterday.',
							options: ['go', 'goes', 'went', 'going'],
							answer: 2,
							explanation: 'yesterday表示过去时间，用went。'
						},
						{
							question: 'She ___ dinner last night.',
							options: ['cook', 'cooks', 'cooked', 'cooking'],
							answer: 2,
							explanation: 'last night表示过去时间，用cooked。'
						}
					]
				},
				{
					id: 3,
					title: '现在进行时',
					description: '表示正在进行的动作',
					stage: 1,
					status: '未学习',
					explanation: '现在进行时表示说话时正在进行的动作。常与now, at the moment等时间状语连用。\n\n结构：主语 + am/is/are + 动词ing',
					examples: [
						'I am reading a book now.',
						'She is cooking dinner.',
						'They are playing football.',
						'What are you doing?'
					],
					questions: [
						{
							question: 'Look! The children ___ in the park.',
							options: ['play', 'plays', 'are playing', 'played'],
							answer: 2,
							explanation: 'Look!表示现在正在进行，用are playing。'
						}
					]
				},
				{
					id: 4,
					title: '一般将来时',
					description: '表示将来发生的动作或状态',
					stage: 1,
					status: '未学习',
					explanation: '一般将来时表示将来某个时间要发生的动作或存在的状态。\n\n结构：主语 + will + 动词原形\n或：主语 + be going to + 动词原形',
					examples: [
						'I will go to Shanghai tomorrow.',
						'She is going to study English.',
						'They will have a meeting.',
						'We are going to have a party.'
					],
					questions: [
						{
							question: 'We ___ have a picnic next Sunday.',
							options: ['are going to', 'will', 'Both A and B', 'None of the above'],
							answer: 2,
							explanation: 'will和be going to都可以表示将来。'
						}
					]
				},
				{
					id: 5,
					title: '过去进行时',
					description: '表示过去某一时刻正在进行的动作',
					stage: 1,
					status: '未学习',
					explanation: '过去进行时表示过去某一时刻或某一段时间正在进行的动作。\n\n结构：主语 + was/were + 动词ing',
					examples: [
						'I was sleeping at 10 last night.',
						'She was watching TV when I came.',
						'They were playing football.',
						'What were you doing then?'
					],
					questions: [
						{
							question: 'I ___ when the phone rang.',
							options: ['am sleeping', 'was sleeping', 'slept', 'sleep'],
							answer: 1,
							explanation: '过去某一时刻正在进行，用was sleeping。'
						}
					]
				}
			],
			stageProgress: {
				1: 0,
				2: 0,
				3: 0
			},
			practiceScore: 0
		}
	},
	computed: {
		filteredGrammarPoints() {
			return this.grammarPoints.filter(item => item.stage === this.currentStage);
		},
		currentQuestion() {
			if (this.currentGrammar.questions && this.currentGrammar.questions.length > 0) {
				return this.currentGrammar.questions[this.currentQuestionIndex];
			}
			return null;
		}
	},
	methods: {
		selectStage(stage) {
			this.currentStage = stage;
		},
		startLearning(grammar) {
			this.currentGrammar = grammar;
			this.learningStep = 'explain';
			this.currentQuestionIndex = 0;
			this.selectedOption = -1;
			this.showResult = false;
			this.correctCount = 0;
			this.totalQuestions = grammar.questions ? grammar.questions.length : 0;
			this.showLearningModal = true;
		},
		closeLearning() {
			this.showLearningModal = false;
			this.updateProgress();
		},
		nextStep() {
			if (this.currentGrammar.questions && this.currentGrammar.questions.length > 0) {
				this.learningStep = 'practice';
			} else {
				this.completeLearning();
			}
		},
		selectOption(index) {
			if (!this.showResult) {
				this.selectedOption = index;
			}
		},
		checkAnswer() {
			if (this.selectedOption === -1) {
				uni.showToast({
					title: '请选择一个选项',
					icon: 'none'
				});
				return;
			}
			
			this.isCorrect = this.selectedOption === this.currentQuestion.answer;
			if (this.isCorrect) {
				this.correctCount++;
			}
			this.showResult = true;
		},
		nextQuestion() {
			this.currentQuestionIndex++;
			this.selectedOption = -1;
			this.showResult = false;
			
			if (this.currentQuestionIndex >= this.totalQuestions) {
				this.completeLearning();
			}
		},
		completeLearning() {
			this.learningStep = 'complete';
			this.practiceScore = this.totalQuestions > 0 ? Math.round((this.correctCount / this.totalQuestions) * 100) : 100;
			
			// 更新语法点状态
			const grammar = this.grammarPoints.find(item => item.id === this.currentGrammar.id);
			if (grammar) {
				grammar.status = '已学习';
			}
		},
		startQuickPractice() {
			uni.showToast({
				title: '开始快速练习',
				icon: 'none'
			});
		},
		updateProgress() {
			for (let stage = 1; stage <= 3; stage++) {
				const stageGrammar = this.grammarPoints.filter(item => item.stage === stage);
				const learned = stageGrammar.filter(item => item.status === '已学习').length;
				this.stageProgress[stage] = stageGrammar.length > 0 ? Math.round((learned / stageGrammar.length) * 100) : 0;
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

.stage-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.stage-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.stage-item.active {
	background-color: #E6F7F5;
}

.stage-number {
	width: 60rpx;
	height: 60rpx;
	background-color: #1F3A5F;
	color: #FFFFFF;
	border-radius: 30rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 30rpx;
	font-weight: bold;
	margin-right: 20rpx;
}

.stage-info {
	flex: 1;
}

.stage-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.stage-desc {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.stage-arrow {
	font-size: 30rpx;
	color: #7A7A7A;
}

.grammar-list {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.grammar-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F0F0F0;
}

.grammar-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
}

.grammar-info {
	flex: 1;
}

.grammar-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	display: block;
}

.grammar-desc {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	margin-top: 5rpx;
}

.grammar-status {
	margin-left: 20rpx;
}

.status-text {
	font-size: 24rpx;
	color: #7A7A7A;
	background-color: #F0F0F0;
	padding: 5rpx 15rpx;
	border-radius: 10rpx;
}

.progress-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
}

.progress-item {
	margin-bottom: 20rpx;
}

.progress-item:last-child {
	margin-bottom: 0;
}

.progress-label {
	font-size: 28rpx;
	color: #333333;
	display: block;
	margin-bottom: 10rpx;
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

.progress-percent {
	font-size: 24rpx;
	color: #7A7A7A;
	display: block;
	text-align: right;
	margin-top: 5rpx;
}

.practice-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.practice-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.practice-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #1F3A5F;
	flex: 1;
}

.practice-desc {
	font-size: 24rpx;
	color: #7A7A7A;
}

/* 学习弹窗样式 */
.learning-modal {
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
	width: 90%;
	max-width: 700rpx;
	max-height: 80vh;
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

.learning-content {
	padding: 30rpx;
	max-height: 60vh;
	overflow-y: auto;
}

.section-label {
	font-size: 28rpx;
	font-weight: bold;
	color: #1F3A5F;
	margin-bottom: 15rpx;
	display: block;
}

.explanation-text {
	font-size: 28rpx;
	color: #333333;
	line-height: 1.6;
	margin-bottom: 20rpx;
	display: block;
	white-space: pre-line;
}

.examples {
	background-color: #F7F5F0;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.example-label {
	font-size: 26rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 10rpx;
}

.example-item {
	font-size: 26rpx;
	color: #333333;
	display: block;
	margin-bottom: 8rpx;
}

.next-btn {
	background-color: #0D9488;
	color: #FFFFFF;
	text-align: center;
	padding: 15rpx;
	border-radius: 10rpx;
	font-size: 28rpx;
	font-weight: bold;
	display: block;
}

.question-card {
	background-color: #F7F5F0;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.question-text {
	font-size: 28rpx;
	color: #333333;
	margin-bottom: 15rpx;
	display: block;
}

.options {
	margin-top: 10rpx;
}

.option-item {
	background-color: #FFFFFF;
	border: 2rpx solid #F0F0F0;
	border-radius: 10rpx;
	padding: 15rpx;
	margin-bottom: 10rpx;
}

.option-item.selected {
	border-color: #0D9488;
	background-color: #E6F7F5;
}

.option-text {
	font-size: 26rpx;
	color: #333333;
}

.practice-actions {
	display: flex;
	justify-content: space-around;
	margin-bottom: 20rpx;
}

.action-btn {
	padding: 15rpx 30rpx;
	border-radius: 10rpx;
	font-size: 28rpx;
	font-weight: bold;
}

.action-btn.check {
	background-color: #1F3A5F;
	color: #FFFFFF;
}

.action-btn.next {
	background-color: #0D9488;
	color: #FFFFFF;
}

.result-card {
	text-align: center;
	padding: 20rpx;
	background-color: #F7F5F0;
	border-radius: 10rpx;
}

.result-icon {
	font-size: 48rpx;
	display: block;
	margin-bottom: 10rpx;
}

.result-text {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
	display: block;
	margin-bottom: 10rpx;
}

.result-explanation {
	font-size: 26rpx;
	color: #7A7A7A;
	display: block;
}

.complete-section {
	text-align: center;
	padding: 30rpx;
}

.complete-icon {
	font-size: 80rpx;
	display: block;
	margin-bottom: 20rpx;
}

.complete-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #1F3A5F;
	display: block;
	margin-bottom: 15rpx;
}

.complete-score {
	font-size: 28rpx;
	color: #0D9488;
	display: block;
	margin-bottom: 20rpx;
}
</style>