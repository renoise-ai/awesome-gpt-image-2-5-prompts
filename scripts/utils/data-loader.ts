import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

export interface PromptTranslation {
  title: string;
  content: string;
  description?: string;
  tips?: string;
}

export interface ProcessedPrompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  language: string;
  author?: { name: string; link?: string };
  sourceLink?: string;
  sourcePublishedAt?: string;
  thumbnail: string;
  videoUrl?: string;
  referenceImages?: string[];
  featured?: boolean;
  tags?: string[];
  tips?: string;
  translations?: Record<string, PromptTranslation>;
}

const PROMPTS_DIR = resolve(import.meta.dirname!, '..', '..', 'data', 'prompts');
const TIPS_DIR = resolve(import.meta.dirname!, '..', '..', 'data', 'tips');

function loadFromDir(dir: string): ProcessedPrompt[] {
  let files: string[];
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
  const items: ProcessedPrompt[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(resolve(dir, file), 'utf-8'));
      items.push(data);
    } catch (e) {
      console.warn(`⚠️  Skipping ${file}: ${(e as Error).message}`);
    }
  }
  return items;
}

function sortByDateDesc(items: ProcessedPrompt[]): ProcessedPrompt[] {
  return items.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const da = a.sourcePublishedAt || '';
    const db = b.sourcePublishedAt || '';
    return db.localeCompare(da);
  });
}

export function loadPrompts(): ProcessedPrompt[] {
  return sortByDateDesc(loadFromDir(PROMPTS_DIR));
}

export function loadTips(): ProcessedPrompt[] {
  return sortByDateDesc(loadFromDir(TIPS_DIR));
}

/**
 * Get localized field value for a prompt.
 * Falls back to English if translation not available.
 */
export function getLocalized(
  prompt: ProcessedPrompt,
  field: 'title' | 'content' | 'description' | 'tips',
  locale: string,
): string | undefined {
  // English → return original
  if (locale === 'en') return prompt[field];

  // Check translations
  const tr = prompt.translations?.[locale];
  if (tr && tr[field]) return tr[field];

  // Fallback to English
  return prompt[field];
}
