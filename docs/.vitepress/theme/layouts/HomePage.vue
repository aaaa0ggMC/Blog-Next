<template>
  <div ref="homeRef" class="home" :style="homeStyle">
    <div class="bg-layer" :class="{ active: showLayer === 0 }" :style="{ backgroundImage: `url(${bgA})` }"></div>
    <div class="bg-layer" :class="{ active: showLayer === 1 }" :style="{ backgroundImage: `url(${bgB})` }"></div>
    <div class="ambient-vignette"></div>

    <header class="top-bar">
      <div class="top-bar-left">
        <a :href="ghUrl" class="icon-link gh-link" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
          <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
        <a :href="rssUrl" class="icon-link rss-link" target="_blank" rel="noopener noreferrer" aria-label="RSS Feed" title="订阅 RSS">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
            <circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none"/>
            <path d="M4 14a5 5 0 0 1 5 5"/>
            <path d="M4 9a10 10 0 0 1 10 10"/>
            <path d="M4 4a15 15 0 0 1 15 15"/>
          </svg>
        </a>
      </div>
      <div class="clock" :class="{ locked: isLocked }" role="button" tabindex="0"
        @click="handleClockClick"
        @contextmenu.prevent="cycleBackward"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchCancel"
        :title="isLocked ? '已锁定，双击解锁' : '左键/轻触下一时段 · 长按/右键上一时段 · 双击锁定'">
        <div class="clock-face">
          <div class="clock-hand" :style="{ transform: `rotate(${handAngle}deg)` }"></div>
          <div class="clock-dot"></div>
          <svg v-if="isLocked" class="lock-indicator" viewBox="0 0 24 24" width="9" height="9" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
        <span class="period-label">{{ nowLabel }}</span>
      </div>
    </header>

    <main class="content">
      <div class="hero-card">
        <h1 class="title">aaaa0ggmc&apos;s Blog</h1>
        <p class="subtitle">where I could be calm</p>
      </div>
      <nav class="nav">
        <a v-for="item in navItems" :key="item.label" :href="base + item.link" class="nav-link">
          <span class="nav-text">{{ item.label }}</span>
        </a>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { base, cdn_base } from '../../scripts/Data'
import { homePeriods, type HomePeriod } from '../constants/homePeriods'

function toBgUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('~')) return base + path.substring(1).replace(/^\/+/, '')
  if (path.startsWith('/')) {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('useLocal') === 'true') {
      return base + 'res' + path
    }
    const userDef = typeof localStorage !== 'undefined' ? localStorage.getItem('userDef')?.trim() : ''
    if (userDef) {
      return (userDef.endsWith('/') ? userDef.slice(0, -1) : userDef) + path
    }
    const cdn = cdn_base.endsWith('/') ? cdn_base.slice(0, -1) : cdn_base
    return cdn + path
  }
  return path
}

const seg = 24 / homePeriods.length

function getIdx(): number {
  const now = new Date()
  const h = now.getHours() + now.getMinutes() / 60
  let idx = 0
  for (let i = 0; i < homePeriods.length; i++) {
    if (h >= homePeriods[i].startHour && h < homePeriods[i].startHour + seg) {
      idx = i
      break
    }
  }
  return idx
}

const KEY = 'blog_home_state'
const hasStorage = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

function loadSaved(): { manualIdx: number | null; locked: boolean } {
  if (!hasStorage) return { manualIdx: null, locked: false }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      const isLocked = !!s.locked
      if (isLocked && typeof s.manualIdx === 'number' && s.manualIdx >= 0 && s.manualIdx < homePeriods.length) {
        return { manualIdx: s.manualIdx, locked: true }
      }
    }
  } catch {}
  return { manualIdx: null, locked: false }
}

function saveState() {
  if (!hasStorage) return
  try {
    localStorage.setItem(KEY, JSON.stringify({
      manualIdx: isLocked.value ? manualIdx.value : null,
      locked: isLocked.value,
    }))
  } catch {}
}

