<template>
  <Transition name="ai-fade">
    <div
      v-if="isAiGloballyVisible"
      ref="rootEl"
      class="rikkahub-ai-container"
      :class="{ 'is-collapsed': isEntireBlockCollapsed }"
    >
      <!-- 隐藏原始 slot，用于在客户端提取 DOM 结构 -->
      <div ref="rawSlotRef" class="rikkahub-raw-slot" aria-hidden="true" style="display: none;">
        <slot />
      </div>

      <!-- 顶部信息栏 -->
      <div class="rikkahub-header no-copy no-print" data-copy-ignore="true">
        <div class="rikkahub-header-left">
          <span class="rikkahub-logo-badge">
            <svg class="sparkle-svg" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
            </svg>
            <span class="rikkahub-app-name">Rikkahub AI</span>
          </span>

          <span v-if="parsedData.title" class="rikkahub-session-title" :title="parsedData.title">
            {{ parsedData.title }}
          </span>

          <span v-if="parsedData.exportedAt" class="rikkahub-meta-pill" :title="'导出时间: ' + parsedData.exportedAt">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ parsedData.exportedAt }}
          </span>

          <!-- 统计胶囊 -->
          <span v-if="totalToolsCount > 0" class="rikkahub-stat-pill">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            {{ totalToolsCount }} 个工具调用
          </span>
        </div>

        <div class="rikkahub-header-right">
          <!-- 展开/折叠所有思维与工具 -->
          <button
            v-if="hasCollapsibleItems"
            class="rikkahub-action-btn"
            :title="isAllExpanded ? '全部折叠 (思考与工具)' : '全部展开 (思考与工具)'"
            @click="toggleExpandAll"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path v-if="isAllExpanded" d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M4 10h6m0 0V4m0 6L3 3m17 7h-6m0 0V4m0 6l7-7" />
              <path v-else d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7M3 9V3m0 0h6M3 3l7 7m11 11v-6m0 6h-6m6 0l-7-7" />
            </svg>
            <span>{{ isAllExpanded ? '收起步骤' : '展开步骤' }}</span>
          </button>

          <!-- 复制对话内容 -->
          <button
            class="rikkahub-action-btn"
            :title="hasCopied ? '已复制！' : '复制此对话'"
            @click="copyFullConversation"
          >
            <svg v-if="!hasCopied" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#10b981" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{{ hasCopied ? '已复制' : '复制' }}</span>
          </button>

          <!-- 整块折叠按钮 -->
          <button
            class="rikkahub-icon-btn"
            :title="isEntireBlockCollapsed ? '展开整个对话' : '折叠整个对话'"
            @click="isEntireBlockCollapsed = !isEntireBlockCollapsed"
          >
            <svg
              class="rikkahub-chevron"
              :class="{ 'is-rotated': isEntireBlockCollapsed }"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 对话主体流 (未挂载前显示 slot 内容作为优雅降级) -->
      <div v-show="!isEntireBlockCollapsed" class="rikkahub-chat-body">
        <template v-if="isMounted && parsedData.turns.length > 0">
          <div
            v-for="(turn, tIndex) in parsedData.turns"
            :key="'turn-' + tIndex"
            class="rikkahub-turn"
            :class="'turn-' + turn.role"
          >
            <!-- 角色头像与名称 -->
            <div class="rikkahub-role-badge">
              <div class="role-avatar" :class="'avatar-' + turn.role">
                <template v-if="turn.role === 'user'">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </template>
                <template v-else>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
                  </svg>
                </template>
              </div>
              <span class="role-name">{{ turn.role === 'user' ? '用户 (User)' : '助理 (Assistant)' }}</span>
            </div>

            <!-- 用户消息内容卡片 -->
            <div v-if="turn.role === 'user'" class="rikkahub-user-bubble vp-doc" v-html="turn.contentHtml"></div>

            <!-- 助手消息流程 -->
            <div v-else class="rikkahub-assistant-flow">
              <!-- 混合展示 Thinking 与 Tool Call 步骤 -->
              <div v-if="turn.steps && turn.steps.length > 0" class="rikkahub-steps-flow">
                <template v-for="(step, sIndex) in turn.steps" :key="'step-' + sIndex">
                  <!-- 思考链 Thinking 块 (默认折叠) -->
                  <div
                    v-if="step.type === 'thinking'"
                    class="rikkahub-thinking-card"
                    :class="{ 'is-collapsed': step.isCollapsed }"
                  >
                    <div
                      class="thinking-header no-select"
                      @click="step.isCollapsed = !step.isCollapsed"
                    >
                      <div class="thinking-title">
                        <span class="thinking-icon">💭</span>
                        <span class="thinking-label">思考过程</span>
                        <span class="thinking-sub">
                          {{ step.isCollapsed ? '（点击展开查看思路）' : '（已完成深度思考）' }}
                        </span>
                      </div>
                      <div class="thinking-actions">
                        <button
                          class="copy-tiny-btn no-copy"
                          title="复制思考过程"
                          @click.stop="copyText(step.contentRaw)"
                        >
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                        <svg
                          class="rikkahub-chevron small"
                          :class="{ 'is-rotated': step.isCollapsed }"
                          viewBox="0 0 24 24"
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                    <div v-show="!step.isCollapsed" class="thinking-body">
                      <div class="thinking-text vp-doc" v-html="step.contentHtml"></div>
                    </div>
                  </div>

                  <!-- MCP / Tool 工具调用块 (结构化 JSON，默认折叠) -->
                  <div
                    v-else-if="step.type === 'tool'"
                    class="rikkahub-tool-card"
                    :class="{ 'is-collapsed': step.isCollapsed, 'is-mcp': step.isMcp }"
                  >
                    <div
                      class="tool-header no-select"
                      @click="step.isCollapsed = !step.isCollapsed"
                    >
                      <div class="tool-header-left">
                        <span class="tool-type-badge" :class="step.isMcp ? 'mcp-badge' : 'regular-tool-badge'">
                          {{ step.isMcp ? 'MCP' : 'TOOL' }}
                        </span>
                        <span class="tool-name">
                          <code>{{ step.cleanName || step.name }}</code>
                        </span>
                        <span v-if="step.callId" class="tool-call-id" :title="'Call ID: ' + step.callId">
                          {{ formatCallId(step.callId) }}
                        </span>
                      </div>

                      <div class="tool-header-right">
                        <span class="tool-status-badge">
                          <span class="status-dot"></span>
                          Executed
                        </span>
                        <svg
                          class="rikkahub-chevron small"
                          :class="{ 'is-rotated': step.isCollapsed }"
                          viewBox="0 0 24 24"
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    <!-- 工具输入与输出内容 (结构化 JSON) -->
                    <div v-show="!step.isCollapsed" class="tool-body">
                      <!-- Input 部分 -->
                      <div class="tool-section">
                        <div class="section-title-bar">
                          <span class="section-label">
                            <span class="indicator-arrow in">➔</span> Input (参数输入)
                          </span>
                          <button
                            class="copy-tiny-btn no-copy"
                            title="复制输入 JSON"
                            @click.stop="copyText(step.inputRaw)"
                          >
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            复制
                          </button>
                        </div>
                        <div class="json-viewer-box">
                          <pre class="json-pre"><code><span v-html="highlightJson(step.inputFormatted)"></span></code></pre>
                        </div>
                      </div>

                      <!-- Output 部分 -->
                      <div class="tool-section">
                        <div class="section-title-bar">
                          <span class="section-label">
                            <span class="indicator-arrow out">⬅</span> Output (调用结果)
                          </span>
                          <button
                            class="copy-tiny-btn no-copy"
                            title="复制输出结果"
                            @click.stop="copyText(step.outputRaw)"
                          >
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            复制
                          </button>
                        </div>
                        <div class="json-viewer-box">
                          <template v-if="step.isOutputJson">
                            <pre class="json-pre"><code><span v-html="highlightJson(step.outputFormatted)"></span></code></pre>
                          </template>
                          <template v-else>
                            <pre class="text-pre"><code>{{ step.outputRaw }}</code></pre>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- AI 最终回复内容 -->
              <div v-if="turn.contentHtml" class="rikkahub-response-content vp-doc" v-html="turn.contentHtml"></div>
            </div>
          </div>
        </template>

        <!-- SSR 或初始加载未完成时的兜底插槽呈现 -->
        <div v-else class="rikkahub-fallback-slot vp-doc">
          <slot />
        </div>
      </div>
    </div>

    <!-- 当全局设置关闭 AI 展示时 -->
    <div v-else class="rikkahub-disabled-card no-print">
      <div class="disabled-inner">
        <span>✨ {{ resolvedFallbackText }}</span>
        <button class="enable-btn" @click="handleEnableAi">开启展示</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
