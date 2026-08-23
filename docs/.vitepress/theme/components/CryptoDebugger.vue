<template>
  <div class="crypto-debugger">
    <!-- 1. 密钥管理中心 -->
    <div class="debug-card key-section">
      <div class="section-header">
        <div class="header-title">
          <svg class="header-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>密钥管理中心</span>
        </div>
        <div class="key-status-badge" :class="{ 'is-set': !!currentKey }">
          <span class="status-dot"></span>
          {{ currentKey ? `已配置 (${currentKey.length} 字符)` : '未配置密钥' }}
        </div>
      </div>

      <!-- 密钥预设选择器 -->
      <div class="key-presets">
        <button
          v-for="preset in keyPresets"
          :key="preset.id"
          class="preset-btn"
          :class="{ active: selectedPreset === preset.id }"
          @click="selectPreset(preset.id)"
        >
          <span class="preset-label">{{ preset.label }}</span>
          <span class="preset-sub">({{ preset.storageKey }})</span>
          <span class="preset-dot" v-if="preset.hasValue"></span>
        </button>
      </div>

      <!-- 密钥输入与操作 -->
      <div class="key-input-row">
        <div class="input-wrapper">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="currentKey"
            class="key-input"
            :placeholder="`请输入 ${activePresetInfo.label}（按回车或点击保存）`"
            @keyup.enter="saveCurrentKey"
          />
          <button class="toggle-eye-btn" @click="showPassword = !showPassword" :title="showPassword ? '隐藏密码' : '显示密码'">
            <svg v-if="!showPassword" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>

        <button class="action-btn primary" @click="saveCurrentKey">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>保存密钥</span>
        </button>

        <button class="action-btn" @click="clearCurrentKey" title="清空当前密钥输入">
          <span>清空</span>
        </button>
      </div>

      <div class="key-hint">
        <span>当前加密使用的有效密码来源：<strong>{{ activePresetInfo.label }}</strong> (<code>localStorage.{{ activePresetInfo.storageKey }}</code>)</span>
      </div>
    </div>

    <!-- 2. 明文与密文双栏调试工作台 -->
    <div class="workbench-grid">
      <!-- 左栏：明文 (Plaintext) -->
      <div class="debug-card pane-card">
        <div class="pane-header">
          <div class="pane-title">
            <span class="pane-tag">明文 (Plaintext)</span>
            <span class="count-badge">{{ plainText.length }} 字符 / {{ plainLineCount }} 行</span>
          </div>
          <div class="pane-actions">
            <!-- 示例填充下拉/按钮 -->
            <div class="sample-dropdown">
              <button class="icon-text-btn" @click="showSampleMenu = !showSampleMenu">
                <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>填充示例</span>
              </button>
              <div v-if="showSampleMenu" class="sample-menu">
                <div class="sample-item" @click="applySample('short')">普通人名/微隐私（如：张三）</div>
                <div class="sample-item" @click="applySample('sentence')">完整隐私段落（多行中英文）</div>
                <div class="sample-item" @click="applySample('img')">加密图片路径（/imgs/secret.jpg）</div>
                <div class="sample-item" @click="applySample('html')">含 HTML 标签格式的内容</div>
              </div>
            </div>
            <button class="icon-text-btn" @click="copyText(plainText, '明文')">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>复制</span>
            </button>
            <button class="icon-text-btn" @click="plainText = ''">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>清空</span>
            </button>
          </div>
        </div>

        <div class="textarea-wrapper">
          <textarea
            v-model="plainText"
            class="code-textarea"
            placeholder="输入需要加密的原始字符串（如人名、日记内容、图片路径等）..."
            rows="8"
          ></textarea>
        </div>

        <div class="pane-footer">
          <button class="main-action-btn encrypt-btn" :disabled="!plainText" @click="handleEncrypt">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>加密为 Base64 (AES-256-GCM)</span>
          </button>
        </div>
      </div>

      <!-- 中间操作工具条 -->
      <div class="mid-toolbar">
        <button class="mid-btn" title="加密明文" @click="handleEncrypt" :disabled="!plainText">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          <span class="mid-text">加密</span>
        </button>

        <button class="mid-btn" title="解密密文" @click="handleDecrypt" :disabled="!cipherText">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span class="mid-text">解密</span>
        </button>

        <button class="mid-btn" title="交换明文与密文" @click="swapContent" :disabled="!plainText && !cipherText">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          <span class="mid-text">互换</span>
        </button>

        <button class="mid-btn test-btn" title="往返自检：加密后立即解密对比" @click="runRoundtripTest" :disabled="!plainText">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span class="mid-text">自检</span>
        </button>
      </div>

      <!-- 右栏：密文 (Ciphertext) -->
      <div class="debug-card pane-card">
        <div class="pane-header">
          <div class="pane-title">
            <span class="pane-tag">密文 (Ciphertext)</span>
            <span class="cipher-type-badge" :class="cipherFormatClass">
              {{ cipherFormatLabel }}
            </span>
          </div>
          <div class="pane-actions">
            <button class="icon-text-btn" @click="copyText(cipherText, '密文')">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>复制</span>
            </button>
            <button class="icon-text-btn" @click="cipherText = ''">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>清空</span>
            </button>
          </div>
        </div>

        <div class="textarea-wrapper">
          <textarea
            v-model="cipherText"
            class="code-textarea cipher"
            placeholder="输入或粘贴 Base64 / Hex 密文，或直接粘贴带有 <ec>...</ec>、<span> 等标签的内容（自动提取密文）..."
            rows="8"
            @input="onCipherInput"
          ></textarea>
        </div>

        <div class="pane-footer">
          <button class="main-action-btn decrypt-btn" :disabled="!cipherText" @click="handleDecrypt">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
            <span>解密为明文 (Auto-Detect)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 3. 操作通知提示栏 -->
    <transition name="fade">
      <div v-if="statusMessage" class="status-banner" :class="statusType">
        <div class="status-content">
          <svg v-if="statusType === 'success'" class="status-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <svg v-else-if="statusType === 'error'" class="status-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <svg v-else class="status-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>{{ statusMessage }}</span>
        </div>
        <button class="close-status-btn" @click="statusMessage = ''">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </transition>

    <!-- 4. Markdown 博客加密标签生成器 -->
    <div class="debug-card generator-card">
      <div class="section-header">
        <div class="header-title">
          <svg class="header-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span>Markdown 博客标签生成器</span>
        </div>
        <span class="section-desc">将当前密文一键包装为博客写作直接可用的 HTML / Vue 标签</span>
      </div>

      <div class="generator-options">
        <!-- 标签类型单选 -->
        <div class="option-row">
          <span class="option-label">标签形式：</span>
          <div class="tag-type-group">
            <label v-for="tag in tagOptions" :key="tag.value" class="tag-type-radio">
              <input type="radio" v-model="selectedTagType" :value="tag.value" />
              <span class="radio-custom">{{ tag.label }}</span>
            </label>
          </div>
        </div>

        <!-- 扩展属性 -->
        <div class="option-row" v-if="selectedTagType !== 'Img'">
          <span class="option-label">可选属性：</span>
          <div class="attr-inputs">
            <div class="attr-field">
              <span class="attr-name">fallback="</span>
              <input type="text" v-model="tagFallback" placeholder="解密失败时的占位文案" class="attr-input" />
              <span class="attr-name">"</span>
            </div>
            <label class="checkbox-label" title="解密成功后自动更新浏览器标签页网页标题">
              <input type="checkbox" v-model="tagChangeTitle" />
              <span>changeTitle (动态网页标题)</span>
            </label>
          </div>
        </div>

        <!-- 图片专用属性 -->
        <div class="option-row" v-else>
          <span class="option-label">图片等级：</span>
          <div class="tag-type-group">
            <label class="tag-type-radio">
              <input type="radio" v-model="imgLevel" value="norm" />
              <span class="radio-custom">普通 (默认)</span>
            </label>
            <label class="tag-type-radio">
              <input type="radio" v-model="imgLevel" value="sec" />
              <span class="radio-custom">私密 (level="sec")</span>
            </label>
            <label class="tag-type-radio">
              <input type="radio" v-model="imgLevel" value="teacher" />
              <span class="radio-custom">教师 (level="teacher")</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 生成的代码预览与复制 -->
      <div class="generated-code-box">
        <div class="code-header">
          <span class="code-title">生成的 Markdown 标签代码：</span>
          <button class="action-btn copy-code-btn" @click="copyText(generatedTagCode, '标签代码')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>复制标签代码</span>
          </button>
        </div>
        <div class="code-content">
          <code>{{ generatedTagCode || '(暂无密文，请先加密或输入密文)' }}</code>
        </div>
      </div>
    </div>

    <!-- 5. 实时解密沙盒预览 -->
    <div class="debug-card preview-card">
      <div class="section-header">
        <div class="header-title">
          <svg class="header-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>前端解密渲染沙盒预览</span>
        </div>
        <button class="action-btn secondary" @click="triggerSiteDecrypt">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>重新执行解密流程</span>
        </button>
      </div>

      <div class="preview-sandbox-area">
        <p class="preview-tip">以下区域直接挂载站点解密样式，点击解密失败的内容可切换显示原始密文：</p>
        <div class="sandbox-render-box" ref="sandboxRef">
          <div class="sandbox-item">
            <span class="sandbox-label">当前标签效果：</span>
            <div class="sandbox-content" v-html="previewHtml"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { encrypt, decrypt, isBase64Cipher } from '../../scripts/crypto'
