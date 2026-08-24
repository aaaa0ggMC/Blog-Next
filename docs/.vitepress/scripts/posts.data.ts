import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CATEGORY_MAP,
  EXCLUDED_POST_PATHS,
  inferCategoryFromUrl,
  normalizeTitle,
} from '../theme/constants/categories'

export interface PostItem {
  url: string
  title: string
  date: string
  year: string
  category: string
  categoryName: string
  tags: string[]
  desc?: string
  highlight?: boolean
  wordCount?: number
}

export { CATEGORY_MAP }

function getDocsDir(): string {
  const cwdDocs = path.resolve(process.cwd(), 'docs')
  if (fs.existsSync(cwdDocs)) return cwdDocs
  const scriptDocs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../')
  if (fs.existsSync(scriptDocs)) return scriptDocs
  return path.resolve(process.cwd())
}
const docsDir = getDocsDir()

function extractTitleFromContent(content: string, fallback: string): string {
  const fmMatch = content.match(/^---\r?\n[\s\S]*?title:\s*['"]?([^\r\n'"]+)['"]?[\s\S]*?---/)
  if (fmMatch && fmMatch[1]) {
    return normalizeTitle(fmMatch[1].trim())
  }

  const h1Match = content.match(/^#\s+(.+)$/m)
  if (h1Match) {
    const raw = h1Match[1].trim()
    return normalizeTitle(raw)
  }

  return normalizeTitle(fallback)
}

function extractFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const rawFm = match[1]
  const fm: Record<string, any> = {}

  for (const line of rawFm.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx !== -1) {
      const key = trimmed.slice(0, colonIdx).trim()
      let val: any = trimmed.slice(colonIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      } else if (val === 'true') {
        val = true
      } else if (val === 'false') {
        val = false
      } else if (val.startsWith('[') && val.endsWith(']')) {
        val = val
          .slice(1, -1)
          .split(',')
          .map((s: string) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      }
      fm[key] = val
    }
  }
  return fm
}

function extractDate(fmDate: any, url: string): { dateStr: string; yearStr: string } {
  if (fmDate) {
    const s = String(fmDate).trim().replace(/-/g, '/')
    const yearMatch = s.match(/^(\d{4})/)
    return {
      dateStr: s,
      yearStr: yearMatch ? yearMatch[1] : '2026',
    }
  }

  const dateMatch = url.match(/20\d{2}[-_/]\d{2}[-_/]\d{2}/)
  if (dateMatch) {
    const s = dateMatch[0].replace(/[-_]/g, '/')
    return { dateStr: s, yearStr: s.slice(0, 4) }
  }

  const yearMatch = url.match(/(202\d)/)
  if (yearMatch) {
    return { dateStr: `${yearMatch[1]}/01/01`, yearStr: yearMatch[1] }
  }

  return { dateStr: '2025/01/01', yearStr: '2025' }
}

function countWords(content: string): number {
  if (!content) return 0
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
  const withoutCode = body.replace(/```[\s\S]*?```/g, '')
  const withoutHtml = withoutCode.replace(/<[^>]+>/g, '')
  const cjkMatches = withoutHtml.match(/[\u4e00-\u9fa5\u3040-\u30ff]/g) || []
  const wordsMatches = withoutHtml
    .replace(/[\u4e00-\u9fa5\u3040-\u30ff]/g, ' ')
    .match(/[a-zA-Z0-9_\u0392-\u03c9\u0400-\u04FF]+(-[a-zA-Z0-9_\u0392-\u03c9\u0400-\u04FF]+)*/g) || []
  return cjkMatches.length + wordsMatches.length
}

function scanMarkdownFiles(dir: string, baseDir: string = docsDir): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const list = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of list) {
    if (['node_modules', '.vitepress', 'public', 'dist', 'cache', '.git'].includes(item.name)) continue
    if (item.name === 'ENCRYPTION_GUIDE.md') continue

    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...scanMarkdownFiles(fullPath, baseDir))
    } else if (item.isFile() && item.name.endsWith('.md')) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
      results.push(relPath)
    }
  }
  return results
}

declare const data: PostItem[]
export { data }

export default {
  watch: ['../../**/*.md'],
  load(): PostItem[] {
    const files = scanMarkdownFiles(docsDir)
    const posts: PostItem[] = []

    for (const relPath of files) {
      if (relPath === 'index.md' || relPath.endsWith('/index.md')) {
        continue
      }
      const cleanUrl = '/' + relPath.replace(/\.md$/, '').replace(/\/index$/, '')

      if (EXCLUDED_POST_PATHS.some((p) => relPath === p || cleanUrl.endsWith(p) || cleanUrl === p)) {
        continue
      }
      if (cleanUrl === '/' || cleanUrl === '') continue

      const fullPath = path.join(docsDir, relPath)
      let content = ''
      try {
        content = fs.readFileSync(fullPath, 'utf-8')
      } catch (e) {
        continue
      }

      const fm = extractFrontmatter(content)
      const fallbackTitle = path.basename(relPath, '.md')
      const title = fm.title || extractTitleFromContent(content, fallbackTitle)

      const { dateStr, yearStr } = extractDate(fm.date, cleanUrl)

      let categoryId = fm.category
      let categoryName = ''

      if (categoryId) {
        if (CATEGORY_MAP[categoryId]) {
          categoryName = CATEGORY_MAP[categoryId]
        } else {
          categoryId = 'unknown'
          categoryName = CATEGORY_MAP.unknown
        }
      } else {
        const inferred = inferCategoryFromUrl(cleanUrl)
        categoryId = inferred.id
        categoryName = inferred.name
      }

      let tags: string[] = []
      if (Array.isArray(fm.tags)) {
        tags = fm.tags.map((t: any) => String(t).trim()).filter(Boolean)
      } else if (typeof fm.tags === 'string' && fm.tags) {
        tags = [fm.tags.trim()]
      } else if (typeof fm.tag === 'string' && fm.tag) {
        tags = [fm.tag.trim()]
      }

      posts.push({
        url: cleanUrl,
        title,
        date: dateStr,
        year: yearStr,
        category: categoryId,
        categoryName,
        tags,
        desc: fm.desc || fm.description || '',
        highlight: !!fm.highlight,
        wordCount: countWords(content),
      })
    }

    posts.sort((a, b) => b.date.localeCompare(a.date, 'zh-CN', { numeric: true }))
    return posts
  },
}
