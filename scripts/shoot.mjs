#!/usr/bin/env node
// Capture the built site at real viewports.
//
//   node scripts/shoot.mjs <distDir> <outDir> [port]
//
// Headless Chrome's --window-size clips rather than reflows at phone widths,
// so this drives the installed Google Chrome through playwright-core with a
// real viewport, over a local static server (file:// breaks absolute asset
// paths). It also reports scrollWidth vs viewport width per page, which is
// the only honest horizontal-overflow check.

import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const [, , distArg = 'dist', outArg = 'shots', portArg = '4401'] = process.argv;
const dist = resolve(distArg);
const out = resolve(outArg);
const port = Number(portArg);

const PAGES = [
  ['index', '/'],
  ['working-memory', '/projects/working-memory/'],
  ['resume', '/resume/'],
];

const VIEWPORTS = [
  ['1440x900', 1440, 900],
  ['390x844', 390, 844],
  ['320x568', 320, 568],
];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

function serve() {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = join(dist, normalize(url).replace(/^(\.\.[/\\])+/, ''));
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
    } catch {
      /* fall through to 404 */
    }
    try {
      statSync(file);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not found');
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

const server = await serve();
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const report = [];

for (const [vpName, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width < 900,
    hasTouch: width < 900,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(20000);
  for (const [name, path] of PAGES) {
    // 'networkidle' never settles: the featured demos are looping <video>.
    process.stderr.write(`  > ${name} @ ${vpName}\n`);
    await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    // freeze every clip on its poster frame so captures are comparable
    await page.evaluate(() =>
      [...document.querySelectorAll('video')].forEach((v) => {
        v.pause();
        v.autoplay = false;
        v.currentTime = 0;
      }),
    );
    // A fullPage shot paints the whole document at once, so every lazy image
    // has to have loaded first: make them eager, walk the page, then wait for
    // the ones still in flight (bounded — decode() on an image that never
    // starts loading stays pending forever).
    await page.evaluate(() =>
      [...document.images].forEach((i) => {
        i.loading = 'eager';
      }),
    );
    for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 800) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(
      () =>
        new Promise((done) => {
          const t = setTimeout(done, 4000);
          Promise.all(
            [...document.images].filter((i) => !i.complete).map((i) => i.decode().catch(() => {})),
          ).then(() => {
            clearTimeout(t);
            done();
          });
        }),
    );
    await page.waitForTimeout(250);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const over = [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > de.clientWidth + 1)
        .slice(0, 6)
        .map((el) => `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 90));
      return {
        scrollWidth: de.scrollWidth,
        clientWidth: de.clientWidth,
        scrollHeight: de.scrollHeight,
        offenders: over,
      };
    });
    const file = join(out, `${name}-${vpName}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const overflow = m.scrollWidth > m.clientWidth;
    report.push({ page: name, viewport: vpName, ...m, overflow, file });
    console.log(
      `${overflow ? 'OVERFLOW' : 'ok      '} ${name.padEnd(16)} ${vpName.padEnd(9)} ` +
        `scrollWidth ${m.scrollWidth} vs ${m.clientWidth}  h=${m.scrollHeight}` +
        (overflow && m.offenders.length ? `\n         offenders: ${m.offenders.join(' | ')}` : ''),
    );
  }
  await ctx.close();
}

await browser.close();
server.close();
await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2));
const bad = report.filter((r) => r.overflow);
console.log(`\n${report.length} captures → ${out}`);
console.log(bad.length ? `HORIZONTAL OVERFLOW on ${bad.length}` : 'no horizontal overflow anywhere');
process.exit(bad.length ? 1 : 0);
