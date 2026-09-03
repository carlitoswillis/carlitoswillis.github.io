// Fails the build if private contact info leaks into the public output.
// The public site carries email only — never phone or street address.
//
// The patterns themselves are private (they describe the data they guard), so
// they live outside the tracked tree: locally in ai/privacy-patterns.json
// (gitignored), in CI in the PRIVACY_PATTERNS secret (a JSON array of regex
// sources). Locally the guard fails closed when the file is missing; in CI it
// warns and skips, so a missing secret is visible without blocking a deploy.
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
    console.warn(`privacy-guard: no patterns found in ${where}; skipping the check.`);
    process.exit(0);
  }
  console.error(`privacy-guard: no patterns found in ${where}; refusing to build.`);
  process.exit(1);
}

const dist = new URL('../dist', import.meta.url).pathname;
const offenders = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html|xml|txt|json|js|css)$/.test(name)) {
      const body = readFileSync(p, 'utf8');
      for (const re of PATTERNS) {
        if (re.test(body)) offenders.push(`${p} matches ${re}`);
      }
    }
  }
}
walk(dist);

if (offenders.length) {
  console.error('PRIVACY GUARD FAILED — private contact info in public output:');
  for (const o of offenders) console.error('  ' + o);
  process.exit(1);
}
console.log('privacy guard: clean');
