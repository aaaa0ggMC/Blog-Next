<template>
  <span ref="box" class="vimg-box" :class="{ 'is-loading': !loaded && !failed }" :style="boxStyle">
    <!-- Shimmer Skeleton & Spinner while loading -->
    <div v-if="!loaded && !failed" class="vimg-skeleton">
      <div class="vimg-shimmer"></div>
      <div class="vimg-spinner">
        <svg class="vimg-spin-icon" viewBox="0 0 24 24" width="24" height="24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="36" stroke-linecap="round" opacity="0.75" />
        </svg>
      </div>
    </div>

    <!-- Main Image -->
    <img
      v-if="src"
      class="vimg-main"
      :class="{ loaded }"
      :src="src"
      :style="imgStyle"
      :title="title"
      :alt="title || 'image'"
      loading="lazy"
      @load="onLoad"
      @error="onError"
      @dblclick="onDblClick"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { decrypt, isBase64Cipher } from '../../scripts/crypto'
import {
  base,
  cdn_base,
  fallback_img,
  ekey_norm,
  ekey_priv,
  ekey_teacher,
} from '../../scripts/Data'
import { openViewer } from '../stores/viewerStore'

const props = withDefaults(
  defineProps<{
    content: string
    title?: string
    width?: string | number
    height?: string | number
    fit?: 'cover' | 'contain' | 'fill'
    objectPosition?: string
    noMangle?: boolean
    no_mangle?: boolean
    raw?: boolean
    encrypt?: boolean
    level?: string
  }>(),
  {},
)

const raw = props.content.trim()
const isEncrypted = isBase64Cipher(raw)
const isEncTag = isEncrypted || props.encrypt || !!props.level

const box = ref<HTMLElement | null>(null)
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
  }

  if (props.width != null) {
    const w = String(props.width).trim()
    s.width = '100%'
    s.maxWidth = /^\d+$/.test(w) ? `${w}px` : w
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

const imgStyle = computed(() => {
  const s: Record<string, string> = {
    maxWidth: '100%',
    display: 'block',
  }

  if (props.fit || props.objectPosition || props.height != null) {
    s.width = '100%'
    s.height = '100%'
    s.objectFit = props.fit || 'cover'
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
    if (localStorage.getItem('useLocal') === 'true') {
      return base + 'res' + path
    }
    const userDef = localStorage.getItem('userDef')
    if (userDef != null && userDef !== '') {
      const up = userDef.endsWith('/') ? userDef.slice(0, -1) : userDef
      return up + path
    }
    return cdn_base + path
  }
  return path
}

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
    target.value = base + 'fallback.png'
    if (src.value != null) src.value = target.value
    return
  }

  const path = await resolveContent(raw)
  if (isEncrypted && path === raw) {
    failed.value = true
    target.value = base + 'fallback.png'
    if (src.value != null) src.value = target.value
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
    const alt = props.title || 'image'
    return `\n\n![${alt}](${url})\n\n`
  }
  ;(el as any)._toText = () => {
    return props.title ? `[图片: ${props.title}]` : '[图片]'
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
  if (src.value == null && target.value) src.value = target.value
}

onUnmounted(() => {
  observer?.disconnect()
  if (typeof window !== 'undefined') {
    window.removeEventListener('before-blog-print', onPrintReady)
    window.removeEventListener('fail-view-change', loadTarget)
  }
})

function onLoad(): void {
  loaded.value = true
}

function onError(): void {
  if (!failed.value) {
    failed.value = true
    src.value = base + 'fallback.png'
  }
}

function onDblClick(): void {
  const isFailView = typeof localStorage !== 'undefined' && localStorage.getItem('failView') === 'true'
  if ((isFailView && isEncTag) || failed.value) return
  if (target.value) openViewer(target.value, props.title)
}
</script>

<style scoped>
.vimg-box {
  position: relative;
  display: block;
  margin: 1.2em auto;
  text-align: center;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 8px;
}

.vimg-box.is-loading {
  min-height: 160px;
  min-width: 240px;
  background: var(--vp-c-bg-soft, rgba(125, 125, 125, 0.08));
  border: 1px solid var(--vp-c-gutter, rgba(125, 125, 125, 0.12));
}

.vimg-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

.vimg-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 100%
  );
  animation: vimg-shimmer 1.8s infinite;
  transform: translateX(-100%);
}

@keyframes vimg-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.vimg-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-3, rgba(125, 125, 125, 0.5));
}

.vimg-spin-icon {
  animation: vimg-spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes vimg-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.vimg-main {
  display: inline-block;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: zoom-in;
  opacity: 0;
  transform: scale(0.985);
  transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  vertical-align: middle;
}

.vimg-main.loaded {
  opacity: 1;
  transform: scale(1);
}
</style>

