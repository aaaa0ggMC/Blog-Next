/**
 * Page Content Exporter & Markdown/Plaintext Serializer
 * 支持 Vue 组件自定义协议 (_toMarkdown / _toText) 与忽略黑名单
 */

export const IGNORE_SELECTORS = [
  '.no-copy',
  '.no-print',
  '[data-copy-ignore="true"]',
  '[data-copy-ignore]',
  '.copy-page-button',
  '.article-meta-bar',
  '.crypto-debugger',
  '.archive-controls',
  '.giscus',
  '.giscus-content',
  '.prev-next',
  '.footer-stats',
  '.vimg-skeleton',
  '.vimg-spinner',
  '.line-number',
  '.copy-code-button',
  '.header-anchor',
  '.edit-link',
  '.last-updated',
  'script',
  'style',
]

const IGNORE_SELECTOR_STRING = IGNORE_SELECTORS.join(', ')

/**
 * 判断节点是否应该被忽略
 */
export function shouldIgnore(node: Node): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement
    if (el.matches && el.matches(IGNORE_SELECTOR_STRING)) {
      return true
    }
    if (el.closest && el.closest('[data-copy-ignore="true"]')) {
      return true
    }
  }
  return false
}

/**
 * 序列化单个 DOM 节点为纯文本
 */
export function serializeNodeToText(node: Node): string {
  if (shouldIgnore(node)) return ''

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ''
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement & { _toText?: () => string }

    // 1. 如果组件自定义了 _toText 协议
    if (typeof el._toText === 'function') {
      const customText = el._toText()
      if (customText !== undefined && customText !== null) {
        return customText
      }
    }

    const tagName = el.tagName.toLowerCase()

    // 换行元素
    if (tagName === 'br') return '\n'
    if (tagName === 'hr') return '\n---\n'

    // KaTeX 公式特殊处理
    if (el.classList.contains('katex')) {
      const texAnno = el.querySelector('annotation[encoding="application/x-tex"]')
      if (texAnno && texAnno.textContent) {
        return texAnno.textContent.trim()
      }
      const katexHtml = el.querySelector('.katex-html')
      if (katexHtml) return katexHtml.textContent?.trim() || ''
    }

    // 代码块
    if (tagName === 'pre') {
      const codeEl = el.querySelector('code') || el
      return `\n${codeEl.textContent || ''}\n`
    }

    // 表格
    if (tagName === 'table') {
      let tableText = '\n'
      const rows = el.querySelectorAll('tr')
      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('th, td')
        const rowText = Array.from(cells)
          .map((cell) => cell.textContent?.trim() || '')
          .join('\t')
        tableText += rowText + '\n'
        if (rowIndex === 0 && rows.length > 1) {
          tableText += Array(cells.length).fill('---').join('\t') + '\n'
        }
      })
      return tableText + '\n'
    }

    // 列表项
    if (tagName === 'li') {
      let childText = ''
      for (const child of Array.from(el.childNodes)) {
        childText += serializeNodeToText(child)
      }
      const parent = el.parentElement
      let prefix = '- '
      if (parent && parent.tagName.toUpperCase() === 'OL') {
        const index = Array.from(parent.children).indexOf(el) + 1
        prefix = `${index}. `
      }
      return `${prefix}${childText.trim()}\n`
    }

    // 标题
    if (/^h[1-6]$/.test(tagName)) {
      let text = ''
      for (const child of Array.from(el.childNodes)) {
        text += serializeNodeToText(child)
      }
      return `\n${text.trim()}\n\n`
    }

    // 段落与块级容器
    const isBlock = ['p', 'div', 'section', 'article', 'blockquote', 'figure'].includes(tagName)
    let innerText = ''
    for (const child of Array.from(el.childNodes)) {
      innerText += serializeNodeToText(child)
    }

    if (tagName === 'p') {
      return innerText.trim() ? `${innerText.trim()}\n\n` : ''
    }

    if (isBlock && innerText.trim()) {
      return `\n${innerText}\n`
    }

    return innerText
  }

  return ''
}

/**
 * 序列化某个容器元素的所有子节点为纯文本
 */
export function serializeChildrenToText(el: Element): string {
  let result = ''
  for (const child of Array.from(el.childNodes)) {
    result += serializeNodeToText(child)
  }
  return result
}

/**
 * 递归获取页面纯文本
 */
