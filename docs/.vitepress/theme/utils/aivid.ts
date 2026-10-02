/**
 * AI Videos 系列的共用解析工具
 * Frontmatter 里的字段都写成"人话"字符串，这里负责把它们拆成结构化数据。
 */

export interface VendorTheme {
  id: string
  name: string
  color: string
}

const VENDORS: Record<string, VendorTheme> = {
  claude: { id: 'claude', name: 'Anthropic', color: '#d97757' },
  deepseek: { id: 'deepseek', name: 'DeepSeek', color: '#4d6bfe' },
  openai: { id: 'openai', name: 'OpenAI', color: '#10a37f' },
  gemini: { id: 'gemini', name: 'Google', color: '#8e75ff' },
  qwen: { id: 'qwen', name: 'Qwen', color: '#615ced' },
  stepfun: { id: 'stepfun', name: 'StepFun', color: '#3b8eea' },
  local: { id: 'local', name: 'Local', color: '#e0a526' },
}

/** 从 vendor 字段或 model 名称推断厂商主题色 */
export function resolveVendor(vendor?: string, model?: string): VendorTheme {
  const key = (vendor || '').trim().toLowerCase()
  if (VENDORS[key]) return VENDORS[key]
  const m = (model || '').toLowerCase()
  for (const v of Object.keys(VENDORS)) {
    if (m.includes(v)) return VENDORS[v]
  }
  if (/gpt|sora/.test(m)) return VENDORS.openai
  if (/minimax|comfy|wan|hunyuan/.test(m)) return VENDORS.local
  return { id: key || 'other', name: vendor || 'Other', color: 'var(--vp-c-brand)' }
}

/** 把 "8 → 9.5" / "8 -> 9.5" / 9.5 拆成数组 */
export function splitChain(raw: unknown): string[] {
  if (raw === undefined || raw === null || raw === '') return []
  return String(raw)
    .split(/\s*(?:→|->|=>)\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface Rating {
  /** 最终评分；未评分为 null */
  score: number | null
  /** 历次评分（包含最终评分） */
  history: number[]
}

export function parseRating(raw: unknown): Rating {
  const history = splitChain(raw)
    .map((s) => Number.parseFloat(s))
    .filter((n) => !Number.isNaN(n))
  return { score: history.length ? history[history.length - 1] : null, history }
}

/** AI 自评与用户评分的差值；任一缺失返回 null */
export function selfBias(user: Rating, self: Rating): number | null {
  if (user.score === null || self.score === null) return null
  return Math.round((self.score - user.score) * 10) / 10
}

export function formatBias(b: number): string {
  if (b === 0) return '与你一致'
  return `${b > 0 ? '高估' : '低估'} ${formatScore(Math.abs(b))}`
}

export interface UsageRow {
  label: string
  values: string[]
  /** 所有值均为数字时才会画进度条（按百分比理解） */
  numeric: number[] | null
}

/** "5h: 24 → 38 → 50" 形式 */
export function parseUsage(raw: unknown): UsageRow[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const rows: UsageRow[] = []
  for (const item of list) {
    const s = String(item)
    const idx = s.indexOf(':')
    if (idx === -1) continue
    const label = s.slice(0, idx).trim()
    const values = splitChain(s.slice(idx + 1))
    const nums = values.map((v) => Number(v.replace(/%$/, '')))
    rows.push({
      label,
      values,
      numeric: values.length > 0 && nums.every((n) => !Number.isNaN(n)) ? nums : null,
    })
  }
  return rows
}

/** "38min20s + 13min21s" → ['38min20s', '13min21s'] */
export function splitPlus(raw: unknown): string[] {
  if (!raw) return []
  return String(raw)
    .split(/\s*\+\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function toList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/\s*[,，·]\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
