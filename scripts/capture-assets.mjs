import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/demo/index.html');
await page.waitForFunction(() => window.starline);
await mkdir('public/media', { recursive: true });
for (const [name, time, dark, clip] of [
  ['observe', 0, true, { x: 50, y: 0, width: 900, height: 280 }],
  ['match', 7, true, { x: 320, y: 0, width: 550, height: 380 }],
  ['orientation', 7, false, { x: 310, y: 200, width: 400, height: 380 }],
  ['night-scene', 12, true, { x: 0, y: 0, width: 1100, height: 760 }],
]) {
  await page.evaluate(({time,dark}) => { document.body.dataset.theme = dark ? 'dark' : 'light'; window.starline.seek(time); }, {time,dark});
  await page.waitForTimeout(200);
  await page.screenshot({ path: `public/media/${name}.png`, clip });
  await run('cwebp', ['-quiet', '-q', '88', `public/media/${name}.png`, '-o', `public/media/${name}.webp`]);
}
await browser.close();
