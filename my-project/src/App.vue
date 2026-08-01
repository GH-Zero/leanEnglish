<script>
import { updateStudyTime, wechatLogin } from '@/utils/api.js'
import { checkDailyReminder } from '@/utils/notification.js'

const STUDY_ROUTES = [
  'pages/word/', 'pages/grammar/', 'pages/phonetic/', 'pages/speak/',
  'pages/dialogue/', 'pages/challenge/', 'pages/mine/wrong-practice',
  'pages/mine/word-book'
]

export default {
  async onLaunch() {
    uni.addInterceptor('request', { invoke(args) { const token = uni.getStorageSync('authToken'); args.header = { ...(args.header || {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) }; } });
    // #ifdef MP-WEIXIN
    uni.showLoading({ title: '微信登录中', mask: true });
    try {
      await wechatLogin();
      uni.$emit('auth:ready');
    } catch (error) {
      uni.removeStorageSync('authToken');
      uni.removeStorageSync('currentUserId');
      setTimeout(() => uni.showModal({ title: '需要微信授权登录', content: error.message || '登录失败，请稍后重试', showCancel: false, confirmText: '重新登录', success: () => this.loginAgain() }), 200);
    } finally { uni.hideLoading(); }
    // #endif
  },
  onShow() {
    this.studySeconds = Number(uni.getStorageSync('pendingStudySeconds') || 0)
    this.lastStudyTick = Date.now()
    this.studyTimer = setInterval(() => this.recordStudyTime(), 15000)
    setTimeout(() => checkDailyReminder(), 800)
  },
  onHide() {
    this.recordStudyTime()
    clearInterval(this.studyTimer)
    this.studyTimer = null
  },
  methods: {
    async loginAgain() { uni.showLoading({ title: '微信登录中', mask: true }); try { await wechatLogin(); uni.reLaunch({ url: '/pages/home/index' }); } catch (error) { uni.showToast({ title: error.message || '登录失败', icon: 'none' }); } finally { uni.hideLoading(); } },
    isStudyPage() {
      const pages = getCurrentPages()
      const route = pages.length ? pages[pages.length - 1].route : ''
      return STUDY_ROUTES.some(prefix => route.startsWith(prefix))
    },
    recordStudyTime() {
      const now = Date.now()
      if (this.lastStudyTick && this.isStudyPage()) {
        this.studySeconds += Math.min((now - this.lastStudyTick) / 1000, 30)
      }
      this.lastStudyTick = now
      const minutes = Math.floor(this.studySeconds / 60)
      this.studySeconds %= 60
      uni.setStorageSync('pendingStudySeconds', this.studySeconds)
      if (minutes > 0) {
        updateStudyTime(minutes).catch(() => {
          this.studySeconds += minutes * 60
          uni.setStorageSync('pendingStudySeconds', this.studySeconds)
        })
      }
    }
  }
}
</script>

<style>
/* 每个页面公共 CSS */
</style>