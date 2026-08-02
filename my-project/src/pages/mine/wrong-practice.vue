<template>
	<view class="page">
		<view class="head"><text class="title">{{ modeTitle }}</text><text class="progress" v-if="words.length">{{ singlePractice ? '本题重练' : '剩余 ' + words.length + ' 题' }}</text></view>
		<view class="card" v-if="current">
			<template v-if="mode === 'listen'">
				<text class="word listen-word">{{ current.word }}</text><text v-if="currentPhonetic" class="phonetic">/{{ currentPhonetic }}/</text><text class="hint">听发音，选择正确释义</text><view class="audio-button" @click="playStandard">🔊 播放发音</view>
				<view class="options"><view v-for="option in options" :key="option" class="option" :class="optionClass(option)" @click="choose(option)">{{ option }}</view></view>
			</template>
			<template v-else-if="mode === 'read'">
				<text class="hint">选择对应的英文单词</text><text class="prompt">{{ current.chinese }}</text>
				<view class="options"><view v-for="option in options" :key="option" class="option" :class="optionClass(option)" @click="choose(option)">{{ option }}</view></view>
			</template>
			<template v-else-if="mode === 'write'">
				<text class="hint">根据释义拼写单词</text><text class="prompt">{{ current.chinese }}</text>
				<input class="write-input" v-model="writeInput" :disabled="answered" placeholder="请输入英文单词" @confirm="checkWrite" />
				<button class="primary" :disabled="!writeInput.trim() || answered" @click="checkWrite">检查拼写</button>
			</template>
			<template v-else>
				<text class="hint">听标准发音后完成跟读</text><text class="word">{{ current.word }}</text><text class="phonetic">{{ current.phonetic_us || current.phonetic_uk }}</text>
				<view class="speak-actions"><button class="secondary" @click="playStandard">播放标准发音</button><button class="primary" :class="{ recording }" :disabled="evaluating" @click="toggleRecording">{{ recording ? '停止录音' : (evaluating ? '评测中...' : '开始跟读') }}</button></view>
			</template>
			<view class="feedback" v-if="feedback" :class="{ success: passed, failed: !passed }"><text>{{ feedback }}</text><button v-if="!passed" class="retry" @click="retry">再试一次</button></view>
		</view>
		<animated-empty v-else-if="!loading" icon="🎉" text="该类型错题已全部完成"></animated-empty>
		<animated-loading v-else text="正在加载错题..."></animated-loading>
	</view>
