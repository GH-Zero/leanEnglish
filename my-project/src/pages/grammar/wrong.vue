<template>
	<view class="page">
		<view class="header"><text class="title">语法错题</text><text class="sub">答对后自动移除当前错题，答错可重新作答</text></view>
		<view v-for="(item,index) in items" :key="itemKey(item,index)" class="card">
			<text class="grammar">{{ item.grammarTitle || '语法练习' }}</text>
			<text class="sentence">{{ item.sentence }}</text>
			<view v-for="option in item.options" :key="option" class="option" :class="{ correct: item.checked && option === item.answer, wrong: item.checked && item.selected === option && option !== item.answer }" @click="answer(item,option)">{{ option }}</view>
			<view class="result" v-if="item.checked">
				<text :class="item.correct ? 'good' : 'bad'">{{ item.correct ? '回答正确，正在自动移除当前错题。' : '回答错误，请根据解析再试一次。' }}</text>
				<text class="explain" v-if="item.explanation">{{ item.explanation }}</text>
				<button v-if="!item.correct" class="retry" @click="retry(item)">重新作答</button>
			</view>
		</view>
		<animated-empty v-if="!items.length" icon="🎉" text="本阶段暂无语法错题"></animated-empty>
	</view>
</template>
<script>
import { playAnswerFeedback } from '@/utils/answer-feedback.js';
export default{
	data(){return{items:[],stage:0,grammarId:0,startSentence:'',singlePractice:false}},
	onLoad(query){this.stage=Number(query.stage||0);this.grammarId=Number(query.grammarId||0);this.startSentence=decodeURIComponent(query.sentence||'');this.singlePractice=String(query.single||'')==='1'},
	onShow(){this.load()},
	methods:{
		load(){const all=uni.getStorageSync('grammar_wrong')||[];let list=all.filter(item=>(!this.stage||Number(item.stage)===this.stage)&&(!this.grammarId||Number(item.grammarId)===this.grammarId));if(this.startSentence){if(this.singlePractice)list=list.filter(item=>item.sentence===this.startSentence).slice(0,1);else{const index=list.findIndex(item=>item.sentence===this.startSentence);if(index>0)list.unshift(list.splice(index,1)[0])}}this.items=list.map(item=>({...item,checked:false,correct:false,selected:''}))},
		itemKey(item,index){return String(item.grammarId||item.grammarTitle||'grammar')+'-'+String(item.sentence||index)},
		answer(item,option){if(item.checked)return;item.selected=option;item.checked=true;item.correct=option===item.answer;playAnswerFeedback(item.correct);if(item.correct)setTimeout(()=>this.completeQuestion(item),350)},
		completeQuestion(item){const all=uni.getStorageSync('grammar_wrong')||[];const remain=all.filter(record=>!(String(record.sentence||'')===String(item.sentence||'')&&(!item.grammarId||Number(record.grammarId)===Number(item.grammarId))));uni.setStorageSync('grammar_wrong',remain);uni.showToast({title:'回答正确，已移除当前错题',icon:'success'});if(this.singlePractice)setTimeout(()=>uni.navigateBack(),250);else this.load()},
		retry(item){item.checked=false;item.correct=false;item.selected=''}
	}
}
</script>
<style>
.page{min-height:100vh;background:#f7f5f0;padding:28rpx;box-sizing:border-box}.header{text-align:center;padding:20rpx 0 30rpx}.title{display:block;font-size:40rpx;font-weight:700;color:#1f3a5f}.sub{display:block;margin-top:10rpx;color:#888;font-size:25rpx}.card{background:#fff;border-radius:18rpx;padding:28rpx;margin-bottom:20rpx;box-shadow:0 4rpx 14rpx rgba(31,58,95,.07)}.grammar{display:block;color:#1f3a5f;font-weight:700;font-size:30rpx}.sentence{display:block;color:#333;margin:20rpx 0;font-size:29rpx}.option{padding:19rpx;border:2rpx solid #e5e7eb;border-radius:12rpx;margin-top:12rpx;color:#333}.option.correct{background:#f0fdf4;border-color:#16a34a}.option.wrong{background:#fef2f2;border-color:#dc2626}.result{margin-top:20rpx;padding-top:18rpx;border-top:1rpx solid #eee}.good{color:#15803d}.bad{color:#b91c1c}.explain{display:block;color:#777;font-size:25rpx;margin-top:10rpx}.retry{margin-top:20rpx;border-radius:12rpx;font-size:27rpx}.retry{background:#eef2f7;color:#1f3a5f}.empty{text-align:center;padding-top:180rpx;color:#777}.empty-icon{display:block;font-size:80rpx;margin-bottom:18rpx}
</style>
