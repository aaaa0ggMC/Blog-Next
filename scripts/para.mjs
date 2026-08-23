#!/usr/bin/env node
import fs from 'node:fs';
import readline from 'node:readline';
import { execSync, spawn } from 'node:child_process';

/**
 * 快速标签包裹工具 (para)
 * 核心逻辑：输入每一行内容 -> 逐行包裹为:
 *   <np>
 *   行内容
 *   </np>
 */

function printHelp() {
  console.log(`
🏷️  \x1b[32m[para]\x1b[0m 快速打标签 / 段落包裹工具

\x1b[36m默认规则:\x1b[0m
  逐行读取输入 -> 一行生成一个:
  <np>
  行内容
  </np>

\x1b[36m用法:\x1b[0m
  pnpm para [选项] [文本...]
  node scripts/para.mjs [选项] [文本...]

\x1b[36m输入模式:\x1b[0m
  1. 交互模式: 直接运行 pnpm para，粘贴多行文本后输入 \x1b[33mBYEBYE\x1b[0m 或按 \x1b[33mCtrl+D\x1b[0m 结束
  2. 管道输入: cat raw.txt | pnpm para
  3. 传参输入: pnpm para "第一行" "第二行"
  4. 文件处理: pnpm para -f docs/notes/draft.md -i

\x1b[36m选项:\x1b[0m
  -t, --tag <tag>     指定包裹标签，默认: np
                      常用内置:
                        np          -> <np>\\n...\\n</np>
                        ps          -> <p class="ps">\\n...\\n</p>
                        ins         -> <p class="ins">\\n...\\n</p>
                        hl          -> <p class="hl">\\n...\\n</p>
                        leave       -> <p class="leave">\\n...\\n</p>
                        :::np / :::ps -> ::: np\\n...\\n::: (容器语法)
  -f, --file <file>   读取指定文件内容
  -i, --inplace       与 -f 配合，直接就地修改原文件
  -o, --output <file> 将处理结果输出到指定文件
  --no-copy           处理完成后不自动复制到系统剪贴板
  -h, --help          显示此帮助信息
`);
}

