import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import { loadKeys, transformMarkdownContent, decryptBase64, parseEnvFile } from './crypto-shared.mjs';
import { loadEnvKeys, transformMarkdownPaths } from './repo-path-transform.mjs';
import { decryptPath, isPathEncrypted } from './path-crypto.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function fetchText(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null));
  });
}

export async function resumeRepo() {
  console.log(`\n======================================================`);
  console.log(`🚀 [ResumeRepo] 初始化/恢复本地开发环境 (dev 分支)`);
  console.log(`======================================================\n`);

  // 1. 检查或创建 dev 分支
  console.log(`🌿 [步骤 1/4] 检查并切换到 dev 分支...`);
  let remote = 'github';
  try {
    const remotes = execSync('git remote', { cwd: projectRoot }).toString().trim().split('\n');
    if (remotes.includes('github')) remote = 'github';
    else if (remotes.includes('origin')) remote = 'origin';
    else remote = remotes[0];
  } catch {}

  try {
    execSync(`git checkout -B dev`, { cwd: projectRoot, stdio: 'inherit' });
  } catch (err) {
    console.warn(`⚠️ 分支切换提示: ${err.message}`);
  }

  // 2. 检查 .env.local 密钥
  console.log(`\n🔑 [步骤 2/4] 校验加解密密钥...`);
  let keys, pathSecret, articleKeys;
  try {
    keys = await loadKeys({ interactive: false });
    const env = loadEnvKeys();
    pathSecret = env.pathSecret;
    articleKeys = env.articleKeys;
  } catch (err) {
    console.error(`\n❌ [密钥缺失] 无法完成解密还原: ${err.message}`);
    console.error(`👉 请先在项目根目录下创建 .env.local 并配置密钥，例如:`);
    console.error(`   BLOG_GPG_KEY=...`);
    console.error(`   BLOG_SEC_KEY=...`);
    console.error(`   BLOG_TEACHER_KEY=...`);
    console.error(`   R2_PATH_SECRET=...`);
    console.error(`   R2_API_TOKEN=...`);
    process.exit(1);
  }

  // 2.5 检查并还原本地 docs/public/res/ignore_files
  const ignoreFilePath = path.join(projectRoot, 'docs/public/res/ignore_files');
  if (!fs.existsSync(ignoreFilePath)) {
    console.log(`\n📥 [步骤 2.5/4] 从 R2 拉取并解密恢复 ignore_files...`);
    try {
      const localEnv = parseEnvFile(path.join(projectRoot, '.env.local'));
      const rootEnv = parseEnvFile(path.join(projectRoot, '.env'));
      const publicDomain =
        process.env.R2_PUBLIC_DOMAIN || localEnv.R2_PUBLIC_DOMAIN || rootEnv.R2_PUBLIC_DOMAIN || 'https://res.yslwd.eu.org';
      const url = `${publicDomain.replace(/\/+$/, '')}/ignore_files`;
      const cipherText = await fetchText(url);
      if (cipherText && cipherText.trim()) {
        const decrypted = await decryptBase64(cipherText.trim(), pathSecret);
        if (decrypted.success) {
          const resDir = path.dirname(ignoreFilePath);
          if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });
          fs.writeFileSync(ignoreFilePath, decrypted.plaintext, 'utf-8');
          console.log(`   ✅ 成功从 R2 解密还原 docs/public/res/ignore_files`);
        } else {
          console.warn(`   ⚠️ 解密 ignore_files 失败 (密钥可能不匹配)`);
        }
      } else {
        console.log(`   ℹ️ 远端 R2 暂无 ignore_files，已跳过。`);
      }
    } catch (err) {
      console.warn(`   ⚠️ 拉取 ignore_files 失败: ${err.message}`);
    }
  }

  // 3. 全库解密还原为人类可读明文
  console.log(`\n🔓 [步骤 3/4] 解密全库 Markdown 路径与隐私标签为明文...`);
  const docsDir = path.join(projectRoot, 'docs');
  function scanFiles(dir) {
    const list = [];
    if (!fs.existsSync(dir)) return list;
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (['node_modules', '.git', 'dist', 'cache', '.temp'].includes(f.name)) continue;
      if (f.isDirectory()) list.push(...scanFiles(full));
      else if (f.isFile() && f.name.endsWith('.md')) list.push(full);
    }
    return list;
  }

  const mdFiles = scanFiles(docsDir);
  let decryptedFiles = 0;
  let totalDecryptedItems = 0;

  for (const file of mdFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    const rel = path.relative(projectRoot, file).replace(/\\/g, '/');

    // 解密路径
    const stepPaths = await transformMarkdownPaths(content, 'decrypt', {
      pathSecret,
      articleKeys,
      fileId: rel,
    });
    if (stepPaths.modified) {
      content = stepPaths.newContent;
      modified = true;
      totalDecryptedItems += stepPaths.count;
    }

    // 解密隐私标签
    try {
      const stepContent = await transformMarkdownContent(content, {
        action: 'decrypt_base64',
        keys,
        requireKeys: false,
      });
      if (stepContent.modified) {
        content = stepContent.newContent;
        modified = true;
        totalDecryptedItems += stepContent.stats.processed;
      }
    } catch {}

    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      decryptedFiles++;
      console.log(`   ✔️ 已还原: ${rel}`);
    }
  }

  // 解密 homePeriods.ts
  const homePeriodsPath = path.join(docsDir, '.vitepress/theme/constants/homePeriods.ts');
  if (fs.existsSync(homePeriodsPath)) {
    let hpContent = fs.readFileSync(homePeriodsPath, 'utf-8');
    const hpRegex = /(['"]\/[A-Za-z0-9_-]{30,}\.(?:jpg|png|webp)['"])/g;
    let hpModified = false;
    hpContent = hpContent.replace(hpRegex, (match, p1) => {
      const quote = p1[0];
      const encPath = p1.slice(1, -1);
      if (isPathEncrypted(encPath, pathSecret)) {
        const plain = decryptPath(encPath, pathSecret);
        hpModified = true;
        totalDecryptedItems++;
        return `${quote}${plain}${quote}`;
      }
      return match;
    });
    if (hpModified) {
      fs.writeFileSync(homePeriodsPath, hpContent, 'utf-8');
      decryptedFiles++;
      console.log(`   ✔️ 已还原: docs/.vitepress/theme/constants/homePeriods.ts`);
    }
  }

  console.log(`   ✨ 解密完成: 共还原 ${decryptedFiles} 个文件, ${totalDecryptedItems} 处路径/敏感字段`);

  // 4. 安装 Git Pre-commit Hook
  console.log(`\n🪝 [步骤 4/4] 安装 Git Pre-commit 守卫钩子...`);
  try {
    execSync('npm run hook:install', { cwd: projectRoot, stdio: 'inherit' });
  } catch {}

  console.log(`\n======================================================`);
  console.log(`🎉 [ResumeRepo 完成] 仓库已成功恢复为本地开发环境！`);
  console.log(`📝 当前分支: dev (所有内容已还原为人类可读明文)`);
  console.log(`🚀 随时运行 ./fastpush.sh 即可一键安全发布到 GitHub！`);
  console.log(`======================================================\n`);
}

// CLI handler
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  resumeRepo().catch((err) => {
    console.error('\n❌ 恢复失败:', err);
    process.exit(1);
  });
}
