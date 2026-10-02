<template>
  <section ref="rootEl" class="vh" :style="{ '--vh-accent': vendor.color }">
    <div class="vh-glow" aria-hidden="true"></div>

    <div class="vh-main">
      <!-- 左：身份 -->
      <div class="vh-id">
        <div class="vh-chips">
          <span class="vh-model">
            <span class="vh-dot"></span>{{ model || '未知模型' }}
          </span>
          <span v-if="task" class="vh-tasktag">题目 · {{ task }}</span>
          <span v-if="date" class="vh-date">{{ date }}</span>
        </div>
        <p class="vh-verdict" :class="{ 'is-empty': !verdict }">{{ verdict || '还没写一句话评价' }}</p>
        <div v-if="stack.length" class="vh-stack">
          <span v-for="s in stack" :key="s" class="vh-stack-chip">{{ s }}</span>
        </div>
      </div>

      <!-- 右：评分环 -->
      <div class="vh-score" :class="{ 'is-over': overflow, 'is-empty': rating.score === null }">
        <svg viewBox="0 0 100 100" class="vh-ring">
          <circle cx="50" cy="50" r="42" class="vh-ring-bg" />
          <circle
            v-if="rating.score !== null"
            cx="50"
            cy="50"
            r="42"
            class="vh-ring-fg"
            :style="{ strokeDasharray: `${ringLen} ${RING}` }"
          />
        </svg>
        <div class="vh-score-text">
          <template v-if="rating.score !== null">
            <span class="vh-score-num">{{ formatScore(rating.score) }}</span>
            <span class="vh-score-max">/ 10</span>
          </template>
          <span v-else class="vh-score-pending">待评</span>
        </div>
        <div v-if="rating.history.length > 1" class="vh-history">
          <template v-for="(h, i) in rating.history" :key="i">
            <span :class="{ 'is-last': i === rating.history.length - 1 }">{{ formatScore(h) }}</span>
            <span v-if="i < rating.history.length - 1" class="vh-arrow">→</span>
          </template>
        </div>
        <div v-if="selfRating.score !== null" class="vh-self" title="模型对自己作品的评分（在看到你的评分之前给出）">
          AI 自评 <b>{{ selfRating.history.map(formatScore).join(' → ') }}</b>
          <span v-if="bias !== null" class="vh-bias" :class="{ up: bias > 0, down: bias < 0 }">{{ formatBias(bias) }}</span>
        </div>
      </div>
    </div>

    <!-- 数据格 -->
    <div v-if="cost.length || length || rounds" class="vh-stats">
      <div v-if="cost.length" class="vh-stat">
        <span class="vh-stat-label">AI 耗时</span>
        <span class="vh-stat-value">
          <template v-for="(c, i) in cost" :key="i">
            <span v-if="i > 0" class="vh-plus">+</span>{{ c }}
          </template>
        </span>
      </div>
      <div v-if="length" class="vh-stat">
        <span class="vh-stat-label">成片时长</span>
        <span class="vh-stat-value">{{ length }}</span>
      </div>
      <div v-if="rounds" class="vh-stat">
        <span class="vh-stat-label">对话轮次</span>
        <span class="vh-stat-value">{{ rounds }}</span>
      </div>
    </div>

    <!-- 额度消耗 -->
    <div v-if="usage.length" class="vh-usage">
      <div class="vh-usage-title">额度消耗</div>
      <div v-for="row in usage" :key="row.label" class="vh-usage-row">
        <span class="vh-usage-label">{{ row.label }}</span>
        <div v-if="row.numeric" class="vh-bar">
          <span class="vh-bar-base" :style="{ width: pct(row.numeric[0]) }"></span>
          <span
            v-for="(seg, i) in segments(row.numeric)"
            :key="i"
            class="vh-bar-seg"
            :style="{ left: pct(seg.from), width: pct(seg.to - seg.from), opacity: segOpacity(i, row.numeric.length - 1) }"
          ></span>
        </div>
        <div v-else class="vh-bar is-text"></div>
        <span class="vh-usage-val">
          {{ row.values.join(' → ') }}
          <b v-if="row.numeric && row.numeric.length > 1" class="vh-delta">+{{ delta(row.numeric) }}</b>
        </span>
      </div>
    </div>

    <!-- 成片 -->
    <div v-if="bvid || video" class="vh-media">
      <div v-if="bvid" class="vh-bili">
        <iframe
          :src="`https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0&high_quality=1`"
          allowfullscreen
          scrolling="no"
          frameborder="0"
          loading="lazy"
        ></iframe>
      </div>
      <Video v-else :content="video" :poster="poster" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import Video from './Video.vue'
