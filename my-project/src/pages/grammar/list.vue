<template>
  <view class="page">
    <view class="heading">
      <text class="title">{{ title }}</text>
      <text class="subtitle">选择专项知识点，答对的题本轮不再出现</text>
    </view>

    <view v-if="wrongCount" class="wrong-panel">
      <view class="wrong-head">
        <view><text class="wrong-title">本阶段错题</text><text class="wrong-count">{{ wrongCount }}</text></view>
        <text class="wrong-link" @click="openWrong()">去复习 ›</text>
      </view>
      <view
        v-for="group in wrongGroups"
        :key="group.grammarTitle"
        class="wrong-item"
        @click="openWrong(group)"
      >
        <view class="wrong-content">
          <text class="wrong-grammar">{{ group.grammarTitle }}</text>
          <text class="wrong-summary">{{ group.count }} 道错题，点击查看并重新练习</text>
        </view>
        <view class="wrong-entry"><text>{{ group.count }}题</text><text class="wrong-arrow">›</text></view>
      </view>
    </view>

    <view class="section-title">专项知识点</view>
    <view v-for="point in points" :key="point.id" class="row" @click="open(point)">
      <view>
        <view class="name-row">
          <text class="name">{{ point.title }}</text>
          <text class="status" :class="{ mastered: point.mastered, learning: !point.mastered && point.started }">{{ point.mastered ? '已掌握' : (point.started ? '学习中' : '未学习') }}</text>
        </view>
        <text class="desc">{{ point.description }}</text>
      </view>
      <text class="arrow">去练习 ›</text>
    </view>
    <view v-if="!points.length" class="empty">暂无专项知识点</view>
  </view>
</template>

<script>
import { BASE_URL } from '@/utils/api.js';
export default {
  data() { return { stage: 1, points: [], wrongCount: 0, wrongGroups: [] }; },
  computed: { title() { return ['', '基础句型', '核心语法', '进阶语法'][this.stage]; } },
  onLoad(query) { this.stage = Number(query.stage || 1); },
  onShow() { this.load(); },
  methods: {
    load() {
      Promise.all([
        new Promise(resolve => uni.request({ url: `${BASE_URL}/grammar-point/list?stage=${this.stage}`, success: response => resolve(response.data?.data || []), fail: () => resolve([]) })),
        new Promise(resolve => uni.request({ url: `${BASE_URL}/grammar/progress?userId=1`, success: response => resolve(response.data?.data || {}), fail: () => resolve({}) }))
      ]).then(([points, progress]) => {
        this.points = points.map(point => ({ ...point, mastered: progress[point.id]?.mastered === true, attempts: Number(progress[point.id]?.attempts || 0), started: Boolean(progress[point.id]) }));
        const stageWrong = (uni.getStorageSync('grammar_wrong') || []).filter(item => Number(item.stage) === this.stage);
        const uniqueQuestions = new Map();
        stageWrong.forEach((item, index) => {
          const questionKey = `${item.grammarId || item.grammarTitle || 'grammar'}-${String(item.sentence || index).trim().toLowerCase()}`;
          if (!uniqueQuestions.has(questionKey)) uniqueQuestions.set(questionKey, item);
        });
        const groupMap = new Map();
        uniqueQuestions.forEach(item => {
          const grammarTitle = item.grammarTitle || '其他语法';
          if (!groupMap.has(grammarTitle)) groupMap.set(grammarTitle, { grammarTitle, count: 0 });
          groupMap.get(grammarTitle).count += 1;
        });
        this.wrongCount = uniqueQuestions.size;
        this.wrongGroups = [...groupMap.values()];
      });
    },
    openWrong(item) {
      let url = `/pages/mine/wrong-book?type=grammar&stage=${this.stage}`;
      if (item?.grammarTitle) url += `&grammarType=${encodeURIComponent(item.grammarTitle)}`;
      uni.navigateTo({ url });
    },
    open(point) { uni.navigateTo({ url: `/pages/grammar/practice?id=${point.id}` }); }
  }
};
</script>

<style>
.page{box-sizing:border-box;min-height:100vh;padding:30rpx;background:#f7f5f0}.heading{margin:10rpx 4rpx 26rpx}.title{display:block;font-size:40rpx;font-weight:800;color:#1f3a5f}.subtitle{display:block;margin-top:8rpx;font-size:22rpx;color:#8a96a2}.wrong-panel{margin-top:18rpx;padding:22rpx 23rpx;border:1rpx solid #f7c8c8;border-radius:18rpx;background:#fff7f7;box-shadow:0 4rpx 14rpx rgba(180,50,50,.05)}.wrong-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:12rpx}.wrong-head>view{display:flex;align-items:center;gap:10rpx}.wrong-title{font-size:27rpx;font-weight:800;color:#c94a4a}.wrong-count{min-width:34rpx;height:34rpx;line-height:34rpx;text-align:center;border-radius:18rpx;background:#ffe2e2;color:#c94a4a;font-size:20rpx}.wrong-link{padding:8rpx 0 8rpx 20rpx;color:#d95555;font-size:24rpx}.wrong-item{display:flex;align-items:center;gap:14rpx;padding:16rpx 0;border-top:1rpx solid #f5dddd}.wrong-content{min-width:0;flex:1}.wrong-grammar{display:block;margin-bottom:6rpx;color:#9d4b4b;font-size:25rpx;font-weight:700}.wrong-summary{display:block;color:#7b858f;font-size:21rpx;line-height:1.4}.wrong-entry{display:flex;align-items:center;gap:8rpx;color:#d15c5c;font-size:21rpx;white-space:nowrap}.wrong-arrow{color:#d96a6a;font-size:30rpx}.section-title{margin:30rpx 5rpx 16rpx;font-size:32rpx;font-weight:800;color:#294968}.row{display:flex;align-items:center;justify-content:space-between;margin-bottom:14rpx;padding:25rpx 23rpx;border-radius:18rpx;background:#fff;box-shadow:0 5rpx 16rpx rgba(31,58,95,.06)}.row>view{flex:1;padding-right:15rpx}.name-row{display:flex;align-items:center;gap:12rpx}.name{display:block;font-size:28rpx;font-weight:700;color:#1f3a5f}.status{padding:4rpx 10rpx;border-radius:14rpx;background:#f1f3f5;color:#8b949d;font-size:18rpx}.status.learning{background:#e8f1ff;color:#3975c6}.status.mastered{background:#e4f6f1;color:#0d9488}.desc{display:block;margin-top:7rpx;font-size:22rpx;color:#8c969f;line-height:1.45}.arrow{font-size:22rpx;color:#0d9488}.empty{text-align:center;padding:75rpx 20rpx;color:#89939d;font-size:25rpx}
</style>