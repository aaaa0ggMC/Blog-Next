import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { parseEnvFile } from './crypto-shared.mjs';
import { encryptPath, decryptPath, getPathSecret } from './path-crypto.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const resDir = path.resolve(projectRoot, 'docs/public/res');
const manifestPath = path.resolve(resDir, '.res_manifest.json');

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 8 });

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

function getMimeType(ext) {
  return MIME_MAP[ext.toLowerCase()] || 'application/octet-stream';
}

function getR2Config() {
  const localEnv = parseEnvFile(path.join(projectRoot, '.env.local'));
  const rootEnv = parseEnvFile(path.join(projectRoot, '.env'));

  const accountId = process.env.R2_ACCOUNT_ID || localEnv.R2_ACCOUNT_ID || rootEnv.R2_ACCOUNT_ID;
  const apiToken = process.env.R2_API_TOKEN || localEnv.R2_API_TOKEN || rootEnv.R2_API_TOKEN;
  const bucket = process.env.R2_BUCKET || localEnv.R2_BUCKET || rootEnv.R2_BUCKET || 'blog-picbackend';
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || localEnv.R2_PUBLIC_DOMAIN || rootEnv.R2_PUBLIC_DOMAIN || 'https://res.yslwd.eu.org';
  const secret = getPathSecret();

  if (!accountId || !apiToken || !bucket) {
    throw new Error('❌ [R2 Sync] 缺少 R2 配置，请在 .env.local 中配置 R2_ACCOUNT_ID, R2_API_TOKEN, R2_BUCKET！');
  }

  return { accountId, apiToken, bucket, publicDomain, secret };
}

function computeFileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return `sha256:${hash}`;
}

function parseIgnoreFile(ignoreFilePath) {
  if (!fs.existsSync(ignoreFilePath)) return [];
  try {
    const content = fs.readFileSync(ignoreFilePath, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  } catch {
    return [];
  }
}

function isPathIgnored(relPath, patterns) {
  // .ignore 本身始终直传（不经过路径加密）
  if (relPath === '.ignore' || relPath === '/.ignore') return true;

  const normalized = relPath.replace(/^\/+/, '');

  for (const rawPattern of patterns) {
    const pattern = rawPattern.trim();
    if (!pattern || pattern.startsWith('#')) continue;

    // 1. 根目录绝对匹配：以 / 开头（例如 "/logo.png" 或 "/fonts/"）
    if (pattern.startsWith('/')) {
      const cleanRootPattern = pattern.slice(1);
      if (cleanRootPattern.endsWith('/')) {
        // e.g. "/fonts/" -> 匹配以 "fonts/" 开头的所有子项
        if (normalized === cleanRootPattern.slice(0, -1) || normalized.startsWith(cleanRootPattern)) {
          return true;
        }
      } else {
        // e.g. "/logo.png" -> 严格只匹配根目录下的 "logo.png"
        if (normalized === cleanRootPattern) {
          return true;
        }
      }
      continue;
    }

    // 2. 目录匹配：以 / 结尾（例如 "fonts/"）
    if (pattern.endsWith('/')) {
      if (normalized === pattern.slice(0, -1) || normalized.startsWith(pattern)) {
        return true;
      }
      continue;
    }

    // 3. 通配符模式匹配（例如 "*.gpg" 或 "fonts/**"）
    if (pattern.includes('*')) {
      if (!pattern.includes('/')) {
        // 无路径分隔符的通配符（如 "*.gpg"），匹配文件名
        const fileName = path.basename(normalized);
        const fileRegex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        if (fileRegex.test(fileName)) {
          return true;
        }
      } else {
        // 包含路径的通配符，匹配完整相对路径
        const globRegex = new RegExp(
          '^' +
          pattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '___DOUBLE_STAR___')
            .replace(/\*/g, '[^/]*')
            .replace(/___DOUBLE_STAR___/g, '.*') +
          '$'
        );
        if (globRegex.test(normalized)) {
          return true;
        }
      }
      continue;
    }

    // 4. 精确相对路径全字匹配
    if (normalized === pattern) {
      return true;
    }
  }

  return false;
}

