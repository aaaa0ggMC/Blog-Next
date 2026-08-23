<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vitepress';

const isCopied = ref(false);
const router = useRouter();

// 获取页面所有文字内容（纯文本，保留换行）
const getPageText = () => {
  const mainContent = document.querySelector('.vp-doc') || 
                     document.querySelector('main') || 
                     document.querySelector('.content');
  
  if (!mainContent) {
    console.warn('未找到页面内容区域');
    return '';
  }
  
  const clone = mainContent.cloneNode(true);
  
  const removeSelectors = [
    '.copy-code-button',
    '.line-number',
    'button[aria-label]',
    '.VPBadge',
    '.header-anchor',
    '.edit-link',
    '.last-updated'
  ];
  
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // 处理换行符 <br> -> \n
  const breaks = clone.querySelectorAll('br');
  breaks.forEach(br => {
    const newline = document.createTextNode('\n');
    br.parentNode?.replaceChild(newline, br);
  });
  
  // 处理块级元素
  const blockElements = ['p', 'div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                         'li', 'pre', 'blockquote', 'figure', 'figcaption', 'table', 'tr', 'th', 'td'];
  
  blockElements.forEach(tag => {
    const elements = clone.querySelectorAll(tag);
    elements.forEach(el => {
      const text = el.textContent?.trim();
      if (text) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `\n${el.innerHTML}\n`;
        el.parentNode?.replaceChild(wrapper, el);
      }
    });
  });
  
  // 处理列表项
  const listItems = clone.querySelectorAll('li');
  listItems.forEach(li => {
    const text = li.textContent?.trim();
    if (text) {
      const parent = li.parentElement;
      let prefix = '- ';
      if (parent && parent.tagName === 'OL') {
        const index = Array.from(parent.children).indexOf(li) + 1;
        prefix = `${index}. `;
      }
      li.textContent = `${prefix}${text}\n`;
    }
  });
  
  // 处理代码块
  const codeBlocks = clone.querySelectorAll('pre');
  codeBlocks.forEach(pre => {
    const code = pre.querySelector('code');
    const codeText = code?.textContent || pre.textContent || '';
    const wrapper = document.createElement('div');
    wrapper.textContent = `\n${codeText}\n`;
    pre.parentNode?.replaceChild(wrapper, pre);
  });
  
  // 处理表格
  const tables = clone.querySelectorAll('table');
  tables.forEach(table => {
    let tableText = '\n';
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('th, td');
      const rowText = Array.from(cells).map(cell => cell.textContent?.trim() || '').join('\t');
      tableText += rowText + '\n';
      if (rowIndex === 0 && rows.length > 1) {
        tableText += Array(cells.length).fill('---').join('\t') + '\n';
      }
    });
    tableText += '\n';
    const wrapper = document.createElement('div');
    wrapper.textContent = tableText;
    table.parentNode?.replaceChild(wrapper, table);
  });
  
  // 处理标题
  const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    const text = heading.textContent?.trim();
    if (text) {
      heading.textContent = `\n${text}\n`;
    }
  });
  
  // 处理段落
  const paragraphs = clone.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = p.textContent?.trim();
    if (text) {
      p.textContent = `${text}\n\n`;
    }
  });
  
  let text = clone.innerText || clone.textContent || '';
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/^\n+/, '');
  text = text.replace(/\n+$/, '');
  
  return text;
};

