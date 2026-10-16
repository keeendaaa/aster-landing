import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { build } from 'esbuild';

const url=process.env.TEST_URL||'http://localhost:4173';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const errors=[];
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',error=>errors.push(error.message));
const pose=selector=>page.locator(selector).evaluate(el=>Number(el.dataset.pose));
const settle=async(selector,target)=>page.waitForFunction(({selector,target})=>Math.abs(Number(document.querySelector(selector)?.dataset.pose)-target)<.0001,{selector,target});
async function sample(selector,duration=350) {
  return page.locator(selector).evaluate((el,duration)=>new Promise(resolve=>{
    const start=performance.now(),values=[];
    function frame(){values.push(Number(el.dataset.pose));if(performance.now()-start<duration)requestAnimationFrame(frame);else resolve(values);}
    requestAnimationFrame(frame);
  }),duration);
}
async function transition(selector,target,action) {
  // Sample from the actual click, not after Playwright's actionability/scroll
  // waits: those waits can outlast a significant part of the animation.
  await page.locator(selector).evaluate(el=>{
    window.assemblySamples=new Promise(resolve=>document.addEventListener('click',()=>{
      const start=performance.now(),values=[Number(el.dataset.pose)];
      function frame(){values.push(Number(el.dataset.pose));if(performance.now()-start<350)requestAnimationFrame(frame);else resolve(values);}
      requestAnimationFrame(frame);
    },{once:true,capture:true}));
  });
  await action();
  const [before,...values]=await page.evaluate(()=>window.assemblySamples);
  assert.ok(Math.abs(values[0]-before)<.12,`${selector} snapped: ${before} -> ${values[0]}`);
  assert.ok(Math.abs(values.at(-1)-before)>.01,`${selector} did not move`);
  for(let i=1;i<values.length;i++)assert.ok(target?values[i]>=values[i-1]-.00001:values[i]<=values[i-1]+.00001,`${selector} nonmonotonic`);
  await settle(selector,target);
}
async function depth(selector) {
  assert.ok(await page.locator(`${selector} [data-assembly]`).evaluate(el=>Array.from(el.children).every((child,i,children)=>!i||Number(children[i-1].dataset.depth)<=Number(child.dataset.depth))),`${selector} depth ordering`);
}
try {
  await page.goto(url,{waitUntil:'networkidle'});
  for(const [selector,section,names] of [
    ['.anatomy-module','#module',['Собрать модуль','Разобрать модуль']],
    ['.anatomy-drone','#integration',['Установить модуль','Показать крепление']],
  ]) {
    await page.locator(section).scrollIntoViewIfNeeded();
    await page.locator(`${selector} [data-piece]`).first().waitFor();
    const initial=selector.includes('module')?1:0;
    await settle(selector,initial);
    for(const target of [1-initial,initial])await transition(selector,target,()=>page.getByRole('button',{name:names[target],exact:true}).click());
    for(const delay of [400,170,290,120,220,170]) {
      const {before,after:immediate}=await page.locator(`${section} .figure-button`).evaluate(el=>{
        const svg=el.closest('figure').querySelector('svg');
        const before=Number(svg.dataset.pose);
        el.click();
        return {before,after:Number(svg.dataset.pose)};
      });
      assert.equal(immediate,before,`${selector} interrupted reversal reset pose synchronously`);
      const after=await sample(selector,delay);
      const target=await page.locator(`${section} .figure-button`).getAttribute('aria-pressed');
      for(let i=1;i<after.length;i++)assert.ok(target==='true'?after[i]>=after[i-1]-.00001:after[i]<=after[i-1]+.00001,`${selector} interrupted reversal was nonmonotonic`);
      assert.ok(after.every(value=>value>=0&&value<=1));
      await depth(selector);
    }
    await settle(selector,initial);
    await page.locator(`${section} .figure-button`).click();
    await page.waitForTimeout(300);
    await page.emulateMedia({reducedMotion:'reduce'});
    await settle(selector,1-initial);
    await page.locator(`${section} .figure-button`).click();
    await settle(selector,initial);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await transition(selector,1-initial,()=>page.locator(`${section} .figure-button`).click());
    console.log(`PASS production ${selector}: both directions, six interrupted reversals, live reduced-motion toggle, depth sorting`);
  }

  // Bundle the same component in a small, isolated React lifecycle harness.
  // The preview still serves its actual figure JSON; no app/source files are changed.
  const bundle=await build({stdin:{contents:`
    import React,{StrictMode} from 'react';
    import {createRoot} from 'react-dom/client';
    import {flushSync} from 'react-dom';
    import gsap from 'gsap';
    import {AnatomyArt} from './src/components/figures/AnatomyArt';
    const root=createRoot(document.getElementById('root'));
    window.renderArt=props=>flushSync(()=>root.render(props?<StrictMode><AnatomyArt {...props}/></StrictMode>:null));
    window.activeTweens=()=>gsap.globalTimeline.getChildren(true,true,true).length;
    window.renderArt({kind:'module',expanded:false});
  `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"development"'},jsx:'automatic'});
  await page.route('**/__anatomy-test',route=>route.fulfill({contentType:'text/html',body:'<div id="root" style="width:900px"></div><script src="/__anatomy-test.js"></script>'}));
  await page.route('**/__anatomy-test.js',route=>route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.goto(`${url}/__anatomy-test`);
  const render=props=>page.evaluate(props=>window.renderArt(props),props);
  await page.locator('[data-piece]').first().waitFor();
  await settle('svg',0);
  await render({kind:'module',expanded:true,selected:'optics'});
  await page.waitForTimeout(600);
  const {before,after}=await page.evaluate(()=>{
    const before=Number(document.querySelector('svg').dataset.pose);
    window.renderArt({kind:'module',expanded:true,selected:'sensor'});
    return {before,after:Number(document.querySelector('svg').dataset.pose)};
  });
  assert.equal(after,before,'Selected part change snapped pose');
  await page.waitForTimeout(700);
  assert.ok(await pose('svg')>.999,'Selected part change restarted the 1.2s assembly tween');
  assert.ok(await page.locator('[data-piece="sensor"]').first().evaluate(el=>Number(getComputedStyle(el).opacity))>.99,'Selected sensor not highlighted');
  assert.ok(await page.locator('[data-piece="optics"]').first().evaluate(el=>Number(getComputedStyle(el).opacity))<.4,'Other part not dimmed');
  console.log('PASS isolated: selected part changes preserve running assembly timeline and highlight');

  for(const kind of ['module','drone']) {
    await render(null);
    await render({kind,expanded:true,detached:true,flying:true});
    await page.locator('[data-piece]').first().waitFor();
    await page.waitForTimeout(250);
    await page.evaluate(()=>{
      window.detachedSvg=document.querySelector('svg');
      window.detachedChanges=0;
      window.detachedObserver=new MutationObserver(records=>window.detachedChanges+=records.length);
      window.detachedObserver.observe(window.detachedSvg,{subtree:true,attributes:true,childList:true});
    });
    await render(null);
    await page.waitForTimeout(100);
    await page.evaluate(()=>window.detachedChanges=0);
    assert.equal(await page.evaluate(()=>window.activeTweens()),0,`${kind} leaked GSAP tween`);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(()=>window.detachedChanges),0,`${kind} updated detached SVG`);
    await page.evaluate(()=>window.detachedObserver.disconnect());
    console.log(`PASS StrictMode ${kind}: interrupted unmount, no active tweens or detached DOM writes after media changes`);
  }
  await render({kind:'drone',flying:true});
  await page.locator('[data-blade]').first().waitFor();
  await page.waitForTimeout(150);
  const blade=()=>page.locator('[data-blade]').first().getAttribute('d');
  const moving=await blade();await page.waitForTimeout(150);
  assert.notEqual(await blade(),moving,'Rotor did not run');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  const still=await blade();await page.waitForTimeout(150);
  assert.equal(await blade(),still,'Rotor did not stop for live reduced motion');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
  assert.notEqual(await blade(),still,'Rotor did not resume');
  await render({kind:'drone',flying:false});await page.waitForTimeout(100);
  const paused=await blade();await page.waitForTimeout(150);
  assert.equal(await blade(),paused,'Paused rotor still moving');
  await render(null);
  assert.deepEqual(errors,[],'Browser runtime errors');
  console.log('PASS rotor live motion preferences and pause; no browser runtime errors');
} finally {await browser.close();}
