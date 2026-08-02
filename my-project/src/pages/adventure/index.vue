<template>
  <view class="page">
    <view class="hero">
      <view class="hero-main">
        <view>
          <text class="hero-title">英语成长地图</text>
          <text class="hero-sub">沿学习路线前进，逐步解锁核心能力</text>
        </view>
        <view class="hero-medal">🏅</view>
      </view>
      <view class="hero-progress"><view :style="{ width: percent + '%' }"></view></view>
      <view class="hero-stats">
        <view><text>{{ progress.passedCount }}/{{ progress.total }}</text><text>已通关</text></view>
        <view><text>{{ progress.stars }}</text><text>获得星星</text></view>
        <view><text>{{ percent }}%</text><text>总进度</text></view>
      </view>
    </view>

    <scroll-view class="route-scroll" scroll-y :scroll-top="scrollTop" scroll-with-animation>
    <view class="route-heading">
      <view><text class="route-title">全域学习路线</text><text class="route-sub">完成当前节点，自动解锁下一站</text></view>
      <text class="route-count">{{ progress.passedCount }}/{{ progress.total }}</text>
    </view>

    <view v-if="loading" class="state">正在加载成长地图...</view>
    <view v-else class="map-board">
      <view class="scenery scenery-tree">🌲</view>
      <view class="scenery scenery-bear">🐻</view>
      <view class="scenery scenery-cloud">☁️</view>

      <view v-for="(level, index) in levels" :id="'map-level-' + index" :key="level.key" class="map-stop" :class="[positionClass(index), level.status, starClass(level), { boss: level.is_boss, 'has-module': !!moduleInfo(index) }]" :style="{ animationDelay: (index % 12) * 45 + 'ms' }">
        <view v-if="moduleInfo(index)" class="module-banner">
          <view class="module-icon">{{ moduleInfo(index).icon }}</view>
          <view class="module-copy"><text>{{ moduleInfo(index).name }}</text><text>{{ moduleInfo(index).desc }}</text></view>
          <text class="module-progress">{{ moduleProgress(index) }}</text>
        </view>

        <view v-if="index < levels.length - 1" class="route-segment" :class="segmentClass(index)"></view>

        <view class="node-wrap" @click="openLevel(level)">
          <view v-if="level.status === 'learning' || (level.unlocked && level.status !== 'passed')" class="pulse"></view>
          <view class="level-node">
            <text class="node-icon">{{ nodeIcon(level) }}</text>
          </view>
          <text class="node-title">{{ level.title }}</text>
          <view v-if="level.status === 'passed'" class="node-stars">
            <text v-for="star in 3" :key="star" :class="{ dim: star > Number(level.stars || 0) }">★</text>
          </view>
          <text v-else class="node-status">{{ level.status === 'locked' ? '未解锁' : '开始挑战' }}</text>
        </view>
      </view>

      <view class="finish">
        <view class="finish-cup">🏆</view>
        <text>完成全部路线</text>
        <text>达成英语成长目标</text>
      </view>
    </view>
    </scroll-view>
  </view>
</template>

<script>
import { request } from '@/utils/api.js'

const MODULES = {
  0: { name: '基础启程', desc: '问候、介绍与基础表达', icon: '🌱', start: 0, end: 3 },
  3: { name: '词汇积累', desc: '高频词汇与日常应用', icon: '📚', start: 3, end: 6 },
  6: { name: '语法应用', desc: '句型规则与情境运用', icon: '✍️', start: 6, end: 9 },
  9: { name: '综合挑战', desc: '检验整条路线的学习成果', icon: '🏆', start: 9, end: 10 }
}

