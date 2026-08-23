<template>
  <div class="note-cards-container">
    <!-- 顶部标签筛选条 (当存在标签时) -->
    <div v-if="allTags.length > 0" class="note-filter-bar">
      <span class="filter-title">标签筛选：</span>
      <div class="filter-tags">
        <button
          class="tag-btn"
          :class="{ active: selectedTag === '' }"
          @click="selectTag('')"
        >
          全部 ({{ notes.length }})
        </button>
        <button
          v-for="t in allTags"
          :key="t.name"
          class="tag-btn"
          :class="{ active: selectedTag === t.name }"
          @click="selectTag(t.name)"
        >
          # {{ t.name }} ({{ t.count }})
        </button>
      </div>
    </div>

    <!-- 随记卡片 3D 舞台 -->
    <div v-if="currentList.length > 0" class="note-stage">
      <div
        v-for="(note, idx) in visibleNotes"
        :key="note.url"
        class="note-card"
        :class="getCardRole(note.originalIndex)"
        @click="onCardClick(note.originalIndex)"
      >
        <!-- 卡片顶部信息栏 -->
        <header class="note-card-head">
          <div class="note-meta-top">
            <span class="note-date">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {{ note.date }}
            </span>
            <div v-if="note.tags && note.tags.length > 0" class="note-tags">
              <span
                v-for="tag in note.tags"
                :key="tag"
                class="note-tag-chip"
                @click.stop="selectTag(tag)"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
          <h3 class="note-card-title" v-html="note.title"></h3>
        </header>

        <!-- 卡片主体内容 -->
        <div class="note-card-body custom-scroll">
          <div class="note-content vp-doc">
            <component :is="getNoteComponent(note.url)" v-if="getNoteComponent(note.url)" />
          </div>
        </div>

        <!-- 卡片底部链接 -->
        <footer class="note-card-footer">
          <a :href="resolveHref(note.url)" class="note-full-link" title="在单独页面打开">
            <span>单独页面</span>
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </footer>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="note-empty">
      <p>暂无符合条件的随记条目</p>
      <button v-if="selectedTag" class="reset-filter-btn" @click="selectTag('')">清除标签筛选</button>
    </div>

    <!-- 底部集成控制栏 -->
    <div v-if="currentList.length > 0" class="note-controls">
      <!-- 上一篇 -->
      <button
        class="ctrl-btn nav-btn"
        @click="go(-1)"
        title="上一篇 (快捷键: ←)"
        aria-label="上一篇"
      >
        ‹ 上一篇
      </button>

      <!-- 🎲 随机一篇 -->
      <button
        class="ctrl-btn random-btn"
        @click="goRandom"
        title="随机翻阅一篇随记"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"></circle>
          <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"></circle>
          <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"></circle>
          <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"></circle>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
        </svg>
        <span>随机</span>
      </button>

      <!-- 📑 指定跳转与下拉选择 -->
      <div class="jump-selector-wrap">
        <button
          class="ctrl-btn jump-btn"
          @click="toggleJumpSelector"
          title="选择或指定随记跳转"
        >
          <span class="jump-text">
            {{ currentIndex + 1 }} / {{ currentList.length }}
          </span>
          <svg
            class="arrow-icon"
            :class="{ open: isJumpOpen }"
            viewBox="0 0 24 24"
            width="12"
            height="12"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <!-- 下拉弹窗列表 -->
        <div v-if="isJumpOpen" class="jump-dropdown custom-scroll" @click.stop>
          <div class="jump-dropdown-head">
            <span>选择随记 (共 {{ currentList.length }} 篇)</span>
            <button class="close-jump-btn" @click="isJumpOpen = false">✕</button>
          </div>
          <div class="jump-list">
            <button
              v-for="(item, i) in currentList"
              :key="item.url"
              class="jump-item"
              :class="{ active: i === currentIndex }"
              @click="jumpToIndex(i)"
            >
              <span class="item-index">{{ i + 1 }}.</span>
              <span class="item-date">{{ item.date }}</span>
              <span class="item-title" v-html="item.title"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- 下一篇 -->
      <button
        class="ctrl-btn nav-btn"
        @click="go(1)"
        title="下一篇 (快捷键: →)"
        aria-label="下一篇"
      >
        下一篇 ›
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, defineAsyncComponent, shallowRef, type Component } from 'vue'
import { withBase } from 'vitepress'
import { data as rawNotes, type NoteItem } from '../../scripts/notes.data'
import { tryDecrypt } from '../../scripts/Decryptor'