import { isAiGloballyVisible, setGlobalAi } from '../stores/aiStore'
import { serializeChildrenToMarkdown } from '../../scripts/exporter'

interface ToolStep {
  type: 'tool'
  name: string
  cleanName: string
  isMcp: boolean
  callId: string
  inputRaw: string
  inputFormatted: string
  outputRaw: string
  outputFormatted: string
  isOutputJson: boolean
  isCollapsed: boolean
}

interface ThinkingStep {
  type: 'thinking'
  contentHtml: string
  contentRaw: string
  isCollapsed: boolean
}

type AssistantStep = ToolStep | ThinkingStep

interface ConversationTurn {
  role: 'user' | 'assistant'
  contentHtml: string
  contentRaw: string
  steps?: AssistantStep[]
}

interface ParsedConversation {
  title: string
  exportedAt: string
  turns: ConversationTurn[]
}

const props = defineProps<{
  title?: string
  exportedAt?: string
  fallback?: boolean | string
}>()

const DEFAULT_FALLBACK_TEXT = '此处为 Rikkahub AI 会话记录，已在设置中关闭展示。'

// 关闭全局展示时，允许通过 fallback prop 自定义占位文案
const resolvedFallbackText = computed(() => {
  if (typeof props.fallback === 'string' && props.fallback.trim() !== '') {
    return props.fallback.trim()
  }
  return DEFAULT_FALLBACK_TEXT
})

