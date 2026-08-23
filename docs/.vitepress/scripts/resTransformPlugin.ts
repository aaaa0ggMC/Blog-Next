import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { decryptBase64, encryptBase64, isBase64Cipher, parseEnvFile } from '../../../scripts/crypto-shared.mjs';
import { encryptPath, decryptPath, isPathEncrypted } from '../../../scripts/path-crypto.mjs';

const MIME_MAP: Record<string, string> = {
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
};

export function vitepressResTransformPlugin(): Plugin {
  let projectRoot = '';
  let pathSecret = '';
  let keys: string[] = [];
  let isEnabled = true;

  return {
    name: 'vitepress-res-transform-plugin',
    enforce: 'pre',
    configResolved(config) {
      projectRoot = path.resolve(config.root, '..');
      const localEnv = parseEnvFile(path.join(projectRoot, '.env.local'));
      const rootEnv = parseEnvFile(path.join(projectRoot, '.env'));

      pathSecret =
        process.env.R2_PATH_SECRET ||
        localEnv.R2_PATH_SECRET ||
        rootEnv.R2_PATH_SECRET ||
        process.env.R2_API_TOKEN ||
        localEnv.R2_API_TOKEN ||
        rootEnv.R2_API_TOKEN ||
        '';

      keys = [
        process.env.BLOG_GPG_KEY || localEnv.BLOG_GPG_KEY || rootEnv.BLOG_GPG_KEY,
        process.env.BLOG_SEC_KEY || localEnv.BLOG_SEC_KEY || rootEnv.BLOG_SEC_KEY,
        process.env.BLOG_TEACHER_KEY || localEnv.BLOG_TEACHER_KEY || rootEnv.BLOG_TEACHER_KEY,
      ].filter(Boolean) as string[];

      if (!pathSecret) {
        isEnabled = false;
      }
    },
    configureServer(server) {
      // 本地开发服务器中间件：当开启 useLocal 时，自动解密密文并提供本地真实资源
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        const match = url.match(/^(?:\/Blog)?\/res\/(.+?)(?:\?.*)?$/);
        if (match && pathSecret) {
          const encPart = match[1];
          const fullEnc = '/' + encPart;
          if (isPathEncrypted(fullEnc, pathSecret)) {
            try {
              const plainRel = decryptPath(fullEnc, pathSecret);
              const normalizedRel = plainRel.startsWith('/') ? plainRel.slice(1) : plainRel;
              const localFile = path.join(projectRoot, 'docs/public/res', normalizedRel);
              if (fs.existsSync(localFile)) {
                const ext = path.extname(localFile).toLowerCase();
                const mime = MIME_MAP[ext] || 'application/octet-stream';
                res.setHeader('Content-Type', mime);
                return fs.createReadStream(localFile).pipe(res);
              }
            } catch {}
          }
        }
        next();
      });
    },
    async transform(code, id) {
      if (!isEnabled) return null;

      // 1. Transform Markdown files
      if (id.endsWith('.md')) {
        // Regex matching any content="..." or content='...' in tags
        const regex = /(<\w+[^>]*?\bcontent=["'])([^"']+)(["'][^>]*?>)/gi;
        let matches: Array<{ full: string; prefix: string; val: string; suffix: string; index: number }> = [];
        let match: RegExpExecArray | null;
        while ((match = regex.exec(code)) !== null) {
          matches.push({ full: match[0], prefix: match[1], val: match[2], suffix: match[3], index: match.index });
        }

        if (matches.length === 0) return null;

        let result = '';
        let lastIndex = 0;

        for (const m of matches) {
          result += code.slice(lastIndex, m.index);
          let newVal = m.val;

          const isNoMangleProp = /\b(no-mangle|no_mangle|raw)\b/i.test(m.full);
          const isAtPrefix = newVal.startsWith('@/');

          if (isNoMangleProp || isAtPrefix) {
            if (isAtPrefix) {
              newVal = '/' + newVal.slice(2);
            }
            // 裸传模式：保持原样路径，不进行任何哈希混淆/加密
          } else if (newVal.startsWith('/')) {
            newVal = '/' + encryptPath(newVal, pathSecret);
          } else if (isBase64Cipher(newVal)) {
            let decrypted: string | null = null;
            let matchedKey: string | null = null;

            for (const k of keys) {
              const res = await decryptBase64(newVal, k);
              if (res.success) {
                decrypted = res.plaintext;
                matchedKey = k;
                break;
              }
            }

            if (!decrypted) {
              throw new Error(
                `❌ [Security Error] 在文件 ${id} 中检测到加密密文，但本地未配置对应的解密密钥（BLOG_SEC_KEY / BLOG_GPG_KEY / BLOG_TEACHER_KEY）！构建已阻断。`
              );
            }

            if (decrypted.startsWith('@/')) {
              newVal = await encryptBase64('/' + decrypted.slice(2), matchedKey!);
            } else if (decrypted.startsWith('/')) {
              const encPlain = '/' + encryptPath(decrypted, pathSecret);
              newVal = await encryptBase64(encPlain, matchedKey!);
            }
          }

          result += m.prefix + newVal + m.suffix;
          lastIndex = m.index + m.full.length;
        }

        result += code.slice(lastIndex);
        return { code: result, map: null };
      }

      // 2. Transform homePeriods.ts
      if (id.endsWith('homePeriods.ts')) {
        const hpRegex = /(['"]\/imgs\/home_bg\/[^'"]+['"])/g;
        let hpModified = false;
        const result = code.replace(hpRegex, (match, p1) => {
          const quote = p1[0];
          const plainPath = p1.slice(1, -1);
          const enc = '/' + encryptPath(plainPath, pathSecret);
          hpModified = true;
          return `${quote}${enc}${quote}`;
        });
        if (hpModified) {
          return { code: result, map: null };
        }
      }

      return null;
    },
  };
}
