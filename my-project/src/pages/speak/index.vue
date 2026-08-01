<template>
	<view class="container">
		<AchievementUnlockNotifier />
		<view class="hero-card">
			<text class="hero-title">口语训练</text>
			<text class="hero-subtitle">每天开口一点，让表达越来越自然</text>
		</view>

<view class="section">
			<view class="section-heading"><view><text class="section-title">专项训练</text><text class="section-subtitle">根据薄弱项选择练习</text></view></view>
			<view class="training-grid">
				<view class="training-card" @click="goToPage('/pages/phonetic/index')"><view class="training-icon phonetic">🔊</view><text class="training-title">发音纠正</text><text class="training-desc">音标教学与发音评测</text><text class="training-link">去练习 ›</text></view>
				<view class="training-card" @click="openShadowPractice"><view class="training-icon fluency">🗣️</view><text class="training-title">流利跟读</text><text class="training-desc">逐句模仿并提升流利度</text><text class="training-link">去练习 ›</text></view>
				<view class="training-card dialogue-card" @click="goToPage('/pages/dialogue/index')"><view class="training-icon dialogue">💬</view><view class="dialogue-copy"><text class="training-title">场景口语</text><text class="training-desc">在真实场景中完成英文对话</text></view><text class="training-link">选择场景 ›</text></view>
			</view>
		</view>

		<view class="section performance-section">
			<view class="section-heading"><view><text class="section-title">练习表现</text><text class="section-subtitle">只展示真实完成的数据</text></view></view>
			<view class="performance-card"><view class="performance-item"><text class="performance-value">{{ totalSpeakPractice }}</text><text class="performance-label">累计练习</text></view><view class="performance-line"></view><view class="performance-item"><text class="performance-value">{{ todayCompleted }}</text><text class="performance-label">今日练习</text></view><view class="performance-line"></view><view class="performance-item"><text class="performance-value">{{ lastScore ? lastScore + '分' : '--' }}</text><text class="performance-label">最近评分</text></view></view>
		</view>
	</view>
</template>

<script>
import { getLearningStats, getStudyStatistics, getDialogueHistory, getPhoneticProgress } from '@/utils/api.js';
export default {
 data(){return{todayCompleted:0,lastScore:0,totalSpeakPractice:0}},
 onShow(){this.loadPerformance()},
 methods:{
  dateKey(){const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`},
  dateTime(value){if(!value)return 0;const parsed=new Date(value).getTime();return Number.isFinite(parsed)?parsed:0},
  async loadPerformance(){
   const saved=uni.getStorageSync('dailySpeakProgress')||{};
   try{
    const [learning,statistics,history,phonetics]=await Promise.all([
     getLearningStats().catch(()=>({})),getStudyStatistics().catch(()=>({})),getDialogueHistory().catch(()=>[]),getPhoneticProgress().catch(()=>({}))
    ]);
    this.totalSpeakPractice=Number(learning?.total_speak_practice??learning?.totalSpeakPractice??statistics?.speakPractice??0);
    this.todayCompleted=Number(statistics?.todayRecord?.speak_practiced||0);
    const candidates=[];
    if(saved.lastScore){const time=Number(saved.updatedAt||0)||(saved.date?this.dateTime(saved.date+'T00:00:00'):0);candidates.push({score:Number(saved.lastScore),time})}
    const latestDialogue=(history||[])[0];
    if(latestDialogue?.average_score)candidates.push({score:Number(latestDialogue.average_score),time:this.dateTime(latestDialogue.created_at)});
    Object.values(phonetics||{}).forEach(item=>{if(item?.best_score)candidates.push({score:Number(item.best_score),time:this.dateTime((item.last_practice_date||'')+'T00:00:00')})});
    candidates.sort((a,b)=>b.time-a.time);
    this.lastScore=candidates.length?Math.round(candidates[0].score):0;
   }catch(_){
    this.todayCompleted=saved.date===this.dateKey()?Number(saved.count||0):0;
    this.lastScore=Number(saved.lastScore||0);
   }
  },
  openShadowPractice(){uni.navigateTo({url:'/pages/speak/shadow'})},
  goToPage(url){uni.navigateTo({url})}
 }
};
</script>

<style>
.container{box-sizing:border-box;min-height:100vh;padding:22rpx 22rpx 55rpx;background:linear-gradient(180deg,#f0f5f7 0,#f7f5f0 420rpx)}
.hero-card{padding:31rpx 28rpx;border-radius:27rpx;background:#1F3A5F;box-shadow:0 13rpx 30rpx rgba(31,58,95,.18);color:#fff}.hero-title{display:block;margin-top:0;font-size:40rpx;font-weight:800}.hero-subtitle{display:block;margin-top:6rpx;font-size:22rpx;color:rgba(255,255,255,.7)}
.section{margin-top:30rpx}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:0 5rpx 14rpx}.section-title{display:block;font-size:32rpx;font-weight:800;color:#213f61}.section-subtitle{display:block;margin-top:5rpx;font-size:22rpx;color:#929da7}.section-count{padding:7rpx 14rpx;border-radius:18rpx;background:#e3f4f1;color:#0d8f83;font-size:21rpx;font-weight:800}

.training-grid{display:grid;grid-template-columns:1fr 1fr;gap:10rpx}.training-card{position:relative;box-sizing:border-box;padding:18rpx;border-radius:22rpx;background:#fff;box-shadow:0 7rpx 21rpx rgba(35,63,87,.07)}.training-icon{display:flex;align-items:center;justify-content:center;width:61rpx;height:61rpx;border-radius:17rpx;font-size:29rpx}.training-icon.phonetic{background:#e7f4fc}.training-icon.fluency{background:#f1eafa}.training-icon.dialogue{background:#e5f5f2}.training-title{display:block;margin-top:10rpx;font-size:28rpx;font-weight:800;color:#294866}.training-desc{display:block;margin-top:4rpx;min-height:0;font-size:22rpx;line-height:1.45;color:#919ba4}.training-link{position:absolute;top:49rpx;right:18rpx;transform:translateY(-50%);margin:0;font-size:22rpx;font-weight:700;color:#0d9488}.dialogue-card{grid-column:1/3;display:flex;align-items:center;min-height:112rpx;padding-top:22rpx;padding-bottom:22rpx}.dialogue-card .training-icon{flex-shrink:0}.dialogue-copy{flex:1;margin-left:17rpx}.dialogue-copy .training-title{margin-top:0}.dialogue-copy .training-desc{min-height:0}.dialogue-card .training-link{position:static;transform:none;margin:0 0 0 12rpx}
.performance-card{display:flex;align-items:center;padding:24rpx 10rpx;border-radius:22rpx;background:#fff;box-shadow:0 7rpx 21rpx rgba(35,63,87,.07)}.performance-item{flex:1;text-align:center}.performance-value{display:block;font-size:31rpx;font-weight:800;color:#254b70}.performance-label{display:block;margin-top:5rpx;font-size:20rpx;color:#929da7}.performance-line{width:1rpx;height:45rpx;background:#e8ecef}
</style>