function scanResFiles(dir, baseDir = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of list) {
    if (['.git', 'node_modules', '.DS_Store', '.res_manifest.json'].includes(item.name)) continue;
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      results.push(...scanResFiles(fullPath, baseDir));
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const stat = fs.statSync(fullPath);
      results.push({
        fullPath,
        relPath,
        ext,
        size: stat.size,
        mtime: stat.mtimeMs,
      });
    }
  }
  return results;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Concurrency pool helper
async function runConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function r2HttpRequest({ hostname = 'api.cloudflare.com', path: reqPath, method = 'GET', headers = {}, body = null, timeout = 120000 }) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname,
      path: reqPath,
      method,
      agent: httpsAgent,
      headers,
      timeout,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function uploadToR2({ config, remoteKey, filePath, ext }) {
  const mime = getMimeType(ext);
  const buffer = fs.readFileSync(filePath);

  let attempts = 0;
  const maxAttempts = 4;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const res = await r2HttpRequest({
        path: `/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucket}/objects/${encodeURIComponent(remoteKey)}`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': mime,
          'Content-Length': buffer.length,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
        body: buffer,
        timeout: 30000,
      });

      if (res && res.success === false) {
        throw new Error(`API error: ${JSON.stringify(res.errors)}`);
      }
      return res;
    } catch (err) {
      if (attempts >= maxAttempts) {
        throw new Error(`Upload failed after ${maxAttempts} attempts for ${remoteKey}: ${err.message}`);
      }
      const backoff = 800 * attempts;
      await sleep(backoff);
    }
  }
}