// 动态加载所有随记编译后的 Vue View 组件
const rawNoteModules = import.meta.glob('../../../notes/**/*.md')
const noteComponents: Record<string, Component> = {}

for (const [path, loader] of Object.entries(rawNoteModules)) {
  if (path.endsWith('/index.md') || path.endsWith('index.md')) continue
  const normalized = path
    .replace(/^(\.\.\/)+notes\//, '/notes/')
    .replace(/\.md$/, '')
  noteComponents[normalized] = defineAsyncComponent(loader as any)
}

function getNoteComponent(url: string): Component | null {
  if (!url) return null
  const cleaned = url.replace(/\.md$/, '').replace(/\.html$/, '')
  return noteComponents[cleaned] || null
}

const notes = ref<NoteItem[]>(rawNotes || [])
const selectedTag = ref('')
const currentIndex = ref(0)
const isJumpOpen = ref(false)

// 提取所有标签及对应数量统计
const allTags = computed(() => {
  const map: Record<string, number> = {}
  notes.value.forEach((n) => {
    if (Array.isArray(n.tags)) {
      n.tags.forEach((t) => {
        if (t) map[t] = (map[t] || 0) + 1
      })
    }
  })
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 根据标签筛选后的列表
const currentList = computed(() => {
  if (!selectedTag.value) {
    return notes.value.map((item, originalIndex) => ({ ...item, originalIndex }))
  }
  return notes.value
    .map((item, originalIndex) => ({ ...item, originalIndex }))
    .filter((n) => Array.isArray(n.tags) && n.tags.includes(selectedTag.value))
})

// 仅渲染当前激活项、左项、右项（若条目很多，保证 DOM 极轻量）
const visibleNotes = computed(() => {
  const total = currentList.value.length
  if (total === 0) return []
  if (total <= 3) return currentList.value

  const active = currentIndex.value
  const prevIdx = (active - 1 + total) % total
  const nextIdx = (active + 1) % total

  const indices = Array.from(new Set([prevIdx, active, nextIdx]))
  return indices.map((idx) => currentList.value[idx])
})

function getCardRole(origIndex: number): 'center' | 'left' | 'right' | 'hidden' {
  const total = currentList.value.length
  if (total <= 1) return 'center'

  const currentOrig = currentList.value[currentIndex.value]?.originalIndex
  if (origIndex === currentOrig) return 'center'

  const leftOrig = currentList.value[(currentIndex.value - 1 + total) % total]?.originalIndex
  const rightOrig = currentList.value[(currentIndex.value + 1) % total]?.originalIndex

  if (total === 2) {
    return origIndex === rightOrig ? 'right' : 'hidden'
  }

  if (origIndex === leftOrig) return 'left'
  if (origIndex === rightOrig) return 'right'
  return 'hidden'
}

function onCardClick(origIndex: number) {
  const role = getCardRole(origIndex)
  if (role === 'left') {
    go(-1)
  } else if (role === 'right') {
    go(1)
  }
}

function go(delta: number) {
  const total = currentList.value.length
  if (total <= 1) return
  currentIndex.value = (currentIndex.value + delta + total) % total
  onSlideChange()
}

function goRandom() {
  const total = currentList.value.length
  if (total <= 1) return
  let next = Math.floor(Math.random() * total)
  if (next === currentIndex.value) {
    next = (next + 1) % total
  }
  currentIndex.value = next
  onSlideChange()
}

function jumpToIndex(index: number) {
  if (index >= 0 && index < currentList.value.length) {
    currentIndex.value = index
    isJumpOpen.value = false
    onSlideChange()
  }
}

function toggleJumpSelector() {
  isJumpOpen.value = !isJumpOpen.value
}

function selectTag(tag: string) {
  selectedTag.value = tag
  currentIndex.value = 0
  isJumpOpen.value = false
  onSlideChange()
}

function resolveHref(url: string): string {
  if (!url) return '#'
  const cleaned = url.replace(/\.md$/, '').replace(/\.html$/, '')
  return cleaned.startsWith('/') && !cleaned.startsWith('//') ? withBase(cleaned) : cleaned
}

function onSlideChange() {
  nextTick(() => {
    tryDecrypt()
  })
}

function handleKeydown(e: KeyboardEvent) {
  // 如果在输入框中不拦截
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

  if (e.key === 'ArrowLeft') {
    go(-1)
  } else if (e.key === 'ArrowRight') {
    go(1)
  } else if (e.key === 'Escape' && isJumpOpen.value) {
    isJumpOpen.value = false
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (isJumpOpen.value && !target.closest('.jump-selector-wrap')) {
    isJumpOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('click', handleClickOutside)
  }
  onSlideChange()
  setTimeout(onSlideChange, 200)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('click', handleClickOutside)
  }
})

watch(
  () => currentIndex.value,
  () => {
    onSlideChange()
  }
)
</script>

<style scoped>
.note-cards-container {
  margin: 20px 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* 标签筛选条 */
.note-filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 680px;
  font-size: 13px;
}

.filter-title {
  color: var(--vp-c-text-2);
  font-weight: 600;
  white-space: nowrap;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-btn {
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.tag-btn.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: #fff;
  font-weight: 600;
}

/* 3D 舞台 (仿 about 层叠卡片) */
.note-stage {
  position: relative;
  width: 100%;
  max-width: 680px;
  height: clamp(440px, 64vh, 580px);
  margin: 10px 0 24px;
  --fan-ax: clamp(40px, 8vw, 90px);
  --fan-a: 9deg;
}

.note-card {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: min(84%, 540px);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform-origin: 50% 100%;
  transition: transform 0.4s cubic-bezier(0.34, 1.15, 0.64, 1), opacity 0.3s ease, filter 0.3s ease;
}

.note-card.center {
  transform: translateX(-50%);
  z-index: 4;
  opacity: 1;
  filter: none;
}

.note-card.left {
  transform: translateX(calc(-50% - var(--fan-ax))) rotate(calc(-1 * var(--fan-a)));
  z-index: 2;
  cursor: pointer;
  opacity: 0.85;
  filter: brightness(0.95);
}

.note-card.right {
  transform: translateX(calc(-50% + var(--fan-ax))) rotate(var(--fan-a));
  z-index: 2;
  cursor: pointer;
  opacity: 0.85;
  filter: brightness(0.95);
}

.note-card.left:hover {
  transform: translateX(calc(-50% - var(--fan-ax))) rotate(calc(-1 * var(--fan-a))) scale(1.03);
  opacity: 0.95;
}

.note-card.right:hover {
  transform: translateX(calc(-50% + var(--fan-ax))) rotate(var(--fan-a)) scale(1.03);
  opacity: 0.95;
}

.note-card.hidden {
  display: none;
}

/* 卡片头部 */
.note-card-head {
  flex: 0 0 auto;
  padding: 16px 20px 12px;
  border-bottom: 1px dashed var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.note-meta-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.note-date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
}

.note-tags {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
}

.note-tag-chip {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-brand);
  cursor: pointer;
  transition: background 0.15s ease;
}

.note-tag-chip:hover {
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.15);
}

.note-card-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

/* 卡片主体 */
.note-card-body {
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: auto;
  padding: 18px 20px;
  min-height: 0;
  line-height: 1.68;
}

.note-content :deep(p) {
  margin: 10px 0;
  text-indent: 1em;
}

.note-content :deep(p[align]),
.note-content :deep(p.leave),
.note-content :deep(p.ins),
.note-content :deep(p.ps),
.note-content :deep(.custom-block p),
.note-content :deep(blockquote p),
.note-content :deep(pre p),
.note-content :deep(li p),
.note-content :deep(.timeline-container p),
.note-content :deep(.timeline-title p),
.note-content :deep(.point-list-container p),
.note-content :deep(.point-item-card p),
.note-content :deep(.point-field-text p) {
  text-indent: 0;
}

.note-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 10px auto;
  display: block;
}

