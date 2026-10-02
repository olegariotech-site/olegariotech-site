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
    if (!method.querySelector('.method-scene')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'method-scene';
      const build = document.createElement('div');
      build.className = 'ot-method-build';
      build.setAttribute('aria-hidden', 'true');
      build.innerHTML = `<svg viewBox="0 0 400 340" aria-hidden="true">
        <g class="build-content"><rect x="52" y="45" width="296" height="224" rx="10"/><path d="M52 78h296"/></g>
        <g data-build="1"><rect pathLength="1" x="52" y="45" width="296" height="224" rx="10"/><path pathLength="1" d="M52 78h296M68 61h2M80 61h2M92 61h2"/></g>
        <g data-build="2"><path pathLength="1" d="M80 106h100M80 118h73M80 141h116M80 151h96M80 161h106"/><rect pathLength="1" x="226" y="102" width="92" height="82" rx="4"/><path pathLength="1" d="m226 165 28-30 20 18 25-34 19 25"/></g>
        <g data-build="3"><rect pathLength="1" x="80" y="192" width="108" height="25" rx="5"/><path pathLength="1" d="M96 205h65M80 240h48M151 240h47M221 240h97"/></g>
        <g data-build="4"><path pathLength="1" d="M200 269v26h100v-45M115 269v41h-50v-92"/><circle pathLength="1" cx="300" cy="243" r="6"/><circle pathLength="1" cx="65" cy="212" r="6"/><path pathLength="1" d="m278 302 9 9 20-20"/></g>
      </svg>`;
      methodGrid.before(wrapper);
      wrapper.append(build, methodGrid);
    }
    methodGrid.classList.add('ot-pulse-method');
    methodCards.forEach((card, index) => card.dataset.pulseStep = String(index + 1));
    return true;
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

  function appendNetworkPath(group, d, className, index, delay = 0) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', className);
    path.setAttribute('d', d);
    path.dataset.index = String(index);
    if (delay) path.style.animationDelay = `${delay.toFixed(2)}s`;
    group.appendChild(path);
  }

  function layoutNetwork() {
    if (!shell || !svg || !hub || innerWidth <= 1100) return;
    const shellRect = shell.getBoundingClientRect();
    const copy = shell.querySelector('.ot-ecosystem__copy');
    const copyRect = copy?.getBoundingClientRect();
    if (!copyRect) return;

    const rects = cards.map(card => card.getBoundingClientRect());
    const leftRects = rects.filter((_, index) => index % 2 === 0);
    const rightRects = rects.filter((_, index) => index % 2 === 1);
    if (!leftRects.length || !rightRects.length) return;

    const leftX = leftRects[0].left - shellRect.left - 8;
    const rightX = rightRects[0].left - shellRect.left - 8;
    const leftYs = leftRects.map(r => r.top - shellRect.top + r.height * .5);
    const rightYs = rightRects.map(r => r.top - shellRect.top + r.height * .5);
    const topRailY = Math.max(18, Math.min(...rects.map(r => r.top - shellRect.top)) - 12);
    const startX = Math.min(leftX - 26, copyRect.right - shellRect.left + 9);
    const startY = leftYs[Math.floor(leftYs.length / 2)];

    hub.style.left = `${startX}px`;
    hub.style.top = `${startY}px`;

    svg.setAttribute('viewBox', `0 0 ${Math.max(1, shellRect.width)} ${Math.max(1, shellRect.height)}`);
    const base = svg.querySelector('[data-pulse-base]');
    const active = svg.querySelector('[data-pulse-active]');
    const runner = svg.querySelector('[data-pulse-runner]');
    base.textContent = ''; active.textContent = ''; runner.textContent = '';

    const segments = [];
    segments.push(`M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${leftX.toFixed(1)} ${startY.toFixed(1)}`);
    segments.push(`M ${leftX.toFixed(1)} ${Math.min(...leftYs).toFixed(1)} L ${leftX.toFixed(1)} ${Math.max(...leftYs).toFixed(1)}`);

    leftRects.forEach((r, i) => {
      const y = leftYs[i];
      const x = r.left - shellRect.left + 1;
      segments.push(`M ${leftX.toFixed(1)} ${y.toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`);
    });

    segments.push(`M ${leftX.toFixed(1)} ${Math.min(...leftYs).toFixed(1)} L ${leftX.toFixed(1)} ${topRailY.toFixed(1)} L ${rightX.toFixed(1)} ${topRailY.toFixed(1)} L ${rightX.toFixed(1)} ${Math.min(...rightYs).toFixed(1)}`);
    segments.push(`M ${rightX.toFixed(1)} ${Math.min(...rightYs).toFixed(1)} L ${rightX.toFixed(1)} ${Math.max(...rightYs).toFixed(1)}`);

    rightRects.forEach((r, i) => {
      const y = rightYs[i];
      const x = r.left - shellRect.left + 1;
      segments.push(`M ${rightX.toFixed(1)} ${y.toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`);
    });

    segments.forEach((d, index) => {
      appendNetworkPath(base, d, 'ot-pulse-network__base', index);
      appendNetworkPath(active, d, 'ot-pulse-network__active', index);
      appendNetworkPath(runner, d, 'ot-pulse-network__runner', index, -index * .22);
    });
    syncPathLengths();
  }

  function syncPathLengths() {
    if (!svg) return;
    const progress = parseFloat(shell?.style.getPropertyValue('--ecosystem-pulse') || '0') || 0;
    [...svg.querySelectorAll('.ot-pulse-network__active')].forEach((path, index) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      const local = clamp((progress * 1.18) - index * .042);
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
      methodCards = [...methodGrid.querySelectorAll('.method-card')];
      method.querySelectorAll('[data-build]').forEach(group => {
        const step = +group.dataset.build - 1;
        group.style.setProperty('--build-progress', clamp(p * 4 - step).toFixed(3));
      });
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
          const local = clamp((p * 1.18) - index * .042);
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
    if (reduced.matches || saveData) {
      setupMethod();
      method?.querySelectorAll('[data-build]').forEach(group => group.style.setProperty('--build-progress', '1'));
      return;
    }
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
