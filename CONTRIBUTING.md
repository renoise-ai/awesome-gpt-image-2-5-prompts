# Contributing to Awesome GPT Image 2.5 Prompts

Thanks for your interest! This collection holds **text-to-image prompts for ChatGPT Images 2.5**, each paired with the image it produced.

## What belongs here

- Prompts that **reproduce from the text alone**. Anything that needs a reference image, edits an existing picture, or depends on a multi-turn conversation belongs somewhere else — a reader who copies the prompt has to be able to get that image.
- The **exact prompt**, not a paraphrase or an excerpt. A prompt cut off mid-sentence is worse than no prompt.
- A result image you have the right to share, with the original author credited.

## Adding a prompt

1. Fork the repository.
2. Add one JSON file per prompt in `data/prompts/`, named `{id}.json`, following `data/schema.json`.
3. Validate: `pnpm install && pnpm run validate`.
4. Open a pull request.

Most rows here come from the automated sync (`pnpm sync`) against the upstream library, which is rebuilt from public posts. Sharing your prompt together with the image on X is the other way in.

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique slug (e.g. `vintage-national-park-stamps`) |
| `title` | string | Short title |
| `content` | string | The exact prompt text |
| `language` | string | Language of the prompt text: `en`, `zh` or `ja` |
| `thumbnail` | string | The generated image — must be an `https://assets.renoise.ai/...` URL |

Covers have to be re-hosted rather than hotlinked: a third-party image URL breaks the README the day the original post is deleted. Ask a maintainer to upload yours, or point at an existing asset.

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | One line about the effect (max 200 chars) |
| `author` | object | `{ "name": "...", "link": "..." }` |
| `sourceLink` | string | Link to the original post |
| `sourcePublishedAt` | string | Date (YYYY-MM-DD) |
| `referenceImages` | string[] | Rarely used — see "What belongs here" |
| `featured` | boolean | Pin to the top of the README |
| `tags` | string[] | Tags for filtering |
| `tips` | string | Usage tips |

### Example

```json
{
  "id": "vintage-national-park-stamps",
  "title": "Vintage national park stamp sheet",
  "content": "A sheet of six vintage-style national park postage stamps, each with a different landscape…",
  "language": "en",
  "author": { "name": "Creator Name", "link": "https://x.com/creator" },
  "sourceLink": "https://x.com/creator/status/123",
  "sourcePublishedAt": "2026-09-09",
  "thumbnail": "https://assets.renoise.ai/static/seo/showcase/gpt-image-2.5/123.webp",
  "tags": ["Layout & Typography"]
}
```

## Regenerating the README

`README.md` is generated — edit `scripts/utils/i18n.ts` or the data, never the README itself:

```bash
pnpm run generate
```

## Code of Conduct

- Only submit prompts you have the right to share.
- Always credit the original author.
- No NSFW or harmful content.
