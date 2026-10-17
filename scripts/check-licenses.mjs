// Fails when a dependency uses a licence that is not on the allow-list, so the stack stays free to run and share.
//   pnpm licenses:check

import { execFileSync } from 'node:child_process';

const ALLOWED = new Set([
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC0-1.0',
  'CC-BY-4.0',
  'ISC',
  'MIT',
  'MIT-0',
  'MPL-2.0', // file-level copyleft, fine when the files are used unmodified
  'OFL-1.1', // SIL Open Font License: the bundled Inter, JetBrains Mono and Noto Sans Devanagari fonts
  'Python-2.0',
  'Unlicense',
  'Zlib',
]);

function isAllowed(expression) {
  const cleaned = expression.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\sOR\s/.test(cleaned)) return cleaned.split(/\sOR\s/).some((part) => isAllowed(part));
  if (/\sAND\s/.test(cleaned)) return cleaned.split(/\sAND\s/).every((part) => isAllowed(part));
  return ALLOWED.has(cleaned);
}

const output = execFileSync('pnpm', ['licenses', 'list', '--json'], {
  encoding: 'utf8',
  maxBuffer: 128 * 1024 * 1024,
  shell: process.platform === 'win32',
});

const byLicense = JSON.parse(output);
const problems = [];
let total = 0;
for (const [license, packages] of Object.entries(byLicense)) {
  total += packages.length;
  if (isAllowed(license)) continue;
  for (const item of packages) problems.push(`${license}: ${item.name}@${item.versions.join(', ')}`);
}

console.log(`${total} packages checked across ${Object.keys(byLicense).length} licences.`);
if (problems.length > 0) {
  console.log('\nLicences that are not on the allow-list (review them, then allow or replace the package):');
  for (const line of problems) console.log(` - ${line}`);
  process.exit(1);
}
console.log('Every licence is on the allow-list.');
