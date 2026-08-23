<template>
  <a ref="cardRef" class="card" :class="{ 'is-highlight': highlight }" :href="normalizedHref">
    <div class="card-header" v-if="date || tag || $slots.header">
      <span v-if="date" class="card-date">{{ date }}</span>
      <span v-if="tag" class="card-tag" :class="{ 'tag-highlight': highlight }">{{ tag }}</span>
      <slot name="header" />
    </div>

    <div class="card-content">
      <div class="card-title" :class="{ 'card-title-hl': highlight }">
        <slot />
      </div>
      <div class="card-arrow">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </div>
    </div>

    <div v-if="desc" class="card-desc">
      {{ desc }}
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  href: string
  date?: string
  tag?: string
  desc?: string
  highlight?: boolean
}>()

const cardRef = ref<HTMLElement | null>(null)

const normalizedHref = computed(() => {
  const cleaned = props.href.replace(/\.md(#.*)?$/, '$1')
  return cleaned.startsWith('/') && !cleaned.startsWith('//') ? withBase(cleaned) : cleaned
})

onMounted(() => {
  const el = cardRef.value
  if (!el) return

  ;(el as any)._toMarkdown = () => {
    const titleEl = el.querySelector('.card-title')
    const title = titleEl?.textContent?.trim() || props.href
    const parts: string[] = []
    if (props.date) parts.push(`**${props.date}**`)
    if (props.tag) parts.push(`\`${props.tag}\``)
    parts.push(`[${title}](${props.href})`)
    if (props.desc) parts.push(`- ${props.desc}`)
    return `- ${parts.join(' ')}\n`
  }

  ;(el as any)._toText = () => {
    const titleEl = el.querySelector('.card-title')
    const title = titleEl?.textContent?.trim() || props.href
    const parts: string[] = []
    if (props.date) parts.push(props.date)
    if (props.tag) parts.push(`[${props.tag}]`)
    parts.push(title)
    if (props.desc) parts.push(`(${props.desc})`)
    return `- ${parts.join(' ')}\n`
  }
})
</script>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

.card:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg-elv);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
}

.card.is-highlight {
  border-left: 3px solid #ff7a45;
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.card-date {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.card-tag {
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

.tag-highlight {
  background: rgba(255, 122, 69, 0.12);
  color: #ff7a45;
  border-color: rgba(255, 122, 69, 0.3);
}

/* Content: Title & Arrow */
.card-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  transition: color 0.2s ease;
}

.card-title :deep(p) {
  margin: 0;
  display: inline;
}

.card:hover .card-title {
  color: var(--vp-c-brand);
}

.card-title-hl {
  background: linear-gradient(120deg, #ff7a45, #ffb347 45%, #ff6f91);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* Arrow Icon */
.card-arrow {
  flex-shrink: 0;
  margin-top: 3px;
  color: var(--vp-c-text-3);
  transition: transform 0.2s ease, color 0.2s ease;
  opacity: 0.7;
}

.card:hover .card-arrow {
  color: var(--vp-c-brand);
  transform: translateX(3px);
  opacity: 1;
}

/* Description */
.card-desc {
  margin-top: 2px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .card {
    padding: 10px 14px;
  }
}
</style>
