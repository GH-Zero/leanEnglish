<template>
	<view class="container">
		<view class="page-header"><text class="page-title">学习概览</text><text class="page-subtitle">每天完成一点，稳步提升英语能力</text></view>
		<view class="stats-strip">
			<view class="stat"><text class="stat-value">{{ stats.streakDays }}<text>天</text></text><text class="stat-label">连续学习</text></view><view class="stat-line"></view>
			<view class="stat"><text class="stat-value">{{ stats.totalWordsLearned }}<text>个</text></text><text class="stat-label">已学单词</text></view><view class="stat-line"></view>
			<view class="stat"><text class="stat-value">{{ stats.totalGrammarMastered }}<text>项</text></text><text class="stat-label">语法掌握</text></view>
		</view>

		<view class="section task-section">
			<view class="section-heading"><view><text class="section-title">今日任务</text><text class="section-subtitle">按计划完成今天的学习内容</text></view><text class="plan-tag">每日计划</text></view>
			<view class="task-panel">
				<view class="task-row" @click="goToPage('/pages/phonetic/index?entry=daily')">
					<view class="task-icon phonetic">🔊</view><view class="task-info"><text class="task-title">发音训练</text><text class="task-desc">继续练习未掌握的音标</text></view><text class="row-arrow">›</text>
				</view>
				<view class="task-row" @click="goToPage('/pages/word/index?entry=daily')">
					<view class="task-icon">📚</view><view class="task-info"><text class="task-title">单词学习</text><text class="task-desc">今日目标 {{ dailyNewWords }} 词，完成四项练习</text></view><text class="row-arrow">›</text>
				</view>
				<view class="task-row" @click="startDailyGrammar">
					<view class="task-icon grammar">📝</view><view class="task-info"><text class="task-title">语法精讲</text><text class="task-desc">学习1个知识点，完成{{ dailyGrammarQuestions }}题</text></view><text class="row-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="section challenge-section">
			<view class="section-heading"><view><text class="section-title">专项挑战</text><text class="section-subtitle">完成任务后，用闯关检验成果</text></view></view>
			<view class="challenge-list">
				<view class="challenge-row" @click="goToChallenge('word')"><view class="challenge-icon word">🏆</view><view class="challenge-info"><text class="challenge-title">单词闯关</text><text class="challenge-desc">10个单词快速检验</text></view><text class="challenge-go">去挑战 ›</text></view>
				<view class="challenge-row" @click="goToChallenge('speak')"><view class="challenge-icon speak">🎤</view><view class="challenge-info"><text class="challenge-title">口语挑战</text><text class="challenge-desc">听音辨词与发音训练</text></view><text class="challenge-go">去挑战 ›</text></view>
				<view class="challenge-row" @click="goToChallenge('grammar')"><view class="challenge-icon grammar">✍️</view><view class="challenge-info"><text class="challenge-title">语法闯关</text><text class="challenge-desc">随机语法题巩固练习</text></view><text class="challenge-go">去挑战 ›</text></view>
			</view>
		</view>

		<view v-if="showReminder" class="reminder-overlay" @touchmove.stop.prevent>
			<view class="reminder-modal">
				<view class="reminder-icon">⏰</view>
				<text class="reminder-kicker">今日学习提醒</text>
				<text class="reminder-title">{{ reminderTitle }}</text>
				<text class="reminder-desc">{{ reminderMessage }}</text>
				<view v-if="reminderItems.length" class="reminder-list">
					<view v-for="item in reminderItems" :key="item" class="reminder-item"><text class="reminder-dot">✓</text><text>{{ item }}</text></view>
				</view>
				<view class="reminder-actions">
					<button class="reminder-later" @click="snoozeReminder">稍后提醒</button>
					<button class="reminder-start" @click="startFromReminder">去学习</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import {
	getLearningStats,
	getStreakData,
	getGrammarProgress,
	getSettings,
	request
} from '@/utils/api.js';

