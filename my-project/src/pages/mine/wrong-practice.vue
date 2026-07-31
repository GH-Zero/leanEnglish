<template>
	<view class="page">
		<view class="head"><text class="title">{{ modeTitle }}</text><text class="progress" v-if="words.length">剩余 {{ words.length }} 题</text></view>
		<view class="card" v-if="current">
			<template v-if="mode === 'listen'">
				<text class="hint">听发音，选择正确释义</text><view class="audio-button" @click="playStandard">🔊 播放发音</view>
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
		<view class="empty" v-else-if="!loading"><text class="empty-icon">🎉</text><text>该类型错题已全部完成</text></view>
		<view class="empty" v-else>正在加载错题...</view>
	</view>
</template>
<script>
import { BASE_URL, getWrongWords, markWordAsKnown, markWordAsUnknown, evaluateSpeech } from '@/utils/api.js';
export default {
	data(){return{mode:'read',startWord:'',words:[],options:[],writeInput:'',selected:'',answered:false,passed:false,feedback:'',loading:true,audio:null,recorder:null,recording:false,evaluating:false,recordTimer:null}},
	computed:{
		current(){return this.words[0]||null},
		modeTitle(){return({listen:'听音错题重练',read:'辨义错题重练',write:'拼写错题重练',speak:'发音错题重练'})[this.mode]||'错题重练'},
		correctAnswer(){if(!this.current)return'';return this.mode==='listen'?this.current.chinese:this.current.word}
	},
	onLoad(query={}){this.mode=['listen','read','write','speak'].includes(query.mode)?query.mode:'read';this.startWord=decodeURIComponent(query.word||'');this.initRecorder();this.loadQueue()},
	onUnload(){if(this.recordTimer)clearTimeout(this.recordTimer);if(this.recording&&this.recorder)this.recorder.stop();if(this.audio){this.audio.stop();this.audio.destroy();this.audio=null}},
	methods:{
		async loadQueue(){this.loading=true;try{const result=await getWrongWords(this.mode);this.words=result?.words||[];if(this.startWord){const index=this.words.findIndex(item=>item.word===this.startWord);if(index>0)this.words.unshift(this.words.splice(index,1)[0])}if(!this.words.length)return this.finishQueue();await this.prepareQuestion()}catch(error){console.error('加载错题失败:',error);uni.showToast({title:'加载错题失败',icon:'none'})}finally{this.loading=false}},
		async prepareQuestion(){this.selected='';this.answered=false;this.passed=false;this.feedback='';this.writeInput='';if(!this.current||!['listen','read'].includes(this.mode))return;try{const distractors=await new Promise((resolve,reject)=>uni.request({url:BASE_URL+'/words/random?count=12',success:r=>r.statusCode===200&&r.data.code===0?resolve(r.data.data||[]):reject(r),fail:reject}));const field=this.mode==='listen'?'chinese':'word';const correct=this.current[field];const others=[...new Set(distractors.map(item=>item[field]).filter(value=>value&&value!==correct))].sort(()=>Math.random()-.5).slice(0,3);this.options=[correct,...others].sort(()=>Math.random()-.5);if(this.mode==='listen')setTimeout(()=>this.playStandard(),250)}catch(error){this.options=[this.correctAnswer]}},
		optionClass(option){if(!this.answered)return{};return{correct:option===this.correctAnswer,wrong:option===this.selected&&option!==this.correctAnswer}},
		async choose(option){if(this.answered)return;this.selected=option;if(option===this.correctAnswer)await this.completeCurrent('回答正确，即将进入下一题');else{this.answered=true;this.passed=false;this.feedback='回答错误，请再练习一次';await markWordAsUnknown(this.current.word,this.mode).catch(()=>{})}},
		async checkWrite(){if(!this.current||this.answered)return;if(this.writeInput.trim().toLowerCase()===String(this.current.word).toLowerCase())await this.completeCurrent('拼写正确，即将进入下一题');else{this.answered=true;this.passed=false;this.feedback='拼写错误，正确答案是：'+this.current.word;await markWordAsUnknown(this.current.word,this.mode).catch(()=>{})}},
		retry(){this.selected='';this.answered=false;this.passed=false;this.feedback='';this.writeInput=''},
		async completeCurrent(message){if(!this.current)return;this.answered=true;this.passed=true;this.feedback=message;try{await markWordAsKnown(this.current.word,this.mode)}catch(error){this.passed=false;this.feedback='保存练习结果失败，请重试';return}setTimeout(async()=>{this.words.shift();if(!this.words.length)return this.finishQueue();await this.prepareQuestion()},650)},
		finishQueue(){uni.showToast({title:'该类型错题已完成',icon:'success',duration:900});setTimeout(()=>uni.navigateBack(),900)},
		playStandard(){if(!this.current?.word)return;const url='https://dict.youdao.com/dictvoice?audio='+encodeURIComponent(this.current.word)+'&type=1';uni.downloadFile({url,success:r=>{if(r.statusCode!==200||!r.tempFilePath)return uni.showToast({title:'语音加载失败',icon:'none'});if(this.audio){this.audio.stop();this.audio.destroy()}const audio=uni.createInnerAudioContext();this.audio=audio;audio.src=r.tempFilePath;audio.onCanplay(()=>audio.play());audio.onError(()=>uni.showToast({title:'语音播放失败',icon:'none'}))},fail:()=>uni.showToast({title:'语音加载失败',icon:'none'})})},
		initRecorder(){this.recorder=uni.getRecorderManager();this.recorder.onStop(r=>{this.recording=false;if(this.recordTimer)clearTimeout(this.recordTimer);this.evaluateRecording(r.tempFilePath)});this.recorder.onError(()=>{this.recording=false;this.evaluating=false;this.feedback='录音失败，请检查麦克风权限'})},
		toggleRecording(){if(this.recording)return this.recorder.stop();this.feedback='';this.recording=true;this.recorder.start({duration:10000,sampleRate:16000,numberOfChannels:1,format:'mp3'});this.recordTimer=setTimeout(()=>{if(this.recording)this.recorder.stop()},10000)},
		evaluateRecording(filePath){this.evaluating=true;uni.getFileSystemManager().readFile({filePath,encoding:'base64',success:async r=>{try{const evaluation=await evaluateSpeech(r.data,this.current.word,'read_word','mp3');const score=Number(evaluation?.score||0);if(score>=70)await this.completeCurrent('发音得分 '+score+'，即将进入下一题');else{this.answered=true;this.passed=false;this.feedback='发音得分 '+score+'，达到70分后完成';await markWordAsUnknown(this.current.word,this.mode).catch(()=>{})}}catch(error){this.feedback=error?.message||'评测失败，请重试'}finally{this.evaluating=false}},fail:()=>{this.evaluating=false;this.feedback='读取录音失败'}})}
	}
};
</script>
<style>
.page{min-height:100vh;background:#f7f5f0;padding:28rpx;box-sizing:border-box}.head{display:flex;justify-content:space-between;align-items:center;margin:15rpx 0 28rpx}.title{font-size:40rpx;font-weight:700;color:#1f3a5f}.progress{font-size:25rpx;color:#7a7a7a}.card{background:#fff;border-radius:22rpx;padding:34rpx;box-shadow:0 5rpx 18rpx rgba(31,58,95,.08)}.hint{display:block;text-align:center;color:#7a7a7a;font-size:27rpx}.prompt,.word{display:block;text-align:center;font-size:48rpx;font-weight:700;color:#1f3a5f;margin:35rpx 0 15rpx}.phonetic{display:block;text-align:center;color:#888;margin-bottom:30rpx}.audio-button{width:250rpx;text-align:center;margin:40rpx auto;padding:24rpx;background:#1f3a5f;color:#fff;border-radius:50rpx}.options{margin-top:35rpx}.option{padding:25rpx;margin:18rpx 0;border:2rpx solid #e5e7eb;border-radius:15rpx;color:#333;background:#fafafa}.option.correct{border-color:#16a34a;background:#f0fdf4}.option.wrong{border-color:#dc2626;background:#fef2f2}.write-input{margin:35rpx 0 24rpx;padding:25rpx;border:2rpx solid #dde3ea;border-radius:14rpx;background:#fafafa}.primary,.secondary,.retry{border-radius:14rpx}.primary{background:#1f3a5f;color:#fff}.primary.recording{background:#dc2626}.secondary{background:#e8eef6;color:#1f3a5f}.speak-actions{display:flex;gap:18rpx}.speak-actions button{flex:1}.feedback{margin-top:28rpx;padding:22rpx;border-radius:14rpx;text-align:center}.feedback.success{background:#f0fdf4;color:#15803d}.feedback.failed{background:#fef2f2;color:#b91c1c}.retry{margin-top:18rpx;background:#fff;color:#1f3a5f}.empty{text-align:center;padding-top:220rpx;color:#777}.empty-icon{display:block;font-size:80rpx;margin-bottom:20rpx}
</style>