<template>
  <div ref="rootEl" class="vp-prompt" :class="{ 'is-follow': follow }">
    <div class="vpp-head">
      <span class="vpp-avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      </span>
      <span class="vpp-label">{{ label || (follow ? '追加指令' : 'Prompt') }}</span>
      <span v-if="round" class="vpp-round">Round {{ round }}</span>
      <span v-if="note" class="vpp-note">{{ note }}</span>
    </div>

    <div ref="bodyEl" class="vpp-body" :class="{ 'is-clamped': clampable && !expanded }" :style="clampStyle">
      <slot />
      <div v-if="clampable && !expanded" class="vpp-fade"></div>
    </div>

    <button v-if="clampable" class="vpp-toggle no-print" data-copy-ignore="true" @click="expanded = !expanded">
      {{ expanded ? '收起' : '展开完整 Prompt' }}
      <svg :class="{ 'is-up': expanded }" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    round?: string | number
    note?: string
    /** 追加指令（第二轮及以后），样式更轻 */
    follow?: boolean
    /** 超过该高度（px）自动折叠 */
    maxHeight?: string | number
  }>(),
  { maxHeight: 240 },
)

const rootEl = ref<HTMLElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)
const clampable = ref(false)
const expanded = ref(false)

const limit = computed(() => Number(props.maxHeight) || 240)
const clampStyle = computed(() =>
  clampable.value && !expanded.value ? { maxHeight: `${limit.value}px` } : undefined,
)

let ro: ResizeObserver | null = null

function measure() {
  const el = bodyEl.value
  if (!el || clampable.value) return
  clampable.value = el.scrollHeight > limit.value + 40
}

const onPrint = () => {
  expanded.value = true
}

onMounted(() => {
  nextTick(measure)
  if (typeof ResizeObserver !== 'undefined' && bodyEl.value) {
    ro = new ResizeObserver(measure)
    ro.observe(bodyEl.value)
  }
  window.addEventListener('before-blog-print', onPrint)
})

onUnmounted(() => {
  ro?.disconnect()
  window.removeEventListener('before-blog-print', onPrint)
})
</script>

<style scoped>
.vp-prompt {
  position: relative;
  margin: 16px 0;
  padding: 12px 14px 10px;
  border-radius: 14px 14px 14px 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.vp-prompt.is-follow {
  margin-left: 24px;
  border-style: dashed;
}

.vpp-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.vpp-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: var(--vp-c-bg);
  background: var(--vp-c-text-2);
}

.vpp-label {
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.vpp-round {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.vpp-note {
  color: var(--vp-c-text-3);
}

.vpp-body {
  position: relative;
  overflow: hidden;
}

.vpp-body :deep(div[class*='language-']) {
  margin: 0 !important;
  border-radius: 8px;
}

.vpp-body :deep(pre code) {
  white-space: pre-wrap;
  word-break: break-word;
}

.vpp-body > :deep(:first-child) {
  margin-top: 0;
}

.vpp-body > :deep(:last-child) {
  margin-bottom: 0;
}

.vpp-fade {
  position: absolute;
  inset: auto 0 0 0;
  height: 72px;
  background: linear-gradient(to bottom, transparent, var(--vp-c-bg-soft));
  pointer-events: none;
}

.vpp-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 2px 4px;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--vp-c-brand);
  cursor: pointer;
}

.vpp-toggle svg {
  transition: transform 0.2s ease;
}

.vpp-toggle svg.is-up {
  transform: rotate(180deg);
}

@media print {
  .vpp-body {
    max-height: none !important;
  }
  .vpp-fade {
    display: none;
  }
}
</style>