.note-content :deep(pre) {
  border-radius: 8px;
  padding: 12px 14px;
}

/* 时间轴 (Timeline) 样式适配 */
.note-content :deep(.timeline-container) {
  position: relative;
  margin: 16px 0 20px 4px;
  padding-left: 18px;
}

.note-content :deep(.timeline-container::before) {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 5px;
  width: 2px;
  background: var(--vp-c-divider);
  border-radius: 1px;
}

.note-content :deep(.timeline-year-node) {
  position: relative;
  display: flex;
  align-items: center;
  margin: 18px 0 10px -18px;
}

.note-content :deep(.timeline-year-dot) {
  position: absolute;
  left: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-brand);
  box-shadow: 0 0 0 3px var(--vp-c-bg);
}

.note-content :deep(.timeline-year-text) {
  margin-left: 22px;
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.note-content :deep(.timeline-item) {
  position: relative;
  display: block;
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.2s ease;
}

.note-content :deep(.timeline-item.is-link) {
  cursor: pointer;
}

.note-content :deep(.timeline-item.is-link:hover) {
  border-color: var(--vp-c-brand);
  transform: translateX(3px);
  background: var(--vp-c-bg-elv);
}

.note-content :deep(.timeline-node) {
  position: absolute;
  left: -17px;
  top: 15px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.note-content :deep(.timeline-item:hover .timeline-node) {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-brand);
  transform: scale(1.15);
}

.note-content :deep(.node-highlight) {
  border-color: #ff7a45;
  background: #ff7a45;
  box-shadow: 0 0 6px rgba(255, 122, 69, 0.5);
}

.note-content :deep(.timeline-item:hover .node-highlight) {
  border-color: #ff6f91;
  background: #ff6f91;
}

.note-content :deep(.timeline-header) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.note-content :deep(.timeline-date) {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-brand);
}