import { ekey_norm, ekey_priv, ekey_teacher } from '../../scripts/Data'

// 1. 密钥预设列表
const keyPresets = [
  { id: 'norm', label: '普通密钥', storageKey: ekey_norm, defaultKey: '' },
  { id: 'priv', label: '私密密钥', storageKey: ekey_priv, defaultKey: '' },
  { id: 'teacher', label: '教师密钥', storageKey: ekey_teacher, defaultKey: '' },
  { id: 'custom', label: '自定义/调试密钥', storageKey: 'debug_key', defaultKey: '' },
]

const selectedPreset = ref('custom')
const currentKey = ref('')
const showPassword = ref(false)
const keyStates = ref<Record<string, boolean>>({})

// 2. 工作台明文与密文
const plainText = ref('这是一条用于测试 AES-256-GCM 加密解密的机密文本。')
const cipherText = ref('')
const showSampleMenu = ref(false)

// 3. 状态与提示
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')
let statusTimer: any = null

// 4. 标签生成器
const selectedTagType = ref('ec')
const tagFallback = ref('')
const tagChangeTitle = ref(false)
const imgLevel = ref('norm')

const tagOptions = [
  { label: '<ec> (普通等级)', value: 'ec' },
  { label: '<ecp> (私密等级)', value: 'ecp' },
  { label: '<tc> (教师等级)', value: 'tc' },
  { label: '<span class="encrypt">', value: 'span_encrypt' },
  { label: '<span class="encpp">', value: 'span_encpp' },
  { label: '<Img /> (加密图片)', value: 'Img' },
]