const rootEl = ref<HTMLElement | null>(null)
const rawSlotRef = ref<HTMLElement | null>(null)
const isMounted = ref(false)
const isEntireBlockCollapsed = ref(false)
const hasCopied = ref(false)

const parsedData = reactive<ParsedConversation>({
  title: '',
  exportedAt: '',
  turns: [],
})

// 统计总工具数
const totalToolsCount = computed(() => {
  let count = 0
  for (const turn of parsedData.turns) {
    if (turn.steps) {
      for (const step of turn.steps) {
        if (step.type === 'tool') count++
      }
    }
  }
  return count
})

// 是否有可折叠项 (thinking 或 tool)
const hasCollapsibleItems = computed(() => {
  for (const turn of parsedData.turns) {
    if (turn.steps && turn.steps.length > 0) return true
  }
  return false
})

// 是否当前全部展开
const isAllExpanded = computed(() => {
  for (const turn of parsedData.turns) {
    if (turn.steps) {
      for (const step of turn.steps) {
        if (step.isCollapsed) return false
      }
    }
  }
  return true
})

const toggleExpandAll = () => {
  const targetState = !isAllExpanded.value
  for (const turn of parsedData.turns) {
    if (turn.steps) {
      for (const step of turn.steps) {
        step.isCollapsed = !targetState
      }
    }
  }
}

const formatCallId = (callId: string): string => {
  if (!callId) return ''
  if (callId.length > 18) {
    return callId.slice(0, 10) + '…' + callId.slice(-4)
  }
  return callId
}

// 格式化 JSON 为高亮 HTML
const highlightJson = (jsonStr: string): string => {
  if (!jsonStr) return ''
  // 简易安全的高亮转义
  const escaped = jsonStr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
        } else {
          cls = 'json-string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}

const copyText = async (text: string) => {
  if (!text) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    if (typeof window !== 'undefined' && (window as any).narn) {
      ;(window as any).narn('success', '已复制到剪贴板', 1500, 'Rikkahub')
    }
  } catch (err) {
    console.error('Copy failed:', err)
  }
}

