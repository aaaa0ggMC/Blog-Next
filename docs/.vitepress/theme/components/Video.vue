<template>
  <span ref="box" class="vvid-box" :class="{ 'is-loading': !loaded && !failed }" :style="boxStyle">
    <!-- Shimmer Skeleton & Spinner while loading -->
    <div v-if="!loaded && !failed" class="vvid-skeleton">
      <div class="vvid-shimmer"></div>
      <div class="vvid-spinner">
        <svg class="vvid-spin-icon" viewBox="0 0 24 24" width="28" height="28" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="36" stroke-linecap="round" opacity="0.75" />
        </svg>
      </div>
    </div>

    <!-- Main Video Player -->
    <video
      v-if="src"
      ref="videoRef"
      class="vvid-main"
      :class="{ loaded }"
      :src="src"
      :poster="posterUrl"
      :style="videoStyle"
      :title="title"
      :controls="controls"
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      :playsinline="playsinline"
      :preload="preload"
      @loadeddata="onLoaded"
      @canplay="onLoaded"
      @error="onError"
    ></video>

    <!-- Failed fallback prompt -->
    <div v-if="failed" class="vvid-failed">
      <div class="vvid-failed-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div class="vvid-failed-text">{{ isEncTag ? '私密视频：未解锁或密钥无效' : '视频加载失败' }}</div>
    </div>

    <!-- Optional Caption -->
    <span v-if="title && !failed" class="vvid-caption">{{ title }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { decrypt, isBase64Cipher } from '../../scripts/crypto'
import {
  base,
  cdn_base,
  ekey_norm,
  ekey_priv,
  ekey_teacher,
} from '../../scripts/Data'

const props = withDefaults(
  defineProps<{
    content: string
    title?: string
    poster?: string
    width?: string | number
    height?: string | number
    fit?: 'cover' | 'contain' | 'fill'
    objectPosition?: string
    controls?: boolean
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
    preload?: 'auto' | 'metadata' | 'none'
    playsinline?: boolean
    noMangle?: boolean
    no_mangle?: boolean
    raw?: boolean
    encrypt?: boolean
    level?: string
  }>(),
  {
    controls: true,
    autoplay: false,
    loop: false,
    muted: false,
    preload: 'metadata',
    playsinline: true,
  },
)

const raw = props.content.trim()
const isEncrypted = isBase64Cipher(raw)
const isEncTag = isEncrypted || props.encrypt || !!props.level

const box = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const target = ref<string | null>(null)
const src = ref<string | null>(null)
const loaded = ref(false)
const failed = ref(false)
let observer: IntersectionObserver | null = null

const boxStyle = computed(() => {
  const s: Record<string, string> = {
    position: 'relative',
    display: 'inline-block',
    maxWidth: '100%',
    textAlign: 'center',
  }

  if (props.width != null) {
    const w = String(props.width).trim()
    s.width = '100%'
    s.maxWidth = /^\d+$/.test(w) ? `${w}px` : w
  } else {
    s.width = '100%'
  }

  if (props.height != null) {
    const h = String(props.height).trim()
    s.height = /^\d+$/.test(h) ? `${h}px` : h
  }

  if (props.width != null && props.height != null) {
    const w = Number.parseFloat(String(props.width))
    const h = Number.parseFloat(String(props.height))
    if (!Number.isNaN(w) && !Number.isNaN(h) && h > 0) {
      s.aspectRatio = `${w} / ${h}`
    }
  }

  return s
})

const videoStyle = computed(() => {
  const s: Record<string, string> = {
    maxWidth: '100%',
    display: 'block',
    margin: '0 auto',
  }

  if (props.fit || props.objectPosition || props.height != null) {
    s.width = '100%'
    s.height = '100%'
    s.objectFit = props.fit || 'contain'
  } else {
    s.width = '100%'
    s.height = 'auto'
  }

  if (props.objectPosition) {
    s.objectPosition = props.objectPosition
  }

  return s
})

function toCdnUrl(path: string): string {
  if (path.startsWith('~')) return base + path.substring(1).replace(/^\/+/, '')
  if (path.startsWith('@/')) {
    path = '/' + path.substring(2)
  }
  if (path.startsWith('/')) {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('useLocal') === 'true') {
      return base + 'res' + path
    }
    const userDef = typeof localStorage !== 'undefined' ? localStorage.getItem('userDef') : null
    if (userDef != null && userDef !== '') {
      const up = userDef.endsWith('/') ? userDef.slice(0, -1) : userDef
      return up + path
    }
    return cdn_base + path
  }
  return path
}

