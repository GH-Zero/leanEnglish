<template>
	<view class="page">
		<view class="hero">
			<text class="hero-title">英语成长主线</text>
			<text class="hero-sub">按阶段循序渐进，达标一段解锁下一段</text>
			<view class="hero-bar"><view class="hero-fill" :style="{ width: overallPercent + '%' }"></view></view>
			<text class="hero-meta">总进度 {{ overallPercent }}% · 当前：{{ currentStageTitle }}</text>
		</view>

		<view class="stage0">
			<text class="s0-icon">🎯</text>
			<view class="s0-main"><text class="s0-title">阶段0 · 入学定位（可选）</text><text class="s0-desc">先做个小测判断起点，已会音标可跳过语音入门</text></view>
		</view>

		<animated-loading v-if="loading" text="正在计算学习进度"></animated-loading>
		<view v-else class="stage-list">
			<view v-for="(stage, index) in stages" :key="stage.key" class="stage-card" :class="stage.state">
				<view v-if="index < stages.length - 1" class="stage-line" :class="{ done: stage.state === 'done' }"></view>
				<view class="stage-badge">{{ stage.state === 'done' ? '✓' : (stage.state === 'locked' ? '🔒' : stage.order) }}</view>
				<view class="stage-body" @click="openStage(stage)">
					<view class="stage-top"><text class="stage-name">{{ stage.title }}</text><text class="stage-tag">{{ stateText(stage) }}</text></view>
					<text class="stage-desc">{{ stage.desc }}</text>
					<view class="stage-track"><view class="stage-fill" :style="{ width: stage.percent + '%' }"></view></view>
					<view class="stage-foot"><text class="stage-progress">{{ stage.progressText }}</text><text v-if="stage.state !== 'locked'" class="stage-cta">{{ stage.state === 'done' ? '复习巩固' : '继续学习' }} ›</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getPhoneticProgress, getWordStatus, getGrammarProgress, request } from '@/utils/api.js';
import { isFirstLoad } from '@/utils/first-load.js';

const STAGES = [
	{ key: 'voice', order: 1, title: '阶段1 · 语音入门', desc: '48个音标分组通关，看到能读、听到能辨', route: '/pages/phonetic/index?entry=course' },
	{ key: 'basic', order: 2, title: '阶段2 · 基础词汇+句型', desc: 'Level0 词汇 + be动词/一般现在时，能说最简单的一句话', route: '/pages/word/index?entry=course' },
	{ key: 'daily', order: 3, title: '阶段3 · 日常表达', desc: 'Level1 词汇 + 常用时态 + 入门场景对话', route: '/pages/dialogue/index' },
	{ key: 'free', order: 4, title: '阶段4 · 自由沟通', desc: 'Level2 词汇 + 进阶语法 + AI自由对话', route: '/pages/dialogue/index' }
];

export default {
	data() {
		const firstLoad = isFirstLoad('pages/journey/index');
		return { loading: firstLoad, firstLoad, metrics: null };
	},
	// __REST__
	computed: {
		stages() {
			const m = this.metrics;
			const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, Math.round(a * 100 / b))) : 0);
			const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0);
			let percents = [0, 0, 0, 0];
			let texts = ['', '', '', ''];
			if (m) {
				percents[0] = pct(m.phoneticMastered, m.phoneticTotal);
				percents[1] = avg([pct(m.levelMastered[0], m.levelTotals[0]), pct(m.gStageMastered[1], m.gStageTotal[1])]);
				percents[2] = avg([pct(m.levelMastered[1], m.levelTotals[1]), pct(m.gStageMastered[2], m.gStageTotal[2])]);
				percents[3] = avg([pct(m.levelMastered[2], m.levelTotals[2]), pct(m.gStageMastered[3], m.gStageTotal[3])]);
				texts[0] = `已掌握 ${m.phoneticMastered}/${m.phoneticTotal} 音标`;
				texts[1] = `Level0 ${m.levelMastered[0]}/${m.levelTotals[0]} 词 · 基础语法 ${m.gStageMastered[1]}/${m.gStageTotal[1]}`;
				texts[2] = `Level1 ${m.levelMastered[1]}/${m.levelTotals[1]} 词 · 核心语法 ${m.gStageMastered[2]}/${m.gStageTotal[2]}`;
				texts[3] = `Level2 ${m.levelMastered[2]}/${m.levelTotals[2]} 词 · 进阶语法 ${m.gStageMastered[3]}/${m.gStageTotal[3]}`;
			}
			const done = percents.map(p => p >= 100);
			return STAGES.map((stage, index) => {
				const unlocked = index === 0 || done[index - 1];
				const state = done[index] ? 'done' : (unlocked ? 'current' : 'locked');
				return { ...stage, percent: percents[index], progressText: texts[index], state };
			});
		},
		overallPercent() {
			const list = this.stages;
			return list.length ? Math.round(list.reduce((s, x) => s + x.percent, 0) / list.length) : 0;
		},
		currentStageTitle() {
			const current = this.stages.find(s => s.state === 'current');
			return current ? current.title.split(' · ')[1] || current.title : '全部完成';
		}
	},
	onShow() { this.load(); },
	methods: {
		async load() {
			try {
				const [phoneticProg, phoneticList, wordStatus, counts, grammarProg, points] = await Promise.all([
					getPhoneticProgress().catch(() => ({})),
					request('/phonetic/list').catch(() => []),
					getWordStatus().catch(() => ({})),
					request('/words/count').catch(() => null),
					getGrammarProgress().catch(() => ({})),
					request('/grammar-point/list').catch(() => [])
				]);
				const phoneticTotal = Array.isArray(phoneticList) && phoneticList.length ? phoneticList.length : 48;
				const phoneticMastered = Object.values(phoneticProg || {}).filter(x => x && x.mastered).length;
				const levelTotals = { 0: 0, 1: 0, 2: 0 };
				(counts?.stats || []).forEach(s => { if (levelTotals[Number(s.level)] !== undefined) levelTotals[Number(s.level)] = Number(s.count || 0); });
				const levelMastered = { 0: 0, 1: 0, 2: 0 };
				Object.values(wordStatus || {}).forEach(w => { if (w && w.mastered) { const l = Number(w.level || 0); if (levelMastered[l] !== undefined) levelMastered[l]++; } });
				const gStageTotal = { 1: 0, 2: 0, 3: 0 };
				const gStageMastered = { 1: 0, 2: 0, 3: 0 };
				(Array.isArray(points) ? points : []).forEach(p => { const st = Number(p.stage || 0); if (gStageTotal[st] !== undefined) { gStageTotal[st]++; if (grammarProg?.[p.id]?.mastered) gStageMastered[st]++; } });
				this.metrics = { phoneticTotal, phoneticMastered, levelTotals, levelMastered, gStageTotal, gStageMastered };
			} catch (error) {
				console.error('加载学习主线失败:', error);
			} finally {
				this.loading = false;
			}
		},
		stateText(stage) {
			if (stage.state === 'done') return '已完成';
			if (stage.state === 'locked') return '未解锁';
			return stage.percent > 0 ? '进行中' : '待开始';
		},
		openStage(stage) {
			if (stage.state === 'locked') {
				uni.showToast({ title: '完成上一阶段后自动解锁', icon: 'none' });
				return;
			}
			uni.navigateTo({ url: stage.route });
		}
	}
}
</script>

