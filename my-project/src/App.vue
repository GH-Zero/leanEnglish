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
      setTimeout(() => this.showLoginError(error), 200);
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
    showLoginError(error) {
      const message = error?.message || '登录失败，请稍后重试';
      const configurationError = Number(error?.statusCode) === 503 || /配置.*AppID|AppSecret|尚未配置/.test(message);
      if (configurationError) {
        if (this.configurationNoticeShown) return;
        this.configurationNoticeShown = true;
        uni.showModal({ title: '微信登录配置未完成', content: '当前小程序仍使用测试 AppID，管理员配置真实 AppID 和 AppSecret 后即可正常登录。', showCancel: false, confirmText: '我知道了' });
        return;
      }
      uni.showModal({ title: '微信登录失败', content: message, cancelText: '稍后再试', confirmText: '重新登录', success: result => { if (result.confirm) this.loginAgain(); } });
    },
    async loginAgain() { uni.showLoading({ title: '微信登录中', mask: true }); try { await wechatLogin(); uni.reLaunch({ url: '/pages/home/index' }); } catch (error) { this.showLoginError(error); } finally { uni.hideLoading(); } },    isStudyPage() {
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