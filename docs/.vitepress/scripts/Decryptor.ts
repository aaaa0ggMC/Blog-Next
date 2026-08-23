import $ from 'jquery'
import { initPage } from './SelectiveIniter'
import { encrypt, decrypt, isBase64Cipher, isHexCipher } from './crypto'
import {
  ekey_norm,
  ekey_priv,
  ekey_teacher,
  user_define,
  fallback_img,
} from './Data'
import type { DecryptElement } from './types'

async function decryptData(
  className: string,
  key: string | null | undefined,
): Promise<{ total: number; success: number }> {
  const encs = document.getElementsByClassName(
    className,
  ) as HTMLCollectionOf<DecryptElement>
  let result = 0
  let totalValid = 0

  for (let i = 0; i < encs.length; ++i) {
    const element = encs[i]
    let storeInContent = false

    try {
      const innerHTML = element.innerHTML
      const contentAttr = element.getAttribute('content')
      let cipherString = ''

      if (innerHTML === '' && !contentAttr) {
        continue
      }
      if (innerHTML === null || innerHTML === '') {
        storeInContent = true
      }

      if (element.decState) {
        cipherString = element.dataset.hex ?? ''
      } else if (storeInContent) {
        cipherString = contentAttr ?? ''
      } else {
        cipherString = innerHTML.trim()
      }

      if (cipherString.startsWith('<!--[-->')) {
        cipherString = cipherString
          .replace('<!--]-->', '')
          .replace('<!--[-->', '')
          .trim()
      }

      // 如果当前内容本身就是人类可读明文（非密文格式，如本地开发 dev 分支环境）
      const isCipher = isBase64Cipher(cipherString) || isHexCipher(cipherString)
      if (!isCipher) {
        element.decState = 'success'
        element.className = element.className.replace(/\bencFail\b/g, '') + ' encSuc'
        result++
        totalValid++
        continue
      }

      totalValid++
      const decryptedText = await decrypt(cipherString, key)
      element.dataset.hex = cipherString

      const lst = (): void => {
        if (element.decState === 'success') return
        element.textContent = element.dataset.hex ?? ''
      }

      if (decryptedText === cipherString) {
        const fallbackAttr = element.getAttribute('fallback')
        if (fallbackAttr !== null) {
          if (!storeInContent) {
            element.innerHTML = fallbackAttr
          } else {
            element.setAttribute('content', fallbackAttr)
          }
          element.title = '解密失败'
        } else {
          if (!storeInContent) {
            element.innerHTML = '(解码失败,查看密文)'
          } else {
            const tagName = element.tagName
            if (tagName === 'IMG') {
              element.setAttribute('content', fallback_img)
            } else {
              element.setAttribute('content', '(解码失败,查看密文)')
            }
          }
          element.addEventListener('click', lst)
        }
        element.decState = 'failed'
        element.className = element.className.replace(/\bencSuc\b/g, '') + ' encFail'
      } else {
        result++
        const changeTitleAttr = element.getAttribute('changeTitle')
        if (changeTitleAttr !== null) {
          const titleEle = document.head.getElementsByTagName('title')[0]
          if (titleEle) {
            const index = titleEle.innerHTML.indexOf('|')
            titleEle.innerHTML =
              decryptedText +
              (index !== -1 ? titleEle.innerHTML.substring(index) : '')
          }
        }
        element.removeEventListener('click', lst)
        if (!storeInContent) {
          element.innerHTML = decryptedText
        } else {
          element.setAttribute('content', decryptedText)
        }
        element.decState = 'success'
        element.className = element.className.replace(/\bencFail\b/g, '') + ' encSuc'
      }
    } catch (error) {
      console.error('解密异常:', error)
    }
  }

  return { total: totalValid, success: result }
}

function confirmGPG(): void {
  const target = document.getElementById(ekey_norm) as HTMLInputElement | null
  if (target) {
    localStorage.setItem(ekey_norm, target.value)
    console.log('Set Normal Key:', target.value)
  }
  const target2 = document.getElementById(ekey_priv) as HTMLInputElement | null
  if (target2) {
    localStorage.setItem(ekey_priv, target2.value)
    console.log('Set More Private Key:', target2.value)
  }
  const target3 = document.getElementById(
    ekey_teacher,
  ) as HTMLInputElement | null
  if (target3) {
    localStorage.setItem(ekey_teacher, target3.value)
    console.log('Set Teacher Key:', target3.value)
  }
}

