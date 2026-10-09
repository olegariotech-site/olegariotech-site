/* V2.3: one atmospheric canvas, original Earth renderer and native scroll.
   Hubble NGC 1300 / NASA, ESA, Hubble Heritage (STScI/AURA), CC BY 4.0. */
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
  const particles = Array.from({length:384},(_,i) => ({
    x:noise(i+1), y:noise(i+310), depth:.18+noise(i+420)*.82,
    phase:noise(i+80)*Math.PI*2, size:.55+noise(i+150)*1.25, ox:0, oy:0
  }));
  const profiles = [
    ['#inicio',1], ['#projetos',.68], ['#solucoes',.58], ['#metodo',.64],
    ['#sobre',.48], ['#ecossistema',.5], ['#faq',.34], ['#contato',.42], ['.footer',.22]
  ];
  const readingSelector = '.hero-copy,.projects-head,.case-copy,.case-followup,.solution-content,.choice-heading,.section-copy,.faq-list,.cta-box,.about-grid,.method-scene,.method-card,.ot-footer-v4';
  let width=0, height=0, frame=0, last=0, clock=0, finaleClock=0, measureFrame=0;
  let anchors=[], reading=[], hidden=false, chapters=[], finale=null, galaxy=null, galaxyImage=null, galaxyRequested=false;
  let pointer={x:.5,y:.5,tx:.5,ty:.5,active:false,energy:0}, travel=scrollY, velocity=0;
  let budget=1, slowFrames=0;
  const luminous=[];
  const sprites=['#d9e8ff','#67e8f9','#a78bfa'].map(color=>{
    const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');
    const fade=g.createRadialGradient(16,16,0,16,16,16);fade.addColorStop(0,color);fade.addColorStop(.14,color);fade.addColorStop(.5,color+'55');fade.addColorStop(1,color+'00');
    g.fillStyle=fade;g.fillRect(0,0,32,32);return c;
  });
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
    const bounds=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return {top:y+r.top,bottom:y+r.bottom,paddingBottom:parseFloat(getComputedStyle(el).paddingBottom)||0};};
    chapters=['#projetos','#metodo'].map(bounds).filter(Boolean).map(r=>r.bottom);
    const contact=bounds('#contato'),footer=bounds('.footer');
    if(contact&&footer){
      const finish=Math.max(contact.top,document.documentElement.scrollHeight-height);
      const header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ot-header-height'))||60;
      const skyBottom=footer.bottom-footer.paddingBottom-finish;
      const skyTop=Math.max(header+24,skyBottom-(compact.matches?420:560));
      const skyEnd=Math.min(height-24,skyBottom);
      const size=Math.min(compact.matches?width*1.23:width*.74,760,Math.max(160,skyEnd-skyTop-36)/.62);
      finale={start:compact.matches?finish-height*.95:contact.top-height*.7,
        approach:compact.matches?finish-height*.35:footer.top-height*.5,finish,
        y:finish+(skyTop+skyEnd)*.5,size,
        x:compact.matches?width*.5:width*.62};
    }
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
    const still=reduced.matches||constrained(),rail=Number(earth.dataset.rail)||0;
    const opacity=Number(earth.dataset.opacity)||0,pulse=Number(earth.dataset.pulse)||0;
    const release=smooth(1-opacity*(1-pulse*.65));
    const cx=Number(earth.dataset.centerX)||width*.78,cy=Number(earth.dataset.centerY)||height*.5;
    const radius=(Number(earth.dataset.diameter)||540)*.5;
    const count=Math.round((constrained()?40:compact.matches?132:particles.length)*budget);
    layer.dataset.particles=String(count);luminous.length=0;
    const density=.72+densityAt(scrollY+height*.55)*.28;
    for(let i=0;i<count;i++){
      const p=particles[i],drift=still?0:time*(.06+p.depth*.035);
      const px=still?0:(pointer.x-.5)*p.depth*78,py=still?0:(pointer.y-.5)*p.depth*48;
      const u=p.x+Math.sin(drift+p.phase)*.034*p.depth;
      // Unhurried downward stars, independent of scroll; no streaks or uniform snowfall.
      const v=p.y+(still?0:time*(7+p.depth*21)/height+Math.sin(drift*.7+p.phase)*.010+travel*.00010*p.depth);
      const fieldX=rail+clamp(u)*(width-rail)+px,fieldY=((v%1+1)%1)*height+py;
      const orbit=p.phase+(still?0:time*.009),spread=i%3!==0?release:1;
      let x=mix(cx+Math.cos(orbit)*radius*(1.1+p.depth*.8),fieldX,spread);
      let y=mix(cy+Math.sin(orbit)*radius*(.65+p.depth*.75),fieldY,spread);
      let tx=0,ty=0;
      if(!still&&pointer.active){
        const dx=x-pointer.x*width,dy=y-pointer.y*height,d=Math.hypot(dx,dy),range=210+p.depth*90;
        const force=Math.pow(Math.max(0,1-d/range),2)*(42+p.depth*94)*(1+pointer.energy*.55);
        if(d>1){tx=(dx/d-dy/d*.30)*force;ty=(dy/d+dx/d*.30)*force;}
      }
      p.ox=still?0:mix(p.ox,tx,.13);p.oy=still?0:mix(p.oy,ty,.13);
      x+=p.ox;y+=p.oy+(still?0:velocity*p.depth*.28);
      if(x<rail||x>width||y<0||y>height)continue;
      const inReading=reading.some(r=>x>=r.left&&x<=r.right&&y+scrollY>=r.top&&y+scrollY<=r.bottom);
      const alpha=(.30+p.depth*.5)*density*(inReading?.22:1)*(compact.matches?.82:1);
      context.globalAlpha=alpha;
      const size=p.size*(.7+p.depth*.65),sprite=i%15===0?2:i%8===0?1:0;
      context.drawImage(sprites[sprite],x-size*3,y-size*3,size*6,size*6);
      if(i%4===0&&!inReading)luminous.push({x,y,alpha});
    }
    // Sparse short links, never a full mesh. Deep stars remain unconnected.
    context.strokeStyle='#9cc1de';context.lineWidth=.55;
    for(let i=0;i<Math.min(36,luminous.length);i++){
      const a=luminous[i],b=luminous[(i+7)%luminous.length],d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d>35&&d<140){context.globalAlpha=.11*(1-d/160);context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.stroke();}
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
  // Decompose the real photograph once: nucleus, disk and outer arms overlap softly.
  function buildGalaxy() {
    if(galaxyRequested)return;galaxyRequested=true;
    const image=new Image();galaxyImage=image;image.decoding='async';
    image.onload=()=>{prepareGalaxy(image).then(sync).catch(()=>{layer.dataset.galaxy='unavailable';sync();});};
    image.onerror=()=>{layer.dataset.galaxy='unavailable';sync();};
    image.src='/assets/img/orbit/hubble-ngc1300-'+(compact.matches||constrained()?'1024':'2048')+'-v1.webp';
    layer.dataset.galaxy='loading';
  }
  async function prepareGalaxy(image){
    if(!image?.naturalWidth)return;
    const w=Math.min(image.naturalWidth,compact.matches||constrained()?1024:1600),h=Math.round(w*image.naturalHeight/image.naturalWidth);
    const buffer=document.createElement('canvas');buffer.width=w;buffer.height=h;
    const g=buffer.getContext('2d',{willReadFrequently:true});if(!g)return;
    g.drawImage(image,0,0,w,h);const src=g.getImageData(0,0,w,h);
    const parts=[0,1,2].map(()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
    const data=parts.map(c=>c.getContext('2d').createImageData(w,h));
    const stars=[];
    // Prepare in small one-time slices; never block a CTA with a whole-image pixel loop.
    for(let first=0;first<h;){
    const deadline=await new Promise(done=>{
      if(typeof requestIdleCallback==='function')requestIdleCallback(done,{timeout:100});else setTimeout(done,0);
    });
    if(document.hidden)await new Promise(done=>{const resume=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',resume);done();}};document.addEventListener('visibilitychange',resume);});
    const started=performance.now();
    do {
    for(let y=first;y<Math.min(h,first+12);y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4,dx=(x-w*.493)/(w*.5),dy=(y-h*.47)/(h*.5),r=Math.hypot(dx,dy);
      const edge=(1-smooth((r-.84)/.26))*smooth(x/(w*.055))*smooth((w-x)/(w*.055))*smooth(y/(h*.085))*smooth((h-y)/(h*.085));
      const core=1-smooth((r-.15)/.34),outer=smooth((r-.54)/.25),middle=Math.max(0,1-core-outer);
      for(let k=0;k<3;k++){data[k].data[i]=src.data[i];data[k].data[i+1]=src.data[i+1];data[k].data[i+2]=src.data[i+2];data[k].data[i+3]=Math.round(edge*(k===0?core:k===1?middle:outer)*255);}
      if(x%5===0&&y%5===0&&r>.27&&r<.95){
        const brightness=(src.data[i]+src.data[i+1]+src.data[i+2])/3;
        if(brightness>140&&src.data[i+2]>src.data[i]*.8)stars.push({x:x/w-.493,y:y/w-h/w*.47,phase:noise(x+y*w)*6.28,depth:.5+noise(x+y)*.5});
      }
    }
    first+=12;
    }while(first<h&&performance.now()-started<6&&(!deadline||deadline.timeRemaining()>2));
    }
    parts.forEach((c,i)=>c.getContext('2d').putImageData(data[i],0,0));
    galaxy={parts,w,h,stars:stars.filter((_,i)=>i%Math.max(1,Math.ceil(stars.length/(compact.matches?64:144)))===0)};
    layer.dataset.galaxy='photographic';
  }
  function galaxyMotion(still){
    const time=still?0:finaleClock;
    // Bounded differential precession keeps the photographed bar and arms connected.
    return {time,turn:time*.009,middle:Math.sin(time*.27)*.032,outer:Math.sin(time*.18)*.074};
  }
  function paintGalaxy(x,y,size,reveal,still){
    if(!galaxy)return;
    const motion=galaxyMotion(still);
    const parallax=still?0:(pointer.x-.5)*10;
    context.save();context.translate(x+parallax,y+(still?0:(pointer.y-.5)*6));
    // The nucleus, middle disk and outer arms have visibly different trajectories.
    context.globalCompositeOperation='lighter';
    galaxy.parts.forEach((part,i)=>{
      context.save();const a=motion.turn+[0,motion.middle,motion.outer][i];
      context.rotate(a);context.globalAlpha=reveal*.91;
      const breathe=still?1:1+Math.sin(motion.time*.20+i)*i*.003;
      context.drawImage(part,-size*.493*breathe,-size*galaxy.h/galaxy.w*.47*breathe,size*breathe,size*galaxy.h/galaxy.w*breathe);context.restore();
    });
    for(const s of galaxy.stars){
      const a=motion.time*(.042+(1-s.depth)*.020),c=Math.cos(a),n=Math.sin(a);
      const sx=(s.x*c-s.y/.56*n)*size,sy=(s.x*n*.56+s.y*c)*size;
      context.globalAlpha=reveal*(.34+(still?.3:(Math.sin(motion.time*.9+s.phase)+1)*.20));
      const r=1+s.depth;context.drawImage(sprites[0],sx-r*2.5,sy-r*2.5,r*5,r*5);
    }
    layer.dataset.galaxyMotion=JSON.stringify({turn:motion.turn,middle:motion.middle,outer:motion.outer});
    context.restore();
  }
  function globe(x,y,diameter,opacity) {
    if(!photograph?.complete||!photograph.naturalWidth)return;
    context.globalAlpha=opacity;context.drawImage(photograph,x-diameter/2,y-diameter/2,diameter,diameter);context.globalAlpha=1;
  }
  let continuationKey='';
  function setEarth(pose){
    const key=pose?[pose.x.toFixed(1),pose.y.toFixed(1),pose.diameter.toFixed(1),pose.opacity.toFixed(3),pose.animate].join(','):'none';
    if(key===continuationKey)return;continuationKey=key;
    earth.dispatchEvent(new CustomEvent('ot-earth-continuum',{detail:pose}));
  }
  function continuum() {
    const still=reduced.matches||constrained(),center=scrollY+height*.55;
    let partial=0,chapterIndex=0;
    chapters.forEach((chapter,i)=>{const visible=(1-smooth(Math.abs(center-chapter)/(height*.88)))*.75;if(visible>partial){partial=visible;chapterIndex=i;}});
    const reveal=finale?span(scrollY,finale.start,finale.approach):0;
    let pose=null;
    if(partial>.005&&reveal<.15&&Number(earth.dataset.opacity)<.005){
      const diameter=width*(compact.matches?1.12:.56),entrance=partial/.75;
      const x=width+diameter*(.32-.40*entrance),y=height*(.59+chapterIndex*.08);
      pose={x,y,diameter,opacity:partial,animate:!still};
    }
    if(finale&&reveal>.001){
      const integration=span(scrollY,finale.approach,finale.finish);
      const y=mix(height*.9,finale.y-scrollY,reveal),size=finale.size;
      paintGalaxy(finale.x,y,size,reveal,still);
      const t=still?1:integration,motion=galaxyMotion(still);
      const parallaxX=still?0:(pointer.x-.5)*10,parallaxY=still?0:(pointer.y-.5)*6;
      // Dock inside the photographed right-hand arm, then orbit this local stellar region.
      // This is an artistic Solar-System-scale orbit, not an Earth orbit around the nucleus.
      const armAngle=motion.turn+motion.middle,c=Math.cos(armAngle),s=Math.sin(armAngle);
      const armX=finale.x+parallaxX+size*(.225*c-.055*s);
      const armY=y+parallaxY+size*(.225*s+.055*c);
      const angle=-.65+(still?0:motion.time*.22),radius=size*.043;
      const localX=armX+Math.cos(angle)*radius,localY=armY+Math.sin(angle)*radius*.58;
      const approachAngle=-2.6+t*3.8;
      const approachRadius=size*(.48-.13*t);
      const arrivalX=finale.x+Math.cos(approachAngle)*approachRadius;
      const arrivalY=y+Math.sin(approachAngle)*approachRadius*.52;
      const docking=smooth((t-.18)/.82);
      const x=mix(arrivalX,localX,docking),yy=mix(arrivalY,localY,docking);
      const scaleProgress=t*t*(2-t),endDiameter=compact.matches?34:58;
      const diameter=mix(compact.matches?142:235,endDiameter,scaleProgress);
      pose={x,y:yy,diameter,opacity:reveal*mix(1,.91,t),animate:!still};
      layer.dataset.reveal=reveal.toFixed(3);layer.dataset.integration=integration.toFixed(3);
      layer.dataset.orbit=angle.toFixed(4);
      layer.dataset.orbitRegion=JSON.stringify({x:armX,y:armY,radius,ellipse:.58,galaxyX:finale.x+parallaxX,galaxyY:y+parallaxY,size});
    }else{layer.dataset.reveal='0';layer.dataset.integration='0';}
    // The original hero always wins. Only one terrestrial image/renderer is visible.
    if(Number(earth.dataset.opacity)>.005)pose=null;
    layer.dataset.earth=pose?JSON.stringify(pose):'';
    if(pose&&still){setEarth(null);globe(pose.x,pose.y,pose.diameter,pose.opacity);}
    else setEarth(pose);
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
    const interval=compact.matches?66:33;
    if(now-last>=interval){
      const delta=last?Math.min(now-last,100)/1000:interval/1000;
      clock+=delta;
      if(finale&&scrollY>finale.start)finaleClock+=delta;
      last=now;
      const before=performance.now();
      const difference=scrollY-travel;velocity=mix(velocity,difference,.15);travel=mix(travel,scrollY,.14);
      pointer.x=mix(pointer.x,pointer.tx,.12);pointer.y=mix(pointer.y,pointer.ty,.12);pointer.energy*=.88;
      draw();
      if(performance.now()-before>interval*.5){if(++slowFrames>18){budget=Math.max(.42,budget*.82);slowFrames=0;}}else slowFrames=Math.max(0,slowFrames-1);
    }
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    // Fixed orbit layout boxes; transform alone reproduces the measured original geometry.
    earth.style.setProperty('--continuum-orbit-scale',String((Number(earth.dataset.diameter)||540)/540));
    if(document.hidden||hidden){stop();return;}
    if(!galaxy&&finale&&scrollY>finale.start-height*.75)buildGalaxy();
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
  document.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||reduced.matches||constrained())return;
    const x=event.clientX/Math.max(1,width),y=event.clientY/Math.max(1,height);
    pointer.energy=Math.min(1,pointer.energy+Math.hypot(x-pointer.tx,y-pointer.ty)*8);
    pointer.tx=x;pointer.ty=y;pointer.active=true;
  },{passive:true});
  document.addEventListener('pointerleave',()=>{pointer.active=false;pointer.tx=pointer.ty=.5;},{passive:true});
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
