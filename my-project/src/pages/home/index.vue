<template>
	<view class="container">
		<view class="page-header"><text class="page-title">学习概览</text><text class="page-subtitle">每天完成一点，稳步提升英语能力</text></view>
		<!-- 内容直接渲染，数据异步填充，避免加载态卡住 -->
		<view class="stats-strip">
			<view class="stat"><text class="stat-value">{{ stats.streakDays }}<text>天</text></text><text class="stat-label">连续学习</text></view><view class="stat-line"></view>
			<view class="stat"><text class="stat-value">{{ stats.totalWordsLearned }}<text>个</text></text><text class="stat-label">已学单词</text></view><view class="stat-line"></view>
			<view class="stat"><text class="stat-value">{{ stats.totalGrammarMastered }}<text>项</text></text><text class="stat-label">语法掌握</text></view>
		</view>

		<view class="section task-section">
			<view class="section-heading"><view><text class="section-title">今日任务</text><text class="section-subtitle">按计划完成今天的学习内容</text></view><text class="plan-tag">每日计划</text></view>
			<view class="task-panel">
				<view class="task-row" @click="goToPage('/pages/phonetic/index?entry=daily')">
					<view class="task-icon phonetic">🔊</view><view class="task-info"><text class="task-title">发音训练</text><text class="task-desc">今日完成全部音标评测，80分达标</text><view class="task-track"><view :style="{width: phoneticPercent + '%'}"></view></view></view><view class="task-status" :class="{done: phoneticDone}">{{ phoneticDone ? '已完成' : todayPhoneticPracticed + '/' + dailyPhonetics }}</view><text class="row-arrow">›</text>
				</view>
				<view class="task-row" @click="goToPage('/pages/word/index?entry=daily')">
					<view class="task-icon">📚</view><view class="task-info"><text class="task-title">单词学习</text><text class="task-desc">今日目标 {{ dailyNewWords }} 词，完成四项练习</text><view class="task-track"><view :style="{width: todayWordPercent + '%'}"></view></view></view><view class="task-status" :class="{done: todayWordDone}">{{ todayWordDone ? '已完成' : todayWordMastered + '/' + dailyNewWords }}</view><text class="row-arrow">›</text>
				</view>
				<view class="task-row" @click="startDailyGrammar">
					<view class="task-icon grammar">📝</view><view class="task-info"><text class="task-title">语法精讲</text><text class="task-desc">学习1个知识点，完成{{ dailyGrammarQuestions }}题</text><view class="task-track"><view :style="{width: grammarTodayPercent + '%'}"></view></view></view><view class="task-status" :class="{done: grammarTodayDone}">{{ grammarTodayDone ? '已完成' : todayGrammarAnswered + '/' + dailyGrammarQuestions }}</view><text class="row-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="section adventure-section">
			<view class="section-heading"><view><text class="section-title">闯关游戏</text><text class="section-subtitle">按顺序解锁场景，边玩边学英语</text></view></view>
			<view class="adventure-card" @click="goAdventure">
				<view class="adventure-icon">🎮</view><view class="adventure-info"><text class="adventure-title">英语成长地图</text><text class="adventure-label">{{ !adventureLoaded ? '正在获取关卡进度' : (adventure.current ? '当前：' + adventure.current.world + ' · ' + adventure.current.title : (adventure.total > 0 && adventure.passedCount === adventure.total ? '全部关卡已完成，可重新挑战' : '从第一关开始冒险')) }}</text><view class="adventure-track"><view :style="{width: adventurePercent + '%'}"></view></view></view><view class="adventure-action"><text>{{ adventureLoaded ? adventurePassed + '/' + adventureTotal : '--/--' }}</text><text>开始闯关 ›</text></view>
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
	getWordStatus,
	getPhoneticProgress,
	request
} from '@/utils/api.js';
import { isFirstLoad } from '@/utils/first-load.js';