const copyFullConversation = async () => {
  const root = rootEl.value
  if (!root) return
  const md = (root as any)._toMarkdown ? (root as any)._toMarkdown() : serializeChildrenToMarkdown(root)
  await copyText(md.trim())
  hasCopied.value = true
  setTimeout(() => {
    hasCopied.value = false
  }, 2000)
}

const handleEnableAi = () => {
  setGlobalAi(true)
  if (typeof window !== 'undefined' && (window as any).narn) {
    ;(window as any).narn('success', '已开启 Rikkahub AI 会话展示', 2000, '偏好设置')
  }
}

/**
 * 结构化解析：分析 Slot 内由 VitePress Markdown 编译生成的 DOM 元素
 */
const parseSlotDom = () => {
  const container = rawSlotRef.value
  if (!container) return

  const children = Array.from(container.children) as HTMLElement[]
  if (children.length === 0) return

  let currentTitle = props.title || ''
  let currentExported = props.exportedAt || ''
  const turns: ConversationTurn[] = []

  let currentRole: 'user' | 'assistant' | null = null
  let currentUserNodes: HTMLElement[] = []
  let currentAssistantSteps: AssistantStep[] = []
  let currentAssistantNodes: HTMLElement[] = []
  let assistantHasStartedResponse = false

  const finalizeTurn = () => {
    if (currentRole === 'user') {
      const html = currentUserNodes.map((n) => n.outerHTML).join('\n')
      const text = currentUserNodes.map((n) => n.textContent || '').join('\n')
      turns.push({
        role: 'user',
        contentHtml: html,
        contentRaw: text,
      })
      currentUserNodes = []
    } else if (currentRole === 'assistant') {
      const html = currentAssistantNodes.map((n) => n.outerHTML).join('\n')
      const text = currentAssistantNodes.map((n) => n.textContent || '').join('\n')
      turns.push({
        role: 'assistant',
        contentHtml: html,
        contentRaw: text,
        steps: [...currentAssistantSteps],
      })
      currentAssistantSteps = []
      currentAssistantNodes = []
      assistantHasStartedResponse = false
    }
    currentRole = null
  }

  let i = 0
  while (i < children.length) {
    const el = children[i]
    const tag = el.tagName.toLowerCase()
    const text = (el.textContent || '').trim()

    // 1. 识别一级/二级标题 (会话标题)
    if ((tag === 'h1' || tag === 'h2') && !currentTitle && turns.length === 0 && !currentRole) {
      const anchor = el.querySelector('.header-anchor')
      const anchorText = anchor?.textContent || ''
      currentTitle = text.replace(anchorText, '').trim()
      i++
      continue
    }

    // 2. 识别 Exported on 时间戳
    const exportMatch = text.match(/Exported on\s+([^\n\r*]+)/i)
    if (exportMatch && !currentExported && turns.length === 0) {
      currentExported = exportMatch[1].trim().replace(/[*_]/g, '')
      i++
      continue
    }

    // 3. 识别角色切换: **User**:
    const isUserHeader =
      el.querySelector('strong')?.textContent?.trim().toLowerCase() === 'user' ||
      /^User\s*:\s*$/i.test(text)
    if (isUserHeader) {
      finalizeTurn()
      currentRole = 'user'
      i++
      continue
    }

    // 4. 识别角色切换: **Assistant**:
    const isAssistantHeader =
      el.querySelector('strong')?.textContent?.trim().toLowerCase() === 'assistant' ||
      /^Assistant\s*:\s*$/i.test(text)
    if (isAssistantHeader) {
      finalizeTurn()
      currentRole = 'assistant'
      assistantHasStartedResponse = false
      i++
      continue
    }

    // 5. 分割线 hr (通常位于 User 与 Assistant 之间)
    if (tag === 'hr') {
      if (currentRole === 'user') {
        finalizeTurn()
      }
      i++
      continue
    }

    // 如果还没有命中任何角色，先默认归到用户或忽略空节点
    if (!currentRole) {
      if (text.length > 0) {
        currentRole = 'user'
        currentUserNodes.push(el)
      }
      i++
      continue
    }

    // 处理 User 轮次的内容
    if (currentRole === 'user') {
      currentUserNodes.push(el)
      i++
      continue
    }

    // 处理 Assistant 轮次的内容
    if (currentRole === 'assistant') {
      // 检查是否为 Tool Call
      const toolStrong = el.querySelector('strong')
      const isToolStart =
        toolStrong &&
        toolStrong.textContent?.trim().toLowerCase() === 'tool' &&
        (text.startsWith('Tool:') || text.startsWith('Tool：'))

      if (isToolStart) {
        // 解析 Tool Call 信息
        const codeEl = el.querySelector('code')
        const toolName = codeEl?.textContent?.trim() || text.replace(/^Tool\s*[:：]\s*/i, '').trim()
        const isMcp = toolName.includes('mcp__') || toolName.startsWith('mcp_')
        const cleanName = isMcp ? toolName.replace(/^mcp__?/, '').replace(/__/g, ' ➔ ') : toolName

        let callId = ''
        let inputRaw = '{}'
        let inputFormatted = '{}'
        let outputRaw = ''
        let outputFormatted = ''
        let isOutputJson = false

        i++
        // 抓取紧随其后的 Call ID, Input, Output
        while (i < children.length) {
          const nextEl = children[i]
          const nextTag = nextEl.tagName.toLowerCase()
          const nextText = (nextEl.textContent || '').trim()

          // 遇到下一个 Tool、下一个思考引用块、下一个角色声明或正文大段落时跳出
          if (
            nextEl.querySelector('strong')?.textContent?.trim().toLowerCase() === 'tool' ||
            nextEl.querySelector('strong')?.textContent?.trim().toLowerCase() === 'user' ||
            nextEl.querySelector('strong')?.textContent?.trim().toLowerCase() === 'assistant'
          ) {
            break
          }

          // Call ID
          if (nextText.includes('Call ID:')) {
            const callMatch = nextText.match(/Call ID\s*[:：]\s*([a-zA-Z0-9_\-]+)/i)
            if (callMatch) callId = callMatch[1]
          }

          // Input 代码块 (通常为 language-json)
          if (
            nextTag === 'div' &&
            nextEl.className.includes('language-') &&
            (nextEl.className.includes('json') || nextText.startsWith('{'))
          ) {
            const code = nextEl.querySelector('code')?.textContent || nextText
            inputRaw = code.trim()
            try {
              inputFormatted = JSON.stringify(JSON.parse(inputRaw), null, 2)
            } catch {
              inputFormatted = inputRaw
            }
            i++
            continue
          }

          // Output 代码块
          if (nextText.startsWith('Output:') || nextText.startsWith('Output：')) {
            i++
            if (i < children.length) {
              const codeEl = children[i]
              const code = codeEl.querySelector('code')?.textContent || codeEl.textContent || ''
              outputRaw = code.trim()
              try {
                const parsed = JSON.parse(outputRaw)
                outputFormatted = JSON.stringify(parsed, null, 2)
                isOutputJson = true
              } catch {
                outputFormatted = outputRaw
                isOutputJson = false
              }
            }
            i++
            continue
          }

          // 如果既不是上述，且是正文段落，则说明 Tool 结束了
          if (nextTag === 'p' && !nextText.includes('Call ID') && !nextText.includes('Input:')) {
            break
          }

          i++
        }

        currentAssistantSteps.push({
          type: 'tool',
          name: toolName,
          cleanName,
          isMcp,
          callId,
          inputRaw,
          inputFormatted,
          outputRaw,
          outputFormatted,
          isOutputJson,
          isCollapsed: true, // 默认折叠
        })
        continue
      }

      // 检查是否为 Thinking 思维链 (在最终 response 开始前出现的 blockquote)
      if (tag === 'blockquote' && !assistantHasStartedResponse) {
        const rawThought = el.textContent || ''
        currentAssistantSteps.push({
          type: 'thinking',
          contentHtml: el.innerHTML,
          contentRaw: rawThought.trim(),
          isCollapsed: true, // 默认折叠
        })
        i++
        continue
      }

      // 否则为 AI 正文回复内容
      assistantHasStartedResponse = true
      currentAssistantNodes.push(el)
      i++
    }
  }

  finalizeTurn()

  parsedData.title = currentTitle || parsedData.title || 'AI 对话'
  parsedData.exportedAt = currentExported || parsedData.exportedAt || ''
  parsedData.turns = turns
}

