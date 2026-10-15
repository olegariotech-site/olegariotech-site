// V2.6.1 regression: geographic surface motion, real fallback and mobile lifecycle.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const pw=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const out=process.env.OT_EARTH_OUTPUT||'/tmp/ot-v261-earth';await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const servers=[],fonts=new Map();
async function serve(directory){const s=createServer(async(req,res)=>{try{let f=resolve(directory,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(directory+'/')&&f!==directory)throw Error('Outside root');if((await stat(f)).isDirectory())f+='/index.html';res.setHeader('content-type',types[extname(f)]||'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404);res.end()}});await new Promise(r=>s.listen(0,'127.0.0.1',r));servers.push(s);return 'http://127.0.0.1:'+s.address().port+'/'}
const url=await serve(root),baseline=process.env.OT_EARTH_BASELINE_DIR?await serve(resolve(process.env.OT_EARTH_BASELINE_DIR)):null;
const report={base:'c52b7bb51484a08fffa1edae550bdea5a24ae7e2',cases:[],limitations:['Browser plugin not available; Playwright native engines and touch emulation.','No physical Android, Samsung Internet, iPhone or embedded app access. UA profiles do not certify those products.','CPU throttling and software GPU measure lab submission cost, not battery, heat or real GPU time.','Visibility and persisted page events are simulated; OS WebView policies require device verification.']};
async function configure(c,profile){
 await c.addInitScript(p=>{
  localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
  Object.defineProperty(navigator,'deviceMemory',{configurable:true,value:p.memory});
  Object.defineProperty(navigator,'hardwareConcurrency',{configurable:true,value:p.cores||8});
  const connection=new EventTarget();connection.saveData=!!p.saveData;Object.defineProperty(navigator,'connection',{configurable:true,value:connection});
  if(p.hidden)Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  const get=HTMLCanvasElement.prototype.getContext;
  if(p.canvas)HTMLCanvasElement.prototype.getContext=function(t,...a){return t==='webgl'||t==='webgl2'?null:get.call(this,t,...a)};
  window.__earthQA={paints:0,webglPaints:0,angle:0,costs:[],longTasks:[],shifts:[],cls:0,raf:0};
  let start=0,last=0,total=0;
  for(const type of ['layout-shift','longtask'])if(PerformanceObserver.supportedEntryTypes.includes(type))new PerformanceObserver(list=>{for(const e of list.getEntries()){const q=window.__earthQA;if(type==='longtask')q.longTasks.push({at:e.startTime,ms:e.duration});else if(!e.hadRecentInput){if(e.startTime-last>1000||e.startTime-start>5000){start=e.startTime;total=0}total+=e.value;last=e.startTime;q.cls=Math.max(q.cls,total);q.shifts.push({at:e.startTime,value:e.value});}}}).observe({type,buffered:true});
  function timing(){const at=performance.now();queueMicrotask(()=>window.__earthQA.costs.push(performance.now()-at));}
  const clear=CanvasRenderingContext2D.prototype.clearRect,image=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.matches('.earth-journey__canvas')){window.__earthQA.paints++;timing()}return clear.apply(this,a)};
  CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.matches('.earth-journey__canvas')&&a[0] instanceof HTMLCanvasElement)window.__earthQA.surface=a[0];return image.apply(this,a)};
  for(const name of ['WebGLRenderingContext','WebGL2RenderingContext']){const proto=window[name]?.prototype;if(!proto)continue;const original=proto.clear;proto.clear=function(...a){if(this.canvas.matches('.earth-journey__canvas'))timing();return original.apply(this,a)}}
  function frame(){window.__earthQA.raf++;requestAnimationFrame(frame)}requestAnimationFrame(frame);
 },profile);
 if(process.env.OT_QA_PROXY_FONTS==='1')await c.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{const u=route.request().url();if(!fonts.has(u))fonts.set(u,(async()=>{const r=await fetch(u,{headers:{'User-Agent':route.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});assert.ok(r.ok);return{body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')}})());await route.fulfill(await fonts.get(u))});
}
async function hero(p){await p.bringToFront();await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';const r=document.querySelector('#inicio .hero-visual').getBoundingClientRect();scrollTo({top:scrollY+r.top+r.height*.5-innerHeight*.5,behavior:'instant'})});await p.waitForFunction(()=>{const r=document.querySelector('#inicio .hero-visual').getBoundingClientRect();return Math.abs(Number(document.querySelector('#earthJourney').dataset.centerY)-(r.top+r.height*.5))<1});await p.waitForTimeout(250)}
async function hook(p){await p.evaluate(()=>{if(window.THREE?.Mesh&&!window.__earthQA.hooked){window.__earthQA.hooked=true;THREE.Mesh.prototype.onBeforeRender=function(){if(this.material.map){window.__earthQA.webglPaints++;window.__earthQA.angle=this.rotation.y;}}}})}
async function snapshot(p,save=false){return p.evaluate(save=>{
 const q=window.__earthQA,e=document.querySelector('#earthJourney'),s=q.surface;
 let hash=null,changed=0,mae=0;
 if(s){const d=s.getContext('2d').getImageData(0,0,s.width,s.height).data;hash=2166136261;let n=0;for(let i=0;i<d.length;i+=4){hash=Math.imul(hash^d[i],16777619);if(q.beforeSurface&&d[i+3]&&q.beforeSurface[i+3]){if(d[i]!==q.beforeSurface[i]||d[i+1]!==q.beforeSurface[i+1]||d[i+2]!==q.beforeSurface[i+2])changed++;mae+=Math.abs(d[i]-q.beforeSurface[i])+Math.abs(d[i+1]-q.beforeSurface[i+1])+Math.abs(d[i+2]-q.beforeSurface[i+2]);n+=3}}hash>>>=0;mae/=n||1;if(save)q.beforeSurface=Array.from(d);}
 return{at:performance.now(),paints:q.paints,webglPaints:q.webglPaints,angle:q.angle,surfaceHash:hash,changedSurfacePixels:changed,surfaceMAE:mae,sourceSize:s?.width,cls:q.cls,raf:q.raf,scrollY,hidden:document.hidden,viewport:[innerWidth,innerHeight],geometry:[e.dataset.centerX,e.dataset.centerY,e.dataset.diameter],earth:{...e.dataset},renderer:e.dataset.renderer,animate:e.dataset.animate,continuum:e.classList.contains('is-continuum'),field:{...document.querySelector('.ot-atmosphere').dataset},costs:q.costs.slice(),longTasks:q.longTasks.slice()};
 },save)}
const paints=s=>s.renderer==='webgl'?s.webglPaints:s.paints;
async function motion(p,ms=2300){await hook(p);await p.waitForTimeout(250);const a=await snapshot(p,true);await p.waitForTimeout(ms);const b=await snapshot(p);const proof={first:a,last:b,seconds:(b.at-a.at)/1000,earthFPS:(paints(b)-paints(a))/((b.at-a.at)/1000),rafFPS:(b.raf-a.raf)/((b.at-a.at)/1000),submissionP95ms:b.costs.slice(a.costs.length).sort((x,y)=>x-y).at(Math.floor((b.costs.length-a.costs.length)*.95))||0,steadyLongTasks:b.longTasks.filter(t=>t.at>=a.at)};(report.probes||=[]).push(proof);await writeFile(out+'/earth-report.json',JSON.stringify(report,null,2));assert.equal(b.scrollY,a.scrollY,'Motion cannot depend on scroll');assert.deepEqual(b.geometry,a.geometry,'Planet pose/scale does not simulate surface rotation');assert.ok(paints(b)>paints(a)+3,'Continuous surface frames');if(b.renderer==='webgl')assert.ok((b.angle-a.angle+Math.PI*2)%(Math.PI*2)>(ms>=10000?.6:.05),'Mapped spherical mesh changes longitude, including short resume checks');else{assert.notEqual(b.surfaceHash,a.surfaceHash,'Actual projected texture changes');assert.ok(b.changedSurfacePixels>1000,'Geographic pixels change inside the surface');assert.ok(b.surfaceMAE>2)}return proof;}
try{for(const engine of (process.env.OT_QA_ENGINES||'chromium,webkit').split(',')){
 const browser=await pw[engine].launch(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{});
 try{
 const profiles=[{name:'high',memory:8},{name:'intermediate-4gb',memory:4},{name:'canvas-4gb',memory:4,canvas:true},{name:'limited-2gb',memory:2,static:true},{name:'limited-2cores',memory:4,cores:2,static:true},{name:'reduced',memory:8,reduced:true,static:true},{name:'save-data',memory:8,saveData:true,static:true},{name:'webview-hidden-start',memory:4,canvas:true,hidden:true},{name:'unknown-capacity',memory:undefined,cores:undefined}];
 if(engine==='chromium')profiles.push({name:'cpu-4x',memory:4,canvas:true,cpu:4},{name:'desktop',memory:8,desktop:true});
 for(const profile of profiles.filter(p=>!process.env.OT_EARTH_PROFILES||process.env.OT_EARTH_PROFILES.split(',').includes(p.name))){
  const video=process.env.OT_EARTH_VIDEO==='1'&&['intermediate-4gb','canvas-4gb'].includes(profile.name);
  const c=await browser.newContext({...pw.devices[engine==='webkit'?'iPhone 13':'Pixel 7'],...(profile.desktop?{viewport:{width:1440,height:900},isMobile:false,deviceScaleFactor:1,hasTouch:false}:{}),reducedMotion:profile.reduced?'reduce':'no-preference',...(video?{recordVideo:{dir:out, size:{width:412,height:915}}}:{})});await configure(c,profile);const p=await c.newPage(),errors=[],notFound=[],resources=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{resources.push(r.url());if(r.status()===404)notFound.push(r.url())});
  if(profile.cpu){const session=await c.newCDPSession(p);await session.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu})}
  await p.goto(url);await p.evaluate(()=>document.fonts.ready);assert.match(await p.title(),/Olegario Tech/);assert.ok(await p.locator('h1').innerText());assert.equal(await p.locator('vite-error-overlay,nextjs-portal').count(),0);
  if(profile.hidden){await p.waitForTimeout(300);assert.equal((await snapshot(p)).renderer,undefined,'Hidden initial page defers renderer');await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));dispatchEvent(new Event('focus'))})}
  if(profile.desktop)await p.waitForTimeout(500);else await hero(p);
  let evidence;
  if(profile.static){await p.waitForTimeout(500);const a=await snapshot(p);await p.waitForTimeout(800);const b=await snapshot(p);assert.equal(b.animate,'false');assert.equal(b.renderer,undefined);assert.equal(paints(b),paints(a));assert.ok(!resources.some(u=>u.includes('three-r128')||u.includes('nasa-blue-marble-clouds')),'Static preferences avoid render assets');evidence={first:a,last:b};}
  if(profile.static){const original=p.viewportSize();await p.setViewportSize({width:915,height:412});await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(600);assert.equal((await snapshot(p)).animate,'false','Landscape preserves limited-device and preference protections');assert.equal((await snapshot(p)).renderer,undefined);await p.setViewportSize(original);await hero(p);}
  else{
   await p.waitForFunction(()=>['webgl','canvas2d'].includes(document.querySelector('#earthJourney').dataset.renderer));if(profile.canvas)assert.equal((await snapshot(p)).renderer,'canvas2d');
   await hook(p);await p.screenshot({path:out+'/'+engine+'-'+profile.name+'-t0.png'});
   evidence=await motion(p,video?10500:2300);await p.screenshot({path:out+'/'+engine+'-'+profile.name+'-t1.png'});if(profile.canvas)assert.equal(evidence.last.sourceSize,256,'Mobile fallback retains detail with bounded cached frames');
   assert.ok(evidence.last.cls<.1,'No material CLS');
   if(profile.name==='intermediate-4gb'||profile.name==='canvas-4gb'||profile.hidden){
    await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(300);const a=await snapshot(p);await p.waitForTimeout(500);assert.equal(paints(await snapshot(p)),paints(a),'Background suspends Earth');
    await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));dispatchEvent(new Event('focus'))});await motion(p,1100);
    await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await p.waitForTimeout(300);const paused=await snapshot(p);await p.waitForTimeout(500);assert.equal(paints(await snapshot(p)),paints(paused),'BFCache pauses without disposal');
    await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await motion(p,1100);
    await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));await p.waitForTimeout(300);const hostPaused=await snapshot(p);await p.waitForTimeout(500);assert.equal(paints(await snapshot(p)),paints(hostPaused),'Retained mobile host pauses without a BFCache flag');await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:false})));await motion(p,1100);
    // V2.6 owns two inter-section orbit windows, anchored at these chapter ends.
    // Section centres can be outside those windows on a short iPhone viewport.
    for(const selector of ['#projetos','#metodo']){await p.evaluate(selector=>{const r=document.querySelector(selector).getBoundingClientRect();scrollTo({top:scrollY+r.bottom-innerHeight*.55,behavior:'instant'})},selector);await p.waitForFunction(()=>document.querySelector('#earthJourney').classList.contains('is-continuum'));await p.waitForTimeout(250);await motion(p,1100)}
    await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await p.waitForTimeout(700);const stopped=await snapshot(p);await p.waitForTimeout(500);assert.equal(paints(await snapshot(p)),paints(stopped),'Offscreen Earth stops');await hero(p);await motion(p,1100);
    await p.setViewportSize({width:915,height:412});await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForFunction(()=>document.querySelector('#earthJourney').dataset.animate==='true'&&Number(document.querySelector('#earthJourney').dataset.morph)<.01);await motion(p,1100);
    await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));await p.waitForTimeout(300);const landscapePaused=await snapshot(p);await p.waitForTimeout(500);assert.equal(paints(await snapshot(p)),paints(landscapePaused));await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:false})));await motion(p,1100);
    await p.setViewportSize({width:412,height:915});await hero(p);await motion(p,1100);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await p.locator('.mobile-audio-toggle').tap();await p.waitForFunction(()=>!document.querySelector('#backgroundAudio').paused);await p.locator('.mobile-audio-toggle').tap();assert.equal(await p.locator('.mobile-audio-toggle').getAttribute('aria-pressed'),'false');
    await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.locator('#inicio a[href="/diagnostico-digital/"]').tap();await p.waitForURL('**/diagnostico-digital/');assert.ok(await p.locator('h1').innerText(),'Approved diagnosis CTA opens its actual destination');
    if(profile.name==='canvas-4gb')assert.equal(evidence.first.field.intensity,'static','4 GiB atmosphere protection is unchanged');
   }
   if(profile.name==='high'){
    const lost=await p.evaluate(()=>{const c=document.querySelector('.earth-journey__canvas'),gl=c.getContext('webgl2')||c.getContext('webgl'),ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true});
    if(lost){await p.waitForFunction(()=>document.querySelector('#earthJourney').dataset.renderer==='canvas2d');await motion(p,2300)}
   }
   if(profile.name==='unknown-capacity'){
    await p.evaluate(()=>{navigator.connection.saveData=true;navigator.connection.dispatchEvent(new Event('change'))});await p.waitForTimeout(500);const paused=await snapshot(p);await p.waitForTimeout(600);assert.equal(paints(await snapshot(p)),paints(paused),'Dynamic Save-Data stops Earth');
    await p.evaluate(()=>{navigator.connection.saveData=false;navigator.connection.dispatchEvent(new Event('change'))});await motion(p,1100);
   }
  }
  if(profile.reduced){await p.emulateMedia({reducedMotion:'no-preference'});await hero(p);await p.waitForFunction(()=>!!document.querySelector('#earthJourney').dataset.renderer);await motion(p,1100);await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(300);const paused=await snapshot(p);await p.waitForTimeout(500);assert.equal(paints(await snapshot(p)),paints(paused),'Dynamic reduced motion stops Earth')}
  assert.deepEqual(errors,[]);assert.deepEqual(notFound,[]);const entry={engine,profile,evidence,errors,notFound};const recording=p.video();await c.close();if(video){const target=out+'/'+engine+'-'+profile.name+'.webm';await recording.saveAs(target);entry.video=target}report.cases.push(entry);await writeFile(out+'/earth-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({engine,profile:profile.name,renderer:evidence.last.renderer,fps:evidence.earthFPS,p95:evidence.submissionP95ms,cls:evidence.last.cls,passed:true}));
 }
 const retry=await browser.newContext({...pw.devices[engine==='webkit'?'iPhone 13':'Pixel 7']});await configure(retry,{memory:4,canvas:true});const rp=await retry.newPage();const texture='**/nasa-blue-marble-clouds-2048.webp';await retry.route(texture,r=>r.abort());await rp.goto(url);await hero(rp);await rp.waitForFunction(()=>document.querySelector('#earthJourney').dataset.renderer==='static');assert.equal(await rp.locator('#earthJourney').evaluate(e=>e.classList.contains('is-rendering')),false,'Failed map cannot masquerade as a rotating fallback');await retry.unroute(texture);await rp.evaluate(()=>dispatchEvent(new Event('focus')));await rp.waitForFunction(()=>document.querySelector('#earthJourney').dataset.renderer==='canvas2d');const recovered=await motion(rp);report.cases.push({engine,profile:{name:'map-failure-retry'},evidence:recovered});await retry.close();
 if(baseline){const c=await browser.newContext({...pw.devices[engine==='webkit'?'iPhone 13':'Pixel 7']});await configure(c,{memory:4});const p=await c.newPage();await p.goto(baseline);await p.evaluate(()=>document.fonts.ready);await hero(p);await p.waitForTimeout(1000);const a=await snapshot(p);await p.waitForTimeout(1100);const b=await snapshot(p);assert.equal(b.animate,'false');assert.equal(b.renderer,undefined);assert.equal(paints(a),paints(b));await p.screenshot({path:out+'/'+engine+'-baseline-4gb.png'});report.cases.push({engine,profile:{name:'published-4gb'},evidence:{first:a,last:b}});await c.close()}
 }finally{await browser.close()}
}report.passed=true;}finally{servers.forEach(s=>s.close());await writeFile(out+'/earth-report.json',JSON.stringify(report,null,2))}
console.log(JSON.stringify({passed:report.passed,cases:report.cases.length}));
