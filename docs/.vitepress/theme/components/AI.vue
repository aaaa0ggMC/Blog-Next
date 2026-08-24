<template>
  <!-- 当开启全局 AI 展示时：渲染 AI 内容块 -->
  <Transition name="ai-fade">
    <div
      v-if="isAiGloballyVisible"
      ref="rootEl"
      class="ai-block-wrap"
      :class="{ 'is-collapsed': isLocalCollapsed }"
    >
      <!-- 头部标识栏 -->
      <div class="ai-block-header no-copy no-print" data-copy-ignore="true">
        <div class="ai-badge-left">
          <span class="ai-sparkle-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
            </svg>
          </span>
          <span class="ai-badge-title">{{ badge || 'AI 生成内容' }}</span>

          <!-- Meta / Prompt 胶囊 -->
          <span
            v-if="resolvedMeta"
            class="ai-meta-tag"
            :title="resolvedMeta"
            @click="isPromptExpanded = !isPromptExpanded"
          >
            <span class="ai-meta-label">Prompt:</span>
            <span class="ai-meta-text">{{ resolvedMeta }}</span>
          </span>
        </div>

        <div class="ai-badge-right">
          <!-- 局部折叠按钮 -->
          <button
            class="ai-collapse-btn"
            :title="isLocalCollapsed ? '展开 AI 内容' : '折叠 AI 内容'"
            :aria-label="isLocalCollapsed ? '展开' : '折叠'"
            @click="isLocalCollapsed = !isLocalCollapsed"
          >
            <svg
              class="ai-chevron-icon"
              :class="{ 'is-rotated': isLocalCollapsed }"
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- 展开的 Prompt 详情抽屉 (若点击) -->
      <div
        v-if="resolvedMeta && isPromptExpanded && !isLocalCollapsed"
        class="ai-prompt-drawer no-copy no-print"
        data-copy-ignore="true"
      >
        <span class="ai-drawer-title">生成描述 / Prompt：</span>
        <code>{{ resolvedMeta }}</code>
      </div>

      <!-- 正文 Slot 区域 -->
      <div v-show="!isLocalCollapsed" ref="slotEl" class="ai-content-slot">
        <slot />
      </div>
    </div>

    <!-- 当禁用全局 AI 展示时：若配置了 fallback 则显示提示与一键开启按钮 -->
    <div
      v-else-if="hasFallback"
      ref="rootEl"
      class="ai-fallback-card no-print"
    >
      <div class="ai-fallback-inner">
        <div class="ai-fallback-info">
          <span class="ai-fallback-icon">✨</span>
          <span class="ai-fallback-text">
            {{ resolvedFallbackText }}
          </span>
        </div>
        <button
          class="ai-enable-btn no-copy"
          data-copy-ignore="true"
          title="点击开启全局 AI 内容展示"
          @click="handleEnableAi"
        >
          开启 AI 内容展示
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { isAiGloballyVisible, setGlobalAi } from '../stores/aiStore'
import {
  serializeChildrenToMarkdown,
  serializeChildrenToText,
} from '../../scripts/exporter'

const DEFAULT_FALLBACK_TEXT = '此处为 AI 生成内容，你已在设置中关闭展示。'

const props = defineProps<{
  prompt?: string
  meta?: string
  desc?: string
  model?: string
  badge?: string
  fallback?: boolean | string
}>()

const rootEl = ref<HTMLElement | null>(null)
const slotEl = ref<HTMLElement | null>(null)
const isLocalCollapsed = ref(false)
const isPromptExpanded = ref(false)

const resolvedMeta = computed(() => {
  const parts: string[] = []
  if (props.model) parts.push(`Model: ${props.model}`)
  const desc = props.prompt || props.meta || props.desc
  if (desc) parts.push(desc)
  return parts.join(' | ').trim()
})

const hasFallback = computed(() => {
  return props.fallback !== undefined && props.fallback !== null && (props.fallback as any) !== false
})

const resolvedFallbackText = computed(() => {
  if (!hasFallback.value) return ''
  if (typeof props.fallback === 'string' && props.fallback.trim() !== '') {
    return props.fallback.trim()
  }
  return DEFAULT_FALLBACK_TEXT
})

const handleEnableAi = () => {
  setGlobalAi(true)
  if (typeof window !== 'undefined' && (window as any).narn) {
    ;(window as any).narn('success', '已开启 AI 增强内容展示', 2000, '偏好设置')
  }
}

