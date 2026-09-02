<template>
  <section class="period-card" :class="role" @click="onClick">
    <header class="period-card-head">
      <h3 class="period-card-title">{{ title }}</h3>
    </header>
    <div class="period-card-body custom-scroll vp-doc">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { PeriodsKey, type PeriodRole } from '../../stores/periods'

defineOptions({ name: 'NewPeriod' })

const props = defineProps<{ title: string }>()

const state = inject(PeriodsKey)

const key = state ? state.nextKey++ : 0

const role = computed<PeriodRole>(() => (state ? state.roleOf(key) : 'center'))

function onClick() {
  if (!state || role.value === 'center') return
  state.go(role.value === 'right' ? 1 : -1)
}
</script>

<style scoped>
.period-card {
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
  -webkit-tap-highlight-color: transparent;
}

.period-card.center {
  transform: translateX(-50%);
  z-index: 4;
  opacity: 1;
  filter: none;
}

.period-card.left {
  transform: translateX(calc(-50% - var(--fan-ax))) rotate(calc(-1 * var(--fan-a)));
  z-index: 2;
  cursor: pointer;
  opacity: 0.85;
  filter: brightness(0.95);
}

.period-card.right {
  transform: translateX(calc(-50% + var(--fan-ax))) rotate(var(--fan-a));
  z-index: 2;
  cursor: pointer;
  opacity: 0.85;
  filter: brightness(0.95);
}

.period-card.left:hover {
  transform: translateX(calc(-50% - var(--fan-ax))) rotate(calc(-1 * var(--fan-a))) scale(1.03);
  opacity: 0.95;
}

.period-card.right:hover {
  transform: translateX(calc(-50% + var(--fan-ax))) rotate(var(--fan-a)) scale(1.03);
  opacity: 0.95;
}

.period-card.hidden {
  display: none;
}

.period-card-head {
  flex: 0 0 auto;
  padding: 16px 20px 12px;
  border-bottom: 1px dashed var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  text-align: center;
}

.period-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

.period-card-body {
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: auto;
  padding: 18px 20px;
  min-height: 0;
  line-height: 1.68;
}

.period-card-body :deep(p) {
  margin: 10px 0;
  text-indent: 1em;
}

.period-card-body :deep(p[align]),
.period-card-body :deep(p.leave),
.period-card-body :deep(p.ins),
.period-card-body :deep(p.ps),
.period-card-body :deep(.custom-block p),
.period-card-body :deep(blockquote p),
.period-card-body :deep(pre p),
.period-card-body :deep(li p) {
  text-indent: 0;
}

.period-card-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 10px auto;
  display: block;
}

.period-card-body :deep(pre) {
  border-radius: 8px;
  padding: 12px 14px;
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
  .period-card {
    width: 90%;
  }
}
</style>
