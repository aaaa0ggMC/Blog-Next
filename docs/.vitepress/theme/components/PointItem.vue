<template>
  <div class="point-item-card" :class="{ 'is-highlight': highlight }">
    <!-- 头部：序号 + 标题 + 标签 -->
    <div class="point-header">
      <div class="point-header-left">
        <span v-if="num" class="point-badge-num">{{ formattedNum }}</span>
        <h4 class="point-title">
          <slot name="title">{{ title }}</slot>
        </h4>
      </div>
      <span v-if="tag" class="point-tag-chip">{{ tag }}</span>
    </div>

    <!-- 主体说明区 -->
    <div class="point-body">
      <!-- 起因 / 背景 (Origin) -->
      <div v-if="originText || $slots.o || $slots.origin" class="point-row row-origin">
        <span class="point-field-badge badge-origin">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" class="badge-icon">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          <span>Origin</span>
        </span>
        <div class="point-field-text">
          <slot name="o"><slot name="origin">{{ originText }}</slot></slot>
        </div>
      </div>

      <!-- 核心要点 (Key Points) -->
      <div v-if="keyText || $slots.k || $slots.key" class="point-row row-key">
        <span class="point-field-badge badge-key">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" class="badge-icon">
            <line x1="9" y1="18" x2="15" y2="18"></line>
            <line x1="10" y1="22" x2="14" y2="22"></line>
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
          </svg>
          <span>Key</span>
        </span>
        <div class="point-field-text">
          <slot name="k"><slot name="key">{{ keyText }}</slot></slot>
        </div>
      </div>

      <!-- 举例 / 案例 (Example) -->
      <div v-if="exampleText || $slots.eg || $slots.example" class="point-row row-example">
        <span class="point-field-badge badge-example">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" class="badge-icon">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span>EG</span>
        </span>
        <div class="point-field-text">
          <slot name="eg"><slot name="example">{{ exampleText }}</slot></slot>
        </div>
      </div>

      <!-- 追问 / 思考 (Question) -->
      <div v-if="questionText || $slots.q || $slots.ques" class="point-row row-question">
        <span class="point-field-badge badge-question">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" class="badge-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Ques</span>
        </span>
        <div class="point-field-text">
          <slot name="q"><slot name="ques">{{ questionText }}</slot></slot>
        </div>
      </div>

      <!-- 行动 / 计划 (Action) -->
      <div v-if="actionText || $slots.act || $slots.todo" class="point-row row-action">
        <span class="point-field-badge badge-action">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" class="badge-icon">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span>Action</span>
        </span>
        <div class="point-field-text">
          <slot name="act"><slot name="todo">{{ actionText }}</slot></slot>
        </div>
      </div>

      <!-- 默认插槽（通用说明长段落正文） -->
      <div v-if="$slots.default" class="point-content">
        <slot />
      </div>

      <!-- 补充说明 (By the way / PS) -->
      <div v-if="btwText || $slots.btw || $slots.ps" class="point-row row-btw">
        <span class="point-field-badge badge-btw">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" class="badge-icon">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
          <span>BTW</span>
        </span>
        <div class="point-field-text">
          <slot name="btw"><slot name="ps">{{ btwText }}</slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title?: string
  num?: string | number
  tag?: string
  highlight?: boolean
  // Origin
  o?: string
  origin?: string
  // Key points
  k?: string
  keyPoint?: string
  // Example
  eg?: string
  example?: string
  // By the way
  btw?: string
  ps?: string
  // Question
  q?: string
  ques?: string
  // Action
  act?: string
  todo?: string
}>()

const formattedNum = computed(() => {
  if (props.num === undefined || props.num === null || props.num === '') return ''
  const n = Number(props.num)
  if (!isNaN(n) && n > 0 && n < 10) {
    return `0${n}`
  }
  return String(props.num)
})

const originText = computed(() => props.o || props.origin || '')
const keyText = computed(() => props.k || props.keyPoint || '')
const exampleText = computed(() => props.eg || props.example || '')
const btwText = computed(() => props.btw || props.ps || '')
const questionText = computed(() => props.q || props.ques || '')
const actionText = computed(() => props.act || props.todo || '')
</script>

<style scoped>
.point-item-card {
  position: relative;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 14px 16px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.point-item-card:hover {
  border-color: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.point-item-card.is-highlight {
  border-color: rgba(255, 122, 69, 0.45);
  background: linear-gradient(to bottom right, var(--vp-c-bg-soft), rgba(255, 122, 69, 0.04));
}

/* 头部 */
.point-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.point-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.point-badge-num {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--vp-c-brand);
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.12);
  border: 1px solid rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.25);
  border-radius: 6px;
  min-width: 24px;
  height: 22px;
  padding: 0 5px;
  line-height: 1;
}

.point-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--vp-c-text-1);
}

.point-tag-chip {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

/* 说明区 */
.point-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.point-content {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  text-indent: 0 !important;
}

.point-content :deep(p) {
  margin: 4px 0;
  text-indent: 0 !important;
}

.point-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13.5px;
  line-height: 1.6;
}

.point-field-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  padding: 3px 8px;
  border-radius: 6px;
  margin-top: 2px;
  user-select: none;
}

.badge-icon {
  flex-shrink: 0;
}

.point-field-text {
  flex: 1;
  color: var(--vp-c-text-2);
  text-indent: 0 !important;
}

.point-field-text :deep(p) {
  margin: 0;
  display: inline;
  text-indent: 0 !important;
}

/* 预设徽章色彩体系 */
/* Origin - 薄荷绿/青绿 */
.badge-origin {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

/* Key - 温暖琥珀橙金 */
.badge-key {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Example - 天空蓝/紫色 */
.badge-example {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.25);
}

/* Question - 珊瑚粉/玫瑰红 */
.badge-question {
  background: rgba(244, 63, 94, 0.12);
  color: #f43f5e;
  border: 1px solid rgba(244, 63, 94, 0.25);
}

/* Action - 翠绿/青碧 */
.badge-action {
  background: rgba(6, 182, 212, 0.12);
  color: #0891b2;
  border: 1px solid rgba(6, 182, 212, 0.25);
}

/* BTW / PS - 雅灰/冷紫 */
.badge-btw {
  background: rgba(107, 114, 128, 0.12);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

@media (max-width: 640px) {
  .point-item-card {
    padding: 12px 13px;
  }
  .point-row {
    flex-direction: column;
    gap: 4px;
  }
  .point-field-badge {
    align-self: flex-start;
  }
}
</style>