// 计算属性：当前预设信息
const activePresetInfo = computed(() => {
  return keyPresets.find((p) => p.id === selectedPreset.value) || keyPresets[3]
})

// 行数计算
const plainLineCount = computed(() => {
  if (!plainText.value) return 0
  return plainText.value.split('\n').length
})

// 密文格式检测
const isHexFormat = computed(() => {
  const t = cipherText.value.trim()
  return /^[0-9a-fA-F]{32,}$/.test(t) && t.length % 2 === 0
})

const isBase64Format = computed(() => {
  return isBase64Cipher(cipherText.value.trim())
})

const cipherFormatLabel = computed(() => {
  if (!cipherText.value.trim()) return '无输入'
  if (isBase64Format.value) return 'Base64 (AES-GCM-256)'
  if (isHexFormat.value) return 'Hex (历史 AES-CFB)'
  return '非标准密文格式'
})

const cipherFormatClass = computed(() => {
  if (!cipherText.value.trim()) return ''
  if (isBase64Format.value) return 'type-base64'
  if (isHexFormat.value) return 'type-hex'
  return 'type-invalid'
})

// 标签代码生成
const generatedTagCode = computed(() => {
  const rawCipher = cipherText.value.trim()
  if (!rawCipher) return ''

  const fallbackPart = tagFallback.value.trim() ? ` fallback="${tagFallback.value.trim()}"` : ''
  const titlePart = tagChangeTitle.value ? ' changeTitle' : ''

  switch (selectedTagType.value) {
    case 'ec':
      return `<ec${fallbackPart}${titlePart}>${rawCipher}</ec>`
    case 'ecp':
      return `<ecp${fallbackPart}${titlePart}>${rawCipher}</ecp>`
    case 'tc':
      return `<tc${fallbackPart}${titlePart}>${rawCipher}</tc>`
    case 'span_encrypt':
      return `<span class="encrypt"${fallbackPart}${titlePart}>${rawCipher}</span>`
    case 'span_encpp':
      return `<span class="encpp"${fallbackPart}${titlePart}>${rawCipher}</span>`
    case 'Img': {
      const levelPart = imgLevel.value !== 'norm' ? ` level="${imgLevel.value}"` : ''
      return `<Img content="${rawCipher}"${levelPart} />`
    }
    default:
      return `<ec${fallbackPart}${titlePart}>${rawCipher}</ec>`
  }
})

