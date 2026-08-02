<template>
	<view class="page">
		<view class="header"><text class="title">单词词典</text><text class="subtitle">支持英文、中文释义搜索</text></view>
		<view class="search-box">
			<text class="search-icon">⌕</text>
			<input class="search-input" v-model="keyword" placeholder="输入英文单词或中文释义" confirm-type="search" @input="scheduleSearch" @confirm="search" />
			<text class="clear" v-if="keyword" @click="clearSearch">×</text>
		</view>
		<view class="summary" v-if="hasSearched && !loading">找到 {{ total }} 个结果</view>
		<scroll-view class="results-scroll" scroll-y :show-scrollbar="false">
			<view v-for="item in words" :key="item.id" class="word-card">
			<view class="word-head">
				<view><text class="word tappable" @click="play(item.word,1,'word-'+item.id)">{{ item.word }} {{ playingKey === 'word-'+item.id ? '🔊' : '' }}</text><text class="level">{{ levelLabel(item.level) }}</text></view>
				<view class="audio-actions"><text class="audio" @click="play(item.word,1,'us-'+item.id)">{{ playingKey === 'us-'+item.id ? '播放中' : 'US' }}</text><text class="audio" @click="play(item.word,2,'uk-'+item.id)">{{ playingKey === 'uk-'+item.id ? '播放中' : 'GB' }}</text></view>
			</view>
			<view class="phonetics"><text v-if="item.phonetic_us">美 /{{ trimSlash(item.phonetic_us) }}/</text><text v-if="item.phonetic_uk">英 /{{ trimSlash(item.phonetic_uk) }}/</text></view>
			<text class="meaning">{{ item.chinese || '暂无中文释义' }}</text>
			<view class="example" v-if="item.example"><view class="example-head"><text class="example-label">例句</text><text class="example-play" @click="play(item.example,2,'example-'+item.id)">{{ playingKey === 'example-'+item.id ? '正在朗读…' : '🔊 朗读例句' }}</text></view><text class="tappable" @click="play(item.example,2,'example-'+item.id)">{{ item.example }}</text></view>
			<view class="tags"><text v-if="item.category">{{ item.category }}</text><text v-if="item.tag">{{ item.tag }}</text></view>
		</view>
		<view class="state" v-if="loading">正在查询词典...</view>
		<view class="state" v-else-if="hasSearched && !words.length"><text class="state-icon">🔍</text><text>没有找到相关单词</text><text class="state-hint">试试英文原形或更简短的中文关键词</text></view>
		<button class="more" v-if="!loading && words.length < total" @click="loadMore">加载更多</button>
		<view class="scroll-bottom"></view>
		</scroll-view>
	</view>
