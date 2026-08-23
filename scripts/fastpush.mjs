import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { syncRes } from './res-sync.mjs';
import { loadKeys, transformMarkdownContent } from './crypto-shared.mjs';
import { loadEnvKeys, transformMarkdownPaths } from './repo-path-transform.mjs';
import { encryptPath } from './path-crypto.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const shadowDir = path.resolve(projectRoot, '.git/.shadow_workspace');
const shadowIndex = path.resolve(projectRoot, '.git/.shadow_index');

function copyWorkingFilesToShadow(srcDir, destDir) {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  // 直接使用 git 原生解析 .gitignore，自动过滤所有忽略的大文件与缓存
  const raw = execSync('git ls-files --cached --others --exclude-standard', {
    cwd: srcDir,
    encoding: 'utf-8',
  });

  const files = raw.split('\n').map((f) => f.trim()).filter(Boolean);
  for (const rel of files) {
    // 额外安全兜底：绝不复制 .env 环境变量文件
    if (path.basename(rel).startsWith('.env')) continue;

    const srcPath = path.join(srcDir, rel);
    if (!fs.existsSync(srcPath)) continue;

    const destPath = path.join(destDir, rel);
    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(srcPath, destPath);
  }
}

function scanFiles(dir, ext = '.md') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

export async function fastPush(commitMsg) {
  process.env.FASTPUSH_ACTIVE = '1';
  const startTime = Date.now();
  console.log(`\n======================================================`);
  console.log(`🚀 [FastPush] 启动影子安全推送 (Shadow Push)`);
  console.log(`======================================================\n`);

  // 1. 同步本地静态大文件资源到 Cloudflare R2
  console.log(`📦 [步骤 1/4] 检查并同步 R2 图床资源...`);
  try {
    await syncRes();
  } catch (err) {
    console.error(`❌ R2 资源同步失败:`, err.message);
    process.exit(1);
  }

  // 2. 加载加解密环境密钥
  console.log(`\n🔑 [步骤 2/4] 校验加解密密钥...`);
  const keys = await loadKeys({ interactive: false });
  const { pathSecret, articleKeys } = loadEnvKeys();

  // 3. 构建影子临时工作区 (Shadow Workspace)
  console.log(`\n👥 [步骤 3/4] 创建影子工作区并加密敏感内容...`);
  copyWorkingFilesToShadow(projectRoot, shadowDir);

  // 在影子区中对所有 Markdown 文件执行敏感标签和路径加密
  const shadowDocs = path.join(shadowDir, 'docs');
  const mdFiles = scanFiles(shadowDocs, '.md');
  let encryptedFilesCount = 0;
  let totalEncryptedItems = 0;

  for (const file of mdFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    const rel = path.relative(shadowDir, file).replace(/\\/g, '/');

    // 加密 <ec> 标签
    const stepA = await transformMarkdownContent(content, {
      action: 'encrypt_base64',
      keys,
      requireKeys: true,
    });
    if (stepA.modified) {
      content = stepA.newContent;
      modified = true;
      totalEncryptedItems += stepA.stats.processed;
    }

    // 加密资源路径为 ChaCha20 R2 Key
    const stepB = await transformMarkdownPaths(content, 'encrypt', {
      pathSecret,
      articleKeys,
      fileId: rel,
    });
    if (stepB.modified) {
      content = stepB.newContent;
      modified = true;
      totalEncryptedItems += stepB.count;
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      encryptedFilesCount++;
    }
  }

  // 在影子区中对 homePeriods.ts 执行背景图路径加密
  const shadowHomePeriods = path.join(shadowDir, 'docs/.vitepress/theme/constants/homePeriods.ts');
  if (fs.existsSync(shadowHomePeriods)) {
    let hpContent = fs.readFileSync(shadowHomePeriods, 'utf-8');
    const hpRegex = /(['"]\/imgs\/home_bg\/[^'"]+['"])/g;
    let hpModified = false;
    hpContent = hpContent.replace(hpRegex, (match, p1) => {
      const quote = p1[0];
      const plainPath = p1.slice(1, -1);
      const enc = '/' + encryptPath(plainPath, pathSecret);
      hpModified = true;
      totalEncryptedItems++;
      return `${quote}${enc}${quote}`;
    });
    if (hpModified) {
      fs.writeFileSync(shadowHomePeriods, hpContent, 'utf-8');
      encryptedFilesCount++;
    }
  }

  console.log(`   ✨ 影子区加密完成: ${encryptedFilesCount} 个文件已处理, 共加密 ${totalEncryptedItems} 处敏感字段/路径`);

  // 4. 获取远端与分支信息
  let deployRemote = 'blog-next';
  try {
    const remotes = execSync('git remote', { cwd: projectRoot }).toString().trim().split('\n');
    if (remotes.includes('blog-next')) deployRemote = 'blog-next';
    else if (remotes.includes('origin')) deployRemote = 'origin';
    else if (remotes.includes('github')) deployRemote = 'github';
    else deployRemote = remotes[0];
  } catch {}

  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot }).toString().trim();
  const finalMsg = commitMsg || `chore: update content (${new Date().toLocaleString('zh-CN')})`;

  // 5. 自动记录本地明文提交历史 (保持本地 dev 分支 100% 干净)
  const statusOutput = execSync('git status --porcelain', { cwd: projectRoot }).toString().trim();
  if (statusOutput) {
    console.log(`\n💾 [步骤 4/5] 记录本地 ${currentBranch} 分支明文提交历史...`);
    execSync('git add -A', { cwd: projectRoot });
    execSync(`git commit -m ${JSON.stringify(finalMsg)}`, { cwd: projectRoot });
  }

  // 6. 使用独立 Git 索引创建影子密文提交并推送到 main
  console.log(`\n📤 [步骤 5/5] 打包影子密文提交并推送到 GitHub (main 分支)...`);
  const gitEnv = {
    ...process.env,
    GIT_INDEX_FILE: shadowIndex,
    GIT_WORK_TREE: shadowDir,
    GIT_DIR: path.join(projectRoot, '.git'),
  };

  try {
    execSync('git read-tree HEAD', { env: gitEnv, cwd: shadowDir });
  } catch {}

  execSync('git add -A', { env: gitEnv, cwd: shadowDir });
  const treeHash = execSync('git write-tree', { env: gitEnv, cwd: shadowDir }).toString().trim();

  // 获取远端 main 的最新 parent commit
  const targetBranch = 'main';
  let parentHash = null;
  try {
    execSync(`git fetch ${deployRemote} ${targetBranch}`, { cwd: projectRoot, stdio: 'ignore' });
    parentHash = execSync(`git rev-parse ${deployRemote}/${targetBranch}`, { cwd: projectRoot }).toString().trim();
  } catch {
    try {
      parentHash = execSync(`git rev-parse ${targetBranch}`, { cwd: projectRoot }).toString().trim();
    } catch {
      parentHash = null;
    }
  }

  // 创建密文 commit
  const parentArg = parentHash ? `-p ${parentHash}` : '';
  const commitHash = execSync(
    `git commit-tree ${treeHash} ${parentArg} -m ${JSON.stringify(finalMsg)}`,
    { env: gitEnv, cwd: shadowDir }
  ).toString().trim();

  console.log(`   🔖 已生成影子密文提交: ${commitHash.substring(0, 7)} ("${finalMsg}")`);
  console.log(`   🌐 正在推送到公开远端 ${deployRemote}/${targetBranch} (线上展示分支)...`);

  execSync(`git push ${deployRemote} ${commitHash}:refs/heads/${targetBranch}`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // 如果存在私有仓库 github，同时备份明文分支
  try {
    const remotes = execSync('git remote', { cwd: projectRoot }).toString().trim().split('\n');
    if (remotes.includes('github')) {
      console.log(`   🔒 正在同步明文备份到私有仓库 (github/${currentBranch})...`);
      execSync(`git push github ${currentBranch}:${currentBranch}`, {
        cwd: projectRoot,
        stdio: 'inherit',
      });
    }
  } catch (err) {
    console.warn(`⚠️ 私有仓库同步提示:`, err.message);
  }

  // 清理影子区
  fs.rmSync(shadowDir, { recursive: true, force: true });
  fs.rmSync(shadowIndex, { force: true });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`🎉 [FastPush 成功] 已成功发布到 GitHub！总耗时: ${elapsed}s`);
  console.log(`🛡️ 本地分支: ${currentBranch} (100% 干净明文) -> 远端分支: ${targetBranch} (100% 加密发布)`);
  console.log(`======================================================\n`);
}

// CLI handler
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const commitMsg = process.argv.slice(2).join(' ').trim();
  fastPush(commitMsg).catch((err) => {
    console.error('\n❌ FastPush 失败:', err);
    try {
      if (fs.existsSync(shadowDir)) fs.rmSync(shadowDir, { recursive: true, force: true });
      if (fs.existsSync(shadowIndex)) fs.rmSync(shadowIndex, { force: true });
    } catch {}
    process.exit(1);
  });
}
