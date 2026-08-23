import fs from 'node:fs'
import path from 'node:path'
import type { SiteConfig } from 'vitepress'
import postsLoader from './posts.data'

const SITE_URL = 'https://yslwd.eu.org'
const BLOG_TITLE = "aaaa0ggmc's Blog"
const BLOG_DESC = '记住生活 Forget me Not(勿忘我)'
const AUTHOR_NAME = 'aaaa0ggmc'

function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sanitizeSummary(text: string): string {
  if (!text) return ''
  // 彻底剔除任何可能的加密标签、HTML 标签及密文字符
  return text
    .replace(/<(ec|ecp|tc|enc|Decryptor)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export async function generateRss(config: SiteConfig): Promise<void> {
  const outDir = config.outDir || path.resolve(config.root, '.vitepress/dist')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // 1. 获取全量文章列表（按日期倒序）
  const posts = postsLoader.load()
  const now = new Date().toUTCString()

  // 2. 构建 RSS 2.0 XML
  const itemsXml = posts
    .slice(0, 50) // 保留最新 50 篇
    .map((post) => {
      const link = `${SITE_URL}${post.url}`
      const cleanDesc = sanitizeSummary(post.desc || '')
      const pubDate = new Date(post.date).toUTCString()
      const categoryTag = post.categoryName ? `<category>${escapeXml(post.categoryName)}</category>` : ''

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(cleanDesc || post.title)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${AUTHOR_NAME}</author>
      ${categoryTag}
    </item>`
    })
    .join('\n')

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(BLOG_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(BLOG_DESC)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.rss" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>
`

  // 3. 构建 Atom 1.0 XML (现代阅读器兼容)
  const atomEntries = posts
    .slice(0, 50)
    .map((post) => {
      const link = `${SITE_URL}${post.url}`
      const cleanDesc = sanitizeSummary(post.desc || '')
      const updated = new Date(post.date).toISOString()

      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${link}" />
    <id>${link}</id>
    <updated>${updated}</updated>
    <summary>${escapeXml(cleanDesc || post.title)}</summary>
    <author>
      <name>${AUTHOR_NAME}</name>
    </author>
  </entry>`
    })
    .join('\n')

  const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(BLOG_TITLE)}</title>
  <subtitle>${escapeXml(BLOG_DESC)}</subtitle>
  <link href="${SITE_URL}/feed.atom" rel="self" />
  <link href="${SITE_URL}/" />
  <updated>${new Date().toISOString()}</updated>
  <id>${SITE_URL}/</id>
  <author>
    <name>${AUTHOR_NAME}</name>
  </author>
${atomEntries}
</feed>
`

  fs.writeFileSync(path.join(outDir, 'feed.rss'), rssXml, 'utf-8')
  fs.writeFileSync(path.join(outDir, 'feed.atom'), atomXml, 'utf-8')
  console.log(`📻 [RSS] 已成功生成 RSS 2.0 (feed.rss) 与 Atom (feed.atom)，包含 ${Math.min(posts.length, 50)} 篇公开文章`)
}