export function getPagePlainText(rootEl?: Element | null): string {
  const content =
    rootEl ||
    document.querySelector('.content-container') ||
    document.querySelector('.vp-doc') ||
    document.querySelector('main') ||
    document.querySelector('.content')

  if (!content) return ''

  let text = serializeNodeToText(content)

  // 清洗空白与多余空行
  text = text.replace(/\r\n/g, '\n')
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

/**
 * 序列化单个 DOM 节点为 Markdown 文本
 */
export function serializeNodeToMarkdown(node: Node, level = 0, inParagraph = false): string {
  if (shouldIgnore(node)) return ''

  if (node.nodeType === Node.TEXT_NODE) {
    let text = node.textContent || ''
    if (text.includes('\n') && !inParagraph) {
      text = text.replace(/\n/g, '  \n')
    }
    return text
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement & { _toMarkdown?: () => string }

  // 1. 如果组件自定义了 _toMarkdown 协议，直接调用
  if (typeof el._toMarkdown === 'function') {
    const customMd = el._toMarkdown()
    if (customMd !== undefined && customMd !== null) {
      return customMd
    }
  }

  const tagName = el.tagName.toLowerCase()

  // KaTeX / 数学公式
  if (el.classList.contains('katex') || el.classList.contains('katex-display')) {
    const isDisplay = el.classList.contains('katex-display')
    const texAnno = el.querySelector('annotation[encoding="application/x-tex"]')
    if (texAnno && texAnno.textContent) {
      const tex = texAnno.textContent.trim()
      return isDisplay ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`
    }
  }

  // 标题 h1 ~ h6
  if (/^h[1-6]$/.test(tagName)) {
    const hLevel = parseInt(tagName[1], 10)
    const prefix = '#'.repeat(hLevel) + ' '
    let title = ''
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        title += child.textContent || ''
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as HTMLElement
        const cTag = childEl.tagName.toLowerCase()
        if (cTag === 'br') {
          title += ' '
        } else if (cTag === 'code') {
          title += `\`${childEl.textContent || ''}\``
        } else if (cTag === 'strong' || cTag === 'b') {
          title += `**${childEl.textContent || ''}**`
        } else if (cTag === 'em' || cTag === 'i') {
          title += `*${childEl.textContent || ''}*`
        } else {
          title += childEl.textContent || ''
        }
      }
    }
    return `\n\n${prefix}${title.trim()}\n\n`
  }

  // 段落
  if (tagName === 'p') {
    let paragraph = ''
    for (const child of Array.from(el.childNodes)) {
      paragraph += serializeNodeToMarkdown(child, level, true)
    }
    return paragraph.trim() ? `\n\n${paragraph.trim()}\n\n` : ''
  }

  // 换行
  if (tagName === 'br') {
    return '  \n'
  }

  // 代码块 pre
  if (tagName === 'pre') {
    const code = el.querySelector('code')
    const langMatch = (code?.className || el.className).match(/language-([a-zA-Z0-9_\-+]+)/)
    const language = langMatch ? langMatch[1] : ''
    const codeText = code?.textContent || el.textContent || ''
    return `\n\n\`\`\`${language}\n${codeText.replace(/\n+$/, '')}\n\`\`\`\n\n`
  }

  // 行内代码 code
  if (tagName === 'code') {
    const text = el.textContent || ''
    return `\`${text}\``
  }

  // 加粗 & 斜体 & 删除线 & 下划线
  if (tagName === 'strong' || tagName === 'b') {
    let inner = ''
    for (const child of Array.from(el.childNodes)) {
      inner += serializeNodeToMarkdown(child, level, inParagraph)
    }
    return `**${inner.trim()}**`
  }
  if (tagName === 'em' || tagName === 'i') {
    let inner = ''
    for (const child of Array.from(el.childNodes)) {
      inner += serializeNodeToMarkdown(child, level, inParagraph)
    }
    return `*${inner.trim()}*`
  }
  if (tagName === 'del' || tagName === 's') {
    let inner = ''
    for (const child of Array.from(el.childNodes)) {
      inner += serializeNodeToMarkdown(child, level, inParagraph)
    }
    return `~~${inner.trim()}~~`
  }

  // 链接
  if (tagName === 'a') {
    const href = el.getAttribute('href')
    let text = ''
    for (const child of Array.from(el.childNodes)) {
      text += serializeNodeToMarkdown(child, level, inParagraph)
    }
    text = text.trim()
    if (href && !href.startsWith('#')) {
      return `[${text || href}](${href})`
    }
    return text
  }

  // 图片
  if (tagName === 'img') {
    const alt = el.getAttribute('alt') || ''
    const src = el.getAttribute('src') || ''
    return `![${alt}](${src})`
  }

  // 引用块 blockquote
  if (tagName === 'blockquote') {
    let quoteContent = ''
    for (const child of Array.from(el.childNodes)) {
      quoteContent += serializeNodeToMarkdown(child, level, false)
    }
    const lines = quoteContent.trim().split('\n')
    return `\n\n` + lines.map((l) => `> ${l}`).join('\n') + `\n\n`
  }

  // 分割线
  if (tagName === 'hr') {
    return '\n\n---\n\n'
  }

  // 列表项 li
  if (tagName === 'li') {
    let itemContent = ''
    for (const child of Array.from(el.childNodes)) {
      itemContent += serializeNodeToMarkdown(child, level + 1, false)
    }
    const parent = el.parentElement
    let prefix = '- '
    if (parent && parent.tagName.toUpperCase() === 'OL') {
      const index = Array.from(parent.children).indexOf(el) + 1
      prefix = `${index}. `
    }
    const indent = '  '.repeat(level)
    return `${indent}${prefix}${itemContent.trim()}\n`
  }

  // 列表容器 ul / ol
  if (tagName === 'ul' || tagName === 'ol') {
    let listContent = ''
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toUpperCase() === 'LI') {
        listContent += serializeNodeToMarkdown(child, level)
      }
    }
    return `\n\n${listContent}\n`
  }

  // 表格
  if (tagName === 'table') {
    const rows = el.querySelectorAll('tr')
    if (rows.length === 0) return ''

    let tableResult = '\n\n'
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('th, td')
      const rowText = Array.from(cells)
        .map((cell) => {
          let cellText = ''
          for (const child of Array.from(cell.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
              cellText += child.textContent || ''
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const childEl = child as HTMLElement
              if (childEl.tagName.toLowerCase() === 'br') {
                cellText += '<br>'
              } else {
                cellText += serializeNodeToMarkdown(childEl, level, true)
              }
            }
          }
          cellText = cellText.replace(/\n+/g, ' ').trim()
          if (cell.tagName.toUpperCase() === 'TH') {
            return `**${cellText}**`
          }
          return cellText
        })
        .join(' | ')

      tableResult += `| ${rowText} |\n`

      if (rowIndex === 0 && rows.length > 1) {
        const separators = Array(cells.length).fill('---')
        tableResult += `| ${separators.join(' | ')} |\n`
      }
    })
    return tableResult + '\n\n'
  }

  // 通用容器 div, span, section, article 等
  let result = ''
  for (const child of Array.from(el.childNodes)) {
    result += serializeNodeToMarkdown(child, level, inParagraph)
  }

  if (['div', 'section', 'article'].includes(tagName) && result.trim() && !inParagraph) {
    return `\n${result}\n`
  }

  return result
}

