// Records the Working Memory time-machine scrubber against the live demo.
import { chromium } from 'playwright-core';

const OUT = process.argv[2] ?? 'vid';
const URL = 'https://workingmemory.onrender.com/demo';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
});
const page = await ctx.newPage();

// Free-tier cold start can take ~a minute; retry until the board is up.
let up = false;
for (let i = 0; i < 6 && !up; i++) {
  try {
    await page.goto(URL, { timeout: 120000, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[aria-label="Rewind the board"]', { timeout: 45000 });
    up = true;
  } catch (e) {
    console.log(`attempt ${i + 1}: ${String(e).slice(0, 120)}`);
    await page.waitForTimeout(8000);
  }
}
if (!up) {
  console.error('board never came up');
  await browser.close();
  process.exit(1);
}

// Let the board and timeline settle (markers load async).
await page.waitForTimeout(5000);

const slider = page.locator('input[aria-label="Rewind the board"]');
const box = await slider.boundingBox();
const y = box.y + box.height / 2;
const startX = box.x + box.width - 4;

// Grab the handle at "now" and drag slowly into the past (~72% of the track).
await page.mouse.move(startX, y);
await page.waitForTimeout(600);
await page.mouse.down();
const steps = 55;
for (let i = 0; i <= steps; i++) {
  // ease-in-out so the scrub reads as human
  const t = i / steps;
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  await page.mouse.move(startX - box.width * 0.72 * eased, y);
  await page.waitForTimeout(95);
}
await page.mouse.up();

// Hold on the past board, then snap back to live.
await page.waitForTimeout(2600);
const back = page.getByText('← Back to now');
if (await back.count()) await back.first().click();
await page.waitForTimeout(2200);

await ctx.close(); // flushes the video
const video = await page.video().path();
console.log('VIDEO=' + video);
await browser.close();
