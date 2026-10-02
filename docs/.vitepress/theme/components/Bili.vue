<template>
  <figure ref="rootEl" class="bili">
    <div class="bili-frame" :style="{ aspectRatio: ratio }">
      <iframe
        v-if="info.bvid || info.aid"
        :src="playerUrl"
        :title="title || 'Bilibili 视频'"
        allowfullscreen
        allow="fullscreen; picture-in-picture"
        scrolling="no"
        frameborder="0"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
      <div v-else class="bili-empty">缺少 bvid</div>
    </div>
    <figcaption v-if="info.bvid || info.aid" class="bili-cap no-print" data-copy-ignore="true">
      <span v-if="title" class="bili-title">{{ title }}</span>
      <a class="bili-link" :href="pageUrl" target="_blank" rel="noopener">
        在 B 站打开<template v-if="info.p > 1"> · P{{ info.p }}</template>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </a>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    bvid?: string
    /** 分 P，从 1 开始 */
    p?: string | number
    aid?: string | number
    cid?: string | number
    /** 也可以直接粘贴 B 站给的 iframe src，自动解析 bvid / p / aid / cid */
    src?: string
    /** 起始秒数 */
    t?: string | number
    title?: string
    ratio?: string
    autoplay?: boolean
    danmaku?: boolean
  }>(),
  { ratio: '16 / 9', autoplay: false, danmaku: false },
)

const info = computed(() => {
  const q = new URLSearchParams((props.src || '').split('?')[1] || '')
  return {
    bvid: props.bvid || q.get('bvid') || '',
    aid: String(props.aid ?? q.get('aid') ?? ''),
    cid: String(props.cid ?? q.get('cid') ?? ''),
    p: Number(props.p ?? q.get('p') ?? 1) || 1,
  }
})

const playerUrl = computed(() => {
  const i = info.value
  const q = new URLSearchParams()
  if (i.bvid) q.set('bvid', i.bvid)
  if (i.aid) q.set('aid', i.aid)
  if (i.cid) q.set('cid', i.cid)
  q.set('p', String(i.p))
  q.set('isOutside', 'true')
  q.set('autoplay', props.autoplay ? '1' : '0')
  q.set('danmaku', props.danmaku ? '1' : '0')
  q.set('high_quality', '1')
  if (props.t) q.set('t', String(props.t))
  return `https://player.bilibili.com/player.html?${q.toString()}`
})

const pageUrl = computed(() => {
  const i = info.value
  const id = i.bvid || `av${i.aid}`
  return `https://www.bilibili.com/video/${id}/${i.p > 1 ? `?p=${i.p}` : ''}`
})

const rootEl = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = rootEl.value
  if (!el) return
  const label = props.title || 'Bilibili 视频'
  ;(el as any)._toMarkdown = () => `\n\n[视频: ${label}](${pageUrl.value})\n\n`
  ;(el as any)._toText = () => `[视频: ${label}] ${pageUrl.value}`
})
</script>

<style scoped>
.bili {
  margin: 16px 0 20px;
}

.bili-frame {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  border: 1px solid var(--vp-c-divider);
}

.bili-frame iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.bili-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
}

.bili-cap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}

.bili-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bili-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  flex-shrink: 0;
  color: #fb7299 !important;
  text-decoration: none !important;
}

.bili-link:hover {
  opacity: 0.8;
}
</style>
