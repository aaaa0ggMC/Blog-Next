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

      <!-- 时间段选择 Tabs & 预设 -->
      <div class="filter-block">
        <div class="filter-section">
          <div class="filter-label">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>时间：</span>
        </div>
        <div class="filter-pills">
          <button
            class="pill-btn"
            :class="{ active: selectedDatePreset === 'all' && !customStartDate && !customEndDate }"
            @click="setDatePreset('all')"
          >
            全部时间
          </button>
          <button
            v-for="item in visibleYearPills"
            :key="item.year"
            class="pill-btn"
            :class="{ active: selectedDatePreset === `year-${item.year}` }"
            @click="setDatePreset(`year-${item.year}`)"
          >
            {{ item.year }} 年 ({{ item.count }})
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedDatePreset === 'last-3-months' }"
            @click="setDatePreset('last-3-months')"
          >
            近 3 个月
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedDatePreset === 'last-6-months' }"
            @click="setDatePreset('last-6-months')"
          >
            近半年
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedDatePreset === 'last-1-year' }"
            @click="setDatePreset('last-1-year')"
          >
            近 1 年
          </button>
          <button
            class="pill-btn custom-date-trigger-btn"
            :class="{ active: selectedDatePreset === 'custom' || showCustomDateInputs || (customStartDate && !selectedDatePreset.startsWith('year-') && !selectedDatePreset.startsWith('last-')) }"
            @click="toggleCustomDateInputs"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/>
              <line x1="9" y1="8" x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
            <span>自定义区间</span>
            <span class="dropdown-arrow" :class="{ open: showCustomDateInputs }">▾</span>
          </button>
          </div>
        </div>

        <!-- 年份折叠控制：年份随时间不断增多 -->
        <div v-if="availableYears.length > YEAR_PILLS_LIMIT" class="filter-more-row">
          <button class="filter-more-btn" @click="yearsExpanded = !yearsExpanded">
            <span>{{ yearsExpanded ? '收起年份' : `展开全部年份（还有 ${hiddenYearCount} 个）` }}</span>
            <span class="more-arrow" :class="{ open: yearsExpanded }">▾</span>
          </button>
        </div>
      </div>

      <!-- 自定义时间段精确选择面板 (展开或自定义状态下展示) -->
      <transition name="date-panel-slide">
        <div v-if="showCustomDateInputs || selectedDatePreset === 'custom'" class="custom-date-panel">
          <div class="custom-date-header">
            <span class="custom-date-title">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              自定义文章发布时间段
            </span>
            <button
              v-if="customStartDate || customEndDate"
              class="clear-date-link"
              @click="clearCustomDates"
              title="清除时间范围"
            >
              清空时间条件
            </button>
          </div>
          <div class="custom-date-wrap">
            <div class="date-picker-field">
              <label class="field-label">起始日期</label>
              <div class="date-input-box">
                <svg class="date-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <input
                  type="date"
                  v-model="customStartDate"
                  class="date-input"
                  :max="customEndDate || todayStr"
                  @change="onCustomDateChange"
                />
              </div>
            </div>

            <div class="date-range-divider">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            <div class="date-picker-field">
              <label class="field-label">结束日期</label>
              <div class="date-input-box">
                <svg class="date-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <input
                  type="date"
                  v-model="customEndDate"
                  class="date-input"
                  :min="customStartDate"
                  :max="todayStr"
                  @change="onCustomDateChange"
                />
              </div>
            </div>
          </div>
          <div class="custom-date-summary" v-if="customStartDate || customEndDate">
            <span>当前限定：</span>
            <strong class="date-range-badge">{{ customStartDate || '开始不限' }}</strong>
            <span class="range-arrow">→</span>
            <strong class="date-range-badge">{{ customEndDate || '至今' }}</strong>
          </div>
        </div>
      </transition>

      <!-- 分类选择 Tabs -->
      <div class="filter-block">
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
            v-for="cat in visibleCategories"
            :key="cat.id"
            class="pill-btn"
            :class="{ active: selectedCategory === cat.id }"
            @click="selectedCategory = cat.id"
          >
            {{ cat.name }} ({{ cat.count }})
          </button>
          </div>
        </div>

        <!-- 分类折叠控制：分类会随专栏增加而变多 -->
        <div v-if="availableCategories.length > CATEGORY_PILLS_LIMIT" class="filter-more-row">
          <button class="filter-more-btn" @click="categoriesExpanded = !categoriesExpanded">
            <span>{{ categoriesExpanded ? '收起分类' : `展开全部分类（还有 ${hiddenCategoryCount} 个）` }}</span>
            <span class="more-arrow" :class="{ open: categoriesExpanded }">▾</span>
          </button>
        </div>
      </div>

      <!-- 标签云筛选 Chips -->
      <div class="filter-block" v-if="availableTags.length > 0">
        <div class="filter-section">
        <div class="filter-label">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span>标签：</span>
        </div>
        <div class="tag-chips">
          <button
            v-for="tagItem in visibleTags"
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

        <!-- 标签云折叠控制：标签数量增长最快 -->
        <div v-if="availableTags.length > TAG_CHIPS_LIMIT" class="filter-more-row">
          <button class="filter-more-btn" @click="tagsExpanded = !tagsExpanded">
            <span>{{ tagsExpanded ? '收起标签' : `展开全部标签（还有 ${hiddenTagCount} 个）` }}</span>
            <span class="more-arrow" :class="{ open: tagsExpanded }">▾</span>
          </button>
        </div>
      </div>

      <!-- 当前筛选状态条 -->
      <div v-if="selectedCategory || selectedTags.length > 0 || searchQuery || activeDateFilterLabel" class="active-filter-bar">
        <span class="filter-status-text">当前筛选条件：</span>
        <span v-if="activeDateFilterLabel" class="filter-badge">
          时间: {{ activeDateFilterLabel }}
          <button class="remove-badge-btn" @click="setDatePreset('all')">✕</button>
        </span>
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
    <div ref="timelineEl" class="expansion-timeline" v-if="groupedTimeline.length > 0">
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
          <span class="nav-label">Prev</span>
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
          <span class="nav-label">Next</span>
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
      <button v-if="selectedCategory || selectedTags.length > 0 || searchQuery || customStartDate || customEndDate" class="reset-btn" @click="resetFilters">
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
    tags?: string | string[]
    tag?: string | string[]
    path?: string
    mode?: 'timeline' | 'archive'
    limit?: number
    pageSize?: number
    hideCategory?: boolean
    hideTags?: boolean
    pageKey?: string
    /** 复制整页内容时，标题是否强制保留密文（默认 false：跟随页面当前显示状态） */
    keepTitleCipher?: boolean
  }>(),
  {
    mode: undefined,
    category: '',
    tags: () => [],
    tag: '',
    path: '',
    limit: 0,
    pageSize: 15,
    hideCategory: false,
    hideTags: false,
    pageKey: '',
    keepTitleCipher: false,
  }
)

