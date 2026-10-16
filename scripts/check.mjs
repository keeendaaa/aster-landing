import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
await mkdir('test-results', { recursive: true });
const errors = [];
async function checkAssemblyMotion(page, selector, target, button) {
  const start = Number(await page.locator(selector).getAttribute('data-pose'));
  await page.getByRole('button', { name: button, exact: true }).click();
  const samples = await page.locator(selector).evaluate(el => new Promise(resolve => {
    const values = [];
    let start;
    function frame(time) {
      start ??= time;
      values.push(Number(el.dataset.pose));
      if (time - start < 400) requestAnimationFrame(frame);
      else resolve(values);
    }
    requestAnimationFrame(frame);
  }));
  assert.ok(Math.abs(samples[0] - start) < .2, `${selector} snapped at transition start: ${samples[0]}`);
  assert.ok(Math.abs(samples.at(-1) - start) > .03, `${selector} did not animate`);
  assert.ok(samples.at(-1) > .03 && samples.at(-1) < .97, `${selector} skipped intermediate poses`);
  for (let i = 1; i < samples.length; i++) {
    assert.ok(target ? samples[i] >= samples[i-1] - .001 : samples[i] <= samples[i-1] + .001, `${selector} reversed unexpectedly`);
  }
  await page.waitForFunction(({selector,target}) => Math.abs(Number(document.querySelector(selector).dataset.pose)-target)<.001, {selector,target});
}
try {
  for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(process.env.TEST_URL || 'http://localhost:5173', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
    const headlines = await page.locator('h1,h2').evaluateAll(elements => elements.map(el => ({ text: el.textContent, lines: el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight) })));
    for (const heading of headlines) assert.ok(heading.lines < 2.1, `Long heading at ${width}: ${heading.text}`);
    await page.screenshot({ path: `test-results/hero-${width}.png` });
    assert.match(await page.locator('.hero-copy p').textContent(), /Модуль абсолютной коррекции навигации/);
    assert.match(await page.locator('#technology').textContent(), /не их замена/);
    assert.match(await page.locator('#technology').textContent(), /Солнцу исследуем/);
    assert.match(await page.locator('#principle').textContent(), /точное время/);
    assert.match(await page.locator('#technology').textContent(), /не требует передачи навигационного радиосигнала/);
    for (const text of ['Логистика', 'Спасение', 'Навигация на море', 'пустынями', 'льдами']) {
      assert.ok((await page.locator('#applications').textContent()).includes(text), `Missing application: ${text}`);
    }

    if (width <= 900) {
      await page.getByRole('button', { name: 'Открыть меню', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Закрыть меню', exact: true }).getAttribute('aria-expanded'), 'true');
      await page.locator('#mobile-menu a').first().click();
      assert.equal(await page.locator('#mobile-menu').count(), 0);
    } else {
      await page.locator('.gooey-nav__list:not(.gooey-nav__list--active) a').nth(1).click();
      assert.equal(await page.locator('.desktop-nav .gooey-nav__item[data-active]').getAttribute('data-gooey-index'), '1');
    }

    await page.locator('#module').scrollIntoViewIfNeeded();
    await page.locator('.module-figure [data-piece]').first().waitFor();
    await page.waitForFunction(()=>Number(document.querySelector('.anatomy-module').dataset.pose)>.999);
    await checkAssemblyMotion(page, '.anatomy-module', 0, 'Собрать модуль');
    await checkAssemblyMotion(page, '.anatomy-module', 1, 'Разобрать модуль');
    await page.locator('.module-description .gooey-nav__list:not(.gooey-nav__list--active) button').nth(1).click();
    assert.match(await page.locator('.module-detail h3').textContent(),/Из света получается кадр/);

    await page.locator('#sky-roll').focus();
    await page.locator('#sky-roll').press('ArrowLeft');
    assert.equal(await page.locator('.roll-result output').textContent(),'+13.0°');
    await page.getByRole('button', {name:'Наблюдение',exact:true}).click();
    assert.equal(await page.locator('.detected-pattern').count(),0);
    await page.getByRole('button', {name:'Ориентация',exact:true}).click();
    assert.equal(await page.locator('.detected-pattern').count(),2);

    await page.locator('#integration').scrollIntoViewIfNeeded();
    await page.locator('.aircraft-figure [data-piece]').first().waitFor();
    await checkAssemblyMotion(page, '.anatomy-drone', 1, 'Показать крепление');
    await checkAssemblyMotion(page, '.anatomy-drone', 0, 'Установить модуль');
    assert.equal(await page.getByRole('button', {name:'Небо закрыто',exact:true}).count(),0);
    assert.equal(await page.getByRole('button', {name:'Звёзды видны',exact:true}).count(),0);
    await page.getByRole('button',{name:'Приостановить анимацию коптера',exact:true}).click();

    await page.locator('#demo').scrollIntoViewIfNeeded();
    const frame = page.frameLocator('iframe');
    await frame.locator('#play').waitFor();
    await page.locator('.scenario').nth(0).click();
    assert.ok(Number(await frame.locator('#star-nav').getAttribute('opacity'))>.99, 'Star connection must be visible on approach');
    await page.locator('.scenario').nth(1).click();
    assert.ok(Number(await frame.locator('#star-nav').getAttribute('opacity'))>.99, 'Star orientation stage must retain the connection');
    await page.locator('.scenario').nth(2).click();
    assert.equal(Math.floor(Number(await frame.locator('body').getAttribute('data-time'))), 12);
    assert.equal(Number(await frame.locator('#star-nav').getAttribute('opacity')),0,'No star connection during proximity positioning');
    await frame.locator('#play').click();
    await page.waitForTimeout(500);
    assert.ok(Number(await frame.locator('body').getAttribute('data-time')) > 12, 'Demo play did not advance');
    await frame.locator('#play').click();
    await page.screenshot({ path: `test-results/demo-${width}.png` });

    if (await page.locator('.night-film video').count()) {
      await page.locator('.night-film video').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>{
        const video=document.querySelector('.night-film video');
        return video.readyState>=2&&!video.paused;
      });
      assert.equal(await page.locator('.night-film video').evaluate(el=>el.muted),true);
      await page.getByRole('button',{name:'Приостановить ночную сцену',exact:true}).click();
      assert.equal(await page.locator('.night-film video').evaluate(el=>el.paused),true);
      await page.getByRole('button',{name:'Воспроизвести ночную сцену',exact:true}).click();
      await page.waitForFunction(()=>!document.querySelector('.night-film video').paused);
    }

    await page.getByRole('button', { name: 'Когда модуль может работать?' }).click();
    await page.locator('#answer-1').waitFor({state:'visible'});
    assert.equal(await page.locator('#answer-1').isVisible(), true);
    await page.locator('#answer-0').waitFor({state:'hidden'});
    assert.equal(await page.locator('#answer-0').isVisible(), false);
    assert.equal(await page.locator('#questions [data-radix-collection-item]').count(),5);
    await page.locator('#question-1').focus();
    await page.locator('#question-1').press('ArrowDown');
    assert.equal(await page.locator('#question-2').evaluate(el=>el===document.activeElement),true);
    await page.locator('#question-2').press('Enter');
    await page.locator('#answer-1').waitFor({state:'hidden'});
    await page.locator('#answer-2').waitFor({state:'visible'});
    assert.equal(await page.locator('#answer-2').isVisible(),true);
    await page.locator('#question-2').press('Enter');
    await page.locator('#answer-2').waitFor({state:'hidden'});
    for(const href of await page.locator('#questions a').evaluateAll(links=>links.map(link=>link.getAttribute('href')))) {
      assert.ok(href.startsWith('#')&&href.length>1,'FAQ links must have real destinations');
      assert.equal(await page.locator(href).count(),1,`Missing FAQ link target: ${href}`);
    }

    await page.locator('[name="name"]').fill('Тест Aster');
    await page.locator('[name="company"]').fill('Промышленный мониторинг');
    await page.locator('[name="email"]').fill('test@example.com');
    await page.locator('[name="task"]').fill('Ночной мониторинг при видимом звёздном небе.');
    await page.route('**/api/contact', async route => {
      const body = route.request().postDataJSON();
      assert.match(body.name, /Тест Aster/);
      assert.equal(body.email, 'test@example.com');
      assert.equal(body.consent, true);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await page.locator('[name="consent"]').check();
    await page.getByRole('button', { name: 'Отправить заявку', exact: true }).click();
    await page.getByText('Заявка доставлена команде Aster в Telegram.', { exact: true }).waitFor();
    assert.equal(await page.locator('.contact-form [role="status"]').isVisible(), true);
    await page.close();
    console.log(`PASS ${width}px: revised copy, layout, navigation, bidirectional assembly, star geometry, aircraft mounting/pause, approach/proximity demo, FAQ, contact (mock delivery)`);
  }

  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  reduced.on('pageerror', error => errors.push(error.message));
  await reduced.goto(process.env.TEST_URL || 'http://localhost:5173', { waitUntil: 'networkidle' });
  await reduced.waitForTimeout(300);
  assert.equal(await reduced.locator('.hero video').evaluate(el => el.paused), true, 'Video must be paused for reduced motion');
  if (await reduced.locator('.night-film video').count()) {
    await reduced.locator('.night-film video').scrollIntoViewIfNeeded();
    assert.equal(await reduced.locator('.night-film video').evaluate(el=>el.paused),true,'Night scene must remain still for reduced motion');
  }
  await reduced.locator('#contact').scrollIntoViewIfNeeded();
  assert.equal(await reduced.locator('.contact-copy h2').isVisible(), true);
  assert.equal(await reduced.locator('.contact-copy').evaluate(el => getComputedStyle(el.firstElementChild).opacity), '1');
  await reduced.locator('#module').scrollIntoViewIfNeeded();
  await reduced.locator('.module-figure [data-piece]').first().waitFor();
  await reduced.getByRole('button',{name:'Собрать модуль',exact:true}).click();
  await reduced.waitForFunction(()=>Number(document.querySelector('.anatomy-module').dataset.pose)===0);
  await reduced.getByRole('button',{name:'Разобрать модуль',exact:true}).click();
  await reduced.waitForFunction(()=>Number(document.querySelector('.anatomy-module').dataset.pose)===1);
  await reduced.close();
  const standalone = await browser.newPage({ viewport: {width:390,height:844} });
  standalone.on('pageerror', error=>errors.push(error.message));
  await standalone.goto(new URL('/demo/index.html',process.env.TEST_URL || 'http://localhost:5173').href,{waitUntil:'networkidle'});
  assert.equal(await standalone.locator('figcaption').isVisible(),true,'Standalone demo must show the limitation caption');
  assert.match(await standalone.locator('figcaption').textContent(),/не гарантируются Aster/);
  for (const [time,expected] of [[2,1],[7,1],[10,0],[12,0],[20,0]]) {
    await standalone.evaluate(t=>window.starline.seek(t),time);
    assert.equal(Number(await standalone.locator('#star-nav').getAttribute('opacity')),expected,`Incorrect standalone star connection at ${time}s`);
  }
  await standalone.screenshot({path:'test-results/standalone-390.png',fullPage:true});
  await standalone.close();
  assert.deepEqual(errors, [], 'Browser errors or failed requests');
  console.log('PASS reduced motion, no runtime errors, no missing assets');
} finally {
  await browser.close();
}
