function e(e){if(e.nodeType!==Node.ELEMENT_NODE)return!1;let t=e;return!!(t.matches?.(`.no-copy, .no-print, [data-copy-ignore="true"], [data-copy-ignore], .article-actions, .post-sidebar, .series-nav, .ai-whole-banner, .ai-blocked-card, .code-toolbar, .code-actions, .code-gutter, .code-copy-btn, .code-run-btn, .code-expand-btn, .vimg-skeleton, .vimg-spinner, blog-bg, script, style`)||t.closest?.(`[data-copy-ignore="true"]`))}function t(e,t={}){let r=``;for(let i of Array.from(e.childNodes))r+=n(i,t);return r}function n(n,r={}){if(e(n))return``;if(n.nodeType===Node.TEXT_NODE)return n.textContent??``;if(n.nodeType!==Node.ELEMENT_NODE)return``;let i=n;if(typeof i._toMarkdown==`function`){let e=i._toMarkdown(r);if(e!=null)return`\n\n${e.trim()}\n\n`}let a=i.tagName.toLowerCase();if(a===`blog-secret`)return i.classList.contains(`is-unlocked`)?t(i,r):i.dataset.fallback!==void 0&&i.dataset.fallback===``?``:r.locale===`en`?`[Encrypted content]`:`[已加密内容]`;if(a===`nav`&&i.classList.contains(`table-of-contents`))return`

[[toc]]

`;if(i.classList.contains(`katex-display`)){let e=i.querySelector(`annotation[encoding="application/x-tex"]`)?.textContent?.trim();if(e)return`\n\n$$\n${e}\n$$\n\n`}if(i.classList.contains(`katex`)){let e=i.querySelector(`annotation[encoding="application/x-tex"]`)?.textContent?.trim();if(e)return`$${e}$`}if(i.classList.contains(`mermaid-card`)){let e=i.dataset.mermaidSrc??i.querySelector(`.mermaid-src`)?.textContent?.trim();return e?`\n\n\`\`\`mermaid\n${e.trim()}\n\`\`\`\n\n`:r.locale===`en`?`

*[Mermaid Diagram]*

`:`

*[Mermaid 图表]*

`}if(a===`pre`){let e=i.querySelector(`code`)??i,t=e.className.match(/language-([a-zA-Z0-9_+-]+)/);return`\n\n\`\`\`${t?t[1]:i.dataset.language??``}\n${(e.textContent??``).replace(/\n+$/,``)}\n\`\`\`\n\n`}if(a===`br`)return`
`;if(a===`hr`)return`

---

`;let o=a.match(/^h([1-6])$/);if(o){let e=t(i,r).trim();return e?`\n\n${`#`.repeat(Number(o[1]))} ${e}\n\n`:``}if(a===`p`){let e=t(i,r).trim();return e?`\n\n${e}\n\n`:``}if(a===`blockquote`){let e=t(i,r).trim();return e?`\n\n${e.split(`
`).map(e=>`> ${e}`).join(`
`)}\n\n`:``}if(a===`ul`||a===`ol`){let e=Array.from(i.children).filter(e=>e.tagName.toLowerCase()===`li`).map((e,n)=>`${a===`ol`?`${n+1}. `:`- `}${t(e,r).trim().replace(/\n+/g,`
  `)}`);return e.length?`\n\n${e.join(`
`)}\n\n`:``}if(a===`table`){let e=Array.from(i.querySelectorAll(`tr`)).map(e=>Array.from(e.children).map(e=>t(e,r).trim().replace(/\n+/g,` `)));if(e.length===0)return``;let n=[`| ${e[0].join(` | `)} |`,`| ${e[0].map(()=>`---`).join(` | `)} |`];for(let t=1;t<e.length;t++)n.push(`| ${e[t].join(` | `)} |`);return`\n\n${n.join(`
`)}\n\n`}if(a===`blog-img`||a===`img`){let e=i.dataset.src??i.getAttribute(`data-src`)??i.getAttribute(`src`)??``,t=i.getAttribute(`alt`)??i.dataset.alt??``;return e?`![${t}](${e})`:``}if(a===`a`){let e=i.getAttribute(`href`)??``,n=t(i,r).trim();return e?n?`[${n}](${e})`:e:n}if(a===`code`){let e=i.textContent??``;return e.includes("`")?`\`\` ${e} \`\``:`\`${e}\``}if(a===`strong`||a===`b`){let e=t(i,r).trim();return e?`**${e}**`:``}if(a===`em`||a===`i`){let e=t(i,r).trim();return e?`*${e}*`:``}if(a===`del`||a===`s`){let e=t(i,r).trim();return e?`~~${e}~~`:``}return t(i,r)}function r(e,n={}){let r=e??document.querySelector(`.post-article`);if(!r)return``;let i=r.querySelector(`.post-title`)?.textContent?.trim()??``,a=r.querySelector(`.ai-whole-banner`),o=``;if(a){let e=a.querySelector(`.ai-whole-title`)?.textContent?.trim()??``,t=a.querySelector(`.ai-whole-model`)?.textContent?.trim()??``,r=a.querySelector(`.ai-whole-desc`)?.textContent?.trim()??``,i=[];if(e){let r=t?n.locale===`en`?`> **${e}** (*${t}*)`:`> **${e}**（*${t}*）`:`> **${e}**`;i.push(r)}r&&i.push(`> ${r}`),o=i.join(`
`)}let s=r.querySelector(`.prose`);if(!s){let e=[i?`# ${i}`:``,o].filter(Boolean);return e.length?`${e.join(`

`)}\n`:``}let c=t(s,n).replace(/[ \t]+\n/g,`
`).replace(/\n{3,}/g,`

`).trim(),l=[i?`# ${i}`:``,o,c].filter(Boolean);return l.length?`${l.join(`

`)}\n`:``}export{t as n,r as t};