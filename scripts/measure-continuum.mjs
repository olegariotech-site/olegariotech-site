// Three complete homes, interleaved cold contexts, individual LayoutShift attribution.
import {createServer} from 'node:http';
import {readFile,writeFile,stat,mkdir,mkdtemp} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const refs={main:'cef32459b58c3ce779e526a4e6ef7b76e74f8c67',v21:'3c5a507807874e7a95f6b51085bd521668210ac0'};
const temporary=[],servers=[],versions=[];
const output=process.env.OT_CONTINUUM_OUTPUT||'/tmp/ot-v22-performance';await mkdir(output,{recursive:true});
const samples=Number(process.env.OT_CONTINUUM_SAMPLES||5);
const requestedRenderer=process.env.OT_CONTINUUM_RENDERER||'auto';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
for(const version of ['main','v21','v22']){
  let directory=root;
  if(version!=='v22'){
    directory=process.env['OT_'+version.toUpperCase()+'_DIR'];
    if(!directory){directory=resolve(await mkdtemp(resolve(tmpdir(),'ot-continuum-')),'baseline');execFileSync('git',['worktree','add','--detach',directory,refs[version]],{cwd:root});temporary.push(directory)}
  }
  const server=createServer(async(req,res)=>{try{let file=resolve(directory,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(directory+'/')&&file!==directory)throw Error('Outside root');if((await stat(file)).isDirectory())file+='/index.html';const body=await readFile(file);res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Content-Length',body.length);res.end(body)}catch{res.writeHead(404);res.end()}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));servers.push(server);versions.push([version,server.address().port]);
}
const args=['--no-zygote',...(requestedRenderer==='canvas2d'?['--disable-webgl']:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])];
const browser=await chromium.launch({executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args});
const fonts=new Map();
const report={refs,samples,requestedRenderer,conditions:'Complete homes; five interleaved cold browser contexts per version, viewport and motion preference; same browser/HTTP transport; denied consent; no CPU/network throttling or concurrent suite. Font transport cache warmed outside browser, genuine production fonts; browser resource cache remains cold. Software WebGL is identified separately from Canvas2D. Timing is lab evidence, not field INP or a physical-device certification.',runs:[]};
try{
for(const [width,height] of [[1440,900],[390,844]])for(const reduced of [false,true])for(let sample=0;sample<samples;sample++)for(const [version,port] of versions){
 const c=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
 if(process.env.OT_QA_PROXY_FONTS==='1')await c.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{const u=route.request().url();if(!fonts.has(u))fonts.set(u,(async()=>{const r=await fetch(u,{headers:{'User-Agent':route.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Font transport '+r.status);return{body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')}})());await route.fulfill({...await fonts.get(u),headers:{'access-control-allow-origin':'*','timing-allow-origin':'*'}})});
 await c.addInitScript(()=>{
 localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
 window.__continuumPerf={lcp:0,lcpNode:'',cls:0,shifts:[],draws:[],longTasks:[],event:0};let start=0,last=0,total=0;
 const label=node=>node?node.tagName+(node.id?'#'+node.id:'')+(typeof node.className==='string'?'.'+node.className.trim().replaceAll(' ','.'):''):null;
 for(const type of ['largest-contentful-paint','layout-shift','longtask','event'])if(PerformanceObserver.supportedEntryTypes.includes(type))new PerformanceObserver(list=>{for(const e of list.getEntries()){
 const p=window.__continuumPerf;
 if(type==='largest-contentful-paint'){p.lcp=e.startTime;p.lcpNode=label(e.element)}
 if(type==='layout-shift'&&!e.hadRecentInput){if(e.startTime-last>1000||e.startTime-start>5000){start=e.startTime;total=0}total+=e.value;last=e.startTime;p.cls=Math.max(p.cls,total);p.shifts.push({time:e.startTime,value:e.value,sources:e.sources.map(s=>({node:label(s.node),previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))})}
 if(type==='longtask')p.longTasks.push({time:e.startTime,duration:e.duration});if(type==='event'&&e.interactionId)p.event=Math.max(p.event,e.duration);
 }}).observe({type,buffered:true,durationThreshold:16});
 const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.matches('.cosmic-scene')&&a[0]===0&&a[1]===0){const at=performance.now();queueMicrotask(()=>window.__continuumPerf.draws.push(performance.now()-at))}return clear.apply(this,a)};
 });
 const page=await c.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port+'/');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(5000);
 const initial=await page.evaluate(()=>({...window.__continuumPerf,renderer:matchMedia('(prefers-reduced-motion:reduce)').matches?'static':document.querySelector('#earthJourney').dataset.renderer,bytes:performance.getEntriesByType('resource').reduce((n,e)=>n+e.encodedBodySize,0)+performance.getEntriesByType('navigation')[0].encodedBodySize,fontsReady:document.fonts.check('800 48px Inter')}));
 if(requestedRenderer==='webgl'&&!reduced&&initial.renderer!=='webgl')throw Error('WebGL requested but actual renderer '+initial.renderer);
 if(requestedRenderer==='canvas2d'&&!reduced&&initial.renderer!=='canvas2d')throw Error('Canvas2D requested but actual renderer '+initial.renderer);
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.getElementById('contato').offsetTop)});await page.waitForTimeout(600);const n=await page.evaluate(()=>window.__continuumPerf.draws.length);await page.waitForTimeout(1200);
 const tail=await page.evaluate(n=>({paintsPerSecond:(window.__continuumPerf.draws.length-n)/1.2,draws:window.__continuumPerf.draws.slice(n)}),n);
 await page.locator('#projetos').scrollIntoViewIfNeeded();const projectReady=[];for(const key of ['acai','kl','ripamonti']){const at=performance.now();await page.locator(`[role=tab][data-project=${key}]`).click();await page.waitForFunction(k=>document.querySelector('#projectStage').dataset.selectedProject===k&&!document.querySelector('#projectStage').hasAttribute('aria-busy'),key);projectReady.push(performance.now()-at)}
 const result=await page.evaluate(()=>({event:window.__continuumPerf.event,cls:window.__continuumPerf.cls}));const sorted=tail.draws.sort((a,b)=>a-b);
 report.runs.push({version,width,height,reduced,sample,initial,tailPaintsPerSecond:tail.paintsPerSecond,tailCanvasJSSubmissionP95ms:sorted[Math.floor(sorted.length*.95)]||0,projectRenderReadyMs:projectReady,maxEventTimingMs:result.event,journeyCLS:result.cls,errors});await c.close();
 await writeFile(output+'/performance-'+requestedRenderer+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({version,width,reduced,sample,renderer:initial.renderer,lcp:initial.lcp,cls:initial.cls,bytes:initial.bytes}));
}
}finally{await browser.close();servers.forEach(s=>s.close());for(const directory of temporary)execFileSync('git',['worktree','remove','--force',directory],{cwd:root});}
