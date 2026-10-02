/* OT Experience 2.0 — Digital Pulse journey.
   Builds the method progressively and turns the ecosystem into a lightweight emissive network. */
(() => {
  if (document.body?.dataset.page !== 'home') return;

  const mobile = matchMedia('(max-width:900px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const saveData = !!navigator.connection?.saveData;
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const ease = v => v * v * (3 - 2 * v);
  let frame = 0;
  let method, methodGrid, methodCards, ecosystem, shell, cards, svg, hub;

  function setupMethod() {
    method = document.getElementById('metodo');
    methodGrid = method?.querySelector('.method-grid');
    methodCards = methodGrid ? [...methodGrid.querySelectorAll('.method-card')] : [];
    if (!methodGrid || !methodCards.length) return false;
    methodGrid.classList.add('ot-pulse-method');
    methodCards.forEach((card, index) => card.dataset.pulseStep = String(index + 1));
    return true;
  }

  function pathBetween(x1, y1, x2, y2) {
    const bend = Math.max(34, Math.abs(x2 - x1) * .34);
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + bend).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - bend * .55).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  function buildNetwork() {
    ecosystem = document.getElementById('ecossistema');
    shell = ecosystem?.querySelector('.ot-ecosystem__shell');
    cards = shell ? [...shell.querySelectorAll('.ot-ecosystem__card')] : [];
    if (!ecosystem || !shell || cards.length < 2) return false;
    if (shell.querySelector('.ot-pulse-network')) return true;

    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ot-pulse-network');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = [
      '<defs>',
      ' <linearGradient id="otPulseGradient" x1="0" x2="1">',
      '  <stop offset="0%" stop-color="#67e8f9"/>',
      '  <stop offset="55%" stop-color="#7dd3fc"/>',
      '  <stop offset="100%" stop-color="#a855f7"/>',
      ' </linearGradient>',
      '</defs>',
      '<g data-pulse-base></g>',
      '<g data-pulse-active></g>',
      '<g data-pulse-runner></g>'
    ].join('');
    shell.prepend(svg);

    hub = document.createElement('span');
    hub.className = 'ot-pulse-hub';
    hub.setAttribute('aria-hidden', 'true');
    shell.appendChild(hub);
    layoutNetwork();
    return true;
  }

  function layoutNetwork() {
    if (!shell || !svg || !hub || innerWidth <= 1100) return;
    const shellRect = shell.getBoundingClientRect();
    const copy = shell.querySelector('.ot-ecosystem__copy');
    const copyRect = copy?.getBoundingClientRect();
    if (!copyRect) return;

    const startX = copyRect.right - shellRect.left + 7;
    const startY = Math.min(shellRect.height * .57, copyRect.top - shellRect.top + copyRect.height * .58);
    hub.style.left = `${startX}px`;
    hub.style.top = `${startY}px`;

    svg.setAttribute('viewBox', `0 0 ${Math.max(1, shellRect.width)} ${Math.max(1, shellRect.height)}`);
    const base = svg.querySelector('[data-pulse-base]');
    const active = svg.querySelector('[data-pulse-active]');
    const runner = svg.querySelector('[data-pulse-runner]');
    base.textContent = ''; active.textContent = ''; runner.textContent = '';

    cards.forEach((card, index) => {
      const r = card.getBoundingClientRect();
      const endX = r.left - shellRect.left + 1;
      const endY = r.top - shellRect.top + r.height * .5;
      const d = pathBetween(startX, startY, endX, endY);
      const basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      basePath.setAttribute('class', 'ot-pulse-network__base');
      basePath.setAttribute('d', d);
      base.appendChild(basePath);

      const activePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      activePath.setAttribute('class', 'ot-pulse-network__active');
      activePath.setAttribute('d', d);
      activePath.dataset.index = String(index);
      active.appendChild(activePath);

      const runnerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      runnerPath.setAttribute('class', 'ot-pulse-network__runner');
      runnerPath.setAttribute('d', d);
      runnerPath.style.animationDelay = `${(-index * .34).toFixed(2)}s`;
      runner.appendChild(runnerPath);
    });
    syncPathLengths();
  }

  function syncPathLengths() {
    if (!svg) return;
    const progress = parseFloat(shell?.style.getPropertyValue('--ecosystem-pulse') || '0') || 0;
    [...svg.querySelectorAll('.ot-pulse-network__active')].forEach((path, index) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      const local = clamp((progress * 1.22) - index * .055);
      path.style.strokeDashoffset = String(len * (1 - local));
    });
  }

  function update() {
    frame = 0;
    const h = innerHeight || 1;

    if (method && methodGrid && methodCards?.length) {
      const r = method.getBoundingClientRect();
      const p = ease(clamp((h * .78 - r.top) / Math.max(1, r.height * .72)));
      methodGrid.style.setProperty('--method-pulse', p.toFixed(3));
      methodCards.forEach((card, index) => {
        const threshold = (index + .38) / methodCards.length;
        card.classList.toggle('is-pulse-built', p >= threshold);
      });
    }

    if (ecosystem && shell && cards?.length) {
      const r = ecosystem.getBoundingClientRect();
      const visible = r.top < h * .92 && r.bottom > h * .08;
      const p = ease(clamp((h * .84 - r.top) / Math.max(1, r.height * .74)));
      shell.style.setProperty('--ecosystem-pulse', p.toFixed(3));
      ecosystem.classList.toggle('is-pulse-active', visible && p > .08);
      cards.forEach((card, index) => {
        const threshold = .16 + index * (.68 / Math.max(1, cards.length - 1));
        card.classList.toggle('is-pulse-live', p >= threshold);
      });
      if (svg && innerWidth > 1100) {
        [...svg.querySelectorAll('.ot-pulse-network__active')].forEach((path, index) => {
          const len = path.getTotalLength();
          const local = clamp((p * 1.22) - index * .055);
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = String(len * (1 - local));
        });
        const runners = svg.querySelector('[data-pulse-runner]');
        if (runners) runners.style.opacity = p > .58 ? String(clamp((p - .58) / .22)) : '0';
      }
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function init() {
    if (mobile.matches || reduced.matches || saveData) return;
    if (!setupMethod()) return;

    document.documentElement.classList.add('has-digital-pulse-journey');

    const attachEcosystem = () => {
      if (!buildNetwork()) return false;
      update();
      return true;
    };

    if (!attachEcosystem()) {
      const observer = new MutationObserver(() => {
        if (attachEcosystem()) observer.disconnect();
      });
      observer.observe(document.body, {childList:true, subtree:true});
      setTimeout(() => observer.disconnect(), 8000);
    }

    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', () => {
      if (buildNetwork()) layoutNetwork();
      schedule();
    }, {passive:true});
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
