import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { parseEnvFile, encryptBase64, decryptBase64 } from './crypto-shared.mjs';
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

  const accessKeyId = process.env.R2_ACCESS_KEY_ID || localEnv.R2_ACCESS_KEY_ID || rootEnv.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || localEnv.R2_SECRET_ACCESS_KEY || rootEnv.R2_SECRET_ACCESS_KEY;

  if (!accountId || (!apiToken && (!accessKeyId || !secretAccessKey)) || !bucket) {
    throw new Error('❌ [R2 Sync] 缺少 R2 配置，请在 .env.local 中配置 R2_ACCOUNT_ID, R2_API_TOKEN, R2_BUCKET！');
  }

  return { accountId, apiToken, bucket, publicDomain, secret, accessKeyId, secretAccessKey };
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
  // ignore_files 本身始终直传（不经过路径加密）
  if (relPath === 'ignore_files' || relPath === '/ignore_files' || relPath === '.ignore' || relPath === '/.ignore') return true;

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
    if (item.name.startsWith('.') || ['node_modules', '.res_manifest.json'].includes(item.name)) continue;
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

function fetchText(url) {
  return new Promise((resolve) => {
    https.get(url, { agent: httpsAgent, timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null));
  });
}

async function getUploadPayload(filePath, remoteKey, config) {
  const isIgnoreConfig = remoteKey === 'ignore_files' || remoteKey === '.ignore';
  if (isIgnoreConfig) {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const encryptedBase64 = await encryptBase64(rawContent, config.secret);
    return {
      buffer: Buffer.from(encryptedBase64, 'utf-8'),
      mime: 'text/plain; charset=utf-8',
    };
  }
  return {
    buffer: fs.readFileSync(filePath),
    mime: null,
  };
}

async function uploadToR2ViaS3({ config, remoteKey, filePath, ext }) {
  const payload = await getUploadPayload(filePath, remoteKey, config);
  const mime = payload.mime || getMimeType(ext);
  const buffer = payload.buffer;
  const cleanKey = remoteKey.replace(/^\/+/, '');
  const url = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${encodeURI(cleanKey)}`;
  const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

  const headers = {
    'Content-Type': mime,
    'Content-Length': buffer.length,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'x-amz-content-sha256': contentHash,
  };

  signAwsV4({
    method: 'PUT',
    url,
    headers,
    body: buffer,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: 'auto',
    service: 's3',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'PUT',
        headers,
        timeout: 60000,
        agent: httpsAgent,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            reject(new Error(`S3 PutObject HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('S3 Upload timeout')));
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function encodeR2Key(key) {
  return key.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
}

