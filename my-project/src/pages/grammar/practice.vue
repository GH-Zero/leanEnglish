<template>
  <view class="page">
		<AchievementUnlockNotifier />
    <animated-loading v-if="loading" text="加载练习中..."></animated-loading>
    <template v-else-if="grammar.title">
      <view class="hero">
        <text class="eyebrow">{{ entryType === 'daily' ? '每日语法精讲' : '语法专项练习' }}</text>
        <text class="title">{{ grammar.title }}</text>
        <text class="description">{{ grammar.description }}</text>
      </view>
      <view v-if="step === 'explain'" class="panel">
        <text class="panel-title">知识讲解</text>
        <text class="explanation">{{ grammar.explanation }}</text>
        <view class="examples">
          <text class="examples-title">例句</text>
          <text v-for="(example, index) in grammar.examples" :key="index" class="example">{{ example }}</text>
        </view>
        <button class="primary" @click="step = 'practice'">开始 {{ questions.length }} 题练习</button>
      </view>
      <view v-else-if="step === 'practice'" class="panel">
        <view class="progress-row"><text>第 {{ questionIndex + 1 }} / {{ questions.length }} 题</text><text>答对 {{ correctCount }} 题</text></view>
        <view class="bar"><view class="bar-value" :style="{ width: ((questionIndex + 1) / questions.length * 100) + '%' }" /></view>
        <text class="question">{{ currentQuestion.sentence || currentQuestion.question }}</text>
        <text v-if="currentQuestion.translation" class="question-translation">中文：{{ currentQuestion.translation }}</text>
        <view class="option-list">
          <view v-for="(option, index) in currentQuestion.options" :key="index" class="option" :class="{ selected: selectedIndex === index, correct: answered && option === currentQuestion.answer, wrong: answered && selectedIndex === index && option !== currentQuestion.answer }" @click="choose(index)">
            <text class="option-key">{{ optionLabels[index] }}</text><text>{{ option }}</text>
          </view>
        </view>
        <view v-if="answered" class="answer-box" :class="isCorrect ? 'good' : 'bad'">
          <text class="answer-title">{{ isCorrect ? '回答正确' : '正确答案：' + currentQuestion.answer }}</text>
          <text>{{ currentQuestion.explanation }}</text>
        </view>
        <button class="primary" :disabled="selectedIndex === -1" @click="answered ? next() : check()">{{ answered ? (questionIndex + 1 === questions.length ? '查看结果' : '下一题') : '检查答案' }}</button>
      </view>
      <view v-else class="panel finished">
        <text class="finish-icon">🎉</text><text class="finish-title">本组练习完成</text>
        <text class="score">{{ correctCount }} / {{ questions.length }} 题正确</text><view v-if="masteryResult" class="mastery-result"><text class="mastery-status">{{ masteryResult.mastered ? '已达到语法掌握标准' : '当前为学习中' }}</text><text class="mastery-detail">累计 {{ masteryResult.attempts }} 轮 · {{ masteryResult.totalQuestions }} 题 · 累计正确率 {{ masteryResult.accuracy }}% · 本轮 {{ masteryResult.lastScore }}%</text><text v-if="!masteryResult.mastered" class="mastery-rule">掌握标准：至少1轮、累计10题，累计与最近一轮正确率均达到80%</text></view><text v-if="questionProgress" class="question-cycle">专项题库：本轮已答对 {{ questionProgress.completed }}/{{ questionProgress.total }} 题</text>
        <button class="primary" @click="restart">再练一组</button>
        <button class="secondary" @click="goBack">返回语法列表</button>
      </view>
    </template>
    <animated-empty v-else icon="📭" text="未找到该语法内容"></animated-empty>
  </view>
