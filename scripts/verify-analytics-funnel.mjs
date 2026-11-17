// Issue #126 — isolated browser contract; never sends analytics or Facebook events to production.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let path = resolve(root, '.' + pathname);
    if (!(path === root || path.startsWith(root + '/'))) throw Error('Path escape');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream');
    res.end(await readFile(path));
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
await new Promise(resolveServer => server.listen(0, '127.0.0.1', resolveServer));
const origin = 'http://127.0.0.1:' + server.address().port;
const report = { issue: 126, engine: process.env.OT_ANALYTICS_ENGINE || 'chromium', checks: [], externalRequestsBlocked: 0 };
let browser;

async function scenario(analytics, marketing) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.addInitScript(({ analytics, marketing }) => {
    localStorage.setItem('ot_consent_preferences_v2', JSON.stringify({ analytics, marketing }));
  }, { analytics, marketing });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    report.externalRequestsBlocked++;
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  const page = await context.newPage();
  await page.goto(origin + '/diagnostico-digital/?debug_analytics=1', { waitUntil: 'load' });
  await page.waitForFunction(() => Boolean(window.OTAnalytics));
  return { context, page };
}

async function events(page) {
  return page.evaluate(() => ({
    ga: (window.dataLayer || []).filter(x => x[0] === 'event').map(x => ({ name: x[1], params: x[2] })),
    meta: (window.fbq?.queue || []).filter(x => x[0] === 'track').map(x => x[1])
  }));
}

const count = (eventsSnapshot, name) => eventsSnapshot.ga.filter(x => x.name === name).length;
async function answerFive(page) {
  for (let i = 0; i < 5; i++) {
    await page.locator('.step.active .opt').first().click();
    await page.locator('.step.active[data-step="' + (i + 1) + '"]').waitFor();
  }
}

try {
  const engine = report.engine === 'webkit' ? webkit : chromium;
  browser = await engine.launch();
  {
    const { context, page } = await scenario('granted', 'granted');
    assert.equal(count(await events(page), 'diagnostico_inicio'), 0);
    await answerFive(page); // Deliberately skip the optional start link.
    let result = await events(page);
    assert.equal(count(result, 'diagnostico_inicio'), 1, 'First valid answer starts the journey');
    assert.equal(count(result, 'diagnostico_resposta'), 5);
    assert.equal(count(result, 'diagnostico_concluido'), 0, 'No completion before finish');
    await page.locator('#nomeNegocio').fill('Cliente Secreto 123');
    await page.locator('[data-finish]').click();
    await page.locator('.step.active[data-step="6"]').waitFor();
    result = await events(page);
    assert.equal(count(result, 'diagnostico_concluido'), 1);
    await page.evaluate(() => document.querySelector('[data-finish]').click());
    assert.equal(count(await events(page), 'diagnostico_concluido'), 1, 'Finish is idempotent');
    const originalHref = await page.locator('#waLink').getAttribute('href');
    assert.ok(decodeURIComponent(originalHref).includes('Cliente Secreto 123'), 'WhatsApp draft remains intact for the user');
    await page.locator('#waLink').evaluate(el => el.addEventListener('click', e => e.preventDefault()));
    await page.locator('#waLink').click();
    result = await events(page);
    assert.equal(count(result, 'click_whatsapp'), 1);
    assert.equal(count(result, 'generate_lead'), 0, 'Click never registers a received lead');
    assert.equal(result.meta.filter(x => x === 'Lead').length, 0, 'Click never generates Meta Lead');
    assert.equal(result.meta.filter(x => x === 'Contact').length, 1, 'Pixel Contact represents intent');
    assert.equal(result.ga.find(x => x.name === 'click_whatsapp').params.destination_url, 'https://wa.me/5511912459144');
    assert.ok(!JSON.stringify(result).includes('Cliente Secreto'), 'GA4 receives no business name from WhatsApp URL');
    await page.locator('[data-restart]').click();
    await page.locator('.step.active[data-step="0"]').waitFor();
    await answerFive(page);
    await page.locator('[data-finish]').click();
    result = await events(page);
    assert.equal(count(result, 'diagnostico_inicio'), 2, 'A restarted journey has one new start');
    assert.equal(count(result, 'diagnostico_concluido'), 2, 'A restarted full journey can complete again');
    report.checks.push('First answer starts once; five responses and finish gate; no false lead; safe URLs; restart');
    await context.close();
  }
  {
    const { context, page } = await scenario('granted', 'denied');
    await page.locator('[data-start-link]').click();
    assert.equal(count(await events(page), 'diagnostico_inicio'), 0, 'Start anchor alone is not a diagnostic start');
    await page.locator('.step.active .opt').first().click();
    await page.locator('.step.active[data-step="1"]').waitFor();
    await page.evaluate(() => document.querySelector('[data-finish]').click());
    const result = await events(page);
    assert.equal(count(result, 'diagnostico_inicio'), 1);
    assert.equal(count(result, 'diagnostico_concluido'), 0, 'Premature finish cannot emit completion');
    assert.deepEqual(result.meta, []);
    report.checks.push('Optional start anchor does not inflate starts; incomplete diagnostic; marketing denied');
    await context.close();
  }
  {
    const { context, page } = await scenario('denied', 'denied');
    await answerFive(page);
    await page.locator('[data-finish]').click();
    await page.locator('#waLink').evaluate(el => el.addEventListener('click', e => e.preventDefault()));
    await page.locator('#waLink').click();
    const result = await events(page);
    assert.deepEqual(result.ga, [], 'Analytics consent refused means no GA events');
    assert.deepEqual(result.meta, [], 'Marketing consent refused means no Meta events');
    report.checks.push('Denied consent has zero events');
    await context.close();
  }
  {
    const { context, page } = await scenario('denied', 'granted');
    await answerFive(page);
    await page.locator('[data-finish]').click();
    await page.locator('#waLink').evaluate(el => el.addEventListener('click', e => e.preventDefault()));
    await page.locator('#waLink').click();
    const result = await events(page);
    assert.deepEqual(result.ga, [], 'Analytics denied, still no GA events');
    assert.equal(result.meta.filter(x => x === 'Contact').length, 1);
    assert.equal(result.meta.filter(x => x === 'Lead').length, 0);
    report.checks.push('Independent marketing consent; only Contact intent emitted');
    await context.close();
  }
  console.log(JSON.stringify({ success: true, ...report }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
