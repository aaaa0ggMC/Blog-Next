import { base } from './scripts/Data.ts';
import { autoSidebar } from './scripts/sidebar.ts';
import { registerMarkdownContainers } from './scripts/markdownContainers.ts';
import { vitepressResTransformPlugin } from './scripts/resTransformPlugin.ts';
import { generateRss } from './scripts/rss.ts';
import { defineConfig } from 'vitepress';

export default defineConfig({
  buildEnd: generateRss,
  vite: {
    plugins: [vitepressResTransformPlugin()],
    server: {
      allowedHosts: ['pc.yslwd.eu.org'],
    },
  },
  markdown: {
    math: true,
    lineNumbers: true,
    config(md) {
      registerMarkdownContainers(md);
    },
  },base,
  title: "aaaa0ggmc's blog",
  description:"记住生活 Forget me Not(勿忘我)",
  ignoreDeadLinks: true,
  cleanUrls: true,
  srcExclude: ['**/ENCRYPTION_GUIDE.md', '**/TODO'],

  head:[
    ["link",{rel:"icon",href:'/favicon.ico'}],
    ["link",{rel:"alternate",type:"application/rss+xml",title:"RSS Feed",href:'/feed.rss'}],
    ["link",{rel:"alternate",type:"application/atom+xml",title:"Atom Feed",href:'/feed.atom'}],
  ],

  themeConfig:{
    search: {
      provider: 'local'
    },
    nav:[
      {
        text: '博客',
        items: [
          { text: '随笔', link: '/writings' },
          { text: '随记', link: '/notes' },
          { text: '学习', link: '/keep_learning' },
          { text: '旅途', link: '/exploration' },
          { text: '游戏', link: '/gaming_life' },
        ]
      },
      { text: '归档', link: '/archives' },
      { text: '友链', link: '/friends' },
      { text: '杂项', link: '/others' },
      { text: '关于', link: '/about' },
      { text: '设置', link: '/settings' },
    ],
    sidebar: autoSidebar(),
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    outlineTitle: '目录',
    lastUpdatedText: '最后更新于',
    lastUpdated: true,
    docFooter:{
      prev:"上一篇",
      next:"下一篇",
    }
  }
});
