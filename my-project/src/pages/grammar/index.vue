<template>
	<view class="page">
		<text class="title">语法学习</text><text class="subtitle">选择阶段进入专项练习</text>
		<view v-for="stage in stages" :key="stage.id" class="card" @click="go(stage.id)">
			<text class="number">{{ stage.id }}</text>
			<view class="info"><view class="title-row"><text class="name">{{ stage.name }}</text></view><text class="desc">{{ stage.desc }}</text></view>
			<text class="arrow">›</text>
		</view>
	</view>
</template>
<script>
export default {
	data() { return { stages: [
		{ id: 1, name: '基础句型', desc: '词类、句子成分、基础句型与常用时态' },
		{ id: 2, name: '核心语法', desc: '时态、词类、情态动词、主谓一致与被动语态' },
		{ id: 3, name: '进阶语法', desc: '各类从句、非谓语、虚拟语气与高级句式' }
	] }; },
	methods: { go(id) { uni.navigateTo({ url: `/pages/grammar/list?stage=${id}` }); } }
};
</script>
<style>
.page{box-sizing:border-box;min-height:100vh;padding:32rpx 24rpx;background:#f7f5f0}.title,.name{display:block;font-weight:800;color:#1f3a5f}.title{font-size:40rpx}.subtitle{display:block;margin:9rpx 0 27rpx;color:#8b959f;font-size:22rpx}.card{display:flex;align-items:center;gap:20rpx;margin:17rpx 0;padding:29rpx 24rpx;border-radius:21rpx;background:#fff;box-shadow:0 6rpx 20rpx rgba(31,58,95,.06)}.number{display:flex;align-items:center;justify-content:center;width:58rpx;height:58rpx;border-radius:50%;background:#1f3a5f;color:#fff;font-size:27rpx;font-weight:800}.info{flex:1}.title-row{display:flex;align-items:center;gap:12rpx}.name{font-size:28rpx}.desc{display:block;margin-top:8rpx;color:#89939d;font-size:22rpx;line-height:1.45}.arrow{font-size:34rpx;color:#9ba6af}
</style>