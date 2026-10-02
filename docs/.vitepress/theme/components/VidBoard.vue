<template>
  <div ref="rootEl" class="vb">
    <div class="vb-toolbar no-print" data-copy-ignore="true">
      <div class="vb-filters">
        <button class="vb-chip" :class="{ on: !vendorFilter }" @click="vendorFilter = ''">
          全部 <span class="vb-count">{{ entries.length }}</span>
        </button>
        <button
          v-for="v in vendors"
          :key="v.id"
          class="vb-chip"
          :class="{ on: vendorFilter === v.id }"
          :style="{ '--c': v.color }"
          @click="vendorFilter = vendorFilter === v.id ? '' : v.id"
        >
          <span class="vb-chip-dot"></span>{{ v.name }} <span class="vb-count">{{ v.count }}</span>
        </button>
      </div>
      <div class="vb-sort">
        <button :class="{ on: sortBy === 'date' }" @click="sortBy = 'date'">最新</button>
        <button :class="{ on: sortBy === 'rating' }" @click="sortBy = 'rating'">评分</button>
        <button :class="{ on: sortBy === 'task' }" @click="sortBy = 'task'">同题</button>
      </div>
    </div>

    <template v-for="group in groups" :key="group.name">
      <div v-if="group.name" class="vb-group">{{ group.name }} <span>{{ group.items.length }} 份答卷</span></div>
      <div class="vb-grid">
        <a
          v-for="e in group.items"
          :key="e.url"
          class="vb-card"
          :href="withBase(e.url)"
          :style="{ '--c': e.vendor.color }"
        >
          <div class="vb-card-top">
            <span class="vb-model"><span class="vb-chip-dot"></span>{{ e.model || e.vendor.name }}</span>
            <span class="vb-date">{{ e.date }}</span>
          </div>
          <div class="vb-title">{{ e.task || e.title }}</div>
          <div v-if="e.desc" class="vb-desc">{{ e.desc }}</div>
          <div class="vb-rating">
            <div class="vb-meter">
              <span :style="{ width: `${Math.min(100, (e.rating.score ?? 0) * 10)}%` }"></span>
            </div>
            <span v-if="e.rating.score !== null" class="vb-score">
              <span v-if="e.rating.history.length > 1" class="vb-prev">{{ formatScore(e.rating.history[0]) }} →</span>
              {{ formatScore(e.rating.score) }}
            </span>
            <span v-else class="vb-score is-pending">待评</span>
          </div>
          <div v-if="e.self.score !== null" class="vb-self">
            AI 自评 {{ formatScore(e.self.score) }}
            <template v-if="e.bias !== null"> · {{ formatBias(e.bias) }}</template>
          </div>
        </a>
      </div>
    </template>

    <p v-if="!entries.length" class="vb-empty">还没有记录，去写第一篇吧。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as allPosts } from '../../scripts/posts.data'
import { formatBias, formatScore, parseRating, resolveVendor, selfBias } from '../utils/aivid'

const props = withDefaults(defineProps<{ category?: string }>(), { category: 'ai_vids' })

const entries = computed(() =>
  allPosts
    .filter((p) => p.category === props.category)
    .map((p) => ({
      ...p,
      vendor: resolveVendor(p.vendor, p.model),
      rating: parseRating(p.rating),
      self: parseRating(p.self_rating),
    }))
    .map((e) => ({ ...e, bias: selfBias(e.rating, e.self) })),
)

const vendors = computed(() => {
  const map = new Map<string, { id: string; name: string; color: string; count: number }>()
  for (const e of entries.value) {
    const cur = map.get(e.vendor.id)
    if (cur) cur.count++
    else map.set(e.vendor.id, { ...e.vendor, count: 1 })
  }
  return [...map.values()]
})

const vendorFilter = ref('')
const sortBy = ref<'date' | 'rating' | 'task'>('date')

const filtered = computed(() => {
  const list = entries.value.filter((e) => !vendorFilter.value || e.vendor.id === vendorFilter.value)
  if (sortBy.value === 'rating') {
    return [...list].sort((a, b) => (b.rating.score ?? -1) - (a.rating.score ?? -1))
  }
  return list // posts.data 已按日期倒序
})

const groups = computed(() => {
  if (sortBy.value !== 'task') return [{ name: '', items: filtered.value }]
  const map = new Map<string, typeof filtered.value>()
  for (const e of filtered.value) {
    const k = e.task || e.title
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(e)
  }
  return [...map.entries()].map(([name, items]) => ({
    name,
    items: [...items].sort((a, b) => (b.rating.score ?? -1) - (a.rating.score ?? -1)),
  }))
})

const rootEl = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = rootEl.value
  if (!el) return
  const line = (e: (typeof entries.value)[number]) =>
    `${e.date} ${e.model || e.vendor.name} · ${e.task || e.title} · ${e.rating.score === null ? '待评' : formatScore(e.rating.score) + '/10'}`
  ;(el as any)._toMarkdown = () =>
    `\n\n${entries.value.map((e) => `- [${line(e)}](${e.url})`).join('\n')}\n\n`
  ;(el as any)._toText = () => `\n${entries.value.map((e) => `- ${line(e)}`).join('\n')}\n`
})
</script>

<style scoped>
.vb {
  margin: 18px 0 28px;
}

.vb-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.vb-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.vb-chip {
  --c: var(--vp-c-brand);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.vb-chip:hover {
  border-color: var(--c);
}

.vb-chip.on {
  color: var(--c);
  border-color: color-mix(in srgb, var(--c) 50%, transparent);
  background: color-mix(in srgb, var(--c) 10%, transparent);
  font-weight: 600;
}

.vb-chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c);
  flex-shrink: 0;
}

.vb-count {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  opacity: 0.7;
}

.vb-sort {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.vb-sort button {
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  background: none;
  font-size: 12px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.vb-sort button.on {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.vb-group {
  margin: 18px 0 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.vb-group span {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--vp-c-text-3);
}

.vb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.vb-card {
  --c: var(--vp-c-brand);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 12px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  text-decoration: none !important;
  color: inherit;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.vb-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--c);
}

.vb-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--c) 55%, transparent);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--c) 14%, transparent);
}

.vb-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.vb-model {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vb-date {
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.vb-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--vp-c-text-1);
}

.vb-desc {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.vb-rating {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 6px;
}

.vb-meter {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--vp-c-default-soft, rgba(125, 125, 125, 0.12));
  overflow: hidden;
}

.vb-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--c);
}

.vb-score {
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
  font-weight: 800;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.vb-score.is-pending {
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

.vb-prev {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

.vb-self {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.vb-empty {
  color: var(--vp-c-text-3);
  text-align: center;
}

@media (max-width: 640px) {
  .vb-grid {
    grid-template-columns: 1fr;
  }
}
</style>