const posterUrl = computed(() => {
  if (!props.poster) return undefined
  return toCdnUrl(props.poster)
})

async function resolveContent(input: string): Promise<string> {
  if (!isEncrypted) return input
  const keys = [
    localStorage.getItem(ekey_norm),
    localStorage.getItem(ekey_priv),
    localStorage.getItem(ekey_teacher),
  ]
  for (const k of keys) {
    if (!k) continue
    const dec = await decrypt(input, k)
    if (
      dec !== input &&
      (dec.startsWith('/') || dec.startsWith('~') || /^https?:/i.test(dec))
    ) {
      return dec
    }
  }
  return input
}

const onPrintReady = () => {
  show()
}

async function loadTarget(): Promise<void> {
  const isFailView = typeof localStorage !== 'undefined' && localStorage.getItem('failView') === 'true'
  if (isFailView && isEncTag) {
    failed.value = true
    src.value = null
    return
  }

  const path = await resolveContent(raw)
  if (isEncrypted && path === raw) {
    failed.value = true
    src.value = null
    return
  }

  failed.value = false
  target.value = toCdnUrl(path)
  if (src.value != null) {
    src.value = target.value
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  await loadTarget()

  const el = box.value
  if (!el) return

  // 挂载 Markdown / 纯文本转换协议
  ;(el as any)._toMarkdown = () => {
    const url = target.value || props.content
    const alt = props.title || 'video'
    return `\n\n[视频: ${alt}](${url})\n\n`
  }
  ;(el as any)._toText = () => {
    return props.title ? `[视频: ${props.title}]` : '[视频]'
  }

  window.addEventListener('before-blog-print', onPrintReady)
  window.addEventListener('fail-view-change', loadTarget)

  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            observer?.disconnect()
            show()
          }
        })
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
  } else {
    show()
  }
})

function show(): void {
  if (src.value == null && target.value) {
    src.value = target.value
  }
}

onUnmounted(() => {
  observer?.disconnect()
  if (typeof window !== 'undefined') {
    window.removeEventListener('before-blog-print', onPrintReady)
    window.removeEventListener('fail-view-change', loadTarget)
  }
})

function onLoaded(): void {
  loaded.value = true
}

function onError(): void {
  if (!failed.value) {
    failed.value = true
    loaded.value = true
  }
}
</script>

<style scoped>
.vvid-box {
  position: relative;
  display: block;
  margin: 1.5em auto;
  text-align: center;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 8px;
}

.vvid-box.is-loading {
  min-height: 220px;
  min-width: 280px;
  background: var(--vp-c-bg-soft, rgba(125, 125, 125, 0.08));
  border: 1px solid var(--vp-c-gutter, rgba(125, 125, 125, 0.12));
}

.vvid-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

.vvid-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 100%
  );
  animation: vvid-shimmer 1.8s infinite;
  transform: translateX(-100%);
}

@keyframes vvid-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.vvid-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-3, rgba(125, 125, 125, 0.5));
}

.vvid-spin-icon {
  animation: vvid-spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes vvid-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.vvid-main {
  display: block;
  max-width: 100%;
  border-radius: 8px;
  opacity: 0;
  transform: scale(0.99);
  transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  background: #000;
}

.vvid-main.loaded {
  opacity: 1;
  transform: scale(1);
}

.vvid-caption {
  display: block;
  margin-top: 0.6em;
  font-size: 0.88rem;
  color: var(--vp-c-text-2, #888);
  text-align: center;
}

.vvid-failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5em 1em;
  background: var(--vp-c-bg-soft, rgba(125, 125, 125, 0.06));
  border: 1px dashed var(--vp-c-gutter, rgba(125, 125, 125, 0.15));
  border-radius: 8px;
  color: var(--vp-c-text-3, #999);
  gap: 0.6em;
}

.vvid-failed-icon {
  opacity: 0.7;
}

.vvid-failed-text {
  font-size: 0.88rem;
}
</style>
