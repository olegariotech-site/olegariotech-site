/* V2.2: Cosmic Continuum extends the existing atmospheric canvas and original timeline.
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
  const readingSelector = '.hero-copy,.projects-head,.case-copy,.case-followup,.solution-content,.choice-heading,.section-copy,.faq-list,.cta-box,.about-grid,.method-card,.ot-footer-v4';
  let width=0, height=0, frame=0, last=0, clock=0, measureFrame=0;
  let anchors=[], reading=[], hidden=false, chapters=[], finale=null, galaxy=null;
  const photograph=earth.querySelector('.earth-journey__globe>img');
  const span=(value,a,b)=>smooth((value-a)/Math.max(1,b-a));
  photograph?.addEventListener('load',sync,{once:true});

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
    const bounds=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return {top:y+r.top,bottom:y+r.bottom};};
    chapters=['#projetos','#metodo'].map(bounds).filter(Boolean).map(r=>r.bottom);
    const contact=bounds('#contato'),footer=bounds('.footer');
    if(contact&&footer)finale={start:contact.top-height*.7,approach:footer.top-height*.5,
      finish:Math.max(contact.top,document.documentElement.scrollHeight-height),
      y:footer.top+(compact.matches?150:210),x:width*(compact.matches?.64:.76)};
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
    continuum();dust(clock);ribbon(reduced.matches||constrained()?0:clock);
  }
  // Cached procedural nebula, not a new scene renderer or third-party image.
  function buildGalaxy() {
    galaxy=document.createElement('canvas');
    galaxy.width=Math.min(1400,Math.round(width*(compact.matches?1.6:1.1)));
    galaxy.height=Math.round(galaxy.width*.58);
    const g=galaxy.getContext('2d');if(!g){galaxy=null;return;}
    const w=galaxy.width,h=galaxy.height;
    const glow=(x,y,r,color,alpha)=>{
      const gradient=g.createRadialGradient(x,y,0,x,y,r);
      gradient.addColorStop(0,color);gradient.addColorStop(1,'transparent');
      g.globalAlpha=alpha;g.fillStyle=gradient;g.fillRect(x-r,y-r,r*2,r*2);
    };
    g.save();g.translate(w*.47,h*.5);g.rotate(-.28);g.scale(1,.48);
    glow(0,0,w*.42,'#343056',.32);
    const steps=constrained()?26:compact.matches?46:68;
    for(let arm=0;arm<3;arm++)for(let i=1;i<steps;i++){
      const t=i/steps,r=w*(.025+t*.43),a=arm*Math.PI*2/3+t*5.1;
      const x=Math.cos(a)*r*(arm===1?1.13:1),yy=Math.sin(a)*r;
      glow(x,yy,w*(.012+t*.025),arm===1?'#694bc2':'#528bb3',(.15+Math.sin(t*Math.PI)*.22)*(1-t*.5));
    }
    const stars=constrained()?160:compact.matches?400:880;
    for(let i=0;i<stars;i++){
      const t=Math.pow(noise(i+680),.65),r=w*(.02+t*.43),arm=i%3;
      const a=arm*Math.PI*2/3+t*5.1+(noise(i+1120)-.5)*(.17+t*.28);
      const x=Math.cos(a)*r*(arm===1?1.13:1),yy=Math.sin(a)*r+(noise(i+1490)-.5)*w*.018;
      g.globalAlpha=(.2+noise(i+1800)*.65)*(1-t*.45);
      g.fillStyle=i%9===0?'#a78bfa':i%5===0?'#67e8f9':'#dceaf4';
      const size=.55+noise(i+2010)*1.05;g.fillRect(x,yy,size,size*1.6);
    }
    glow(0,0,w*.08,'#d2e9f5',.36);glow(0,0,w*.028,'#edf6ff',.65);
    g.restore();
  }
  function globe(x,y,diameter,opacity) {
    if(!photograph?.complete||!photograph.naturalWidth)return;
    context.globalAlpha=opacity;context.drawImage(photograph,x-diameter/2,y-diameter/2,diameter,diameter);context.globalAlpha=1;
  }
  function continuum() {
    const still=reduced.matches||constrained(),center=scrollY+height*.55;
    let partial=0;
    for(const chapter of chapters){
      const distance=Math.abs(center-chapter),range=height*.58;
      partial=Math.max(partial,(1-smooth(distance/range))*.42);
    }
    const reveal=finale?span(scrollY,finale.start,finale.approach):0;
    if(partial>.005&&reveal<.3){
      const diameter=width*(compact.matches?1.3:.72);
      globe(width+diameter*.31,height*.6,diameter,partial*(compact.matches?.7:1));
    }
    if(finale&&reveal>.001&&galaxy){
      const integration=span(scrollY,finale.approach,finale.finish);
      const y=mix(height*.9,finale.y-scrollY,reveal);
      const drift=still?0:Math.sin(clock*.045)*2;
      context.globalAlpha=reveal*.9;
      context.drawImage(galaxy,finale.x-galaxy.width/2+drift,y-galaxy.height/2);
      context.globalAlpha=1;
      // A visible photographic Earth grows, then projects into depth; it never vanishes.
      const growth=Math.sin(integration*Math.PI),base=compact.matches?86:150;
      const diameter=mix(base,compact.matches?64:96,integration)+growth*(compact.matches?65:145);
      globe(finale.x-galaxy.width*(.12-.04*integration),y+galaxy.height*(.15-.08*integration),diameter,reveal);
      layer.dataset.reveal=reveal.toFixed(3);layer.dataset.integration=integration.toFixed(3);
    }else{layer.dataset.reveal='0';layer.dataset.integration='0';}
    // Quiet reading zones are real layout coordinates, cached outside the paint loop.
    if(partial>.005||reveal>.001)for(const r of reading){
      if(r.bottom>scrollY-40&&r.top<scrollY+height+40)quietReading(r);
    }
  }
  function quietReading(r) {
    const x=r.left,y=r.top-scrollY,w=r.right-r.left,h=r.bottom-r.top,f=40;
    context.save();context.globalCompositeOperation='destination-out';context.globalAlpha=.97;
    context.fillStyle='#000';context.fillRect(x,y,w,h);
    for(const [x1,y1,x2,y2,bx,by,bw,bh] of [
      [x,y,x-f,y,x-f,y,f,h],[x+w,y,x+w+f,y,x+w,y,f,h],
      [x,y,x,y-f,x-f,y-f,w+f*2,f],[x,y+h,x,y+h+f,x-f,y+h,w+f*2,f]
    ]){const fade=context.createLinearGradient(x1,y1,x2,y2);fade.addColorStop(0,'#000');fade.addColorStop(1,'transparent');context.fillStyle=fade;context.fillRect(bx,by,bw,bh);}
    context.restore();
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
    // Fixed orbit layout boxes; transform alone reproduces the measured original geometry.
    earth.style.setProperty('--continuum-orbit-scale',String((Number(earth.dataset.diameter)||540)/540));
    if(document.hidden||hidden){stop();return;}
    if(!galaxy&&finale&&scrollY>finale.start-height*.35)buildGalaxy();
    if(reduced.matches||constrained()){stop();draw();}
    else if(!frame)frame=requestAnimationFrame(tick);
  }
  function resize() {
    width=innerWidth;height=innerHeight;
    const ratio=Math.min(devicePixelRatio||1,compact.matches||constrained()?1:1.3);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);galaxy=null;measure();draw();
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