export default {
  data() {
    return {
      loading: true,
      levels: [],
      progress: { passedCount: 0, total: 0, stars: 0 },
      scrollTop: 0
    }
  },
  computed: {
    percent() {
      return this.progress.total ? Math.round(this.progress.passedCount * 100 / this.progress.total) : 0
    }
  },
  onShow() {
    this.loadLevels()
  },
  methods: {
    async loadLevels() {
      this.loading = true
      try {
        const data = await request('/adventure-course/modules')
        this.levels = data.modules || []
        this.progress = data
      } catch (error) {
        uni.showToast({ title: error.message || '关卡加载失败', icon: 'none' })
      } finally {
        this.loading = false
        this.$nextTick(() => this.focusCurrentLevel())
      }
    },
    focusCurrentLevel() {
      if (!this.levels.length) return
      let index = this.levels.findIndex(level => level.unlocked && level.status !== 'passed')
      if (index < 0) index = Math.max(0, this.levels.length - 1)
      setTimeout(() => {
        const query = uni.createSelectorQuery().in(this)
        query.select('.route-scroll').boundingClientRect()
        query.select('.map-board').boundingClientRect()
        query.select('#map-level-' + index).boundingClientRect()
        query.exec(result => {
          const viewport = result?.[0]
          const board = result?.[1]
          const level = result?.[2]
          if (!viewport || !board || !level) return
          const target = Math.max(0, level.top - board.top - viewport.height * 0.18)
          this.scrollTop = -1
          this.$nextTick(() => { this.scrollTop = target })
        })
      }, 80)
    },    starClass(level) {
      return level.status === 'passed' ? 'stars-' + Math.max(1, Math.min(3, Number(level.stars || 1))) : ''
    },
    positionClass(index) {
      return ['node-center', 'node-right', 'node-center', 'node-left'][index % 4]
    },
    segmentClass(index) {
      if (this.moduleInfo(index + 1)) {
        const currentPosition = this.positionClass(index)
        if (currentPosition === 'node-right') return 'into-world-far-left'
        if (currentPosition === 'node-center') return 'into-world-left'
        return 'into-world-straight'
      }
      if (this.moduleInfo(index)) {
        const nextPosition = this.positionClass(index + 1)
        if (nextPosition === 'node-right') return 'world-far-right'
        if (nextPosition === 'node-center') return 'world-right'
        return 'world-straight'
      }
      return ['line-right', 'line-left', 'line-left', 'line-right'][index % 4]
    },
    moduleInfo(index) {
      const current = this.levels[index]
      if (!current || (index > 0 && this.levels[index - 1].world === current.world)) return null
      return { name: current.world + ' · ' + current.stage, desc: '按场景依次学习，完成后进入下一阶段', icon: ({ A1: '🌱', A2: '🌿', B1: '🌳', B2: '🗣️', C1: '🏆' })[current.world] }
    },
    moduleProgress(index) {
      const current = this.levels[index]
      if (!current) return ''
      const items = this.levels.filter(item => item.world === current.world)
      return items.filter(item => item.completed).length + '/' + items.length
    },
    nodeIcon(level) {
      if (level.status === 'passed') return '★'
      if (level.status === 'locked') return level.icon || '🔒'
      if (level.is_boss) return '🏆'
      return '▶'
    },
    openLevel(level) {
      if (!level.unlocked) {
        uni.showToast({ title: '请先完成上一个节点', icon: 'none' })
        return
      }
      uni.navigateTo({ url: '/pages/adventure/module?key=' + level.key })
    }
  }
}
</script>