<style>
.page{min-height:100vh;box-sizing:border-box;padding:24rpx 22rpx 60rpx;background:linear-gradient(180deg,#eef5f6 0,#f7f5f0 420rpx)}
.hero{position:relative;overflow:hidden;padding:32rpx 30rpx;border-radius:26rpx;background:#1F3A5F;color:#fff;box-shadow:0 14rpx 30rpx rgba(24,58,98,.18)}
.hero-title{display:block;font-size:40rpx;font-weight:800}
.hero-sub{display:block;margin-top:8rpx;font-size:23rpx;color:rgba(255,255,255,.75)}
.hero-bar{height:12rpx;margin-top:22rpx;border-radius:8rpx;background:rgba(255,255,255,.22);overflow:hidden}
.hero-fill{height:100%;border-radius:8rpx;background:#5fd0c0}
.hero-meta{display:block;margin-top:12rpx;font-size:21rpx;color:rgba(255,255,255,.82)}
.stage0{display:flex;align-items:center;gap:14rpx;margin:20rpx 4rpx;padding:18rpx 22rpx;border-radius:20rpx;background:#fff;box-shadow:0 6rpx 16rpx rgba(34,63,93,.07)}
.s0-icon{font-size:38rpx}
.s0-main{flex:1;min-width:0}
.s0-title{display:block;font-size:25rpx;font-weight:800;color:#264b72}
.s0-desc{display:block;margin-top:3rpx;font-size:20rpx;color:#8996a4}
.stage-list{position:relative;margin-top:8rpx}
.stage-card{position:relative;display:flex;gap:18rpx;padding:6rpx 0 26rpx 0}
.stage-line{position:absolute;left:33rpx;top:56rpx;bottom:-6rpx;width:0;border-left:4rpx dashed #cdd8d5}
.stage-line.done{border-left-color:#7fd3b0}
.stage-badge{position:relative;z-index:2;display:flex;flex-shrink:0;align-items:center;justify-content:center;width:66rpx;height:66rpx;border-radius:50%;background:#1F3A5F;color:#fff;font-size:28rpx;font-weight:800;box-shadow:0 6rpx 14rpx rgba(31,58,95,.25)}
.stage-card.locked .stage-badge{background:#b8c2c0}
.stage-card.done .stage-badge{background:#28a06f}
.stage-body{flex:1;min-width:0;padding:20rpx 22rpx;border-radius:20rpx;background:#fff;box-shadow:0 7rpx 18rpx rgba(34,63,93,.08)}
.stage-card.locked .stage-body{background:#f3f5f6}
.stage-card.current .stage-body{border:2rpx solid #5fd0c0}
.stage-top{display:flex;align-items:center;justify-content:space-between}
.stage-name{font-size:27rpx;font-weight:800;color:#264b72}
.stage-card.locked .stage-name{color:#95a1a8}
.stage-tag{flex-shrink:0;padding:4rpx 12rpx;border-radius:14rpx;background:#e2f3ee;color:#1c8c7d;font-size:18rpx;font-weight:700}
.stage-card.locked .stage-tag{background:#e7ebed;color:#98a4ab}
.stage-card.done .stage-tag{background:#e0f5ec;color:#0d9488}
.stage-desc{display:block;margin-top:8rpx;font-size:21rpx;color:#8996a4;line-height:1.5}
.stage-track{height:8rpx;margin-top:14rpx;border-radius:8rpx;background:#edf1f4;overflow:hidden}
.stage-fill{height:100%;border-radius:8rpx;background:#20b8a8}
.stage-foot{display:flex;align-items:center;justify-content:space-between;margin-top:12rpx}
.stage-progress{font-size:19rpx;color:#8996a4}
.stage-cta{font-size:21rpx;font-weight:800;color:#0d9488}
</style>