export default {
	data() {
		return {
			dailyGrammarQuestions: 10,
			dailyNewWords: 20,
			showReminder: false,
			reminderTitle: '该开始今天的学习了',
			reminderMessage: '完成一点点，也是在向目标靠近。',
			reminderItems: [],
			stats: {
				streakDays: 0,
				totalWordsLearned: 0,
				totalGrammarMastered: 0
			}
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				const [learningStats, streak, settings] = await Promise.all([
					getLearningStats(),
					getStreakData(),
					getSettings()
				]);
				this.dailyGrammarQuestions = Math.max(5, Math.min(30, Number(settings?.daily_grammar_questions || 10)));
				this.dailyNewWords = Math.max(5, Number(settings?.daily_new_words || 20)); 

				this.stats = {
					streakDays: streak ? streak.current_streak : 0,
					totalWordsLearned: learningStats ? learningStats.total_words_learned : 0,
					totalGrammarMastered: learningStats ? learningStats.total_grammar_mastered : 0
				};
				this.checkHomeReminder(settings);
			} catch (error) {
				console.error('加载数据失败:', error);
				this.loadLocalData();
			}
		},
		dateKey(date = new Date()) {
			const pad = value => String(value).padStart(2, '0');
			return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
		},
		checkHomeReminder(settings = {}) {
			if (!Boolean(Number(settings.daily_reminder ?? 1)) || this.showReminder) return;
			const now = new Date();
			const currentMinutes = now.getHours() * 60 + now.getMinutes();
			const time = /^\d{2}:\d{2}$/.test(settings.reminder_time || '') ? settings.reminder_time : '08:00';
			const [hour, minute] = time.split(':').map(Number);
			if (currentMinutes < hour * 60 + minute) return;
			const day = this.dateKey(now);
			if (uni.getStorageSync(`homeReminderDone:${day}`)) return;
			const snoozeUntil = Number(uni.getStorageSync(`homeReminderSnooze:${day}`) || 0);
			if (snoozeUntil > Date.now()) return;
			const styles = [
				['该开始今天的学习了', '按计划完成今天的任务，让进步持续发生。'],
				['给自己留一点学习时间', '不用一次完成很多，先开始就是最好的进步。'],
				['今天也一起进步吧', '坚持完成今日计划，距离目标又近一步。']
			];
			const contentIndex = Math.max(0, Math.min(2, Number(settings.reminder_content || 0)));
			[this.reminderTitle, this.reminderMessage] = styles[contentIndex];
			const items = [];
			if (Boolean(Number(settings.word_reminder ?? 1))) items.push(`完成今日 ${this.dailyNewWords} 个单词`);
			if (Boolean(Number(settings.progress_reminder ?? 1))) items.push('查看并完成今日学习进度');
			if (Boolean(Number(settings.achievement_reminder ?? 1))) items.push('继续积累进度，解锁新成就');
			this.reminderItems = items;
			this.showReminder = true;
		},
		snoozeReminder() {
			const day = this.dateKey();
			uni.setStorageSync(`homeReminderSnooze:${day}`, Date.now() + 30 * 60 * 1000);
			this.showReminder = false;
			uni.showToast({ title: '30分钟后再提醒', icon: 'none' });
		},
		startFromReminder() {
			uni.setStorageSync(`homeReminderDone:${this.dateKey()}`, true);
			this.showReminder = false;
			uni.switchTab({ url: '/pages/learn/index' });
		},		loadLocalData() {
			try {
				const stats = uni.getStorageSync('learningStats') || {};
				const streak = uni.getStorageSync('streakData') || {};
				this.stats = {
					streakDays: streak.currentStreak || 0,
					totalWordsLearned: stats.totalWordsLearned || 0,
					totalGrammarMastered: stats.totalGrammarMastered || 0
				};
			} catch (e) {
				console.error('读取本地数据失败:', e);
			}
		},
		goToPage(url) {
			const tabBarPages = ['/pages/home/index', '/pages/learn/index', '/pages/speak/index', '/pages/mine/index'];
			if (tabBarPages.includes(url)) {
				uni.switchTab({ url: url });
			} else {
				uni.navigateTo({ url: url });
			}
		},
		async startDailyGrammar() {
			uni.showLoading({ title: '正在安排今日课程' });
			try {
				const [points, progress] = await Promise.all([request('/grammar-point/list'), getGrammarProgress()]);
				const ordered = Array.isArray(points) ? [...points].sort((a, b) => Number(a.stage || 0) - Number(b.stage || 0) || Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(a.id) - Number(b.id)) : [];
				const nextPoint = ordered.find(point => !progress?.[point.id]?.mastered);
				uni.hideLoading();
				if (nextPoint) uni.navigateTo({ url: '/pages/grammar/practice?id=' + nextPoint.id + '&entry=daily' });
				else { uni.showToast({ title: '全部语法已完成，可自由复习', icon: 'none' }); setTimeout(() => uni.navigateTo({ url: '/pages/grammar/index' }), 800); }
			} catch (error) {
				uni.hideLoading();
				uni.showToast({ title: '今日语法加载失败', icon: 'none' });
			}
	},
		goToChallenge(type) {
			uni.navigateTo({ url: `/pages/challenge/index?type=${type}` });
		}
	}
}
</script>

