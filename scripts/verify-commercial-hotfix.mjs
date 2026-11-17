import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {PUBLISHED_REF,verifyPublishedHotfixScope} from './verify-commercial-hotfix-contract.mjs';

const root=resolve(fileURLToPath(new URL('../',import.meta.url))),before=process.env.OT_HOTFIX_BEFORE;
assert.ok(before,'A separate published checkout is required');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:before,encoding:'utf8'}).trim(),PUBLISHED_REF);
const engine=process.env.OT_HOTFIX_ENGINE||'chromium';assert.ok(['chromium','webkit'].includes(engine));
const out=process.env.OT_HOTFIX_OUTPUT||'/tmp/ot-commercial-hotfix';await mkdir(out,{recursive:true});
const report={engine,publishedRef:PUBLISHED_REF,scope:await verifyPublishedHotfixScope(root),views:[],accessibility:[],consent:[],performance:[],images:[],limitations:['Linux browser engines, not physical devices.','Local cold samples without CPU/network throttling; no field CWV or INP certification.','External collectors and WhatsApp intercepted; no production event or message sent.']};
const servers=[];let browser,currentPage;
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg'};
async function serve(dir){
 const server=createServer(async(req,res)=>{try{let path=resolve(dir,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));assert.ok(path===dir||path.startsWith(dir+'/'));if((await stat(path)).isDirectory())path+='/index.html';res.setHeader('content-type',types[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));servers.push(server);return 'http://127.0.0.1:'+server.address().port;
}
async function context(width,height,motion='reduce'){
 const c=await browser.newContext({viewport:{width,height},reducedMotion:motion});
 await c.addInitScript(()=>{
  localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
  window.__hotfixVitals={lcp:null,cls:0,shifts:[]};
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__hotfixVitals.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput){window.__hotfixVitals.cls+=e.value;window.__hotfixVitals.shifts.push({value:e.value,sources:e.sources.map(s=>({tag:s.node?.tagName,className:String(s.node?.className||'')}))})}}).observe({type:'layout-shift',buffered:true})}catch{}
 });
 await c.route('**/*',r=>{
  const u=new URL(r.request().url());
  if(['127.0.0.1','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return r.continue();
  return r.fulfill({status:200,contentType:'application/javascript',body:'/* QA collector/navigation interception */'});
 });return c;
}
async function ready(p){await p.evaluate(()=>document.fonts.ready);await delay(200)}
async function shot(p,name,opts={}){const path=resolve(out,name);await p.screenshot({path,animations:'disabled',...opts});report.images.push(name)}
const slugs=['criacao-de-sites-valinhos','criacao-de-sites-campinas','presenca-no-google','anuncios-google-instagram','diagnostico-digital'];
try{
 const afterURL=await serve(root),beforeURL=await serve(before);
 const launch={headless:true};
 if(process.env.OT_HOTFIX_EXECUTABLE){assert.equal(engine,'chromium','Local executable override is Chromium only');launch.executablePath=process.env.OT_HOTFIX_EXECUTABLE;report.localExecutable=launch.executablePath;}
 browser=await ({chromium,webkit})[engine].launch(launch);report.browserVersion=browser.version();
 for(const slug of slugs)for(const [width,height] of [[360,780],[390,844],[1440,900],[1920,1080],...(slug==='anuncios-google-instagram'?[[768,1024],[1024,768],[1366,612],[430,932]]:[])]){
  const c=await context(width,height),p=await c.newPage(),errors=[],missing=[];
  currentPage=p;
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(afterURL))missing.push(r.url())});
  await p.goto(afterURL+'/'+slug+'/',{waitUntil:'load'});await ready(p);
  assert.equal(await p.locator('h1').count(),1);assert.ok(await p.locator('a[href*="wa.me/5511912459144"]').count()>0);
  assert.equal(await p.locator('#ot-ga4-script,#ot-meta-pixel-script').count(),0,'No tags without consent');
  const trigger=p.getByRole('button',{name:'Reabrir preferências de privacidade e cookies'});
  assert.equal(await trigger.innerText(),width<=900?'Privacidade':'Privacidade e cookies');
  await trigger.scrollIntoViewIfNeeded();
  const geometry=await trigger.evaluate(n=>{
   const r=n.getBoundingClientRect(),f=document.querySelector('.ot-site-footer').getBoundingClientRect(),shell=document.querySelector('.ot-footer-inner').getBoundingClientRect();
   const links=[...document.querySelectorAll('.ot-site-footer a')].map(a=>a.getBoundingClientRect().bottom);
   return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,position:getComputedStyle(n).position,font:getComputedStyle(n).fontSize,shield:getComputedStyle(n,'::before').maskImage,gear:getComputedStyle(n,'::after').content,lastLink:Math.max(...links),footerBottom:f.bottom,contentRight:shell.right};
  });
  assert.ok(geometry.width>=44&&geometry.width<=240&&geometry.height>=44);assert.ok(parseFloat(geometry.font)>=11);
  assert.notEqual(geometry.shield,'none');assert.equal(geometry.gear,'none');
  assert.ok(geometry.x>=12&&geometry.right<=width-12,'Utility remains inside viewport gutters');
  if(width>=1600){assert.equal(geometry.position,'fixed');assert.ok(geometry.x>=geometry.contentRight+8,'Wide-screen utility clears content column');}
  else{assert.equal(geometry.position,'relative');assert.ok(geometry.y>=geometry.lastLink+8&&geometry.bottom<=geometry.footerBottom-12,'Footer row does not cover links');}
  assert.ok(await p.locator('.ot-site-footer a[href="/privacidade/"]').count()>0);
  if(width===390||width===1440||width===1920){
   await shot(p,slug+'-'+width+'-privacy-after.png');
   const old=await c.newPage();await old.goto(beforeURL+'/'+slug+'/',{waitUntil:'load'});await ready(old);await old.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await shot(old,slug+'-'+width+'-privacy-before.png');await old.close();
   await trigger.focus();await p.keyboard.press('Enter');
   await p.locator('.ot-consent.is-visible').waitFor();assert.equal(await p.locator('#otConsent').getAttribute('aria-hidden'),null,'Open panel is exposed to assistive technology');
   assert.ok(await p.locator('#otConsent a[href="/privacidade/"]').isVisible());
   await shot(p,slug+'-'+width+'-consent-open.png');
   await p.locator('[data-consent-reject]').click();await p.locator('.ot-consent.is-visible').waitFor({state:'hidden'});
   assert.equal(await p.evaluate(()=>document.activeElement.id),'otConsentSettings','Closing restores keyboard focus');
   const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.deepEqual(a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[],'Accessibility '+slug+' '+width);report.accessibility.push({slug,width,violations:a.violations.length});
  }
  await p.evaluate(()=>scrollTo(0,0));
  if(slug==='anuncios-google-instagram'){
   assert.equal(await p.locator('.ot-ads-device').count(),2);assert.equal(await p.locator('.ot-ads-example a,.ot-ads-example button,.ot-ads-example input').count(),0,'Examples have no fake interactive controls');
   assert.match(await p.locator('#ads-example-caption').innerText(),/Empresa fictícia/);assert.equal(await p.locator('.ot-ads-journey li').count(),3);
   const text=await p.locator('.ot-ads-example').innerText();assert.ok(text.includes('Anúncio ilustrativo')&&text.includes('Patrocinado · exemplo fictício'));
   const arrangement=await p.locator('.ot-ads-device').evaluateAll(items=>items.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}}));
   if(width<=560)assert.ok(arrangement[1].top>=arrangement[0].bottom+16,'Small-screen cards stack at readable width');
   const cta=await p.locator('.lc-hero .lc-btn-primary').boundingBox();assert.ok(cta.y+cta.height<=height-8,'Primary CTA remains above the fold');
   if(width===390||width===1440){
    await shot(p,'ads-'+width+'-hero-after.png',{fullPage:width===390});
    await p.locator('.ot-ads-stage').screenshot({path:resolve(out,'ads-'+width+'-cards-after.png'),animations:'disabled'});report.images.push('ads-'+width+'-cards-after.png');
    const old=await c.newPage();await old.goto(beforeURL+'/'+slug+'/',{waitUntil:'load'});await ready(old);await shot(old,'ads-'+width+'-hero-before.png',{fullPage:width===390});await old.close();
   }
  }
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'No horizontal overflow');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);report.views.push({slug,width,height,geometry,errors,missing});await c.close();
 }
 // Real preference changes through the untouched shared panel; collectors remain intercepted.
 for(const [analytics,marketing] of [[true,false],[false,true],[false,false]]){
  const c=await context(390,844),p=await c.newPage();await p.goto(afterURL+'/anuncios-google-instagram/',{waitUntil:'load'});
  await p.locator('#otConsentSettings').click();await p.locator('[data-consent-customize]').click();
  await p.locator('[data-consent-analytics]').setChecked(analytics);await p.locator('[data-consent-marketing]').setChecked(marketing);await p.locator('[data-consent-save]').click();
  const pref=await p.evaluate(()=>JSON.parse(localStorage.getItem('ot_consent_preferences_v2')));
  assert.equal(pref.analytics,analytics?'granted':'denied');assert.equal(pref.marketing,marketing?'granted':'denied');
  assert.equal(await p.locator('#ot-ga4-script').count(),analytics?1:0);assert.equal(await p.locator('#ot-meta-pixel-script').count(),marketing?1:0);
  await p.locator('#otConsentSettings').click();await p.locator('[data-consent-customize]').click();
  assert.equal(await p.locator('[data-consent-analytics]').isChecked(),analytics);assert.equal(await p.locator('[data-consent-marketing]').isChecked(),marketing);
  await p.locator('[data-consent-reject]').click();assert.equal(await p.evaluate(()=>document.activeElement.id),'otConsentSettings');
  report.consent.push({analytics,marketing,persisted:pref});await c.close();
 }
 for(const motion of ['reduce','no-preference']){
  const c=await context(390,844,motion),p=await c.newPage();await p.goto(afterURL+'/anuncios-google-instagram/');await ready(p);
  if(motion==='reduce')assert.equal(await p.locator('#otConsentSettings').evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
  await p.locator('#otConsentSettings').focus();await p.keyboard.press('Enter');assert.ok(await p.locator('.ot-consent.is-visible').isVisible());await c.close();
 }
 if(engine==='chromium')for(const slug of slugs)for(const [width,height] of [[390,844],[1440,900]]){
  const sample={slug,width,height,before:[],after:[]};
  for(let n=0;n<3;n++)for(const [version,url] of [['before',beforeURL],['after',afterURL]]){
   const c=await context(width,height),p=await c.newPage();await p.goto(url+'/'+slug+'/',{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await delay(800);
   sample[version].push(await p.evaluate(()=>({...window.__hotfixVitals,dom:document.querySelectorAll('*').length,fonts:{inter:document.fonts.check('16px Inter'),space:document.fonts.check('16px "Space Grotesk"')},resources:performance.getEntriesByType('resource').filter(r=>r.name.startsWith(location.origin)).map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize,type:r.initiatorType})),images:[...document.images].map(i=>({path:new URL(i.currentSrc||i.src).pathname,loading:i.loading,loaded:i.complete&&i.naturalWidth>0}))})));
   await c.close();
  }
  assert.ok(Math.max(...sample.after.map(s=>s.cls))<=.1,'CLS remains below the unchanged 0.1 limit: '+slug+' '+width);
  const beforeImages=new Set(sample.before.flatMap(s=>s.resources.filter(r=>r.type==='img').map(r=>r.path)));
  for(const r of sample.after.flatMap(s=>s.resources.filter(r=>r.type==='img')))assert.ok(beforeImages.has(r.path),'No new image transfer in the initial hotfix load');
  report.performance.push(sample);
 }
 report.success=true;
}catch(e){report.success=false;report.error=e.stack;if(currentPage&&!currentPage.isClosed())await shot(currentPage,'failure-'+engine+'.png',{fullPage:true}).catch(()=>{});throw e;}
finally{
 await writeFile(resolve(out,'report-'+engine+'.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({engine,success:report.success,browserVersion:report.browserVersion,views:report.views.length,accessibility:report.accessibility.length,consent:report.consent.length,performance:report.performance.length,error:report.error}));
 if(browser)await browser.close();for(const s of servers)s.close();
}
