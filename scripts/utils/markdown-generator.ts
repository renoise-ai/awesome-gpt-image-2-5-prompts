import type { ProcessedPrompt } from './data-loader.js';
import { getLocalized } from './data-loader.js';
import { t, formatDateLocalized } from './i18n.js';

const MAX_PROMPTS_TO_DISPLAY = 100;
const RENOISE_BASE_URL = 'https://renoise.ai';
const SHOWCASE_PATH = '/showcase/awesome-gpt-image-2-5-prompts';
const UTM_QUERY = 'utm_source=github&utm_medium=readme&utm_campaign=gpt-image-2-5-prompts';
const REPO_OWNER = 'renoise-ai';
const REPO_NAME = 'awesome-gpt-image-2-5-prompts';

/** Build a locale-aware renoise.ai URL with UTM attribution params. */
function renoiseUrl(locale: string, path: string): string {
  return `${RENOISE_BASE_URL}${getLocalePrefix(locale)}${path}?${UTM_QUERY}`;
}

export interface LanguageConfig {
  code: string;
  name: string;
  readmeFileName: string;
}

// English only for now. Adding a locale means adding its table to i18n.ts and
// a row here — nothing else in this file is locale-specific.
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', readmeFileName: 'README.md' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function getLocalePrefix(locale: string): string {
  if (locale === 'en') return '';
  return `/${locale}`;
}