</template>
<script>
import { playAnswerFeedback } from '@/utils/answer-feedback.js';
import { isFirstLoad } from '@/utils/first-load.js';
import { BASE_URL, getSettings } from '@/utils/api.js';
export default {
  data() { const firstLoad = isFirstLoad('pages/grammar/practice'); return { loading: firstLoad, firstLoad, entryType: 'course', grammarId: 0, stagePractice: 0, grammar: {}, questions: [], dailyGrammarQuestions: 10, questionIndex: 0, selectedIndex: -1, answered: false, isCorrect: false, correctCount: 0, masteryResult: null, questionProgress: null, step: 'explain', optionLabels: ['A', 'B', 'C', 'D'] }; },
  computed: { currentQuestion() { return this.questions[this.questionIndex] || {}; } },
  onLoad(query) { this.entryType = query.entry === 'daily' ? 'daily' : 'course'; this.grammarId = Number(query.id || 0); this.stagePractice = Number(query.stage || 0); this.load(); },
  methods: {
    async load() {
      if (this.firstLoad) { this.loading = true; this.firstLoad = false }
      try {
        const [response, settings] = await Promise.all([
          new Promise((resolve, reject) => uni.request({ url: this.stagePractice ? `${BASE_URL}/grammar-point/stage/${this.stagePractice}` : `${BASE_URL}/grammar-point/detail/${this.grammarId}`, success: r => r.statusCode === 200 && r.data.code === 0 ? resolve(r.data.data) : reject(), fail: reject })),
          getSettings().catch(() => uni.getStorageSync('learningSettings') || {})
        ]);
        this.dailyGrammarQuestions = Math.max(5, Math.min(30, Number(settings.daily_grammar_questions ?? settings.dailyGrammarQuestions ?? 10))); 

        const normalizeExample = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '');
        const isUsefulExample = value => {
          const text = String(value || '').trim();
          return text && !/^choose the correct answer\s*\(\d+\)\.?$/i.test(text) && !/^(question|practice|example)\s*\d+\.?$/i.test(text);
        };
        const seenExamples = new Set();
        response.examples = (Array.isArray(response.examples) ? response.examples : [])
          .filter(isUsefulExample)
          .filter(example => {
            const key = normalizeExample(example);
            if (!key || seenExamples.has(key)) return false;
            seenExamples.add(key);
            return true;
          })
          .slice(0, 6);
        this.grammar = response;
        this.questions = this.createQuestions(response.questions || []);
        if (!this.stagePractice && this.grammar.id) await this.markStarted();
      } catch (_) { uni.showToast({ title: '加载练习失败', icon: 'none' }); }
      this.loading = false;
    },
    markStarted() {
      return new Promise(resolve => uni.request({
        url: BASE_URL + '/grammar/progress/start', method: 'POST', header: { 'Content-Type': 'application/json' },
        data: { userId: 1, grammar_id: this.grammar.id },
        success: () => resolve(), fail: () => resolve()
      }));
    },    createQuestions(source) {
      let pool = source.filter(q => Array.isArray(q.options) && q.options.length);
      const fallback = {
        '名词复数': [['One child, two ___.','children',['child','children','childs','childes']],['Two ___ are playing.','boys',['boy','boys','boies','boyes']],['Three ___ on the table.','books',['book','books','bookes','book']],['Many ___ live here.','people',['person','people','persons','peoples']],['Two ___ are running.','mice',['mouse','mice','mouses','mousees']]],
        '形容词比较级': [['Tom is ___ than Jim.','taller',['tall','taller','tallest','more tall']],['This book is ___ than that one.','better',['good','better','best','gooder']],['A car is ___ than a bike.','faster',['fast','faster','fastest','more fast']],['Today is ___ than yesterday.','hotter',['hot','hotter','hottest','more hot']],['This bag is ___ than mine.','heavier',['heavy','heavier','heaviest','more heavy']]],
        '情态动词can': [['I ___ swim.','can',['can','cans','am can','can to']],['She ___ speak English.','can',['can','canes','is can','can to']],['___ you help me?','Can',['Can','Do','Are','Will']],['You ___ park here.','cannot',['cannot','do not','are not','will not']],['We ___ finish it today.','can',['can','cans','are can','can to']]],
        '介词用法': [['The book is ___ the table.','on',['on','in','at','to']],['I go to school ___ Monday.','on',['on','in','at','by']],['She is ___ the room.','in',['in','on','at','to']],['We meet ___ 7 o’clock.','at',['at','on','in','by']],['He goes ___ school by bus.','to',['to','at','in','on']]]
      };
      if (!pool.length && fallback[this.grammar.title]) pool = fallback[this.grammar.title].map(([sentence,answer,options]) => ({ sentence, answer, options, explanation: '请根据该语法点选择正确答案。' }));
      const candidates = pool;
      const unique = [];
      const seen = new Set();
      candidates.forEach(question => {
        const key = String(question.sentence || question.question || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/g, '');
        if (key && !seen.has(key)) { seen.add(key); unique.push({ ...question, rotationKey: key }); }
      });
      const shuffled = list => [...list].sort(() => Math.random() - 0.5);
      const targetCount = Math.min(this.dailyGrammarQuestions, unique.length);
      if (!this.stagePractice) return shuffled(unique).slice(0, targetCount).map(question => ({ ...question, options: shuffled(question.options) }));

      const historyKey = `grammar_stage_rotation_${this.stagePractice}`;
      const history = uni.getStorageSync(historyKey) || [];
      const completed = new Set(Array.isArray(history) ? history : []);
      let available = shuffled(unique.filter(question => !completed.has(question.rotationKey)));
      let selected = available.slice(0, targetCount);
      let nextHistory;
      if (selected.length < targetCount) {
        const selectedKeys = new Set(selected.map(question => question.rotationKey));
        const newCycle = shuffled(unique.filter(question => !selectedKeys.has(question.rotationKey))).slice(0, targetCount - selected.length);
        selected = [...selected, ...newCycle];
        nextHistory = newCycle.map(question => question.rotationKey);
      } else {
        nextHistory = [...completed, ...selected.map(question => question.rotationKey)];
      }
      uni.setStorageSync(historyKey, nextHistory);
      return selected.map(question => ({ ...question, options: shuffled(question.options) }));
    },
    choose(index) { if (!this.answered) this.selectedIndex = index; },
    async check() {
      if (this.selectedIndex < 0) return;
      this.answered = true;
      if (this.entryType === 'daily') {
        const now = new Date();
        const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const saved = uni.getStorageSync('grammarTodayAnswered') || {};
        const previous = saved.date === today ? Number(saved.count || 0) : 0;
        uni.setStorageSync('grammarTodayAnswered', { date: today, count: previous + 1, updatedAt: Date.now() });
      }
      this.isCorrect = this.currentQuestion.options[this.selectedIndex] === this.currentQuestion.answer;
      playAnswerFeedback(this.isCorrect);
      if (this.isCorrect) {
        this.correctCount++;
        if (!this.stagePractice && this.currentQuestion.id) {
          try {
            this.questionProgress = await new Promise((resolve, reject) => uni.request({ url: BASE_URL + '/grammar-question/progress', method: 'POST', header: { 'Content-Type': 'application/json' }, data: { userId: 1, question_id: this.currentQuestion.id }, success: response => { if (response.statusCode === 200 && response.data.code === 0) { setTimeout(() => uni.$emit('achievement:check'), 250); resolve(response.data.data); } else reject(response); }, fail: reject }));
            this.grammar.questions = (this.grammar.questions || []).filter(question => Number(question.id) !== Number(this.currentQuestion.id));
          } catch (_) { uni.showToast({ title: '答题进度保存失败', icon: 'none' }); }
        }
      } else {
        const wrong = uni.getStorageSync('grammar_wrong') || [];
        wrong.push({ ...this.currentQuestion, grammarId: this.currentQuestion.grammar_id || this.grammar.id, grammarTitle: this.currentQuestion.grammar_title || this.grammar.title, stage: Number(this.grammar.stage) });
        uni.setStorageSync('grammar_wrong', wrong);
      }
    },
    next() { if (this.questionIndex + 1 >= this.questions.length) { this.finish(); return; } this.questionIndex++; this.selectedIndex = -1; this.answered = false; this.isCorrect = false; },
    async finish() {
      this.step = 'complete';
      if (this.stagePractice || !this.grammar.id || !this.questions.length) return;
      try {
        this.masteryResult = await new Promise((resolve, reject) => uni.request({
          url: BASE_URL + '/grammar/progress', method: 'POST', header: { 'Content-Type': 'application/json' },
          data: { userId: 1, grammar_id: this.grammar.id, total_questions: this.questions.length, correct_count: this.correctCount },
          success: response => { if (response.statusCode === 200 && response.data.code === 0) { setTimeout(() => uni.$emit('achievement:check'), 250); resolve(response.data.data); } else reject(response); }, fail: reject
        }));
      } catch (_) { uni.showToast({ title: '学习进度保存失败', icon: 'none' }); }
    },
    restart() { this.masteryResult = null; this.questionProgress = null; this.questions = this.createQuestions(this.grammar.questions || []); this.questionIndex = 0; this.selectedIndex = -1; this.correctCount = 0; this.answered = false; this.step = 'practice'; },
    goBack() { uni.navigateBack(); }
  }
};
</script>
<style>
.page{min-height:100vh;background:#f7f5f0;padding:28rpx}.loading{padding-top:180rpx;text-align:center;color:#777}.hero{padding:30rpx 18rpx}.eyebrow{display:block;color:#0d9488;font-size:26rpx}.title{display:block;font-size:40rpx;font-weight:700;color:#1f3a5f;margin:12rpx 0}.description{font-size:24rpx;color:#777}.panel{background:#fff;border-radius:24rpx;padding:32rpx;box-shadow:0 6rpx 20rpx rgba(31,58,95,.08)}.panel-title{display:block;font-size:32rpx;font-weight:700;color:#1f3a5f;margin-bottom:20rpx}.explanation,.example{display:block;font-size:28rpx;line-height:1.7;color:#444}.examples{background:#eef8f7;padding:20rpx;border-radius:16rpx;margin:24rpx 0}.examples-title{display:block;color:#0d9488;font-weight:700;margin-bottom:10rpx}.primary,.secondary{margin-top:28rpx;border-radius:14rpx;font-size:30rpx}.primary{background:#1f3a5f;color:#fff}.secondary{background:#eef8f7;color:#0d9488}.progress-row{display:flex;justify-content:space-between;color:#777;font-size:26rpx}.bar{height:12rpx;background:#e8ecec;border-radius:10rpx;margin:18rpx 0 38rpx}.bar-value{height:100%;background:#0d9488;border-radius:10rpx}.question{display:block;font-size:36rpx;font-weight:700;color:#1f3a5f;line-height:1.5}.question-translation{display:block;margin:10rpx 0 28rpx;padding:14rpx 18rpx;border-radius:12rpx;background:#f5f8fa;color:#657786;font-size:25rpx;line-height:1.55}.option{display:flex;align-items:center;gap:18rpx;padding:25rpx 20rpx;border:2rpx solid #edf0f2;border-radius:16rpx;margin-bottom:16rpx;color:#333;font-size:30rpx}.option.selected{border-color:#0d9488;background:#eefaf8}.option.correct{border-color:#16a34a;background:#f0fdf4}.option.wrong{border-color:#ef4444;background:#fef2f2}.option-key{color:#0d9488;font-weight:700}.answer-box{padding:20rpx;border-radius:14rpx;margin:24rpx 0;font-size:27rpx;color:#555}.good{background:#f0fdf4}.bad{background:#fff7ed}.answer-title{display:block;font-weight:700;margin-bottom:8rpx}.finished{text-align:center;padding:70rpx 32rpx}.finish-icon{font-size:86rpx;display:block}.finish-title{display:block;font-size:42rpx;font-weight:700;color:#1f3a5f;margin:20rpx 0}.score{font-size:32rpx;color:#0d9488}.mastery-result{margin:25rpx 0 8rpx;padding:22rpx;border-radius:16rpx;background:#f1f7f6;text-align:left}.mastery-status{display:block;font-size:28rpx;font-weight:800;color:#0d9488}.mastery-detail,.mastery-rule{display:block;margin-top:9rpx;font-size:23rpx;line-height:1.5;color:#647582}.mastery-rule{color:#8b6b3d}.question-cycle{display:block;margin-top:16rpx;font-size:23rpx;color:#778793}
</style>


