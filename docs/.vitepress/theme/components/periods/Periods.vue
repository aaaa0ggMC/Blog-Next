<template>
  <div class="periods-container">
    <div class="periods-stage">
      <slot />
    </div>
    <div v-if="total > 1" class="periods-controls">
      <button
        class="ctrl-btn nav-btn"
        @click="state.go(-1)"
        title="上一个时期 (快捷键: ←)"
        aria-label="上一个时期"
      >
        <span class="nav-arrow">‹</span>
        <span class="nav-label">上一个时期</span>
      </button>
      <span class="period-count" :style="{ '--counter-ch': `${counterDigits}ch` }">
        <span class="counter-num">{{ state.active + 1 }}</span>
        <span class="counter-sep">/</span>
        <span class="counter-num">{{ total }}</span>
      </span>
      <button
        class="ctrl-btn nav-btn"
        @click="state.go(1)"
        title="下一个时期 (快捷键: →)"
        aria-label="下一个时期"
      >
        <span class="nav-label">下一个时期</span>
        <span class="nav-arrow">›</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, provide, useSlots, onMounted, onUnmounted, nextTick, computed, type VNode } from 'vue'
import { PeriodsKey, type PeriodRole } from '../../stores/periods'
import { tryDecrypt } from '../../../scripts/Decryptor'

const slots = useSlots()

function countPeriods(nodes: VNode[]): number {
  let n = 0
  const walk = (v: VNode) => {
    const type = v.type as any
    if (type && (type.__name === 'NewPeriod' || type.name === 'NewPeriod')) n++
    else if (Array.isArray(v.children)) v.children.forEach(walk)
  }
  nodes.forEach(walk)
  return n
}

const total = countPeriods(slots.default?.() ?? [])

// 计数器的位数：固定宽度渲染「当前 / 总数」，避免切换时期时按钮宽度变化导致整行重排
const counterDigits = computed(() => Math.max(2, String(total || 1).length))

const state = reactive({
  active: 0,
  nextKey: 0,
  go(delta: number) {
    if (total <= 1) return
    this.active = (this.active + delta + total) % total
    nextTick(() => {
      tryDecrypt()
    })
  },
  roleOf(key: number): PeriodRole {
    if (total <= 1) return 'center'
    if (key === this.active) return 'center'
    const rightKey = (this.active + 1) % total
    const leftKey = (this.active - 1 + total) % total

    if (total === 2) {
      return key === rightKey ? 'right' : 'hidden'
    }

    if (key === leftKey) return 'left'
    if (key === rightKey) return 'right'
    return 'hidden'
  },
})

provide(PeriodsKey, state)

function handleKeydown(e: KeyboardEvent) {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
  if (e.key === 'ArrowLeft') {
    state.go(-1)
  } else if (e.key === 'ArrowRight') {
    state.go(1)
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
  nextTick(() => {
    tryDecrypt()
  })
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.periods-container {
  margin: 20px 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.periods-stage {
  position: relative;
  width: 100%;
  max-width: 680px;
  height: clamp(440px, 64vh, 580px);
  margin: 10px 0 24px;
  --fan-ax: clamp(40px, 8vw, 90px);
  --fan-a: 9deg;
}

.periods-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  /* 按钮数量固定，禁止换行，避免切换时期时按钮错行 */
  flex-wrap: nowrap;
}

.period-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.counter-num {
  display: inline-block;
  min-width: var(--counter-ch, 2ch);
  text-align: center;
}

.counter-sep {
  opacity: 0.6;
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
  -webkit-tap-highlight-color: transparent;
}

.ctrl-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  background: var(--vp-c-bg-elv);
}

.period-count {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .periods-stage {
    height: 460px;
    --fan-ax: 30px;
    --fan-a: 6deg;
  }
  .ctrl-btn {
    padding: 0 12px;
    font-size: 12px;
  }
}

/* 极窄屏：只保留箭头，保证三个元素始终同一行 */
@media (max-width: 420px) {
  .periods-controls {
    gap: 8px;
  }
  .ctrl-btn {
    padding: 0 10px;
  }
  .ctrl-btn .nav-label {
    display: none;
  }
}
</style>