export default {
	data() {
		const firstLoad = isFirstLoad('pages/home/index')
		return {
			dailyGrammarQuestions: 10,
			dailyNewWords: 20,
			todayWordMastered: 0,
			dailyPhonetics: 48,
			todayPhoneticPracticed: 0,
			todayGrammarAnswered: 0,
			showReminder: false,
			reminderTitle: '该开始今天的学习了',
			reminderMessage: '完成一点点，也是在向目标靠近。',
			reminderItems: [],
			adventure: { passedCount: 0, total: 0, stars: 0, current: null },
			adventureLoaded: false,
			loading: firstLoad,
			firstLoad,
			hasLoaded: false,
			loadTimer: null,
			stats: {
				streakDays: 0,
				totalWordsLearned: 0,
				totalGrammarMastered: 0
			}
		}
	},
	onShow() {
		if (this.firstLoad) { this.loading = true; this.firstLoad = false }
		this.clearLoadTimer();
		if (this.loading) {
			this.loadTimer = setTimeout(() => { this.loading = false; this.hasLoaded = true; }, 3000);
		}
		this.loadAdventure();
		this.loadData();
		this.loadTodayTaskProgress();
	},
	onUnload() { this.clearLoadTimer(); },
	computed: {
		adventurePassed() { return Number(this.adventure?.passedLevels ?? this.adventure?.passedCount ?? 0); },
		adventureTotal() { return Number(this.adventure?.totalLevels ?? this.adventure?.total ?? 0); },
		adventurePercent() {
			if (!this.adventureTotal) return 0;
			return Math.max(0, Math.min(100, this.adventurePassed * 100 / this.adventureTotal));
		},
		todayWordPercent() {
			if (!this.dailyNewWords) return 0;
			return Math.max(0, Math.min(100, Math.round(this.todayWordMastered * 100 / this.dailyNewWords)));
		},
		todayWordDone() {
			return this.todayWordMastered >= this.dailyNewWords;
		},
		phoneticPercent() {
			if (!this.dailyPhonetics) return 0;
			return Math.max(0, Math.min(100, Math.round(this.todayPhoneticPracticed * 100 / this.dailyPhonetics)));
		},
		phoneticDone() {
			return this.todayPhoneticPracticed >= this.dailyPhonetics;
		},
		grammarTodayPercent() {
			if (!this.dailyGrammarQuestions) return 0;
			return Math.max(0, Math.min(100, Math.round(this.todayGrammarAnswered * 100 / this.dailyGrammarQuestions)));
		},
		grammarTodayDone() {
			return this.todayGrammarAnswered >= this.dailyGrammarQuestions;
		},
		todayTasksDone() {
			return this.phoneticDone && this.todayWordDone && this.grammarTodayDone;
		}
	},
	methods: {
		async loadAdventure() {
			try {
				const result = await request('/adventure-course/modules');
				this.adventure = result || { passedCount: 0, total: 0, passedLevels: 0, totalLevels: 0, stars: 0, current: null };
			} catch (error) {
				console.error('加载成长地图进度失败:', error);
			} finally {
				this.adventureLoaded = true;
			}
		},
		goAdventure() { uni.navigateTo({ url: '/pages/adventure/index' }); },
		async loadData() {
			try {
				const [learningStats, streak, settings] = await Promise.all([
					getLearningStats().catch(() => null),
					getStreakData().catch(() => null),
					getSettings().catch(() => null)
				]);
				const cachedStats = uni.getStorageSync('learningStats') || {};
				const cachedStreak = uni.getStorageSync('streakData') || {};
				const settingsValue = settings || uni.getStorageSync('learningSettings') || {};
				this.dailyGrammarQuestions = Math.max(5, Math.min(30, Number(settingsValue?.daily_grammar_questions ?? settingsValue?.dailyGrammarQuestions ?? 10)));
				this.dailyNewWords = Math.max(5, Number(settingsValue?.daily_new_words ?? settingsValue?.dailyNewWords ?? 20)); 
				this.loadTodayWordProgress();

				this.stats = {
					streakDays: Number(streak?.current_streak ?? cachedStreak.currentStreak ?? 0),
					totalWordsLearned: Number(learningStats?.total_words_learned ?? cachedStats.totalWordsLearned ?? 0),
					totalGrammarMastered: Number(learningStats?.total_grammar_mastered ?? cachedStats.totalGrammarMastered ?? 0)
				};
				if (learningStats) {
					uni.setStorageSync('learningStats', {
						totalWordsLearned: Number(learningStats.total_words_learned || 0),
						totalGrammarMastered: Number(learningStats.total_grammar_mastered || 0),
						totalPhoneticMastered: Number(learningStats.total_phonetic_mastered || 0),
						totalStudyMinutes: Number(learningStats.total_study_minutes || 0),
						streakDays: Number(learningStats.streak_days || 0),
						lastStudyDate: learningStats.last_study_date || null,
						accuracy: learningStats.accuracy || 0,
						totalPracticeCount: Number(learningStats.total_practice_count || 0),
						correctCount: Number(learningStats.correct_count || 0)
					});
				}
				if (streak) {
					uni.setStorageSync('streakData', {
						currentStreak: Number(streak.current_streak || 0),
						maxStreak: Number(streak.max_streak || 0),
						lastStudyDate: streak.last_study_date || null,
						studyDates: streak.study_dates || []
					});
				}
				this.checkHomeReminder(settingsValue);
			} catch (error) {
				console.error('加载数据失败:', error);
				this.loadLocalData();
			} finally {
				this.clearLoadTimer();
				this.loading = false;
				this.hasLoaded = true;
			}
		},
		clearLoadTimer() {
			if (this.loadTimer) { clearTimeout(this.loadTimer); this.loadTimer = null; }
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
			console.log('已稍后提醒，30分钟内不再弹出');
		},
		startFromReminder() {
			uni.setStorageSync(`homeReminderDone:${this.dateKey()}`, true);
			this.showReminder = false;
			if (this.todayTasksDone) {
				uni.switchTab({ url: '/pages/learn/index' });
			}
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
		async loadTodayWordProgress() {
			try {
				const cached = uni.getStorageSync('homeTodayWordMastered');
				const cachedTs = Number(uni.getStorageSync('homeTodayWordTs') || 0);
				if (Number.isFinite(cached) && Date.now() - cachedTs < 60 * 1000) {
					this.todayWordMastered = cached;
					return;
				}
				const wordStatus = await getWordStatus();
				const today = this.dateKey();
				let todayWord = 0;
				for (const key in (wordStatus || {})) {
					const st = wordStatus[key];
					if (!st?.mastered) continue;
					const d = String(st.last_review_date || st.updated_at || '').slice(0, 10);
					if (d === today) todayWord++;
				}
				this.todayWordMastered = todayWord;
				uni.setStorageSync('homeTodayWordMastered', todayWord);
				uni.setStorageSync('homeTodayWordTs', Date.now());
			} catch (error) {
				console.error('加载今日单词进度失败:', error);
			}
		},
		async loadTodayTaskProgress() {
			try {
				const progress = await getPhoneticProgress().catch(() => null);
				const items = Object.values(progress || {});
				const today = this.dateKey();
				this.todayPhoneticPracticed = items.filter(item => String(item?.last_practice_date || '').slice(0, 10) === today && Number(item?.last_score || 0) >= 80).length;
			} catch (error) {
				console.error('加载发音进度失败:', error);
			}
			try {
				const record = uni.getStorageSync('grammarTodayAnswered') || {};
				this.todayGrammarAnswered = record.date === this.dateKey() ? Number(record.count || 0) : 0;
			} catch (error) {
				console.error('加载今日语法进度失败:', error);
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
.reminder-overlay{position:fixed;z-index:9999;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:42rpx;background:rgba(19,38,58,.62);backdrop-filter:blur(5rpx)}.reminder-modal{box-sizing:border-box;width:100%;padding:38rpx 32rpx 30rpx;border-radius:30rpx;background:linear-gradient(160deg,#fff 0%,#f3fbf9 100%);box-shadow:0 28rpx 75rpx rgba(11,33,51,.28);text-align:center}.reminder-icon{display:flex;align-items:center;justify-content:center;width:96rpx;height:96rpx;margin:0 auto 18rpx;border-radius:28rpx;background:#dff4f0;font-size:49rpx}.reminder-kicker{display:block;font-size:20rpx;font-weight:800;letter-spacing:2rpx;color:#15998d}.reminder-title{display:block;margin-top:8rpx;font-size:37rpx;font-weight:900;color:#213f61}.reminder-desc{display:block;margin-top:12rpx;font-size:24rpx;line-height:1.6;color:#748490}.reminder-list{margin-top:23rpx;padding:18rpx 22rpx;border-radius:19rpx;background:#fff;text-align:left}.reminder-item{display:flex;align-items:center;gap:12rpx;padding:8rpx 0;font-size:24rpx;color:#4e6375}.reminder-dot{color:#12a294;font-weight:900}.reminder-actions{display:flex;gap:16rpx;margin-top:28rpx}.reminder-actions button{flex:1;height:78rpx;line-height:78rpx;margin:0;border:0;border-radius:40rpx;font-size:26rpx;font-weight:800}.reminder-actions button:after{border:0}.reminder-later{background:#e9eff2;color:#617381}.reminder-start{background:#1F3A5F;color:#fff}.adventure-card{display:flex;align-items:center;padding:22rpx 21rpx;border:2rpx solid #dcebe8;border-radius:23rpx;background:#fff;box-shadow:0 8rpx 23rpx rgba(35,63,87,.08)}.adventure-card:active{background:#f6faf9}.adventure-icon{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:72rpx;height:72rpx;border-radius:20rpx;background:linear-gradient(135deg,#dff4ef,#eaf2ff);font-size:36rpx}.adventure-info{flex:1;min-width:0;margin-left:17rpx}.adventure-title{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:28rpx;font-weight:900;color:#294866}.adventure-label{display:block;margin-top:5rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:21rpx;color:#8b99a2}.adventure-track{height:6rpx;margin-top:12rpx;border-radius:7rpx;background:#e8efef;overflow:hidden}.adventure-track view{height:100%;border-radius:7rpx;background:#13a094}.adventure-action{flex-shrink:0;margin-left:18rpx;text-align:right}.adventure-action text:first-child{display:block;font-size:19rpx;font-weight:800;color:#13a094}.adventure-action text:last-child{display:block;margin-top:9rpx;font-size:22rpx;font-weight:800;color:#294866}.task-track{height:7rpx;margin-top:11rpx;border-radius:7rpx;background:#e8efef;overflow:hidden}.task-track view{height:100%;border-radius:7rpx;background:#13a094}.task-status{flex-shrink:0;margin-left:14rpx;padding:8rpx 16rpx;border-radius:20rpx;background:#f0f3f5;color:#7d8d9b;font-size:20rpx;font-weight:800}.task-status.done{background:#e0f5ec;color:#0d9488}

</style>