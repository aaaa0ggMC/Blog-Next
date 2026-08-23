<template>
  <Teleport to="body">
    <Transition name="vimg-fade">
      <div
        v-if="state.visible"
        class="vimg-viewer"
        @wheel.prevent="onWheel"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @click.self="close"
      >
        <img
          ref="imgEl"
          class="vimg-viewer-img"
          :src="state.src"
          :alt="state.title || 'image'"
          :style="{ transform: imgTransform }"
          draggable="false"
          @load="onLoad"
          @error="onImgError"
        />
        <div class="vimg-viewer-topbar">
          <span class="vimg-viewer-title">{{ state.title }}</span>
          <span class="vimg-viewer-scale">{{ Math.round(scale * 100) }}%</span>
        </div>
        <div class="vimg-viewer-toolbar">
          <button class="vimg-viewer-btn" title="放大" @click.stop="zoom(1.25)" v-html="iconZoomIn" />
          <button class="vimg-viewer-btn" title="缩小" @click.stop="zoom(0.8)" v-html="iconZoomOut" />
          <button class="vimg-viewer-btn" title="适应窗口" @click.stop="fit" v-html="iconFit" />
          <button class="vimg-viewer-btn" title="下载" @click.stop="download" v-html="iconDownload" />
          <button class="vimg-viewer-btn" title="关闭" @click.stop="close" v-html="iconClose" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { base, cdn_base } from '../../scripts/Data'
import { viewerState, closeViewer } from '../stores/viewerStore'

const state = viewerState

const imgEl = ref<HTMLImageElement | null>(null)
const scale = ref(1)
const px = ref(0)
const py = ref(0)
const natW = ref(1)
const natH = ref(1)
const vw = ref(0)
const vh = ref(0)
let dragging = false
let lastX = 0
let lastY = 0

const imgTransform = computed(
  () => `translate(${px.value}px, ${py.value}px) scale(${scale.value})`,
)

function updateViewport(): void {
  vw.value = window.innerWidth
  vh.value = window.innerHeight
}

function reset(): void {
  scale.value = 1
  px.value = 0
  py.value = 0
}

function fit(): void {
  if (!natW.value || !natH.value) return
  const pad = 96
  const s = Math.min(
    1,
    (vw.value - pad) / natW.value,
    (vh.value - pad) / natH.value,
  )
  scale.value = s
  px.value = (vw.value - natW.value * s) / 2
  py.value = (vh.value - natH.value * s) / 2
}

function onLoad(e: Event): void {
  const img = e.target as HTMLImageElement
  natW.value = img.naturalWidth || 1
  natH.value = img.naturalHeight || 1
  fit()
}

function clampScale(v: number): number {
  return Math.min(8, Math.max(0.2, v))
}

function zoom(factor: number, cx?: number, cy?: number): void {
  const cxs = cx ?? vw.value / 2
  const cys = cy ?? vh.value / 2
  const ns = clampScale(scale.value * factor)
  const k = ns / scale.value
  px.value = cxs + (px.value - cxs) * k
  py.value = cys + (py.value - cys) * k
  scale.value = ns
}

function onWheel(e: WheelEvent): void {
  zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY)
}

function onMouseDown(e: MouseEvent): void {
  if (e.button !== 0) return
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
}

function onMouseMove(e: MouseEvent): void {
  if (!dragging) return
  px.value += e.clientX - lastX
  py.value += e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
}

function onMouseUp(): void {
  dragging = false
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
  if (e.key === '+' || e.key === '=') zoom(1.25)
  if (e.key === '-') zoom(0.8)
}

function close(): void {
  closeViewer()
  reset()
}

async function download(): Promise<void> {
  try {
    const resp = await fetch(state.src)
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = state.title || 'image'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.open(state.src, '_blank')
  }
}

function onImgError(): void {
  const fallbackUrl = base + 'fallback.png'
  if (state.src !== fallbackUrl) state.src = fallbackUrl
}

watch(
  () => viewerState.visible,
  (v) => {
    if (v) {
      updateViewport()
      reset()
      const img = imgEl.value
      if (img && img.complete && img.naturalWidth) {
        natW.value = img.naturalWidth
        natH.value = img.naturalHeight
        fit()
      }
    }
  },
)

onMounted(() => {
  updateViewport()
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', updateViewport)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', updateViewport)
})

const iconZoomIn =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>'
const iconZoomOut =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>'
const iconFit =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>'
const iconDownload =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
const iconClose =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
</script>

<style scoped>
.vimg-fade-enter-active,
.vimg-fade-leave-active {
  transition: opacity 0.25s ease;
}

.vimg-fade-enter-from,
.vimg-fade-leave-to {
  opacity: 0;
}

.vimg-viewer {
  position: fixed;
  inset: 0;
  z-index: 1000000;
  background: rgba(0, 0, 0, 0.75);
  overflow: hidden;
  cursor: grab;
}

.vimg-viewer:active {
  cursor: grabbing;
}

.vimg-viewer-img {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  max-height: none;
  transform-origin: 0 0;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
}

.vimg-viewer-topbar {
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  pointer-events: none;
}

.vimg-viewer-title {
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
  font-size: 14px;
  opacity: 0.85;
}

.vimg-viewer-scale {
  color: #fff;
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
  opacity: 0.7;
}

.vimg-viewer-toolbar {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}

.vimg-viewer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.vimg-viewer-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(1.08);
}
</style>
