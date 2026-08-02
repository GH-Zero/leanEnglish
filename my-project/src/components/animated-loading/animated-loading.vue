<template>
  <view class="al">
    <view class="al-stage">
      <view class="al-spinner"></view>
      <view class="al-halo"></view>
      <image class="al-logo" src="/static/logo.png" mode="aspectFit"></image>
    </view>
    <text class="al-icon" v-if="icon">{{ icon }}</text>
    <view class="al-line">
      <text class="al-text">{{ cleanText }}</text>
      <view class="al-dots">
        <view class="al-dot"></view>
        <view class="al-dot"></view>
        <view class="al-dot"></view>
      </view>
    </view>
  </view>
</template>
<script>
export default {
  name: 'AnimatedLoading',
  props: {
    text: { type: String, default: '正在加载' },
    icon: { type: String, default: '' }
  },
  computed: {
    cleanText() {
      return String(this.text || '').replace(/[.…]+$/g, '').trim() || '正在加载'
    }
  }
}
</script>
<style>
.al{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;padding:60rpx 40rpx;box-sizing:border-box}
.al-stage{position:relative;width:132rpx;height:132rpx;display:flex;align-items:center;justify-content:center}
.al-spinner{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%;border:6rpx solid rgba(13,148,136,.16);border-top-color:#0d9488;border-right-color:rgba(13,148,136,.55);animation:alSpin .9s linear infinite}
.al-halo{position:absolute;left:18rpx;top:18rpx;right:18rpx;bottom:18rpx;border-radius:50%;background:rgba(125,211,200,.14);animation:alHalo 1.6s ease-in-out infinite}
.al-logo{position:relative;width:82rpx;height:82rpx;border-radius:20rpx;animation:alBreath 1.6s ease-in-out infinite}
.al-icon{font-size:50rpx;margin-top:20rpx;animation:alFloat 1.3s ease-in-out infinite}
.al-line{display:flex;align-items:center;margin-top:20rpx}
.al-text{font-size:26rpx;color:#7d8a96;letter-spacing:1rpx}
.al-dots{display:flex;margin-left:6rpx}
.al-dot{width:8rpx;height:8rpx;margin:0 3rpx;border-radius:50%;background:#9fb4c4;opacity:.25;animation:alBlink 1.2s ease-in-out infinite}
.al-dot:nth-child(2){animation-delay:.2s}
.al-dot:nth-child(3){animation-delay:.4s}
@keyframes alSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes alHalo{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
@keyframes alBreath{0%,100%{transform:scale(1);box-shadow:0 0 14rpx rgba(13,148,136,.22)}50%{transform:scale(1.05);box-shadow:0 0 26rpx rgba(13,148,136,.48)}}
@keyframes alFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8rpx)}}
@keyframes alBlink{0%,100%{opacity:.25}50%{opacity:1}}
</style>
