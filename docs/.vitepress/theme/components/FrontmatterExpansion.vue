<template>
  <div ref="rootEl" class="frontmatter-expansion" :class="`mode-${currentMode}`">
    <!-- 1. 全站归档筛选控制面板 (仅在 archive 模式下显示) -->
    <div v-if="currentMode === 'archive'" class="archive-controls no-copy no-print" data-copy-ignore="true">
      <!-- 搜索框 -->
      <div class="search-bar-row">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索文章标题、标签、描述关键词..."
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''" title="清空搜索">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 统计与趣味字数类比面板（单开一行） -->
      <div class="archive-fun-stats-bar">
        <div class="fun-stats-main">
          <div class="fun-stat-item">
            <svg class="fun-stat-svg" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span class="fun-stat-text">共找到 <strong class="stat-highlight">{{ filteredPosts.length }}</strong> 篇文章</span>
          </div>
          <div class="fun-stat-divider">·</div>
          <div class="fun-stat-item">
            <svg class="fun-stat-svg" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span class="fun-stat-text">累计约 <strong class="stat-highlight">{{ formattedWordCount }}</strong></span>
            <span class="exact-words">({{ totalWords.toLocaleString() }} 字)</span>
          </div>
        </div>

        <div class="fun-analogy-box">
          <span class="analogy-badge">趣味类比</span>
          <span class="analogy-text">{{ funAnalogy }}</span>
        </div>
      </div>

      <!-- 分类选择 Tabs -->
      <div class="filter-section">
        <div class="filter-label">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span>分类：</span>
        </div>
        <div class="filter-pills">
          <button
            class="pill-btn"
            :class="{ active: selectedCategory === '' }"
            @click="selectedCategory = ''"
          >
            全部 ({{ allPosts.length }})
          </button>
          <button
            v-for="cat in availableCategories"
            :key="cat.id"
            class="pill-btn"
            :class="{ active: selectedCategory === cat.id }"
            @click="selectedCategory = cat.id"
          >
            {{ cat.name }} ({{ cat.count }})
          </button>
        </div>
      </div>

      <!-- 标签云筛选 Chips -->
      <div class="filter-section" v-if="availableTags.length > 0">
        <div class="filter-label">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span>标签：</span>
        </div>
        <div class="tag-chips">
          <button
            v-for="tagItem in availableTags"
            :key="tagItem.name"
            class="tag-chip"
            :class="{ active: selectedTags.includes(tagItem.name) }"
            @click="toggleTag(tagItem.name)"
          >
            # {{ tagItem.name }}
            <span class="chip-count">{{ tagItem.count }}</span>
          </button>
        </div>
      </div>

      <!-- 当前筛选状态条 -->
      <div v-if="selectedCategory || selectedTags.length > 0 || searchQuery" class="active-filter-bar">
        <span class="filter-status-text">当前筛选条件：</span>
        <span v-if="selectedCategory" class="filter-badge">
          分类: {{ getCategoryName(selectedCategory) }}
          <button class="remove-badge-btn" @click="selectedCategory = ''">✕</button>
        </span>
        <span v-for="tag in selectedTags" :key="tag" class="filter-badge">
          标签: #{{ tag }}
          <button class="remove-badge-btn" @click="toggleTag(tag)">✕</button>
        </span>
        <span v-if="searchQuery" class="filter-badge">
          搜索: "{{ searchQuery }}"
          <button class="remove-badge-btn" @click="searchQuery = ''">✕</button>
        </span>
        <button class="reset-all-btn" @click="resetFilters">重置全部筛选</button>
      </div>
    </div>

    <!-- 2. 时间轴列表渲染区 -->
    <div class="expansion-timeline" v-if="groupedTimeline.length > 0">
      <template v-for="group in groupedTimeline" :key="group.year">
        <!-- 年份节点 -->
        <div class="timeline-year-node">
          <div class="timeline-year-dot"></div>
          <span class="timeline-year-text">{{ group.year }} 年</span>
          <span class="year-count-badge">({{ group.posts.length }} 篇)</span>
        </div>

        <!-- 该年份下的文章列表 -->
        <a
          v-for="post in group.posts"
          :key="post.url"
          :href="resolveHref(post.url)"
          class="timeline-item"
          :class="{ 'is-highlight': post.highlight }"
        >
          <div class="timeline-node" :class="{ 'node-highlight': post.highlight }"></div>

          <div class="timeline-body">
            <div class="timeline-header">
              <span class="timeline-date">{{ post.date }}</span>
              <span v-if="post.categoryName && showCategory" class="timeline-cat">
                {{ post.categoryName }}
              </span>
              <template v-if="!hideTags">
                <span
                  v-for="tag in post.tags"
                  :key="tag"
                  class="timeline-tag"
                  :class="{ 'tag-highlight': post.highlight, 'is-active': selectedTags.includes(tag) }"
                  @click.prevent="onTagClick(tag)"
                >
                  # {{ tag }}
                </span>
              </template>
            </div>

            <div class="timeline-title" :class="{ 'title-highlight': post.highlight }">
              <span v-html="getPostTitleHtml(post)"></span>
            </div>

            <div v-if="post.desc" class="timeline-desc">
              {{ post.desc }}
            </div>
          </div>
        </a>
      </template>

      <!-- 经典分页导航 Prev 1 2 3 4 5 ... LAST Next -->
      <div v-if="totalPages > 1" class="timeline-pagination">
        <button
          class="page-btn nav-btn prev-btn"
          :disabled="currentPage <= 1"
          @click="setPage(currentPage - 1)"
          aria-label="上一页"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Prev</span>
        </button>

        <div class="page-numbers">
          <template v-for="(p, idx) in visiblePageNumbers" :key="idx">
            <span v-if="p === '...'" class="page-ellipsis">...</span>
            <button
              v-else
              class="page-btn num-btn"
              :class="{ active: currentPage === p }"
              @click="setPage(Number(p))"
            >
              {{ p }}
            </button>
          </template>
        </div>

        <button
          class="page-btn nav-btn next-btn"
          :disabled="currentPage >= totalPages"
          @click="setPage(currentPage + 1)"
          aria-label="下一页"
        >
          <span>Next</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-else class="empty-state">
      <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" stroke-width="1.5" fill="none">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="empty-text">暂无符合条件的文章</p>
      <button v-if="selectedCategory || selectedTag || searchQuery" class="reset-btn" @click="resetFilters">
        清除筛选条件
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { data as allPosts, type PostItem } from '../../scripts/posts.data'
import { CATEGORY_MAP, SECTION_CATEGORIES_MAP } from '../constants/categories'
import { tryDecrypt } from '../../scripts/Decryptor'
import { decrypt, isBase64Cipher } from '../../scripts/crypto'
import { ekey_norm, ekey_priv, ekey_teacher } from '../../scripts/Data'

