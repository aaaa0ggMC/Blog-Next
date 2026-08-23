<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import { getPagePlainText, getPageMarkdown, preparePrint } from '../../scripts/exporter'

const isCopied = ref(false)
const copiedFormat = ref<'plain' | 'formatted' | null>(null)
const isPrinting = ref(false)
const route = useRoute()

let copyTimer: number | null = null

const copyToClipboard = async (format: 'plain' | 'formatted' = 'plain') => {
  try {
    let textToCopy = ''

    if (format === 'plain') {
      textToCopy = getPagePlainText()
    } else {
      textToCopy = getPageMarkdown()
    }

    if (!textToCopy) {
      console.warn('未找到有效页面内容')
      return
    }

    await navigator.clipboard.writeText(textToCopy)

    isCopied.value = true
    copiedFormat.value = format

    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      isCopied.value = false
      copiedFormat.value = null
      copyTimer = null
    }, 1800)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const handlePrint = async () => {
  if (isPrinting.value || typeof window === 'undefined') return
  try {
    isPrinting.value = true
    // 打印前唤醒所有图片与布局
    await preparePrint()
    window.print()
  } catch (err) {
    console.error('触发打印失败:', err)
  } finally {
    setTimeout(() => {
      isPrinting.value = false
    }, 1000)
  }
}

// 监听路由变化
const handleRouteChange = () => {
  isCopied.value = false
  copiedFormat.value = null
  isPrinting.value = false
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
}

watch(
  () => route.path,
  () => {
    handleRouteChange()
  },
)

onUnmounted(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>

<template>
  <div class="copy-page-button no-copy no-print" data-copy-ignore="true">
    <div class="copy-group" :class="{ 'is-copied': isCopied }">
      <!-- 复制纯文本主按钮 -->
      <button
        class="action-btn main-btn"
        @click="copyToClipboard('plain')"
        :class="{ copied: isCopied && copiedFormat === 'plain' }"
        :title="isCopied && copiedFormat === 'plain' ? '已复制纯文本' : '复制页面纯文本'"
        aria-label="复制页面纯文本"
      >
        <span class="icon-wrap">
          <svg
            v-if="!isCopied || copiedFormat !== 'plain'"
            class="icon-svg"
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg
            v-else
            class="icon-svg check-icon"
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="btn-label">{{ isCopied && copiedFormat === 'plain' ? '已复制' : '复制正文' }}</span>
      </button>

      <span class="btn-divider" aria-hidden="true"></span>

      <!-- 复制 Markdown 按钮 -->
      <button
        class="action-btn format-btn"
        @click="copyToClipboard('formatted')"
        :class="{ copied: isCopied && copiedFormat === 'formatted' }"
        :title="isCopied && copiedFormat === 'formatted' ? '已复制 Markdown 格式' : '复制为 Markdown 格式'"
        aria-label="复制为 Markdown"
      >
        <span class="icon-wrap">
          <svg
            v-if="!isCopied || copiedFormat !== 'formatted'"
            class="icon-svg md-icon"
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="currentColor"
          >
            <path
              d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"
            />
            <path
              d="M3 12V6h1.5l1.5 2 1.5-2H9v6H7.5V8.5L6 10.5 4.5 8.5V12H3zm8.5-4.5h1V10h1.5l-2 2-2-2h1.5V7.5z"
            />
          </svg>
          <svg
            v-else
            class="icon-svg check-icon"
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="badge-text">{{ isCopied && copiedFormat === 'formatted' ? '已复制 MD' : 'MD' }}</span>
      </button>

      <span class="btn-divider" aria-hidden="true"></span>

      <!-- 打印 / PDF 导出按钮 -->
      <button
        class="action-btn print-btn"
        @click="handlePrint"
        :class="{ printing: isPrinting }"
        title="打印文章或导出为 PDF"
        aria-label="打印文章"
      >
        <span class="icon-wrap">
          <svg
            class="icon-svg print-icon"
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
        </span>
        <span class="badge-text print-label">{{ isPrinting ? '准备中' : '打印' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.copy-page-button {
  display: inline-flex;
  user-select: none;
}

.copy-group {
  display: inline-flex;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    border-color 0.25s ease,
    background-color 0.25s ease,
    box-shadow 0.25s ease;
}

.copy-group:hover {
  border-color: var(--vp-c-brand-soft, var(--vp-c-brand));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.copy-group.is-copied {
  border-color: var(--vp-c-green-2, #30a46c);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.action-btn:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-mute);
}

.action-btn:active {
  transform: scale(0.97);
}

.action-btn.copied {
  color: var(--vp-c-green-1, #10b981);
  background-color: var(--vp-c-green-soft, rgba(48, 164, 108, 0.12));
}

.action-btn.printing {
  color: var(--vp-c-brand);
  background-color: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.12));
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-svg {
  display: block;
  transition: transform 0.2s ease;
}

.check-icon {
  color: var(--vp-c-green-1, #10b981);
  animation: check-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-pop {
  0% {
    transform: scale(0.5) rotate(-15deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

.btn-divider {
  width: 1px;
  height: 12px;
  background-color: var(--vp-c-divider);
  margin: 0 1px;
}

.badge-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

@media (max-width: 640px) {
  .main-btn .btn-label,
  .print-label {
    display: none;
  }
  .action-btn {
    padding: 3px 6px;
  }
}
</style>
