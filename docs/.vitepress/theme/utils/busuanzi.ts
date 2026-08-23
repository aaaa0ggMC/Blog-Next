import { ref, watch, onMounted } from 'vue'
import { inBrowser, useRoute } from 'vitepress'

const STATS_API = 'https://blog-stats.aaaa0ggmc.workers.dev'

export const sitePv = ref<number | null>(null)
export const pagePv = ref<number | null>(null)
export const isStatsLoaded = ref(false)

/**
 * 请求专属 Cloudflare Worker 统计 API
 */
export async function fetchStats(pathname?: string) {
  if (!inBrowser) return

  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '0.0.0.0'
    const targetPath = pathname || window.location.pathname || '/'

    const res = await fetch(`${STATS_API}?path=${encodeURIComponent(targetPath)}&local=${isLocal}`)
    if (!res.ok) return

    const data = await res.json()
    if (typeof data.site_pv === 'number') sitePv.value = data.site_pv
    if (typeof data.page_pv === 'number') pagePv.value = data.page_pv
    isStatsLoaded.value = true
  } catch (err) {
    console.warn('[Stats] Fetch failed:', err)
  }
}

/**
 * 在 Vue 组件中使用的 hook
 */
export function useBusuanzi() {
  const route = useRoute()

  onMounted(() => {
    fetchStats(route.path)
  })

  watch(
    () => route.path,
    (newPath) => {
      // 路由切换时重新请求新文章的统计
      pagePv.value = null
      fetchStats(newPath)
    }
  )

  return {
    sitePv,
    pagePv,
    isStatsLoaded,
    fetchStats
  }
}
