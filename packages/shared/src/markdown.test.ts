import { describe, expect, it } from 'vitest';
import { extractHeadings, slugifyHeading } from './markdown';

describe('markdown helpers', () => {
  it('slugifies headings the way GitHub-style anchors do', () => {
    expect(slugifyHeading('Why `Map` beats arrays?')).toBe('why-map-beats-arrays');
    expect(slugifyHeading('  Time & space  ')).toBe('time-space');
  });

  it('extracts headings and ignores fenced code', () => {
    const markdown = ['## One', 'text', '```ts', '## not a heading', '```', '### Two `code`', '~~~', '# nope', '~~~', '#### deep'].join('\n');
    expect(extractHeadings(markdown)).toEqual([
      { level: 2, text: 'One', id: 'one' },
      { level: 3, text: 'Two code', id: 'two-code' },
    ]);
  });
});
