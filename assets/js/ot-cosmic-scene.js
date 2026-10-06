/* Quiet stars and a particle ribbon connect the existing photographic globe to the scroll wave. */
(() => {
  'use strict';
  const earth = document.getElementById('earthJourney');
  const canvas = earth?.querySelector('.cosmic-scene');
  const context = canvas?.getContext('2d');
  if (!context) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const compact = matchMedia('(max-width:900px)');
  let frame = 0, last = 0, width = 0, height = 0;
  const lite = () => compact.matches || navigator.connection?.saveData || Number(navigator.deviceMemory || 8) <= 4;
  // Deterministic positions prevent sparkle jumps on resize and motion preference changes.
  const noise = i => { const value = Math.sin(i * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
  function draw(now) {
    context.clearRect(0,0,width,height);
    const rail = Number(earth.dataset.rail) || 0;
    const time = reduced.matches || lite() ? 0 : now * .00022;
    const count = lite() ? 75 : 180;
    for (let i = 0; i < count; i++) {
      const x = rail + noise(i + 1) * (width - rail), y = noise(i + 310) * height;
      const right = (x - rail) / Math.max(1,width - rail);
      const alpha = (.12 + noise(i + 420) * .42) * (.25 + right * .75);
      context.fillStyle = `rgba(190,219,255,${alpha})`;
      const size = noise(i + 80) > .975 ? 1.6 : .8;
      context.beginPath(); context.arc(x,y,size,0,Math.PI * 2); context.fill();
    }
    const morph = Number(earth.dataset.morph) || 0;
    const ribbonOpacity = (1 - morph) * (compact.matches ? .26 : .65);
    if (ribbonOpacity < .01) return;
    const rows = lite() ? 7 : 15, cols = lite() ? 75 : 145;
    const base = compact.matches ? Number(earth.dataset.centerY) + Number(earth.dataset.diameter) * .47 : height * .86;
    for (let row = 0; row < rows; row++) {
      const depth = row / rows;
      for (let col = 0; col < cols; col++) {
        const u = col / (cols - 1);
        const x = rail + u * (width - rail);
        const y = base + Math.sin(u * 7 + time + depth * 2) * height * .047 + Math.sin(u * 14 - time) * height * .013 + depth * 54 - u * height * .08;
        const edge = Math.sin(u * Math.PI);
        context.fillStyle = `rgba(${u > .62 ? '150,103,245' : '55,204,246'},${ribbonOpacity * edge * (.25 + depth * .5)})`;
        const size = .8 + depth * .6;
        context.fillRect(x,y,size,size);
      }
    }
  }
  function tick(now) {
    if (now - last >= 50) { draw(now); last = now; }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    const animate = earth.dataset.animate === 'true' && !reduced.matches && !lite() && !document.hidden;
    if (animate && !frame) frame = requestAnimationFrame(tick);
    if (!animate && frame) { cancelAnimationFrame(frame); frame = 0; }
    if (!animate) draw(performance.now());
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1,1.3);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    draw(performance.now()); sync();
  }
  earth.addEventListener('ot-earth-visibility',sync);
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',resize);
  compact.addEventListener('change',resize);
  addEventListener('pagehide',() => { cancelAnimationFrame(frame); frame = 0; });
  resize();
})();
