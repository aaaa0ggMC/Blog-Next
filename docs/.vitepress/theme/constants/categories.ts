/**
 * 博客全站分类 (Category) 映射字典与配置
 */

export interface CategoryDefinition {
  id: string
  name: string
  dirPattern: string
  description?: string
}

export const CATEGORY_MAP: Record<string, string> = {
  // 随笔与随记板块
  notes: '随记',
  essays: '随笔年鉴',
  poems: '诗歌',
  dreams: '纪梦',
  forget_me_not: '勿忘我',
  are_you_____: 'Are You 口口口口',

  // 学习板块
  c_cpp: 'C/C++学习',
  life: '编程生涯',
  programming: '编程技术',
  linux: '系统与Linux',
  chinese: '语文思考',
  english: '高考英语',
  subjects: '学科思考',
  reading: '读书笔记',

  // 游戏板块
  '3c3u': '3C3U历险记',
  greedy: '贪婪',
  gaming_life: '游戏人生',

  // 探险与杂项
  exploration: '探险',
  others: '杂项',

  // 兜底分类
  unknown: '未知/其他',
}

/**
 * 顶级板块与子分类关联映射表
 */
export const SECTION_CATEGORIES_MAP: Record<string, string[]> = {
  writings: ['writings', 'essays', 'poems', 'dreams', 'forget_me_not', 'are_you_____'],
  keep_learning: ['keep_learning', 'c_cpp', 'life', 'programming', 'linux', 'chinese', 'english', 'subjects', 'reading'],
  gaming_life: ['gaming_life', '3c3u', 'greedy'],
  exploration: ['exploration'],
  notes: ['notes'],
  others: ['others'],
}

/**
 * 路径到分类的探测匹配规则 (按特异度从高到低排列)
 */
export const PATH_CATEGORY_RULES: Array<{ pattern: string; id: string }> = [
  { pattern: 'notes', id: 'notes' },
  { pattern: 'writings/essays', id: 'essays' },
  { pattern: 'writings/poems', id: 'poems' },
  { pattern: 'writings/dreams', id: 'dreams' },
  { pattern: 'writings/forget_me_not', id: 'forget_me_not' },
  { pattern: 'writings/are_you_____', id: 'are_you_____' },

  { pattern: 'keep_learning/programming/c_cpp', id: 'c_cpp' },
  { pattern: 'keep_learning/programming/life', id: 'life' },
  { pattern: 'keep_learning/programming', id: 'programming' },
  { pattern: 'keep_learning/linux', id: 'linux' },
  { pattern: 'keep_learning/subjects/chinese', id: 'chinese' },
  { pattern: 'keep_learning/subjects/english', id: 'english' },
  { pattern: 'keep_learning/subjects', id: 'subjects' },
  { pattern: 'keep_learning/reading', id: 'reading' },

  { pattern: 'gaming_life/3c3u', id: '3c3u' },
  { pattern: 'gaming_life/greedy', id: 'greedy' },
  { pattern: 'gaming_life', id: 'gaming_life' },

  { pattern: 'exploration', id: 'exploration' },
  { pattern: 'others', id: 'others' },
]

/**
 * 构建期排除在文章列表之外的特殊系统路径
 */
export const EXCLUDED_POST_PATHS: string[] = [
  'index.md',
  '/index.md',
  '/about/index',
  '/about/',
  '/notes/index',
  '/notes/',
  '/settings/index',
  '/settings/',
  '/friends/index',
  '/friends/',
  '/archives/index',
  '/archives/',
  '/style',
  '/debug.enc',
  'ENCRYPTION_GUIDE.md',
]

/**
 * 格式化并规范化文章标题中的加密标签
 * 将 <ec> / <ecp> / <tc> / <span class="encrypt"> 等转为标准可解密 span 标签，并移除 changeTitle
 */
export function normalizeTitle(rawTitle: string): string {
  if (!rawTitle) return ''
  let title = rawTitle.trim()

  // 1. 匹配 <ec ...>HEX/Base64</ec> -> <span class="e">...</span>
  if (/<ec(\s+[^>]*)?>([\s\S]*?)<\/ec>/i.test(title)) {
    title = title.replace(/<ec(\s+[^>]*)?>([\s\S]*?)<\/ec>/gi, (_match, attrs, text) => {
      const cleanAttrs = (attrs || '').replace(/\bchangeTitle\b/gi, '').trim()
      return `<span class="e"${cleanAttrs ? ' ' + cleanAttrs : ''}>${text.trim()}</span>`
    })
  }

  // 2. 匹配 <ecp ...>HEX/Base64</ecp> -> <span class="e+">...</span>
  if (/<ecp(\s+[^>]*)?>([\s\S]*?)<\/ecp>/i.test(title)) {
    title = title.replace(/<ecp(\s+[^>]*)?>([\s\S]*?)<\/ecp>/gi, (_match, attrs, text) => {
      const cleanAttrs = (attrs || '').replace(/\bchangeTitle\b/gi, '').trim()
      return `<span class="e+"${cleanAttrs ? ' ' + cleanAttrs : ''}>${text.trim()}</span>`
    })
  }

  // 3. 匹配 <tc ...>HEX/Base64</tc> -> <span class="eteacher">...</span>
  if (/<tc(\s+[^>]*)?>([\s\S]*?)<\/tc>/i.test(title)) {
    title = title.replace(/<tc(\s+[^>]*)?>([\s\S]*?)<\/tc>/gi, (_match, attrs, text) => {
      const cleanAttrs = (attrs || '').replace(/\bchangeTitle\b/gi, '').trim()
      return `<span class="eteacher"${cleanAttrs ? ' ' + cleanAttrs : ''}>${text.trim()}</span>`
    })
  }

  // 4. 匹配已有的 <span class="encrypt" / "e" / "encpp" / "eteacher" ...>
  if (/<span\s+[^>]*class=['"](encrypt|encpp|eteacher|e\+?)[^'"]*['"][^>]*>[\s\S]*?<\/span>/i.test(title)) {
    title = title.replace(/\bchangeTitle\b/gi, '')
    return title
  }

  // 5. 纯 Hex 或 Base64 密文字符串自动包装为 <span class="e">
  if (/^[0-9a-fA-F]{32,}$/.test(title) || /^[A-Za-z0-9+/]{40,}={0,2}$/.test(title)) {
    return `<span class="e">${title}</span>`
  }

  // 6. 普通纯文本标题：清洗非加密 HTML
  const cleanTitle = title.replace(/<[^>]+>/g, '').trim()
  return cleanTitle || title
}

/**
 * 根据文件 URL 自动推断所属分类
 */
export function inferCategoryFromUrl(url: string): { id: string; name: string } {
  const clean = url.replace(/^\//, '').replace(/\/$/, '')

  for (const rule of PATH_CATEGORY_RULES) {
    if (clean.includes(rule.pattern)) {
      return { id: rule.id, name: CATEGORY_MAP[rule.id] || rule.id }
    }
  }

  return { id: 'unknown', name: CATEGORY_MAP.unknown }
}
