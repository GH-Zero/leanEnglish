<template>
	<view class="page">
		<view class="hero">
			<view class="hero-glow"></view>
			<view class="hero-top"><view><text class="hero-kicker">ACHIEVEMENT JOURNEY</text><text class="hero-title">我的成就</text><text class="hero-sub">每一次坚持，都值得被记录</text></view><view class="hero-medal">🏅</view></view>
			<view class="hero-progress-row"><text>总成就进度</text><text>{{ unlockedCount }}/{{ totalCount }}</text></view>
			<view class="hero-track"><view class="hero-fill" :style="{ width: progress + '%' }"></view></view>
			<view class="hero-stats"><view><text class="hero-number">{{ unlockedCount }}</text><text>已解锁</text></view><view><text class="hero-number">{{ totalCount - unlockedCount }}</text><text>待解锁</text></view><view><text class="hero-number">{{ progress }}%</text><text>完成度</text></view></view>
		</view>

		<view v-if="nextBadge" class="next-card">
			<view class="next-icon">{{ nextBadge.icon }}</view>
			<view class="next-info"><text class="next-kicker">距离最近的徽章</text><text class="next-name">{{ nextBadge.name }}</text><text class="next-desc">{{ nextBadge.description }}</text><view class="next-track"><view class="next-fill" :style="{ width: badgeProgress(nextBadge) + '%' }"></view></view></view>
			<text class="next-percent">{{ badgeProgress(nextBadge) }}%</text>
		</view>

		<view v-for="section in sections" :key="section.key" class="section">
			<view class="section-heading"><view><text class="section-title">{{ section.title }}</text><text class="section-sub">{{ section.subtitle }}</text></view><text class="section-count">{{ section.items.filter(item => item.unlocked).length }}/{{ section.items.length }}</text></view>
			<view class="badge-list">
				<view v-for="badge in section.items" :key="badge.id || badge.name" class="badge-card" :class="{ unlocked: badge.unlocked, progressing: !badge.unlocked && badgeProgress(badge) > 0 }">
					<view class="badge-icon">{{ badge.icon }}</view>
					<view class="badge-main">
						<view class="badge-title-row"><text class="badge-name">{{ badge.name }}</text><text class="badge-state">{{ badge.unlocked ? '已解锁' : (badgeProgress(badge) > 0 ? '进行中' : '未开始') }}</text></view>
						<text class="badge-desc">{{ badge.description }}</text>
						<view class="badge-bottom"><view class="progress-track"><view class="progress-fill" :style="{ width: badgeProgress(badge) + '%' }"></view></view><text>{{ badgeProgress(badge) }}%</text></view>
					</view>
				</view>
			</view>
		</view>
		<view v-if="false" class="unlock-overlay" @touchmove.stop.prevent>
			<view class="unlock-modal">
				<view class="spark spark-one">✦</view><view class="spark spark-two">✦</view><view class="spark spark-three">✧</view>
				<view class="unlock-halo"><view class="unlock-icon">{{ currentUnlock.icon }}</view></view>
				<text class="unlock-kicker">ACHIEVEMENT UNLOCKED</text><text class="unlock-title">新成就解锁</text>
				<view class="unlock-divider"><view></view><text>★</text><view></view></view>
				<text class="unlock-name">{{ currentUnlock.name }}</text><text class="unlock-desc">{{ currentUnlock.description }}</text>
				<view class="unlock-complete">✓ 已加入你的成就徽章墙</view>
				<button class="unlock-button" @click="closeUnlockModal">{{ unlockQueue.length ? '查看下一个' : '太棒了' }}</button>
			</view>
		</view>
	</view>
