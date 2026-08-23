import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const hookDir = path.join(projectRoot, '.git', 'hooks');
const hookPath = path.join(hookDir, 'pre-commit');

const hookScript = `#!/bin/sh
# Auto-generated Git pre-commit hook for Blog encryption check
node scripts/precommit.mjs
`;

if (!fs.existsSync(hookDir)) {
  fs.mkdirSync(hookDir, { recursive: true });
}

fs.writeFileSync(hookPath, hookScript, { encoding: 'utf-8', mode: 0o755 });
try {
  fs.chmodSync(hookPath, 0o755);
} catch (e) {}

console.log('✅ Git pre-commit 钩子已成功安装至 .git/hooks/pre-commit');
