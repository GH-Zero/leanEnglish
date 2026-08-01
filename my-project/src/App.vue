<script>
import { updateStudyTime } from '@/utils/api.js'
import { checkDailyReminder } from '@/utils/notification.js'

const STUDY_ROUTES = [
  'pages/word/', 'pages/grammar/', 'pages/phonetic/', 'pages/speak/',
  'pages/dialogue/', 'pages/challenge/', 'pages/mine/wrong-practice',
  'pages/mine/word-book'
]

export default {
  onLaunch() {
    console.log('App Launch')
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