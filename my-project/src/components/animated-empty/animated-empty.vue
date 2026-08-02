<template>
  <view class="ae">
    <view class="ae-visual">
      <view class="ae-blob"></view>
      <view class="ae-blob ae-blob-2"></view>
      <view class="ae-ring"></view>
      <text class="ae-icon">{{ icon }}</text>
      <text class="ae-spark ae-s1">✦</text>
      <text class="ae-spark ae-s2">✦</text>
      <text class="ae-spark ae-s3">✦</text>
    </view>
    <text class="ae-text">{{ text }}</text>
    <text class="ae-sub" v-if="sub">{{ sub }}</text>
    <view class="ae-actions" v-if="$slots.default"><slot></slot></view>
  </view>
</template>
<script>
export default {
  name: 'AnimatedEmpty',
  props: {
    icon: { type: String, default: '🎉' },
    text: { type: String, default: '暂无数据' },
    sub: { type: String, default: '' }
  }
}
</script>
<style>
.ae{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;padding:60rpx 40rpx;box-sizing:border-box}
.ae-visual{position:relative;width:250rpx;height:250rpx;display:flex;align-items:center;justify-content:center}
.ae-blob{position:absolute;width:180rpx;height:180rpx;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(125,211,200,.6),rgba(13,148,136,.16) 72%);animation:aeBlob 3.2s ease-in-out infinite}
.ae-blob-2{width:128rpx;height:128rpx;background:radial-gradient(circle at 65% 35%,rgba(108,92,231,.45),rgba(108,92,231,.08) 72%);animation:aeBlob2 3.9s ease-in-out infinite}
.ae-ring{position:absolute;width:224rpx;height:224rpx;border:3rpx dashed rgba(13,148,136,.32);border-radius:50%;animation:aeSpin 14s linear infinite}
.ae-icon{position:relative;z-index:2;font-size:92rpx;animation:aeFloat 2.4s ease-in-out infinite}
.ae-spark{position:absolute;z-index:2;color:#ff9f43;font-size:28rpx;opacity:0;animation:aeSpark 2.6s ease-in-out infinite}
.ae-s1{top:6rpx;left:24rpx;animation-delay:.2s}
.ae-s2{top:64rpx;right:2rpx;color:#6c5ce7;animation-delay:1.1s}
.ae-s3{bottom:16rpx;left:6rpx;color:#0d9488;animation-delay:1.9s}
.ae-text{margin-top:26rpx;font-size:28rpx;font-weight:600;color:#55677a;animation:aeFade 1.4s ease both}
.ae-sub{margin-top:12rpx;font-size:23rpx;color:#98a3ae;animation:aeFade 1.4s ease .25s both}
.ae-actions{margin-top:24rpx}
@keyframes aeBlob{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.14) translateY(-10rpx)}}
@keyframes aeBlob2{0%,100%{transform:scale(1)}50%{transform:scale(.84) translateY(10rpx)}}
@keyframes aeSpin{to{transform:rotate(360deg)}}
@keyframes aeFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-16rpx) rotate(3deg)}}
@keyframes aeSpark{0%,58%{opacity:0;transform:scale(.4)}70%,90%{opacity:1;transform:scale(1.25)}100%{opacity:0;transform:scale(.5)}}
@keyframes aeFade{from{opacity:0;transform:translateY(12rpx)}to{opacity:1;transform:translateY(0)}}
</style>
