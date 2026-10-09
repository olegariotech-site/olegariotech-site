// Paired complete-home lab measurements with motion enabled.
const {chromium}=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
import {readFile,writeFile,stat,mkdir,mkdtemp} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const baseline=process.env.OT_BASELINE_COMMIT||'cef32459b58c3ce779e526a4e6ef7b76e74f8c67';
let temporary;
const baselineRoot=process.env.OT_BASELINE_DIR||(temporary=resolve(await mkdtemp(resolve(tmpdir(),'ot-v21-performance-')),'baseline'));
if(temporary)execFileSync('git',['worktree','add','--detach',temporary,baseline],{cwd:root});
const out=process.env.OT_PERFORMANCE_OUTPUT||'/tmp/ot-v21-performance';await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const servers=[],versions=[];
for(const [version,servedRoot] of [['before',baselineRoot],['after',root]]){const server=createServer(async(req,res)=>{try{let file=resolve(servedRoot,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(servedRoot+'/')&&file!==servedRoot)throw Error('Outside root');if((await stat(file)).isDirectory())file+='/index.html';res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));servers.push(server);versions.push([version,server.address().port]);}
const browser=await chromium.launch({executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args:['--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const fonts=new Map(),report={baseline,conditions:'Full home, movement enabled; 3 alternating cold contexts per version/viewport, same Chromium, local HTTP transport, denied consent, warmed font transport only; no CPU/network throttling. Renderer recorded per run; no GPU/phone or field-performance certification. No concurrent test suite during measurement.',runs:[]};
try{for(const [width,height] of [[1440,900],[390,844]])for(let run=(width===1440?-1:0);run<3;run++)for(const [version,port] of versions){
const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{const u=route.request().url();if(!fonts.has(u))fonts.set(u,(async()=>{const r=await fetch(u,{headers:{'User-Agent':route.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});return {body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')}})());await route.fulfill({...await fonts.get(u),headers:{'access-control-allow-origin':'*','timing-allow-origin':'*'}})});
await context.addInitScript(()=>{
localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
window.__perf={lcp:0,cls:0,interaction:0,longTasks:[],draws:[]};let start=0,last=0,cls=0;
for(const type of ['largest-contentful-paint','layout-shift','event','longtask'])if(PerformanceObserver.supportedEntryTypes.includes(type))new PerformanceObserver(list=>{for(const e of list.getEntries()){
if(type==='largest-contentful-paint')window.__perf.lcp=e.startTime;
if(type==='layout-shift'&&!e.hadRecentInput){if(e.startTime-last>1000||e.startTime-start>5000){start=e.startTime;cls=e.value}else cls+=e.value;last=e.startTime;window.__perf.cls=Math.max(window.__perf.cls,cls)}
if(type==='event')window.__perf.interaction=Math.max(window.__perf.interaction,e.duration);
if(type==='longtask')window.__perf.longTasks.push({start:e.startTime,duration:e.duration});
}}).observe({type,buffered:true,durationThreshold:16});
const clear=CanvasRenderingContext2D.prototype.clearRect;
CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.matches('.cosmic-scene')){const at=performance.now();queueMicrotask(()=>window.__perf.draws.push(performance.now()-at))}return clear.apply(this,args)};
});
const page=await context.newPage();await page.goto('http://127.0.0.1:'+port+'/');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1600);
const initial=await page.evaluate(()=>({lcp:window.__perf.lcp,cls:window.__perf.cls,resourceBytes:performance.getEntriesByType('resource').reduce((n,e)=>n+e.encodedBodySize,0),documentBytes:performance.getEntriesByType('navigation')[0].encodedBodySize,renderer:document.getElementById('earthJourney').dataset.renderer}));
await page.locator('#metodo').scrollIntoViewIfNeeded();await page.waitForTimeout(500);const beforeDraws=await page.evaluate(()=>window.__perf.draws.length);await page.waitForTimeout(1000);const afterDraws=await page.evaluate(()=>window.__perf.draws.length);
await page.locator('#projetos').scrollIntoViewIfNeeded();const ready=[];for(const key of ['acai','kl','ripamonti']){const at=performance.now();await page.locator(`[role=tab][data-project=${key}]`).click();await page.waitForFunction(k=>document.querySelector('#projectStage').dataset.selectedProject===k&&!document.querySelector('#projectStage').hasAttribute('aria-busy'),key);ready.push(performance.now()-at)}
const all=await page.evaluate(()=>window.__perf),sorted=all.draws.slice().sort((a,b)=>a-b);
if(run>=0)report.runs.push({version,width,height,run,initial,projectRenderReadyMs:ready,maxEventTimingMs:all.interaction,longTasks:all.longTasks,drawsBeyondHeroPerSecond:afterDraws-beforeDraws,canvasJSSubmissionP95ms:sorted[Math.floor(sorted.length*.95)]||0});await context.close();
}
}finally{await browser.close();servers.forEach(s=>s.close());if(temporary)execFileSync('git',['worktree','remove','--force',temporary],{cwd:root});await writeFile(out+'/performance-motion.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.runs.map(r=>({version:r.version,width:r.width,run:r.run,lcp:r.initial.lcp,cls:r.initial.cls,bytes:r.initial.resourceBytes+r.initial.documentBytes,p95:r.canvasJSSubmissionP95ms,tailDraws:r.drawsBeyondHeroPerSecond,event:r.maxEventTimingMs}))));}
