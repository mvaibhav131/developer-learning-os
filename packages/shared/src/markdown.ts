/** Turns heading text into an anchor id. The web app and the content checks must agree on this. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

export interface MarkdownHeading {
  level: 1 | 2 | 3;
  text: string;
  id: string;
}

/** Lists `#`, `##` and `###` headings, ignoring anything inside fenced code blocks. */
export function extractHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  let fence: string | null = null;
  for (const line of markdown.split('\n')) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1] ?? '';
      if (fence === null) fence = marker.charAt(0);
      else if (fence !== null && marker.startsWith(fence)) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = (match[2] ?? '').replace(/`/g, '');
    headings.push({ level: (match[1] ?? '#').length as 1 | 2 | 3, text, id: slugifyHeading(text) });
  }
  return headings;
}