const saved = loadSaved()
const manualIdx = ref<number | null>(saved.manualIdx)
const cur = ref(saved.manualIdx !== null ? saved.manualIdx : getIdx())
const isLocked = ref(saved.locked)

const layerUrl = ref([homePeriods[cur.value].bg, homePeriods[cur.value].bg])
const showLayer = ref(0)
const handAngle = ref(cur.value * (360 / homePeriods.length))

const currentPeriod = computed(() => homePeriods[cur.value])

const homeStyle = computed(() => ({
  '--accent': currentPeriod.value.accent,
  '--accent-light': currentPeriod.value.accentLight,
  '--accent-glow': currentPeriod.value.accentGlow,
}))

const bgA = computed(() => toBgUrl(layerUrl.value[0]))
const bgB = computed(() => toBgUrl(layerUrl.value[1]))
const ghUrl = 'https://github.com/aaaa0ggMC'
const rssUrl = base + 'feed.rss'

const nowLabel = ref('')

function fmtHour(h: number): string {
  const hr = Math.floor(h) % 24
  const mn = Math.floor((h - Math.floor(h)) * 60)
  return `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`
}

function tickClock() {
  if (manualIdx.value !== null) {
    nowLabel.value = fmtHour(homePeriods[cur.value].startHour)
  } else {
    const d = new Date()
    nowLabel.value = fmtHour(d.getHours() + d.getMinutes() / 60)
  }
}

const navItems = [
  { label: '随笔', link: 'writings' },
  { label: '学习', link: 'keep_learning' },
  { label: '旅途', link: 'exploration' },
  { label: '游戏', link: 'gaming_life' },
  { label: '友链', link: 'friends' },
]

function switchTo(idx: number) {
  if (idx === cur.value || isLocked.value) return
  const target = showLayer.value === 0 ? 1 : 0
  layerUrl.value[target] = homePeriods[idx].bg
  cur.value = idx
  showLayer.value = target
  const step = 360 / homePeriods.length
  handAngle.value = idx * step + Math.floor(handAngle.value / 360) * 360
  tickClock()
}

function updatePeriod() {
  if (isLocked.value) return
  switchTo(manualIdx.value ?? getIdx())
}

function cyclePeriod() {
  if (isLocked.value) return
  if (manualIdx.value === null) manualIdx.value = cur.value
  manualIdx.value = (manualIdx.value! + 1) % homePeriods.length
  if (cur.value > manualIdx.value) handAngle.value += 360
  switchTo(manualIdx.value)
  saveState()
}

function cycleBackward() {
  if (isLocked.value) return
  if (manualIdx.value === null) manualIdx.value = cur.value
  manualIdx.value = (manualIdx.value! - 1 + homePeriods.length) % homePeriods.length
  if (cur.value < manualIdx.value) handAngle.value -= 360
  switchTo(manualIdx.value)
  saveState()
}

function toggleLock() {
  isLocked.value = !isLocked.value
  if (!isLocked.value) {
    manualIdx.value = null
    switchTo(getIdx())
  } else {
    if (manualIdx.value === null) {
      manualIdx.value = cur.value
    }
  }
  saveState()
}

const homeRef = ref<HTMLElement | null>(null)

let timer: number | null = null
let clickTimeout: number | null = null
let longPressTimer: number | null = null
let isLongPress = false

function handleTouchStart() {
  isLongPress = false
  longPressTimer = window.setTimeout(() => {
    isLongPress = true
    cycleBackward()
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator as any).vibrate(30) } catch {}
    }
  }, 500)
}

function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function handleTouchCancel() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

// Pseudo-parallax logic
let targetX = 0
let targetY = 0
let currentX = 0
let currentY = 0
let rafId: number | null = null

function isParallaxEnabled(): boolean {
  if (!hasStorage) return true
  return localStorage.getItem('enableParallax') !== 'false'
}