// 预览 HTML 生成
const previewHtml = computed(() => {
  const rawCipher = cipherText.value.trim()
  if (!rawCipher) {
    return '<span style="color: var(--vp-c-text-3); font-style: italic;">暂无待渲染标签</span>'
  }
  return generatedTagCode.value
})

// 初始化与预设切换
function refreshKeyStates() {
  if (typeof localStorage === 'undefined') return
  keyPresets.forEach((p) => {
    const val = localStorage.getItem(p.storageKey)
    keyStates.value[p.id] = !!(val && val.trim())
    ;(p as any).hasValue = !!(val && val.trim())
  })
}

function selectPreset(presetId: string) {
  selectedPreset.value = presetId
  if (typeof localStorage !== 'undefined') {
    const p = keyPresets.find((item) => item.id === presetId)
    if (p) {
      currentKey.value = localStorage.getItem(p.storageKey) || ''
    }
  }
  showNotify(`已切换到预设：${activePresetInfo.value.label}`, 'info')
}

function saveCurrentKey() {
  if (typeof localStorage === 'undefined') return
  const p = activePresetInfo.value
  localStorage.setItem(p.storageKey, currentKey.value)
  localStorage.setItem('debug_key', currentKey.value)

  refreshKeyStates()
  showNotify(`已保存 ${p.label} 至 localStorage.${p.storageKey}`, 'success')

  if (typeof window !== 'undefined' && (window as any).narn) {
    ;(window as any).narn('success', `${p.label} 更新成功`, 1200, '密钥设置')
  }
}

function clearCurrentKey() {
  currentKey.value = ''
  showNotify('已清空当前输入的密钥', 'info')
}

// 消息提示
function showNotify(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  statusMessage.value = msg
  statusType.value = type
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => {
    statusMessage.value = ''
  }, 4000)
}

// 复制工具函数
async function copyText(text: string, label: string = '文本') {
  if (!text) {
    showNotify(`无内容可复制`, 'error')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    showNotify(`已成功复制${label}到剪贴板`, 'success')
  } catch (e) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showNotify(`已成功复制${label}到剪贴板`, 'success')
  }
}

// 智能输入：若直接粘贴了包含 <ec>... 等标签的内容，自动提取内部密文
function onCipherInput() {
  let val = cipherText.value.trim()
  if (!val) return

  const tagMatch = val.match(/<([a-zA-Z0-9]+)(\s+[^>]*)?>([\s\S]*?)<\/\1>/i)
  if (tagMatch && tagMatch[3]) {
    const extracted = tagMatch[3].trim()
    if (isBase64Cipher(extracted) || /^[0-9a-fA-F]{32,}$/.test(extracted)) {
      cipherText.value = extracted
      showNotify(`已智能提取标签内部密文 (${extracted.slice(0, 16)}...)`, 'info')
      return
    }
  }

  const contentMatch = val.match(/content=['"]([^'"]+)['"]/i)
  if (contentMatch && contentMatch[1]) {
    const extracted = contentMatch[1].trim()
    if (isBase64Cipher(extracted) || /^[0-9a-fA-F]{32,}$/.test(extracted)) {
      cipherText.value = extracted
      showNotify(`已智能提取 content 属性内部密文`, 'info')
    }
  }
}

// 示例填充
function applySample(type: 'short' | 'sentence' | 'img' | 'html') {
  showSampleMenu.value = false
  switch (type) {
    case 'short':
      plainText.value = '张三'
      break
    case 'sentence':
      plainText.value =
        '2026年8月22日，天气晴朗。\n这是一个包含多行文本、中英文与标点符号的真实加密测试句子。'
      break
    case 'img':
      plainText.value = '/imgs/private/secret_moment_2026.jpg'
      break
    case 'html':
      plainText.value =
        '<strong>加粗内容</strong>与带有 <span style="color:red">颜色样式</span> 的 HTML 明文。'
      break
  }
  showNotify('已填充示例数据', 'info')
}