function generatePromptBlock(p: ProcessedPrompt, locale: string, isFeatured: boolean): string {
  const lines: string[] = [];

  const localTitle = getLocalized(p, 'title', locale) || p.title;
  const localContent = getLocalized(p, 'content', locale) || p.content;
  const localDesc = getLocalized(p, 'description', locale);
  const localTips = getLocalized(p, 'tips', locale);

  lines.push(`### ${localTitle}`);
  lines.push('');

  if (isFeatured) {
    lines.push(`\`${t('featured', locale)}\``);
    lines.push('');
  }

  if (localDesc) {
    const cleanDesc = localDesc
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
    lines.push(`> ${cleanDesc}`);
    lines.push('');
  }

  lines.push(`#### 📝 ${t('prompt', locale)}`);
  lines.push('');
  lines.push('```');
  lines.push(localContent);
  lines.push('```');
  lines.push('');

  if (localTips) {
    lines.push(`#### 💡 ${t('tips', locale)}`);
    lines.push('');
    lines.push(localTips);
    lines.push('');
  }

  // Image library: the result IS the thumbnail, so there is no clip to link to.
  if (p.thumbnail) {
    lines.push(`![${t('imagePreview', locale)}](${p.thumbnail})`);
    lines.push('');
  }

  if (p.referenceImages && p.referenceImages.length > 0) {
    lines.push(`**${t('referenceImage', locale)}:**`);
    for (const img of p.referenceImages) {
      lines.push(`![${t('referenceImage', locale)}](${img})`);
    }
    lines.push('');
  }

  const meta: string[] = [];
  if (p.author) {
    const authorStr = p.author.link
      ? `**${t('author', locale)}:** [${p.author.name}](${p.author.link})`
      : `**${t('author', locale)}:** ${p.author.name}`;
    meta.push(authorStr);
  }
  if (p.sourceLink) {
    meta.push(`**${t('source', locale)}:** [Link](${p.sourceLink})`);
  }
  if (p.sourcePublishedAt) {
    meta.push(`**${t('published', locale)}:** ${formatDateLocalized(p.sourcePublishedAt, locale)}`);
  }
  if (meta.length) {
    lines.push(meta.join(' | '));
    lines.push('');
  }

  if (p.tags && p.tags.length > 0) {
    lines.push(p.tags.map(tag => `\`${tag}\``).join(' '));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

export function generateReadme(
  prompts: ProcessedPrompt[],
  tips: ProcessedPrompt[],
  locale: string = 'en',
): string {
  const lines: string[] = [];
  const galleryUrl = renoiseUrl(locale, SHOWCASE_PATH);

  const featured = prompts.filter(p => p.featured);
  const regular = prompts.filter(p => !p.featured);
  const displayPrompts = regular.slice(0, MAX_PROMPTS_TO_DISPLAY);
  const totalCount = prompts.length;
  const today = new Date().toISOString().split('T')[0];

  // Header
  lines.push(`# 🖼️ ${t('title', locale)}`);
  lines.push('');
  lines.push(`[![Awesome](https://awesome.re/badge.svg)](https://awesome.re) [![GitHub stars](https://img.shields.io/github/stars/${REPO_OWNER}/${REPO_NAME}?style=social)](https://github.com/${REPO_OWNER}/${REPO_NAME}) ![License](https://img.shields.io/badge/license-CC%20BY%204.0-green) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/${REPO_OWNER}/${REPO_NAME}/pulls)`);
  lines.push('');
  lines.push(`${t('subtitle', locale)}`);
  lines.push('');
  // Renoise hero CTA — primary traffic driver, above the fold
  const heroCtaLink = `[${t('runItCtaLink', locale)}](${galleryUrl})`;
  lines.push(t('runItCta', locale).replace('{link}', heroCtaLink));
  lines.push('');
  lines.push(`> ⚠️ **${t('copyrightNotice', locale)}**`);
  lines.push('');

  // TOC
  lines.push('---');
  lines.push('');
  lines.push(`## 📖 ${t('tableOfContents', locale)}`);
  lines.push('');
  lines.push(`* [🌐 ${t('viewInGallery', locale)}](#-${slugify(t('viewInGallery', locale))})`);
  lines.push(`* [🤔 ${t('whatIs', locale)}](#-${slugify(t('whatIs', locale))})`);
  lines.push(`* [📊 ${t('statistics', locale).replace('📊 ', '')}](#-${slugify(t('statistics', locale).replace('📊 ', ''))})`);
  if (featured.length > 0) {
    lines.push(`* [${t('featuredSection', locale)}](#-featured-prompts)`);
  }
  lines.push(`* [${t('allPrompts', locale)}](#-all-prompts)`);
  if (tips.length > 0) {
    lines.push(`* [${t('tipsSection', locale)}](#-usage-tips)`);
  }
  lines.push(`* [${t('contributing', locale)}](#-contributing)`);
  lines.push(`* [${t('license', locale)}](#-license)`);
  lines.push(`* [${t('acknowledgements', locale)}](#-acknowledgements)`);
  lines.push(`* [${t('starHistory', locale)}](#-star-history)`);
  lines.push('');

  // Gallery CTA
  lines.push('---');
  lines.push('');
  lines.push(`## 🌐 ${t('viewInGallery', locale)}`);
  lines.push('');
  lines.push(`**👉 [${t('browseGallery', locale)}](${galleryUrl})**`);
  lines.push('');
  lines.push(`| ${t('featureCol', locale)} | ${t('githubReadmeCol', locale)} | ${t('galleryCol', locale)} |`);
  lines.push(`|---------|-------------|---------|`);
  lines.push(`| ${t('browsingFeature', locale)} | ${t('readmeBrowsing', locale)} | ${t('galleryBrowsing', locale)} |`);
  lines.push(`| ${t('searchFeature', locale)} | ${t('ctrlFOnly', locale)} | ${t('fuzzySearch', locale)} |`);
  lines.push(`| ${t('mobileFeature', locale)} | ${t('mobileBasic', locale)} | ${t('mobileResponsive', locale)} |`);
  lines.push(`| ${t('coverageFeature', locale)} | ${t('readmeCoverage', locale)} | ${t('galleryCoverage', locale)} |`);
  lines.push('');

  // Explore more on Renoise — contextual internal links to SEO pages
  const exploreLinks = [
    `[${t('modelPage', locale)}](${renoiseUrl(locale, '/models/gpt-image-2-5')})`,
    `[${t('blogExplainer', locale)}](${renoiseUrl(locale, '/blog/chatgpt-images-2-5-explained')})`,
    `[${t('featureGptImage2', locale)}](${renoiseUrl(locale, '/features/gpt-image-2')})`,
    `[${t('siblingSeedance', locale)}](${renoiseUrl(locale, '/showcase/awesome-seedance-2-5-prompts')})`,
  ].join(' · ');
  lines.push(`**${t('exploreMore', locale)}:** ${exploreLinks}`);
  lines.push('');

  // What is Seedance 2.5
  lines.push('---');
  lines.push('');
  lines.push(`## 🤔 ${t('whatIs', locale)}`);
  lines.push('');
  lines.push(t('whatIsContent', locale));
  lines.push('');

  // Statistics
  lines.push('---');
  lines.push('');
  lines.push(`## 📊 ${t('statistics', locale).replace('📊 ', '')}`);
  lines.push('');
  lines.push(`| ${t('metricCol', locale)} | ${t('countCol', locale)} |`);
  lines.push(`|--------|-------|`);
  lines.push(`| 📝 ${t('totalPrompts', locale)} | **${totalCount}** |`);
  lines.push(`| ⭐ ${t('featuredPrompts', locale)} | **${featured.length}** |`);
  lines.push(`| 💡 ${t('tipsAndTutorials', locale)} | **${tips.length}** |`);
  lines.push(`| 🔄 ${t('lastUpdated', locale)} | **${today}** |`);
  lines.push('');

  // Featured prompts
  if (featured.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push(`## ${t('featuredSection', locale)}`);
    lines.push('');
    for (const p of featured) {
      lines.push(generatePromptBlock(p, locale, true));
    }
  }

  // All prompts
  lines.push('---');
  lines.push('');
  lines.push(`## ${t('allPrompts', locale)}`);
  lines.push('');
  lines.push(`> 📝 ${t('sortedByDate', locale)}`);
  lines.push('');
  for (const p of displayPrompts) {
    lines.push(generatePromptBlock(p, locale, false));
  }

  // More prompts notice
  if (regular.length > MAX_PROMPTS_TO_DISPLAY) {
    const remaining = regular.length - MAX_PROMPTS_TO_DISPLAY;
    lines.push(`## 📚 ${t('morePrompts', locale)}`);
    lines.push('');
    lines.push(`### 🎯 ${remaining} ${t('moreNotShown', locale)}`);
    lines.push('');
    lines.push(`**👉 [${t('browseGallery', locale)}](${galleryUrl})**`);
    lines.push('');
  }

  // Tips section
  if (tips.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push(`## ${t('tipsSection', locale)}`);
    lines.push('');
    lines.push(`> ${t('tipsSubtitle', locale)}`);
    lines.push('');
    const displayTips = tips.slice(0, 30);
    for (const tip of displayTips) {
      lines.push(generatePromptBlock(tip, locale, false));
    }
    if (tips.length > 30) {
      const remaining = tips.length - 30;
      lines.push(`*... ${t('andMoreTips', locale).replace('{n}', String(remaining))} [${t('viewAllInGallery', locale)}](${galleryUrl})*`);
      lines.push('');
    }
  }

  // Contributing
  lines.push('---');
  lines.push('');
  lines.push(`## ${t('contributing', locale)}`);
  lines.push('');
  lines.push(t('contributingContent', locale));
  lines.push('');

  // License
  lines.push(`## ${t('license', locale)}`);
  lines.push('');
  lines.push(t('licenseContent', locale));
  lines.push('');

  // Acknowledgements
  lines.push(`## ${t('acknowledgements', locale)}`);
  lines.push('');
  lines.push(t('acknowledgementsContent', locale));
  lines.push('');

  // Star History
  lines.push(`## ${t('starHistory', locale)}`);
  lines.push('');
  lines.push(`[![Star History Chart](https://api.star-history.com/svg?repos=${REPO_OWNER}/${REPO_NAME}&type=Date)](https://star-history.com/#${REPO_OWNER}/${REPO_NAME}&Date)`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`**🌐 [${t('viewInGallery', locale)}](${galleryUrl})** • **🖼️ [${t('modelPage', locale)}](${renoiseUrl(locale, '/models/gpt-image-2-5')})** • **📝 ${t('submitPrompt', locale)}** • **⭐ ${t('starRepo', locale)}**`);
  lines.push('');
  lines.push(`🤖 ${t('autoGenerated', locale)} ${new Date().toISOString()}`);
  lines.push('');

  return lines.join('\n');
}
