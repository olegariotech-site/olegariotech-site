// Real pixel output and native scroll/anchor paths of the integrated complete home.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat,mkdtemp} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
const pw=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const out=process.env.OT_CONTINUUM_OUTPUT||'/tmp/ot-v22-continuum';await mkdir(out,{recursive:true});
const base='3c5a507807874e7a95f6b51085bd521668210ac0';
for(const file of ['assets/js/ot-earth-spin.js','assets/js/ot-earth-journey.js','assets/js/ot-v2.js','assets/js/ot-analytics-core.js','assets/js/ot-project-showroom.mjs','assets/css/ot-cosmic-showcase.css','404.html','sitemap.xml'])assert.equal(await readFile(resolve(root,file),'utf8'),execFileSync('git',['show',base+':'+file],{cwd:root,encoding:'utf8'}),file+' protected');
const production=['assets/css/ot-atmosphere.css','assets/js/ot-cosmic-scene.js','index.html'];
const increment=production.reduce((n,file)=>n+execFileSync('git',['show',base+':'+file],{cwd:root}).length*-1,0)+(await Promise.all(production.map(f=>readFile(resolve(root,f))))).reduce((n,b)=>n+b.length,0);
assert.ok(increment<=12*1024,'Production increment <=12 KiB');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const servers=[],temp=[],urls={};
for(const [version,ref] of [['v22',null],['main','cef32459b58c3ce779e526a4e6ef7b76e74f8c67'],['v21',base]]){
 let directory=root;if(ref){directory=process.env['OT_'+version.toUpperCase()+'_DIR'];if(!directory){directory=resolve(await mkdtemp(resolve(tmpdir(),'ot-v22-visual-')),'home');execFileSync('git',['worktree','add','--detach',directory,ref],{cwd:root});temp.push(directory)}}
 const server=createServer(async(req,res)=>{try{let file=resolve(directory,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(directory+'/')&&file!==directory)throw Error('Outside root');if((await stat(file)).isDirectory())file+='/index.html';res.setHeader('content-type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));servers.push(server);urls[version]='http://127.0.0.1:'+server.address().port+'/';
}
const report={incrementBytes:increment,views:[],anchors:[],comparisons:[],pendingImages:null,limitations:['Linux engine simulation, not a physical device or field performance certificate.','Screenshots show actual native page/canvas states; no compositing into the site.']};
const fonts=new Map();
async function configure(c){await c.addInitScript(()=>{localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));window.__continuumDrawCount=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.matches('.cosmic-scene')&&a[0]===0&&a[1]===0)window.__continuumDrawCount++;return clear.apply(this,a)}});if(process.env.OT_QA_PROXY_FONTS==='1')await c.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async r=>{const u=r.request().url();if(!fonts.has(u))fonts.set(u,(async()=>{const f=await fetch(u,{headers:{'User-Agent':r.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});return{body:Buffer.from(await f.arrayBuffer()),contentType:f.headers.get('content-type')}})());await r.fulfill(await fonts.get(u))})}
async function go(page,y){await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:y,behavior:'instant'})},y);await page.waitForTimeout(300)}
async function state(page){return page.evaluate(()=>{const layer=document.querySelector('.ot-atmosphere'),c=layer.querySelector('canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let bright=0;for(let i=3;i<data.length;i+=4)if(data[i]>80)bright++;return {reveal:Number(layer.dataset.reveal),integration:Number(layer.dataset.integration),bright,overflow:document.documentElement.scrollWidth>innerWidth,scroll:scrollY,height:document.documentElement.scrollHeight}})}
try{for(const engine of (process.env.OT_QA_ENGINES||'chromium').split(',')){
 const browser=await pw[engine].launch(engine==='chromium'?{executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{});
 try{
 for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[768,1024],[360,800],[390,844],[430,932]]){
  const c=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});await configure(c);const p=await c.newPage(),errors=[],notFound=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404)notFound.push(r.url())});await p.goto(urls.v22);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  const bounds=await p.evaluate(()=>({projects:document.querySelector('#projetos').offsetTop,partial:document.querySelector('#metodo').offsetTop+document.querySelector('#metodo').offsetHeight-innerHeight*.55,contact:document.querySelector('#contato').offsetTop,footer:document.querySelector('.footer').offsetTop,end:document.documentElement.scrollHeight-innerHeight}));
  const prefix=engine+'-'+width+'x'+height;
  const shots=[];
  for(const [name,y] of [['hero',0],['partial-earth',bounds.partial],['galaxy-before',bounds.contact-height*.8],['galaxy-approach',width<=900?bounds.end-height*.18:bounds.footer-height*.45],['galaxy-integrated',bounds.end]]){
   await go(p,y);const s=await state(p);assert.equal(s.overflow,false);if(name==='hero'||name==='galaxy-before')assert.equal(s.reveal,0);if(name==='galaxy-integrated'){assert.ok(s.reveal>.99&&s.integration>.99);assert.ok(s.bright>1200,'Recognizable final photographic/galactic pixels')}
   await p.screenshot({path:out+'/'+prefix+'-'+name+'.png'});shots.push({name,...s});
  }
  const last=await state(p);await go(p,width<=900?bounds.end-height*.18:bounds.footer-height*.45);const reverse=await state(p);assert.ok(reverse.integration<last.integration,'Scroll reverses the narrative');await go(p,0);assert.equal((await state(p)).reveal,0);
  // Changing case height must update the later real anchors, rather than an old page percentage.
  await p.locator('#projetos').scrollIntoViewIfNeeded();await p.locator('[role=tab][data-project=ripamonti]').click();await p.waitForFunction(()=>document.querySelector('#projectStage').dataset.selectedProject==='ripamonti'&&!document.querySelector('#projectStage').hasAttribute('aria-busy'));
  if(width<=600){await p.locator('[data-expand]').click();await p.waitForTimeout(300);await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));assert.ok((await state(p)).integration>.99);}
  assert.deepEqual(errors,[]);assert.deepEqual(notFound,[]);report.views.push({engine,width,height,shots,reverse,errors,notFound});await c.close();
 }
 // Direct anchors are computed from actual layout, including cold load at the footer.
 for(const hash of ['#contato','#metodo','#projetos']){
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await configure(c);const p=await c.newPage();await p.goto(urls.v22+hash);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(700);const first=await state(p);assert.equal(first.overflow,false);
  await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));assert.ok((await state(p)).integration>.99);
  const n=await p.evaluate(()=>window.__continuumDrawCount);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.__continuumDrawCount),n,'Reduced motion final scene has no continuous loop');
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(500);await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));assert.ok((await state(p)).integration>.99);assert.equal((await state(p)).overflow,false);
  await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(500);await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));assert.ok((await state(p)).integration>.99);
  report.anchors.push({engine,hash,first,reversible:true,orientationAndResize:true,reducedFinalLoopStopped:true});await c.close();
 }
 // Real home comparisons, before and after, rather than an isolated prototype.
 for(const [width,height] of [[1440,900],[390,844]])for(const version of ['main','v21','v22']){
  const c=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});await configure(c);const p=await c.newPage();await p.goto(urls[version]);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
  for(const [name,selector] of [['hero','#inicio'],['projects','#projetos'],['method','#metodo']]){if(name==='hero')await go(p,0);else await p.locator(selector).scrollIntoViewIfNeeded();await p.waitForTimeout(300);await p.screenshot({path:out+'/'+engine+'-'+width+'x'+height+'-'+version+'-'+name+'.png'});report.comparisons.push({engine,width,height,version,name})}
  await c.close();
 }
 // A delayed approved photo never prevents dust/galaxy or commercial content from rendering.
 const c=await browser.newContext({viewport:{width:1440,height:900}});await configure(c);let release;const gate=new Promise(r=>release=r);await c.route('**/ot-earth-atmosphere-static-v2.webp',async r=>{await gate;await r.continue()});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(urls.v22,{waitUntil:'domcontentloaded'});await go(p,await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));assert.ok((await state(p)).bright>1000);assert.match(await p.locator('#contato h2').innerText(),/Seu digital/);release();await p.waitForFunction(()=>document.querySelector('.earth-journey__globe>img').complete);assert.deepEqual(errors,[]);report.pendingImages={engine,contentAndGalaxyRender:true,photoRecovers:true};await c.close();
 }finally{await browser.close()}
}
report.passed=true;console.log(JSON.stringify({passed:true,viewports:report.views.length,anchors:report.anchors.length,comparisons:report.comparisons.length,incrementBytes:increment}));
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));servers.forEach(s=>s.close());for(const directory of temp)execFileSync('git',['worktree','remove','--force',directory],{cwd:root});}
