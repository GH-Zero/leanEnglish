<template>
	<view class="page">
		<view class="hero-card">
			<view class="hero-glow"></view>
			<text class="title">学习中心</text>
			<text class="sub">按课程系统学习，记录每一次进步</text>
			<view class="hero-summary">
				<view class="summary-item">
					<text class="summary-number">{{ totalMastered }} 项</text>
					<view class="summary-breakdown"><text>音标 {{ phoneticMastered }}</text><text class="summary-dot">·</text><text>单词 {{ wordMastered }}</text><text class="summary-dot">·</text><text>语法 {{ grammarMastered }}</text></view>
				</view>
				<view class="summary-line"></view>
				<view class="summary-item"><text class="summary-number">{{ overallPercent }}%</text><text class="summary-label">三课程平均进度</text></view>
			</view>
		</view>

		<view class="section-heading"><text class="section-title">课程分类</text><text class="section-tip">选择一门课程继续学习</text></view>
		<view class="course-list">
			<view v-for="course in courses" :key="course.key" class="course" @click="go(course.url)">
				<view class="course-icon" :class="course.key">{{ course.icon }}</view>
				<view class="course-main">
					<view class="course-title-row"><text class="course-title">{{ course.title }}</text><text class="course-percent">{{ course.percent }}%</text></view>
					<text class="course-desc">{{ course.desc }}</text>
					<view class="mini-track"><view class="mini-fill" :class="course.key" :style="{ width: course.percent + '%' }"></view></view>
				</view>
				<text class="course-arrow">›</text>
			</view>
		</view>
	</view>
</template>
<script>
import { getWordStatus, request } from '@/utils/api.js';
export default {
	data() { return { phoneticPercent: 0, phoneticTotal: 0, wordPercent: 0, grammarPercent: 0, wordMastered: 0, wordTotal: 0, phoneticMastered: 0, grammarMastered: 0, grammarTotal: 0 }; },
	computed: {
		totalMastered() { return this.phoneticMastered + this.wordMastered + this.grammarMastered; },
		overallPercent() {
			const percents = [
				{ total: this.phoneticTotal, value: this.phoneticPercent },
				{ total: this.wordTotal, value: this.wordPercent },
				{ total: this.grammarTotal, value: this.grammarPercent }
			].filter(item => item.total > 0).map(item => item.value);
			return percents.length ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length) : 0;
		},
		courses() { return [
			{ key: 'phonetic', icon: '🔊', title: '音标课程', desc: `${this.phoneticTotal || 0} 个英美音标，逐个掌握`, percent: this.phoneticPercent, url: '/pages/phonetic/index?entry=course' },
			{ key: 'word', icon: '📚', title: '单词词库', desc: '完整词库，循序渐进积累', percent: Math.round(this.wordPercent), url: '/pages/word/index?entry=course' },
			{ key: 'grammar', icon: '📝', title: '语法课程', desc: '三阶段语法体系，专项突破', percent: this.grammarPercent, url: '/pages/grammar/index' }
		]; }
	},
	onShow() { this.load(); },
	methods: {
		async load() {
			try {
				const [phonetic, phoneticList, words, grammar, points, counts] = await Promise.all([request('/phonetic/progress?userId=1'), request('/phonetic/list'), getWordStatus(), request('/grammar/progress?userId=1'), request('/grammar-point/list'), request('/words/count?userId=1')]);
				this.phoneticTotal = Array.isArray(phoneticList) ? phoneticList.length : 0;
				this.phoneticMastered = Object.values(phonetic || {}).filter(item => item.mastered).length;
				this.phoneticPercent = this.phoneticTotal ? Math.round(this.phoneticMastered / this.phoneticTotal * 100) : 0;
				this.wordTotal = (counts?.stats || []).reduce((total, item) => total + Number(item.count || 0), 0);
				this.wordMastered = Object.values(words || {}).filter(item => item.mastered).length;
				this.wordPercent = this.wordTotal ? Number((this.wordMastered / this.wordTotal * 100).toFixed(2)) : 0;
				this.grammarTotal = Array.isArray(points) ? points.length : 0;
				this.grammarMastered = Object.values(grammar || {}).filter(item => item.mastered === true).length;
				this.grammarPercent = this.grammarTotal ? Math.round(this.grammarMastered / this.grammarTotal * 100) : 0;
			} catch (error) { console.error('加载学习中心失败:', error); }
		},
		go(url) { uni.navigateTo({ url }); }
	}
};
</script>
<style>
.page{min-height:100vh;box-sizing:border-box;padding:26rpx 22rpx 50rpx;background:linear-gradient(180deg,#f4f8fb 0,#f8f6f1 380rpx)}
.hero-card{position:relative;overflow:hidden;padding:34rpx 32rpx 30rpx;border-radius:28rpx;background:#1F3A5F;box-shadow:0 16rpx 34rpx rgba(24,58,98,.18);color:#fff}
.hero-glow{position:absolute;width:240rpx;height:240rpx;border-radius:50%;right:-70rpx;top:-100rpx;background:rgba(255,255,255,.08)}
.title{display:block;margin-top:0;font-size:40rpx;font-weight:800}.sub{display:block;margin-top:8rpx;font-size:25rpx;color:rgba(255,255,255,.72)}
.hero-summary{display:flex;align-items:center;margin-top:28rpx;padding-top:23rpx;border-top:1rpx solid rgba(255,255,255,.16)}.summary-item{flex:1;min-width:0;text-align:center}.summary-number,.summary-label{display:block}.summary-number{font-size:36rpx;font-weight:800}.summary-label{margin-top:6rpx;font-size:21rpx;color:rgba(255,255,255,.7)}.summary-breakdown{display:flex;align-items:center;justify-content:center;gap:8rpx;margin-top:6rpx;white-space:nowrap;font-size:19rpx;color:rgba(255,255,255,.72)}.summary-dot{margin:0 2rpx;color:#8fe1d6}.summary-line{flex:0 0 1rpx;width:1rpx;height:56rpx;background:rgba(255,255,255,.22)}
.section-heading{display:flex;justify-content:space-between;align-items:flex-end;margin:32rpx 5rpx 16rpx}.section-title{font-size:32rpx;font-weight:800;color:#213f61}.section-tip{font-size:21rpx;color:#98a3ae}
.course-list{display:flex;flex-direction:column;gap:14rpx}.course{display:flex;align-items:center;gap:20rpx;padding:24rpx 22rpx;border-radius:22rpx;background:#fff;box-shadow:0 7rpx 20rpx rgba(34,63,93,.07)}.course-icon{display:flex;align-items:center;justify-content:center;width:76rpx;height:76rpx;border-radius:20rpx;font-size:34rpx}.course-icon.phonetic{background:#e8f7f5}.course-icon.word{background:#edf3ff}.course-icon.grammar{background:#fff2e9}.course-main{flex:1}.course-title-row{display:flex;align-items:center;justify-content:space-between}.course-title{font-size:28rpx;font-weight:800;color:#264b72}.course-percent{font-size:22rpx;font-weight:700;color:#0d9488}.course-desc{display:block;margin-top:6rpx;font-size:22rpx;color:#8996a4}.course-arrow{font-size:34rpx;color:#9eacb9}.mini-track{height:7rpx;margin-top:14rpx;border-radius:8rpx;background:#edf1f4;overflow:hidden}.mini-fill{height:100%;border-radius:8rpx;background:#20b8a8}.mini-fill.word{background:#5488dd}.mini-fill.grammar{background:#e99b62}
</style>