</template>
<script>
import { BASE_URL } from '@/utils/api.js';
import { playTts, clearTtsQueue } from '@/utils/tts-player.js';
export default {
	data(){return{keyword:'',words:[],total:0,page:1,pageSize:20,loading:false,hasSearched:false,timer:null,requestId:0,audio:null,playingKey:''}},
	onLoad(){this.search()},
	onUnload(){clearTtsQueue();if(this.timer)clearTimeout(this.timer);if(this.audio){this.audio.stop();this.audio.destroy()}},
	methods:{
		scheduleSearch(){if(this.timer)clearTimeout(this.timer);if(!this.keyword.trim())return this.resetSearch();this.timer=setTimeout(()=>this.search(),350)},
		clearSearch(){this.keyword='';this.resetSearch()},
		resetSearch(){if(this.timer)clearTimeout(this.timer);this.requestId++;this.words=[];this.total=0;this.page=1;this.loading=false;this.hasSearched=false},
		async search(){if(!this.keyword.trim())return this.resetSearch();this.page=1;this.words=[];this.hasSearched=true;await this.fetchWords(false)},
		async loadMore(){this.page++;await this.fetchWords(true)},
		fetchWords(append){
			const requestId=++this.requestId;this.loading=true;
			return new Promise(resolve=>uni.request({
				url:BASE_URL+'/words/list',
				data:{keyword:this.keyword.trim(),page:this.page,pageSize:this.pageSize},
				success:response=>{
					if(requestId!==this.requestId)return resolve();
					if(response.statusCode===200&&response.data.code===0){const data=response.data.data||{};this.words=append?[...this.words,...(data.list||[])]:data.list||[];this.total=Number(data.total||0)}
					else uni.showToast({title:'词典查询失败',icon:'none'});
					resolve();
				},
				fail:error=>{if(requestId===this.requestId){console.error('词典查询失败:',error);uni.showToast({title:'无法连接词典服务',icon:'none'})}resolve()},
				complete:()=>{if(requestId===this.requestId)this.loading=false}
			}));
		},
		trimSlash(value){return String(value||'').replace(/^\/+|\/+$/g,'')},
		levelLabel(level){return ['入门','初级','中级','高级'][Number(level)]||'通用'},
		play(text,type,key){
			const value=String(text||'').trim();if(!value)return;
			const currentKey=key||value;this.playingKey=currentKey;
			playTts(value,3).catch(error=>{console.error('词典发音失败:',error);uni.showToast({title:error?.message||'语音播放失败',icon:'none'})}).finally(()=>{if(this.playingKey===currentKey)this.playingKey=''})
		}
	}
};
</script>
<style>
.page{height:100vh;display:flex;flex-direction:column;overflow:hidden;background:#f7f5f0;padding:24rpx;box-sizing:border-box}.header{flex-shrink:0;text-align:center;padding:25rpx 0}.title{display:block;font-size:40rpx;font-weight:700;color:#1f3a5f}.subtitle{display:block;color:#888;font-size:22rpx;margin-top:8rpx}.search-box{flex-shrink:0;display:flex;align-items:center;background:#fff;border-radius:18rpx;padding:0 24rpx;box-shadow:0 4rpx 14rpx rgba(31,58,95,.08)}.search-icon{font-size:36rpx;color:#888;margin-right:12rpx}.search-input{flex:1;height:90rpx;font-size:28rpx}.clear{font-size:38rpx;color:#999;padding:10rpx}.summary{flex-shrink:0;font-size:24rpx;color:#888;margin:24rpx 6rpx 14rpx}.results-scroll{flex:1;height:0;min-height:0;box-sizing:border-box}.scroll-bottom{height:calc(30rpx + env(safe-area-inset-bottom))}.word-card{background:#fff;border-radius:18rpx;padding:28rpx;margin-bottom:18rpx;box-shadow:0 4rpx 14rpx rgba(31,58,95,.07)}.word-head{display:flex;justify-content:space-between;align-items:center}.word{font-size:38rpx;font-weight:700;color:#1f3a5f}.tappable{cursor:pointer}.level{font-size:20rpx;color:#0d9488;background:#edf9f7;border-radius:8rpx;padding:5rpx 10rpx;margin-left:12rpx}.audio-actions{display:flex;gap:12rpx}.audio{background:#eef5fb;border-radius:12rpx;padding:12rpx 16rpx;font-size:27rpx}.phonetics{display:flex;gap:22rpx;margin:12rpx 0;color:#888;font-size:23rpx}.meaning{display:block;color:#333;font-size:28rpx;line-height:1.6}.example{margin-top:18rpx;padding:17rpx;background:#f7fafc;border-radius:12rpx;color:#56616e;font-size:25rpx;line-height:1.5}.example-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8rpx}.example-label{display:block;color:#0d9488;font-weight:700}.example-play{color:#1f3a5f;font-size:22rpx;background:#e8eef6;padding:7rpx 12rpx;border-radius:10rpx}.tags{display:flex;gap:10rpx;margin-top:16rpx}.tags text{font-size:20rpx;color:#777;background:#f2f2f2;border-radius:8rpx;padding:5rpx 10rpx}.state{text-align:center;padding:150rpx 20rpx;color:#888}.state text{display:block}.state-icon{font-size:70rpx;margin-bottom:18rpx}.state-hint{font-size:22rpx;margin-top:10rpx}.more{margin:25rpx 0;border-radius:14rpx;background:#fff;color:#1f3a5f}
</style>