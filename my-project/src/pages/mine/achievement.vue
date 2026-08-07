<template>
	<view class="page">
		<view class="hero">
			<view class="hero-glow"></view>
			<view class="hero-top">
				<view>
					<text class="hero-kicker">成就殿堂</text>
					<text class="hero-title">{{ rankName }}</text>
					<text class="hero-sub">已点亮 {{ unlockedCount }}/{{ totalCount }} 枚勋章</text>
				</view>
				<view class="hero-medal">🏅</view>
			</view>
			<view class="hero-track"><view class="hero-fill" :style="{ width: progress + '%' }"></view></view>
			<view class="hero-stats">
				<view><text class="hero-number">{{ unlockedCount }}</text><text>已点亮</text></view>
				<view><text class="hero-number">{{ totalCount - unlockedCount }}</text><text>待解锁</text></view>
				<view><text class="hero-number">{{ nextBadge ? '进行中' : '已集齐' }}</text><text>最近目标</text></view>
			</view>
		</view>

		<view v-if="rewardTotal > 0" class="reward-bar">
			<text class="reward-title">🎁 我的道具</text>
			<text v-if="rewards.star_shield" class="reward-item">🛡️ 免扣星 ×{{ rewards.star_shield }}</text>
			<text class="reward-hint">闯关中可直接使用</text>
		</view>

		<animated-loading v-if="loading" text="正在加载成就数据"></animated-loading>
		<template v-else>
			<view v-if="nextBadge" class="next-card">
				<view class="next-icon">{{ nextBadge.icon }}</view>
				<view class="next-info">
					<text class="next-kicker">下一个成就</text>
					<text class="next-name">{{ nextBadge.name }}</text>
					<view class="next-line"><text class="next-remain">{{ achievementRemainingText(nextBadge) }}</text><text class="next-percent">{{ badgeProgress(nextBadge) }}%</text></view>
					<view class="next-track"><view class="next-fill" :style="{ width: badgeProgress(nextBadge) + '%' }"></view></view>
				</view>
			</view>

			<animated-empty v-if="!allBadges.length" icon="🏆" text="暂无成就数据"></animated-empty>
			<view v-for="section in sections" :key="section.key" class="section">
				<view class="section-heading">
					<view class="section-title-row"><text class="section-icon">{{ section.icon }}</text><view><text class="section-title">{{ section.title }}</text><text class="section-sub">{{ section.subtitle }}</text></view></view>
					<text class="section-count">{{ section.items.filter(item => item.unlocked).length }}/{{ section.items.length }}</text>
				</view>
				<view class="medal-grid">
					<view v-for="badge in section.items" :key="badge.id || badge.name" class="medal-cell" :class="medalClass(badge)">
						<view class="medal"><text>{{ badge.icon }}</text><view v-if="badge.unlocked" class="medal-shine"></view></view>
						<text class="medal-name">{{ medalName(badge) }}</text>
						<text class="medal-state">{{ medalState(badge) }}</text>
						<view v-if="!badge.unlocked && badgeProgress(badge) > 0" class="medal-track"><view :style="{ width: badgeProgress(badge) + '%' }"></view></view>
					</view>
				</view>
			</view>

			<view v-if="legendBadge" class="section">
				<view class="section-heading">
					<view class="section-title-row"><text class="section-icon">👑</text><view><text class="section-title">传奇成就</text><text class="section-sub">集齐四大类勋章，登顶成就殿堂</text></view></view>
				</view>
				<view class="legend-card" :class="{ unlocked: legendBadge.unlocked }" @click="showLegendTip">
					<view class="legend-medal">{{ legendBadge.icon }}</view>
					<view class="legend-info">
						<text class="legend-name">{{ legendBadge.unlocked ? legendBadge.name : '？？？' }}</text>
						<text class="legend-desc">{{ legendBadge.unlocked ? legendBadge.description : '隐藏的至高荣誉，等你揭晓' }}</text>
						<view class="legend-line"><text class="legend-remain">{{ legendBadge.unlocked ? '已达成' : achievementRemainingText(legendBadge) }}</text><text class="legend-percent">{{ badgeProgress(legendBadge) }}%</text></view>
					</view>
				</view>
			</view>

			<view class="reward-note">🎁 成就奖励已生效：免扣星可在闯关失败时保通关</view>
		</template>
		<AchievementUnlockNotifier />
	</view>