const props = withDefaults(
  defineProps<{
    category?: string | string[]
    path?: string
    mode?: 'timeline' | 'archive'
    limit?: number
    pageSize?: number
    hideCategory?: boolean
    hideTags?: boolean
  }>(),
  {
    mode: undefined,
    category: '',
    path: '',
    limit: 0,
    pageSize: 15,
    hideCategory: false,
    hideTags: false,
  }
)

const currentMode = computed(() => {
  if (props.mode) return props.mode
  return props.category || props.path ? 'timeline' : 'archive'
})

const rootEl = ref<HTMLElement | null>(null)

// 筛选与分页状态
const selectedCategory = ref(typeof props.category === 'string' ? props.category : '')
const selectedTags = ref<string[]>([])
const searchQuery = ref('')
const currentPage = ref(1)

// 解密后的标题缓存映射（url -> { html, plainText }）
const decryptedTitles = ref<Record<string, { html: string; plainText: string }>>({})

/**
 * 字符串级解密：将标题 HTML 中的密文提取解密为明文
 */
async function decryptTitleString(titleHtml: string): Promise<{ html: string; plainText: string }> {
  if (typeof window === 'undefined' || !titleHtml) {
    const plain = (titleHtml || '').replace(/<[^>]+>/g, '').trim()
    return { html: titleHtml, plainText: plain }
  }

  const normKey = localStorage.getItem(ekey_norm)
  const privKey = localStorage.getItem(ekey_priv)
  const teacherKey = localStorage.getItem(ekey_teacher)

  let resultHtml = titleHtml

  // 1. 匹配 <span ...class="...e..."...>CIPHER</span> / class="encrypt"
  const spanRegex = /<span\s+([^>]*?)class=['"]([^'"]*?)['"]([^>]*?)>([\s\S]*?)<\/span>/gi
  const matches = [...titleHtml.matchAll(spanRegex)]

  for (const match of matches) {
    const fullMatch = match[0]
    const preAttrs = match[1] || ''
    const classAttr = match[2] || ''
    const postAttrs = match[3] || ''
    const cipherText = match[4].trim()

    let keyToUse: string | null = null
    if (/\b(e\+|encpp)\b/.test(classAttr)) {
      keyToUse = privKey
    } else if (/\beteacher\b/.test(classAttr)) {
      keyToUse = teacherKey
    } else if (/\b(e|encrypt)\b/.test(classAttr)) {
      keyToUse = normKey
    }

    if (keyToUse && isBase64Cipher(cipherText)) {
      const decrypted = await decrypt(cipherText, keyToUse)
      if (decrypted !== cipherText) {
        resultHtml = resultHtml.replace(fullMatch, decrypted)
      } else {
        const fallbackMatch = (preAttrs + ' ' + postAttrs).match(/fallback=['"]([^'"]+)['"]/)
        if (fallbackMatch) {
          resultHtml = resultHtml.replace(fullMatch, fallbackMatch[1])
        }
      }
    }
  }

  // 2. 纯 Hex/Base64 处理
  if (isBase64Cipher(resultHtml.trim())) {
    if (normKey) {
      const dec = await decrypt(resultHtml.trim(), normKey)
      if (dec !== resultHtml.trim()) {
        resultHtml = dec
      }
    }
  }

  const plainText = resultHtml.replace(/<[^>]+>/g, '').trim()
  return { html: resultHtml, plainText }
}

