import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decryptBase64, encryptBase64, isBase64Cipher, parseEnvFile } from './crypto-shared.mjs';
import { encryptPath, decryptPath, isPathEncrypted, getPathSecret } from './path-crypto.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.resolve(projectRoot, 'docs');

export function loadEnvKeys() {
  const localEnv = parseEnvFile(path.join(projectRoot, '.env.local'));
  const rootEnv = parseEnvFile(path.join(projectRoot, '.env'));

  const pathSecret =
    process.env.R2_PATH_SECRET ||
    localEnv.R2_PATH_SECRET ||
    rootEnv.R2_PATH_SECRET ||
    process.env.R2_API_TOKEN ||
    localEnv.R2_API_TOKEN ||
    rootEnv.R2_API_TOKEN ||
    '';

  const articleKeys = [
    process.env.BLOG_GPG_KEY || localEnv.BLOG_GPG_KEY || rootEnv.BLOG_GPG_KEY,
    process.env.BLOG_SEC_KEY || localEnv.BLOG_SEC_KEY || rootEnv.BLOG_SEC_KEY,
    process.env.BLOG_TEACHER_KEY || localEnv.BLOG_TEACHER_KEY || rootEnv.BLOG_TEACHER_KEY,
  ].filter(Boolean);

  if (!pathSecret) {
    throw new Error('❌ 未找到 R2_PATH_SECRET，请在 .env.local 中配置！');
  }

  return { pathSecret, articleKeys };
}

/**
 * Transform all content="..." attributes in a markdown string
 * @param {string} content - Markdown content
 * @param {'encrypt'|'decrypt'} action
 * @param {{ pathSecret: string, articleKeys: string[], fileId?: string }} options
 */
export async function transformMarkdownPaths(content, action, { pathSecret, articleKeys, fileId = 'markdown' }) {
  const regex = /(<\w+[^>]*?\bcontent=["'])([^"']+)(["'][^>]*?>)/gi;
  let matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push({ full: match[0], prefix: match[1], val: match[2], suffix: match[3], index: match.index });
  }

  if (matches.length === 0) {
    return { newContent: content, modified: false, count: 0 };
  }

  let result = '';
  let lastIndex = 0;
  let count = 0;

  for (const m of matches) {
    result += content.slice(lastIndex, m.index);
    let newVal = m.val;

    const isNoMangleProp = /\b(no-mangle|no_mangle|raw)\b/i.test(m.full);
    const isAtPrefix = newVal.startsWith('@/');

    if (isNoMangleProp || isAtPrefix) {
      if (isAtPrefix) {
        newVal = '/' + newVal.slice(2);
      }
      // 裸传模式：保持原样路径，不进行任何哈希混淆/加密
    } else if (newVal.startsWith('/') && !newVal.startsWith('/res/') && !newVal.startsWith('~') && !newVal.startsWith('http')) {
      // Direct relative resource path
      const encrypted = isPathEncrypted(newVal, pathSecret);
      if (action === 'encrypt') {
        if (!encrypted) {
          newVal = '/' + encryptPath(newVal, pathSecret);
          count++;
        }
      } else if (action === 'decrypt') {
        if (encrypted) {
          newVal = decryptPath(newVal, pathSecret);
          count++;
        }
      }
    } else if (isBase64Cipher(newVal)) {
      // Encrypted article cipher
      let decrypted = null;
      let matchedKey = null;

      for (const k of articleKeys) {
        const res = await decryptBase64(newVal, k);
        if (res.success) {
          decrypted = res.plaintext;
          matchedKey = k;
          break;
        }
      }

      if (!decrypted) {
        throw new Error(
          `❌ [Security] 在 ${fileId} 中检测到加密密文，但未找到匹配的文章密钥（BLOG_GPG_KEY / BLOG_SEC_KEY / BLOG_TEACHER_KEY）！`
        );
      }

      if (decrypted.startsWith('@/')) {
        newVal = await encryptBase64('/' + decrypted.slice(2), matchedKey);
      } else if (decrypted.startsWith('/') && !decrypted.startsWith('/res/') && !decrypted.startsWith('~') && !decrypted.startsWith('http')) {
        const encrypted = isPathEncrypted(decrypted, pathSecret);
        if (action === 'encrypt') {
          if (!encrypted) {
            const encPlain = '/' + encryptPath(decrypted, pathSecret);
            newVal = await encryptBase64(encPlain, matchedKey);
            count++;
          }
        } else if (action === 'decrypt') {
          if (encrypted) {
            const decPlain = decryptPath(decrypted, pathSecret);
            newVal = await encryptBase64(decPlain, matchedKey);
            count++;
          }
        }
      }
    }

    result += m.prefix + newVal + m.suffix;
    lastIndex = m.index + m.full.length;
  }

  result += content.slice(lastIndex);
  return { newContent: result, modified: result !== content, count };
}

function scanMarkdownFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of list) {
    if (['node_modules', '.git', '.vitepress', 'public', 'cache', 'dist'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...scanMarkdownFiles(full));
    } else if (item.isFile() && item.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

export async function processAllMarkdown(action = 'encrypt') {
  const { pathSecret, articleKeys } = loadEnvKeys();
  const files = scanMarkdownFiles(docsDir);

  const actionName = action === 'encrypt' ? '🔒 加密 (混淆为 R2 Key)' : '🔓 解密 (还原为本地明文路径)';
  console.log(`\n======================================================`);
  console.log(`🚀 执行全库 Markdown 路径转换 -> ${actionName}`);
  console.log(`📁 扫描目录: docs/ (共 ${files.length} 个 Markdown 文件)`);
  console.log(`======================================================\n`);

  let modifiedFiles = 0;
  let totalItems = 0;

  for (const file of files) {
    const rel = path.relative(projectRoot, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');

    try {
      const { newContent, modified, count } = await transformMarkdownPaths(content, action, {
        pathSecret,
        articleKeys,
        fileId: rel,
      });

      if (modified) {
        fs.writeFileSync(file, newContent, 'utf-8');
        modifiedFiles++;
        totalItems += count;
        console.log(`✔️ [${action === 'encrypt' ? '已加密' : '已还原'}] ${rel} (${count} 处路径)`);
      }
    } catch (err) {
      console.error(`\n❌ 处理文件失败 [${rel}]:`, err.message);
      process.exit(1);
    }
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`🎉 转换完成！修改了 ${modifiedFiles} 个文件，共 ${action === 'encrypt' ? '加密' : '还原'} ${totalItems} 处路径。`);
  console.log(`------------------------------------------------------\n`);
}

// CLI handler
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const arg = process.argv[2] || 'encrypt';
  const action = arg.startsWith('dec') ? 'decrypt' : 'encrypt';
  processAllMarkdown(action).catch((err) => {
    console.error('❌ 执行失败:', err);
    process.exit(1);
  });
}