const mountProtocols = () => {
  const el = rootEl.value
  if (!el) return

  ;(el as any)._toMarkdown = () => {
    let md = ''
    if (parsedData.title) md += `# ${parsedData.title}\n\n`
    if (parsedData.exportedAt) md += `*Exported on ${parsedData.exportedAt}*\n\n`

    for (const turn of parsedData.turns) {
      if (turn.role === 'user') {
        md += `**User**:\n\n${turn.contentRaw.trim()}\n\n---\n\n`
      } else {
        md += `**Assistant**:\n\n`
        if (turn.steps) {
          for (const step of turn.steps) {
            if (step.type === 'thinking') {
              const lines = step.contentRaw.trim().split('\n')
              md += lines.map((l) => `> ${l}`).join('\n') + `\n\n`
            } else if (step.type === 'tool') {
              md += `**Tool**: \`${step.name}\`\n`
              if (step.callId) md += `- Call ID: \`${step.callId}\`\n`
              md += `Input:\n\`\`\`json\n${step.inputFormatted}\n\`\`\`\n`
              md += `Output:\n\`\`\`text\n${step.outputRaw}\n\`\`\`\n\n`
            }
          }
        }
        if (turn.contentRaw) {
          md += `${turn.contentRaw.trim()}\n\n`
        }
      }
    }
    return md.trim() + '\n'
  }

  ;(el as any)._toText = () => {
    let txt = `[Rikkahub AI: ${parsedData.title || '对话'}]\n`
    for (const turn of parsedData.turns) {
      txt += `\n[${turn.role.toUpperCase()}]:\n${turn.contentRaw.trim()}\n`
    }
    return txt
  }
}

