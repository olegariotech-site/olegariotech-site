/* One scroll timeline shared by the globe and its particle surface. No scroll interception. */
(() => {
  'use strict';
  const earth = document.getElementById('earthJourney');
  const hero = document.getElementById('inicio');
  const solutions = document.getElementById('solucoes');
  const visual = hero?.querySelector('.hero-visual');
  if (!earth || !hero || !visual || !solutions) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const mobile = matchMedia('(max-width:900px)');
  const clamp = v => Math.min(1, Math.max(0, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  let frame = 0, pointerX = 0, pointerY = 0;
  document.documentElement.classList.add('has-earth-journey', 'has-immersive-universe');

  function update() {
    frame = 0;
    const h = innerHeight, w = innerWidth;
    const heroRect = hero.getBoundingClientRect();
    const target = visual.getBoundingClientRect();
    const solutionRect = solutions.getBoundingClientRect();
    const rail = mobile.matches ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rail')) || 250;
    const diameter = mobile.matches ? Math.min(target.width * .9, 410) : Math.min((w - rail) * .45, target.height * 1.05, 610);
    const baseX = mobile.matches ? target.left + target.width * .5 : Math.min(target.left + target.width * .52, w - diameter * .53 - 40);
    const baseY = target.top + target.height * (mobile.matches ? .5 : .48);
    const travel = Math.max(1,heroRect.height * .9);
    const progress = reduced.matches || mobile.matches ? 0 : clamp(-heroRect.top / travel);
    const pulse = smooth((progress - .06) / .30);
    const morph = smooth((progress - .32) / .48);
    const fade = mobile.matches ? smooth((h * .25 - heroRect.bottom) / (h * .25)) : smooth((progress - .65) / .35);
    const visible = heroRect.bottom > 0 && heroRect.top < h;
    const opacity = visible ? 1 - fade : 0;
    const cx = baseX + pointerX * (1 - morph) * 12;
    const cy = baseY + pointerY * (1 - morph) * 9;
    const next = {
      progress: progress.toFixed(4), pulse: pulse.toFixed(4), morph: morph.toFixed(4),
      opacity: opacity.toFixed(4), centerX: cx.toFixed(1), centerY: cy.toFixed(1),
      diameter: diameter.toFixed(1), rail: String(rail), animate: String(opacity > .005 && !document.hidden && !reduced.matches && !mobile.matches)
    };
    next.ribbonFloor = String((hero.querySelector('.hero-proof')?.getBoundingClientRect().bottom || 0) + 40);
    Object.assign(earth.dataset, next);
    earth.style.setProperty('--earth-left', `${cx}px`);
    earth.style.setProperty('--earth-top', `${cy}px`);
    earth.style.setProperty('--earth-size', `${diameter}px`);
    earth.style.setProperty('--earth-opacity', opacity.toFixed(4));
    earth.style.setProperty('--earth-photo', ((1 - pulse) * (1 - morph)).toFixed(4));
    earth.style.setProperty('--earth-wave', (pulse * morph * opacity).toFixed(4));
    earth.classList.toggle('is-wave', morph > .55 && opacity > .1);
    earth.dispatchEvent(new Event('ot-earth-visibility'));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  mobile.addEventListener('change', schedule);
  // Show the decorative glow only after font-dependent HERO geometry is settled.
  // This avoids counting its initial repositioning as a visible layout shift.
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => { update(); earth.classList.add('is-geometry-ready'); });
  } else {
    earth.classList.add('is-geometry-ready');
  }
  const layoutObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  layoutObserver?.observe(hero); layoutObserver?.observe(visual);
  // Pointer movement never controls scrolling or text; touch remains a normal page.
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || mobile.matches || reduced.matches) return;
    pointerX = (event.clientX / innerWidth - .5) * 2;
    pointerY = (event.clientY / innerHeight - .5) * 2;
    schedule();
  }, {passive:true});
  hero.addEventListener('pointerleave', () => { pointerX = pointerY = 0; schedule(); });
  update();
})();