async function deleteFromR2({ config, remoteKey }) {
  await r2HttpRequest({
    path: `/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucket}/objects/${encodeURIComponent(remoteKey)}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
    },
  });
}

function flushManifest(manifest) {
  try {
    manifest.updatedAt = new Date().toISOString();
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ 保存 manifest 失败:', err.message);
  }
}

export async function listAllR2Objects(config) {
  const objects = [];
  let cursor = null;

  while (true) {
    let reqPath = `/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucket}/objects`;
    if (cursor) {
      reqPath += `?cursor=${encodeURIComponent(cursor)}`;
    }
    const json = await r2HttpRequest({
      path: reqPath,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
      },
    });

    if (!json.success) {
      throw new Error(`List objects error: ${JSON.stringify(json.errors)}`);
    }
    const list = json.result || [];
    objects.push(...list);

    if (json.result_info?.cursor) {
      cursor = json.result_info.cursor;
    } else {
      break;
    }
  }
  return objects;
}

export async function syncRes({ dryRun = false, force = false, prune = false, concurrency = 6 } = {}) {
  const config = getR2Config();
  console.log(`🚀 [R2 Sync] 启动资源增量同步`);
  console.log(`📦 目标存储桶: ${config.bucket}`);
  console.log(`🌐 绑定的 CDN: ${config.publicDomain}`);
  console.log(`📁 本地资源库: ${resDir}\n`);

  if (!fs.existsSync(resDir)) {
    console.error(`❌ 本地目录 ${resDir} 不存在！`);
    process.exit(1);
  }

  // 1. Load existing manifest
  let manifest = { version: '1.0', updatedAt: '', files: {} };
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
      console.warn('⚠️ 读取旧 .res_manifest.json 失败，将重新生成。');
    }
  }
  if (!manifest.files) manifest.files = {};

  // Register clean exit handler to ensure manifest is saved on SIGINT
  const onSigint = () => {
    console.log('\n\n🛑 检测到中断信号，正在保存已完成文件的 Manifest 状态...');
    flushManifest(manifest);
    process.exit(0);
  };
  process.on('SIGINT', onSigint);

  // 2. Fetch remote objects to guarantee self-healing consistency
  console.log('🔍 检查远端 R2 存储桶对象状态...');
  let remoteKeysSet = new Set();
  try {
    const remoteObjects = await listAllR2Objects(config);
    remoteKeysSet = new Set(remoteObjects.map(o => o.key));
    console.log(`☁️ 远端 R2 现有对象: ${remoteKeysSet.size} 个`);
  } catch (err) {
    console.warn(`⚠️ 无法获取远端对象列表，将回退至本地 Manifest 校验: ${err.message}`);
  }

  // 3. Scan local files and compute hashes
  console.log('🔍 扫描本地文件并计算校验和...');
  const ignoreFilePath = path.join(resDir, '.ignore');
  const ignorePatterns = parseIgnoreFile(ignoreFilePath);
  if (ignorePatterns.length > 0) {
    console.log(`📋 读取到 .ignore 规则 (${ignorePatterns.length} 条): ${ignorePatterns.join(', ')}`);
  }

  const localFiles = scanResFiles(resDir);
  console.log(`📄 找到本地资源文件共 ${localFiles.length} 个`);

  const currentMap = {};
  for (const f of localFiles) {
    const hash = computeFileHash(f.fullPath);
    const isIgnored = isPathIgnored(f.relPath, ignorePatterns);
    const remoteKey = isIgnored ? f.relPath : encryptPath('/' + f.relPath, config.secret);
    currentMap[f.relPath] = {
      ...f,
      hash,
      remoteKey,
      raw: isIgnored,
    };
  }

  // 4. Diff against manifest and remote keys
  const oldFiles = manifest.files || {};
  const oldHashToPaths = new Map();
  for (const [oldRel, item] of Object.entries(oldFiles)) {
    if (!oldHashToPaths.has(item.hash)) {
      oldHashToPaths.set(item.hash, []);
    }
    oldHashToPaths.get(item.hash).push({ relPath: oldRel, ...item });
  }

  const toUpload = [];
  const toDelete = [];
  const renames = [];
  let skippedCount = 0;

  for (const [relPath, cur] of Object.entries(currentMap)) {
    const old = oldFiles[relPath];
    const existsOnRemote = remoteKeysSet.size === 0 || remoteKeysSet.has(cur.remoteKey);

    if (old && old.hash === cur.hash && old.remoteKey === cur.remoteKey && existsOnRemote && !force) {
      // Unchanged and exists on remote
      skippedCount++;
    } else {
      // Check if this is a rename from a deleted old file
      const sameHashOld = oldHashToPaths.get(cur.hash);
      const matchingDeletedOld = sameHashOld
        ? sameHashOld.find((o) => !currentMap[o.relPath])
        : null;

      if (matchingDeletedOld && !force) {
        renames.push({
          oldPath: matchingDeletedOld.relPath,
          oldRemoteKey: matchingDeletedOld.remoteKey,
          newPath: relPath,
          newRemoteKey: cur.remoteKey,
          cur,
        });
        toUpload.push(cur);
        toDelete.push({ relPath: matchingDeletedOld.relPath, remoteKey: matchingDeletedOld.remoteKey });
      } else {
        toUpload.push(cur);
      }
    }
  }

  // Find deleted files
  for (const [oldRel, oldItem] of Object.entries(oldFiles)) {
    if (!currentMap[oldRel]) {
      const isHandledRename = renames.some((r) => r.oldPath === oldRel);
      if (!isHandledRename && prune) {
        toDelete.push({ relPath: oldRel, remoteKey: oldItem.remoteKey });
      }
    }
  }

  console.log(`\n📊 增量变更统计:`);
  console.log(`   ✨ 待上传/更新: ${toUpload.length} 个`);
  if (renames.length > 0) {
    console.log(`   🔄 识别重命名/移动: ${renames.length} 个`);
    renames.forEach((r) => console.log(`      ↳ ${r.oldPath} -> ${r.newPath}`));
  }
  console.log(`   ⏭️  已是最新 (跳过): ${skippedCount} 个`);
  if (toDelete.length > 0) {
    console.log(`   🗑️  待清理远端: ${toDelete.length} 个`);
  }
  console.log('--------------------------------------------------');

  if (dryRun) {
    console.log('\n🔎 [Dry Run 模式] 不执行实际网络请求。');
    process.removeListener('SIGINT', onSigint);
    return;
  }

  // 5. Perform Uploads in parallel with scrolling stream output
  if (toUpload.length > 0) {
    console.log(`\n⚡ 正在并发上传 (并发数: ${concurrency})...\n`);
    let completed = 0;
    const startTime = Date.now();

    await runConcurrent(toUpload, concurrency, async (item) => {
      try {
        await uploadToR2({
          config,
          remoteKey: item.remoteKey,
          filePath: item.fullPath,
          ext: item.ext,
        });

        // Immediately update manifest in memory
        manifest.files[item.relPath] = {
          hash: item.hash,
          size: item.size,
          mtime: item.mtime,
          remoteKey: item.remoteKey,
          ...(item.raw ? { raw: true } : {}),
        };

        completed++;
        const pct = ((completed / toUpload.length) * 100).toFixed(1);
        const tag = item.raw ? ' [直传/未加密]' : '';
        console.log(`[${completed}/${toUpload.length}] (${pct}%) 🚀 上传成功: ${item.relPath}${tag} (${formatSize(item.size)})`);

        // Checkpoint flush every 5 items or when completed
        if (completed % 5 === 0 || completed === toUpload.length) {
          flushManifest(manifest);
        }
      } catch (err) {
        flushManifest(manifest);
        console.error(`\n❌ 上传失败 [${item.relPath}]:`, err.message);
        throw err;
      }
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ 上传完成！耗时: ${elapsed}s`);
  }

  // 6. Perform Deletions
  if (toDelete.length > 0 && prune) {
    console.log(`\n🗑️ 正在清理远端孤儿文件...`);
    for (const del of toDelete) {
      try {
        await deleteFromR2({ config, remoteKey: del.remoteKey });
        delete manifest.files[del.relPath];
        console.log(`   ✔️ 已删除远端: ${del.remoteKey} (${del.relPath})`);
      } catch (err) {
        console.warn(`   ⚠️ 删除失败 [${del.remoteKey}]:`, err.message);
      }
    }
  }

  // Final manifest flush
  flushManifest(manifest);
  console.log(`💾 已保存完整元数据清单 -> docs/public/res/.res_manifest.json`);

  process.removeListener('SIGINT', onSigint);
  console.log('\n🎉 R2 资源同步全部完成！');
}