import {
  formatBias,
  formatScore,
  parseRating,
  selfBias,
  parseUsage,
  resolveVendor,
  splitPlus,
  toList,
} from '../utils/aivid'

// 所有字段默认读取页面 Frontmatter，传 prop 可覆盖
const props = defineProps<{
  model?: string
  vendor?: string
  rating?: string | number
  selfRating?: string | number
  task?: string
  verdict?: string
  cost?: string
  length?: string
  rounds?: string | number
  stack?: string | string[]
  usage?: string | string[]
  video?: string
  poster?: string
  bvid?: string
}>()

const { frontmatter } = useData()
const snake = (k: string) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
const pick = (k: keyof typeof props) => props[k] ?? frontmatter.value[k] ?? frontmatter.value[snake(k)]

const RING = 2 * Math.PI * 42

const model = computed(() => pick('model') as string | undefined)
const vendor = computed(() => resolveVendor(pick('vendor') as string, model.value))
const rating = computed(() => parseRating(pick('rating')))
const selfRating = computed(() => parseRating(pick('selfRating')))
const bias = computed(() => selfBias(rating.value, selfRating.value))
const task = computed(() => pick('task') as string | undefined)
const verdict = computed(() => pick('verdict') as string | undefined)
const cost = computed(() => splitPlus(pick('cost')))
const length = computed(() => pick('length') as string | undefined)
const rounds = computed(() => pick('rounds'))
const stack = computed(() => toList(pick('stack')))
const usage = computed(() => parseUsage(pick('usage')))
const video = computed(() => pick('video') as string | undefined)
const poster = computed(() => pick('poster') as string | undefined)
const bvid = computed(() => pick('bvid') as string | undefined)

const date = computed(() => {
  const d = frontmatter.value.date
  if (!d) return ''
  const s = d instanceof Date ? d.toISOString().slice(0, 10) : String(d)
  return s.slice(0, 10).replace(/-/g, '/')
})

const overflow = computed(() => (rating.value.score ?? 0) > 10)
const ringLen = computed(() => Math.min(1, Math.max(0, (rating.value.score ?? 0) / 10)) * RING)

function pct(n: number): string {
  return `${Math.min(100, Math.max(0, n))}%`
}

function segments(nums: number[]) {
  const out: { from: number; to: number }[] = []
  for (let i = 1; i < nums.length; i++) out.push({ from: nums[i - 1], to: nums[i] })
  return out
}

function segOpacity(i: number, total: number): number {
  // 越晚的轮次越实
  return total <= 1 ? 1 : 0.45 + (0.55 * (i + 1)) / total
}

function delta(nums: number[]): string {
  const d = nums[nums.length - 1] - nums[0]
  return Number.isInteger(d) ? String(d) : d.toFixed(1)
}

const rootEl = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = rootEl.value
  if (!el) return
  const lines = (): string[] => {
    const r = rating.value
    const out = [
      `**模型**：${model.value || '-'}`,
      `**评分**：${r.score === null ? '待评' : r.history.map(formatScore).join(' → ') + ' / 10'}`,
    ]
    if (selfRating.value.score !== null) out.push(`**AI 自评**：${selfRating.value.history.map(formatScore).join(' → ')} / 10`)
    if (cost.value.length) out.push(`**AI 耗时**：${cost.value.join(' + ')}`)
    if (length.value) out.push(`**成片时长**：${length.value}`)
    if (stack.value.length) out.push(`**技术栈**：${stack.value.join(' · ')}`)
    for (const u of usage.value) out.push(`**额度 ${u.label}**：${u.values.join(' → ')}`)
    return out
  }
  ;(el as any)._toMarkdown = () => `\n\n${lines().map((l) => `- ${l}`).join('\n')}\n\n`
  ;(el as any)._toText = () => `\n${lines().join('\n').replace(/\*\*/g, '')}\n`
})
</script>

