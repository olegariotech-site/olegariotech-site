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
    const ribbonOpacity = (1 - morph) * (compact.matches ? .5 : 1);
    if (ribbonOpacity < .01) return;
    const rows = lite() ? 12 : 32, cols = lite() ? 110 : 240;
    const base = Number(earth.dataset.centerY) + Number(earth.dataset.diameter) * .48 + 20;
    const center = u => {
      const line = base + Math.sin(u * 9 + time) * 28 + Math.sin(u * 16 - time * .5) * 8 - u * 34;
      const guard = Math.max(0,Math.min(1,(.62 - u) / .12));
      return line + Math.max(0,(Number(earth.dataset.ribbonFloor) || 0) - line) * guard;
    };
    context.globalCompositeOperation = 'lighter';
    for (let row = 0; row < rows; row++) {
      const depth = row / rows, spread = (depth - .5) * 2;
      for (let col = 0; col < cols; col++) {
        const u = col / (cols - 1);
        const x = rail + (u + (noise(row * 450 + col) - .5) / cols) * (width - rail);
        const y = center(u) + spread * (7 + u * u * 66) + Math.sin(u * 22 + spread * 4 + time) * u * 8 + (noise(row * 480 + col) - .5) * 4;
        const edge = .25 + Math.sin(u * Math.PI) * .75;
        const alpha = ribbonOpacity * edge * (1 - Math.abs(spread) * .7) * (.5 + noise(row * 300 + col) * .5);
        context.fillStyle = `rgba(${u > .65 && row > rows * .4 ? '132,80,255' : '55,197,255'},${alpha})`;
        const size = .8 + noise(row * 410 + col) * 1.1;
        context.fillRect(x,y,size,size);
      }
    }
    for(let i=0;i<(lite()?220:1100);i++){
      const u=Math.sqrt(noise(i+6000)),spread=(noise(i+8000)-.5)*2;
      const x=rail+u*(width-rail),y=center(u)+spread*(12+u*u*100);
      context.fillStyle=`rgba(${u>.64?'140,80,250':'50,192,255'},${ribbonOpacity*(1-Math.abs(spread))*(.2+u*.3)})`;
      const size=.7+noise(i+10000)*1.4;context.fillRect(x,y,size,size);
    }
    const color = context.createLinearGradient(rail,0,width,0);
    color.addColorStop(0,'rgba(35,174,255,.12)');color.addColorStop(.48,'rgba(68,213,255,.7)');
    color.addColorStop(.66,'rgba(191,247,255,.95)');color.addColorStop(.8,'rgba(121,66,250,.7)');color.addColorStop(1,'rgba(40,173,255,.2)');
    context.globalAlpha = ribbonOpacity;
    context.strokeStyle = color;context.lineWidth = 1.5;context.shadowColor = '#4bcaff';context.shadowBlur = 16;
    context.beginPath();
    for(let col=0;col<120;col++){const u=col/119,x=rail+u*(width-rail),y=center(u);if(!col)context.moveTo(x,y);else context.lineTo(x,y);}
    context.stroke();context.shadowBlur=0;context.globalAlpha=1;context.globalCompositeOperation='source-over';
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
