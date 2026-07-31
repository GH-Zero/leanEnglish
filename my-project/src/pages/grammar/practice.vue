<template>
  <view class="page">
    <view v-if="loading" class="loading">加载练习中…</view>
    <template v-else-if="grammar.id">
      <view class="hero">
        <text class="eyebrow">语法专项练习</text>
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
        <button class="primary" @click="step = 'practice'">开始 5 题练习</button>
      </view>
      <view v-else-if="step === 'practice'" class="panel">
        <view class="progress-row"><text>第 {{ questionIndex + 1 }} / {{ questions.length }} 题</text><text>答对 {{ correctCount }} 题</text></view>
        <view class="bar"><view class="bar-value" :style="{ width: ((questionIndex + 1) / questions.length * 100) + '%' }" /></view>
        <text class="question">{{ currentQuestion.sentence || currentQuestion.question }}</text>
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
        <text class="score">{{ correctCount }} / {{ questions.length }} 题正确</text>
        <button class="primary" @click="restart">再练一组</button>
        <button class="secondary" @click="goBack">返回语法列表</button>
      </view>
    </template>
    <view v-else class="loading">未找到该语法内容</view>
  </view>
</template>
<script>
import { BASE_URL } from '@/utils/api.js';
export default {
  data() { return { loading: true, grammar: {}, questions: [], questionIndex: 0, selectedIndex: -1, answered: false, isCorrect: false, correctCount: 0, step: 'explain', optionLabels: ['A', 'B', 'C', 'D'] }; },
  computed: { currentQuestion() { return this.questions[this.questionIndex] || {}; } },
  onLoad(query) { this.grammarId = query.id; this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try {
        const response = await new Promise((resolve, reject) => uni.request({ url: `${BASE_URL}/grammar-point/detail/${this.grammarId}`, success: r => r.statusCode === 200 && r.data.code === 0 ? resolve(r.data.data) : reject(), fail: reject }));
        const baseExamples = Array.isArray(response.examples) ? response.examples : [];
        const questionExamples = (response.questions || []).map(question => String(question.sentence || '').replace('___', question.answer || '')).filter(Boolean);
        response.examples = [...new Set([...baseExamples, ...questionExamples])].slice(0, 6);
        this.grammar = response;
        this.questions = this.createFiveQuestions(response.questions || []);
      } catch (_) { uni.showToast({ title: '加载练习失败', icon: 'none' }); }
      this.loading = false;
    },
    createFiveQuestions(source) {
      let pool = source.filter(q => Array.isArray(q.options) && q.options.length);
      const fallback = {
        '名词复数': [['One child, two ___.','children',['child','children','childs','childes']],['Two ___ are playing.','boys',['boy','boys','boies','boyes']],['Three ___ on the table.','books',['book','books','bookes','book']],['Many ___ live here.','people',['person','people','persons','peoples']],['Two ___ are running.','mice',['mouse','mice','mouses','mousees']]],
        '形容词比较级': [['Tom is ___ than Jim.','taller',['tall','taller','tallest','more tall']],['This book is ___ than that one.','better',['good','better','best','gooder']],['A car is ___ than a bike.','faster',['fast','faster','fastest','more fast']],['Today is ___ than yesterday.','hotter',['hot','hotter','hottest','more hot']],['This bag is ___ than mine.','heavier',['heavy','heavier','heaviest','more heavy']]],
        '情态动词can': [['I ___ swim.','can',['can','cans','am can','can to']],['She ___ speak English.','can',['can','canes','is can','can to']],['___ you help me?','Can',['Can','Do','Are','Will']],['You ___ park here.','cannot',['cannot','do not','are not','will not']],['We ___ finish it today.','can',['can','cans','are can','can to']]],
        '介词用法': [['The book is ___ the table.','on',['on','in','at','to']],['I go to school ___ Monday.','on',['on','in','at','by']],['She is ___ the room.','in',['in','on','at','to']],['We meet ___ 7 o’clock.','at',['at','on','in','by']],['He goes ___ school by bus.','to',['to','at','in','on']]]
      };
      if (!pool.length && fallback[this.grammar.title]) pool = fallback[this.grammar.title].map(([sentence,answer,options]) => ({ sentence, answer, options, explanation: '请根据该语法点选择正确答案。' }));
      const beOptions = ['am', 'is', 'are', 'be'];
      const beQuestions = [
        ['I ___ a student.', 'am', '主语 I 要用 am。'],
        ['She ___ my new teacher.', 'is', '主语 She 是单数，要用 is。'],
        ['They ___ in the classroom.', 'are', '主语 They 是复数，要用 are。'],
        ['We ___ ready for class.', 'are', '主语 We 要用 are。'],
        ['He ___ very friendly.', 'is', '主语 He 是单数，要用 is。'],
        ['You ___ my best friend.', 'are', '主语 You 要用 are。'],
        ['My parents ___ at home.', 'are', 'My parents 是复数，要用 are。'],
        ['The book ___ on the desk.', 'is', 'The book 是单数，要用 is。']
      ].map(([sentence, answer, explanation]) => ({ sentence, answer, explanation, options: beOptions }));
      const hasBeVerbQuestion = pool.some(q => ['am', 'is', 'are'].includes(q.answer));
      const candidates = hasBeVerbQuestion ? [...pool, ...beQuestions] : pool;
      const unique = [];
      const seen = new Set();
      candidates.sort(() => Math.random() - 0.5).forEach(question => {
        if (!seen.has(question.sentence)) { seen.add(question.sentence); unique.push(question); }
      });
      return unique.slice(0, Math.min(5, unique.length)).map(question => ({ ...question, options: [...question.options].sort(() => Math.random() - 0.5) }));
    },
    choose(index) { if (!this.answered) this.selectedIndex = index; },
    check() { if (this.selectedIndex < 0) return; this.answered = true; this.isCorrect = this.currentQuestion.options[this.selectedIndex] === this.currentQuestion.answer; if (this.isCorrect) this.correctCount++; else { const wrong=uni.getStorageSync('grammar_wrong')||[]; wrong.push({...this.currentQuestion,grammarId:this.grammar.id,grammarTitle:this.grammar.title,stage:Number(this.grammar.stage)}); uni.setStorageSync('grammar_wrong',wrong); } },
    next() { if (this.questionIndex + 1 >= this.questions.length) { this.finish(); return; } this.questionIndex++; this.selectedIndex = -1; this.answered = false; this.isCorrect = false; },
    finish() { if(this.correctCount===this.questions.length){const done=uni.getStorageSync('grammar_done')||[];if(!done.includes(this.grammar.id)){done.push(this.grammar.id);uni.setStorageSync('grammar_done',done)}} this.step = 'complete'; uni.request({ url: BASE_URL + '/grammar/progress', method: 'POST', header: { 'Content-Type': 'application/json' }, data: { userId: 1, grammar_id: this.grammar.id, status: '已学习', score: Math.round(this.correctCount / this.questions.length * 100) } }); },
    restart() { this.questions = this.createFiveQuestions(this.grammar.questions || []); this.questionIndex = 0; this.selectedIndex = -1; this.correctCount = 0; this.answered = false; this.step = 'practice'; },
    goBack() { uni.navigateBack(); }
  }
};
</script>
<style>
.page{min-height:100vh;background:#f7f5f0;padding:28rpx}.loading{padding-top:180rpx;text-align:center;color:#777}.hero{padding:30rpx 18rpx}.eyebrow{display:block;color:#0d9488;font-size:26rpx}.title{display:block;font-size:46rpx;font-weight:700;color:#1f3a5f;margin:12rpx 0}.description{font-size:26rpx;color:#777}.panel{background:#fff;border-radius:24rpx;padding:32rpx;box-shadow:0 6rpx 20rpx rgba(31,58,95,.08)}.panel-title{display:block;font-size:32rpx;font-weight:700;color:#1f3a5f;margin-bottom:20rpx}.explanation,.example{display:block;font-size:28rpx;line-height:1.7;color:#444}.examples{background:#eef8f7;padding:20rpx;border-radius:16rpx;margin:24rpx 0}.examples-title{display:block;color:#0d9488;font-weight:700;margin-bottom:10rpx}.primary,.secondary{margin-top:28rpx;border-radius:14rpx;font-size:30rpx}.primary{background:#1f3a5f;color:#fff}.secondary{background:#eef8f7;color:#0d9488}.progress-row{display:flex;justify-content:space-between;color:#777;font-size:26rpx}.bar{height:12rpx;background:#e8ecec;border-radius:10rpx;margin:18rpx 0 38rpx}.bar-value{height:100%;background:#0d9488;border-radius:10rpx}.question{display:block;font-size:36rpx;font-weight:700;color:#1f3a5f;line-height:1.5;margin-bottom:28rpx}.option{display:flex;align-items:center;gap:18rpx;padding:25rpx 20rpx;border:2rpx solid #edf0f2;border-radius:16rpx;margin-bottom:16rpx;color:#333;font-size:30rpx}.option.selected{border-color:#0d9488;background:#eefaf8}.option.correct{border-color:#16a34a;background:#f0fdf4}.option.wrong{border-color:#ef4444;background:#fef2f2}.option-key{color:#0d9488;font-weight:700}.answer-box{padding:20rpx;border-radius:14rpx;margin:24rpx 0;font-size:27rpx;color:#555}.good{background:#f0fdf4}.bad{background:#fff7ed}.answer-title{display:block;font-weight:700;margin-bottom:8rpx}.finished{text-align:center;padding:70rpx 32rpx}.finish-icon{font-size:86rpx;display:block}.finish-title{display:block;font-size:42rpx;font-weight:700;color:#1f3a5f;margin:20rpx 0}.score{font-size:32rpx;color:#0d9488}
</style>
