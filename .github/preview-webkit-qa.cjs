const http = require('http');
const fs = require('fs');
const path = require('path');
const { webkit } = require('playwright');

const root = path.resolve(__dirname, '..');
const screenshots = path.join(root, 'preview/screenshots');
const three = fs.readFileSync(require.resolve('three/build/three.min.js'));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon' };
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const file = path.resolve(root, `.${pathname === '/' ? '/preview/ot-commercial-navigation.html' : pathname}`);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

async function rect(page, selector) {
  return page.locator(selector).evaluate(el => {
    const box = el.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height };
  });
}

async function testViewport(browser, width, height) {
  const viewport = `${width}x${height}`;
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: three }));
  await page.route(/https:\/\/fonts\.googleapis\.com\/.*/, route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route(/https:\/\/fonts\.gstatic\.com\/.*/, route => route.fulfill({ status: 204, body: '' }));
  await page.goto('http://127.0.0.1:4173/preview/ot-commercial-navigation.html', { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.content || '',
    css: [...document.styleSheets].map(sheet => {
      try { return [...sheet.cssRules].map(rule => rule.cssText).join('\n'); } catch { return ''; }
    }).join('\n'),
    touchAction: {
      choice: getComputedStyle(document.querySelector('.choice-tab')).touchAction,
      project: getComputedStyle(document.querySelector('.project-tab')).touchAction,
      product: getComputedStyle(document.querySelector('.product')).touchAction,
    },
  }));
  assert(layout.scrollWidth <= layout.clientWidth, `${viewport}: overflow horizontal ${layout.scrollWidth}/${layout.clientWidth}`);
  assert(layout.viewportMeta.includes('viewport-fit=cover'), `${viewport}: viewport-fit=cover ausente`);
  assert(layout.css.includes('safe-area-inset-top') && layout.css.includes('safe-area-inset-bottom'), `${viewport}: regras de safe area ausentes`);
  assert(Object.values(layout.touchAction).every(value => value === 'auto'), `${viewport}: touch-action inseguro ${JSON.stringify(layout.touchAction)}`);

  const header = await rect(page, '.mobile-header');
  const nav = await rect(page, '.mobile-nav');
  const pageTop = await page.locator('.page').evaluate(el => parseFloat(getComputedStyle(el).paddingTop));
  assert(header.top === 0 && pageTop >= header.height, `${viewport}: cabeçalho cobre o conteúdo`);
  assert(nav.bottom <= height + 0.5 && nav.top > 0, `${viewport}: navegação inferior fora da safe area`);
  assert(await page.locator('.choice-tab').count() === 4, `${viewport}: chips incompletos`);
  assert(await page.locator('.product').count() === 4, `${viewport}: produtos incompletos`);

  const chip = page.locator('.choice-tab').first();
  await chip.scrollIntoViewIfNeeded();
  const verticalBefore = await page.evaluate(() => scrollY);
  await page.evaluate(() => scrollBy(0, 300));
  await page.waitForTimeout(200);
  assert(await page.evaluate(() => scrollY) > verticalBefore, `${viewport}: rolagem vertical da página falhou`);

  const choiceRail = page.locator('.choice-tabs');
  await choiceRail.scrollIntoViewIfNeeded();
  await choiceRail.evaluate(el => el.scrollBy({ left: 260 }));
  await page.waitForTimeout(200);
  assert(await choiceRail.evaluate(el => el.scrollLeft) > 0, `${viewport}: faixa horizontal dos chips não rola`);

  await page.locator('.choice-tab[data-solution="digital"]').tap();
  assert(await page.locator('.choice-tab[data-solution="digital"]').getAttribute('aria-selected') === 'true', `${viewport}: seleção de solução falhou`);
  await page.locator('#projetos').scrollIntoViewIfNeeded();
  await page.locator('.project-tab[data-project="advocacia"]').tap();
  assert(await page.locator('.project-tab[data-project="advocacia"]').getAttribute('aria-selected') === 'true', `${viewport}: seletor de projetos falhou`);
  await page.locator('#metodo').scrollIntoViewIfNeeded();
  const method = page.locator('.method-item').nth(1);
  await method.locator('.method-toggle').tap();
  assert(await method.locator('.method-toggle').getAttribute('aria-expanded') === 'true', `${viewport}: acordeão falhou`);

  await page.locator('#produtos').scrollIntoViewIfNeeded();
  const products = page.locator('.products-rail');
  await products.evaluate(el => el.scrollBy({ left: 280 }));
  await page.waitForTimeout(200);
  assert(await products.evaluate(el => el.scrollLeft) > 0, `${viewport}: faixa horizontal dos produtos não rola`);

  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(screenshots, `issue-35-mobile-webkit-${viewport}.png`), fullPage: false });
  assert(consoleErrors.length === 0, `${viewport}: console errors: ${consoleErrors.join(' | ')}`);
  assert(pageErrors.length === 0, `${viewport}: page errors: ${pageErrors.join(' | ')}`);
  results.push({ engine: `Playwright WebKit ${await browser.version()}`, viewport, consoleErrors: 0, pageErrors: 0, overflow: false, status: 'PASS' });
  await context.close();
}

async function testDirectionalInput(browser, width, height) {
  const viewport = `${width}x${height}`;
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: three }));
  await page.route(/https:\/\/fonts\.googleapis\.com\/.*/, route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route(/https:\/\/fonts\.gstatic\.com\/.*/, route => route.fulfill({ status: 204, body: '' }));
  await page.goto('http://127.0.0.1:4173/preview/ot-commercial-navigation.html', { waitUntil: 'load' });
  await page.waitForTimeout(400);

  const chip = page.locator('.choice-tab').first();
  await chip.scrollIntoViewIfNeeded();
  const chipBox = await chip.boundingBox();
  const verticalBefore = await page.evaluate(() => scrollY);
  await page.mouse.move(chipBox.x + chipBox.width / 2, chipBox.y + chipBox.height / 2);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(200);
  assert(await page.evaluate(() => scrollY) > verticalBefore, `${viewport}: input vertical iniciado sobre chip falhou no WebKit`);

  const choiceRail = page.locator('.choice-tabs');
  await choiceRail.scrollIntoViewIfNeeded();
  const railBox = await choiceRail.boundingBox();
  await page.mouse.move(railBox.x + railBox.width / 2, railBox.y + railBox.height / 2);
  await page.mouse.wheel(260, 0);
  await page.waitForTimeout(200);
  assert(await choiceRail.evaluate(el => el.scrollLeft) > 0, `${viewport}: input horizontal dos chips falhou no WebKit`);
  await context.close();
}

server.listen(4173, '127.0.0.1', async () => {
  fs.mkdirSync(screenshots, { recursive: true });
  const browser = await webkit.launch({ headless: true });
  try {
    await testViewport(browser, 390, 844);
    await testViewport(browser, 430, 932);
    await testDirectionalInput(browser, 390, 844);
    await testDirectionalInput(browser, 430, 932);
    fs.writeFileSync(path.join(root, 'preview-webkit-results.json'), JSON.stringify({ results }, null, 2));
    console.log(JSON.stringify({ results }, null, 2));
  } catch (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