function updateParallax() {
  const factor = 0.08
  currentX += (targetX - currentX) * factor
  currentY += (targetY - currentY) * factor

  if (homeRef.value) {
    homeRef.value.style.setProperty('--bg-x', `${currentX.toFixed(2)}px`)
    homeRef.value.style.setProperty('--bg-y', `${currentY.toFixed(2)}px`)
  }

  if (Math.abs(targetX - currentX) < 0.02 && Math.abs(targetY - currentY) < 0.02) {
    currentX = targetX
    currentY = targetY
    if (homeRef.value) {
      homeRef.value.style.setProperty('--bg-x', `${currentX}px`)
      homeRef.value.style.setProperty('--bg-y', `${currentY}px`)
    }
    rafId = null
  } else {
    rafId = requestAnimationFrame(updateParallax)
  }
}

function startParallaxLoop() {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  if (!isParallaxEnabled() && currentX === 0 && currentY === 0) return
  if (!rafId) {
    rafId = requestAnimationFrame(updateParallax)
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!isParallaxEnabled()) return
  const w = window.innerWidth
  const h = window.innerHeight
  if (w <= 0 || h <= 0) return
  const nx = (e.clientX / w - 0.5) * 2
  const ny = (e.clientY / h - 0.5) * 2
  targetX = -nx * 18
  targetY = -ny * 12
  startParallaxLoop()
}

function handleMouseLeave() {
  if (!isParallaxEnabled()) return
  targetX = 0
  targetY = 0
  startParallaxLoop()
}

function handleStorage(e: StorageEvent) {
  if (e.key === 'enableParallax' && e.newValue === 'false') {
    targetX = 0
    targetY = 0
    startParallaxLoop()
  }
}

function handleClockClick() {
  if (isLongPress) {
    isLongPress = false
    return
  }
  if (clickTimeout) {
    clearTimeout(clickTimeout)
    clickTimeout = null
    toggleLock()
    return
  }
  clickTimeout = window.setTimeout(() => {
    clickTimeout = null
    cyclePeriod()
  }, 250)
}

onMounted(() => {
  homePeriods.forEach(p => { const img = new Image(); img.src = toBgUrl(p.bg) })
  tickClock()
  timer = window.setInterval(() => {
    tickClock()
    updatePeriod()
  }, 30000)

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true })
    window.addEventListener('storage', handleStorage)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (longPressTimer) clearTimeout(longPressTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseleave', handleMouseLeave)
    window.removeEventListener('storage', handleStorage)
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})
</script>

<style scoped>
.home {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-family: var(--vp-font-family-base);
  background-color: #0a0a14;
  -webkit-tap-highlight-color: transparent;
  transition: --accent 2s ease, --accent-light 2s ease, --accent-glow 2s ease;
}

.bg-layer {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: translate3d(var(--bg-x, 0px), var(--bg-y, 0px), 0) scale(1.06);
  transform-origin: center center;
  will-change: transform;
  pointer-events: none;
  transition: opacity 2.2s ease;
  z-index: 0;
}
.bg-layer.active {
  opacity: 1;
}

.ambient-vignette {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  background: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.04) 75%, rgba(0, 0, 0, 0.15) 100%);
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .bg-layer {
    transform: scale(1.06) !important;
  }
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(20px + env(safe-area-inset-top, 0px)) 36px 0;
  position: relative;
  z-index: 2;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  opacity: 0.9;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.icon-link:hover {
  opacity: 1;
  color: var(--accent-light);
  background: rgba(255, 255, 255, 0.16);
  border-color: var(--accent);
  box-shadow: 0 4px 18px var(--accent-glow);
  transform: translateY(-1px);
}
.icon-link:active {
  transform: scale(0.94);
}

