import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnvFile } from './crypto-shared.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function getPathSecret() {
  const localEnv = parseEnvFile(path.join(projectRoot, '.env.local'));
  const rootEnv = parseEnvFile(path.join(projectRoot, '.env'));
  const secret =
    process.env.R2_PATH_SECRET ||
    localEnv.R2_PATH_SECRET ||
    rootEnv.R2_PATH_SECRET ||
    process.env.R2_API_TOKEN ||
    localEnv.R2_API_TOKEN ||
    rootEnv.R2_API_TOKEN;

  if (!secret) {
    throw new Error('❌ [PathCrypto] 未找到 R2_PATH_SECRET 或 R2_API_TOKEN，请在 .env.local 中配置！');
  }
  return secret;
}

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a local resource path (e.g. /imgs/3c3u/fgn/route.png) into a deterministic R2 Key
 * @param {string} rawPath
 * @param {string} [secret]
 * @returns {string} e.g. "LyUIx_EyhNvOSFy0vShlQ5_kobXH-rwEoGzIPkr1Fefm_gp2.png"
 */
export function encryptPath(rawPath, secret = getPathSecret()) {
  if (!rawPath || typeof rawPath !== 'string') return rawPath;
  const normalized = rawPath.trim();
  if (!normalized) return normalized;

  // Extract extension
  const extMatch = normalized.match(/\.([a-zA-Z0-9_-]+)$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  const body = ext ? normalized.slice(0, -ext.length) : normalized;

  const key = deriveKey(secret);
  // Deterministic 16-byte IV from HMAC
  const iv = crypto.createHmac('sha256', key).update('iv:' + body).digest().subarray(0, 16);
  const cipher = crypto.createCipheriv('chacha20', key, iv);
  const enc = Buffer.concat([cipher.update(body, 'utf8'), cipher.final()]);

  const combined = Buffer.concat([iv, enc]);
  return combined.toString('base64url') + ext;
}

/**
 * Decrypt an R2 Key back to the original local resource path
 * @param {string} encKey
 * @param {string} [secret]
 * @returns {string} e.g. "/imgs/3c3u/fgn/route.png"
 */
export function decryptPath(encKey, secret = getPathSecret()) {
  if (!encKey || typeof encKey !== 'string') return encKey;
  let normalized = encKey.trim();
  if (normalized.startsWith('/')) normalized = normalized.slice(1);
  if (!normalized) return normalized;

  const extMatch = normalized.match(/\.([a-zA-Z0-9_-]+)$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  const body = ext ? normalized.slice(0, -ext.length) : normalized;

  try {
    const combined = Buffer.from(body, 'base64url');
    if (combined.length < 17) {
      throw new Error('Ciphertext is too short to contain valid IV');
    }
    const iv = combined.subarray(0, 16);
    const enc = combined.subarray(16);

    const key = deriveKey(secret);
    const decipher = crypto.createDecipheriv('chacha20', key, iv);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    const plainBody = dec.toString('utf8');

    // Verify deterministic HMAC
    const expectedIv = crypto.createHmac('sha256', key).update('iv:' + plainBody).digest().subarray(0, 16);
    if (!crypto.timingSafeEqual(iv, expectedIv)) {
      throw new Error('HMAC verification failed (not an encrypted path)');
    }

    let result = plainBody + ext;
    if (!result.startsWith('/') && !result.startsWith('http')) {
      result = '/' + result;
    }
    return result;
  } catch (err) {
    throw new Error(`❌ [PathCrypto] 解密失败: ${err.message}`);
  }
}

export function isPathEncrypted(val, secret = getPathSecret()) {
  if (!val || typeof val !== 'string' || !val.startsWith('/')) return false;
  if (val.startsWith('/res/') || val.startsWith('~') || val.startsWith('http')) return false;
  try {
    decryptPath(val, secret);
    return true;
  } catch {
    return false;
  }
}

// CLI handler: node scripts/path-crypto.mjs -d <key> | -e <path>
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = process.argv.slice(2);
  const secret = getPathSecret();

  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    console.log(`
📖 Path Crypto CLI 工具 (ChaCha20 可逆路径加密)

用法:
  node scripts/path-crypto.mjs -e <path>    加密指定本地路径
  node scripts/path-crypto.mjs -d <key>     解密指定云端 Key
  node scripts/path-crypto.mjs --manifest   反解并导出 .res_manifest.json 中的所有对应表
    `);
    process.exit(0);
  }

  if (args[0] === '-e' || args[0] === '--encrypt') {
    const target = args[1];
    if (!target) {
      console.error('❌ 请输入待加密路径，例如: node scripts/path-crypto.mjs -e /imgs/photo.png');
      process.exit(1);
    }
    const enc = encryptPath(target, secret);
    console.log(`🔒 明文路径: ${target}`);
    console.log(`🔑 云端 Key: ${enc}`);
  } else if (args[0] === '-d' || args[0] === '--decrypt') {
    const target = args[1];
    if (!target) {
      console.error('❌ 请输入待解密 Key，例如: node scripts/path-crypto.mjs -d xxxx.png');
      process.exit(1);
    }
    const dec = decryptPath(target, secret);
    console.log(`🔑 云端 Key: ${target}`);
    console.log(`🔓 原始路径: ${dec}`);
  } else if (args[0] === '--manifest' || args[0] === '-m') {
    const manifestPath = path.resolve(projectRoot, 'docs/public/res/.res_manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.error('❌ 未找到 docs/public/res/.res_manifest.json');
      process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log(`📋 Manifest 中的资源映射 (共 ${Object.keys(manifest.files || {}).length} 个):`);
    console.log('----------------------------------------------------------------------');
    for (const [relPath, item] of Object.entries(manifest.files || {})) {
      if (item.raw || item.remoteKey === relPath) {
        console.log(`${item.remoteKey.padEnd(52)} <===>  ${relPath} (直传/未加密)`);
      } else {
        try {
          const dec = decryptPath(item.remoteKey, secret);
          console.log(`${item.remoteKey.padEnd(52)} <===>  ${relPath} (解密校验: ${dec === '/' + relPath ? '✅' : '❌'})`);
        } catch {
          console.log(`${item.remoteKey.padEnd(52)} <===>  ${relPath} (解密校验: ❌)`);
        }
      }
    }
  }
}
