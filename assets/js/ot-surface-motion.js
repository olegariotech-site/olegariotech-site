/* Inertial pointer depth for previews. Touch and reduced motion keep stable surfaces. */
(() => {
  'use strict';
  if (document.body?.dataset.page !== 'home') return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const pointer = matchMedia('(hover:hover) and (pointer:fine) and (min-width:901px)');
  const selector = '#solutionMedia, #projectStage .project-image, .ot-method-build';
  const allowed = () => pointer.matches && !reduced.matches && !navigator.connection?.saveData && !document.hidden;
  let active = null, rect = null, frame = 0, last = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  const clamp = v => Math.max(-1, Math.min(1, v));

  function clear() {
    if (frame) cancelAnimationFrame(frame);
    frame = last = 0;
    if (active) {
      active.classList.remove('is-surface-active');
      for (const property of ['--surface-rx','--surface-ry','--surface-dx','--surface-dy','--surface-light-x','--surface-light-y']) active.style.removeProperty(property);
    }
    active = rect = null; x = y = targetX = targetY = 0;
  }
  function paint(now) {
    frame = 0;
    if (!active?.isConnected || !allowed()) { clear(); return; }
    const delta = last ? Math.min(now - last, 64) : 16.7;
    const blend = 1 - Math.exp(-delta / 95);
    last = now;
    x += (targetX - x) * blend; y += (targetY - y) * blend;
    const method = active.matches('.ot-method-build');
    active.style.setProperty('--surface-rx', `${(-y * (method ? 7 : 4)).toFixed(3)}deg`);
    active.style.setProperty('--surface-ry', `${(x * (method ? 9 : 5)).toFixed(3)}deg`);
    active.style.setProperty('--surface-dx', `${(x * 5).toFixed(3)}px`);
    active.style.setProperty('--surface-dy', `${(y * 4).toFixed(3)}px`);
    active.style.setProperty('--surface-light-x', `${50 + x * 45}%`);
    active.style.setProperty('--surface-light-y', `${50 + y * 45}%`);
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .002) frame = requestAnimationFrame(paint);
    else if (!active.classList.contains('is-surface-active')) clear();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
  function release() {
    if (!active) return;
    active.classList.remove('is-surface-active');
    targetX = targetY = 0; schedule();
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !allowed()) return;
    const surface = event.target instanceof Element ? event.target.closest(selector) : null;
    if (!surface) { release(); return; }
    if (active !== surface) {
      clear(); active = surface; rect = surface.getBoundingClientRect();
    }
    active.classList.add('is-surface-active');
    targetX = clamp((event.clientX - rect.left) / rect.width * 2 - 1);
    targetY = clamp((event.clientY - rect.top) / rect.height * 2 - 1);
    schedule();
  }, {passive:true});
  document.addEventListener('pointerout', event => {
    if (active && (!(event.relatedTarget instanceof Node) || !active.contains(event.relatedTarget))) release();
  }, {passive:true});
  addEventListener('scroll', clear, {passive:true});
  addEventListener('resize', clear, {passive:true});
  addEventListener('pagehide', clear);
  document.addEventListener('visibilitychange', clear);
  reduced.addEventListener('change', clear);
  pointer.addEventListener('change', clear);

  // Each text stage lights its corresponding wireframe layer without moving the copy.
  const method = document.getElementById('metodo');
  function focusStage(event) {
    const card = event.target instanceof Element ? event.target.closest('.method-card') : null;
    if (!method || !card) return;
    method.dataset.methodFocus = String([...method.querySelectorAll('.method-card')].indexOf(card) + 1);
  }
  method?.addEventListener('pointerover', focusStage, {passive:true});
  method?.addEventListener('focusin', focusStage);
  method?.addEventListener('pointerleave', () => { method.dataset.methodFocus = '0'; });
  method?.addEventListener('focusout', event => { if (!method.contains(event.relatedTarget)) method.dataset.methodFocus = '0'; });
})();
