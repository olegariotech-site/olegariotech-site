const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const sizes = [[1920, 1080], [1440, 900], [1366, 768], [1024, 768], [430, 932], [390, 844], [375, 812], [360, 800]];
const cases = ['acai', 'kl', 'adega', 'advocacia', 'navalha', 'mercado'];
const report = [];
fs.mkdirSync('visual-check-output', { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [width, height] of sizes) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      await page.goto('http://127.0.0.1:8009/', { waitUntil: 'domcontentloaded' });
      await page.locator('#projetos .project-stage .project-image').waitFor();
      await page.locator('#projetos .project-copy p').filter({ hasText: 'Projeto concluído e entregue.' }).waitFor();
      assert.equal((await page.locator('#projetos .projects-head .section-label').textContent()).trim(), 'Projetos que geram resultados');
      assert.equal((await page.locator('#projetos .projects-head .section-title').textContent()).trim(), 'Prova antes da promessa.');
      await page.locator('#otConsent').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      if (await page.locator('#otConsent').isVisible()) await page.locator('[data-consent-reject]').click();
      assert.equal(await page.locator('#projetos [role=tablist]').count(), 1);
      assert.equal(await page.locator('#projetos [role=group]').count(), 2);
      assert.deepEqual(await page.locator('#projetos [role=group]').evaluateAll(groups => groups.map(group => group.getAttribute('aria-labelledby'))), ['projectGroupReal', 'projectGroupConcept']);
      assert.deepEqual(await page.locator('#projetos .project-tab__rating').evaluateAll(nodes => nodes.map(n => n.closest('[data-project]').dataset.project)), ['acai', 'advocacia']);
      assert.equal(await page.locator('#projetos [data-project=kl]').evaluate(el => getComputedStyle(el, '::after').content), '"novo"');
      for (const key of cases) {
        const tab = page.locator(`#projetos [data-project=${key}]`);
        await tab.evaluate(el => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 160, behavior: 'instant' }));
        await tab.click();
        assert.equal(await tab.getAttribute('aria-selected'), 'true', `${width}: selected ${key}`);
        assert.equal(await page.locator('#projetos [aria-selected=true]').count(), 1);
        const metrics = await page.locator('#projetos').evaluate(section => {
          const box = node => { const b = node.getBoundingClientRect(); return { top: b.top, right: b.right, left: b.left, width: b.width, height: b.height }; };
          const tabs = [...section.querySelectorAll('[data-project]')];
          return { section: box(section), image: box(section.querySelector('.project-image')), copy: box(section.querySelector('.project-copy')), tabs: tabs.map(box), bodyWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, quote: section.querySelector('.project-testimonial blockquote')?.textContent || '', links: [...section.querySelectorAll('.project-actions a')].map(a => a.href) };
        });
        assert.ok(metrics.tabs.every(b => b.left >= -1 && b.right <= width + 1), `${width}: tab outside viewport`);
        assert.ok(metrics.image.width > 0 && metrics.image.height > 0, `${width}: empty image ${key}`);
        assert.ok(metrics.section.right <= width + 1, `${width}: project section overflow`);
        if (width > 1240) assert.ok(Math.abs(metrics.image.top - metrics.copy.top) <= 20, `${width}: top misalignment ${key}`);
        else assert.ok(metrics.image.top < metrics.copy.top, `${width}: image not before copy ${key}`);
        assert.equal(metrics.links.length, 2, `${width}: missing CTA ${key}`);
        if (key === 'acai') assert.match(metrics.quote, /O resultado ficou acima das minhas expectativas/);
        if (key === 'advocacia') assert.match(metrics.quote, /O site ficou profissional, elegante/);
        if (key !== 'acai' && key !== 'advocacia') assert.equal(metrics.quote, '');
        if ((key === 'acai') || ([1366, 390].includes(width) && ['kl', 'adega', 'advocacia', 'navalha', 'mercado'].includes(key))) {
          await page.locator('#projetos .project-stage').screenshot({ path: `visual-check-output/${width}-${key}.png`, animations: 'disabled' });
        }
        report.push({ width, key, imageTop: Math.round(metrics.image.top), copyTop: Math.round(metrics.copy.top), sectionWidth: Math.round(metrics.section.width), viewportWidth: metrics.viewportWidth, bodyWidth: metrics.bodyWidth });
      }
      const first = page.locator('#projetos [data-project=acai]');
      await first.press('Enter');
      await first.evaluate(el => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 170, behavior: 'instant' }));
      await page.screenshot({ path: `visual-check-output/${width}-tabs.png`, animations: 'disabled' });
      await first.press('ArrowRight');
      assert.equal(await page.locator('#projetos [aria-selected=true]').getAttribute('data-project'), 'kl');
      await page.locator('#projetos [data-project=kl]').press('End');
      assert.equal(await page.locator('#projetos [aria-selected=true]').getAttribute('data-project'), 'mercado');
      await page.locator('#projetos [data-project=mercado]').press('Home');
      assert.equal(await page.locator('#projetos [aria-selected=true]').getAttribute('data-project'), 'acai');
      await page.close();
    }
    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await reduced.goto('http://127.0.0.1:8009/', { waitUntil: 'domcontentloaded' });
    await reduced.locator('#projetos .project-image').waitFor();
    await reduced.locator('#projetos [data-project=kl]').press('Enter');
    const motion = await reduced.locator('#projetos .project-image').evaluate(el => ({ requested: matchMedia('(prefers-reduced-motion: reduce)').matches, name: getComputedStyle(el).animationName, cssLoaded: !!document.querySelector('link[href*="ot-project-cases.css"]')?.sheet }));
    assert.equal(motion.requested, true);
    assert.equal(motion.cssLoaded, true);
    assert.ok(['none', ''].includes(motion.name), `reduced motion animation: ${motion.name}`);
    await reduced.close();
    fs.writeFileSync('visual-check-output/report.json', JSON.stringify(report, null, 2));
    console.log(`PASS: ${sizes.length} viewport widths, ${cases.length} cases, keyboard tabs, reduced motion`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