/**
 * 序列化某个容器元素的所有子节点为 Markdown
 */
export function serializeChildrenToMarkdown(el: Element, level = 0, inParagraph = false): string {
  let result = ''
  for (const child of Array.from(el.childNodes)) {
    result += serializeNodeToMarkdown(child, level, inParagraph)
  }
  return result
}

/**
 * 递归获取页面 Markdown 格式文本
 */
export function getPageMarkdown(rootEl?: Element | null): string {
  const content =
    rootEl ||
    document.querySelector('.content-container') ||
    document.querySelector('.vp-doc') ||
    document.querySelector('main') ||
    document.querySelector('.content')

  if (!content) return ''

  let formatted = serializeNodeToMarkdown(content)

  // 整理格式与空行
  formatted = formatted.replace(/\r\n/g, '\n')
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n')
  formatted = formatted.replace(/[ \t]+$/gm, '')
  formatted = formatted.replace(/  \n\n/g, '\n\n')
  return formatted.trim()
}

/**
 * 打印前唤醒所有懒加载与资源
 */
export async function preparePrint(): Promise<void> {
  if (typeof window === 'undefined') return

  // 1. 广播自定义事件，让 Vue 组件（如 Img.vue）强制完成加载
  window.dispatchEvent(new CustomEvent('before-blog-print'))

  // 2. 检查页面上所有原生的 lazy img 或 .lazy-img
  const images = document.querySelectorAll('img[loading="lazy"], .lazy-img')
  images.forEach((img) => {
    img.removeAttribute('loading')
    if (img.classList.contains('lazy-img') && !img.classList.contains('loaded')) {
      img.classList.add('loaded')
    }
  })

  // 给 DOM 留一点微任务时间以完成渲染
  await new Promise((resolve) => setTimeout(resolve, 80))
}