</template>
<script>
import { request as apiRequest, getWrongWords, markWordAsKnown, markWordAsUnknown, evaluateSpeech } from '@/utils/api.js';
import { isFirstLoad } from '@/utils/first-load.js';
import { getAudioSettings } from '@/utils/learning-settings.js';
import { playTts, clearTtsQueue } from '@/utils/tts-player.js';
import { PRONUNCIATION_PASS_SCORE } from '@/utils/scoring-rules.js';
import { playAnswerFeedback } from '@/utils/answer-feedback.js';
export default {
	data(){const firstLoad=isFirstLoad('pages/mine/wrong-practice');return{mode:'read',startWord:'',singlePractice:false,words:[],options:[],writeInput:'',selected:'',answered:false,passed:false,feedback:'',firstLoad,loading:firstLoad,audio:null,recorder:null,recording:false,evaluating:false,recordTimer:null}},
	computed:{
		current(){return this.words[0]||null},
		modeTitle(){return({listen:'听音错题重练',read:'辨义错题重练',write:'拼写错题重练',speak:'发音错题重练'})[this.mode]||'错题重练'},
		correctAnswer(){if(!this.current)return'';return this.mode==='listen'?this.current.chinese:this.current.word},
		currentPhonetic(){return String(this.current?.phonetic_us||this.current?.phonetic_uk||'').replace(/^\/+|\/+$/g,'')}
	},
	async onLoad(query={}){this.mode=['listen','read','write','speak'].includes(query.mode)?query.mode:'read';this.startWord=decodeURIComponent(query.word||'');this.singlePractice=String(query.single||'')==='1';this.initRecorder();const audioSettings=await getAudioSettings();this.autoPlay=audioSettings.autoPlay;this.voiceType=audioSettings.voiceType;this.loadQueue()},
	onUnload(){clearTtsQueue();if(this.recordTimer)clearTimeout(this.recordTimer);if(this.recording&&this.recorder)this.recorder.stop();if(this.audio){this.audio.stop();this.audio.destroy();this.audio=null}},
	methods:{
		async loadQueue(){if(this.firstLoad){this.loading=true;this.firstLoad=false}try{const result=await getWrongWords(this.mode);this.words=result?.words||[];if(this.startWord){if(this.singlePractice)this.words=this.words.filter(item=>item.word===this.startWord).slice(0,1);else{const index=this.words.findIndex(item=>item.word===this.startWord);if(index>0)this.words.unshift(this.words.splice(index,1)[0])}}if(!this.words.length)return this.finishQueue();await this.prepareQuestion()}catch(error){console.error('加载错题失败:',error);uni.showToast({title:'加载错题失败',icon:'none'})}finally{this.loading=false}},
		async prepareQuestion(){this.selected='';this.answered=false;this.passed=false;this.feedback='';this.writeInput='';if(!this.current||!['listen','read'].includes(this.mode))return;try{const distractors=await apiRequest('/words/random?count=12');const field=this.mode==='listen'?'chinese':'word';const correct=this.current[field];const others=[...new Set(distractors.map(item=>item[field]).filter(value=>value&&value!==correct))].sort(()=>Math.random()-.5).slice(0,3);this.options=[correct,...others].sort(()=>Math.random()-.5);if(this.mode==='listen'&&this.autoPlay)setTimeout(()=>this.playStandard(),250)}catch(error){this.options=[this.correctAnswer]}},
		optionClass(option){if(!this.answered)return{};return{correct:option===this.correctAnswer,wrong:option===this.selected&&option!==this.correctAnswer}},
		async choose(option){if(this.answered)return;this.selected=option;playAnswerFeedback(option===this.correctAnswer);if(option===this.correctAnswer)await this.completeCurrent(this.singlePractice?'回答正确，正在返回错题本':'回答正确，即将进入下一题');else{this.answered=true;this.passed=false;this.feedback='回答错误，请再练习一次';await markWordAsUnknown(this.current.word,this.mode).catch(()=>{})}},
		async checkWrite(){if(!this.current||this.answered)return;const correct=this.writeInput.trim().toLowerCase()===String(this.current.word).toLowerCase();playAnswerFeedback(correct);if(correct)await this.completeCurrent(this.singlePractice?'拼写正确，正在返回错题本':'拼写正确，即将进入下一题');else{this.answered=true;this.passed=false;this.feedback='拼写错误，正确答案是：'+this.current.word;await markWordAsUnknown(this.current.word,this.mode).catch(()=>{})}},
		retry(){this.selected='';this.answered=false;this.passed=false;this.feedback='';this.writeInput=''},
		completeCurrent(message){if(!this.current)return;const word=this.current.word;const mode=this.mode;this.answered=true;this.passed=true;this.feedback=message;markWordAsKnown(word,mode).catch(error=>{console.error('保存错题重练结果失败:',error);uni.showToast({title:'结果保存失败，下次将重新出现',icon:'none'})});setTimeout(async()=>{if(this.singlePractice)return uni.navigateBack();this.words.shift();if(!this.words.length)return this.finishQueue();await this.prepareQuestion()},350)},
		finishQueue(){uni.showToast({title:'该类型错题已完成',icon:'success',duration:900});setTimeout(()=>uni.navigateBack(),900)},
		playStandard(){if(!this.current?.word)return;playTts(this.current.word,3).catch(error=>{console.error('错题发音播放失败:',error);uni.showToast({title:error?.message||'语音播放失败',icon:'none'})})},
		initRecorder(){this.recorder=uni.getRecorderManager();this.recorder.onStop(r=>{this.recording=false;if(this.recordTimer)clearTimeout(this.recordTimer);this.evaluateRecording(r.tempFilePath)});this.recorder.onError(()=>{this.recording=false;this.evaluating=false;this.feedback='录音失败，请检查麦克风权限'})},
		toggleRecording(){if(this.recording)return this.recorder.stop();this.feedback='';this.recording=true;this.recorder.start({duration:10000,sampleRate:16000,numberOfChannels:1,format:'mp3'});this.recordTimer=setTimeout(()=>{if(this.recording)this.recorder.stop()},10000)},
		evaluateRecording(filePath){this.evaluating=true;uni.getFileSystemManager().readFile({filePath,encoding:'base64',success:async r=>{try{const evaluation=await evaluateSpeech(r.data,this.current.word,'read_word','mp3');const score=Number(evaluation?.score||0);playAnswerFeedback(score>=PRONUNCIATION_PASS_SCORE);if(score>=PRONUNCIATION_PASS_SCORE)await this.completeCurrent('发音得分 '+score+(this.singlePractice?'，正在返回错题本':'，即将进入下一题'));else{this.answered=true;this.passed=false;this.feedback='发音得分 '+score+'，达到'+PRONUNCIATION_PASS_SCORE+'分后完成';await markWordAsUnknown(this.current.word,this.mode).catch(()=>{})}}catch(error){this.feedback=error?.message||'评测失败，请重试'}finally{this.evaluating=false}},fail:()=>{this.evaluating=false;this.feedback='读取录音失败'}})}
	}
};
</script>
<style>
.page{min-height:100vh;background:#f7f5f0;padding:28rpx;box-sizing:border-box}.head{display:flex;justify-content:space-between;align-items:center;margin:15rpx 0 28rpx}.title{font-size:40rpx;font-weight:700;color:#1f3a5f}.progress{font-size:25rpx;color:#7a7a7a}.card{background:#fff;border-radius:22rpx;padding:34rpx;box-shadow:0 5rpx 18rpx rgba(31,58,95,.08)}.hint{display:block;text-align:center;color:#7a7a7a;font-size:27rpx}.prompt,.word{display:block;text-align:center;font-size:48rpx;font-weight:700;color:#1f3a5f;margin:35rpx 0 15rpx}.phonetic{display:block;text-align:center;color:#888;font-size:30rpx;margin-bottom:24rpx}.listen-word{margin:10rpx 0 10rpx}.audio-button{width:250rpx;text-align:center;margin:40rpx auto;padding:24rpx;background:#1f3a5f;color:#fff;border-radius:50rpx}.options{margin-top:35rpx}.option{padding:25rpx;margin:18rpx 0;border:2rpx solid #e5e7eb;border-radius:15rpx;color:#333;background:#fafafa}.option.correct{border-color:#16a34a;background:#f0fdf4}.option.wrong{border-color:#dc2626;background:#fef2f2}.write-input{margin:35rpx 0 24rpx;padding:25rpx;border:2rpx solid #dde3ea;border-radius:14rpx;background:#fafafa}.primary,.secondary,.retry{border-radius:14rpx}.primary{background:#1f3a5f;color:#fff}.primary.recording{background:#dc2626}.secondary{background:#e8eef6;color:#1f3a5f}.speak-actions{display:flex;gap:18rpx}.speak-actions button{flex:1}.feedback{margin-top:28rpx;padding:22rpx;border-radius:14rpx;text-align:center}.feedback.success{background:#f0fdf4;color:#15803d}.feedback.failed{background:#fef2f2;color:#b91c1c}.retry{margin-top:18rpx;background:#fff;color:#1f3a5f}.empty{text-align:center;padding-top:220rpx;color:#777}.empty-icon{display:block;font-size:80rpx;margin-bottom:20rpx}
</style>