function copyToClipboard(text) {
  const tools = [
    { cmd: 'wl-copy', args: [] },
    { cmd: 'xclip', args: ['-selection', 'clipboard'] },
    { cmd: 'xsel', args: ['--clipboard', '--input'] },
    { cmd: 'pbcopy', args: [] },
    { cmd: 'clip.exe', args: [] },
  ];

  for (const tool of tools) {
    try {
      execSync(`which ${tool.cmd}`, { stdio: 'ignore' });
      const child = spawn(tool.cmd, tool.args, { stdio: ['pipe', 'ignore', 'ignore'] });
      child.stdin.write(text);
      child.stdin.end();
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

function formatLine(line, tagType = 'np') {
  const trimmed = line.trim();
  if (!trimmed) return '';

  const t = tagType.toLowerCase();

  if (t === 'np') {
    return `<np>\n${trimmed}\n</np>`;
  }
  if (t === 'ps') {
    return `<p class="ps">\n${trimmed}\n</p>`;
  }
  if (t === 'ins') {
    return `<p class="ins">\n${trimmed}\n</p>`;
  }
  if (t === 'hl') {
    return `<p class="hl">\n${trimmed}\n</p>`;
  }
  if (t === 'leave') {
    return `<p class="leave">\n${trimmed}\n</p>`;
  }
  if (t === 'ec' || t === 'encrypt') {
    return `<span class="encrypt">\n${trimmed}\n</span>`;
  }
  if (t === 'ecp' || t === 'e+') {
    return `<span class="e+">\n${trimmed}\n</span>`;
  }
  if (t === 'tc' || t === 'eteacher') {
    return `<span class="eteacher">\n${trimmed}\n</span>`;
  }
  if (tagType.startsWith(':::') || t.startsWith('container-')) {
    const cName = tagType.replace(/^:::|\bcontainer-/g, '').trim() || 'np';
    return `::: ${cName}\n${trimmed}\n:::`;
  }
  if (tagType.startsWith('<') && tagType.endsWith('>')) {
    const tagName = tagType.match(/^<([a-zA-Z0-9_\-]+)/)?.[1] || 'div';
    return `${tagType}\n${trimmed}\n</${tagName}>`;
  }
  if (tagType.includes(' ') || tagType.includes('=')) {
    const tagName = tagType.split(/\s+/)[0];
    return `<${tagType}>\n${trimmed}\n</${tagName}>`;
  }

  return `<${tagType}>\n${trimmed}\n</${tagType}>`;
}

function processLines(lines, tag) {
  const formattedList = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    formattedList.push(formatLine(line, tag));
  }
  const result = formattedList.join('\n\n') + (formattedList.length > 0 ? '\n' : '');
  return { result, count: formattedList.length };
}

async function main() {
  const args = process.argv.slice(2);

  let tag = 'np';
  let inputFile = null;
  let outputFile = null;
  let inplace = false;
  let noCopy = false;
  const positionalArgs = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      return;
    }
    if (arg === '-t' || arg === '--tag') {
      tag = args[++i] || 'np';
    } else if (arg.startsWith('--tag=')) {
      tag = arg.slice(6);
    } else if (arg === '-f' || arg === '--file') {
      inputFile = args[++i];
    } else if (arg.startsWith('--file=')) {
      inputFile = arg.slice(7);
    } else if (arg === '-o' || arg === '--output') {
      outputFile = args[++i];
    } else if (arg.startsWith('--output=')) {
      outputFile = arg.slice(9);
    } else if (arg === '-i' || arg === '--inplace') {
      inplace = true;
    } else if (arg === '--no-copy') {
      noCopy = true;
    } else if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
    }
  }

  // 1. 处理文件输入
  if (inputFile) {
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ 文件未找到: ${inputFile}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(inputFile, 'utf-8');
    const lines = raw.split(/\r?\n/);
    const { result, count } = processLines(lines, tag);

    if (inplace) {
      fs.writeFileSync(inputFile, result, 'utf-8');
      console.log(`✅ [完成] 已就地修改 ${inputFile} (共包裹 ${count} 行)`);
    } else if (outputFile) {
      fs.writeFileSync(outputFile, result, 'utf-8');
      console.log(`✅ [完成] 已将处理结果保存至 ${outputFile} (共包裹 ${count} 行)`);
    } else {
      console.log(result);
      if (!noCopy) {
        if (copyToClipboard(result.trimEnd())) {
          console.error(`\n📋 [剪贴板] 已自动复制 ${count} 行至系统剪贴板！`);
        }
      }
    }
    return;
  }

  // 2. 处理直接传参
  if (positionalArgs.length > 0) {
    const { result, count } = processLines(positionalArgs, tag);
    console.log(result);
    if (!noCopy) {
      if (copyToClipboard(result.trimEnd())) {
        console.error(`📋 [剪贴板] 已自动复制 ${count} 行至系统剪贴板！`);
      }
    }
    return;
  }

  // 3. 处理管道非 TTY 输入
  if (!process.stdin.isTTY) {
    let pipedText = '';
    for await (const chunk of process.stdin) {
      pipedText += chunk;
    }
    const lines = pipedText.split(/\r?\n/);
    const { result, count } = processLines(lines, tag);

    if (outputFile) {
      fs.writeFileSync(outputFile, result, 'utf-8');
      console.error(`✅ 已输出至 ${outputFile} (共 ${count} 行)`);
    } else {
      process.stdout.write(result);
      if (!noCopy) {
        copyToClipboard(result.trimEnd());
      }
    }
    return;
  }

  // 4. 交互式输入模式
  console.log('\x1b[32m🏷️  [para] 快速打标签工具 (交互模式)\x1b[0m');
  console.log(`📌 当前包裹标签: \x1b[36m<${tag}>\x1b[0m  |  模式: \x1b[36m一行一个 <${tag}>...\x1b[0m`);
  console.log('💡 请粘贴或输入文本内容，输入 \x1b[33mBYEBYE\x1b[0m、\x1b[33mEOF\x1b[0m、\x1b[33m:q\x1b[0m 或按 \x1b[33mCtrl+D\x1b[0m 结束输入:\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const datas = [];

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (trimmed === 'BYEBYE' || trimmed === 'EOF' || trimmed === ':q') {
      rl.close();
      return;
    }
    datas.push(line);
  });

  rl.on('close', () => {
    const { result, count } = processLines(datas, tag);

    if (count === 0) {
      console.log('\n⚠️  输入为空，未生成任何内容。');
      return;
    }

    console.log('\n------------------------------------------\n');
    process.stdout.write(result);
    console.log('------------------------------------------');

    if (outputFile) {
      fs.writeFileSync(outputFile, result, 'utf-8');
      console.log(`💾 已保存至文件: ${outputFile}`);
    }

    if (!noCopy) {
      const copied = copyToClipboard(result.trimEnd());
      if (copied) {
        console.log(`\n📋 ✨ \x1b[32m已自动复制 ${count} 行至系统剪贴板，可直接 Ctrl+V 粘贴！\x1b[0m\n`);
      }
    }
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
