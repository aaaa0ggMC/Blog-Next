export interface NaranjaButton {
  text: string
  click: (e: {
    closeNotification: () => void
    preventClose: () => void
  }) => void
}

export interface NaranjaArgs {
  title: string
  text: string
  icon?: boolean
  buttons?: NaranjaButton[]
  timeout?: number | 'keep'
}

export interface NaranjaInstance {
  log: (argm: NaranjaArgs) => void
  success: (argm: NaranjaArgs) => void
  warn: (argm: NaranjaArgs) => void
  error: (argm: NaranjaArgs) => void
}

export interface DecryptElement extends HTMLElement {
  decState?: 'success' | 'failed'
}

declare global {
  interface Window {
    encrypt: (data: string, passKey?: string | null) => Promise<string>
    decrypt: (data: string, passKey?: string | null) => Promise<string>
    initGPG: () => Promise<void>
    tryDecrypt: () => Promise<void>
    confirmGPG: () => void
    confirmCrypt: () => void
    narn: (
      type: string,
      message: string,
      timeoutTMs?: number | string,
      stitle?: string,
      fn?: () => void
    ) => void
    naranja: () => NaranjaInstance
    checkSwitch: (
      tg: HTMLInputElement,
      onchek?: () => void,
      onuchek?: () => void
    ) => boolean
  }
}