<template>
  <view class="page">
    <view class="hero">
      <text class="title">个人信息</text>
      <text class="subtitle">头像和昵称将同步显示在“我的”页面</text>
    </view>

    <view class="profile-card">
      <button class="avatar-button" open-type="chooseAvatar" @chooseavatar="chooseWechatAvatar">
        <image class="avatar" :src="avatar" mode="aspectFill" @error="useDefaultAvatar" />
        <view class="camera">📷</view>
      </button>
      <text class="avatar-tip">点击选择微信头像</text>

      <view class="divider" />
      <view class="nickname-row">
        <text class="label">微信昵称</text>
        <input
          class="nickname-input"
          type="nickname"
          v-model="nickname"
          maxlength="24"
          placeholder="选择或输入微信昵称"
          @confirm="saveNickname"
        />
      </view>
      <button class="save-button" :disabled="saving || !canSaveNickname" @click="saveNickname">
        {{ saving ? '保存中…' : '保存昵称' }}
      </button>
    </view>

    <view class="privacy-tip">
      <text class="privacy-title">资料说明</text>
      <text class="privacy-text">微信要求头像和昵称由你主动选择。资料仅用于本小程序内的个人展示和学习记录。</text>
    </view>
  </view>
</template>

<script>
import { getUserProfile, updateUserProfile, uploadUserAvatar } from '@/utils/api.js';
export default {
  data() {
    return { avatar: '/static/logo.png', nickname: '英语学习者', savedNickname: '英语学习者', saving: false };
  },
  computed: {
    canSaveNickname() {
      const value = String(this.nickname || '').trim();
      return value.length > 0 && value !== this.savedNickname;
    }
  },
  onLoad() { this.loadProfile(); },
  methods: {
    useDefaultAvatar() { this.avatar = '/static/logo.png'; },
    normalizeAvatar(value) {
      return !value || value === '/static/default-avatar.png' ? '/static/logo.png' : value;
    },
    async loadProfile() {
      let profile = uni.getStorageSync('userProfile') || {};
      try { profile = { ...profile, ...(await getUserProfile()) }; }
      catch (error) { console.error('加载个人信息失败:', error); }
      this.avatar = this.normalizeAvatar(profile.avatar);
      this.nickname = String(profile.nickname || '英语学习者').trim();
      this.savedNickname = this.nickname;
    },
    async chooseWechatAvatar(event) {
      const tempPath = event.detail?.avatarUrl;
      if (!tempPath) return;
      uni.showLoading({ title: '正在保存头像' });
      try {
        const base64 = await new Promise((resolve, reject) => uni.getFileSystemManager().readFile({
          filePath: tempPath, encoding: 'base64', success: result => resolve(result.data), fail: reject
        }));
        const suffix = String(tempPath).split('.').pop().toLowerCase();
        const mime = suffix === 'png' ? 'png' : (suffix === 'webp' ? 'webp' : 'jpeg');
        const result = await uploadUserAvatar(`data:image/${mime};base64,${base64}`);
        this.avatar = this.normalizeAvatar(result?.avatar);
        this.syncLocalProfile();
        uni.$emit('user-profile:updated', { avatar: this.avatar, nickname: this.nickname });
        uni.showToast({ title: '头像已更新', icon: 'success' });
      } catch (error) {
        console.error('保存微信头像失败:', error);
        uni.showToast({ title: error?.message || '头像保存失败', icon: 'none' });
      } finally { uni.hideLoading(); }
    },
    async saveNickname() {
      const value = String(this.nickname || '').trim();
      if (!value) return uni.showToast({ title: '请输入昵称', icon: 'none' });
      if (value === this.savedNickname || this.saving) return;
      this.saving = true;
      try {
        const updated = await updateUserProfile({ nickname: value });
        this.nickname = String(updated?.nickname || value).trim();
        this.savedNickname = this.nickname;
        this.avatar = this.normalizeAvatar(updated?.avatar || this.avatar);
        this.syncLocalProfile(updated);
        uni.$emit('user-profile:updated', { avatar: this.avatar, nickname: this.nickname });
        uni.showToast({ title: '昵称已保存', icon: 'success' });
      } catch (error) {
        console.error('保存昵称失败:', error);
        uni.showToast({ title: error?.message || '昵称保存失败', icon: 'none' });
      } finally { this.saving = false; }
    },
    syncLocalProfile(extra = {}) {
      const previous = uni.getStorageSync('userProfile') || {};
      uni.setStorageSync('userProfile', { ...previous, ...extra, nickname: this.nickname, avatar: this.avatar });
    }
  }
};
</script>

<style>
.page{box-sizing:border-box;min-height:100vh;padding:30rpx 24rpx;background:#f7f5f0}.hero{padding:35rpx 8rpx 28rpx;text-align:center}.title{display:block;font-size:40rpx;font-weight:800;color:#1f3a5f}.subtitle{display:block;margin-top:9rpx;font-size:22rpx;color:#87929d}.profile-card{padding:38rpx 28rpx 30rpx;border-radius:24rpx;background:#fff;box-shadow:0 7rpx 22rpx rgba(31,58,95,.08)}.avatar-button{position:relative;width:164rpx;height:164rpx;margin:0 auto;padding:0;border:0;border-radius:50%;background:transparent;line-height:1}.avatar-button:after{border:0}.avatar{width:160rpx;height:160rpx;border:4rpx solid #fff;border-radius:50%;box-shadow:0 5rpx 14rpx rgba(31,58,95,.18);animation:avatarGlow 2.4s ease-in-out infinite}@keyframes avatarGlow{0%,100%{box-shadow:0 0 0 0 rgba(13,148,136,.5)}50%{box-shadow:0 0 0 20rpx rgba(13,148,136,0)}}.camera{position:absolute;right:0;bottom:4rpx;display:flex;align-items:center;justify-content:center;width:48rpx;height:48rpx;border:4rpx solid #fff;border-radius:50%;background:#1f3a5f;font-size:22rpx}.avatar-tip{display:block;margin-top:15rpx;text-align:center;font-size:22rpx;color:#87929d}.divider{height:1rpx;margin:32rpx 0 8rpx;background:#edf0f2}.nickname-row{display:flex;align-items:center;gap:20rpx;padding:20rpx 0}.label{flex-shrink:0;font-size:28rpx;color:#334155}.nickname-input{box-sizing:border-box;flex:1;height:72rpx;padding:0 20rpx;border-radius:14rpx;background:#f6f8fa;text-align:right;font-size:27rpx;color:#1f3a5f}.save-button{height:78rpx;line-height:78rpx;margin-top:14rpx;border:0;border-radius:15rpx;background:#1f3a5f;color:#fff;font-size:28rpx}.save-button:after{border:0}.save-button[disabled]{background:#d9dfe5;color:#929ba4}.privacy-tip{margin-top:22rpx;padding:24rpx;border-radius:18rpx;background:#eef6f5}.privacy-title{display:block;font-size:25rpx;font-weight:700;color:#24655f}.privacy-text{display:block;margin-top:8rpx;font-size:22rpx;line-height:1.6;color:#71807f}
</style>