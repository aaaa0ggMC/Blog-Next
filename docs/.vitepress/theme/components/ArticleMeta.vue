<template>
  <div class="article-meta-bar">
    <!-- 左侧：字数统计与预计阅读时长 -->
    <div v-if="shouldShow && wordCount > 0" class="meta-group" title="字数统计与阅读时间估算">
      <span class="meta-item">
        <svg
          class="meta-icon"
          viewBox="0 0 24 24"
          width="13"
          height="13"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span class="meta-text">{{ formattedWordCount }} 字</span>
      </span>

      <span class="meta-divider" aria-hidden="true"></span>

      <span class="meta-item">
        <svg
          class="meta-icon"
          viewBox="0 0 24 24"
          width="13"
          height="13"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span class="meta-text">约 {{ readTime }} 分钟</span>
      </span>
    </div>
    <div v-else class="meta-placeholder"></div>

    <!-- 右侧：页面复制按钮 -->
    <div class="meta-right">
      <CopyPageButton />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useData } from 'vitepress'
import CopyPageButton from './CopyPageButton.vue'

const route = useRoute()
const { page, frontmatter } = useData()

const wordCount = ref(0)
const readTime = ref(1)

const shouldShow = computed(() => {
  if (frontmatter.value?.readingTime === false) return false
  if (frontmatter.value?.layout === 'home') return false
  return true
})

const formattedWordCount = computed(() => {
  if (wordCount.value >= 10000) {
    return (wordCount.value / 10000).toFixed(1) + 'w'
  }
  if (wordCount.value >= 1000) {
    return (wordCount.value / 1000).toFixed(1) + 'k'
  }
  return wordCount.value.toLocaleString()
})

function calculateStats() {
  if (typeof document === 'undefined') return

  const docEl = document.querySelector('.vp-doc')
  if (!docEl) {
    wordCount.value = 0
    readTime.value = 1
    return
  }

  const clone = docEl.cloneNode(true) as HTMLElement

  // 移除无需计数的元素
  const removeSelectors = [
    '.copy-code-button',
    '.line-number',
    '.header-anchor',
    '.article-meta-bar',
    '.leave',
    '.timeline-year-node',
    '.giscus',
    'script',
    'style',
    '.crypto-debugger',
    '.archive-controls'
  ]

  removeSelectors.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove())
  })

  const text = clone.textContent || ''

  // 1. 中文/日韩字符统计
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g)
  const cjkCount = cjkMatches ? cjkMatches.length : 0

  // 2. 英文与数字单词统计
  const nonCjkText = text.replace(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g, ' ')
  const wordMatches = nonCjkText.match(/[a-zA-Z0-9_\-\.\/]+/g)
  const wordCountEng = wordMatches ? wordMatches.length : 0

  const total = cjkCount + wordCountEng
  wordCount.value = total
  // 按照平均每分钟 350 字的阅读速率估算
  readTime.value = Math.max(1, Math.ceil(total / 350))
}

function updateStatsWithRetry() {
  nextTick(() => {
    calculateStats()
    setTimeout(calculateStats, 100)
    setTimeout(calculateStats, 400)
  })
}

onMounted(() => {
  updateStatsWithRetry()
})

watch(
  () => route.path,
  () => {
    updateStatsWithRetry()
  }
)
</script>

<style scoped>
.article-meta-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin: 12px 0 16px;
  user-select: none;
}

.meta-placeholder {
  flex: 1;
}

/* 左侧字数与时长胶囊栏（与右侧复制按钮尺寸/配色高度对称） */
.meta-group {
  display: inline-flex;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 2px 10px;
  height: 30px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  gap: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  transition: border-color 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
}

.meta-group:hover {
  border-color: var(--vp-c-brand-soft, var(--vp-c-brand));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: var(--vp-c-text-1);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-variant-numeric: tabular-nums;
}

.meta-icon {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  transition: color 0.2s ease;
}

.meta-group:hover .meta-icon {
  color: var(--vp-c-brand);
}

.meta-divider {
  width: 1px;
  height: 12px;
  background-color: var(--vp-c-divider);
  flex-shrink: 0;
}

.meta-right {
  display: inline-flex;
  align-items: center;
}

@media (max-width: 640px) {
  .article-meta-bar {
    gap: 8px;
  }
  .meta-group {
    padding: 2px 8px;
    gap: 6px;
  }
}
</style>
