import { ref, watch } from 'vue'

const STORAGE_KEY = 'showAi'

// 默认开启展示 AI 内容
export const isAiGloballyVisible = ref<boolean>(true)

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) {
    isAiGloballyVisible.value = saved !== 'false'
  }

  // 监听跨组件或跨页面的设置变更
  window.addEventListener('ai-toggle-change', () => {
    const current = localStorage.getItem(STORAGE_KEY)
    isAiGloballyVisible.value = current !== 'false'
  })

  // 监听浏览器跨标签页 storage 同步
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      isAiGloballyVisible.value = e.newValue !== 'false'
    }
  })

  // 状态变更时自动落盘
  watch(isAiGloballyVisible, (val) => {
    localStorage.setItem(STORAGE_KEY, String(val))
    window.dispatchEvent(new CustomEvent('ai-toggle-change'))
  })
}

export function toggleGlobalAi(): boolean {
  isAiGloballyVisible.value = !isAiGloballyVisible.value
  return isAiGloballyVisible.value
}

export function setGlobalAi(visible: boolean): void {
  isAiGloballyVisible.value = visible
}
