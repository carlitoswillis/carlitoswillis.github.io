// Fails the build if private contact info leaks into the public output — or
// into any file this repo would carry into a commit (docs and generated notes
// included), since a leak reaches the public repo whether or not it ships.
// The public site carries email only — never phone or street address.
//
// The patterns themselves are private (they describe the data they guard), so
// they live outside the tracked tree: locally in ai/privacy-patterns.json
// (gitignored), in CI in the PRIVACY_PATTERNS secret (a JSON array of regex
// sources). Locally the guard fails closed when the file is missing; in CI it
// annotates the run with ::error:: and skips, so a missing secret is loud in
// the Actions UI without blocking a deploy.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const patternsFile = new URL('../ai/privacy-patterns.json', import.meta.url).pathname;
const inCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

function loadPatterns() {
  const raw = process.env.PRIVACY_PATTERNS
    ? process.env.PRIVACY_PATTERNS
    : existsSync(patternsFile) ? readFileSync(patternsFile, 'utf8') : '';
  if (!raw.trim()) return null;
  const list = JSON.parse(raw);
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((s) => new RegExp(s));
}

const PATTERNS = loadPatterns();
if (!PATTERNS) {
  const where = 'ai/privacy-patterns.json (local) or the PRIVACY_PATTERNS secret (CI)';
  if (inCI) {
    console.error(`::error::privacy-guard: no patterns found in ${where}; the privacy check did NOT run.`);
    process.exit(0);
  }
  console.error(`privacy-guard: no patterns found in ${where}; refusing to build.`);
  process.exit(1);
}

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const SCANNED = /\.(html|xml|txt|json|js|mjs|css|md|mdx|astro|ts|yml|yaml)$/;
const offenders = [];

function check(p) {
  const body = readFileSync(p, 'utf8');
  for (const re of PATTERNS) {
    if (re.test(body)) offenders.push(`${p} matches ${re}`);
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (SCANNED.test(name)) check(p);
  }
}

// Everything a commit could carry: tracked files plus untracked ones git would
// pick up. dist/ and ai/ are gitignored, so this covers the source tree without
// re-reading the build or the private patterns file.
function committable() {
  try {
    const out = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\0').filter(Boolean);
  } catch {
    console.warn('privacy-guard: git unavailable; checked the built output only.');
    return [];
  }
}

if (existsSync(dist)) walk(dist);
for (const rel of committable()) {
  const p = join(root, rel);
  if (SCANNED.test(rel) && existsSync(p) && statSync(p).isFile()) check(p);
}

if (offenders.length) {
  console.error('PRIVACY GUARD FAILED — private contact info in public or committable files:');
  for (const o of offenders) console.error('  ' + o);
  process.exit(1);
}
console.log('privacy guard: clean');
