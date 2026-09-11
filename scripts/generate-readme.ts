import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadPrompts, loadTips } from './utils/data-loader.js';
import { generateReadme, SUPPORTED_LANGUAGES } from './utils/markdown-generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

async function main() {
  const prompts = loadPrompts();
  const tips = loadTips();
  console.log(`\n📦 Loaded ${prompts.length} prompts + ${tips.length} tips`);

  if (prompts.length === 0) {
    console.log('⚠️  No prompts found. Add JSON files to data/prompts/ first.');
    return;
  }

  for (const lang of SUPPORTED_LANGUAGES) {
    console.log(`  Processing: ${lang.name} (${lang.code})...`);
    const readme = generateReadme(prompts, tips, lang.code);
    const outPath = resolve(ROOT, lang.readmeFileName);
    writeFileSync(outPath, readme, 'utf-8');
    console.log(`  ✅ ${lang.readmeFileName} (${(readme.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\n🎉 Generated ${SUPPORTED_LANGUAGES.length} README files!`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
