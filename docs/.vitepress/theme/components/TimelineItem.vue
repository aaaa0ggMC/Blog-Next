<template>
  <div v-if="year" ref="itemRef" class="timeline-year-node">
    <div class="timeline-year-dot"></div>
    <span class="timeline-year-text">{{ year }}</span>
  </div>

  <component
    :is="href ? 'a' : 'div'"
    v-else
    ref="itemRef"
    class="timeline-item"
    :class="{ 'is-link': !!href, 'is-highlight': highlight }"
    :href="normalizedHref"
  >
    <div class="timeline-node" :class="{ 'node-highlight': highlight }"></div>

    <div class="timeline-body">
      <div class="timeline-header">
        <span v-if="date" class="timeline-date">{{ date }}</span>
        <span v-if="tag" class="timeline-tag" :class="{ 'tag-highlight': highlight }">{{ tag }}</span>
      </div>

      <div class="timeline-title" :class="{ 'title-highlight': highlight }">
        <slot />
      </div>

      <div v-if="desc" class="timeline-desc">
        {{ desc }}
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  date?: string
  href?: string
  tag?: string
  desc?: string
  highlight?: boolean
  year?: string
}>()

const itemRef = ref<HTMLElement | null>(null)

const normalizedHref = computed(() => {
  if (!props.href) return undefined
  const cleaned = props.href.replace(/\.md(#.*)?$/, '$1')
  return cleaned.startsWith('/') && !cleaned.startsWith('//') ? withBase(cleaned) : cleaned
})

onMounted(() => {
  const el = itemRef.value
  if (!el) return

  if (props.year) {
    ;(el as any)._toMarkdown = () => `\n\n### ${props.year}\n\n`
    ;(el as any)._toText = () => `\n[${props.year}]\n`
  } else {
    ;(el as any)._toMarkdown = () => {
      const titleEl = el.querySelector('.timeline-title')
      const title = titleEl?.textContent?.trim() || ''
      const parts: string[] = []

      if (props.date) parts.push(`**${props.date}**`)
      if (props.tag) parts.push(`\`${props.tag}\``)
      if (props.href && title) {
        parts.push(`[${title}](${props.href})`)
      } else if (title) {
        parts.push(title)
      }
      if (props.desc) parts.push(`- ${props.desc}`)

      return `- ${parts.join(' ')}\n`
    }
    ;(el as any)._toText = () => {
      const titleEl = el.querySelector('.timeline-title')
      const title = titleEl?.textContent?.trim() || ''
      const parts: string[] = []
      if (props.date) parts.push(props.date)
      if (props.tag) parts.push(`[${props.tag}]`)
      if (title) parts.push(title)
      if (props.desc) parts.push(`(${props.desc})`)
      return `- ${parts.join(' ')}\n`
    }
  }
})
</script>

<style scoped>
/* Year Node */
.timeline-year-node {
  position: relative;
  display: flex;
  align-items: center;
  margin: 24px 0 12px -20px;
}

.timeline-year-dot {
  position: absolute;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-brand);
  box-shadow: 0 0 0 3px var(--vp-c-bg);
}

.timeline-year-text {
  margin-left: 24px;
  font-family: var(--vp-font-family-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

/* Timeline Item */
.timeline-item {
  position: relative;
  display: block;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.2s ease;
}

.timeline-item.is-link {
  cursor: pointer;
}

.timeline-item.is-link:hover {
  border-color: var(--vp-c-brand);
  transform: translateX(4px);
  background: var(--vp-c-bg-elv);
}

/* Node Dot */
.timeline-node {
  position: absolute;
  left: -20px;
  top: 16px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.timeline-item:hover .timeline-node {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-brand);
  transform: scale(1.2);
}

.node-highlight {
  border-color: #ff7a45;
  background: #ff7a45;
  box-shadow: 0 0 6px rgba(255, 122, 69, 0.5);
}

.timeline-item:hover .node-highlight {
  border-color: #ff6f91;
  background: #ff6f91;
}

/* Header: Date + Tag */
.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.timeline-date {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.timeline-tag {
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

/* Title */
.timeline-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  transition: color 0.2s ease;
}

.timeline-title :deep(p) {
  margin: 0;
  display: inline;
}

.timeline-item.is-link:hover .timeline-title {
  color: var(--vp-c-brand);
}

.title-highlight {
  background: linear-gradient(120deg, #ff7a45, #ffb347 45%, #ff6f91);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* Description */
.timeline-desc {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .timeline-item {
    padding: 8px 12px;
  }
}
</style>
