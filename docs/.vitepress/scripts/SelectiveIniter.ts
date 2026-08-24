import { base, cdn_base } from './Data'

function getAssetPrefix(): string {
  if (typeof localStorage === 'undefined') {
    return cdn_base
  }
  if (localStorage.getItem('useLocal') === 'true') {
    return base + 'res'
  }
  const userDef = localStorage.getItem('userDef')?.trim()
  if (userDef) {
    return userDef.endsWith('/') ? userDef.slice(0, -1) : userDef
  }
  return cdn_base
}

export function initPage(pageId: string): void {
  switch (pageId) {
    case 'home':
      console.log('Init home page.')
      if (localStorage.getItem('inited') == null || localStorage.getItem('inited') === 'false') {
        window.narn('log', '第一次进入网站？点我进行基础设置！', 'keep', 'Welcome!', () => {
          window.open('settings', '_self')
        })
        localStorage.setItem('inited', 'true')
      }
      break

    case 'debug.enc':
      if (localStorage.getItem('debug_key')) {
        const ipt = document.getElementById('db_key') as HTMLInputElement | null
        if (ipt) ipt.value = localStorage.getItem('debug_key')!
      }
      break

    case 'settings':
      console.log('Init settings page.')
      const defaultSettings: Record<string, string> = {
        disAllowLog: 'false',
        disAllowWarn: 'false',
        disAllowSuc: 'false',
        disAllowErr: 'false',
        useLocal: 'false',
        enableParallax: 'true',
        showAi: 'true',
        failView: 'false',
      }

      for (const [key, defaultVal] of Object.entries(defaultSettings)) {
        if (localStorage.getItem(key) == null) {
          localStorage.setItem(key, defaultVal)
        }
      }

      const switchBindings: Array<{ id: string; key: string; positive: boolean }> = [
        { id: 'sw_log', key: 'disAllowLog', positive: false },
        { id: 'sw_war', key: 'disAllowWarn', positive: false },
        { id: 'sw_suc', key: 'disAllowSuc', positive: false },
        { id: 'sw_err', key: 'disAllowErr', positive: false },
        { id: 'sw_local', key: 'useLocal', positive: true },
        { id: 'sw_parallax', key: 'enableParallax', positive: true },
        { id: 'sw_ai', key: 'showAi', positive: true },
        { id: 'sw_fail_view', key: 'failView', positive: true },
      ]

      for (const { id, key, positive } of switchBindings) {
        const el = document.getElementById(id) as HTMLInputElement | null
        if (el) {
          const val = localStorage.getItem(key)
          el.checked = positive ? val !== 'false' && val !== null : val === 'false'
        }
      }
      break
  }

  const prefix = getAssetPrefix()

  const imgs = document.querySelectorAll<HTMLImageElement>('img:not([skipProc])')
  imgs.forEach((img) => {
    const tpathRaw = img.getAttribute('content')
    let tpath = (tpathRaw ?? '').trim() || img.src

    if (tpath.startsWith('~')) {
      tpath = base + tpath.substring(1)
    } else if (tpath.startsWith('@/')) {
      tpath = prefix + '/' + tpath.substring(2)
    } else if (tpath.startsWith('/')) {
      tpath = prefix + tpath
    }
    img.src = tpath
    img.classList.add('lazy-img')
    img.addEventListener(
      'load',
      () => {
        img.classList.add('loaded')
      },
      { once: true },
    )
  })
}