function bindKeyHandler(id: string, onEnter: () => void): void {
  const el = document.getElementById(id) as HTMLInputElement | null
  if (!el) return
  el.onkeyup = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEnter()
      window.narn('success', '密钥更新成功', 1000, '密钥设置')
      tryDecrypt()
    }
  }
}

function initKeyInputs(): void {
  const gpgKey = localStorage.getItem(ekey_norm)
  const secKey = localStorage.getItem(ekey_priv)
  const teacherKey = localStorage.getItem(ekey_teacher)
  const target = document.getElementById(ekey_norm) as HTMLInputElement | null
  const targetSec = document.getElementById(ekey_priv) as HTMLInputElement | null
  const targetTC = document.getElementById(
    ekey_teacher,
  ) as HTMLInputElement | null
  const targetUDF = document.getElementById(
    user_define,
  ) as HTMLInputElement | null

  if (target && gpgKey) target.value = gpgKey
  if (targetSec && secKey) targetSec.value = secKey
  if (targetTC && teacherKey) targetTC.value = teacherKey
  if (targetUDF) targetUDF.value = (localStorage as any).userDef ?? ''

  bindKeyHandler(ekey_norm, () => {
    confirmGPG()
  })
  bindKeyHandler(ekey_priv, () => {
    confirmGPG()
  })
  bindKeyHandler(ekey_teacher, () => {
    confirmGPG()
  })

  const udfEl = document.getElementById(user_define) as HTMLInputElement | null
  if (udfEl) {
    udfEl.onkeyup = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        (localStorage as any).userDef = udfEl.value
        window.narn('success', '更新成功', 1000, '代理设置')
      }
    }
  }
}

let decryptDebounceTimer: any = null
let lastNoticeSignature: string = ''
let isDecrypting = false

export function tryDecrypt(forceNotice: boolean = false): void {
  if (typeof window === 'undefined') return

  if (decryptDebounceTimer) {
    clearTimeout(decryptDebounceTimer)
  }

  decryptDebounceTimer = window.setTimeout(async () => {
    if (isDecrypting) return
    isDecrypting = true

    try {
      if (($ as any).isReady == null && document.readyState === 'loading') {
        decryptDebounceTimer = window.setTimeout(() => tryDecrypt(forceNotice), 80)
        return
      }

      initKeyInputs()

      const results = await Promise.all([
        decryptData('encrypt', localStorage.getItem(ekey_norm)),
        decryptData('e', localStorage.getItem(ekey_norm)),
        decryptData('encpp', localStorage.getItem(ekey_priv)),
        decryptData('e+', localStorage.getItem(ekey_priv)),
        decryptData('eteacher', localStorage.getItem(ekey_teacher)),
      ])

      const totalEncrypted = results.reduce((acc, cur) => acc + cur.total, 0)
      const totalSuccess = results.reduce((acc, cur) => acc + cur.success, 0)

      if (totalEncrypted > 0 && typeof window.narn === 'function') {
        const isDev = import.meta.env.DEV
        const currentSignature = `${window.location.pathname}:${totalSuccess}/${totalEncrypted}`

        if (forceNotice || currentSignature !== lastNoticeSignature) {
          lastNoticeSignature = currentSignature

          if (totalSuccess === totalEncrypted) {
            if (isDev) {
              window.narn(
                'success',
                `发现 ${totalEncrypted} 处保密条目，本地明文已就绪 (${totalSuccess}/${totalEncrypted})`,
                1500,
                '本地开发',
              )
            } else {
              window.narn(
                'success',
                `网页解密成功，进度: ${totalSuccess}/${totalEncrypted}`,
                1200,
                '解密完成',
              )
            }
          } else {
            window.narn(
              'warn',
              `网页部分解密，进度: ${totalSuccess}/${totalEncrypted} (尚有 ${totalEncrypted - totalSuccess} 处未解锁)`,
              1500,
              '解密提示',
            )
          }
        }
      }

      const pageIdEl = document.getElementById('page_id') as HTMLElement | null
      const pageId = pageIdEl?.innerHTML ?? ''
      initPage(pageId)
    } finally {
      isDecrypting = false
    }
  }, 100)
}

if (typeof window !== 'undefined') {
  window.encrypt = encrypt
  window.decrypt = decrypt
  window.initGPG = tryDecrypt
  window.tryDecrypt = tryDecrypt
  window.confirmGPG = confirmGPG
  window.confirmCrypt = confirmGPG
}