.clock {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.clock:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
}
.clock:active {
  transform: scale(0.96);
}
.clock.locked {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 16px var(--accent-glow);
}
.clock.locked .clock-face {
  border-color: var(--accent);
  background: rgba(255,255,255,0.15);
}
.clock.locked .clock-hand {
  background: var(--accent-light);
  box-shadow: 0 0 6px var(--accent-glow);
}
.clock.locked .clock-dot {
  width: 7px;
  height: 7px;
  box-shadow: 0 0 8px var(--accent-glow);
}
.clock.locked .period-label {
  color: var(--accent-light);
}

.clock-face {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 1.5s ease, background 1.5s ease;
}

.clock-hand {
  position: absolute;
  top: 4px; left: 50%;
  width: 2px;
  height: 38%;
  background: #fff;
  border-radius: 2px;
  transform-origin: bottom center;
  transition: transform 1.2s cubic-bezier(.34,1.56,.64,1);
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.clock-dot {
  width: 5px; height: 5px;
  background: var(--accent);
  border-radius: 50%;
  position: relative;
  z-index: 1;
  transition: background 1.5s ease;
}

.lock-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  color: var(--accent-light);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
  z-index: 2;
}

.period-label {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1px;
  white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  font-variant-numeric: tabular-nums;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  text-align: center;
  position: relative;
  z-index: 2;
  margin-bottom: calc(4vh + env(safe-area-inset-bottom, 0px));
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
}

.title {
  font-size: clamp(34px, 6.2vw, 100px);
  font-weight: 800;
  margin: 0 0 14px;
  line-height: 1.15;
  color: var(--accent-light);
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.6), 0 0 28px var(--accent-glow), 0 0 64px var(--accent-glow);
  letter-spacing: 1.5px;
  transition: color 2s ease, text-shadow 2s ease;
  white-space: nowrap;
  user-select: none;
}

.subtitle {
  font-size: clamp(14px, 1.8vw, 22px);
  font-weight: 400;
  margin: 0 0 42px;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  letter-spacing: 3px;
  user-select: none;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
}

.nav-link {
  font-size: clamp(18px, 2.3vw, 28px);
  font-weight: 500;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
  text-decoration: none;
  letter-spacing: 3px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  padding: 6px 12px;
  border-radius: 8px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 0%;
  height: 2px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-glow);
  border-radius: 2px;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-link:hover {
  color: var(--accent-light);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5), 0 0 18px var(--accent-glow);
  transform: translateY(-2px);
}
.nav-link:hover::after {
  width: 80%;
}

/* Tablet & Mobile responsive */
@media (max-width: 768px) {
  .top-bar {
    padding: calc(14px + env(safe-area-inset-top, 0px)) 18px 0;
  }
  
  .content {
    padding: 0 16px;
    margin-bottom: calc(3vh + env(safe-area-inset-bottom, 0px));
  }

  .title {
    font-size: clamp(25px, 6.8vw, 36px);
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }

  .subtitle {
    font-size: clamp(12px, 3.4vw, 15px);
    letter-spacing: 2px;
    margin-bottom: 30px;
    opacity: 0.85;
  }

  /* Glassmorphic Nav Pill Dock on mobile */
  .nav {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 8px;
    max-width: calc(100vw - 32px);
    background: rgba(12, 14, 24, 0.42);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 9999px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .nav-link {
    font-size: clamp(14px, 3.8vw, 16px);
    font-weight: 500;
    letter-spacing: 1.5px;
    padding: 8px 14px;
    border-radius: 9999px;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    background: transparent;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .nav-link::after {
    display: none;
  }

  .nav-link:hover {
    color: #fff;
    transform: none;
  }

  .nav-link:active {
    background: rgba(255, 255, 255, 0.18);
    color: var(--accent-light);
    transform: scale(0.94);
    box-shadow: 0 0 12px var(--accent-glow);
  }
}

/* Small mobile devices (< 380px) */
@media (max-width: 380px) {
  .nav {
    border-radius: 20px;
    padding: 6px;
    gap: 4px;
  }

  .nav-link {
    padding: 7px 11px;
    font-size: 13.5px;
    letter-spacing: 1px;
  }

  .title {
    font-size: 23px;
  }
}
</style>
