// check_refs.mjs: fail on missing local files referenced by HTML, or absolute local paths in HTML.
// Usage: node tools/check_refs.mjs   (from the repo root; no dependencies)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
const pages = readdirSync(root).filter(f => f.endsWith('.html'));
const errors = [];
const skip = /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i;
function check(page, ref) {
  ref = ref.trim();
  if (!ref || skip.test(ref)) return;
  if (/^\/(Users|private|tmp|var|home)\//.test(ref) || /^file:/i.test(ref)) { errors.push(`${page}: absolute local path ${ref}`); return; }
  const clean = decodeURIComponent(ref.split('#')[0].split('?')[0]);
  if (!clean) return;
  const target = clean.startsWith('/') ? join(root, clean) : join(root, dirname(page), clean);
  if (!existsSync(target)) errors.push(`${page}: missing ${ref}`);
}
for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  if (/\/Users\/|\/private\/tmp|file:\/\//.test(html)) errors.push(`${page}: absolute local path leaked in HTML`);
  for (const m of html.matchAll(/\b(?:href|src|poster|data-src|data-poster)\s*=\s*"([^"]*)"/g)) check(page, m[1]);
  for (const m of html.matchAll(/\bsrcset\s*=\s*"([^"]*)"/g)) for (const part of m[1].split(',')) check(page, part.trim().split(/\s+/)[0]);
}
console.log(`checked ${pages.length} pages`);
if (errors.length) { console.error(errors.join('\n')); console.error(`${errors.length} error(s)`); process.exit(1); }
console.log('0 errors');
