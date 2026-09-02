import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'aaaa0ggmc Blog',
  description: 'My personal blog powered by VitePress',
  themeConfig: {
    lastUpdated: true
  },
  vite: {
    server: {
      allowedHosts: ['pc.yslwd.eu.org']
    }
  }
})
