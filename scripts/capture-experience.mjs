import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run=promisify(execFile);
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});
  await page.goto('http://localhost:5173',{waitUntil:'networkidle'});
  await page.locator('#module').scrollIntoViewIfNeeded();
  await page.locator('.module-figure [data-piece]').first().waitFor();
  await page.waitForTimeout(1500);
  await mkdir('public/figures',{recursive:true});
  await page.locator('.module-figure .anatomy-art').screenshot({path:'public/figures/module-detail.png'});
  await run('cwebp',['-quiet','-q','90','public/figures/module-detail.png','-o','public/figures/module-detail.webp']);
  await mkdir('test-results/redesign',{recursive:true});
  for(const width of [1440,768,390]) {
    await page.setViewportSize({width,height:900});
    for(const section of ['module','principle','integration','demo','contact']) {
      await page.locator(`#${section}`).scrollIntoViewIfNeeded();
      if(section==='integration') await page.locator('.aircraft-figure [data-piece]').first().waitFor();
      await page.waitForTimeout(1300);
      await page.screenshot({path:`test-results/redesign/${section}-${width}.png`});
    }
  }
} finally {await browser.close();}