onMounted(() => {
  nextTick(() => {
    parseSlotDom()
    isMounted.value = true
    mountProtocols()
  })
})
</script>

<style scoped>
.rikkahub-ai-container {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.rikkahub-ai-container:hover {
  border-color: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.4);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
}

/* 顶部控制与信息条 */
.rikkahub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
  flex-wrap: wrap;
  gap: 10px;
}

.rikkahub-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.rikkahub-logo-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.12);
  border: 1px solid rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.25);
  border-radius: 20px;
  color: var(--vp-c-brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.sparkle-svg {
  animation: sparkle-pulse 2.5s infinite ease-in-out;
}

@keyframes sparkle-pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.15) rotate(5deg); opacity: 1; }
}

.rikkahub-session-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rikkahub-meta-pill,
.rikkahub-stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
}

.rikkahub-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.rikkahub-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rikkahub-action-btn:hover {
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg);
}

.rikkahub-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.rikkahub-icon-btn:hover {
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
}

.rikkahub-chevron {
  transition: transform 0.25s ease;
}

.rikkahub-chevron.is-rotated {
  transform: rotate(-90deg);
}

.rikkahub-chevron.small {
  width: 13px;
  height: 13px;
}

/* 对话正文流动 */
.rikkahub-chat-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rikkahub-turn {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 角色标签 */
.rikkahub-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.role-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-user {
  background: #3b82f6;
  color: #fff;
}

.avatar-assistant {
  background: var(--vp-c-brand);
  color: #fff;
}

.role-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

/* 用户气泡 */
.rikkahub-user-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-size: 14.5px;
  line-height: 1.6;
}

.rikkahub-user-bubble :deep(p:first-child) {
  margin-top: 0 !important;
}

.rikkahub-user-bubble :deep(p:last-child) {
  margin-bottom: 0 !important;
}

/* 助手区域 */
.rikkahub-assistant-flow {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rikkahub-steps-flow {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ================= 思考链 Thinking 卡片 ================= */
.rikkahub-thinking-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-elv);
  overflow: hidden;
  transition: all 0.2s ease;
}