/**
 * 批量解密全站所有文章标题
 */
async function decryptAllPostTitles() {
  if (typeof window === 'undefined') return
  const map: Record<string, { html: string; plainText: string }> = {}
  for (const post of allPosts) {
    map[post.url] = await decryptTitleString(post.title)
  }
  decryptedTitles.value = map
}

function getPostTitleHtml(post: PostItem): string {
  return decryptedTitles.value[post.url]?.html || post.title
}

// 可用分类列表及其计数
const availableCategories = computed(() => {
  const map: Record<string, { id: string; name: string; count: number }> = {}
  allPosts.forEach((post) => {
    const id = post.category || 'unknown'
    const name = post.categoryName || CATEGORY_MAP[id] || id
    if (!map[id]) {
      map[id] = { id, name, count: 0 }
    }
    map[id].count++
  })
  return Object.values(map).sort((a, b) => b.count - a.count)
})

// 可用标签列表及其计数
const availableTags = computed(() => {
  const map: Record<string, number> = {}
  const source = selectedCategory.value
    ? allPosts.filter((p) => p.category === selectedCategory.value)
    : allPosts

  source.forEach((post) => {
    if (Array.isArray(post.tags)) {
      post.tags.forEach((t) => {
        if (t) {
          map[t] = (map[t] || 0) + 1
        }
      })
    }
  })

  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 过滤后的文章列表（支持解密后的明文标题搜索！）
const filteredPosts = computed(() => {
  let list = allPosts

  // 1. 分类筛选
  const targetCategory = props.category || selectedCategory.value
  if (targetCategory) {
    const rawCategories = (
      Array.isArray(targetCategory)
        ? targetCategory
        : String(targetCategory).split(',')
    )
      .map((s) => s.trim())
      .filter(Boolean)

    const expandedCategories = new Set<string>()
    for (const cat of rawCategories) {
      expandedCategories.add(cat)
      if (SECTION_CATEGORIES_MAP[cat]) {
        SECTION_CATEGORIES_MAP[cat].forEach((sub) => expandedCategories.add(sub))
      }
    }

    list = list.filter((p) => {
      if (expandedCategories.has(p.category)) return true
      return rawCategories.some((c) => {
        const cleanC = c.replace(/^\/+|\/+$/g, '')
        return p.url.startsWith('/' + cleanC + '/')
      })
    })
  }

  // 2. 路径前缀筛选 (如果明确传入了 path prop)
  if (props.path) {
    const cleanP = props.path.replace(/^\/+|\/+$/g, '')
    list = list.filter((p) => p.url.startsWith('/' + cleanP + '/') || p.url === '/' + cleanP)
  }

  // 3. 联合标签筛选（AND 逻辑：文章必须包含所有选中的标签）
  if (selectedTags.value.length > 0) {
    list = list.filter((p) => {
      if (!Array.isArray(p.tags) || p.tags.length === 0) return false
      return selectedTags.value.every((t) => p.tags.includes(t))
    })
  }

  // 3. 搜索关键词（支持解密后的真实明文搜索）
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((p) => {
      const decInfo = decryptedTitles.value[p.url]
      const plainTitle = (decInfo ? decInfo.plainText : (p.title || '').replace(/<[^>]+>/g, '')).toLowerCase()
      const matchTitle = plainTitle.includes(q)
      const matchDesc = (p.desc || '').toLowerCase().includes(q)
      const matchTag = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q))
      return matchTitle || matchDesc || matchTag
    })
  }

  if (props.limit && props.limit > 0) {
    list = list.slice(0, props.limit)
  }

  return list
})

