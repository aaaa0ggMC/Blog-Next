/**
 * 参考文献引用与著录插件（GB/T 7714-2015）
 *
 * 正文引用（自动编号、可点击跳转）：
 *   <ref k="beer" />
 *   <ref k="beer,lambert" />      多个文献：渲染成 [1,2]（连号自动压成 [1-2]）
 *
 * 文末著录（结构化字段，自动合成 GB/T 7714 标准文字）：
 *   <bib title="参考文献">
 *     <item k="beer" type="article" authors="Beer, A." title="..." journal="..." year="1852" volume="86" pages="78-88"/>
 *   </bib>
 *
 * 不使用 type 时 <item k="x">已排好版的文字</item> 会原样输出（转义后纯文本）。
 */

/* ------------------------------------------------------------------ *
 * 常量与字段定义
 * ------------------------------------------------------------------ */

/** 中日韩字符（用于判断条目是中文还是英文，决定“等 / et al.”等写法） */
const CJK_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/

/** 文末条目锚点前缀：<li id="bib-ref-xxx"> */
const ITEM_ID_PREFIX = 'bib-ref-'
/** 正文引用锚点前缀：<a id="bib-cite-xxx-1"> */
const CITE_ID_PREFIX = 'bib-cite-'

/** 文末著录块结束标记：</bib> */
const BIB_CLOSE_RE = /^<\/(?:bib|bibliography|refs)>\s*$/i

/** 引用条目的文献类型：GB/T 7714-2015 类型标识 + 排版分支 */
const TYPE_DEFS: Record<string, { code: string; kind: string }> = {
  article: { code: 'J', kind: 'journal' },
  book: { code: 'M', kind: 'book' },
  inproceedings: { code: 'C', kind: 'chapter' },
  chapter: { code: 'M', kind: 'chapter' },
  thesis: { code: 'D', kind: 'thesis' },
  web: { code: 'EB/OL', kind: 'electronic' },
  dataset: { code: 'DS', kind: 'electronic' },
  newspaper: { code: 'N', kind: 'newspaper' },
  report: { code: 'R', kind: 'generic' },
  standard: { code: 'S', kind: 'generic' },
  patent: { code: 'P', kind: 'generic' },
  misc: { code: 'Z', kind: 'generic' },
}

/** type 的常见别名 */
const TYPE_ALIASES: Record<string, string> = {
  journal: 'article', mag: 'article', magazine: 'article', j: 'article', paper: 'article',
  book: 'book', monograph: 'book', m: 'book',
  conference: 'inproceedings', proceedings: 'inproceedings', inproceedings: 'inproceedings',
  proceeding: 'inproceedings', c: 'inproceedings',
  chapter: 'chapter', incollection: 'chapter',
  thesis: 'thesis', dissertation: 'thesis', phdthesis: 'thesis', mastersthesis: 'thesis', d: 'thesis',
  web: 'web', online: 'web', website: 'web', www: 'web', electronic: 'web', eb: 'web', url: 'web',
  dataset: 'dataset', ds: 'dataset',
  newspaper: 'newspaper', n: 'newspaper',
  report: 'report', r: 'report',
  standard: 'standard', s: 'standard',
  patent: 'patent', p: 'patent',
  misc: 'misc', z: 'misc', other: 'misc',
}

/** 字段别名 -> 规范字段名 */
const FIELD_ALIASES: Record<string, string> = {
  k: 'key', key: 'key', id: 'key',
  type: 'type', kind: 'type',
  author: 'authors', authors: 'authors', au: 'authors',
  title: 'title',
  journal: 'journal', journaltitle: 'journal', container: 'journal', magazine: 'journal',
  booktitle: 'booktitle', proceedings: 'booktitle', collection: 'booktitle', conference: 'booktitle',
  site: 'site', website: 'site', source: 'site',
  year: 'year', y: 'year',
  date: 'date', published: 'date', published_at: 'date',
  volume: 'volume', vol: 'volume',
  number: 'number', issue: 'number', no: 'number', num: 'number',
  pages: 'pages', page: 'pages', pp: 'pages',
  place: 'place', address: 'place', city: 'place',
  publisher: 'publisher', pub: 'publisher', press: 'publisher',
  school: 'school', institution: 'school', university: 'school',
  edition: 'edition', version: 'edition',
  url: 'url', link: 'url', href: 'url',
  doi: 'doi',
  access: 'access', accessed: 'access', urldate: 'access',
  note: 'note', remark: 'note', desc: 'note',
  lang: 'lang', language: 'lang',
}

