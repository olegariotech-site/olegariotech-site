// Actual complete-home rendering, mouse displacement, rotation and lifecycle evidence.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const pw=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const out=process.env.OT_V23_OUTPUT||'/tmp/ot-v23-qa';await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const servers=[];
async function serve(directory){const s=createServer(async(req,res)=>{try{let f=resolve(directory,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(directory+'/')&&f!==directory)throw Error('Outside root');if((await stat(f)).isDirectory())f+='/index.html';res.setHeader('content-type',types[extname(f)]||'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404);res.end()}});await new Promise(r=>s.listen(0,'127.0.0.1',r));servers.push(s);return 'http://127.0.0.1:'+s.address().port+'/'}
const url=await serve(root),baseline=process.env.OT_V22_DIR?await serve(resolve(process.env.OT_V22_DIR)):null;
const fonts=new Map();
async function configure(c,{mode='full'}={}){
 await c.addInitScript(mode=>{
  localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
  if(mode==='saveData')Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true,addEventListener(){}}});
  if(mode==='lowMemory')Object.defineProperty(navigator,'deviceMemory',{configurable:true,value:4});
  const get=HTMLCanvasElement.prototype.getContext;
  if(mode==='canvas2d')HTMLCanvasElement.prototype.getContext=function(type,...a){return type==='webgl'||type==='webgl2'?null:get.call(this,type,...a)};
  window.__v23={draws:0,sprites:[],poses:[]};
  const clear=CanvasRenderingContext2D.prototype.clearRect,image=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.matches('.cosmic-scene')){window.__v23.draws++;window.__v23.sprites=[];}return clear.apply(this,a)};
  CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.matches('.cosmic-scene')&&a[0]?.width===32&&a.length===5)window.__v23.sprites.push(a.slice(1));return image.apply(this,a)};
 },mode);
 if(process.env.OT_QA_PROXY_FONTS==='1')await c.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async r=>{const u=r.request().url();if(!fonts.has(u))fonts.set(u,(async()=>{const f=await fetch(u,{headers:{'User-Agent':r.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});assert.ok(f.ok,'Real font transport');return{body:Buffer.from(await f.arrayBuffer()),contentType:f.headers.get('content-type')}})());await r.fulfill(await fonts.get(u))});
}
async function go(p,y){await p.bringToFront();await p.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:y,behavior:'instant'})},y);await p.waitForTimeout(350)}
async function end(p){await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));await p.waitForFunction(()=>['photographic','unavailable'].includes(document.querySelector('.ot-atmosphere').dataset.galaxy));await p.waitForTimeout(350)}
async function state(p){return p.evaluate(()=>{const layer=document.querySelector('.ot-atmosphere'),e=document.querySelector('#earthJourney'),canvas=layer.querySelector('canvas'),d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let painted=0,hash=2166136261;for(let i=3;i<d.length;i+=4){if(d[i])painted++;hash=Math.imul(hash^d[i],16777619)}return{...layer.dataset,earthClass:e.className,renderer:e.dataset.renderer,opacity:Number(e.dataset.opacity),canvasCount:document.querySelectorAll('.earth-journey__canvas').length,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,draws:window.__v23.draws,painted,hash:hash>>>0}})}
const report={views:[],preferences:[],interactions:[],failures:[],comparisons:[],limitations:['Browser plugin not available; existing Playwright runner.','Linux engine and touch emulation, not physical iPhone/GPU certification.','Visibility emulated; no WhatsApp message sent.']};
try{for(const engine of (process.env.OT_QA_ENGINES||'chromium,webkit').split(',')){
 const b=await pw[engine].launch(engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{});
 try{
 for(const [width,height] of JSON.parse(process.env.OT_V23_VIEWPORTS||'[[1366,768],[1440,900],[1920,1080],[768,1024],[360,800],[390,844],[430,932]]')){
  const c=await b.newContext({viewport:{width,height},hasTouch:width<=600});await configure(c);const p=await c.newPage(),errors=[],notFound=[],assets=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404)notFound.push(r.url())});p.on('request',r=>{if(r.url().includes('hubble-ngc1300'))assets.push(r.url())});
  await p.goto(url);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  assert.match(await p.title(),/Olegario Tech/);assert.equal(await p.locator('vite-error-overlay,nextjs-portal').count(),0);assert.equal(assets.length,0,'Galaxy must not load in initial HERO');
  const bounds=await p.evaluate(()=>{const y=s=>{const r=document.querySelector(s).getBoundingClientRect();return scrollY+r.top};return{method:y('#metodo'),partial:y('#metodo')+document.querySelector('#metodo').offsetHeight-innerHeight*.55,contact:y('#contato'),footer:y('.footer'),end:document.documentElement.scrollHeight-innerHeight}});
  const prefix=engine+'-'+width+'x'+height,shots=[];
  for(const [name,y] of [['hero',0],['partial-earth',bounds.partial],['approach',width<=900?bounds.end-height*.20:bounds.footer-height*.40],['integrated',bounds.end]]){
   await go(p,y);if(name==='integrated')await end(p);const s=await state(p);assert.equal(s.overflow,false);assert.equal(s.canvasCount,1);assert.ok(s.painted>0);if(name==='integrated'){assert.equal(s.galaxy,'photographic');assert.ok(Number(s.integration)>.99);assert.ok(Number(s.reveal)>.99);assert.ok(s.painted>50000,'Recognizable photographic pixels')}
   await p.screenshot({path:out+'/'+prefix+'-'+name+'.png'});shots.push({name,...s});
  }
  // Art-direction regression: the mid-orbit Earth holds its size longer, with the same final scale.
  if(width===1440){
   const finished=shots.find(shot=>shot.name==='integrated');
   const finalPose=JSON.parse(finished.earth||'null');
   assert.ok(finalPose,'Final Earth pose remains present');
   assert.ok(Math.abs(finalPose.diameter-235*.17)<1,'Final Earth size remains unchanged');
   const approach=bounds.footer-height*.5,finish=Math.max(bounds.contact,bounds.end);
   await go(p,approach+(finish-approach)*.5);
   const mid=await state(p),progress=Number(mid.integration),midPose=JSON.parse(mid.earth||'null');
   assert.ok(progress>.46&&progress<.54,'Mid-orbit scroll position reached');
   assert.ok(midPose,'Mid-orbit Earth pose remains present');
   const original=235*(1-progress*.83);
   const expected=235*(1-progress*progress*(2-progress)*.83);
   assert.ok(Math.abs(midPose.diameter-expected)<1,'Size follows the smoother hold curve');
   assert.ok(midPose.diameter>original+16,'Earth remains noticeably larger before the final approach');
   await p.screenshot({path:out+'/'+prefix+'-earth-held-at-midpoint.png'});
   report.interactions.push({engine,midOrbitProgress:progress,earthDiameterPx:midPose.diameter,previousDiameterPx:original,finalDiameterPx:finalPose.diameter});
  }
  await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight)-height*.25);assert.ok(Number((await state(p)).integration)<1,'Native reverse scroll changes depth');await go(p,0);assert.equal((await state(p)).earthClass.includes('is-continuum'),false,'Original HERO regains ownership');assert.equal(Number((await state(p)).reveal),0);
  if(width===1440){
   await go(p,bounds.method);const settle=(await state(p)).draws;await p.waitForFunction(n=>window.__v23.draws>=n+32,settle);const before=await p.evaluate(()=>window.__v23.sprites);const target=before[15]||[1000,500];const frames=(await state(p)).draws;await p.mouse.move(target[0],target[1]);await p.waitForFunction(n=>window.__v23.draws>=n+12,frames);await p.waitForTimeout(150);const after=await p.evaluate(()=>window.__v23.sprites);const afterBySize=new Map(after.map(a=>[a[2].toFixed(6),a]));const distances=before.map(a=>{const b=afterBySize.get(a[2].toFixed(6));return b?Math.hypot(a[0]-b[0],a[1]-b[1]):0;});assert.ok(Math.max(...distances)>12,'Mouse causes perceptible real sprite displacement');
   await p.mouse.move(1400,80,{steps:18});await p.waitForTimeout(450);await p.screenshot({path:out+'/'+engine+'-mouse-reaction.png'});report.interactions.push({engine,mouseMaxDisplacementPx:Math.max(...distances),spritesCompared:Math.min(before.length,after.length)});
   await end(p);if((await state(p)).renderer==='webgl'){
    await p.evaluate(()=>{const f=THREE.Mesh.prototype.onBeforeRender;THREE.Mesh.prototype.onBeforeRender=function(...a){if(this.material?.map)window.__v23.poses.push({angle:this.rotation.y,x:this.position.x,y:this.position.y,scale:this.scale.x});return f.apply(this,a)}});await p.waitForTimeout(1600);const poses=await p.evaluate(()=>window.__v23.poses);assert.ok(poses.length>=3&&poses.at(-1).angle>poses[0].angle,'Original Earth really rotates in the finale');report.interactions.push({engine,rotationRadians:poses.at(-1).angle-poses[0].angle,poses});
   }
   const audio=p.locator('.desktop-audio-toggle');await audio.click();await p.waitForFunction(()=>!document.querySelector('#backgroundAudio').paused&&document.querySelector('#backgroundAudio').currentTime>.1&&document.querySelector('.desktop-audio-toggle').getAttribute('aria-pressed')==='true');assert.equal(await audio.getAttribute('aria-pressed'),'true');await audio.click();assert.equal(await audio.getAttribute('aria-pressed'),'false');
  }
  assert.equal(await p.locator('.ot-galaxy-credit a').count(),2);assert.deepEqual(errors,[]);assert.deepEqual(notFound,[]);report.views.push({engine,width,height,shots,assets,errors,notFound});await c.close();console.log(engine+' '+width+'x'+height+' passed');
  if(baseline){const c=await b.newContext({viewport:{width,height}});await configure(c);const p=await c.newPage();await p.goto(baseline);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);await p.screenshot({path:out+'/'+prefix+'-v22-hero.png'});await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));await p.waitForTimeout(500);await p.screenshot({path:out+'/'+prefix+'-v22-integrated.png'});report.comparisons.push({engine,width,height,baseline:true});await c.close()}
 }
 for(const mode of ['reduce','saveData','lowMemory','canvas2d']){
  const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:mode==='reduce'?'reduce':'no-preference'});await configure(c,{mode});const p=await c.newPage();await p.goto(url);await p.evaluate(()=>document.fonts.ready);await end(p);const first=await state(p);await p.waitForTimeout(1000);const last=await state(p);if(mode!=='canvas2d'){assert.equal(last.draws,first.draws,'No static animation loop');assert.equal(last.hash,first.hash,'Static preference honored')}else{assert.equal(last.renderer,'canvas2d');assert.ok(last.draws>first.draws);}
  if(mode==='reduce'){await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(700);assert.ok((await state(p)).draws>last.draws);await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(700);const n=(await state(p)).draws;await p.waitForTimeout(400);assert.equal((await state(p)).draws,n);}
  await p.screenshot({path:out+'/'+engine+'-'+mode+'-finale.png'});report.preferences.push({engine,mode,first,last});await c.close();
 }
 const c=await b.newContext({viewport:{width:1440,height:900}});await configure(c);const p=await c.newPage();await p.goto(url);await p.evaluate(()=>document.fonts.ready);await end(p);await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(350);const n=(await state(p)).draws;await p.waitForTimeout(500);assert.equal((await state(p)).draws,n);await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(500);assert.ok((await state(p)).draws>n);await p.setViewportSize({width:844,height:390});await end(p);assert.equal((await state(p)).overflow,false);await c.close();report.preferences.push({engine,mode:'visibility-resize',passed:true});
 // Cold hash navigation exercises initial geometry without a preceding scroll journey.
 for(const anchor of ['projetos','metodo','contato']){
  const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await configure(c);const p=await c.newPage();await p.goto(url+'#'+anchor);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(700);assert.ok(await p.evaluate(()=>scrollY>100));assert.equal((await state(p)).overflow,false);assert.equal(await p.locator('#'+anchor).count(),1);report.preferences.push({engine,mode:'cold-anchor',anchor,passed:true});await c.close();
 }
 // Delayed and unavailable assets do not block footer conversion or leave a spinner.
 for(const unavailable of [false,true]){
  const c=await b.newContext({viewport:{width:390,height:844}});await configure(c);let release;const gate=new Promise(r=>release=r);await c.route('**/hubble-ngc1300-*.webp',async r=>{if(unavailable)await r.fulfill({status:404,body:''});else{await gate;await r.continue()}});const p=await c.newPage();try{await p.goto(url);await p.evaluate(()=>document.fonts.ready);await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));await p.waitForTimeout(500);assert.ok(await p.locator('.ot-footer-v4__wa').count());assert.ok((await state(p)).painted>0);release();await p.waitForFunction(value=>document.querySelector('.ot-atmosphere').dataset.galaxy===value,unavailable?'unavailable':'photographic');report.failures.push({engine,unavailable,commercialContentAvailable:true});}finally{release();await c.close()}
 }
 }finally{await b.close()}
}
report.passed=true;console.log(JSON.stringify({passed:true,views:report.views.length,preferences:report.preferences.length,failures:report.failures.length}));
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));servers.forEach(s=>s.close())}
