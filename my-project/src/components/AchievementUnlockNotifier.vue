<template>
  <view v-if="visible && current" class="achievement-overlay" @touchmove.stop.prevent>
    <view class="achievement-modal">
      <view class="achievement-glow"></view>
      <view class="achievement-halo"><text class="achievement-icon">{{ current.icon }}</text></view>
      <text class="achievement-kicker">ACHIEVEMENT UNLOCKED</text>
      <text class="achievement-title">新成就解锁</text>
      <view class="achievement-divider"><view></view><text>★</text><view></view></view>
      <text class="achievement-name">{{ current.name }}</text>
      <text class="achievement-desc">{{ current.description }}</text>
      <text class="achievement-tip">✓ 已加入你的成就徽章墙</text>
      <button class="achievement-button" @click="close">{{ queue.length ? '查看下一个' : '太棒了' }}</button>
    </view>
  </view>
</template>
<script>
import { getAchievements, getSettings } from '@/utils/api.js';

export default {
  data() { return { visible: false, current: null, queue: [], checking: false }; },
  mounted() {
    uni.$on('achievement:check', this.scheduleCheck);
    this.scheduleCheck();
  },
  beforeUnmount() { uni.$off('achievement:check', this.scheduleCheck); if (this.timer) clearTimeout(this.timer); },
  methods: {
    scheduleCheck() { if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(() => this.check(), 350); },
    async check() {
      if (this.checking) return;
      this.checking = true;
      try {
        const [result, settings] = await Promise.all([getAchievements(), getSettings()]);
        const badges = [...(result.learning || []), ...(result.streak || []), ...(result.special || [])];
        const unlocked = badges.filter(item => item.unlocked);
        const key = 'notifiedAchievementIds';
        const stored = uni.getStorageSync(key);
        if (!Array.isArray(stored)) { uni.setStorageSync(key, unlocked.map(item => item.id || item.name)); return; }
        if (!Boolean(Number(settings.achievement_reminder ?? 1))) { uni.setStorageSync(key, unlocked.map(item => item.id || item.name)); return; }
        const known = new Set(stored);
        const fresh = unlocked.filter(item => !known.has(item.id || item.name));
        uni.setStorageSync(key, unlocked.map(item => item.id || item.name));
        if (!fresh.length) return;
        this.queue.push(...fresh.filter(item => !this.queue.some(queued => queued.id === item.id)));
        if (!this.visible) this.showNext();
      } catch (_) {} finally { this.checking = false; }
    },
    showNext() { this.current = this.queue.shift() || null; this.visible = Boolean(this.current); },
    close() { this.visible = false; setTimeout(() => this.showNext(), 180); }
  }
};
</script>
<style scoped>
.achievement-overlay{position:fixed;z-index:99999;inset:0;display:flex;align-items:center;justify-content:center;padding:42rpx;background:rgba(12,28,45,.72);backdrop-filter:blur(8rpx)}
.achievement-modal{position:relative;overflow:hidden;width:100%;box-sizing:border-box;padding:48rpx 36rpx 34rpx;border:2rpx solid rgba(240,196,92,.64);border-radius:31rpx;background:linear-gradient(165deg,#fffdf5,#fff 52%,#fff7df);box-shadow:0 28rpx 80rpx rgba(0,0,0,.3);text-align:center;animation:achievement-pop .4s ease-out}
.achievement-glow{position:absolute;left:50%;top:-180rpx;width:390rpx;height:390rpx;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(246,201,91,.3),rgba(246,201,91,0) 70%)}
.achievement-halo{position:relative;display:flex;align-items:center;justify-content:center;width:140rpx;height:140rpx;margin:0 auto 24rpx;border:2rpx solid #efd178;border-radius:50%;background:linear-gradient(145deg,#fff4bf,#ffe28a);box-shadow:0 0 0 15rpx rgba(242,198,87,.12),0 12rpx 30rpx rgba(188,133,25,.24)}
.achievement-icon{font-size:70rpx}.achievement-kicker{display:block;font-size:17rpx;font-weight:800;letter-spacing:3rpx;color:#b27a20}.achievement-title{display:block;margin-top:7rpx;font-size:41rpx;font-weight:900;color:#234361}.achievement-divider{display:flex;align-items:center;justify-content:center;gap:12rpx;margin:20rpx auto 14rpx;color:#d1a33e}.achievement-divider view{width:70rpx;height:1rpx;background:#e5ca86}.achievement-name{display:block;font-size:35rpx;font-weight:900;color:#9a6517}.achievement-desc{display:block;margin-top:9rpx;font-size:24rpx;line-height:1.55;color:#697986}.achievement-tip{display:inline-block;margin-top:22rpx;padding:8rpx 15rpx;border-radius:18rpx;background:#edf8f5;color:#178c7f;font-size:20rpx}.achievement-button{margin-top:29rpx;height:82rpx;line-height:82rpx;border:0;border-radius:42rpx;background:linear-gradient(135deg,#d6a43d,#efc968);box-shadow:0 10rpx 23rpx rgba(189,134,29,.25);color:#fff;font-size:28rpx;font-weight:800}.achievement-button:after{border:0}@keyframes achievement-pop{0%{opacity:0;transform:scale(.78) translateY(30rpx)}70%{transform:scale(1.03) translateY(-4rpx)}100%{opacity:1;transform:scale(1)}}
</style>