// 获取带格式的 Markdown 风格文本
const getFormattedText = () => {
  const content = document.querySelector('.vp-doc');
  if (!content) return getPageText();
  
  const clone = content.cloneNode(true);
  
  // 移除不需要的元素
  const removeSelectors = ['.copy-code-button', '.line-number', '.header-anchor'];
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  let formattedText = '';
  
  // 递归处理节点，保留格式
  const processNode = (node, level = 0, inParagraph = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent || '';
      // 保留文本中的换行符（由 <br> 产生）
      if (text.includes('\n')) {
        // 将文本中的换行转换为 Markdown 换行（两个空格 + 换行）
        text = text.replace(/\n/g, '  \n');
      }
      return text;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    
    const tagName = node.tagName.toLowerCase();
    let result = '';
    
    // 处理标题
    if (tagName.match(/^h[1-6]$/)) {
      const level = parseInt(tagName[1]);
      const prefix = '#'.repeat(level) + ' ';
      // 递归处理子节点，但不在标题内部保留换行
      let title = '';
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          title += child.textContent || '';
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // 处理标题内的内联元素
          const childTag = child.tagName.toLowerCase();
          if (childTag === 'br') {
            title += ' '; // 标题内的 br 当作空格
          } else if (childTag === 'code') {
            title += `\`${child.textContent}\``;
          } else if (childTag === 'strong' || childTag === 'b') {
            title += `**${child.textContent}**`;
          } else if (childTag === 'em' || childTag === 'i') {
            title += `*${child.textContent}*`;
          } else {
            title += child.textContent || '';
          }
        }
      }
      result = `\n${prefix}${title.trim()}\n\n`;
    }
    // 处理段落
    else if (tagName === 'p') {
      // 递归处理段落内的子节点
      let paragraph = '';
      for (const child of node.childNodes) {
        paragraph += processNode(child, level, true);
      }
      if (paragraph.trim()) {
        result = `${paragraph.trim()}\n\n`;
      }
    }
    // 处理 <br> 标签 - Markdown 中使用两个空格 + 换行
    else if (tagName === 'br') {
      result = '  \n';
    }
    // 处理代码块
    else if (tagName === 'pre') {
      const code = node.querySelector('code');
      const language = code?.className.match(/language-(\w+)/)?.[1] || '';
      const codeText = code?.textContent || node.textContent || '';
      result = `\n\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;
    }
    // 处理行内代码
    else if (tagName === 'code') {
      const text = node.textContent || '';
      result = `\`${text}\``;
    }
    // 处理强调
    else if (tagName === 'strong' || tagName === 'b') {
      const text = node.textContent || '';
      result = `**${text}**`;
    }
    else if (tagName === 'em' || tagName === 'i') {
      const text = node.textContent || '';
      result = `*${text}*`;
    }
    // 处理链接
    else if (tagName === 'a') {
      const href = node.getAttribute('href');
      const text = node.textContent || '';
      if (href && !href.startsWith('#')) {
        result = `[${text}](${href})`;
      } else {
        result = text;
      }
    }
    // 处理列表项
    else if (tagName === 'li') {
      // 递归处理列表项内的内容
      let itemContent = '';
      for (const child of node.childNodes) {
        itemContent += processNode(child, level + 1, false);
      }
      const parent = node.parentElement;
      let prefix = '';
      if (parent && parent.tagName === 'UL') {
        prefix = '  '.repeat(level) + '- ';
      } else if (parent && parent.tagName === 'OL') {
        const index = Array.from(parent.children).indexOf(node) + 1;
        prefix = '  '.repeat(level) + `${index}. `;
      }
      // 处理列表项内的换行
      itemContent = itemContent.replace(/\n/g, '\n  ');
      result = `${prefix}${itemContent.trim()}\n`;
    }
    // 处理无序列表容器
    else if (tagName === 'ul') {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'LI') {
          result += processNode(child, level);
        }
      }
      result += '\n';
    }
    // 处理有序列表容器
    else if (tagName === 'ol') {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'LI') {
          result += processNode(child, level);
        }
      }
      result += '\n';
    }
    // 处理引用块
    else if (tagName === 'blockquote') {
      let quoteContent = '';
      for (const child of node.childNodes) {
        quoteContent += processNode(child, level, false);
      }
      const lines = quoteContent.split('\n');
      result = lines.map(line => '> ' + line).join('\n') + '\n\n';
    }
    // 处理水平分割线
    else if (tagName === 'hr') {
      result = '\n---\n\n';
    }
    // 处理图片
    else if (tagName === 'img') {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      result = `![${alt}](${src})`;
    }
    // 处理表格
    else if (tagName === 'table') {
      const rows = node.querySelectorAll('tr');
      let tableResult = '\n';
      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('th, td');
        const rowText = Array.from(cells).map(cell => {
          // 处理单元格内的换行
          let cellText = '';
          for (const child of cell.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
              cellText += child.textContent || '';
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              if (child.tagName === 'BR') {
                cellText += '  \n'; // 表格内的换行也用 Markdown 语法
              } else {
                cellText += child.textContent || '';
              }
            }
          }
          cellText = cellText.trim();
          if (cell.tagName === 'TH') {
            return `**${cellText}**`;
          }
          return cellText;
        }).join(' | ');
        tableResult += `| ${rowText} |\n`;
        if (rowIndex === 0 && rows.length > 1) {
          const separators = Array(cells.length).fill('---');
          tableResult += `| ${separators.join(' | ')} |\n`;
        }
      });
      tableResult += '\n';
      result = tableResult;
    }
    // 处理 div 和 span
    else if (tagName === 'div' || tagName === 'span') {
      for (const child of node.childNodes) {
        result += processNode(child, level, inParagraph);
      }
      // div 后添加换行
      if (tagName === 'div' && result.trim() && !inParagraph) {
        result += '\n';
      }
    }
    // 其他元素，递归处理子节点
    else {
      for (const child of node.childNodes) {
        result += processNode(child, level, inParagraph);
      }
    }
    
    return result;
  };
  
  formattedText = processNode(clone);
  
  // 清理格式
  formattedText = formattedText.replace(/\n{4,}/g, '\n\n\n');
  formattedText = formattedText.replace(/[ \t]+$/gm, '');
  formattedText = formattedText.replace(/  \n\n/g, '\n\n'); // 清理多余的换行
  formattedText = formattedText.trim();
  
  return formattedText;
};