/* ------------------------------------------------------------------ *
 * 通用小工具
 * ------------------------------------------------------------------ */

function warn(msg: string) {
  // eslint-disable-next-line no-console
  console.warn(`[citation] ${msg}`)
}

/** 解析标签属性：k="x" / title='y' / flag；decode 用于把 &amp; 之类还原 */
function parseAttrs(raw: string, decode?: (s: string) => string): Record<string, string> {
  const attrs: Record<string, string> = {}
  if (!raw) return attrs
  const re = /([a-zA-Z_:][\w:.\-]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase()
    if (!name) continue
    const value = m[3] ?? m[4] ?? m[5] ?? 'true'
    attrs[name] = decode ? decode(value) : value
  }
  return attrs
}

/**
 * 从 pos 读一个开始标签，能正确跳过引号里的 '>'（如 title="A > B"）。
 */
function readTag(
  src: string,
  pos: number,
): { name: string; attrsRaw: string; end: number; selfClosing: boolean } | null {
  if (src.charCodeAt(pos) !== 0x3c /* < */) return null
  const head = /^<([a-zA-Z][\w:-]*)/.exec(src.slice(pos, pos + 64))
  if (!head) return null
  let i = pos + head[0].length
  let buf = ''
  while (i < src.length) {
    const ch = src[i]
    if (ch === '"' || ch === "'") {
      const close = src.indexOf(ch, i + 1)
      if (close === -1) return null
      buf += src.slice(i, close + 1)
      i = close + 1
      continue
    }
    if (ch === '>') {
      return {
        name: head[1].toLowerCase(),
        attrsRaw: buf,
        end: i + 1,
        selfClosing: /\/\s*$/.test(buf),
      }
    }
    if (ch === '<') return null
    buf += ch
    i++
  }
  return null
}

/** 把条目上的属性名规范化为内部字段名 */
function normalizeFields(attrs: Record<string, string>): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const [rawName, value] of Object.entries(attrs)) {
    const name = FIELD_ALIASES[rawName] ?? rawName
    if (fields[name] === undefined) fields[name] = value
  }
  return fields
}

