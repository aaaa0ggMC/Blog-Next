import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadKeys, transformMarkdownContent } from './crypto-shared.mjs';
import { loadEnvKeys, transformMarkdownPaths } from './repo-path-transform.mjs';

async function main() {
  // 严格守卫：阻止直接 git commit，强制要求使用 fastpush
  if (!process.env.FASTPUSH_ACTIVE) {
    console.error('\n' + '='.repeat(72));
    console.error('🛑 [Git Pre-commit 拦截] 本项目已启用双分支影子工作区，禁止直接使用 git commit！');
    console.error('');
    console.error('👉 请使用专属发布脚本进行提交与同步:');
    console.error('   ./fastpush.sh "你的 commit 说明"');
    console.error('   或: pnpm fastpush "你的 commit 说明"');
    console.error('='.repeat(72) + '\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Pre-commit hook unexpected error:', err);
  process.exit(1);
});