// 复制到剪贴板
const copiedFormat = ref<'plain' | 'formatted' | null>(null);
let copyTimer: number | null = null;

const copyToClipboard = async (format: 'plain' | 'formatted' = 'plain') => {
  try {
    let textToCopy = '';
    
    if (format === 'plain') {
      textToCopy = getPageText();
    } else {
      textToCopy = getFormattedText();
    }
    
    if (!textToCopy) {
      console.error('未找到页面内容');
      return;
    }
    
    await navigator.clipboard.writeText(textToCopy);
    
    isCopied.value = true;
    copiedFormat.value = format;
    
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      isCopied.value = false;
      copiedFormat.value = null;
      copyTimer = null;
    }, 1800);
    
  } catch (err) {
    console.error('复制失败:', err);
  }
};

// 监听路由变化
const handleRouteChange = () => {
  isCopied.value = false;
  copiedFormat.value = null;
  if (copyTimer) {
    clearTimeout(copyTimer);
    copyTimer = null;
  }
};

onMounted(() => {
  if (router.onBeforeRouteChange) {
    router.onBeforeRouteChange = () => {
      handleRouteChange();
    };
  }
  
  window.addEventListener('popstate', handleRouteChange);
});

onUnmounted(() => {
  window.removeEventListener('popstate', handleRouteChange);
  if (copyTimer) {
    clearTimeout(copyTimer);
    copyTimer = null;
  }
});
</script>

<template>
  <div class="copy-page-button">
    <div class="copy-group" :class="{ 'is-copied': isCopied }">
      <!-- 复制纯文本主按钮 -->
      <button 
        class="action-btn main-btn" 
        @click="copyToClipboard('plain')"
        :class="{ copied: isCopied && copiedFormat === 'plain' }"
        :title="isCopied && copiedFormat === 'plain' ? '已复制纯文本' : '复制页面纯文本'"
        aria-label="复制页面纯文本"
      >
        <span class="icon-wrap">
          <svg v-if="!isCopied || copiedFormat !== 'plain'" class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg v-else class="icon-svg check-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="btn-label">{{ isCopied && copiedFormat === 'plain' ? '已复制' : '复制页面' }}</span>
      </button>

      <span class="btn-divider" aria-hidden="true"></span>

      <!-- 复制 Markdown 按钮 -->
      <button 
        class="action-btn format-btn" 
        @click="copyToClipboard('formatted')"
        :class="{ copied: isCopied && copiedFormat === 'formatted' }"
        :title="isCopied && copiedFormat === 'formatted' ? '已复制 Markdown 格式' : '复制为 Markdown 格式'"
        aria-label="复制为 Markdown"
      >
        <span class="icon-wrap">
          <svg v-if="!isCopied || copiedFormat !== 'formatted'" class="icon-svg md-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/>
            <path d="M3 12V6h1.5l1.5 2 1.5-2H9v6H7.5V8.5L6 10.5 4.5 8.5V12H3zm8.5-4.5h1V10h1.5l-2 2-2-2h1.5V7.5z"/>
          </svg>
          <svg v-else class="icon-svg check-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="badge-text">{{ isCopied && copiedFormat === 'formatted' ? '已复制 MD' : 'MD' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.copy-page-button {
  display: inline-flex;
  user-select: none;
}

.copy-group {
  display: inline-flex;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease;
}

.copy-group:hover {
  border-color: var(--vp-c-brand-soft, var(--vp-c-brand));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.copy-group.is-copied {
  border-color: var(--vp-c-green-2, #30a46c);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.action-btn:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-mute);
}

.action-btn:active {
  transform: scale(0.97);
}

.action-btn.copied {
  color: var(--vp-c-green-1, #10b981);
  background-color: var(--vp-c-green-soft, rgba(48, 164, 108, 0.12));
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-svg {
  display: block;
  transition: transform 0.2s ease;
}

.check-icon {
  color: var(--vp-c-green-1, #10b981);
  animation: check-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-pop {
  0% {
    transform: scale(0.5) rotate(-15deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

.btn-divider {
  width: 1px;
  height: 14px;
  background-color: var(--vp-c-divider);
  margin: 0 1px;
}

.badge-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

@media (max-width: 640px) {
  .main-btn .btn-label {
    display: none;
  }
  .action-btn {
    padding: 4px 8px;
  }
}
</style>