/** 逗号分隔的引用 key 列表 */
function splitKeys(raw: string): string[] {
  return String(raw || '')
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** key -> 可用于 HTML id 的字符串 */
function keyToId(key: string): string {
  return String(key).replace(/[^A-Za-z0-9_\u4e00-\u9FFF.-]/g, '-')
}

function itemId(key: string): string {
  return `${ITEM_ID_PREFIX}${keyToId(key)}`
}

function citeId(key: string, occurrence: number): string {
  return `${CITE_ID_PREFIX}${keyToId(key)}-${occurrence}`
}

/** 去掉行内代码，避免把代码里的 <ref> 也当成引用 */
function stripCodeSpans(text: string): string {
  return text.replace(/`[^`]*`/g, '')
}

/* ------------------------------------------------------------------ *
 * GB/T 7714-2015 格式化
 * ------------------------------------------------------------------ */

/**
 * 单个作者：
 *   "Beer, A."        -> "BEER A"
 *   "Kun Zhou"        -> "ZHOU K"（无逗号时最后一个词当姓）
 *   "{NVIDIA}"        -> "NVIDIA"（大括号包裹 = 原样保留，机构名或想留全名时用）
 *   "张三"             -> "张三"
 */
function formatAuthor(name: string): string {
  const s = name.trim()
  if (!s) return ''
  if (s.startsWith('{') && s.endsWith('}')) return s.slice(1, -1).trim()
  if (CJK_RE.test(s)) return s

  const comma = s.indexOf(',')
  let surname: string
  let given: string
  if (comma >= 0) {
    surname = s.slice(0, comma).trim()
    given = s.slice(comma + 1).trim()
  } else {
    const tokens = s.split(/\s+/).filter(Boolean)
    if (tokens.length < 2) return s // 单词（机构名 / 单名）原样保留
    surname = tokens[tokens.length - 1]
    given = tokens.slice(0, -1).join(' ')
  }

  const sn = /[a-z]/.test(surname) ? surname.toUpperCase() : surname
  const gi = givenInitials(given)
  return gi ? `${sn} ${gi}` : sn
}

/** 名取首字母： "Andrew N." -> "A N"；中文名整体保留 */
function givenInitials(given: string): string {
  if (!given) return ''
  if (CJK_RE.test(given)) return given
  return given
    .split(/[\s.\-–—]+/)
    .map((part) => {
      const m = part.match(/\p{L}/u)
      return m ? m[0].toUpperCase() : ''
    })
    .filter(Boolean)
    .join(' ')
}

/** author 列表：分号/顿号（或 and）分隔，超过 3 位用 等 / et al. */
function formatAuthors(raw: string, lang: string): string {
  const list = String(raw)
    .split(/\s*[;；、]\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!list.length) return ''
  const names = list.map(formatAuthor).filter(Boolean)
  if (names.length > 3) {
    return [...names.slice(0, 3), lang === 'zh' ? '等' : 'et al.'].join(', ')
  }
  return names.join(', ')
}

/** 语言判定：显式 lang 优先，否则看有没有中日韩字符 */
function resolveLang(fields: Record<string, string>): string {
  const explicit = (fields.lang || '').toLowerCase()
  if (explicit.startsWith('zh') || explicit === 'cn' || explicit === 'chinese') return 'zh'
  if (explicit.startsWith('en')) return 'en'
  const probe = [fields.authors, fields.title, fields.journal, fields.booktitle, fields.publisher, fields.school, fields.place, fields.note]
    .filter(Boolean)
    .join(' ')
  return CJK_RE.test(probe) ? 'zh' : 'en'
}

/** 把 type 解析成内部规范类型名；返回 null 表示“原样输出” */
function resolveTypeKey(raw?: string): string | null {
  const t = String(raw ?? '').trim().toLowerCase()
  if (!t) return null
  if (TYPE_DEFS[t]) return t
  if (TYPE_ALIASES[t]) return TYPE_ALIASES[t]
  return 'misc'
}

function link(url: string, text: string, esc: (s: string) => string): string {
  const href = /^\w+:/.test(url) ? url : `https://${url}`
  return `<a class="cite-link" href="${esc(href)}" target="_blank" rel="noreferrer">${esc(text)}</a>`
}

/** 按句号拼接段落，段尾已带句号（如 "et al."）时不重复补 */
function joinDot(parts: string[]): string {
  let out = ''
  for (const part of parts) {
    if (!part) continue
    if (!out) {
      out = part
      continue
    }
    out += /[.。!！?？;；,，]$/.test(out) ? ' ' : '. '
    out += part
  }
  return out
}

/**
 * 由结构化字段合成 GB/T 7714-2015 著录文字（HTML）
 */
function composeSingle(fields: Record<string, string>, md: any): string {
  const typeKey = resolveTypeKey(fields.type)
  if (!typeKey) return ''
  const def = TYPE_DEFS[typeKey] ?? TYPE_DEFS.misc
  const lang = resolveLang(fields)
  const esc = (s: string) => md.utils.escapeHtml(String(s ?? ''))

  const year = (fields.year || '').trim()
  const date = (fields.date || year).trim()
  const volume = (fields.volume || '').trim()
  const number = (fields.number || '').trim()
  const pages = (fields.pages || '').trim()
  const edition = (fields.edition || '').trim()
  const place = (fields.place || '').trim()
  const publisher = (fields.publisher || '').trim()
  const school = (fields.school || '').trim()
  const journal = (fields.journal || '').trim()
  const booktitle = (fields.booktitle || '').trim()

  /** 出版项：出版地: 出版者, 年: 页码 */
  const publisherPart = (extraYear = true) => {
    let s = [esc(place), esc(publisher)].filter(Boolean).join(': ')
    if (extraYear && year) s += (s ? ', ' : '') + esc(year)
    if (pages) s += (s ? ': ' : '') + esc(pages)
    return s
  }

  const body: string[] = []
  switch (def.kind) {
    case 'journal': {
      let loc = esc(journal)
      const numPart = number ? `(${esc(number)})` : ''
      if (year) loc += (loc ? ', ' : '') + esc(year)
      if (volume) loc += (loc ? ', ' : '') + esc(volume)
      loc += numPart
      if (pages) loc += `: ${esc(pages)}`
      if (loc) body.push(loc)
      break
    }
    case 'chapter': {
      // 论文集名已在题名后用 // 拼接，这里只补出版项
      const tail = publisherPart()
      if (tail) body.push(tail)
      break
    }
    case 'book': {
      if (edition) body.push(esc(edition))
      const tail = publisherPart()
      if (tail) body.push(tail)
      break
    }
    case 'thesis': {
      let s = [esc(place), esc(school || publisher)].filter(Boolean).join(': ')
      if (year) s += (s ? ', ' : '') + esc(year)
      if (s) body.push(s)
      break
    }
    case 'electronic': {
      let s = [esc(place), esc(publisher || fields.site)].filter(Boolean).join(': ')
      const stamp = (date ? `(${esc(date)})` : '') + (fields.access ? `[${esc(fields.access)}]` : '')
      if (s && stamp) s += ', ' + stamp
      else s += stamp
      if (s) body.push(s)
      break
    }
    case 'newspaper': {
      let s = esc(journal || publisher)
      const when = date || year
      if (when) s += (s ? ', ' : '') + esc(when)
      if (number) s += `(${esc(number)})`
      if (s) body.push(s)
      break
    }
    default: {
      const tail = publisherPart()
      if (tail) body.push(tail)
      break
    }
  }

  // 附注紧跟在基本出版项之后
  if (fields.note) body.push(esc(fields.note))

  // 非电子资源带 URL 时，补上引用日期与链接
  if (def.kind !== 'electronic' && fields.url) {
    const access = fields.access ? `[${esc(fields.access)}]` : ''
    body.push(`${access}${access ? ' ' : ''}${link(fields.url, fields.url, esc)}`)
  } else if (def.kind === 'electronic' && fields.url) {
    body.push(link(fields.url, fields.url, esc))
  }

  if (fields.doi) {
    const doi = String(fields.doi).trim()
    const label = `DOI: ${doi}`
    body.push(/^https?:\/\//.test(doi) ? link(doi, label, esc) : link(`https://doi.org/${doi}`, label, esc))
  }

  const head: string[] = []
  const authors = fields.authors ? formatAuthors(fields.authors, lang) : ''
  if (authors) head.push(esc(authors))

  // [C]/[M]// 析出文献：论文集名紧跟类型标识
  let titleSeg = `${esc(fields.title || '')}[${def.code}]`
  if (def.kind === 'chapter') {
    const container = booktitle || journal
    if (container) titleSeg += `//${esc(container)}`
  }
  head.push(titleSeg)

  let out = joinDot([...head, ...body])
  if (!/[.。]$/.test(out)) out += '.'
  return out
}

/* ------------------------------------------------------------------ *
 * 行内引用：<ref k="..." />
 * ------------------------------------------------------------------ */

function registerInlineRule(md: any) {
  md.inline.ruler.before('html_inline', 'cite_ref', (state: any, silent: boolean) => {
    const src = state.src
    const pos = state.pos
    if (src.charCodeAt(pos) !== 0x3c /* < */) return false
    const tag = readTag(src, pos)
    if (!tag || tag.name !== 'ref' || tag.end > state.posMax) return false

    let end = tag.end
    if (!tag.selfClosing) {
      const close = src.toLowerCase().indexOf('</ref>', end)
      if (close === -1 || close > state.posMax) return false
      end = close + '</ref>'.length
    }

    const attrs = parseAttrs(tag.attrsRaw, state.md.utils.unescapeAll)
    const keys = splitKeys(attrs.k || attrs.key || attrs.id || '')
    if (!keys.length) {
      warn(`<ref> 缺少 k 属性，已忽略：${src.slice(pos, end)}`)
      if (silent) return true
      state.pos = end
      return true
    }
    if (silent) return true

    const token = state.push('cite_ref', '', 0)
    token.meta = { keys }
    state.pos = end
    return true
  })
}

function renderCiteRef(tokens: any[], idx: number, _options: any, env: any): string {
  const keys: string[] = tokens[idx].meta?.keys ?? []
  const numbers: Map<string, number> = env?.__citeNumbers ?? new Map()
  const seen: Map<string, number> = env?.__citeSeen ?? new Map()

  const entries = keys.map((key) => {
    const occurrence = (seen.get(key) ?? 0) + 1
    seen.set(key, occurrence)
    if (env) env.__citeSeen = seen
    return { key, num: numbers.get(key), anchor: citeId(key, occurrence) }
  })

  // 连号压缩：[1-3] / [1,3]
  const groups: string[] = []
  let i = 0
  while (i < entries.length) {
    const cur = entries[i]
    if (cur.num == null) {
      groups.push(
        `<span class="cite-ref-missing" title="未定义的参考文献：${md_escape(cur.key)}">?</span>`,
      )
      i++
      continue
    }
    let j = i
    while (
      j + 1 < entries.length &&
      entries[j + 1].num != null &&
      entries[j + 1].num === (entries[j].num as number) + 1
    ) {
      j++
    }
    const html = (parts: typeof entries, from: number, to: number) =>
      parts
        .slice(from, to + 1)
        .map((e) => `<a class="cite-ref-link" id="${md_escape(e.anchor)}" href="#${md_escape(itemId(e.key))}">${e.num}</a>`)
        .join('-')
    groups.push(html(entries, i, j))
    i = j + 1
  }

  return `<sup class="cite-ref">[${groups.join(',')}]</sup>`
}

function md_escape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ------------------------------------------------------------------ *
 * 文末著录块：<bib> <item .../> </bib>
 * ------------------------------------------------------------------ */

function registerBibBlockRule(md: any) {
  md.block.ruler.before(
    'fence',
    'cite_bib',
    (state: any, startLine: number, endLine: number, silent: boolean) => {
      if (state.sCount[startLine] - state.blkIndent >= 4) return false
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const lineText = state.src.slice(start, max)
      const tag = readTag(lineText, 0)
      if (!tag || !/^(bib|bibliography|refs)$/.test(tag.name)) return false
      if (lineText.slice(tag.end).trim() !== '') return false
      if (silent) return true

      // 找 </bib>
      const lines: string[] = []
      let closeLine = -1
      for (let ln = startLine + 1; ln < endLine; ln++) {
        const s = state.bMarks[ln] + state.tShift[ln]
        const e = state.eMarks[ln]
        const text = state.src.slice(s, e)
        if (BIB_CLOSE_RE.test(text.trim())) {
          closeLine = ln
          break
        }
        lines.push(text)
      }
      if (closeLine === -1) {
        warn(`<bib> 缺少 </bib> 闭合标签（第 ${startLine + 1} 行起），该块未生效`)
        return false
      }

      const attrs = parseAttrs(tag.attrsRaw, md.utils.unescapeAll)
      const title = attrs.title !== undefined ? attrs.title : '参考文献'
      const items = parseItems(lines.join('\n'), md)

      if (title) {
        const h = state.push('heading_open', 'h2', 1)
        h.markup = '##'
        h.map = [startLine, closeLine]
        const t = state.push('inline', '', 0)
        t.content = title
        t.map = [startLine, closeLine]
        t.children = []
        state.push('heading_close', 'h2', -1)
      }

      const box = state.push('cite_bib_open', 'div', 1)
      box.attrSet('class', 'cite-bib')
      const list = state.push('cite_bib_list_open', 'ol', 1)
      list.attrSet('class', 'cite-bib-list')

      const seenKeys = new Set<string>()
      for (const item of items) {
        if (seenKeys.has(item.key)) {
          warn(`参考文献 key "${item.key}" 重复定义，已跳过后面一条`)
          continue
        }
        seenKeys.add(item.key)
        const li = state.push('cite_item', 'li', 0)
        li.attrSet('class', 'cite-bib-item')
        li.map = [startLine, closeLine]
        li.meta = {
          key: item.key,
          html: renderItemBody(item, md),
        }
      }

      state.push('cite_bib_list_close', 'ol', -1)
      state.push('cite_bib_close', 'div', -1)
      state.line = closeLine + 1
      return true
    },
  )
}

interface ParsedItem {
  key: string
  raw: string
  fields: Record<string, string>
}

/**
 * 解析 <bib> 里的 <item>/<entry> 条目。
 * 用逐字符扫描而不是单个正则，这样属性值里出现 '>' 也不会截断。
 */
function parseItems(src: string, md: any): ParsedItem[] {
  const items: ParsedItem[] = []
  const decode = md?.utils?.unescapeAll
  let cursor = 0

  while (cursor < src.length) {
    const lt = src.indexOf('<', cursor)
    if (lt === -1) break
    const tag = readTag(src, lt)
    if (!tag || !/^(item|entry)$/.test(tag.name)) {
      cursor = lt + 1
      continue
    }

    const attrs = normalizeFields(parseAttrs(tag.attrsRaw, decode))
    let raw = ''
    let next = tag.end
    if (!tag.selfClosing) {
      const closeRe = new RegExp(`</${tag.name}\\s*>`, 'i')
      const rest = src.slice(tag.end)
      const cm = closeRe.exec(rest)
      if (!cm) {
        warn(`<${tag.name}> 缺少闭合标签，已忽略该条目`)
        cursor = tag.end
        continue
      }
      raw = rest.slice(0, cm.index).trim()
      next = tag.end + cm.index + cm[0].length
    }

    const key = attrs.key || `item-${items.length + 1}`
    if (!attrs.key) warn(`<item> 缺少 k 属性，已临时命名为 "${key}"`)
    items.push({ key, raw, fields: attrs })
    cursor = next
  }

  if (!items.length) warn('<bib> 里没有任何 <item> 条目')
  return items
}

function renderItemBody(item: ParsedItem, md: any): string {
  const esc = (s: string) => md.utils.escapeHtml(String(s ?? ''))
  if (!resolveTypeKey(item.fields.type)) {
    // 没写 type：原样输出（纯文本，避免误解析）
    if (!item.raw) {
      warn(`参考文献 "${item.key}" 既没有 type 也没有内容，输出为空`)
      return ''
    }
    return `<span class="cite-raw">${esc(item.raw)}</span>`
  }
  const html = composeSingle(item.fields, md)
  if (item.raw) return `${html} <span class="cite-note-inline">${esc(item.raw)}</span>`
  return html
}

/* ------------------------------------------------------------------ *
 * 编号 + 排序（core rule，在 inline 解析之前跑）
 * ------------------------------------------------------------------ */

function registerNumberingRule(md: any) {
  md.core.ruler.before('inline', 'cite_numbering', (state: any) => {
    const tokens: any[] = state.tokens
    const items = tokens.filter((t) => t.type === 'cite_item')
    const env = state.env || (state.env = {})

    // 只有真正有定义的条目才占用编号，避免未定义引用把序号插出空洞
    const definedKeys = new Set<string>(
      items.map((t) => t.meta?.key).filter(Boolean) as string[],
    )

    // 1. 按正文出现顺序给引用的文献编号
    const numbers = new Map<string, number>()
    const order: string[] = []
    const missing: string[] = []
    const cited = new Set<string>()

    for (const token of tokens) {
      if (token.type !== 'inline' || !token.content) continue
      const content = stripCodeSpans(token.content)
      const decode = state.md?.utils?.unescapeAll
      let cursor = 0
      while (cursor < content.length) {
        const lt = content.indexOf('<', cursor)
        if (lt === -1) break
        const tag = readTag(content, lt)
        if (!tag || tag.name !== 'ref') {
          cursor = lt + 1
          continue
        }
        cursor = tag.end
        const attrs = parseAttrs(tag.attrsRaw, decode)
        for (const key of splitKeys(attrs.k || attrs.key || attrs.id || '')) {
          if (!definedKeys.has(key)) {
            if (!missing.includes(key)) missing.push(key)
            continue
          }
          cited.add(key)
          if (!numbers.has(key)) {
            numbers.set(key, order.length + 1)
            order.push(key)
          }
        }
      }
    }
    if (missing.length) {
      warn(`正文引用了未定义的文献：${missing.join(', ')}（已渲染为 [?]）`)
    }

    // 2. 定义了但正文没引用的条目，编号排在最后
    for (const token of items) {
      const key = token.meta?.key
      if (key && !numbers.has(key)) {
        numbers.set(key, order.length + 1)
        order.push(key)
      }
    }
    for (const token of items) {
      if (token.meta) {
        token.meta.number = numbers.get(token.meta.key)
        token.meta.linked = cited.has(token.meta.key)
      }
    }

    const next: any[] = []
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token.type === 'cite_bib_list_open') {
        next.push(token)
        i++
        const group: any[] = []
        while (i < tokens.length && tokens[i].type === 'cite_item') {
          group.push(tokens[i])
          i++
        }
        i--
        group.sort((a, b) => (a.meta?.number ?? 0) - (b.meta?.number ?? 0))
        next.push(...group)
        continue
      }
      next.push(token)
    }
    tokens.splice(0, tokens.length, ...next)

    env.__citeNumbers = numbers
    env.__citeSeen = new Map()
  })
}