.note-content :deep(.timeline-tag) {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  line-height: 1.2;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

.note-content :deep(.tag-highlight) {
  background: rgba(255, 122, 69, 0.12);
  color: #ff7a45;
  border-color: rgba(255, 122, 69, 0.3);
}

.note-content :deep(.timeline-title) {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.55;
  color: var(--vp-c-text-1);
}

.note-content :deep(.timeline-title > p:first-child) {
  margin-top: 2px;
}

.note-content :deep(.timeline-title > p:last-child) {
  margin-bottom: 2px;
}

.note-content :deep(.title-highlight) {
  background: linear-gradient(120deg, #ff7a45, #ffb347 45%, #ff6f91);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.note-content :deep(.timeline-desc) {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

/* 卡片底部 */
.note-card-footer {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 20px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.note-full-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-decoration: none;
  transition: color 0.2s ease;
}

.note-full-link:hover {
  color: var(--vp-c-brand);
}

/* 控制工具栏 */
.note-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  border-radius: 18px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ctrl-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  background: var(--vp-c-bg-elv);
}

.ctrl-btn.random-btn {
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-brand);
  border-color: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.4);
}

.ctrl-btn.random-btn:hover {
  background: var(--vp-c-brand);
  color: #fff;
}

/* 下拉指定跳转包装 */
.jump-selector-wrap {
  position: relative;
}

.jump-btn {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  gap: 8px;
}

.arrow-icon {
  transition: transform 0.2s ease;
}

.arrow-icon.open {
  transform: rotate(180deg);
}

.jump-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 50;
  padding: 6px 0;
}

.jump-dropdown-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.close-jump-btn {
  background: transparent;
  border: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}

.close-jump-btn:hover {
  color: var(--vp-c-text-1);
}

.jump-list {
  display: flex;
  flex-direction: column;
}

.jump-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 12px;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: background 0.15s ease;
}

.jump-item:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-brand);
}

.jump-item.active {
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.12);
  color: var(--vp-c-brand);
  font-weight: 600;
}

.item-index {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.item-date {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.note-empty {
  padding: 60px 0;
  text-align: center;
  color: var(--vp-c-text-2);
}

.reset-filter-btn {
  margin-top: 10px;
  padding: 6px 14px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-brand);
  cursor: pointer;
}

/* 自定义轻量滚动条 */
.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .note-stage {
    height: 460px;
    --fan-ax: 30px;
    --fan-a: 6deg;
  }
  .note-card {
    width: 90%;
  }
  .ctrl-btn {
    padding: 0 12px;
    font-size: 12px;
  }
}
</style>
