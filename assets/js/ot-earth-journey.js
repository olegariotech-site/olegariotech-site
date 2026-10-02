/* Scroll-linked Earth: one visual update per animation frame, no continuous render loop. */
(() => {
  const earth = document.getElementById('earthJourney');
  const hero = document.getElementById('inicio');
  const visual = hero?.querySelector('.hero-visual');
  const cta = document.getElementById('contato');
  if (!earth || !hero || !visual || !cta) return;
  document.documentElement.classList.add('has-earth-journey');

  const mobile = matchMedia('(max-width:900px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const dense = ['solucoes', 'projetos', 'metodo', 'sobre', 'produtos', 'faq']
    .map(id => document.getElementById(id)).filter(Boolean);
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const ease = value => value * value * (3 - 2 * value);
  let baseX = 0, baseY = 0, frame = 0;
  function setPulse(pulse = 0, spread = 0) {
    earth.dataset.pulse = clamp(pulse).toFixed(3);
    earth.dataset.spread = clamp(spread).toFixed(3);
  }
  function setAnimation(active) {
    const next = String(active);
    if (earth.dataset.animate !== next) {
      earth.dataset.animate = next;
      earth.dispatchEvent(new Event('ot-earth-visibility'));
    }
  }

  function measure() {
    const rect = visual.getBoundingClientRect();
    // Keep the whole opening sphere in view as its size changes across laptops and desktops.
    baseX = Math.min(rect.left + rect.width * .57, innerWidth - earth.offsetWidth * .5 - 16);
    baseY = rect.top + scrollY + rect.height * .5;
    earth.style.setProperty('--earth-left', `${baseX}px`);
    earth.style.setProperty('--earth-top', `${baseY}px`);
    update();
  }

  function update() {
    frame = 0;
    if (mobile.matches) { setPulse(0, 0); setAnimation(false); return; }
    const height = innerHeight;
    const heroRect = hero.getBoundingClientRect();
    if (reduced.matches) {
      setPulse(0, 0);
      setAnimation(false);
      earth.style.setProperty('--earth-x', '0px');
      earth.style.setProperty('--earth-y', '0px');
      earth.style.setProperty('--earth-scale', '1');
      earth.style.setProperty('--earth-opacity', heroRect.bottom > height * .2 ? '.88' : '0');
      return;
    }

    const progress = ease(clamp(-heroRect.top / Math.max(1, heroRect.height * .84)));
    // Digital Pulse prototype: photographic Earth -> particle globe -> controlled dispersion -> photo again.
    const pulseIn = ease(clamp((progress - .04) / .34));
    const pulseOut = ease(clamp((progress - .62) / .30));
    const pulse = pulseIn * (1 - pulseOut);
    const spread = ease(clamp((progress - .28) / .38)) * (1 - pulseOut);
    setPulse(pulse, spread);
    let x = (innerWidth - 106 - baseX) * progress;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - height);
    const pageProgress = clamp(scrollY / maxScroll);
    const travelY = height * (.62 + pageProgress * .12);
    let y = (travelY - baseY) * progress;
    let scale = 1 - progress * .72;
    let opacity = .88 - progress * .48;

    // Clear the reading and project sections, including their entry and exit edges.
    const reading = dense.some(section => {
      const rect = section.getBoundingClientRect();
      return rect.top < height * .82 && rect.bottom > height * .18;
    });
    if (reading) opacity = Math.min(opacity, .11);

    const ctaRect = cta.getBoundingClientRect();
    const ctaProgress = ease(clamp((height * .9 - ctaRect.top) / (height * .7)));
    if (!reading && ctaProgress > 0 && ctaRect.bottom > height * .1) {
      const targetX = innerWidth - Math.min(210, innerWidth * .17) - baseX;
      const targetY = height * .69 - baseY;
      x += (targetX - x) * ctaProgress;
      y += (targetY - y) * ctaProgress;
      scale += (.38 - scale) * ctaProgress;
      opacity = Math.max(opacity, .34 * ctaProgress);
    }
    if (ctaRect.bottom < height * .1) opacity = 0;

    earth.style.setProperty('--earth-x', `${x.toFixed(1)}px`);
    earth.style.setProperty('--earth-y', `${y.toFixed(1)}px`);
    earth.style.setProperty('--earth-scale', scale.toFixed(3));
    earth.style.setProperty('--earth-opacity', opacity.toFixed(3));
    setAnimation(opacity > .16);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure, { passive: true });
  mobile.addEventListener('change', measure);
  reduced.addEventListener('change', measure);
  measure();

  const clock = document.getElementById('orbitClock');
  if (clock) {
    const format = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit',
      second: '2-digit', hour12: false
    });
    const tick = () => { clock.textContent = `${format.format(new Date())} BRT`; };
    tick(); setInterval(tick, 1000);
  }
})();