<style>
.page{box-sizing:border-box;height:100vh;display:flex;flex-direction:column;overflow:hidden;padding:22rpx 22rpx 0;background:linear-gradient(180deg,#edf5f6 0,#f7f5f0 430rpx)}.hero{flex-shrink:0;padding:27rpx;border-radius:27rpx;background:linear-gradient(135deg,#1f3a5f,#246d78);color:#fff;box-shadow:0 13rpx 30rpx rgba(31,58,95,.2)}.hero-main{display:flex;align-items:flex-start;justify-content:space-between}.hero-title{display:block;font-size:38rpx;font-weight:900}.hero-sub{display:block;margin-top:7rpx;font-size:21rpx;color:rgba(255,255,255,.7)}.hero-medal{display:flex;align-items:center;justify-content:center;width:66rpx;height:66rpx;border-radius:19rpx;background:rgba(255,255,255,.12);font-size:35rpx}.hero-progress{height:8rpx;margin-top:22rpx;overflow:hidden;border-radius:8rpx;background:rgba(255,255,255,.16)}.hero-progress view{height:100%;border-radius:8rpx;background:#70d1c5}.hero-stats{display:flex;margin-top:18rpx}.hero-stats view{flex:1;text-align:center}.hero-stats text:first-child{display:block;font-size:28rpx;font-weight:900}.hero-stats text:last-child{display:block;margin-top:2rpx;font-size:18rpx;color:rgba(255,255,255,.65)}.route-scroll{flex:1;height:0;min-height:0;margin-top:12rpx}.route-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:28rpx 6rpx 15rpx}.route-title{display:block;font-size:31rpx;font-weight:900;color:#213f61}.route-sub{display:block;margin-top:4rpx;font-size:21rpx;color:#89969f}.route-count{padding:7rpx 14rpx;border-radius:18rpx;background:#d9f4ef;color:#0b9487;font-size:20rpx;font-weight:800}.state{padding:120rpx 0;text-align:center;color:#84919c;font-size:25rpx}.map-board{position:relative;margin-bottom:52rpx;overflow:hidden;padding:8rpx 18rpx 65rpx;border-radius:30rpx;background:linear-gradient(180deg,#dff2ef,#e9f4e7 58%,#f4ecd9);box-shadow:inset 0 0 0 2rpx rgba(255,255,255,.72),0 8rpx 25rpx rgba(46,84,94,.09)}.map-stop{position:relative;opacity:0;animation:levelEnter .48s cubic-bezier(.2,.8,.25,1) forwards;height:220rpx}.map-stop.has-module{height:235rpx}.map-stop.has-module .node-wrap{left:27%}.map-stop.has-module .route-segment{left:27%}.module-banner{position:absolute;z-index:5;top:50%;right:3%;display:flex;align-items:center;box-sizing:border-box;width:45%;min-height:112rpx;padding:16rpx;border:2rpx solid rgba(255,255,255,.95);border-radius:20rpx;background:rgba(255,255,255,.94);color:#294866;box-shadow:0 8rpx 21rpx rgba(40,77,80,.12);transform:translateY(-50%)}.module-banner:before{content:"→";position:absolute;top:50%;left:-67rpx;width:56rpx;line-height:32rpx;color:#5faaa1;font-size:38rpx;font-weight:900;text-align:center;transform:translateY(-50%)}.module-banner:after{display:none}.module-icon{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:48rpx;height:48rpx;border-radius:14rpx;background:#e2f3ef;font-size:25rpx}.module-copy{flex:1;min-width:0;margin-left:11rpx}.module-copy text:first-child{display:block;font-size:23rpx;font-weight:900}.module-copy text:last-child{display:block;overflow:hidden;margin-top:5rpx;font-size:17rpx;line-height:1.3;color:#86969c;text-overflow:ellipsis;white-space:nowrap}.module-progress{position:absolute;right:11rpx;top:10rpx;padding:4rpx 8rpx;border-radius:12rpx;background:#ddf3ee;color:#0d9488;font-size:16rpx;font-weight:800}.node-wrap{position:absolute;z-index:3;top:50%;display:flex;flex-direction:column;align-items:center;width:190rpx;transform:translate(-50%,-50%)}.node-left .node-wrap{left:25%}.node-center .node-wrap{left:50%}.node-right .node-wrap{left:75%}.level-node{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;width:91rpx;height:91rpx;border:11rpx solid rgba(255,255,255,.72);border-radius:50%;background:#1f3a5f;box-shadow:0 10rpx 0 #142b47,0 14rpx 23rpx rgba(27,55,71,.24)}.node-icon{font-size:35rpx;color:#fff}.locked .level-node{filter:grayscale(1);opacity:.63;background:#82979b;box-shadow:0 10rpx 0 #617478}.passed.stars-1 .level-node{background:linear-gradient(135deg,#10B981,#34D399);box-shadow:0 10rpx 0 #087f5b}.passed.stars-2 .level-node{background:linear-gradient(135deg,#3B82F6,#60A5FA);box-shadow:0 10rpx 0 #2563b8}.passed.stars-3 .level-node{background:linear-gradient(135deg,#7C3AED,#A855F7);box-shadow:0 10rpx 0 #5b21b6}.passed .level-node{animation:passedFloat 2.8s ease-in-out infinite}.boss .level-node{width:104rpx;height:104rpx;background:#d97835;box-shadow:0 11rpx 0 #a64b25}.node-title{margin-top:14rpx;padding:5rpx 13rpx;border-radius:14rpx;background:rgba(255,255,255,.78);color:#304e62;font-size:21rpx;font-weight:900;white-space:nowrap}.node-status{margin-top:5rpx;color:#819296;font-size:17rpx}.node-stars{margin-top:4rpx;font-size:19rpx;letter-spacing:2rpx}.stars-1 .node-stars{background:linear-gradient(90deg,#10B981,#34D399);-webkit-background-clip:text;color:transparent}.stars-2 .node-stars{background:linear-gradient(90deg,#3B82F6,#60A5FA);-webkit-background-clip:text;color:transparent}.stars-3 .node-stars{background:linear-gradient(90deg,#7C3AED,#A855F7);-webkit-background-clip:text;color:transparent;text-shadow:0 2rpx 8rpx rgba(124,58,237,.22)}.node-stars .dim{color:#c9d2d1;text-shadow:none}.pulse{position:absolute;top:30rpx;width:125rpx;height:125rpx;border:5rpx solid rgba(13,148,136,.35);border-radius:50%;animation:pulse 1.7s ease-out infinite}.route-segment{position:absolute;z-index:1;top:50%;width:0;height:278rpx;border-left:7rpx dashed rgba(69,112,104,.35);transform-origin:top center}.node-left .route-segment{left:25%}.node-center .route-segment{left:50%}.node-right .route-segment{left:75%}.line-right{transform:rotate(-38deg)}.line-left{transform:rotate(38deg)}.world-far-right{height:405rpx;transform:rotate(-56deg)}.world-right{height:282rpx;transform:rotate(-37deg)}.world-straight{height:235rpx;transform:rotate(0)}.into-world-far-left{height:405rpx;transform:rotate(56deg)}.into-world-left{height:282rpx;transform:rotate(37deg)}.into-world-straight{height:235rpx;transform:rotate(0)}.scenery{position:absolute;z-index:0;opacity:.11;filter:grayscale(1)}.scenery-tree{top:640rpx;right:-18rpx;font-size:145rpx}.scenery-bear{top:1340rpx;left:-22rpx;font-size:155rpx}.scenery-cloud{top:980rpx;right:10rpx;font-size:125rpx}.finish{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;margin-top:18rpx;color:#7b6d4e}.finish-cup{display:flex;align-items:center;justify-content:center;width:84rpx;height:84rpx;margin-bottom:12rpx;border-radius:50%;background:#fff2c7;font-size:42rpx;box-shadow:0 8rpx 17rpx rgba(129,99,47,.14)}.finish text:nth-child(2){font-size:23rpx;font-weight:900}.finish text:last-child{margin-top:4rpx;font-size:18rpx;color:#9b9077}@keyframes levelEnter{0%{opacity:0;top:16rpx}100%{opacity:1;top:0}}@keyframes passedFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4rpx)}}@keyframes pulse{0%{transform:scale(.75);opacity:1}100%{transform:scale(1.3);opacity:0}}
</style>





