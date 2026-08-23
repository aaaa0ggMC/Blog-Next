import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.resolve(projectRoot, 'docs');

const require = createRequire(import.meta.url);
let CryptoJS;
try {
  CryptoJS = require('crypto-js');
} catch (e) {
  CryptoJS = createRequire(path.join(projectRoot, 'package.json'))('crypto-js');
}

const crypto = globalThis.crypto;

// ==========================================
// 1. Web Crypto (PBKDF2 + AES-256-GCM + Base64)
// ==========================================

async function deriveGcmKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBase64(plaintext, password) {
  if (!password || plaintext === undefined || plaintext === null) {
    throw new Error('Password and plaintext are required for encryption');
  }
  const enc = new TextEncoder();
  const nodeCrypto = await import('node:crypto');
  // 确定性派生 Salt (16B) 与 IV (12B)，确保相同明文生成 100% 相同密文，杜绝无意义的 Git 全库 Diff 抖动
  const salt = nodeCrypto.createHmac('sha256', password).update('salt:' + plaintext).digest().subarray(0, 16);
  const iv = nodeCrypto.createHmac('sha256', password).update('iv:' + plaintext).digest().subarray(0, 12);

  const key = await deriveGcmKey(password, new Uint8Array(salt));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    enc.encode(plaintext)
  );
  const cipherBytes = new Uint8Array(cipherBuffer);

  const combined = new Uint8Array(salt.length + iv.length + cipherBytes.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(cipherBytes, salt.length + iv.length);

  return Buffer.from(combined).toString('base64');
}

export async function decryptBase64(base64Str, password) {
  if (!password || !base64Str) return { success: false, plaintext: base64Str };
  try {
    const raw = Buffer.from(base64Str.trim(), 'base64');
    if (raw.length < 44) return { success: false, plaintext: base64Str }; // 16 salt + 12 iv + 16 tag
    const salt = raw.subarray(0, 16);
    const iv = raw.subarray(16, 28);
    const ciphertext = raw.subarray(28);

    const key = await deriveGcmKey(password, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return {
      success: true,
      plaintext: new TextDecoder().decode(decryptedBuffer)
    };
  } catch (err) {
    return { success: false, plaintext: base64Str };
  }
}

// ==========================================
// 2. Legacy Crypto (AES-256-CFB + Hex)
// ==========================================

export function encryptHex(plaintext, password) {
  if (!password || !plaintext) {
    throw new Error('Password and plaintext are required for encryption');
  }
  const keyWords = CryptoJS.enc.Utf8.parse(password);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plaintext, keyWords, {
    iv,
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.Pkcs7,
  });
  const combined = iv.concat(encrypted.ciphertext);
  return combined.toString(CryptoJS.enc.Hex);
}

export function decryptHex(hexStr, password) {
  if (!password || !hexStr) return { success: false, plaintext: hexStr };
  try {
    const trimmed = hexStr.trim();
    if (trimmed.length < 32 || !/^[0-9a-fA-F]+$/.test(trimmed)) {
      return { success: false, plaintext: hexStr };
    }
    const ivHex = trimmed.substring(0, 32);
    const ciphertextHex = trimmed.substring(32);
    const keyWords = CryptoJS.enc.Utf8.parse(password);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Hex.parse(ciphertextHex) },
      keyWords,
      {
        iv: CryptoJS.enc.Hex.parse(ivHex),
        mode: CryptoJS.mode.CFB,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (decryptedText) {
      return { success: true, plaintext: decryptedText };
    }
    return { success: false, plaintext: hexStr };
  } catch (err) {
    return { success: false, plaintext: hexStr };
  }
}

// ==========================================
// 3. Format Identifiers
// ==========================================

export function isHexCipher(str) {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  return /^[0-9a-fA-F]{32,}$/.test(trimmed) && trimmed.length % 2 === 0;
}

export function isBase64Cipher(str) {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (isHexCipher(trimmed)) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return false;
  try {
    const buf = Buffer.from(trimmed, 'base64');
    return buf.length >= 44;
  } catch (e) {
    return false;
  }
}

// ==========================================
// 4. Environment & Key Management
// ==========================================

export function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.slice(0, eqIdx).trim();
      let v = trimmed.slice(eqIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[k] = v;
    }
  }
  return env;
}

export async function loadKeys({ interactive = true } = {}) {
  const rootEnv = parseEnvFile(path.join(projectRoot, '.env'));
  const localEnv = parseEnvFile(path.join(projectRoot, '.env.local'));

  let norm = process.env.BLOG_GPG_KEY || localEnv.BLOG_GPG_KEY || rootEnv.BLOG_GPG_KEY || '';
  let priv = process.env.BLOG_SEC_KEY || localEnv.BLOG_SEC_KEY || rootEnv.BLOG_SEC_KEY || '';
  let teacher = process.env.BLOG_TEACHER_KEY || localEnv.BLOG_TEACHER_KEY || rootEnv.BLOG_TEACHER_KEY || '';

  if (interactive && (!norm || !priv || !teacher) && process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const question = (q) => new Promise((resolve) => rl.question(q, resolve));

    console.log('\n🔑 请输入用于加密/解密的密钥 (直接回车保留当前已读取的值):');
    if (!norm) {
      norm = (await question(`- 普通密钥 (BLOG_GPG_KEY) [当前: ${norm ? '已设置' : '未设置'}]: `)).trim() || norm;
    }
    if (!priv) {
      priv = (await question(`- 私密密钥 (BLOG_SEC_KEY) [当前: ${priv ? '已设置' : '未设置'}]: `)).trim() || priv;
    }
    if (!teacher) {
      teacher = (await question(`- 教师密钥 (BLOG_TEACHER_KEY) [当前: ${teacher ? '已设置' : '未设置'}]: `)).trim() || teacher;
    }
    rl.close();
    console.log('');
  }

  return { norm, priv, teacher };
}

