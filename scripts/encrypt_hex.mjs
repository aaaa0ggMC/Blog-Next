import fs from 'node:fs';
import path from 'node:path';
import { loadKeys, findMarkdownFiles, transformMarkdownContent } from './crypto-shared.mjs';

async function main() {
  console.log('🔒 [encrypt_hex] 正在扫描 Markdown 文件并将明文加密为 Hex 密文 (AES-256-CFB)...\n');

  const keys = await loadKeys({ interactive: true });
  const files = findMarkdownFiles();

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let modifiedFilesCount = 0;

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');

    try {
      const { newContent, modified, stats } = await transformMarkdownContent(content, {
        action: 'encrypt_hex',
        keys,
        requireKeys: false,
      });

      totalProcessed += stats.processed;
      totalSkipped += stats.skipped;
      totalFailed += stats.failed;

      if (modified) {
        fs.writeFileSync(file, newContent, 'utf-8');
        modifiedFilesCount++;
        console.log(`✅ [加密成功] ${relativePath} (已加密 ${stats.processed} 处)`);
      }
    } catch (err) {
      console.error(`❌ [错误] 处理 ${relativePath} 失败:`, err.message);
    }
  }

  console.log('\n========================================');
  console.log(`🎉 处理完成！`);
  console.log(`- 扫描文件数: ${files.length}`);
  console.log(`- 修改文件数: ${modifiedFilesCount}`);
  console.log(`- 成功加密字段: ${totalProcessed}`);
  console.log(`- 跳过字段 (已是Hex): ${totalSkipped}`);
  if (totalFailed > 0) {
    console.log(`- 缺少密钥跳过字段: ${totalFailed}`);
  }
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
