/**
 * Pull the library from the Prompts-Lib API into data/prompts/*.json.
 *
 * Upstream is the same store the Renoise gallery reads, filtered to this
 * repo's model. Run it by hand when you want the repo to catch up — there is
 * no scheduled job, same as the Seedance repos.
 *
 *   pnpm sync
 *   UPSTREAM_MODEL=gpt-image-2.5 pnpm sync     # override the model
 *
 * Files are keyed by upstream row id, so a re-run updates rows in place and
 * deletes the ones that disappeared upstream.
 */
import { writeFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const UPSTREAM_URL =
  process.env.UPSTREAM_DATA_URL?.trim() || 'https://talented-lioness-5423.edgespark.app';
const MODEL = process.env.UPSTREAM_MODEL?.trim() || 'gpt-image-2.5';
const PAGE_SIZE = 100;

const DATA_DIR = join(import.meta.dirname ?? process.cwd(), '..', 'data');
const PROMPTS_DIR = join(DATA_DIR, 'prompts');

/** Row shape of `GET /api/public/items` (the columns this repo uses). */
interface UpstreamRow {
  id: string;
  name: string | null;
  content: string | null;
  text: string | null;
  language: string | null;
  author_name: string | null;
  author_handle: string | null;
  url: string | null;
  tags: string | null;
  cover_storage_uri: string | null;
  video_thumbnail: string | null;
  created_at: string | null;
}

interface SchemaPrompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  language: string;
  author: { name: string; link?: string };
  sourceLink?: string;
  sourcePublishedAt?: string;
  thumbnail: string;
  featured: boolean;
  tags: string[];
}

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function slugify(text: string, fallbackId: string, maxLen = 55): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug || slug.length < 3) return `item-${fallbackId.slice(-8)}`;
  if (slug.length <= maxLen) return slug;
  const cut = slug.slice(0, maxLen);
  const lastDash = cut.lastIndexOf('-');
  return lastDash > 20 ? cut.slice(0, lastDash) : cut;
}

function parseDate(raw: string): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

function parseTags(raw: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((t: unknown) => typeof t === 'string' && t) : [];
  } catch {
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
}

/**
 * The cover must be a URL a GitHub README can render directly. The write
 * contract requires `cover_storage_uri` to be an https CDN URL; rows still on
 * the legacy `s3://` form have no renderable cover and are skipped rather than
 * published with a broken image.
 */
function thumbnailOf(row: UpstreamRow): string | undefined {
  const cover = str(row.cover_storage_uri);
  if (/^https?:\/\//.test(cover)) return cover;
  const fallback = str(row.video_thumbnail);
  return /^https?:\/\//.test(fallback) ? fallback : undefined;
}

function toSchemaPrompt(row: UpstreamRow, thumbnail: string): SchemaPrompt {
  const content = str(row.content) || str(row.text);
  const titleRaw = str(row.name) || content || row.id;
  const title = titleRaw.length > 60 ? `${titleRaw.slice(0, 60).trimEnd()}...` : titleRaw;
  const handle = str(row.author_handle).replace(/^@/, '');

  return {
    id: slugify(titleRaw, row.id),
    title,
    content,
    language: str(row.language) || 'en',
    author: {
      name: str(row.author_name) || handle || 'Unknown',
      ...(handle ? { link: `https://x.com/${handle}` } : {}),
    },
    sourceLink: str(row.url) || undefined,
    sourcePublishedAt: parseDate(str(row.created_at)),
    thumbnail,
    featured: false,
    tags: parseTags(str(row.tags)),
  };
}

function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

async function fetchAll(): Promise<UpstreamRow[]> {
  const rows: UpstreamRow[] = [];
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({
      type: 'prompt',
      model: MODEL,
      sort: 'likes',
      order: 'desc',
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    const url = `${UPSTREAM_URL}/api/public/items?${params}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.error(`  Failed: HTTP ${res.status} on ${url}`);
      process.exit(1);
    }
    const page = (await res.json()) as { data: UpstreamRow[]; total: number; has_more: boolean };
    rows.push(...page.data);
    console.log(`  ${rows.length}/${page.total}`);
    if (!page.has_more || page.data.length === 0) return rows;
    offset += page.data.length;
  }
}

function syncDir(dir: string, items: SchemaPrompt[]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const newFiles = new Set<string>();
  for (const item of items) {
    const filename = `${item.id}.json`;
    newFiles.add(filename);
    const cleaned = removeUndefined(item as unknown as Record<string, unknown>);
    writeFileSync(join(dir, filename), `${JSON.stringify(cleaned, null, 2)}\n`);
  }

  let removed = 0;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    if (file === 'example.json') continue;
    if (!newFiles.has(file)) {
      unlinkSync(join(dir, file));
      removed++;
    }
  }

  console.log(`  ${dir}: wrote ${newFiles.size}, removed ${removed} stale files`);
}

async function main() {
  console.log(`=== Upstream sync (model=${MODEL}) ===\n`);
  const rows = await fetchAll();

  const prompts: SchemaPrompt[] = [];
  const ids = new Set<string>();
  let skippedNoCover = 0;
  let skippedNoContent = 0;

  for (const row of rows) {
    if (!str(row.content) && !str(row.text)) {
      skippedNoContent++;
      continue;
    }
    const thumbnail = thumbnailOf(row);
    if (!thumbnail) {
      skippedNoCover++;
      continue;
    }
    const prompt = toSchemaPrompt(row, thumbnail);
    // Two rows can slugify to the same name; keep both, distinguishable.
    if (ids.has(prompt.id)) prompt.id = `${prompt.id}-${ids.size}`;
    ids.add(prompt.id);
    prompts.push(prompt);
  }

  syncDir(PROMPTS_DIR, prompts);
  console.log(
    `\nDone: ${prompts.length} prompts (skipped ${skippedNoCover} without a usable cover, ${skippedNoContent} without a prompt body)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
