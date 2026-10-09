/* V2.1: one atmospheric canvas follows the original Earth timeline, then the whole page.
   No new globe renderer, scroll interception, asset, or animation framework. */
(() => {
  'use strict';
  const earth = document.getElementById('earthJourney');
  const canvas = earth?.querySelector('.cosmic-scene');
  const context = canvas?.getContext('2d');
  const page = document.querySelector('body[data-page="home"] .page');
  if (!context || !page) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const compact = matchMedia('(max-width:900px)');
  const connection = navigator.connection;
  const constrained = () => !!connection?.saveData || Number(navigator.deviceMemory || 8) <= 4;
  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const noise = i => { const value = Math.sin(i * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
  const mix = (a,b,t) => a + (b - a) * t;
  // Move the existing canvas out of the fading globe. Same canvas, one scheduler.
  const layer = document.createElement('div');
  layer.className = 'ot-atmosphere'; layer.setAttribute('aria-hidden','true');
  earth.after(layer); layer.append(canvas);
  const particles = Array.from({length:128},(_,i) => ({
    x:noise(i+1), y:noise(i+310), depth:.18+noise(i+420)*.82,
    phase:noise(i+80)*Math.PI*2, size:.45+noise(i+150)*.9
  }));
  const profiles = [
    ['#inicio',1], ['#projetos',.68], ['#solucoes',.58], ['#metodo',.64],
    ['#sobre',.48], ['#ecossistema',.5], ['#faq',.34], ['#contato',.42], ['.footer',.22]
  ];
  const readingSelector = '.hero-copy,.projects-head,.case-copy,.case-followup,.solution-content,.choice-heading,.section-copy,.faq-list,.cta-box,.about-grid,.method-card';
  let width=0, height=0, frame=0, last=0, clock=0, measureFrame=0;
  let anchors=[], reading=[], hidden=false;

  // Layout reads happen on layout changes, not inside the continuous paint loop.
  function measure() {
    measureFrame=0;
    const y=scrollY;
    anchors=profiles.map(([selector,density]) => {
      const el=document.querySelector(selector); if(!el)return null;
      const r=el.getBoundingClientRect(); return {y:y+r.top+r.height*.5,density};
    }).filter(Boolean).sort((a,b)=>a.y-b.y);
    reading=[...page.querySelectorAll(readingSelector)].map(el => {
      const r=el.getBoundingClientRect();
      return {left:r.left-24,right:r.right+24,top:y+r.top-24,bottom:y+r.bottom+24};
    });
    sync();
  }
  function scheduleMeasure() { if(!measureFrame)measureFrame=requestAnimationFrame(measure); }
  function densityAt(y) {
    if(!anchors.length)return .5;
    if(y<=anchors[0].y)return anchors[0].density;
    for(let i=1;i<anchors.length;i++)if(y<=anchors[i].y){
      const a=anchors[i-1],b=anchors[i];
      return mix(a.density,b.density,smooth((y-a.y)/Math.max(1,b.y-a.y)));
    }
    return anchors[anchors.length-1].density;
  }
  function dust(time) {
    const rail=Number(earth.dataset.rail)||0;
    const opacity=Number(earth.dataset.opacity)||0, pulse=Number(earth.dataset.pulse)||0;
    const release=smooth(1-opacity*(1-pulse*.65));
    const cx=Number(earth.dataset.centerX)||width*.78, cy=Number(earth.dataset.centerY)||height*.5;
    const radius=(Number(earth.dataset.diameter)||540)*.5;
    const still=reduced.matches||constrained();
    const scroll=still?0:scrollY;
    const count=constrained()?24:compact.matches?44:particles.length;
    const density=densityAt(scrollY+height*.55);
    // Coherent eddies, different depths and no uniform vertical velocity: dust, not rain.
    for(let i=0;i<count;i++){
      const p=particles[i], near=i%3!==0;
      const drift=still?0:time*(.045+p.depth*.035);
      const u=p.x+Math.sin(drift+p.phase)*.018*p.depth;
      const v=p.y+(still?0:Math.sin(drift*.7+p.phase)*.012+scroll*.000035*p.depth);
      const fieldX=rail+clamp(u)*(width-rail);
      const fieldY=((v%1+1)%1)*height;
      const orbit=p.phase+(still?0:time*.009);
      const haloX=cx+Math.cos(orbit)*radius*(1.1+p.depth*.8);
      const haloY=cy+Math.sin(orbit)*radius*(.65+p.depth*.75);
      const spread=near?release:1;
      const x=mix(haloX,fieldX,spread),y=mix(haloY,fieldY,spread);
      if(x<rail||x>width||y<0||y>height)continue;
      const inReading=reading.some(r=>x>=r.left&&x<=r.right&&y+scrollY>=r.top&&y+scrollY<=r.bottom);
      const edge=.22+smooth((x-rail)/Math.max(1,width-rail))*.78;
      const alpha=(.16+p.depth*.29)*density*edge*(inReading ? .16 : 1)*(compact.matches ? .7 : 1);
      context.globalAlpha=alpha;
      context.fillStyle=i%7===0?'#a78bfa':i%3===0?'#67e8f9':'#c5d8ee';
      context.beginPath(); context.arc(x,y,p.size*(.65+p.depth*.6),0,Math.PI*2); context.fill();
    }
    context.globalAlpha=1;
  }
  function ribbon(time) {
    const morph=Number(earth.dataset.morph)||0;
    const opacity=(1-morph)*(Number(earth.dataset.opacity)||0)*(compact.matches ? .4 : .8);
    if(opacity<.01)return;
    const lite=compact.matches||constrained();
    const rail=Number(earth.dataset.rail)||0, rows=lite?6:12, cols=lite?72:128;
    const base=Number(earth.dataset.centerY)+Number(earth.dataset.diameter)*.48+20;
    const center=u => {
      const line=base+Math.sin(u*9+time*.22)*28+Math.sin(u*16-time*.11)*8-u*34;
      return line+Math.max(0,(Number(earth.dataset.ribbonFloor)||0)-line)*smooth((.7-u)/.3);
    };
    context.globalCompositeOperation='lighter';
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const u=col/(cols-1),spread=(row/rows-.5)*2;
      const x=rail+(u+(noise(row*450+col)-.5)/cols)*(width-rail);
      const y=center(u)+spread*(7+u*u*66)+Math.sin(u*22+spread*4+time*.22)*u*8;
      context.globalAlpha=opacity*(.25+Math.sin(u*Math.PI)*.75)*(1-Math.abs(spread)*.7)*(.5+noise(row*300+col)*.5);
      context.fillStyle=u>.65&&row>rows*.4?'#8450ff':'#37c5ff';
      const size=.8+noise(row*410+col)*1.1;context.fillRect(x,y,size,size);
    }
    const color=context.createLinearGradient(rail,0,width,0);
    color.addColorStop(0,'rgba(35,174,255,.12)');color.addColorStop(.48,'rgba(68,213,255,.7)');
    color.addColorStop(.66,'rgba(191,247,255,.95)');color.addColorStop(.8,'rgba(121,66,250,.7)');color.addColorStop(1,'rgba(40,173,255,.2)');
    context.globalAlpha=opacity;context.strokeStyle=color;context.lineWidth=1;
    context.beginPath();
    for(let col=0;col<96;col++){const u=col/95,x=rail+u*(width-rail),y=center(u);if(!col)context.moveTo(x,y);else context.lineTo(x,y);}
    context.stroke();context.globalAlpha=1;context.globalCompositeOperation='source-over';
  }
  function draw() {
    context.clearRect(0,0,width,height);
    dust(clock);ribbon(reduced.matches||constrained()?0:clock);
  }
  function stop() { if(frame)cancelAnimationFrame(frame);frame=last=0; }
  function tick(now) {
    const interval=compact.matches?80:50;
    if(now-last>=interval){
      clock+=last?Math.min(now-last,100)/1000:interval/1000;
      last=now;draw();
    }
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    if(document.hidden||hidden){stop();return;}
    if(reduced.matches||constrained()){stop();draw();}
    else if(!frame)frame=requestAnimationFrame(tick);
  }
  function resize() {
    width=innerWidth;height=innerHeight;
    const ratio=Math.min(devicePixelRatio||1,compact.matches||constrained()?1:1.3);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);measure();draw();
  }
  // The original timeline already batches scroll/pointer updates into a single RAF.
  earth.addEventListener('ot-earth-visibility',sync);
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',resize);compact.addEventListener('change',resize);
  connection?.addEventListener('change',resize);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(scheduleMeasure):null;
  observer?.observe(page);
  document.fonts?.ready.then(scheduleMeasure);
  addEventListener('pagehide',()=>{hidden=true;stop();if(measureFrame)cancelAnimationFrame(measureFrame);measureFrame=0;});
  addEventListener('pageshow',()=>{hidden=false;scheduleMeasure();});
  resize();
})();
