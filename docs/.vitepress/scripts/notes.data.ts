import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeTitle } from '../theme/constants/categories'

export interface NoteItem {
  url: string
  title: string
  date: string
  tags: string[]
  frontmatter: Record<string, any>
}

function getDocsDir(): string {
  const cwdDocs = path.resolve(process.cwd(), 'docs')
  if (fs.existsSync(cwdDocs)) return cwdDocs
  const scriptDocs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../')
  if (fs.existsSync(scriptDocs)) return scriptDocs
  return path.resolve(process.cwd())
}
const docsDir = getDocsDir()

function extractFrontmatter(raw: string): { fm: Record<string, any>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { fm: {}, body: raw }
  const rawFm = match[1]
  const body = match[2]
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
  return { fm, body }
}

function scanNotes(dir: string, baseDir: string = docsDir): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const list = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of list) {
    if (['node_modules', '.vitepress', 'public', 'dist', 'cache', '.git'].includes(item.name)) continue
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...scanNotes(fullPath, baseDir))
    } else if (item.isFile() && item.name.endsWith('.md')) {
      if (item.name === 'index.md') continue
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
      results.push(relPath)
    }
  }
  return results
}

declare const data: NoteItem[]
export { data }

export default {
  watch: ['../../notes/**/*.md'],
  load(): NoteItem[] {
    const notesDir = path.join(docsDir, 'notes')
    const files = scanNotes(notesDir, docsDir)
    const items: NoteItem[] = []

    for (const relPath of files) {
      const fullPath = path.join(docsDir, relPath)
      let raw = ''
      try {
        raw = fs.readFileSync(fullPath, 'utf-8')
      } catch {
        continue
      }

      const { fm, body } = extractFrontmatter(raw)
      const cleanUrl = '/' + relPath.replace(/\.md$/, '')

      let title = fm.title || ''
      if (!title) {
        const h1Match = body.match(/^#\s+(.+)$/m)
        title = h1Match ? h1Match[1].trim() : path.basename(relPath, '.md')
      }

      let date = '2026/08/22'
      if (fm.date) {
        date = String(fm.date).trim().replace(/-/g, '/')
      } else {
        const dateMatch = cleanUrl.match(/20\d{2}[-_/]\d{2}[-_/]\d{2}/)
        if (dateMatch) {
          date = dateMatch[0].replace(/[-_]/g, '/')
        }
      }

      let tags: string[] = []
      if (Array.isArray(fm.tags)) {
        tags = fm.tags.map((t: any) => String(t).trim()).filter(Boolean)
      } else if (typeof fm.tags === 'string' && fm.tags) {
        tags = [fm.tags.trim()]
      } else if (typeof fm.tag === 'string' && fm.tag) {
        tags = [fm.tag.trim()]
      }

      items.push({
        url: cleanUrl,
        title: normalizeTitle(title),
        date,
        tags,
        frontmatter: fm,
      })
    }

    items.sort((a, b) => b.date.localeCompare(a.date, 'zh-CN', { numeric: true }))
    return items
  },
}
