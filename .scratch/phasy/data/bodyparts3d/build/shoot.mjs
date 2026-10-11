// Headless Edge check of the prototype: load, screenshot, debugSelect, screenshot, peel, screenshot.
// Usage: node shoot.mjs <url> <outDir> [extra chrome flags...]
import puppeteer from 'puppeteer-core';
const [url, outDir, ...flags] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true, args: ['--ignore-gpu-blocklist', ...flags],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('window.__ready === true', { timeout: 90000 });
await new Promise((r) => setTimeout(r, 2500)); // let fps settle
const gl = await page.evaluate(() => {
  const c = document.createElement('canvas').getContext('webgl2');
  const d = c && c.getExtension('WEBGL_debug_renderer_info');
  return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a';
});
await page.screenshot({ path: `${outDir}/01-back-view.png` });
const sel = await page.evaluate(() => window.debugSelect('FJ1521'));
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: `${outDir}/02-debugSelect-FJ1521.png` });
const panel = await page.evaluate(() => document.getElementById('name').textContent + ' | ' + document.getElementById('sub').textContent + ' | ' + document.getElementById('status').textContent);
await page.click('#front');
await page.evaluate(() => window.debugSelect(-1));
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `${outDir}/03-front-view.png` });
// tap test: tap the canvas centre and read the panel
await page.click('#back');
await new Promise((r) => setTimeout(r, 800));
const tapped = [];
for (const [x, y] of [[150, 480], [195, 200], [165, 260], [230, 420]]) {
  await page.touchscreen.tap(x, y);
  await new Promise((r) => setTimeout(r, 300));
  tapped.push(`${x},${y}: ` + await page.evaluate(() => document.getElementById('name').textContent + ' | ' + document.getElementById('sub').textContent));
}
await page.screenshot({ path: `${outDir}/04-tap.png` });
await page.click('#peel');
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `${outDir}/05-after-peel-1.png` });
const peel1 = await page.evaluate(() => window.__stats.lastPeel);
await page.click('#peel');
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `${outDir}/06-after-peel-2.png` });
const peel2 = await page.evaluate(() => window.__stats.lastPeel);
tapped.push(`peeled ${peel1} then ${peel2}`);
const stats = await page.evaluate(() => window.__stats);
console.log(JSON.stringify({ gl, sel, panel, tapped, stats, logs: logs.slice(0, 20) }, null, 1));
await browser.close();