// 核心加密
async function handleEncrypt() {
  if (!currentKey.value) {
    showNotify('请先输入或选择当前用于加密的密钥', 'error')
    return
  }
  if (!plainText.value) {
    showNotify('请输入要加密的明文字符串', 'error')
    return
  }

  try {
    const res = await encrypt(plainText.value, currentKey.value)
    cipherText.value = res
    showNotify('加密成功，已生成 Base64 密文', 'success')
    nextTick(() => {
      triggerSiteDecrypt()
    })
  } catch (err: any) {
    showNotify(`加密失败: ${err?.message || err}`, 'error')
  }
}

// 核心解密
async function handleDecrypt() {
  if (!currentKey.value) {
    showNotify('请先输入或选择当前用于解密的密钥', 'error')
    return
  }
  if (!cipherText.value) {
    showNotify('请输入要解密的密文字符串', 'error')
    return
  }

  try {
    let targetCipher = cipherText.value.trim()
    const tagMatch = targetCipher.match(/<[a-zA-Z0-9]+[^>]*>([\s\S]*?)<\/[a-zA-Z0-9]+>/i)
    if (tagMatch) targetCipher = tagMatch[1].trim()

    const res = await decrypt(targetCipher, currentKey.value)
    if (res === targetCipher) {
      showNotify('解密失败，可能是密钥不匹配或密文损坏', 'error')
    } else {
      plainText.value = res
      showNotify('解密成功，已还原明文字符串', 'success')
    }
  } catch (err: any) {
    showNotify(`解密异常: ${err?.message || err}`, 'error')
  }
}

// 交换内容
function swapContent() {
  const temp = plainText.value
  plainText.value = cipherText.value
  cipherText.value = temp
  showNotify('已互换明文与密文框内容', 'info')
}

// 往返自检测试
async function runRoundtripTest() {
  if (!currentKey.value) {
    showNotify('自检前请先配置有效密钥', 'error')
    return
  }
  if (!plainText.value) {
    showNotify('请在明文框中输入测试内容以进行自检', 'error')
    return
  }

  try {
    const origin = plainText.value
    const enc = await encrypt(origin, currentKey.value)
    cipherText.value = enc
    const dec = await decrypt(enc, currentKey.value)

    if (dec === origin) {
      showNotify('自检通过：明文经过 AES-GCM 加密并解密后完全吻合', 'success')
    } else {
      showNotify('自检失败：解密还原结果与初始明文不一致', 'error')
    }
    nextTick(() => {
      triggerSiteDecrypt()
    })
  } catch (e: any) {
    showNotify(`自检过程发生异常: ${e?.message || e}`, 'error')
  }
}

// 触发站点解密流程
function triggerSiteDecrypt() {
  if (typeof window !== 'undefined' && (window as any).tryDecrypt) {
    ;(window as any).tryDecrypt()
    showNotify('已触发全局 tryDecrypt() 渲染流水线', 'info')
  }
}

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    const debugKey = localStorage.getItem('debug_key')
    const gpgKey = localStorage.getItem(ekey_norm)

    if (debugKey) {
      currentKey.value = debugKey
      selectedPreset.value = 'custom'
    } else if (gpgKey) {
      currentKey.value = gpgKey
      selectedPreset.value = 'norm'
    }
    refreshKeyStates()
  }

  if (plainText.value && currentKey.value) {
    handleEncrypt()
  }
})
</script>

<style scoped>
.crypto-debugger {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0 40px;
  font-family: var(--vp-font-family-base);
}

/* 基础卡片 */
.debug-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.debug-card:hover {
  border-color: var(--vp-c-brand-soft, var(--vp-c-divider));
}

/* 头部样式 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.header-icon {
  color: var(--vp-c-brand);
}

.section-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

/* 密钥状态指示徽章 */
.key-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(237, 146, 134, 0.15);
  color: #c24343;
  border: 1px solid rgba(237, 146, 134, 0.3);
}

.key-status-badge.is-set {
  background: rgba(184, 244, 188, 0.25);
  color: #11b674;
  border-color: rgba(110, 214, 154, 0.4);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* 密钥预设选择器 */
.key-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.preset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.preset-btn.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: #fff;
}

.preset-sub {
  font-size: 11px;
  opacity: 0.75;
  font-family: var(--vp-font-family-mono);
}

.preset-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #52c41a;
}

.preset-btn.active .preset-dot {
  background: #fff;
}

