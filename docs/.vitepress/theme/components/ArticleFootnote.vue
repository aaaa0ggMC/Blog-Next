<template>
  <div v-if="formattedDate" ref="rootEl" class="article-footnote">
    <div class="footnote-card">
      <div class="footnote-left">
        <div class="footnote-icon-wrap" aria-hidden="true">
          <svg
            class="footnote-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <!-- Quill / Pen icon -->
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        <span class="footnote-text">
          {{ noteText }}
        </span>
      </div>
      <div class="footnote-right no-copy" data-copy-ignore="true">
        <span class="footnote-badge">{{ badgeText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()
const rootEl = ref<HTMLElement | null>(null)

function formatTranscribeDate(raw: any): string {
  if (!raw) return ''
  if (raw instanceof Date) {
    const y = raw.getUTCFullYear()
    const m = String(raw.getUTCMonth() + 1).padStart(2, '0')
    const d = String(raw.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const str = String(raw).trim()
  const match = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (match) {
    const y = match[1]
    const m = match[2].padStart(2, '0')
    const d = match[3].padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return str
}

const rawTranscribeAt = computed(() => {
  return frontmatter.value?.transcribe_at ?? frontmatter.value?.transcribed_at
})

const source = computed(() => {
  return frontmatter.value?.source || frontmatter.value?.transcribe_source || '笔记本'
})

const formattedDate = computed(() => {
  return formatTranscribeDate(rawTranscribeAt.value)
})

const badgeText = computed(() => {
  const s = String(source.value).trim()
  if (s.length <= 6) {
    return `${s}誊录`
  }
  return '笔记誊录'
})

const noteText = computed(() => {
  if (!formattedDate.value) return ''
  if (frontmatter.value?.transcribe_note) {
    return frontmatter.value.transcribe_note
  }
  return `本文于 ${formattedDate.value} 从${source.value}中誊写`
})

onMounted(() => {
  const el = rootEl.value
  if (!el) return

  ;(el as any)._toMarkdown = () => {
    if (!formattedDate.value) return ''
    return `\n\n> 📝 **誊写说明**：${noteText.value}\n\n`
  }

  ;(el as any)._toText = () => {
    if (!formattedDate.value) return ''
    return `\n\n[誊写说明] ${noteText.value}\n\n`
  }
})
</script>

<style scoped>
.article-footnote {
  width: 100%;
  margin: 28px 0 16px;
  user-select: none;
}

.footnote-card {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-left: 3px solid var(--vp-c-brand-1, var(--vp-c-brand));
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  font-size: 13px;
  color: var(--vp-c-text-2);
  transition: all 0.25s ease;
}

.footnote-card:hover {
  border-color: var(--vp-c-divider);
  border-left-color: var(--vp-c-brand-1, var(--vp-c-brand));
  background-color: var(--vp-c-bg-mute, var(--vp-c-bg-soft));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  color: var(--vp-c-text-1);
}

.footnote-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footnote-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-brand-1, var(--vp-c-brand));
  flex-shrink: 0;
}

.footnote-text {
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}

.footnote-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.footnote-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-elv, var(--vp-c-bg));
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  letter-spacing: 0.5px;
}

@media (max-width: 640px) {
  .article-footnote {
    margin: 20px 0 12px;
  }
  .footnote-card {
    padding: 8px 12px;
    font-size: 12px;
    gap: 8px;
  }
  .footnote-badge {
    display: none;
  }
}
</style>