export async function emptyBucket({ concurrency = 8 } = {}) {
  const config = getR2Config();
  console.log(`⚠️ [R2 Clean] 正在准备清空存储桶: ${config.bucket}`);
  console.log('🔍 正在获取云端对象列表...');
  const objects = await listAllR2Objects(config);

  if (objects.length === 0) {
    console.log('✨ 存储桶已经是空的，无需清理。');
  } else {
    console.log(`🗑️ 发现 ${objects.length} 个云端对象，正在并发删除...`);
    let deleted = 0;
    await runConcurrent(objects, concurrency, async (obj) => {
      await deleteFromR2({ config, remoteKey: obj.key });
      deleted++;
      console.log(`[${deleted}/${objects.length}] 🗑️ 已删除: ${obj.key}`);
    });
    console.log(`\n✅ 存储桶已完全清空！`);
  }

  if (fs.existsSync(manifestPath)) {
    fs.unlinkSync(manifestPath);
    console.log(`💾 已重置本地元数据清单 -> docs/public/res/.res_manifest.json`);
  }
}

// CLI handler
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = process.argv.slice(2);
  const isClean = args.includes('--clean') || args.includes('--empty');
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const prune = args.includes('--prune') || args.includes('--delete');

  if (isClean) {
    emptyBucket().catch((err) => {
      console.error('\n❌ 清空失败:', err);
      process.exit(1);
    });
  } else {
    syncRes({ dryRun, force, prune }).catch((err) => {
      console.error('\n❌ 同步失败:', err);
      process.exit(1);
    });
  }
}