/* 密钥输入行 */
.key-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.input-wrapper {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.key-input {
  width: 100%;
  height: 40px;
  padding: 0 38px 0 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-family: var(--vp-font-family-mono);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.key-input:focus {
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 2px rgba(100, 189, 99, 0.2);
}

.toggle-eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.toggle-eye-btn:hover {
  color: var(--vp-c-text-1);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.action-btn.primary {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: #fff;
}

.action-btn.primary:hover {
  opacity: 0.9;
}

.action-btn.secondary {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.key-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

/* 2. 工作台布局 */
.workbench-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 14px;
  align-items: stretch;
}

.pane-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.pane-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pane-tag {
  font-weight: 600;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.count-badge {
  font-size: 11px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.cipher-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

.cipher-type-badge.type-base64 {
  background: rgba(184, 244, 188, 0.2);
  color: #11b674;
  border-color: rgba(110, 214, 154, 0.3);
}

.cipher-type-badge.type-hex {
  background: rgba(0, 153, 229, 0.15);
  color: #0099e5;
  border-color: rgba(0, 153, 229, 0.3);
}

.cipher-type-badge.type-invalid {
  background: rgba(237, 146, 134, 0.15);
  color: #c24343;
}

.pane-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-text-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 12px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-text-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.sample-dropdown {
  position: relative;
}

.sample-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  width: 220px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 4px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 100;
}

.sample-item {
  padding: 7px 12px;
  font-size: 12px;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: background 0.15s ease;
}

.sample-item:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-brand);
}

/* 文本域 */
.textarea-wrapper {
  flex: 1;
  display: flex;
  margin-bottom: 12px;
}

.code-textarea {
  width: 100%;
  min-height: 160px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1.5;
  font-family: var(--vp-font-family-mono);
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.code-textarea:focus {
  border-color: var(--vp-c-brand);
}

.code-textarea.cipher {
  word-break: break-all;
}

.pane-footer {
  display: flex;
  justify-content: flex-end;
}

.main-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.main-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.encrypt-btn {
  background: var(--vp-c-brand);
  color: #fff;
}

.encrypt-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.decrypt-btn {
  background: #11b674;
  color: #fff;
}

.decrypt-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 中部工具条 */
.mid-toolbar {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.mid-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 54px;
  height: 54px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mid-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  transform: scale(1.05);
}

.mid-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mid-text {
  font-size: 11px;
}

.test-btn:hover:not(:disabled) {
  border-color: #52c41a;
  color: #52c41a;
}

/* 3. 状态提示 Banner */
.status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  animation: slideDown 0.2s ease;
}

.status-banner.success {
  background: rgba(184, 244, 188, 0.35);
  border: 1px solid #6ed69a;
  color: #0e8052;
}

.status-banner.error {
  background: rgba(237, 146, 134, 0.35);
  border: 1px solid #ed8476;
  color: #a82828;
}

.status-banner.info {
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.status-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  flex-shrink: 0;
}

.close-status-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: currentColor;
  opacity: 0.6;
  padding: 2px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-status-btn:hover {
  opacity: 1;
}

/* 4. 标签生成器 */
.generator-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.generator-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--vp-c-bg-elv);
  padding: 14px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.option-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
}

.option-label {
  font-size: 13px;
  font-weight: 600;
  min-width: 72px;
  color: var(--vp-c-text-1);
}

.tag-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-type-radio {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.tag-type-radio input {
  display: none;
}

.radio-custom {
  padding: 5px 12px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
}

.tag-type-radio input:checked + .radio-custom {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: #fff;
}

.attr-inputs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.attr-field {
  display: inline-flex;
  align-items: center;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0 8px;
}

.attr-name {
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.attr-input {
  height: 32px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--vp-c-text-1);
  outline: none;
  min-width: 140px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

/* 生成的代码框 */
.generated-code-box {
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.code-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.copy-code-btn {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.code-content {
  padding: 12px 14px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
  word-break: break-all;
}

/* 5. 沙盒预览 */
.preview-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-tip {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-bottom: 8px;
}

.sandbox-render-box {
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px dashed var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
}

.sandbox-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.sandbox-label {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.sandbox-content {
  font-size: 14px;
  line-height: 1.6;
}

/* 响应式适配 */
@media (max-width: 860px) {
  .workbench-grid {
    grid-template-columns: 1fr;
  }

  .mid-toolbar {
    flex-direction: row;
    padding: 6px 0;
  }

  .mid-btn {
    width: 60px;
    height: 42px;
    flex-direction: row;
  }
}
</style>
