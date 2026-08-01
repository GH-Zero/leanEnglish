<template>
	<view class="page">
		<view class="heading"><text class="title">{{ title }}</text><text class="subtitle">选择专项知识点，答对的题本轮不再出现</text></view>
		<view v-if="wrongCount" class="wrong" @click="openWrong">本阶段错题（{{ wrongCount }}）<text>去复习 ›</text></view>
		<view class="section-title">专项知识点</view>
		<view v-for="point in points" :key="point.id" class="row" @click="open(point)">
			<view><view class="name-row"><text class="name">{{ point.title }}</text><text class="status" :class="{ mastered: point.mastered, learning: !point.mastered && point.attempts }">{{ point.mastered ? '已掌握' : (point.attempts ? '学习中' : '未学习') }}</text></view><text class="desc">{{ point.description }}</text></view><text class="arrow">去练习 ›</text>
		</view>
		<view v-if="!points.length" class="empty">暂无专项知识点</view>
	</view>
</template>
<script>
import { BASE_URL } from '@/utils/api.js';
export default {
	data() { return { stage: 1, points: [], wrongCount: 0 }; },
	computed: { title() { return ['', '基础句型', '核心语法', '进阶语法'][this.stage]; } },
	onLoad(query) { this.stage = Number(query.stage || 1); },
	onShow() { this.load(); },
	methods: {
		load() {
			Promise.all([
				new Promise(resolve => uni.request({ url: `${BASE_URL}/grammar-point/list?stage=${this.stage}`, success: response => resolve(response.data?.data || []), fail: () => resolve([]) })),
				new Promise(resolve => uni.request({ url: `${BASE_URL}/grammar/progress?userId=1`, success: response => resolve(response.data?.data || {}), fail: () => resolve({}) }))
			]).then(([points, progress]) => {
				this.points = points.map(point => ({ ...point, mastered: progress[point.id]?.mastered === true, attempts: Number(progress[point.id]?.attempts || 0) }));
				this.wrongCount = (uni.getStorageSync('grammar_wrong') || []).filter(item => Number(item.stage) === this.stage).length;
			});
		},
		openWrong() { uni.navigateTo({ url: `/pages/mine/wrong-book?type=grammar&stage=${this.stage}` }); },
		open(point) { uni.navigateTo({ url: `/pages/grammar/practice?id=${point.id}` }); }
	}
};
</script>
<style>
.page{box-sizing:border-box;min-height:100vh;padding:30rpx;background:#f7f5f0}.heading{margin:10rpx 4rpx 26rpx}.title{display:block;font-size:40rpx;font-weight:800;color:#1f3a5f}.subtitle{display:block;margin-top:8rpx;font-size:22rpx;color:#8a96a2}.wrong{display:flex;justify-content:space-between;margin-top:18rpx;padding:20rpx 23rpx;border-radius:15rpx;background:#fff1f2;color:#dc4c4c;font-size:24rpx}.section-title{margin:30rpx 5rpx 16rpx;font-size:32rpx;font-weight:800;color:#294968}.row{display:flex;align-items:center;justify-content:space-between;margin-bottom:14rpx;padding:25rpx 23rpx;border-radius:18rpx;background:#fff;box-shadow:0 5rpx 16rpx rgba(31,58,95,.06)}.row>view{flex:1;padding-right:15rpx}.name-row{display:flex;align-items:center;gap:12rpx}.name{display:block;font-size:28rpx;font-weight:700;color:#1f3a5f}.status{padding:4rpx 10rpx;border-radius:14rpx;background:#f1f3f5;color:#8b949d;font-size:18rpx}.status.learning{background:#e8f1ff;color:#3975c6}.status.mastered{background:#e4f6f1;color:#0d9488}.desc{display:block;margin-top:7rpx;font-size:22rpx;color:#8c969f;line-height:1.45}.arrow{font-size:22rpx;color:#0d9488}.empty{text-align:center;padding:75rpx 20rpx;color:#89939d;font-size:25rpx}
</style>