</template>
<script>
import { getAchievements } from '@/utils/api.js';
export default {
	data() { return { learningBadges: [], streakBadges: [], specialBadges: [], showUnlockModal: false, currentUnlock: null, unlockQueue: [] }; },
	computed: {
		allBadges() { return [...this.learningBadges, ...this.streakBadges, ...this.specialBadges]; },
		unlockedCount() { return this.allBadges.filter(item => item.unlocked).length; },
		totalCount() { return this.allBadges.length; },
		progress() { return this.totalCount ? Math.round(this.unlockedCount * 100 / this.totalCount) : 0; },
		nextBadge() { return this.allBadges.filter(item => !item.unlocked && this.badgeProgress(item) > 0).sort((a, b) => this.badgeProgress(b) - this.badgeProgress(a))[0] || this.allBadges.find(item => !item.unlocked); },
		sections() { return [
			{ key: 'learning', title: '学习成就', subtitle: '记录课程学习与知识积累', items: this.learningBadges },
			{ key: 'streak', title: '连续学习', subtitle: '坚持每天学习，形成长期习惯', items: this.streakBadges },
			{ key: 'special', title: '特殊成就', subtitle: '挑战更高水平的综合能力', items: this.specialBadges }
		]; }
	},
	onShow() { this.loadAchievements(); },
	methods: {
		badgeProgress(badge) { return Math.max(0, Math.min(100, Number(badge?.progress || 0))); },
		checkNewUnlocks() {
			const storageKey = 'notifiedAchievementIds';
			const previous = uni.getStorageSync(storageKey) || [];
			const previousSet = new Set(Array.isArray(previous) ? previous : []);
			const unlocked = this.allBadges.filter(item => item.unlocked);
			const newlyUnlocked = unlocked.filter(item => !previousSet.has(item.id || item.name));
			uni.setStorageSync(storageKey, unlocked.map(item => item.id || item.name));
			if (!newlyUnlocked.length || this.showUnlockModal) return;
			this.unlockQueue = [...newlyUnlocked];
			setTimeout(() => this.showNextUnlock(), 350);
		},
		showNextUnlock() {
			this.currentUnlock = this.unlockQueue.shift() || null;
			this.showUnlockModal = Boolean(this.currentUnlock);
		},
		closeUnlockModal() {
			this.showUnlockModal = false;
			setTimeout(() => this.showNextUnlock(), 180);
		},
		async loadAchievements() {
			try { const result = await getAchievements(); this.learningBadges = result.learning || []; this.streakBadges = result.streak || []; this.specialBadges = result.special || []; }
			catch (error) { console.error('加载成就数据失败:', error); this.loadLocalAchievements(); }
		},
		loadLocalAchievements() {
			this.learningBadges = [{icon:'🌱',name:'初学者',description:'完成第一次学习',unlocked:false,progress:0},{icon:'📖',name:'单词达人',description:'学习100个单词',unlocked:false,progress:0},{icon:'📚',name:'词汇大师',description:'学习500个单词',unlocked:false,progress:0},{icon:'📝',name:'语法入门',description:'掌握5个语法知识点',unlocked:false,progress:0},{icon:'🗣️',name:'口语新星',description:'完成10次跟读',unlocked:false,progress:0}];
			this.streakBadges = [{icon:'🔥',name:'三天连续',description:'连续学习3天',unlocked:false,progress:0},{icon:'🔥',name:'一周坚持',description:'连续学习7天',unlocked:false,progress:0},{icon:'🔥',name:'半月达人',description:'连续学习15天',unlocked:false,progress:0},{icon:'🔥',name:'一月之星',description:'连续学习30天',unlocked:false,progress:0}];
			this.specialBadges = [{icon:'🎯',name:'发音高手',description:'发音平均成绩达到90分',unlocked:false,progress:0},{icon:'💬',name:'对话达人',description:'完成20次AI对话',unlocked:false,progress:0},{icon:'🏆',name:'全能学霸',description:'解锁其他全部徽章',unlocked:false,progress:0}];
		}
	}
};
</script>
<style>
.page{box-sizing:border-box;min-height:100vh;padding:24rpx 22rpx 55rpx;background:linear-gradient(180deg,#eff5f8 0,#f7f5f0 430rpx)}.hero{position:relative;overflow:hidden;padding:31rpx 28rpx 25rpx;border-radius:29rpx;background:#1F3A5F;box-shadow:0 14rpx 34rpx rgba(31,66,97,.2);color:#fff}.hero-glow{position:absolute;right:-80rpx;top:-100rpx;width:250rpx;height:250rpx;border-radius:50%;background:rgba(255,255,255,.08)}.hero-top{position:relative;display:flex;align-items:center;justify-content:space-between}.hero-kicker{display:block;font-size:16rpx;font-weight:700;letter-spacing:3rpx;color:#91dfd4}.hero-title{display:block;margin-top:8rpx;font-size:40rpx;font-weight:800}.hero-sub{display:block;margin-top:6rpx;font-size:22rpx;color:rgba(255,255,255,.68)}.hero-medal{display:flex;align-items:center;justify-content:center;width:78rpx;height:78rpx;border-radius:24rpx;background:rgba(255,255,255,.13);font-size:40rpx}.hero-progress-row{display:flex;justify-content:space-between;margin-top:25rpx;font-size:21rpx;color:rgba(255,255,255,.75)}.hero-track{height:12rpx;margin-top:10rpx;border-radius:10rpx;background:rgba(255,255,255,.15);overflow:hidden}.hero-fill{height:100%;border-radius:10rpx;background:linear-gradient(90deg,#f3c96b,#ffe8a0)}.hero-stats{display:flex;margin-top:22rpx}.hero-stats>view{flex:1;text-align:center;font-size:19rpx;color:rgba(255,255,255,.66)}.hero-number{display:block;margin-bottom:3rpx;font-size:31rpx;font-weight:800;color:#fff}
.next-card{display:flex;align-items:center;margin-top:20rpx;padding:21rpx;border-radius:21rpx;background:#fff;box-shadow:0 7rpx 21rpx rgba(38,66,90,.07)}.next-icon{display:flex;align-items:center;justify-content:center;width:68rpx;height:68rpx;border-radius:19rpx;background:#fff4d9;font-size:35rpx}.next-info{flex:1;min-width:0;margin-left:16rpx}.next-kicker{display:block;font-size:18rpx;color:#b57a22}.next-name{display:block;margin-top:3rpx;font-size:27rpx;font-weight:800;color:#294866}.next-desc{display:block;margin-top:3rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:22rpx;color:#929ca5}.next-track{height:7rpx;margin-top:10rpx;border-radius:8rpx;background:#edf0f2;overflow:hidden}.next-fill{height:100%;border-radius:8rpx;background:#d6a844}.next-percent{margin-left:16rpx;font-size:23rpx;font-weight:800;color:#b57a22}
.section{margin-top:27rpx}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:0 5rpx 13rpx}.section-title{display:block;font-size:32rpx;font-weight:800;color:#213f61}.section-sub{display:block;margin-top:3rpx;font-size:21rpx;color:#929da7}.section-count{padding:6rpx 13rpx;border-radius:17rpx;background:#e6f4f2;color:#0d8c81;font-size:20rpx;font-weight:700}.badge-list{overflow:hidden;border-radius:22rpx;background:#fff;box-shadow:0 6rpx 19rpx rgba(38,66,90,.06)}.badge-card{display:flex;align-items:center;box-sizing:border-box;min-height:126rpx;padding:18rpx 20rpx;border-left:5rpx solid transparent;background:#fff}.badge-card+.badge-card{border-top:1rpx solid #edf0f2}.badge-card.unlocked{border-left-color:#d9aa42;background:#fffdf6}.badge-card.progressing{border-left-color:#19a698;background:#f7fcfb}.badge-icon{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:62rpx;height:62rpx;border-radius:17rpx;background:#f1f3f5;font-size:31rpx;filter:grayscale(.65)}.unlocked .badge-icon{background:#fff0c9;filter:none}.progressing .badge-icon{background:#e3f5f2;filter:none}.badge-main{flex:1;min-width:0;margin-left:17rpx}.badge-title-row{display:flex;align-items:center;justify-content:space-between;gap:12rpx}.badge-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:27rpx;font-weight:800;color:#294866}.badge-state{flex-shrink:0;padding:4rpx 9rpx;border-radius:13rpx;background:#f1f3f5;color:#929aa2;font-size:17rpx}.unlocked .badge-state{background:#f7dfaa;color:#9a691d}.progressing .badge-state{background:#dff3ef;color:#0d8c81}.badge-desc{display:block;margin-top:3rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:21rpx;color:#8e98a1}.badge-bottom{display:flex;align-items:center;gap:10rpx;margin-top:9rpx;font-size:18rpx;color:#8d969e}.progress-track{flex:1;height:7rpx;border-radius:8rpx;background:#edf0f2;overflow:hidden}.progress-fill{height:100%;border-radius:8rpx;background:#8ca0b5}.unlocked .progress-fill{background:#d9aa42}.progressing .progress-fill{background:#19a698}.unlock-overlay{position:fixed;z-index:9999;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:42rpx;background:rgba(12,28,45,.72);backdrop-filter:blur(8rpx)}.unlock-modal{position:relative;overflow:hidden;width:100%;box-sizing:border-box;padding:49rpx 36rpx 34rpx;border:2rpx solid rgba(240,196,92,.62);border-radius:31rpx;background:linear-gradient(165deg,#fffdf5 0%,#fff 50%,#fff7df 100%);box-shadow:0 28rpx 80rpx rgba(0,0,0,.3);text-align:center;animation:unlock-pop .42s ease-out}.unlock-modal:before{content:'';position:absolute;left:50%;top:-190rpx;width:390rpx;height:390rpx;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(246,201,91,.3),rgba(246,201,91,0) 70%)}.unlock-halo{position:relative;display:flex;align-items:center;justify-content:center;width:142rpx;height:142rpx;margin:0 auto 24rpx;border:2rpx solid #efd178;border-radius:50%;background:linear-gradient(145deg,#fff4bf,#ffe28a);box-shadow:0 0 0 15rpx rgba(242,198,87,.12),0 12rpx 30rpx rgba(188,133,25,.24);animation:halo-pulse 1.8s ease-in-out infinite}.unlock-icon{font-size:72rpx}.unlock-kicker{position:relative;display:block;font-size:17rpx;font-weight:800;letter-spacing:3rpx;color:#b27a20}.unlock-title{position:relative;display:block;margin-top:7rpx;font-size:41rpx;font-weight:900;color:#234361}.unlock-divider{display:flex;align-items:center;justify-content:center;gap:12rpx;margin:20rpx auto 14rpx;color:#d1a33e}.unlock-divider view{width:70rpx;height:1rpx;background:#e5ca86}.unlock-divider text{font-size:22rpx}.unlock-name{display:block;font-size:35rpx;font-weight:900;color:#9a6517}.unlock-desc{display:block;margin-top:9rpx;font-size:24rpx;line-height:1.55;color:#697986}.unlock-complete{display:inline-block;margin-top:22rpx;padding:8rpx 15rpx;border-radius:18rpx;background:#edf8f5;color:#178c7f;font-size:20rpx}.unlock-button{margin-top:29rpx;height:82rpx;line-height:82rpx;border:0;border-radius:42rpx;background:linear-gradient(135deg,#d6a43d,#efc968);box-shadow:0 10rpx 23rpx rgba(189,134,29,.25);color:#fff;font-size:28rpx;font-weight:800}.unlock-button:after{border:0}.spark{position:absolute;color:#d8a638;animation:spark-float 1.8s ease-in-out infinite}.spark-one{left:43rpx;top:72rpx;font-size:31rpx}.spark-two{right:48rpx;top:112rpx;font-size:25rpx;animation-delay:.45s}.spark-three{right:80rpx;top:48rpx;font-size:21rpx;animation-delay:.9s}@keyframes unlock-pop{0%{opacity:0;transform:scale(.76) translateY(35rpx)}70%{transform:scale(1.03) translateY(-4rpx)}100%{opacity:1;transform:scale(1) translateY(0)}}@keyframes halo-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.055)}}@keyframes spark-float{0%,100%{opacity:.5;transform:translateY(0) rotate(0)}50%{opacity:1;transform:translateY(-12rpx) rotate(25deg)}}
</style>