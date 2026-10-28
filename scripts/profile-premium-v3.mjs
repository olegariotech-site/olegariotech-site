// Traceable, paired interaction laboratory. Diagnostic ablations never modify source or ship to users.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,stat,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
const {chromium}=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),output=process.env.OT_PROFILE_OUTPUT||'/tmp/ot-v3-profile';await mkdir(output,{recursive:true});
const roots=JSON.parse(process.env.OT_PROFILE_ROOTS||JSON.stringify({main:process.env.OT_BASELINE_DIR,v3:process.env.OT_V3_BEFORE_DIR,current:root}));
const variants=(process.env.OT_PROFILE_VARIANTS||'main,v3').split(','),samples=Number(process.env.OT_PROFILE_SAMPLES||3),scenario=process.env.OT_PROFILE_SCENARIO||'aligned',ablation=process.env.OT_PROFILE_ABLATION||'full';
const servers=[],urls={},fonts=new Map();
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
for(const variant of variants){const directory=resolve(roots[variant]);const server=createServer(async(req,res)=>{try{let f=resolve(directory,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(f!==directory&&!f.startsWith(directory+'/'))throw Error('Outside root');if((await stat(f)).isDirectory())f+='/index.html';res.setHeader('Content-Type',types[extname(f)]||'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));servers.push(server);urls[variant]=`http://127.0.0.1:${server.address().port}`;}
const args=process.env.OT_PROFILE_NATIVE_GPU==='1'?[]:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];const browser=await chromium.launch({args});
const system=await browser.newBrowserCDPSession();const gpu=await system.send('SystemInfo.getInfo');const report={browser:browser.version(),gpu,scenario,ablation,samples,traceFinalization:'Virtual time pauses only after interaction observation, to flush a continuously animated trace; traced runs are excluded from latency medians.',method:'1440x900, no CPU/network throttle, cold contexts, shared prewarmed real font transport; trusted pointer input. aligned holds the rail at y=90 and the stage at y≈249, decodes the initial image, waits 1000ms after scrolling, keeps destination images cold and waits 350ms after pointer movement. fast reproduces the original confounded rapid sequence; settled is an optional warm-image control. Event attribution uses event startTime and trusted pointerdown timestamps. A traced sample is diagnostic and separate from untraced latency medians. No field INP claim.',runs:[]};
async function configure(c){await c.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{const url=route.request().url();try{if(!fonts.has(url)){const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(r.status);fonts.set(url,{body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')});}await route.fulfill(fonts.get(url));}catch{await route.abort();}});await c.route(/https:\/\/(www\.googletagmanager\.com|connect\.facebook\.net)\//,r=>r.fulfill({contentType:'application/javascript',body:''}));}
async function traceStart(page){const cdp=await page.context().newCDPSession(page);await cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,cc,gpu,benchmark,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame',transferMode:'ReturnAsStream'});return cdp;}
async function traceStop(cdp,path){const done=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Emulation.setVirtualTimePolicy',{policy:'pause'});await cdp.send('Tracing.end');let timer;const {stream}=await Promise.race([done,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Trace completion deadline')),20000)})]);clearTimeout(timer);const chunks=[];for(;;){const r=await cdp.send('IO.read',{handle:stream});chunks.push(r.base64Encoded?Buffer.from(r.data,'base64'):Buffer.from(r.data));if(r.eof)break;}await cdp.send('IO.close',{handle:stream});await writeFile(path,gzipSync(Buffer.concat(chunks)));await cdp.detach();}
try{
 const warm=await browser.newContext();await configure(warm);const wp=await warm.newPage();await wp.goto(urls[variants[0]],{waitUntil:'networkidle'});await wp.evaluate(()=>document.fonts.ready);await warm.close();
 // Include one trace per variant; untraced samples follow independently.
 for(let sample=0;sample<=samples;sample++)for(const variant of (sample%2?variants:[...variants].reverse())){
  const c=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:process.env.OT_PROFILE_REDUCED==='1'?'reduce':'no-preference'});await configure(c);
  await c.addInitScript(()=>{window.__profile={events:[],inputs:[],tasks:[]};document.addEventListener('pointerdown',e=>window.__profile.inputs.push({time:e.timeStamp,project:e.target.closest('[data-project]')?.dataset.project,target:e.target.closest('button,a')?.id||e.target.className}),true);new PerformanceObserver(l=>{for(const e of l.getEntries())window.__profile.events.push({start:e.startTime,name:e.name,duration:e.duration,id:e.interactionId||0,inputDelay:e.processingStart-e.startTime,processing:e.processingEnd-e.processingStart,presentationDelay:e.startTime+e.duration-e.processingEnd,target:e.target?.id||e.target?.className||e.target?.nodeName,project:e.target?.closest?.('[data-project]')?.dataset.project});}).observe({type:'event',buffered:true,durationThreshold:16});new PerformanceObserver(l=>{for(const e of l.getEntries())window.__profile.tasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});});
  const page=await c.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.goto(urls[variant],{waitUntil:'networkidle'});await page.locator('#otConsent.is-visible').waitFor();await page.locator('#projectStage[data-interactive=true]').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(3000);
  if(ablation==='hide-features')await page.addStyleTag({content:'.featured-projects{visibility:hidden!important}'});
  if(ablation==='hide-feature-images')await page.addStyleTag({content:'.featured-project__visual img{visibility:hidden!important}'});
  if(ablation==='contain-features')await page.addStyleTag({content:'.featured-projects{contain:layout paint}'});
  if(ablation==='no-backdrop-blur')await page.addStyleTag({content:'*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'});
  if(ablation==='no-stage-animation')await page.addStyleTag({content:'#projectStage{animation:none!important}'});
  await page.waitForTimeout(500);
  const cdp=sample===0&&process.env.OT_PROFILE_TRACE!=='0'?await traceStart(page):null;
  const actions=[];
  async function action(name,fn){console.log(JSON.stringify({variant,sample,action:name,phase:'start'}));await page.evaluate(n=>performance.mark('OT:'+n+':start'),name);const start=await page.evaluate(()=>performance.now());await fn();const end=await page.evaluate(()=>performance.now());actions.push({name,start,end});await page.evaluate(n=>performance.mark('OT:'+n+':end'),name);}
  await action('consent',()=>page.locator('[data-consent-reject]').click());await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
  if(scenario==='aligned'||scenario==='settled'){
   await page.locator('#projectStage img').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const i=document.querySelector('#projectStage img');return i.complete&&i.naturalWidth>0},{},{timeout:15000});
   await page.evaluate(()=>{const rail=document.querySelector('.case-index');scrollTo({top:scrollY+rail.getBoundingClientRect().top-90,behavior:'instant'});});
   await page.waitForTimeout(1000);
   // Optional warm-cache control; aligned keeps destination images cold.
   if(scenario==='settled')for(const key of ['acai','kl','ripamonti']){await page.evaluate(k=>window.OTProjectShowroom.select(k),key);await page.waitForTimeout(350);}
   if(scenario==='settled'){await page.evaluate(()=>window.OTProjectShowroom.select('kl'));await page.waitForTimeout(600);}
  }else await page.locator('.case-index').scrollIntoViewIfNeeded();
  console.log(JSON.stringify({variant,sample,phase:'inputs',scenario}));
  const geometry=await page.evaluate(()=>({scrollY,stage:document.querySelector('#projectStage').getBoundingClientRect().toJSON(),rail:document.querySelector('.case-index').getBoundingClientRect().toJSON(),docHeight:document.documentElement.scrollHeight}));
  if(scenario==='aligned'||scenario==='settled'){assert.ok(Math.abs(geometry.rail.y-90)<1,'matched rail geometry');assert.ok(Math.abs(geometry.stage.y-249)<1,'matched stage geometry');}
  for(const key of ['acai','kl','ripamonti']){
   if(scenario==='aligned'||scenario==='settled'){const box=await page.locator('#project-tab-'+key).boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(350);}
   await action('case-'+key,async()=>{await page.locator('#project-tab-'+key).click({timeout:15000});await page.waitForFunction(k=>document.querySelector('#projectStage').dataset.selectedProject===k&&!document.querySelector('#projectStage').hasAttribute('aria-busy'),key,{timeout:15000});});
   if(scenario==='settled')await page.waitForTimeout(800);
  }
  await page.waitForTimeout(1200); // Preserve late presentation entries, including the final interaction.
  const data=await page.evaluate(()=>window.__profile);const groups={};for(const e of data.events.filter(e=>e.id)){const key=String(e.id);if(!groups[key]||e.duration>groups[key].duration)groups[key]=e;}
  const interactions=Object.values(groups).map(e=>{const input=data.inputs.find(i=>Math.abs(i.time-e.start)<100);const action=actions.filter(a=>a.start<=e.start+1).at(-1);return {...e,input,action:input?.project?'case-'+input.project:action?.name};});
  const result={variant,sample,traced:!!cdp,warmup:sample===0,geometry,actions,...data,interactions,errors};report.runs.push(result);await writeFile(resolve(output,'profile.json'),JSON.stringify(report,null,2));if(cdp){const name=`${variant}-${scenario}-${ablation}.json.gz`;await traceStop(cdp,resolve(output,name));result.trace=name;}
  await writeFile(resolve(output,'profile.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({variant,sample,traced:!!cdp,worst:interactions.sort((a,b)=>b.duration-a.duration).slice(0,2).map(e=>({action:e.action,duration:e.duration,processing:e.processing,presentation:e.presentationDelay}))}));await c.close();
 }
}catch(error){report.failure=error.stack;throw error;}finally{await browser.close();for(const s of servers)s.close();await writeFile(resolve(output,'profile.json'),JSON.stringify(report,null,2));}
