import { describe, expect, it } from 'vitest';
import { fileSafe, toCsv } from './download';

describe('download helpers', () => {
  it('builds CSV with quoting and a BOM so Excel keeps non-ASCII text', () => {
    const csv = toCsv([
      ['Word', 'Meaning'],
      ['cache', 'a stored copy, for fast reuse'],
      ['say', 'He said "hi"'],
      ['\u0928\u092e\u0938\u094d\u0924\u0947', 'hello'],
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Word,Meaning\r\n');
    expect(csv).toContain('cache,"a stored copy, for fast reuse"\r\n');
    expect(csv).toContain('say,"He said ""hi"""\r\n');
    expect(csv).toContain('\u0928\u092e\u0938\u094d\u0924\u0947,hello');
  });

  it('turns titles into safe file names', () => {
    expect(fileSafe('Hashing patterns: two-sum family!')).toBe('hashing-patterns-two-sum-family');
    expect(fileSafe('???')).toBe('download');
  });
});