<style>
.container{box-sizing:border-box;min-height:100vh;padding:20rpx 22rpx 52rpx;background:linear-gradient(180deg,#eef5f6 0,#f7f5f0 390rpx)}.page-header{position:relative;padding:28rpx 25rpx 58rpx;border-radius:25rpx;background:#1F3A5F;overflow:hidden}.page-title{display:block;font-size:40rpx;line-height:1.25;font-weight:800;color:#fff}.page-subtitle{display:block;margin-top:8rpx;font-size:22rpx;color:rgba(255,255,255,.72)}.stats-strip{position:relative;display:flex;align-items:center;margin:-38rpx 13rpx 0;padding:20rpx 8rpx;border:1rpx solid rgba(255,255,255,.8);border-radius:19rpx;background:rgba(255,255,255,.96);box-shadow:0 9rpx 24rpx rgba(35,63,87,.10)}.stat{flex:1;min-width:0;text-align:center}.stat-value{display:block;white-space:nowrap;font-size:37rpx;line-height:1.2;font-weight:800;color:#1f4b70}.stat-value text{margin-left:3rpx;font-size:20rpx;font-weight:500;color:#7d8d9b}.stat-label{display:block;margin-top:6rpx;white-space:nowrap;font-size:22rpx;color:#84939f}.stat-line{width:1rpx;height:48rpx;background:#e5ecef}
.section{margin-top:31rpx}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:0 5rpx 15rpx}.section-title{display:block;font-size:32rpx;font-weight:800;color:#213f61}.section-subtitle{display:block;margin-top:5rpx;font-size:22rpx;color:#929da7}.plan-tag{padding:7rpx 14rpx;border-radius:20rpx;background:#def5f1;color:#0d8c81;font-size:19rpx;font-weight:700}.task-panel{overflow:hidden;border-radius:23rpx;background:#fff;box-shadow:0 8rpx 24rpx rgba(35,63,87,.08)}.task-row{display:flex;align-items:center;padding:23rpx 21rpx}.task-row+.task-row{border-top:1rpx solid #edf0f2}.task-icon{display:flex;align-items:center;justify-content:center;width:66rpx;height:66rpx;border-radius:18rpx;background:#d3efe9;font-size:31rpx}.task-icon.phonetic{background:#e8f4fc}.task-icon.grammar{background:#fff0e7}.task-info{flex:1;min-width:0;margin-left:17rpx}.task-title{display:block;font-size:28rpx;font-weight:800;color:#294866}.task-desc{display:block;margin-top:5rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:22rpx;color:#8d99a3}.row-arrow{font-size:32rpx;color:#9ba6af}
.challenge-list{overflow:hidden;border-radius:22rpx;background:#fff;box-shadow:0 7rpx 22rpx rgba(35,63,87,.07)}.challenge-row{display:flex;align-items:center;padding:20rpx 21rpx}.challenge-row+.challenge-row{border-top:1rpx solid #edf0f2}.challenge-icon{display:flex;align-items:center;justify-content:center;width:57rpx;height:57rpx;border-radius:16rpx;background:#fff3dd;font-size:27rpx}.challenge-icon.speak{background:#f2eafa}.challenge-icon.grammar{background:#e7f6f3}.challenge-info{flex:1;margin-left:17rpx}.challenge-title{display:block;font-size:28rpx;font-weight:800;color:#294866}.challenge-desc{display:block;margin-top:4rpx;font-size:22rpx;color:#98a1aa}.challenge-go{font-size:22rpx;font-weight:700;color:#547286}.task-row:active,.challenge-row:active{background-color:#f5f8f8;opacity:.92}
.reminder-overlay{position:fixed;z-index:9999;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:42rpx;background:rgba(19,38,58,.62);backdrop-filter:blur(5rpx)}.reminder-modal{box-sizing:border-box;width:100%;padding:38rpx 32rpx 30rpx;border-radius:30rpx;background:linear-gradient(160deg,#fff 0%,#f3fbf9 100%);box-shadow:0 28rpx 75rpx rgba(11,33,51,.28);text-align:center}.reminder-icon{display:flex;align-items:center;justify-content:center;width:96rpx;height:96rpx;margin:0 auto 18rpx;border-radius:28rpx;background:#dff4f0;font-size:49rpx}.reminder-kicker{display:block;font-size:20rpx;font-weight:800;letter-spacing:2rpx;color:#15998d}.reminder-title{display:block;margin-top:8rpx;font-size:37rpx;font-weight:900;color:#213f61}.reminder-desc{display:block;margin-top:12rpx;font-size:24rpx;line-height:1.6;color:#748490}.reminder-list{margin-top:23rpx;padding:18rpx 22rpx;border-radius:19rpx;background:#fff;text-align:left}.reminder-item{display:flex;align-items:center;gap:12rpx;padding:8rpx 0;font-size:24rpx;color:#4e6375}.reminder-dot{color:#12a294;font-weight:900}.reminder-actions{display:flex;gap:16rpx;margin-top:28rpx}.reminder-actions button{flex:1;height:78rpx;line-height:78rpx;margin:0;border:0;border-radius:40rpx;font-size:26rpx;font-weight:800}.reminder-actions button:after{border:0}.reminder-later{background:#e9eff2;color:#617381}.reminder-start{background:#1F3A5F;color:#fff}</style>