</template>
<script>
import { getAchievements, getAchievementRewards } from '@/utils/api.js';
import { isFirstLoad } from '@/utils/first-load.js';
import { achievementRemainingText } from '@/utils/achievement-text.js';
export default {
	data() { const firstLoad = isFirstLoad('pages/mine/achievement'); return { loading: firstLoad, firstLoad, learningBadges: [], streakBadges: [], specialBadges: [], hiddenBadges: [], rewards: { star_shield: 0 } }; },
	computed: {
		allBadges() { return [...this.learningBadges, ...this.streakBadges, ...this.specialBadges, ...this.hiddenBadges]; },
		unlockedCount() { return this.allBadges.filter(item => item.unlocked).length; },
		totalCount() { return this.allBadges.length; },
		progress() { return this.totalCount ? Math.round(this.unlockedCount * 100 / this.totalCount) : 0; },
		rewardTotal() { return Number(this.rewards?.star_shield || 0); },
		rankName() {
			const n = this.unlockedCount;
			if (this.totalCount && n >= this.totalCount) return '传奇学霸';
			if (n >= 8) return '成就猎人';
			if (n >= 4) return '勋章收集者';
			if (n >= 1) return '新手探险家';
			return '初入学习殿堂';
		},
		nextBadge() {
			const visible = this.allBadges.filter(item => !item.unlocked && !item.hidden);
			return visible.filter(item => this.badgeProgress(item) > 0).sort((a, b) => this.badgeProgress(b) - this.badgeProgress(a))[0] || visible[0] || null;
		},
		legendBadge() { return this.allBadges.find(item => item.id === 'all_achievements') || null; },
		sections() {
			const byId = {};
			this.allBadges.forEach(item => { byId[item.id || item.name] = item; });
			const groups = [
				{ key: 'word', icon: '🏆', title: '词汇猎人', subtitle: '词汇量的积累', ids: ['beginner', 'word_master_100', 'word_master_500'] },
				{ key: 'grammar', icon: '🎯', title: '语法学者', subtitle: '语法知识的掌握', ids: ['grammar_beginner'] },
				{ key: 'speak', icon: '🗣️', title: '口语新星', subtitle: '开口说出的进步', ids: ['speak_beginner', 'pronunciation_master', 'dialogue_master'] },
				{ key: 'streak', icon: '🔥', title: '毅力王者', subtitle: '坚持是最好的天赋', ids: ['streak_3', 'streak_7', 'streak_15', 'streak_30'] },
				{ key: 'hidden', icon: '✨', title: '隐藏成就', subtitle: '达成特殊条件才会揭晓', items: this.hiddenBadges }
			];
			return groups.map(group => group.items ? group : ({ ...group, items: group.ids.map(id => byId[id]).filter(Boolean) })).filter(group => group.items.length);
		}
	},
	onShow() { this.loadAchievements(); },
	methods: {
		badgeProgress(badge) { return Math.max(0, Math.min(100, Number(badge?.progress || 0))); },
		achievementRemainingText,
		medalClass(badge) {
			if (badge.unlocked) return 'unlocked';
			if (badge.hidden || this.badgeProgress(badge) <= 0) return 'locked';
			return 'progressing';
		},
		medalName(badge) {
			if (badge.unlocked) return badge.name;
			if (badge.hidden || this.badgeProgress(badge) <= 0) return '？？？';
			return badge.name;
		},
		medalState(badge) {
			if (badge.unlocked) return '已完成';
			if (badge.hidden || this.badgeProgress(badge) <= 0) return '未解锁';
			return this.achievementRemainingText(badge);
		},
		showLegendTip() {
			if (this.legendBadge?.unlocked) return;
			uni.showToast({ title: '集齐词汇、语法、口语、毅力四大类勋章后揭晓', icon: 'none' });
		},
		async loadAchievements() {
			try {
				const [result, rewards] = await Promise.all([getAchievements(), getAchievementRewards()]);
				this.learningBadges = result.learning || [];
				this.streakBadges = result.streak || [];
				this.specialBadges = result.special || [];
				this.hiddenBadges = result.hidden || [];
				this.rewards = rewards || { star_shield: 0 };
			} catch (error) {
				console.error('加载成就数据失败:', error);
				this.loadLocalAchievements();
			} finally {
				this.loading = false;
			}
		},
		loadLocalAchievements() {
			this.learningBadges = [
				{ id: 'beginner', icon: '🌱', name: '初学者', description: '完成第一次学习', unlocked: false, progress: 0, current: 0, target: 1, reward: '开启成就收集之旅' },
				{ id: 'word_master_100', icon: '📖', name: '单词达人', description: '学习100个单词', unlocked: false, progress: 0, current: 0, target: 100, reward: '' },
				{ id: 'word_master_500', icon: '📚', name: '词汇大师', description: '学习500个单词', unlocked: false, progress: 0, current: 0, target: 500, reward: '' },
				{ id: 'grammar_beginner', icon: '📝', name: '语法入门', description: '掌握5个语法知识点', unlocked: false, progress: 0, current: 0, target: 5, reward: '' },
				{ id: 'speak_beginner', icon: '🗣️', name: '口语新星', description: '完成10次跟读', unlocked: false, progress: 0, current: 0, target: 10, reward: '' }
			];
			this.streakBadges = [
				{ id: 'streak_3', icon: '🔥', name: '三天连续', description: '连续学习3天', unlocked: false, progress: 0, current: 0, target: 3, reward: '闯关失败免扣星 1 次' },
				{ id: 'streak_7', icon: '🔥', name: '一周坚持', description: '连续学习7天', unlocked: false, progress: 0, current: 0, target: 7, reward: '解锁限定闯关皮肤' },
				{ id: 'streak_15', icon: '🔥', name: '半月达人', description: '连续学习15天', unlocked: false, progress: 0, current: 0, target: 15, reward: '每日免扣星 +1' },
				{ id: 'streak_30', icon: '🔥', name: '一月之星', description: '连续学习30天', unlocked: false, progress: 0, current: 0, target: 30, reward: '传奇称号「一月之星」' }
			];
			this.specialBadges = [
				{ id: 'pronunciation_master', icon: '🎯', name: '发音高手', description: '发音平均成绩达到90分', unlocked: false, progress: 0, current: 0, target: 90, reward: '' },
				{ id: 'dialogue_master', icon: '💬', name: '对话达人', description: '完成20次AI对话', unlocked: false, progress: 0, current: 0, target: 20, reward: '' },
				{ id: 'all_achievements', icon: '🏆', name: '全能学霸', description: '解锁其他全部徽章', unlocked: false, progress: 0, current: 0, target: 11, reward: '解锁隐藏 Boss 关' }
			];
			this.hiddenBadges = [
				{ id: 'combo_10', icon: '⚡', name: '连击大师', description: '单次闯关连续答对10题', hidden: true, unlocked: false, progress: 0, current: 0, target: 10, reward: '' },
				{ id: 'wrong_terminator', icon: '🧹', name: '错题终结者', description: '清空错题本全部错题', hidden: true, unlocked: false, progress: 0, current: 0, target: 1, reward: '' },
				{ id: 'morning_scholar', icon: '🌅', name: '晨光学者', description: '早晨6-8点完成学习', hidden: true, unlocked: false, progress: 0, current: 0, target: 1, reward: '' }
			];
			this.rewards = { star_shield: 0 };
		}
	}
};
</script>
<style>
.page{box-sizing:border-box;min-height:100vh;padding:24rpx 22rpx 60rpx;background:linear-gradient(180deg,#eef5f8 0,#f7f5f0 430rpx)}
.hero{position:sticky;top:0;z-index:5;overflow:hidden;padding:30rpx 28rpx 24rpx;border-radius:29rpx;background:#1F3A5F;box-shadow:0 14rpx 34rpx rgba(31,66,97,.2);color:#fff}
.hero-glow{position:absolute;right:-80rpx;top:-100rpx;width:250rpx;height:250rpx;border-radius:50%;background:rgba(255,255,255,.08)}
.hero-top{position:relative;display:flex;align-items:center;justify-content:space-between}
.hero-kicker{display:block;font-size:19rpx;font-weight:700;letter-spacing:2rpx;color:#91dfd4}
.hero-title{display:block;margin-top:8rpx;font-size:38rpx;font-weight:900}
.hero-sub{display:block;margin-top:6rpx;font-size:22rpx;color:rgba(255,255,255,.68)}
.hero-medal{display:flex;align-items:center;justify-content:center;width:78rpx;height:78rpx;border-radius:24rpx;background:rgba(255,255,255,.13);font-size:40rpx}
.hero-track{height:12rpx;margin-top:24rpx;border-radius:10rpx;background:rgba(255,255,255,.15);overflow:hidden}
.hero-fill{height:100%;border-radius:10rpx;background:linear-gradient(90deg,#f3c96b,#ffe8a0)}
.hero-stats{display:flex;margin-top:20rpx}
.hero-stats>view{flex:1;text-align:center;font-size:19rpx;color:rgba(255,255,255,.66)}
.hero-number{display:block;margin-bottom:3rpx;font-size:30rpx;font-weight:800;color:#fff}
.next-card{display:flex;align-items:center;margin-top:20rpx;padding:22rpx;border-radius:22rpx;background:linear-gradient(135deg,#fffdf2,#fff);border:2rpx solid #f3dfae;box-shadow:0 8rpx 24rpx rgba(181,122,34,.14)}
.next-icon{display:flex;align-items:center;justify-content:center;width:76rpx;height:76rpx;border-radius:22rpx;background:linear-gradient(145deg,#fff4bf,#ffe28a);font-size:38rpx;box-shadow:0 0 0 8rpx rgba(242,198,87,.14)}
.next-info{flex:1;min-width:0;margin-left:18rpx}
.next-kicker{display:block;font-size:19rpx;font-weight:700;color:#b57a22}
.next-name{display:block;margin-top:4rpx;font-size:30rpx;font-weight:900;color:#294866}
.next-line{display:flex;align-items:center;justify-content:space-between;margin-top:8rpx}
.next-remain{font-size:22rpx;font-weight:800;color:#d18f2a}
.next-percent{font-size:20rpx;font-weight:700;color:#b57a22}
.next-track{height:8rpx;margin-top:9rpx;border-radius:8rpx;background:#f1e8d4;overflow:hidden}
.next-fill{height:100%;border-radius:8rpx;background:linear-gradient(90deg,#e6b54c,#f3d070)}
.section{margin-top:28rpx}
.section-heading{display:flex;align-items:center;justify-content:space-between;margin:0 5rpx 14rpx}
.section-title-row{display:flex;align-items:center;gap:14rpx}
.section-icon{display:flex;align-items:center;justify-content:center;width:58rpx;height:58rpx;border-radius:17rpx;background:#fff;box-shadow:0 5rpx 14rpx rgba(38,66,90,.08);font-size:29rpx}
.section-title{display:block;font-size:30rpx;font-weight:900;color:#213f61}
.section-sub{display:block;margin-top:3rpx;font-size:20rpx;color:#929da7}
.section-count{padding:6rpx 14rpx;border-radius:17rpx;background:#e6f4f2;color:#0d8c81;font-size:20rpx;font-weight:800}
.medal-grid{display:flex;flex-wrap:wrap;gap:14rpx}
.medal-cell{box-sizing:border-box;width:calc((100% - 28rpx) / 3);display:flex;flex-direction:column;align-items:center;padding:22rpx 10rpx 18rpx;border-radius:22rpx;background:#fff;box-shadow:0 6rpx 18rpx rgba(38,66,90,.07)}
.medal{position:relative;display:flex;align-items:center;justify-content:center;width:106rpx;height:106rpx;border-radius:50%;background:#f1f3f5;font-size:46rpx}
.medal-shine{position:absolute;left:-8rpx;top:-8rpx;right:-8rpx;bottom:-8rpx;border-radius:50%;background:radial-gradient(circle,rgba(255,200,80,.3),rgba(255,200,80,0) 70%);pointer-events:none}
.medal-cell.progressing .medal{background:linear-gradient(145deg,#e3f5f2,#d2efe9);border:3rpx solid #2bb3a3;box-shadow:0 0 0 6rpx rgba(43,179,163,.12)}
.medal-cell.unlocked .medal{background:linear-gradient(145deg,#fff4bf,#ffe28a);border:3rpx solid #e0b13f;box-shadow:0 8rpx 22rpx rgba(224,177,63,.35)}
.medal-cell.locked .medal{filter:grayscale(1);opacity:.6}
.medal-name{display:block;margin-top:14rpx;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:23rpx;font-weight:800;color:#294866}
.medal-cell.locked .medal-name{color:#a8b0b8;letter-spacing:2rpx}
.medal-state{display:block;margin-top:6rpx;font-size:18rpx;color:#929ca5}
.medal-cell.unlocked .medal-state{color:#b07f16;font-weight:800}
.medal-cell.progressing .medal-state{color:#0d9488;font-weight:700}
.medal-track{width:96rpx;height:6rpx;margin-top:8rpx;border-radius:6rpx;background:#edf0f2;overflow:hidden}
.medal-track view{height:100%;border-radius:6rpx;background:#2bb3a3}
.legend-card{display:flex;align-items:center;gap:20rpx;padding:26rpx 24rpx;border-radius:24rpx;background:#fff;box-shadow:0 8rpx 24rpx rgba(38,66,90,.09)}
.legend-card.unlocked{background:linear-gradient(135deg,#fffdf2,#fff7e2);box-shadow:0 10rpx 30rpx rgba(224,177,63,.25)}
.legend-medal{display:flex;align-items:center;justify-content:center;width:96rpx;height:96rpx;border-radius:50%;background:#f1f3f5;font-size:44rpx;filter:grayscale(1);opacity:.6}
.legend-card.unlocked .legend-medal{filter:none;opacity:1;background:linear-gradient(145deg,#fff4bf,#ffe28a);box-shadow:0 8rpx 22rpx rgba(224,177,63,.35)}
.legend-info{flex:1;min-width:0}
.legend-name{display:block;font-size:30rpx;font-weight:900;color:#294866}
.legend-card.unlocked .legend-name{color:#9a691d}
.legend-desc{display:block;margin-top:5rpx;font-size:21rpx;color:#8e98a1}
.legend-line{display:flex;align-items:center;justify-content:space-between;margin-top:10rpx}
.legend-remain{font-size:21rpx;font-weight:800;color:#d18f2a}
.legend-percent{font-size:19rpx;color:#b07f16;font-weight:700}
.reward-note{margin-top:34rpx;text-align:center;font-size:20rpx;color:#a0a9b1}
.reward-bar{display:flex;align-items:center;flex-wrap:wrap;gap:12rpx;margin-top:20rpx;padding:20rpx 22rpx;border-radius:20rpx;background:linear-gradient(135deg,#f0fbf7,#e8f6f1);border:2rpx solid #cdeae1}.reward-title{font-size:23rpx;font-weight:900;color:#0d8c81}.reward-item{padding:7rpx 16rpx;border-radius:18rpx;background:#fff;color:#0d8c81;font-size:20rpx;font-weight:800}.reward-hint{margin-left:auto;font-size:18rpx;color:#8aa39b}
</style>