function parseInitialTags(): string[] {
  const t = props.tags || props.tag
  if (!t) return []
  if (Array.isArray(t)) {
    return t.map((s) => String(s).trim()).filter(Boolean)
  }
  const str = String(t).trim()
  if (str.startsWith('[') && str.endsWith(']')) {
    return str
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

const currentMode = computed(() => {
  if (props.mode) return props.mode
  const hasTagProp = Array.isArray(props.tags) ? props.tags.length > 0 : !!props.tags || !!props.tag
  return props.category || props.path || hasTagProp ? 'timeline' : 'archive'
})

const rootEl = ref<HTMLElement | null>(null)
const timelineEl = ref<HTMLElement | null>(null)

// 筛选与分页状态
const selectedCategory = ref(typeof props.category === 'string' ? props.category : '')
const selectedTags = ref<string[]>(parseInitialTags())
const searchQuery = ref('')
const currentPage = ref(1)

// 从地址栏恢复状态的标记：恢复过程中由 watcher 触发的写回会被抑制，
// 避免把刚恢复的页码 / 筛选条件又重置回默认值
let isRestoringFromUrl = false

// ===== 状态 <-> URL 查询参数同步 =====
// 每个组件实例拥有独立的参数前缀（如 poems_ / archive_），
// 这样同一页面挂载多个 <FrontmatterExpansion /> 时互不干扰。
// 1. 翻页：点击「下一页 / 具体页码」写入 ?xxx_page=N，刷新、分享链接、
//    浏览器前进后退都能直达对应页，无需反复点击。
// 2. 筛选：归档模式下的搜索词、分类、标签、时间段同样写入地址栏，
//    方便把「某一组筛选结果」直接分享或收藏。
const PAGE_PARAM = '_page'
const SEARCH_PARAM = '_q'
const CATEGORY_PARAM = '_cat'
const TAGS_PARAM = '_tag'
const FROM_PARAM = '_from'
const TO_PARAM = '_to'

/** 本实例可能写入地址栏的全部参数后缀 */
const STATE_PARAMS = [PAGE_PARAM, SEARCH_PARAM, CATEGORY_PARAM, TAGS_PARAM, FROM_PARAM, TO_PARAM]

function sanitizeParamKey(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** 根据静态 props 推导组件实例的唯一键（不随用户筛选条件变化） */
function deriveInstanceKey(): string {
  if (props.path) {
    const fromPath = sanitizeParamKey(props.path.replace(/^\/+|\/+$/g, '').replace(/\//g, '-'))
    if (fromPath) return fromPath
  }
  if (props.category) {
    const cats = Array.isArray(props.category) ? props.category : String(props.category).split(',')
    const fromCats = cats
      .map((c) => sanitizeParamKey(c))
      .filter(Boolean)
      .join('-')
    if (fromCats) return fromCats
  }
  const tags = parseInitialTags()
  if (tags.length > 0) {
    const fromTags = `tags-${tags
      .map((t) => sanitizeParamKey(t))
      .filter(Boolean)
      .join('-')}`
    if (fromTags !== 'tags-') return fromTags
  }
  return sanitizeParamKey(props.mode || currentMode.value) || 'timeline'
}

/** 参数前缀，可用 pageKey prop 覆盖 */
const stateKey = computed(() => sanitizeParamKey(props.pageKey) || deriveInstanceKey())

function paramName(suffix: string): string {
  return `${stateKey.value}${suffix}`
}

function currentHref(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname + window.location.search + window.location.hash
}

function searchParamsOf(): URLSearchParams {
  return new URL(window.location.href).searchParams
}

/** 根据当前状态生成地址栏链接（只保留有值的参数，默认值一律省略） */
function buildStateHref(): string {
  const url = new URL(window.location.href)
  const sp = url.searchParams
  // 先清掉本实例写过的参数，再按当前状态重写，避免残留脏参数
  STATE_PARAMS.forEach((suffix) => sp.delete(paramName(suffix)))

  if (currentPage.value > 1) {
    sp.set(paramName(PAGE_PARAM), String(currentPage.value))
  }

  // 筛选条件仅在归档模式下同步（时间轴模式的筛选来自 props）
  if (currentMode.value === 'archive') {
    const q = searchQuery.value.trim()
    if (q) sp.set(paramName(SEARCH_PARAM), q)
    if (selectedCategory.value) sp.set(paramName(CATEGORY_PARAM), selectedCategory.value)
    if (selectedTags.value.length > 0) {
      sp.set(paramName(TAGS_PARAM), selectedTags.value.join(','))
    }
    if (customStartDate.value) sp.set(paramName(FROM_PARAM), customStartDate.value)
    if (customEndDate.value) sp.set(paramName(TO_PARAM), customEndDate.value)
  }

  return url.pathname + url.search + url.hash
}

/**
 * 把当前状态写入地址栏
 * @param mode push    主动翻页 / 主动筛选（可被浏览器后退撤销）
 * @param mode replace 输入法连续输入等不希望污染历史记录的场景
 */
function syncStateToUrl(mode: 'push' | 'replace' = 'replace') {
  if (typeof window === 'undefined') return
  const nextHref = buildStateHref()
  if (nextHref === currentHref()) return
  // state 传 null：让 VitePress 自身的 popstate 处理跳过（不重置滚动、不重载页面）
  if (mode === 'replace' && typeof window.history.replaceState === 'function') {
    window.history.replaceState(null, '', nextHref)
  } else if (typeof window.history.pushState === 'function') {
    window.history.pushState(null, '', nextHref)
  }
}

function parsePositiveInt(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.floor(n)
}

function parseDateParam(raw: string | null): string {
  if (!raw) return ''
  const v = String(raw).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''
}

function clampPage(page: number): number {
  const total = totalPages.value
  const n = Math.floor(page)
  if (!Number.isFinite(n) || n < 1) return 1
  return n > total ? total : n
}

function isSameStringList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((item, idx) => item === b[idx])
}

/**
 * 由起止日期反推时间预设（用于从 URL 恢复时点亮对应 pill）。
 * 仅整年区间可无损还原；「近 N 个月」依赖当前时间，恢复为 custom 但区间仍准确。
 */
function derivePresetFromRange(from: string, to: string): DatePreset {
  if (!from && !to) return 'all'
  const yearMatch = /^(\d{4})-01-01$/.exec(from)
  if (yearMatch && to === `${yearMatch[1]}-12-31`) {
    return `year-${yearMatch[1]}` as DatePreset
  }
  return 'custom'
}

/** 从地址栏恢复「页码 + 筛选条件」，返回是否有实际变化 */
function restoreStateFromUrl(): boolean {
  if (typeof window === 'undefined') return false

  isRestoringFromUrl = true
  let changed = false

  try {
    const sp = searchParamsOf()

    if (currentMode.value === 'archive') {
      const q = sp.get(paramName(SEARCH_PARAM)) || ''
      if (q && q !== searchQuery.value) {
        searchQuery.value = q
        changed = true
      }
      const cat = sp.get(paramName(CATEGORY_PARAM)) || ''
      if (cat !== selectedCategory.value) {
        selectedCategory.value = cat
        changed = true
      }
      const tags = (sp.get(paramName(TAGS_PARAM)) || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (!isSameStringList(tags, selectedTags.value)) {
        selectedTags.value = tags
        changed = true
      }
      const from = parseDateParam(sp.get(paramName(FROM_PARAM)))
      const to = parseDateParam(sp.get(paramName(TO_PARAM)))
      if (from !== customStartDate.value) {
        customStartDate.value = from
        changed = true
      }
      if (to !== customEndDate.value) {
        customEndDate.value = to
        changed = true
      }
      const nextPreset = derivePresetFromRange(from, to)
      if (nextPreset !== selectedDatePreset.value) {
        selectedDatePreset.value = nextPreset
        changed = true
      }
      showCustomDateInputs.value = false
    }

    const rawPage = parsePositiveInt(sp.get(paramName(PAGE_PARAM)))
    const targetPage = rawPage === null ? currentPage.value : clampPage(rawPage)
    if (targetPage !== currentPage.value) {
      currentPage.value = targetPage
      changed = true
    }
  } finally {
    // 恢复是同步赋值的，但 watcher 回调是异步的，需要等一个微任务后再解锁
    Promise.resolve().then(() => {
      isRestoringFromUrl = false
    })
  }

  return changed
}

function handlePopState() {
  const changed = restoreStateFromUrl()
  if (changed) {
    scrollToTimelineTop()
    triggerDecrypt()
  }
}

watch(
  () => [props.category, props.tags, props.tag],
  () => {
    selectedCategory.value = typeof props.category === 'string' ? props.category : ''
    selectedTags.value = parseInitialTags()
  },
  { deep: true }
)

// 时间段筛选状态
type DatePreset = 'all' | 'custom' | `year-${string}` | 'last-3-months' | 'last-6-months' | 'last-1-year'
const selectedDatePreset = ref<DatePreset>('all')
const customStartDate = ref('')
const customEndDate = ref('')
const showCustomDateInputs = ref(false)

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

  const isFailView = localStorage.getItem('failView') === 'true'
  const normKey = localStorage.getItem(ekey_norm)
  const privKey = localStorage.getItem(ekey_priv)
  const teacherKey = localStorage.getItem(ekey_teacher)

  let resultHtml = titleHtml

  // 1. 匹配自定义加密标签：<ec ...>CIPHER</ec> / <ecp ...>CIPHER</ecp> / <tc ...>CIPHER</tc>
  const customTagRegex = /<(ec|ecp|tc)(\s+[^>]*)?>([\s\S]*?)<\/\1>/gi
  const customMatches = [...resultHtml.matchAll(customTagRegex)]

  for (const match of customMatches) {
    const fullMatch = match[0]
    const tagName = match[1].toLowerCase()
    const attrs = match[2] || ''
    const cipherText = match[3].trim()

    const fallbackMatch = attrs.match(/fallback=['"]([^'"]+)['"]/)

    if (isFailView) {
      if (fallbackMatch) {
        resultHtml = resultHtml.replace(fullMatch, fallbackMatch[1])
      }
      continue
    }

    let keyToUse: string | null = null
    if (tagName === 'ec') keyToUse = normKey
    else if (tagName === 'ecp') keyToUse = privKey
    else if (tagName === 'tc') keyToUse = teacherKey

    if (keyToUse && (isBase64Cipher(cipherText) || /^[0-9a-fA-F]{32,}$/.test(cipherText))) {
      const decrypted = await decrypt(cipherText, keyToUse)
      if (decrypted !== cipherText) {
        resultHtml = resultHtml.replace(fullMatch, decrypted)
      } else if (fallbackMatch) {
        resultHtml = resultHtml.replace(fullMatch, fallbackMatch[1])
      }
    } else if (fallbackMatch) {
      resultHtml = resultHtml.replace(fullMatch, fallbackMatch[1])
    }
  }

  // 2. 匹配标准 span 标签：<span ...class="...e..."...>CIPHER</span> / class="encrypt"
  const spanRegex = /<span\s+([^>]*?)class=['"]([^'"]*?)['"]([^>]*?)>([\s\S]*?)<\/span>/gi
  const spanMatches = [...resultHtml.matchAll(spanRegex)]

  for (const match of spanMatches) {
    const fullMatch = match[0]
    const preAttrs = match[1] || ''
    const classAttr = match[2] || ''
    const postAttrs = match[3] || ''
    const cipherText = match[4].trim()

    const fallbackMatch = (preAttrs + ' ' + postAttrs).match(/fallback=['"]([^'"]+)['"]/)

    if (isFailView) {
      if (fallbackMatch) {
        resultHtml = resultHtml.replace(fullMatch, fallbackMatch[1])
      }
      continue
    }

    let keyToUse: string | null = null
    if (/\b(e\+|encpp)\b/.test(classAttr)) {
      keyToUse = privKey
    } else if (/\beteacher\b/.test(classAttr)) {
      keyToUse = teacherKey
    } else if (/\b(e|encrypt)\b/.test(classAttr)) {
      keyToUse = normKey
    }

    if (keyToUse && (isBase64Cipher(cipherText) || /^[0-9a-fA-F]{32,}$/.test(cipherText))) {
      const decrypted = await decrypt(cipherText, keyToUse)
      if (decrypted !== cipherText) {
        resultHtml = resultHtml.replace(fullMatch, decrypted)
      } else if (fallbackMatch) {
        resultHtml = resultHtml.replace(fullMatch, fallbackMatch[1])
      }
    } else if (fallbackMatch) {
      resultHtml = resultHtml.replace(fullMatch, fallbackMatch[1])
    }
  }

  // 3. 纯 Hex/Base64 密文无标签情况处理
  const trimmed = resultHtml.trim()
  if (!isFailView && (isBase64Cipher(trimmed) || /^[0-9a-fA-F]{32,}$/.test(trimmed))) {
    const keys = [normKey, privKey, teacherKey].filter(Boolean) as string[]
    for (const k of keys) {
      const dec = await decrypt(trimmed, k)
      if (dec !== trimmed) {
        resultHtml = dec
        break
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

function formatDateToYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const todayStr = computed(() => {
  return formatDateToYMD(new Date())
})

function parsePostDate(dateStr?: string): Date | null {
  if (!dateStr) return null
  const clean = String(dateStr).replace(/[\/\.]/g, '-').trim()
  const parts = clean.split('-').map(Number)
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return new Date(parts[0], parts[1] - 1, 1)
  } else if (parts.length === 1 && !isNaN(parts[0])) {
    return new Date(parts[0], 0, 1)
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

// 可用年份列表及计数
const availableYears = computed(() => {
  const map: Record<string, number> = {}
  allPosts.forEach((post) => {
    const y = post.year || (post.date ? post.date.slice(0, 4) : '')
    if (y && /^\d{4}$/.test(y)) {
      map[y] = (map[y] || 0) + 1
    }
  })
  return Object.entries(map)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year.localeCompare(a.year, 'zh-CN', { numeric: true }))
})

// 时间段预设切换
function setDatePreset(preset: DatePreset) {
  selectedDatePreset.value = preset
  const now = new Date()

  if (preset === 'all') {
    customStartDate.value = ''
    customEndDate.value = ''
    showCustomDateInputs.value = false
  } else if (preset.startsWith('year-')) {
    const year = preset.replace('year-', '')
    customStartDate.value = `${year}-01-01`
    customEndDate.value = `${year}-12-31`
    showCustomDateInputs.value = false
  } else if (preset === 'last-3-months') {
    const start = new Date(now)
    start.setMonth(start.getMonth() - 3)
    customStartDate.value = formatDateToYMD(start)
    customEndDate.value = formatDateToYMD(now)
    showCustomDateInputs.value = false
  } else if (preset === 'last-6-months') {
    const start = new Date(now)
    start.setMonth(start.getMonth() - 6)
    customStartDate.value = formatDateToYMD(start)
    customEndDate.value = formatDateToYMD(now)
    showCustomDateInputs.value = false
  } else if (preset === 'last-1-year') {
    const start = new Date(now)
    start.setFullYear(start.getFullYear() - 1)
    customStartDate.value = formatDateToYMD(start)
    customEndDate.value = formatDateToYMD(now)
    showCustomDateInputs.value = false
  } else if (preset === 'custom') {
    showCustomDateInputs.value = true
  }
}

function toggleCustomDateInputs() {
  showCustomDateInputs.value = !showCustomDateInputs.value
  if (showCustomDateInputs.value && selectedDatePreset.value === 'all') {
    selectedDatePreset.value = 'custom'
  }
}

function onCustomDateChange() {
  selectedDatePreset.value = 'custom'
  showCustomDateInputs.value = true
}

function clearCustomDates() {
  setDatePreset('all')
}

// 活跃时间筛选标签文案
const activeDateFilterLabel = computed(() => {
  if (selectedDatePreset.value === 'all' && !customStartDate.value && !customEndDate.value) {
    return ''
  }
  if (selectedDatePreset.value.startsWith('year-')) {
    const year = selectedDatePreset.value.replace('year-', '')
    return `${year} 年`
  }
  if (selectedDatePreset.value === 'last-3-months') return '近 3 个月'
  if (selectedDatePreset.value === 'last-6-months') return '近半年'
  if (selectedDatePreset.value === 'last-1-year') return '近 1 年'

  if (customStartDate.value && customEndDate.value) {
    return `${customStartDate.value} ~ ${customEndDate.value}`
  } else if (customStartDate.value) {
    return `自 ${customStartDate.value} 起`
  } else if (customEndDate.value) {
    return `至 ${customEndDate.value} 止`
  }
  return '自定义时间段'
})

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

// ===== 筛选项折叠（标签云 / 分类 / 年份都会随内容增长而变多） =====
// 折叠时「当前已选中」的项会被固定保留，避免用户看不到自己激活的筛选条件。
const YEAR_PILLS_LIMIT = 5
const CATEGORY_PILLS_LIMIT = 14
const TAG_CHIPS_LIMIT = 12

const yearsExpanded = ref(false)
const categoriesExpanded = ref(false)
const tagsExpanded = ref(false)

/** 取列表前 limit 项作为可见项，并额外带上被置顶（已选中）的项 */
function collapseList<T>(list: T[], limit: number, isPinned: (item: T) => boolean): T[] {
  if (list.length <= limit) return list
  const head = list.slice(0, limit)
  const pinned = list.filter((item) => isPinned(item) && !head.includes(item))
  return [...head, ...pinned]
}

const visibleYearPills = computed(() => {
  if (yearsExpanded.value) return availableYears.value
  return collapseList(
    availableYears.value,
    YEAR_PILLS_LIMIT,
    (item) => selectedDatePreset.value === `year-${item.year}`
  )
})

const hiddenYearCount = computed(() =>
  Math.max(0, availableYears.value.length - visibleYearPills.value.length)
)

const visibleCategories = computed(() => {
  if (categoriesExpanded.value) return availableCategories.value
  return collapseList(
    availableCategories.value,
    CATEGORY_PILLS_LIMIT,
    (item) => selectedCategory.value === item.id
  )
})

const hiddenCategoryCount = computed(() =>
  Math.max(0, availableCategories.value.length - visibleCategories.value.length)
)

const visibleTags = computed(() => {
  if (tagsExpanded.value) return availableTags.value
  const pinned = new Set(selectedTags.value.map((t) => t.trim().toLowerCase()))
  return collapseList(availableTags.value, TAG_CHIPS_LIMIT, (item) =>
    pinned.has(item.name.trim().toLowerCase())
  )
})

const hiddenTagCount = computed(() => Math.max(0, availableTags.value.length - visibleTags.value.length))

// 列表变短时（切换分类后标签变少等）自动收起，避免残留无意义的展开状态
watch([availableTags, availableCategories, availableYears], () => {
  if (availableTags.value.length <= TAG_CHIPS_LIMIT) tagsExpanded.value = false
  if (availableCategories.value.length <= CATEGORY_PILLS_LIMIT) categoriesExpanded.value = false
  if (availableYears.value.length <= YEAR_PILLS_LIMIT) yearsExpanded.value = false
})

// 过滤后的文章列表（支持解密后的明文标题搜索与时间段过滤！）
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

  // 3. 联合标签筛选（AND 逻辑：文章必须包含所有选中的标签，支持忽略大小写匹配）
  const activeTags = [...new Set([...parseInitialTags(), ...selectedTags.value])]
  if (activeTags.length > 0) {
    list = list.filter((p) => {
      if (!Array.isArray(p.tags) || p.tags.length === 0) return false
      return activeTags.every((reqTag) =>
        p.tags.some((pt) => pt.trim().toLowerCase() === reqTag.trim().toLowerCase())
      )
    })
  }

  // 4. 时间段筛选 (Date Range Filter)
  if (customStartDate.value || customEndDate.value) {
    let startTs = -Infinity
    if (customStartDate.value) {
      const s = new Date(customStartDate.value + 'T00:00:00')
      if (!isNaN(s.getTime())) startTs = s.getTime()
    }

    let endTs = Infinity
    if (customEndDate.value) {
      const e = new Date(customEndDate.value + 'T23:59:59.999')
      if (!isNaN(e.getTime())) endTs = e.getTime()
    }

    list = list.filter((p) => {
      const pd = parsePostDate(p.date)
      if (!pd) return true
      const ts = pd.getTime()
      return ts >= startTs && ts <= endTs
    })
  }

  // 5. 搜索关键词（支持解密后的真实明文搜索）
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

// 收缩状态管理（窄屏时减少页码数量）
const isCompactViewport = ref(false)
const COMPACT_MEDIA_QUERY = '(max-width: 640px)'
let compactMediaQuery: MediaQueryList | null = null

function syncCompactViewport() {
  isCompactViewport.value = compactMediaQuery
    ? compactMediaQuery.matches
    : typeof window !== 'undefined' && window.innerWidth <= 640
}

// 经典页码计算 [prev, 1, 2, 3, 4, 5, '...', LAST, next]
// 紧凑视口（手机）下减少页码槽位，保证整行分页栏不换行
const visiblePageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  return buildPageWindow(total, current, isCompactViewport.value ? 5 : 7)
})

/** 生成带省略号的页码窗口，最终条目数不超过 slots 个 */
function buildPageWindow(
  total: number,
  current: number,
  slots: number
): Array<number | string> {
  if (total <= slots) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const sideCount = slots - 2

  // 靠前部分：1 2 3 4 5 ... LAST
  if (current <= sideCount) {
    return [...Array.from({ length: sideCount }, (_, i) => i + 1), '...', total]
  }

  // 靠后部分：1 ... LAST-4 LAST-3 LAST-2 LAST-1 LAST
  if (current > total - sideCount) {
    return [1, '...', ...Array.from({ length: sideCount }, (_, i) => total - sideCount + 1 + i)]
  }

  // 中间部分：1 ... current-1 current current+1 ... total
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function setPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  // 翻页即写入地址栏：?xxx_page=N，方便分享 / 刷新 / 后退
  syncStateToUrl('push')
  scrollToTimelineTop()
  triggerDecrypt()
}

function scrollToTimelineTop() {
  if (typeof window === 'undefined') return
  const targetEl = timelineEl.value || (document.querySelector('.expansion-timeline') as HTMLElement | null) || rootEl.value
  if (targetEl) {
    const top = targetEl.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
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

// ===== 复制导出协议（_toMarkdown / _toText） =====
// 复制整页内容时，展开组件会把「所有分页」的文章一次性导出，
// 而不是只复制当前可见的那一页（普通序列化只会遍历已渲染的 DOM）。

function stripHtml(raw: string): string {
  return String(raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 复制导出用的标题文本
 *  - 默认：跟随页面当前显示状态（已解锁密钥输出明文，未解锁输出密文）
 *  - keepTitleCipher：无论是否解锁都输出密文，避免明文落入剪贴板
 */
function getExportTitle(post: PostItem): string {
  if (!props.keepTitleCipher) {
    const decInfo = decryptedTitles.value[post.url]
    if (decInfo && decInfo.plainText) return decInfo.plainText
  }
  return stripHtml(post.title)
}

/** 取出指定分页（1 起）的文章切片 */
function getPagePosts(pageIndex: number): PostItem[] {
  if (!isPaginationEnabled.value) return filteredPosts.value
  const size = effectivePageSize.value
  const start = (pageIndex - 1) * size
  return filteredPosts.value.slice(start, start + size)
}

/** 参与复制的标签（显式 hideTags 时不输出） */
function getExportTags(post: PostItem): string[] {
  if (props.hideTags) return []
  return Array.isArray(post.tags) ? post.tags.filter(Boolean) : []
}

function buildPostMarkdown(post: PostItem): string {
  const parts: string[] = []
  if (post.date) parts.push(`**${post.date}**`)
  if (showCategory.value && post.categoryName) parts.push(`\`${post.categoryName}\``)
  const title = getExportTitle(post)
  const href = resolveHref(post.url)
  parts.push(title ? `[${title}](${href})` : href)
  if (post.desc) parts.push(`- ${stripHtml(post.desc)}`)
  const tags = getExportTags(post)
  if (tags.length > 0) parts.push(tags.map((t) => `#${t}`).join(' '))
  return `- ${parts.join(' ')}\n`
}

function buildPostText(post: PostItem): string {
  const parts: string[] = []
  if (post.date) parts.push(post.date)
  if (showCategory.value && post.categoryName) parts.push(`[${post.categoryName}]`)
  const title = getExportTitle(post)
  parts.push(title || resolveHref(post.url))
  if (post.desc) parts.push(`(${stripHtml(post.desc)})`)
  const tags = getExportTags(post)
  if (tags.length > 0) parts.push(`(${tags.join(', ')})`)
  return `- ${parts.join(' ')}\n`
}

/** 所有分页的完整 Markdown 列表（Page 1 ... Page 2 ...） */
function buildAllPagesMarkdown(): string {
  const posts = filteredPosts.value
  if (posts.length === 0) return ''

  const totalPageCount = isPaginationEnabled.value ? totalPages.value : 1
  const heading = currentMode.value === 'archive' ? '全站文章归档' : '文章时间轴'
  const summary = totalPageCount > 1 ? `共 ${posts.length} 篇 / ${totalPageCount} 页` : `共 ${posts.length} 篇`

  let md = `

## ${heading}（${summary}）

`
  for (let page = 1; page <= totalPageCount; page++) {
    if (totalPageCount > 1) {
      md += `

#### Page ${page} / ${totalPageCount}

`
    }
    let lastYear = ''
    for (const post of getPagePosts(page)) {
      const y = post.year || ''
      if (y && y !== lastYear) {
        md += `

### ${y} 年

`
        lastYear = y
      }
      md += buildPostMarkdown(post)
    }
  }
  return md
}

/** 所有分页的完整纯文本列表 */
function buildAllPagesText(): string {
  const posts = filteredPosts.value
  if (posts.length === 0) return ''

  const totalPageCount = isPaginationEnabled.value ? totalPages.value : 1
  const heading = currentMode.value === 'archive' ? '全站文章归档' : '文章时间轴'

  let text = `[${heading}] 共 ${posts.length} 篇
`
  for (let page = 1; page <= totalPageCount; page++) {
    if (totalPageCount > 1) {
      text += `[Page ${page} / ${totalPageCount}]
`
    }
    let lastYear = ''
    for (const post of getPagePosts(page)) {
      const y = post.year || ''
      if (y && y !== lastYear) {
        text += `[${y} 年]
`
        lastYear = y
      }
      text += buildPostText(post)
    }
  }
  return text
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
  selectedCategory.value = typeof props.category === 'string' ? props.category : ''
  selectedTags.value = parseInitialTags()
  searchQuery.value = ''
  selectedDatePreset.value = 'all'
  customStartDate.value = ''
  customEndDate.value = ''
  showCustomDateInputs.value = false
  currentPage.value = 1
  syncStateToUrl('replace')
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
  if ([ekey_norm, ekey_priv, ekey_teacher, 'failView'].includes(e.key || '')) {
    triggerDecrypt()
  }
}

onMounted(() => {
  // 复制整页时输出「所有分页」的完整内容，而非当前可见的一页
  const el = rootEl.value
  if (el) {
    ;(el as any)._toMarkdown = () => buildAllPagesMarkdown()
    ;(el as any)._toText = () => buildAllPagesText()
  }
  // 紧凑视口下减少页码槽位，避免分页栏换行
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    compactMediaQuery = window.matchMedia(COMPACT_MEDIA_QUERY)
    syncCompactViewport()
    if (typeof compactMediaQuery.addEventListener === 'function') {
      compactMediaQuery.addEventListener('change', syncCompactViewport)
    }
  }
  // 支持 ?xxx_page=N / ?xxx_q=... / ?xxx_cat=... 等直达指定状态
  // （刷新、分享链接、浏览器前进后退）
  restoreStateFromUrl()
  triggerDecrypt()
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent)
    window.addEventListener('gpg-keys-updated', () => {
      triggerDecrypt()
    })
    window.addEventListener('fail-view-change', () => {
      triggerDecrypt()
    })
    window.addEventListener('popstate', handlePopState)
  }
  setTimeout(triggerDecrypt, 150)
  setTimeout(triggerDecrypt, 500)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('storage', handleStorageEvent)
    window.removeEventListener('popstate', handlePopState)
    window.removeEventListener('fail-view-change', () => {
      triggerDecrypt()
    })
  }
  if (compactMediaQuery && typeof compactMediaQuery.removeEventListener === 'function') {
    compactMediaQuery.removeEventListener('change', syncCompactViewport)
    compactMediaQuery = null
  }
})

watch(
  [selectedCategory, selectedTags, searchQuery, customStartDate, customEndDate],
  () => {
    if (isRestoringFromUrl) return
    currentPage.value = 1
    // 筛选条件变化后回到第一页，并把新的筛选条件写回地址栏
    syncStateToUrl('replace')
    triggerDecrypt()
  },
  { deep: true }
)

watch(
  () => currentPage.value,
  () => {
    triggerDecrypt()
  }
)</script>

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

/* 筛选项折叠区块（年份 / 分类 / 标签云共用） */
.filter-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-more-row {
  display: flex;
  justify-content: flex-end;
}

.filter-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.filter-more-btn:hover {
  color: var(--vp-c-brand);
  background: var(--vp-c-default-soft);
}

.more-arrow {
  display: inline-block;
  font-size: 10px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.more-arrow.open {
  transform: rotate(180deg);
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

.pill-btn.custom-date-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dropdown-arrow {
  display: inline-block;
  font-size: 10px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

/* 自定义时间段面板 */
.custom-date-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.custom-date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.custom-date-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.clear-date-link {
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--vp-c-text-3);
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.clear-date-link:hover {
  color: #ff4d4f;
  text-decoration: underline;
}

.custom-date-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-picker-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 160px;
}

.field-label {
  font-size: 11px;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.date-input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.date-icon {
  position: absolute;
  left: 10px;
  color: var(--vp-c-text-3);
  pointer-events: none;
}

.date-input {
  width: 100%;
  height: 34px;
  padding: 0 10px 0 32px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color-scheme: light dark;
  outline: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.date-input:focus {
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 2px rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.2);
  background: var(--vp-c-bg);
}

.date-range-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-3);
  margin-top: 18px;
}

.custom-date-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--vp-c-text-2);
  padding-top: 8px;
  border-top: 1px dashed var(--vp-c-divider);
}

.date-range-badge {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-brand);
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.range-arrow {
  color: var(--vp-c-text-3);
}

/* 展开过渡动画 */
.date-panel-slide-enter-active,
.date-panel-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.date-panel-slide-enter-from,
.date-panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
  /* 容器查询：按分页栏自身可用宽度（而非视口宽度）决定是否收起文字标签 */
  container-type: inline-size;
  flex-wrap: nowrap;
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
  .custom-date-wrap {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .date-range-divider {
    display: none;
  }
  .timeline-pagination {
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
  .page-btn.nav-btn {
    padding: 0 7px;
  }
  /* 兜底：不支持容器查询的浏览器也能在窄屏收起文字标签 */
  .page-btn.nav-btn .nav-label {
    display: none;
  }
}

/* 分页栏自身宽度不足时，先收起 Prev/Next 的文字标签（只留箭头） */
@container (max-width: 460px) {
  .page-btn.nav-btn .nav-label {
    display: none;
  }
}

/* 极窄屏：进一步压缩间距，保证 5 个页码 + 前后箭头仍在同一行 */
@container (max-width: 300px) {
  .timeline-pagination {
    gap: 3px;
  }
  .page-btn.num-btn {
    min-width: 26px;
  }
  .page-btn.nav-btn {
    padding: 0 5px;
  }
}
</style>