<style scoped>
.vh {
  position: relative;
  margin: 20px 0 28px;
  padding: 20px 22px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  isolation: isolate;
}

.vh::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--vh-accent);
}

.vh-glow {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--vh-accent) 22%, transparent), transparent 70%);
  z-index: -1;
  pointer-events: none;
}

.vh-main {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
}

.vh-id {
  min-width: 0;
  flex: 1;
}

.vh-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.vh-model {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vh-accent);
  background: color-mix(in srgb, var(--vh-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--vh-accent) 35%, transparent);
}

.vh-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--vh-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vh-accent) 22%, transparent);
}

.vh-date {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.vh-tasktag {
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.vh-verdict {
  margin: 12px 0 0 !important;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  text-indent: 0 !important;
}

.vh-verdict.is-empty {
  font-size: 15px;
  font-weight: 400;
  color: var(--vp-c-text-3);
  font-style: italic;
}

.vh-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.vh-stack-chip {
  font-size: 11.5px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

/* 评分环 */
.vh-score {
  position: relative;
  flex-shrink: 0;
  width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.vh-ring {
  width: 104px;
  height: 104px;
  transform: rotate(-90deg);
}

.vh-ring-bg {
  fill: none;
  stroke: var(--vp-c-divider);
  stroke-width: 7;
}

.vh-ring-fg {
  fill: none;
  stroke: var(--vh-accent);
  stroke-width: 7;
  stroke-linecap: round;
  transition: stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.vh-score.is-over .vh-ring-fg {
  filter: drop-shadow(0 0 5px var(--vh-accent));
}

.vh-score-text {
  position: absolute;
  top: 0;
  height: 104px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 36px;
  box-sizing: border-box;
  gap: 2px;
}

.vh-score-num {
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}

.vh-score-max {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.vh-score-pending {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  padding-top: 4px;
}

.vh-history {
  margin-top: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.vh-history .is-last {
  color: var(--vh-accent);
  font-weight: 700;
}

.vh-self {
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  text-align: center;
  white-space: nowrap;
}

.vh-self b {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
}

.vh-bias {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.vh-bias.up {
  color: #e5484d;
}

.vh-bias.down {
  color: #12a594;
}

.vh-arrow {
  margin: 0 3px;
  opacity: 0.6;
}

/* 数据格 */
.vh-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.vh-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
}

.vh-stat-label {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.vh-stat-value {
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.vh-plus {
  margin: 0 5px;
  color: var(--vh-accent);
}

/* 额度 */
.vh-usage {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
}

.vh-usage-title {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  margin-bottom: 6px;
}

.vh-usage-row {
  display: grid;
  grid-template-columns: minmax(48px, max-content) 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 3px 0;
  font-size: 13px;
}

.vh-usage-label {
  color: var(--vp-c-text-2);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vh-bar {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: var(--vp-c-default-soft, rgba(125, 125, 125, 0.12));
  overflow: hidden;
}

.vh-bar.is-text {
  background: repeating-linear-gradient(
    90deg,
    var(--vp-c-divider) 0 6px,
    transparent 6px 10px
  );
  height: 2px;
}

.vh-bar-base {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--vp-c-text-3);
  opacity: 0.35;
}

.vh-bar-seg {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--vh-accent);
}

.vh-usage-val {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.vh-delta {
  margin-left: 6px;
  color: var(--vh-accent);
}

/* 成片 */
.vh-media {
  margin-top: 16px;
}

.vh-media :deep(.vvid-box) {
  margin: 0;
}

.vh-bili {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
}

.vh-bili iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

@media (max-width: 640px) {
  .vh {
    padding: 16px 14px 14px;
  }
  .vh-main {
    flex-direction: column-reverse;
    align-items: flex-start;
  }
  .vh-score {
    align-self: center;
  }
  .vh-verdict {
    font-size: 18px;
  }
  .vh-usage-row {
    grid-template-columns: 48px 1fr;
  }
  .vh-usage-val {
    grid-column: 2;
  }
}
</style>
