<template>
	<view class="page">
		<view class="header">
			<text class="title">错题本</text>
			<text class="subtitle">按类型整理错题，针对薄弱项重新练习</text>
		</view>

		<view class="type-tabs">
			<view class="type-tab" :class="{ active: errorType === 'word' }" @click="errorType = 'word'">
				<text>单词错误</text><text class="count">{{ wordItems.length }}</text>
			</view>
			<view class="type-tab" :class="{ active: errorType === 'grammar' }" @click="errorType = 'grammar'">
				<text>语法错误</text><text class="count">{{ stageGrammarItems.length }}</text>
			</view>
		</view>

		<template v-if="errorType === 'word'">
			<scroll-view class="mode-scroll" scroll-x :show-scrollbar="false">
				<view class="mode-tabs">
					<view v-for="mode in wordModes" :key="mode.value" class="mode-tab" :class="{ active: wordMode === mode.value }" @click="wordMode = mode.value">{{ mode.label }} {{ modeCount(mode.value) }}</view>
				</view>
			</scroll-view>
			<view v-for="item in filteredWords" :key="item.word + '-' + item.wrong_mode" class="card">
				<view class="word-line"><text class="word">{{ item.word }}</text><text class="phonetic">{{ item.phonetic_us || item.phonetic_uk }}</text></view>
				<text class="meaning">{{ item.chinese || '暂无释义' }}</text>
				<view class="meta"><text class="tag">{{ modeLabel(item.wrong_mode) }}</text><text>错误{{ item.error_count || 1 }}次 · {{ item.last_error_date || '' }}</text></view>
				<view class="actions"><button class="practice" @click="practiceWord(item)">重新练习</button></view>
			</view>
			<view class="empty" v-if="!loading && !filteredWords.length"><text class="empty-icon">🎉</text><text>该类型暂无单词错题</text></view>
		</template>

		<template v-else>
			<scroll-view class="mode-scroll" scroll-x :show-scrollbar="false">
				<view class="mode-tabs">
					<view v-for="type in grammarTypes" :key="type.value" class="mode-tab" :class="{ active: grammarType === type.value }" @click="grammarType = type.value">{{ type.label }} {{ type.count }}</view>
				</view>
			</scroll-view>
			<view v-for="item in filteredGrammar" :key="item.key" class="card grammar-card">
				<text class="grammar-title">{{ item.grammarTitle || '语法练习' }}</text>
				<text class="sentence">{{ item.sentence }}</text>
				<view class="meta"><text class="tag grammar-tag">语法错误</text><text v-if="item.count > 1">记录{{ item.count }}次</text></view>
				<view class="actions"><button class="practice" @click="practiceGrammar(item)">重新练习</button></view>
			</view>
			<view class="empty" v-if="!filteredGrammar.length"><text class="empty-icon">🎉</text><text>暂无语法错题</text></view>
		</template>
	</view>
