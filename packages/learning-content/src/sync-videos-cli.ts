import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { isMap, isSeq, parseDocument } from 'yaml';
import { contentRoot } from './files';

/**
 * Verifies every video in content/videos.yaml with YouTube's official oEmbed endpoint and fills in the
 * title and author from YouTube itself, so nothing is typed by hand. Needs internet access.
 *
 *   pnpm content:videos           verify and update the file
 *   pnpm content:videos --check   verify only, never write
 */
const checkOnly = process.argv.includes('--check');
const file = path.join(contentRoot(), 'videos.yaml');
const document = parseDocument(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
const videos = document.get('videos', true);
if (!isSeq(videos)) throw new Error('videos.yaml must contain a "videos:" list.');

const today = new Date().toISOString().slice(0, 10);
let failures = 0;

async function verify(id: string): Promise<{ title: string; author: string } | string> {
  const target = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
  try {
    const response = await fetch(target, { headers: { 'User-Agent': 'developer-learning-os/0.1 (content check)' } });
    if (response.status === 401 || response.status === 403) return 'embedding is disabled by the owner';
    if (response.status === 404) return 'video not found or private';
    if (!response.ok) return `YouTube answered HTTP ${response.status}`;
    const data = (await response.json()) as { title?: string; author_name?: string };
    if (!data.title || !data.author_name) return 'oEmbed response had no title or author';
    return { title: data.title, author: data.author_name };
  } catch (error) {
    return `network error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

for (const item of videos.items) {
  if (!isMap(item)) continue;
  const rawId = item.get('id');
  const id = typeof rawId === 'string' ? rawId : '';
  const result = await verify(id);
  if (typeof result === 'string') {
    failures += 1;
    console.error(`FAIL ${id}: ${result}`);
    continue;
  }
  if (!checkOnly) {
    item.set('title', result.title);
    item.set('author', result.author);
    item.set('verifiedAt', today);
  }
  console.log(`ok   ${id} | ${result.author} | ${result.title}`);
}

if (!checkOnly) writeFileSync(file, String(document));
console.log(failures === 0 ? `\nAll ${videos.items.length} videos verified.` : `\n${failures} video(s) failed verification.`);
process.exitCode = failures === 0 ? 0 : 1;
