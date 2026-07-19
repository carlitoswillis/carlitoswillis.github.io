// Fails the build if private contact info leaks into the public output.
// The public site carries email only — never phone or street address.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PATTERNS = [
  /675[-.\s]?3850/, // phone (any formatting)
  /\(562\)/,
  /562[-.\s]675/,
];

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