// 当前筛选文章列表总字数统计
const totalWords = computed(() => {
  return filteredPosts.value.reduce((sum, p) => sum + (p.wordCount || 0), 0)
})

// 格式化字数展示 (例如: 12.4 万字 / 8.5k 字)
const formattedWordCount = computed(() => {
  const count = totalWords.value
  if (count >= 10000) {
    const w = (count / 10000).toFixed(1)
    const k = (count / 1000).toFixed(1)
    return `${w} 万字 (${k}k)`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k 字`
  }
  return `${count} 字`
})

// 趣味字数类比文案
const funAnalogy = computed(() => {
  const words = totalWords.value
  if (words <= 0) {
    return '还没有统计到字数，快去挥洒墨水吧。'
  }
  if (words < 3000) {
    const essays = (words / 800).toFixed(1)
    return `写完了约 ${essays} 篇高考作文，大概够喝完一杯热咖啡的阅读时间。`
  }
  if (words < 10000) {
    const essays = (words / 800).toFixed(1)
    return `写完了约 ${essays} 篇高考作文，或者一本中篇轻小说的开头篇章。`
  }
  if (words < 30000) {
    const aq = (words / 25000).toFixed(1)
    const essays = Math.round(words / 800)
    return `约等于 ${aq} 本鲁迅《阿Q正传》，或者 ${essays} 篇高考作文。`
  }
  if (words < 60000) {
    const prince = (words / 32000).toFixed(1)
    const minutes = Math.round(words / 350)
    return `约等于 ${prince} 本《小王子》，读完大概需要 ${minutes} 分钟的高铁静心时光。`
  }
  if (words < 120000) {
    const hemingway = (words / 60000).toFixed(1)
    const strokes = Math.round(words * 2.6)
    return `约等于 ${hemingway} 本《老人与海》，让键盘经历了约 ${strokes.toLocaleString()} 次清脆敲击。`
  }
  if (words < 250000) {
    const xiangzi = (words / 130000).toFixed(1)
    return `约等于 ${xiangzi} 本老舍《骆驼祥子》，或者程序员写了约 ${Math.round(words / 12)} 行硬核代码注释。`
  }
  if (words < 500000) {
    const threebody = (words / 300000).toFixed(1)
    return `约等于 ${threebody} 部《三体》第一部，足以让思想在星空中漫游数日。`
  }
  if (words < 1000000) {
    const dream = (words / 730000).toFixed(1)
    return `约等于 ${dream} 本《红楼梦》，已经是著作等身的赛博哲学家了。`
  }
  const war = (words / 1000000).toFixed(1)
  return `已经超越了百万字巨著（相当于 ${war} 本《战争与和平》），了不起的文字积累。`
})

// 是否展示文章所属分类标签
const showCategory = computed(() => {
  if (props.hideCategory) return false
  if (currentMode.value === 'archive') return true
  // 若显式传入单个分类（如 poems 或 essays），分类已在上方标题标明，默认不重复展示
  if (props.category && !String(props.category).includes(',')) return false
  return true
})

const effectivePageSize = computed(() => {
  const s = Number(props.pageSize)
  return Number.isFinite(s) && s > 0 ? s : 15
})

// 是否开启分页（未指定单页 limit 限制时生效）
const isPaginationEnabled = computed(() => {
  if (props.limit && props.limit > 0) return false
  return effectivePageSize.value > 0
})

const totalPages = computed(() => {
  if (!isPaginationEnabled.value) return 1
  return Math.max(1, Math.ceil(filteredPosts.value.length / effectivePageSize.value))
})

// 分页切片后的实际展示文章列表
const displayPosts = computed(() => {
  if (!isPaginationEnabled.value) {
    return filteredPosts.value
  }
  const size = effectivePageSize.value
  const start = (currentPage.value - 1) * size
  return filteredPosts.value.slice(start, start + size)
})

// 经典页码计算 [prev, 1, 2, 3, 4, 5, '...', LAST, next]
const visiblePageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // 靠前部分：1 2 3 4 5 ... LAST
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }

  // 靠后部分：1 ... LAST-4 LAST-3 LAST-2 LAST-1 LAST
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }

  // 中间部分：1 ... current-1 current current+1 ... total
  return [1, '...', current - 1, current, current + 1, '...', total]
})

function setPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  scrollToTimelineTop()
  triggerDecrypt()
}

function scrollToTimelineTop() {
  if (typeof window === 'undefined') return
  if (rootEl.value) {
    const top = rootEl.value.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  } else {
    const el = document.querySelector('.expansion-timeline') || document.querySelector('.frontmatter-expansion')
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }
}

// 按年份分组的时间轴数据结构（基于当前分页后的文章）
const groupedTimeline = computed(() => {
  const groups: Array<{ year: string; posts: PostItem[] }> = []
  const map: Record<string, PostItem[]> = {}

  displayPosts.value.forEach((post) => {
    const y = post.year || '2026'
    if (!map[y]) {
      map[y] = []
      groups.push({ year: y, posts: map[y] })
    }
    map[y].push(post)
  })

  groups.sort((a, b) => b.year.localeCompare(a.year, 'zh-CN', { numeric: true }))
  return groups
})

function resolveHref(url: string): string {
  if (!url) return '#'
  const cleaned = url.replace(/\.md(#.*)?$/, '$1')
  return cleaned.startsWith('/') && !cleaned.startsWith('//') ? withBase(cleaned) : cleaned
}

function getCategoryName(catId: string): string {
  return CATEGORY_MAP[catId] || catId
}

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx !== -1) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

function onTagClick(tag: string) {
  if (currentMode.value === 'archive') {
    toggleTag(tag)
  }
}

function resetFilters() {
  selectedCategory.value = props.category || ''
  selectedTags.value = []
  searchQuery.value = ''
  currentPage.value = 1
}

async function triggerDecrypt() {
  if (typeof window === 'undefined') return
  await decryptAllPostTitles()
  await nextTick()
  tryDecrypt()
  setTimeout(tryDecrypt, 120)
  setTimeout(tryDecrypt, 350)
}

function handleStorageEvent(e: StorageEvent) {
  if ([ekey_norm, ekey_priv, ekey_teacher].includes(e.key || '')) {
    triggerDecrypt()
  }
}

onMounted(() => {
  triggerDecrypt()
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent)
    window.addEventListener('gpg-keys-updated', () => {
      triggerDecrypt()
    })
  }
  setTimeout(triggerDecrypt, 150)
  setTimeout(triggerDecrypt, 500)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('storage', handleStorageEvent)
  }
})

watch(
  [selectedCategory, selectedTags, searchQuery],
  () => {
    currentPage.value = 1
    triggerDecrypt()
  },
  { deep: true }
)

watch(
  () => currentPage.value,
  () => {
    triggerDecrypt()
  }
)
</script>

<style scoped>
.frontmatter-expansion {
  margin: 16px 0 32px;
  font-family: var(--vp-font-family-base);
}

/* 1. 归档筛选控制面板 */
.archive-controls {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.search-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--vp-c-text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 36px 0 36px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 2px rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.2);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.clear-search-btn:hover {
  color: var(--vp-c-text-1);
}

/* 统计与趣味类比面板 (单开一行) */
.archive-fun-stats-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.fun-stats-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.fun-stat-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.fun-stat-svg {
  color: var(--vp-c-brand);
  flex-shrink: 0;
}

.fun-stat-divider {
  color: var(--vp-c-text-3);
  font-weight: bold;
}

.stat-highlight {
  color: var(--vp-c-brand);
  font-weight: 700;
}

.exact-words {
  font-size: 11px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  margin-left: 2px;
}

.fun-analogy-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  padding-top: 6px;
  border-top: 1px dashed var(--vp-c-divider);
}

.analogy-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.12);
  color: var(--vp-c-brand);
  border: 1px solid rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.25);
}

.analogy-text {
  flex: 1;
  color: var(--vp-c-text-2);
}

/* 分类与标签过滤器 */
.filter-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--vp-c-text-2);
  font-weight: 600;
  white-space: nowrap;
  padding-top: 4px;
  min-width: 60px;
}

.filter-pills,
.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pill-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.pill-btn.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: #fff;
}

.tag-chip {
  padding: 3px 8px;
  font-size: 11px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.tag-chip:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.tag-chip.active {
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.15);
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  font-weight: 600;
}

.chip-count {
  font-size: 10px;
  opacity: 0.7;
  font-family: var(--vp-font-family-mono);
}

/* 激活状态条 */
.active-filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 12px;
}

.filter-status-text {
  color: var(--vp-c-text-3);
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.remove-badge-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-3);
  font-size: 10px;
  padding: 0 2px;
}

.remove-badge-btn:hover {
  color: #ff4d4f;
}

.reset-all-btn {
  margin-left: auto;
  font-size: 12px;
  color: var(--vp-c-brand);
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

/* 2. 时间轴样式 */
.expansion-timeline {
  position: relative;
  padding-left: 20px;
}

.timeline-year-node {
  position: relative;
  display: flex;
  align-items: center;
  margin: 28px 0 14px -20px;
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

.year-count-badge {
  margin-left: 8px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.timeline-item {
  position: relative;
  display: block;
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.2s ease;
  cursor: pointer;
}

.timeline-item:hover {
  border-color: var(--vp-c-brand);
  transform: translateX(4px);
  background: var(--vp-c-bg-elv);
}

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

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.timeline-date {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.timeline-cat {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
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

.timeline-tag.tag-highlight {
  background: rgba(255, 122, 69, 0.12);
  color: #ff7a45;
  border-color: rgba(255, 122, 69, 0.3);
}

.timeline-tag.is-active {
  background: var(--vp-c-brand);
  color: #fff;
  border-color: var(--vp-c-brand);
}

.timeline-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  transition: color 0.2s ease;
}

.timeline-item:hover .timeline-title {
  color: var(--vp-c-brand);
}

.title-highlight {
  background: linear-gradient(120deg, #ff7a45, #ffb347 45%, #ff6f91);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.timeline-desc {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  margin: 20px 0;
}

.empty-text {
  margin: 12px 0 16px;
  font-size: 14px;
}

.reset-btn {
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 6px;
  background: var(--vp-c-brand);
  color: #fff;
  border: none;
  cursor: pointer;
}

/* 经典分页控制器 */
.timeline-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 32px 0 16px;
  padding: 12px 0;
  user-select: none;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn.num-btn {
  min-width: 34px;
  padding: 0 8px;
}

.page-btn.nav-btn {
  gap: 5px;
  font-weight: 600;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  background-color: var(--vp-c-bg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.page-btn.active {
  background-color: var(--vp-c-brand);
  color: #fff;
  border-color: var(--vp-c-brand);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--vp-c-divider);
}

.page-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  font-size: 14px;
  color: var(--vp-c-text-3);
  letter-spacing: 2px;
}

@media (max-width: 640px) {
  .search-bar-row {
    flex-direction: column;
    align-items: stretch;
  }
  .timeline-pagination {
    flex-wrap: wrap;
    gap: 6px;
  }
  .page-btn {
    height: 30px;
    padding: 0 8px;
    font-size: 12px;
  }
  .page-btn.num-btn {
    min-width: 30px;
  }
}
</style>