// ==========================================
// 5. Markdown Scanner & AST Transformer
// ==========================================

export function findMarkdownFiles(dir = docsDir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    if (['node_modules', '.vitepress', 'dist', 'cache', '.git', 'guides'].includes(item.name)) continue;
    if (item.name === 'ENCRYPTION_GUIDE.md') continue;
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

export async function transformMarkdownContent(content, { action, keys, requireKeys = false }) {
  let newContent = content;
  let modified = false;
  const stats = { processed: 0, skipped: 0, failed: 0 };

  const getKeyForType = (type) => {
    if (type === 'priv') return keys.priv;
    if (type === 'teacher') return keys.teacher;
    return keys.norm;
  };

  const processValue = async (value, keyType, extraContext = '') => {
    const rawVal = value.trim();
    if (!rawVal) return { value, changed: false };

    const key = getKeyForType(keyType);

    if (action === 'decrypt_hex') {
      if (isHexCipher(rawVal)) {
        if (!key) {
          if (requireKeys) throw new Error(`缺少用于解密 ${keyType} 的密钥 (密文: ${rawVal.slice(0, 16)}...)`);
          stats.failed++;
          return { value, changed: false };
        }
        const res = decryptHex(rawVal, key);
        if (res.success) {
          stats.processed++;
          return { value: res.plaintext, changed: true };
        } else {
          stats.failed++;
          return { value, changed: false };
        }
      } else {
        stats.skipped++;
        return { value, changed: false };
      }
    }

    if (action === 'encrypt_hex') {
      if (isHexCipher(rawVal)) {
        stats.skipped++;
        return { value, changed: false };
      }
      if (!key) {
        if (requireKeys) throw new Error(`缺少用于加密 ${keyType} 的密钥 (明文: "${rawVal.slice(0, 20)}...")`);
        stats.failed++;
        return { value, changed: false };
      }
      const cipher = encryptHex(rawVal, key);
      stats.processed++;
      return { value: cipher, changed: true };
    }

    if (action === 'decrypt_base64') {
      if (isBase64Cipher(rawVal)) {
        if (!key) {
          if (requireKeys) throw new Error(`缺少用于解密 ${keyType} 的密钥 (密文: ${rawVal.slice(0, 16)}...)`);
          stats.failed++;
          return { value, changed: false };
        }
        const res = await decryptBase64(rawVal, key);
        if (res.success) {
          stats.processed++;
          return { value: res.plaintext, changed: true };
        } else {
          stats.failed++;
          return { value, changed: false };
        }
      } else {
        stats.skipped++;
        return { value, changed: false };
      }
    }

    if (action === 'encrypt_base64') {
      if (isBase64Cipher(rawVal)) {
        stats.skipped++;
        return { value, changed: false };
      }
      if (!key) {
        if (requireKeys) throw new Error(`缺少用于加密 ${keyType} 的密钥 (明文: "${rawVal.slice(0, 20)}...")`);
        stats.failed++;
        return { value, changed: false };
      }
      const cipher = await encryptBase64(rawVal, key);
      stats.processed++;
      return { value: cipher, changed: true };
    }

    return { value, changed: false };
  };

  // 1. Process custom tags: <ec>, <ecp>, <tc>
  const tagConfigs = [
    { tag: 'ec', type: 'norm' },
    { tag: 'ecp', type: 'priv' },
    { tag: 'tc', type: 'teacher' },
  ];

  for (const { tag, type } of tagConfigs) {
    const regex = new RegExp(`(<${tag}(\\s+[^>]*)?>)([\\s\\S]*?)(<\\/${tag}>)`, 'gi');
    const matches = [...newContent.matchAll(regex)];
    for (const match of matches) {
      const fullMatch = match[0];
      const openTag = match[1];
      const innerText = match[3];
      const closeTag = match[4];

      const res = await processValue(innerText, type, tag);
      if (res.changed) {
        newContent = newContent.replace(fullMatch, `${openTag}${res.value}${closeTag}`);
        modified = true;
      }
    }
  }

  // 2. Process HTML element tags: <(span|p|div|...) class="encrypt|e|encpp|e+|eteacher" ...>
  const classConfigs = [
    { pattern: /<([a-zA-Z0-9]+)\s+([^>]*class=['"][^'"]*\b(encrypt|e)\b[^'"]*['"][^>]*)>([\s\S]*?)<\/\1>/gi, type: 'norm' },
    { pattern: /<([a-zA-Z0-9]+)\s+([^>]*class=['"][^'"]*\b(encpp|e\+)\b[^'"]*['"][^>]*)>([\s\S]*?)<\/\1>/gi, type: 'priv' },
    { pattern: /<([a-zA-Z0-9]+)\s+([^>]*class=['"][^'"]*\b(eteacher)\b[^'"]*['"][^>]*)>([\s\S]*?)<\/\1>/gi, type: 'teacher' },
  ];

  for (const { pattern, type } of classConfigs) {
    const matches = [...newContent.matchAll(pattern)];
    for (const match of matches) {
      const fullMatch = match[0];
      const tagName = match[1];
      const attrs = match[2];
      const innerText = match[4];

      const res = await processValue(innerText, type, tagName);
      if (res.changed) {
        newContent = newContent.replace(fullMatch, `<${tagName} ${attrs}>${res.value}</${tagName}>`);
        modified = true;
      }
    }
  }

  return { newContent, modified, stats };
}