async function uploadToR2({ config, remoteKey, filePath, ext }) {
  if (config.accessKeyId && config.secretAccessKey) {
    try {
      return await uploadToR2ViaS3({ config, remoteKey, filePath, ext });
    } catch (err) {
      console.warn(`⚠️ [S3 Upload Failed for ${remoteKey}]: ${err.message}`);
      if (!config.apiToken) throw err;
    }
  }

  const payload = await getUploadPayload(filePath, remoteKey, config);
  const mime = payload.mime || getMimeType(ext);
  const buffer = payload.buffer;

  let attempts = 0;
  const maxAttempts = 4;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const res = await r2HttpRequest({
        path: `/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucket}/objects/${encodeR2Key(remoteKey)}`,
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

async function deleteFromR2ViaS3({ config, remoteKey }) {
  const cleanKey = remoteKey.replace(/^\/+/, '');
  const url = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${encodeURI(cleanKey)}`;
  const headers = {
    'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };

  signAwsV4({
    method: 'DELETE',
    url,
    headers,
    body: null,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: 'auto',
    service: 's3',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'DELETE',
        headers,
        timeout: 30000,
        agent: httpsAgent,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            reject(new Error(`S3 DeleteObject HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('S3 Delete timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function deleteFromR2({ config, remoteKey }) {
  if (config.accessKeyId && config.secretAccessKey) {
    try {
      return await deleteFromR2ViaS3({ config, remoteKey });
    } catch (err) {
      if (!config.apiToken) throw err;
    }
  }

  await r2HttpRequest({
    path: `/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucket}/objects/${encodeR2Key(remoteKey)}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
    },
  });
}

function signAwsV4({ method, url, headers, body, accessKeyId, secretAccessKey, region = 'auto', service = 's3' }) {
  const parsedUrl = new URL(url);
  const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = datetime.slice(0, 8);

  const normalizedHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== null) {
      normalizedHeaders[key.toLowerCase()] = String(value).trim();
    }
  }

  normalizedHeaders['host'] = parsedUrl.host;
  normalizedHeaders['x-amz-date'] = datetime;
  if (!normalizedHeaders['x-amz-content-sha256']) {
    normalizedHeaders['x-amz-content-sha256'] = body ? crypto.createHash('sha256').update(body).digest('hex') : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }

  // Sync normalized headers back to headers object
  for (const [k, v] of Object.entries(normalizedHeaders)) {
    headers[k] = v;
  }

  const signedHeaderKeys = Object.keys(normalizedHeaders).sort();
  const signedHeaders = signedHeaderKeys.join(';');
  const canonicalHeaders = signedHeaderKeys.map((k) => `${k}:${normalizedHeaders[k]}\n`).join('');

  const canonicalRequest = [
    method,
    parsedUrl.pathname,
    parsedUrl.search ? parsedUrl.search.slice(1) : '',
    canonicalHeaders,
    signedHeaders,
    normalizedHeaders['x-amz-content-sha256'],
  ].join('\n');

  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const kDate = crypto.createHmac('sha256', 'AWS4' + secretAccessKey).update(date).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return headers;
}

async function copyObjectOnR2({ config, sourceKey, targetKey }) {
  if (!config.accessKeyId || !config.secretAccessKey) {
    return false;
  }

  const cleanTarget = targetKey.replace(/^\/+/, '');
  const cleanSource = sourceKey.replace(/^\/+/, '');
  const url = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${encodeURI(cleanTarget)}`;
  const copySource = `/${config.bucket}/${encodeURI(cleanSource)}`;

  const headers = {
    'x-amz-copy-source': copySource,
    'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };

  signAwsV4({
    method: 'PUT',
    url,
    headers,
    body: null,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: 'auto',
    service: 's3',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'PUT',
        headers,
        timeout: 30000,
        agent: httpsAgent,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            reject(new Error(`S3 CopyObject HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('S3 Copy timeout')));
    req.on('error', reject);
    req.end();
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

async function listAllR2ObjectsViaS3(config) {
  const objects = [];
  let continuationToken = null;

  while (true) {
    let url = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}?list-type=2`;
    if (continuationToken) {
      url += `&continuation-token=${encodeURIComponent(continuationToken)}`;
    }

    const headers = {
      'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };

    signAwsV4({
      method: 'GET',
      url,
      headers,
      body: null,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: 'auto',
      service: 's3',
    });

    const xml = await new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: 'GET',
          headers,
          timeout: 30000,
          agent: httpsAgent,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`S3 ListObjectsV2 HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
            }
          });
        },
      );
      req.on('timeout', () => req.destroy(new Error('S3 List timeout')));
      req.on('error', reject);
      req.end();
    });

    const keyMatches = [...xml.matchAll(/<Key>(.*?)<\/Key>/g)];
    for (const match of keyMatches) {
      const rawKey = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      objects.push({ key: rawKey });
    }

    const isTruncated = /<IsTruncated>true<\/IsTruncated>/i.test(xml);
    const tokenMatch = xml.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/i);

    if (isTruncated && tokenMatch) {
      continuationToken = tokenMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    } else {
      break;
    }
  }

  return objects;
}

export async function listAllR2Objects(config) {
  if (config.accessKeyId && config.secretAccessKey) {
    try {
      return await listAllR2ObjectsViaS3(config);
    } catch (err) {
      console.warn(`⚠️ S3 协议 ListObjects 失败，尝试 REST API: ${err.message}`);
    }
  }

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
  let ignoreFilePath = path.join(resDir, 'ignore_files');
  if (!fs.existsSync(ignoreFilePath) && !fs.existsSync(path.join(resDir, '.ignore'))) {
    console.log('📥 本地未检测到 ignore_files，尝试从 R2 下载并解密还原...');
    try {
      const url = `${config.publicDomain.replace(/\/+$/, '')}/ignore_files`;
      const cipherText = await fetchText(url);
      if (cipherText && cipherText.trim()) {
        const decrypted = await decryptBase64(cipherText.trim(), config.secret);
        if (decrypted.success) {
          if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });
          fs.writeFileSync(ignoreFilePath, decrypted.plaintext, 'utf-8');
          console.log('   ✅ 成功从 R2 还原本地 docs/public/res/ignore_files！');
        }
      }
    } catch (e) {
      console.warn(`   ⚠️ 还原 ignore_files 跳过: ${e.message}`);
    }
  }
  if (!fs.existsSync(ignoreFilePath)) {
    ignoreFilePath = path.join(resDir, '.ignore');
  }
  const ignorePatterns = parseIgnoreFile(ignoreFilePath);
  if (ignorePatterns.length > 0) {
    console.log(`📋 读取到 ignore 规则 (${ignorePatterns.length} 条): ${ignorePatterns.join(', ')}`);
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
  const oldHashToItems = new Map();
  for (const [oldRel, item] of Object.entries(oldFiles)) {
    if (!oldHashToItems.has(item.hash)) {
      oldHashToItems.set(item.hash, []);
    }
    oldHashToItems.get(item.hash).push({ relPath: oldRel, ...item });
  }

  const toUpload = [];
  const toMigrate = [];
  const toDelete = [];
  const handledOldRemoteKeys = new Set();
  let skippedCount = 0;

  for (const [relPath, cur] of Object.entries(currentMap)) {
    const old = oldFiles[relPath];
    const existsOnRemote = remoteKeysSet.size === 0 || remoteKeysSet.has(cur.remoteKey);

    if (old && old.hash === cur.hash && old.remoteKey === cur.remoteKey && existsOnRemote && !force) {
      // Unchanged and exists on remote
      skippedCount++;
      handledOldRemoteKeys.add(cur.remoteKey);
    } else {
      // Check if there is an existing remote object with the exact same content hash
      const candidates = oldHashToItems.get(cur.hash) || [];
      const matchedOld = candidates.find(
        (c) =>
          (remoteKeysSet.size === 0 || remoteKeysSet.has(c.remoteKey)) &&
          c.remoteKey !== cur.remoteKey &&
          !handledOldRemoteKeys.has(c.remoteKey),
      );

      if (matchedOld && !force) {
        toMigrate.push({
          sourceKey: matchedOld.remoteKey,
          targetKey: cur.remoteKey,
          oldRelPath: matchedOld.relPath,
          newRelPath: relPath,
          cur,
        });
        handledOldRemoteKeys.add(matchedOld.remoteKey);
      } else {
        toUpload.push(cur);
      }
    }
  }

  // Find remaining deleted/orphan remote keys
  const validCurrentRemoteKeys = new Set(Object.values(currentMap).map((c) => c.remoteKey));
  for (const [oldRel, oldItem] of Object.entries(oldFiles)) {
    if (!currentMap[oldRel] && !handledOldRemoteKeys.has(oldItem.remoteKey)) {
      if (prune) {
        toDelete.push({ relPath: oldRel, remoteKey: oldItem.remoteKey });
      }
    }
  }
  if (remoteKeysSet.size > 0 && prune) {
    for (const rKey of remoteKeysSet) {
      if (!validCurrentRemoteKeys.has(rKey) && !toDelete.some((d) => d.remoteKey === rKey)) {
        toDelete.push({ relPath: '(远端孤儿对象)', remoteKey: rKey });
      }
    }
  }

  const hasS3Creds = !!(config.accessKeyId && config.secretAccessKey);

  console.log(`\n📊 增量变更统计:`);
  if (toMigrate.length > 0) {
    const modeDesc = hasS3Creds ? 'S3 服务端秒级 Copy（0 上传流量）' : '上传并自动替换旧文件';
    console.log(`   🔄 识别重命名/密钥迁移 (${modeDesc}): ${toMigrate.length} 个`);
    toMigrate.forEach((r) => {
      const isPathChange = r.oldRelPath !== r.newRelPath;
      const desc = isPathChange ? `${r.oldRelPath} -> ${r.newRelPath}` : `${r.newRelPath} (Key 变更)`;
      console.log(`      ↳ ${desc}`);
    });
  }
  console.log(`   ✨ 待上传/更新: ${toUpload.length} 个`);
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

  // 5. Perform Remote Migrations / Server-side Copies
  if (toMigrate.length > 0) {
    const startTime = Date.now();
    let completed = 0;

    if (hasS3Creds) {
      console.log(`\n⚡ 正在执行云端服务端秒级 Copy (免上传流量，并发数: ${concurrency})...\n`);
      await runConcurrent(toMigrate, concurrency, async (item) => {
        try {
          await copyObjectOnR2({
            config,
            sourceKey: item.sourceKey,
            targetKey: item.targetKey,
          });

          // Delete old remote key after copy succeeds
          await deleteFromR2({ config, remoteKey: item.sourceKey }).catch(() => {});

          if (item.oldRelPath !== item.newRelPath) {
            delete manifest.files[item.oldRelPath];
          }

          manifest.files[item.newRelPath] = {
            hash: item.cur.hash,
            size: item.cur.size,
            mtime: item.cur.mtime,
            remoteKey: item.targetKey,
            ...(item.cur.raw ? { raw: true } : {}),
          };

          completed++;
          const pct = ((completed / toMigrate.length) * 100).toFixed(1);
          console.log(`[${completed}/${toMigrate.length}] (${pct}%) ⚡ 云端迁移完成: ${item.newRelPath} (${formatSize(item.cur.size)})`);

          if (completed % 5 === 0 || completed === toMigrate.length) {
            flushManifest(manifest);
          }
        } catch (err) {
          flushManifest(manifest);
          console.error(`\n❌ 云端迁移失败 [${item.newRelPath}]:`, err.message);
          throw err;
        }
      });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ 云端秒级迁移完成！耗时: ${elapsed}s`);
    } else {
      console.log(`\n💡 提示：在 .env.local 中配置 R2_ACCESS_KEY_ID 与 R2_SECRET_ACCESS_KEY 可开启云端 0 流量秒级 Copy。`);
      console.log(`⚡ 正在并发上传并自动清理旧 key (并发数: ${concurrency})...\n`);
      await runConcurrent(toMigrate, concurrency, async (item) => {
        try {
          await uploadToR2({
            config,
            remoteKey: item.targetKey,
            filePath: item.cur.fullPath,
            ext: item.cur.ext,
          });

          // Clean up old remote key so no orphan files are left
          await deleteFromR2({ config, remoteKey: item.sourceKey }).catch(() => {});

          if (item.oldRelPath !== item.newRelPath) {
            delete manifest.files[item.oldRelPath];
          }

          manifest.files[item.newRelPath] = {
            hash: item.cur.hash,
            size: item.cur.size,
            mtime: item.cur.mtime,
            remoteKey: item.targetKey,
            ...(item.cur.raw ? { raw: true } : {}),
          };

          completed++;
          const pct = ((completed / toMigrate.length) * 100).toFixed(1);
          console.log(`[${completed}/${toMigrate.length}] (${pct}%) 🚀 迁移上传成功 (旧对象已清理): ${item.newRelPath} (${formatSize(item.cur.size)})`);

          if (completed % 5 === 0 || completed === toMigrate.length) {
            flushManifest(manifest);
          }
        } catch (err) {
          flushManifest(manifest);
          console.error(`\n❌ 迁移上传失败 [${item.newRelPath}]:`, err.message);
          throw err;
        }
      });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ 迁移完成！耗时: ${elapsed}s`);
    }
  }

  // 6. Perform Uploads in parallel for new/modified files
  if (toUpload.length > 0) {
    console.log(`\n⚡ 正在并发上传新增/修改文件 (并发数: ${concurrency})...\n`);
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

  // 7. Perform Deletions for orphaned files
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
