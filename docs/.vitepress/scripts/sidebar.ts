import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const docsDir = path.resolve(__dirname, '../../')

export interface SidebarItem {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

// 目录名称到侧边栏显示标题的映射字典（兼顾目录名规范与优雅的中文展示）
const dirTitleMap: Record<string, string> = {
  gaming_life: '游戏人生',
  '3c3u': '3C3U历险记',
  greedy: '贪婪--阶段性总结',
  exploration: '探险',
  writings: '随笔',
  notes: '随记',
  essays: '随笔',
  '2025': '2025 随笔',
  '2026': '2026 随笔',
  forget_me_not: '勿忘我',
  vol_1: '--Vol.I',
  vol_2: '--Vol.II',
  vol_3: '--Vol.III',
  dreams: '纪梦',
  poems: '诗歌',
  are_you_____: 'Are You 口口口口',
  keep_learning: 'Keep Learning',
  programming: '编程技术与生涯',
  c_cpp: 'C/C++学习',
  life: '编程生涯记录',
  linux: '系统与Linux',
  subjects: '学科思考',
  chinese: '语文学习方法',
  english: '高考英语',
  reading: '读书笔记',
  others: '杂项',
  about: 'About Me',
  friends: '友链',
  archives: '文章归档',
}

// 提取 Markdown 文件标题（优先 Frontmatter title，其次一级标题 #，再次格式化文件名）
function getMarkdownTitle(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fmMatch = content.match(/^---\r?\n[\s\S]*?title:\s*['"]?([^\r\n'"]+)['"]?[\s\S]*?---/)
    if (fmMatch) return fmMatch[1].trim()

    const h1Match = content.match(/^#\s+(.+)$/m)
    if (h1Match) {
      const rawH1 = h1Match[1].trim()

      // 1. 匹配 <ec ...>HEX</ec> -> <span class="e">HEX</span>
      if (/<ec(\s+[^>]*)?>([\s\S]*?)<\/ec>/i.test(rawH1)) {
        return rawH1.replace(/<ec(\s+[^>]*)?>([\s\S]*?)<\/ec>/gi, (_match, attrs, text) => {
          const cleanAttrs = (attrs || '').replace(/\bchangeTitle\b/gi, '').trim()
          return `<span class="e"${cleanAttrs ? ' ' + cleanAttrs : ''}>${text.trim()}</span>`
        })
      }

      // 2. 匹配 <ecp ...>HEX</ecp> -> <span class="e+">HEX</span>
      if (/<ecp(\s+[^>]*)?>([\s\S]*?)<\/ecp>/i.test(rawH1)) {
        return rawH1.replace(/<ecp(\s+[^>]*)?>([\s\S]*?)<\/ecp>/gi, (_match, attrs, text) => {
          const cleanAttrs = (attrs || '').replace(/\bchangeTitle\b/gi, '').trim()
          return `<span class="e+"${cleanAttrs ? ' ' + cleanAttrs : ''}>${text.trim()}</span>`
        })
      }

      // 3. 匹配 <tc ...>HEX</tc> -> <span class="eteacher">HEX</span>
      if (/<tc(\s+[^>]*)?>([\s\S]*?)<\/tc>/i.test(rawH1)) {
        return rawH1.replace(/<tc(\s+[^>]*)?>([\s\S]*?)<\/tc>/gi, (_match, attrs, text) => {
          const cleanAttrs = (attrs || '').replace(/\bchangeTitle\b/gi, '').trim()
          return `<span class="eteacher"${cleanAttrs ? ' ' + cleanAttrs : ''}>${text.trim()}</span>`
        })
      }

      // 4. 匹配已有的 <span class="encrypt" / "e" / "encpp" / "eteacher" ...>
      if (/<span\s+[^>]*class=['"](encrypt|encpp|eteacher|e\+?)[^'"]*['"][^>]*>[\s\S]*?<\/span>/i.test(rawH1)) {
        return rawH1.replace(/\bchangeTitle\b/gi, '')
      }

      // 5. 纯 Hex 或 Base64 密文字符串自动包装为 <span class="e">
      if (/^[0-9a-fA-F]{32,}$/.test(rawH1) || /^[A-Za-z0-9+/]{44,}={0,2}$/.test(rawH1)) {
        return `<span class="e">${rawH1}</span>`
      }

      // 普通标题：去除其他非加密 HTML 标签
      const cleanTitle = rawH1.replace(/<[^>]+>/g, '').trim()
      if (cleanTitle) return cleanTitle
    }
  } catch (e) {}

  return path.basename(filePath, '.md')
}

// 递归扫描生成指定子目录的侧边栏结构
function generateSidebarForDir(subDir: string): SidebarItem[] {
  const fullDirPath = path.join(docsDir, subDir)
  if (!fs.existsSync(fullDirPath)) return []

  const entries = fs.readdirSync(fullDirPath, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true, sensitivity: 'base' }))
  const items: SidebarItem[] = []

  // 1. 若当前目录有 index.md，将其作为概览/首页链接
  const hasIndex = entries.some(e => e.isFile() && e.name === 'index.md')
  if (hasIndex) {
    const title = getMarkdownTitle(path.join(fullDirPath, 'index.md')) || dirTitleMap[path.basename(subDir)] || path.basename(subDir)
    items.push({
      text: title,
      link: `/${subDir}/`.replace(/\/+/g, '/'),
    })
  }

  // 2. 扫描子目录
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (['public', '.vitepress', 'node_modules', 'dist', 'cache'].includes(entry.name)) continue
      const subPath = path.join(subDir, entry.name)
      const subItems = generateSidebarForDir(subPath)

      const subIndexPath = path.join(docsDir, subPath, 'index.md')
      const dirTitle = dirTitleMap[entry.name] || (fs.existsSync(subIndexPath) ? getMarkdownTitle(subIndexPath) : entry.name)

      if (subItems.length > 0) {
        const firstItemIsIndex = subItems[0]?.link === `/${subPath}/`.replace(/\/+/g, '/')
        items.push({
          text: dirTitle,
          collapsed: true,
          link: firstItemIsIndex ? `/${subPath}/`.replace(/\/+/g, '/') : undefined,
          items: firstItemIsIndex ? subItems.slice(1) : subItems,
        })
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (entry.name === 'index.md') continue
      const filePath = path.join(fullDirPath, entry.name)
      const title = getMarkdownTitle(filePath)
      const linkName = entry.name.replace(/\.md$/, '')
      items.push({
        text: title,
        link: `/${subDir}/${linkName}`.replace(/\/+/g, '/'),
      })
    }
  }

  return items
}

/**
 * 自动生成全站各版块侧边栏
 */
export function autoSidebar(sections = ['gaming_life', 'exploration', 'writings', 'notes', 'keep_learning', 'others', 'about', 'friends', 'archives']): Record<string, SidebarItem[]> {
  const sidebar: Record<string, SidebarItem[]> = {}
  for (const sec of sections) {
    if (sec === 'others') {
      const othersItems = generateSidebarForDir(sec)
      othersItems.push({
        text: '调试功能',
        collapsed: false,
        items: [
          { text: 'MathJax 与公式展示', link: '/style' },
          { text: '加密解密调试 (debug.enc)', link: '/debug.enc' },
        ],
      })
      sidebar[`/${sec}`] = othersItems
      sidebar['/style'] = othersItems
      sidebar['/debug.enc'] = othersItems
    } else {
      sidebar[`/${sec}`] = generateSidebarForDir(sec)
    }
  }
  return sidebar
}