/* ------------------------------------------------------------------ *
 * 渲染规则
 * ------------------------------------------------------------------ */

function registerRenderers(md: any) {
  md.renderer.rules.cite_ref = renderCiteRef
  md.renderer.rules.cite_bib_open = () => '<div class="cite-bib">'
  md.renderer.rules.cite_bib_close = () => '</div>'
  md.renderer.rules.cite_bib_list_open = () => '<ol class="cite-bib-list">'
  md.renderer.rules.cite_bib_list_close = () => '</ol>'

  md.renderer.rules.cite_item = (tokens: any[], idx: number) => {
    const meta = tokens[idx].meta || {}
    const key = meta.key || ''
    const back = meta.linked
      ? `<a class="cite-back no-print" data-copy-ignore="true" href="#${md_escape(citeId(key, 1))}" title="返回正文引用处">↩</a>`
      : ''
    return (
      `<li class="cite-bib-item" id="${md_escape(itemId(key))}">` +
      `<span class="cite-bib-text">${meta.html || ''}</span>` +
      back +
      '</li>'
    )
  }
}

/* ------------------------------------------------------------------ *
 * 入口
 * ------------------------------------------------------------------ */

export function registerCitations(md: any) {
  registerInlineRule(md)
  registerBibBlockRule(md)
  registerNumberingRule(md)
  registerRenderers(md)
}