const mountProtocols = () => {
  const el = rootEl.value
  if (!el) return

  ;(el as any)._toMarkdown = () => {
    // 1. 如果全局隐藏 AI
    if (!isAiGloballyVisible.value) {
      if (hasFallback.value) {
        const fbText = resolvedFallbackText.value
        return `\n\n> 💡 *[AI 内容已隐藏]* ${fbText}\n\n`
      }
      return ''
    }

    // 2. 正常输出 AI 块
    const targetSlot = slotEl.value || el.querySelector('.ai-content-slot') || el
    const innerMd = serializeChildrenToMarkdown(targetSlot).trim()
    const metaStr = resolvedMeta.value ? ` [ ${resolvedMeta.value} ] ` : ''
    const header = `----- AI GENERATED${metaStr ? ' ' + metaStr + ' ' : ' '}-----`
    const footer = `----------------------------------`

    return `\n\n${header}\n${innerMd}\n${footer}\n\n`
  }

  ;(el as any)._toText = () => {
    if (!isAiGloballyVisible.value) {
      if (hasFallback.value) {
        const fbText = resolvedFallbackText.value
        return `\n[AI 内容已隐藏: ${fbText}]\n`
      }
      return ''
    }

    const targetSlot = slotEl.value || el.querySelector('.ai-content-slot') || el
    const innerText = serializeChildrenToText(targetSlot).trim()
    const metaStr = resolvedMeta.value ? ` [ ${resolvedMeta.value} ]` : ''
    const header = `[AI 生成内容${metaStr}]`
    const footer = `[/AI 生成内容]`

    return `\n\n${header}\n${innerText}\n${footer}\n\n`
  }
}

onMounted(() => {
  nextTick(() => {
    mountProtocols()
  })
})
</script>

<style scoped>
.ai-block-wrap {
  margin: 1.5em 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-block-wrap:hover {
  border-color: var(--vp-c-brand-soft, var(--vp-c-brand));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

/* 顶部徽章与操作栏 */
.ai-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 12px;
  user-select: none;
}

.ai-badge-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ai-sparkle-icon {
  display: inline-flex;
  align-items: center;
  color: var(--vp-c-brand);
  animation: ai-sparkle 3s ease-in-out infinite alternate;
}

@keyframes ai-sparkle {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.ai-badge-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: 0.2px;
  white-space: nowrap;
}

/* Prompt 标签 */
.ai-meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  background: var(--vp-c-bg-alt, rgba(125, 125, 125, 0.08));
  border: 1px solid var(--vp-c-divider);
  border-radius: 9999px;
  font-size: 11px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  max-width: 260px;
  transition: all 0.2s ease;
}

.ai-meta-tag:hover {
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand-soft, var(--vp-c-brand));
  background: var(--vp-c-bg);
}

.ai-meta-label {
  opacity: 0.7;
  font-weight: 500;
}

.ai-meta-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 折叠按钮 */
.ai-collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--vp-c-text-3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-collapse-btn:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-alt);
}

.ai-chevron-icon {
  transition: transform 0.25s ease;
}

.ai-chevron-icon.is-rotated {
  transform: rotate(-90deg);
}

/* Prompt 抽屉 */
.ai-prompt-drawer {
  padding: 8px 12px;
  background: var(--vp-c-bg);
  border-bottom: 1px dashed var(--vp-c-divider);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.ai-drawer-title {
  font-weight: 500;
  margin-right: 6px;
}

.ai-prompt-drawer code {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--vp-c-bg-mute);
  font-size: 11.5px;
  word-break: break-all;
}

/* 正文槽 */
.ai-content-slot {
  padding: 12px 16px;
}

.ai-content-slot > :first-child {
  margin-top: 0 !important;
}

.ai-content-slot > :last-child {
  margin-bottom: 0 !important;
}

/* Fallback 卡片 */
.ai-fallback-card {
  margin: 1.2em 0;
  padding: 10px 14px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.ai-fallback-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ai-fallback-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}

.ai-fallback-icon {
  color: var(--vp-c-brand);
}

.ai-enable-btn {
  padding: 3px 10px;
  border: 1px solid var(--vp-c-brand-soft, var(--vp-c-brand));
  border-radius: 6px;
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.08));
  color: var(--vp-c-brand);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ai-enable-btn:hover {
  background: var(--vp-c-brand);
  color: #fff;
}

/* 动效 */
.ai-fade-enter-active,
.ai-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-fade-enter-from,
.ai-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