</template>
<script>
import { getWrongWords } from '@/utils/api.js';
export default {
	data(){return{
		errorType:'word',wordMode:'all',grammarType:'all',stageFilter:0,wordItems:[],grammarItems:[],loading:false,
		wordModes:[
			{value:'all',label:'全部'},{value:'listen',label:'听音'},{value:'read',label:'辨义'},
			{value:'write',label:'拼写'},{value:'speak',label:'发音'}
		]
	}},
	computed:{
		filteredWords(){return this.wordMode==='all'?this.wordItems:this.wordItems.filter(item=>item.wrong_mode===this.wordMode)},
		stageGrammarItems(){return this.stageFilter?this.grammarItems.filter(item=>Number(item.stage)===this.stageFilter):this.grammarItems},
		grammarTypes(){const counts=new Map();this.stageGrammarItems.forEach(item=>{const type=item.grammarTitle||'其他语法';counts.set(type,(counts.get(type)||0)+1)});return [{value:'all',label:'全部',count:this.stageGrammarItems.length},...[...counts.entries()].map(([value,count])=>({value,label:value,count}))]},
		filteredGrammar(){return this.grammarType==='all'?this.stageGrammarItems:this.stageGrammarItems.filter(item=>(item.grammarTitle||'其他语法')===this.grammarType)}
	},
	onLoad(query={}){this.errorType=query.type==='grammar'?'grammar':'word';this.stageFilter=Number(query.stage||0)},
	onShow(){this.loadData()},
	methods:{
		async loadData(){this.loadGrammar();this.loading=true;try{const result=await getWrongWords();this.wordItems=result?.words||[]}catch(error){console.error('加载单词错题失败:',error);this.wordItems=[]}finally{this.loading=false}},
		loadGrammar(){
			const previousTabs=this.grammarTypes.map(item=>item.value);
			const previousIndex=Math.max(0,previousTabs.indexOf(this.grammarType));
			const source=uni.getStorageSync('grammar_wrong')||[];
			const grouped=new Map();
			source.forEach((item,index)=>{
				const key=String(item.grammarId||item.grammarTitle||'grammar')+'-'+String(item.sentence||index);
				if(grouped.has(key))grouped.get(key).count++;
				else grouped.set(key,{...item,key,count:1});
			});
			this.grammarItems=[...grouped.values()];
			const available=new Set(['all',...this.grammarItems.filter(item=>!this.stageFilter||Number(item.stage)===this.stageFilter).map(item=>item.grammarTitle||'其他语法')]);
			if(!available.has(this.grammarType)){
				let fallback='all';
				for(let index=previousIndex-1;index>=0;index--){if(available.has(previousTabs[index])){fallback=previousTabs[index];break}}
				this.grammarType=fallback;
			}
		},
		modeCount(mode){return mode==='all'?this.wordItems.length:this.wordItems.filter(item=>item.wrong_mode===mode).length},
		modeLabel(mode){return({listen:'听音错误',read:'辨义错误',write:'拼写错误',speak:'发音错误'})[mode]||'单词错误'},
		practiceWord(item){uni.navigateTo({url:`/pages/mine/wrong-practice?mode=${encodeURIComponent(item.wrong_mode||'read')}&word=${encodeURIComponent(item.word)}&single=1`})},
		practiceGrammar(item){const stage=Number(item.stage||0);const grammarId=Number(item.grammarId||0);uni.navigateTo({url:`/pages/grammar/wrong?stage=${stage}&grammarId=${grammarId}&sentence=${encodeURIComponent(item.sentence||'')}&single=1`})}
	}
};
</script>
<style>
.page{min-height:100vh;background:#f7f5f0;padding:24rpx;box-sizing:border-box}.header{text-align:center;padding:22rpx 0 28rpx}.title{display:block;font-size:40rpx;font-weight:700;color:#1f3a5f}.subtitle{display:block;margin-top:10rpx;color:#8a8a8a;font-size:22rpx}.type-tabs{display:flex;background:#fff;padding:8rpx;border-radius:18rpx;margin-bottom:18rpx}.type-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:10rpx;padding:21rpx 10rpx;border-radius:13rpx;color:#555;font-size:29rpx}.type-tab.active{background:#1f3a5f;color:#fff}.count{min-width:34rpx;height:34rpx;line-height:34rpx;text-align:center;border-radius:18rpx;background:#eef2f7;color:#1f3a5f;font-size:21rpx}.type-tab.active .count{background:rgba(255,255,255,.2);color:#fff}.mode-scroll{white-space:nowrap;margin-bottom:18rpx}.mode-tabs{display:inline-flex;gap:12rpx;padding:2rpx}.mode-tab{padding:15rpx 24rpx;border-radius:28rpx;background:#fff;color:#666;font-size:24rpx}.mode-tab.active{background:#0d9488;color:#fff}.card{background:#fff;border-radius:18rpx;padding:27rpx;margin-bottom:18rpx;box-shadow:0 4rpx 14rpx rgba(31,58,95,.07)}.word-line{display:flex;align-items:baseline;gap:12rpx}.word{font-size:36rpx;font-weight:700;color:#1f3a5f}.phonetic{color:#888;font-size:24rpx}.meaning{display:block;margin:10rpx 0 15rpx;color:#444;font-size:27rpx}.meta{display:flex;justify-content:space-between;align-items:center;color:#888;font-size:22rpx}.tag{padding:5rpx 13rpx;border-radius:9rpx;background:#fff0f0;color:#dc4c4c}.grammar-tag{background:#fff7e8;color:#b66b00}.actions{display:flex;justify-content:flex-end;margin-top:16rpx}.practice{margin:0;padding:0 28rpx;height:60rpx;line-height:60rpx;border-radius:12rpx;background:#1f3a5f;color:#fff;font-size:25rpx}.grammar-title{display:block;font-size:28rpx;font-weight:700;color:#1f3a5f}.sentence{display:block;margin:16rpx 0;color:#333;font-size:28rpx}.empty{text-align:center;padding:150rpx 0;color:#888}.empty-icon{display:block;font-size:72rpx;margin-bottom:18rpx}
</style>