.thinking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  background: rgba(125, 125, 125, 0.05);
  font-size: 12.5px;
}

.thinking-header:hover {
  background: rgba(125, 125, 125, 0.09);
}

.thinking-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-2);
}

.thinking-label {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.thinking-sub {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.thinking-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-tiny-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-tiny-btn:hover {
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
}

.thinking-body {
  padding: 10px 14px;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  max-height: 420px;
  overflow-y: auto;
}

.thinking-text :deep(p) {
  margin: 6px 0;
  font-style: italic;
}

/* ================= MCP / Tool 卡片 ================= */
.rikkahub-tool-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-elv);
  overflow: hidden;
  transition: all 0.2s ease;
}

.rikkahub-tool-card.is-mcp {
  border-color: rgba(99, 102, 241, 0.35);
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  background: rgba(125, 125, 125, 0.04);
}

.tool-header:hover {
  background: rgba(125, 125, 125, 0.08);
}

.tool-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.tool-type-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.mcp-badge {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.regular-tool-badge {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.tool-name code {
  font-size: 12.5px;
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  color: var(--vp-c-text-1);
  padding: 2px 5px;
  background: transparent;
}

.tool-call-id {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--vp-c-text-3);
  padding: 1px 6px;
  background: var(--vp-c-bg-mute);
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
}

.tool-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tool-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

/* 工具主体 (结构化 JSON 区域) */
.tool-body {
  padding: 12px 14px;
  border-top: 1px dashed var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  gap: 5px;
}

.indicator-arrow {
  font-weight: 700;
}
.indicator-arrow.in { color: #3b82f6; }
.indicator-arrow.out { color: #10b981; }

.json-viewer-box {
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  overflow: hidden;
}

.json-pre,
.text-pre {
  margin: 0 !important;
  padding: 10px 12px !important;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.5;
  max-height: 320px;
  overflow: auto;
}

/* 语法高亮配色 */
:deep(.json-key) {
  color: #0284c7;
  font-weight: 600;
}
:deep(.json-string) {
  color: #059669;
}
:deep(.json-number) {
  color: #d97706;
}
:deep(.json-boolean) {
  color: #7c3aed;
  font-weight: 600;
}
:deep(.json-null) {
  color: #dc2626;
  font-weight: 600;
}

/* 暗色模式针对高亮配色的优化 */
.dark :deep(.json-key) {
  color: #38bdf8;
}
.dark :deep(.json-string) {
  color: #34d399;
}
.dark :deep(.json-number) {
  color: #fbbf24;
}
.dark :deep(.json-boolean) {
  color: #a78bfa;
}

/* AI 最终回复区域 */
.rikkahub-response-content {
  padding: 6px 4px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
}

.rikkahub-response-content :deep(h1),
.rikkahub-response-content :deep(h2),
.rikkahub-response-content :deep(h3) {
  margin-top: 1.2em;
  margin-bottom: 0.6em;
}

.rikkahub-response-content :deep(table) {
  display: table;
  width: 100%;
  margin: 1em 0;
  border-collapse: collapse;
}

.rikkahub-response-content :deep(th),
.rikkahub-response-content :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
}

.rikkahub-response-content :deep(th) {
  background: var(--vp-c-bg-mute);
}

/* 全局 AI 关闭时的 Fallback 卡片 */
.rikkahub-disabled-card {
  margin: 1.5em 0;
  padding: 12px 16px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.disabled-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.enable-btn {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-brand);
  border-radius: 6px;
  background: rgba(var(--vp-c-brand-rgb, 100, 189, 99), 0.1);
  color: var(--vp-c-brand);
  font-size: 12px;
  cursor: pointer;
}

.enable-btn:hover {
  background: var(--vp-c-brand);
  color: #fff;
}

.no-select {
  user-select: none;
}

@media (max-width: 640px) {
  .rikkahub-chat-body {
    padding: 12px 14px;
  }
  .rikkahub-header {
    padding: 8px 12px;
  }
  .rikkahub-session-title {
    max-width: 180px;
  }
}
</style>
