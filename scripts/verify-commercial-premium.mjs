import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {verifyCommercialTree,assertLegacyGuardRevision} from './verify-commercial-contract.mjs';
import {applyApprovedTrustCopy} from './verify-approved-trust-copy.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const before=process.env.OT_COMMERCIAL_BEFORE;
assert.ok(before,'Baseline checkout required; never silently compare current to itself');
const output=process.env.OT_COMMERCIAL_OUTPUT||'/tmp/ot-commercial-premium';
const engine=process.env.OT_COMMERCIAL_ENGINE||'chromium';
const origin='http://127.0.0.1:4187',baseline='http://127.0.0.1:4188';
const slugs=['criacao-de-sites-valinhos','criacao-de-sites-campinas','presenca-no-google','anuncios-google-instagram','diagnostico-digital'];
const sizes=[[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[360,780],[390,844],[430,932]];
for(const path of ['index.html','assets/js/ot-analytics.js','assets/js/ot-analytics-core.js','assets/css/ot-consent.css','robots.txt','sitemap.xml']){
 const old=await readFile(resolve(before,path),'utf8');
 assert.equal(await readFile(resolve(root,path),'utf8'),path==='index.html'?applyApprovedTrustCopy(path,old):old,'Protected file unchanged except one approved trust label: '+path);
}
assertLegacyGuardRevision(await readFile(resolve(root,'scripts/verify-premium-v3.mjs'),'utf8'),await readFile(resolve(before,'scripts/verify-premium-v3.mjs'),'utf8'));
await verifyCommercialTree(root);
for(const slug of slugs){
 const now=await readFile(resolve(root,slug,'index.html'),'utf8'),old=await readFile(resolve(before,slug,'index.html'),'utf8');
 for(const re of [/<title>[\s\S]*?<\/title>/,/<meta name="description"[^>]*>/,/<link rel="canonical"[^>]*>/,/<h1\b[\s\S]*?<\/h1>/])assert.equal(now.match(re)?.[0],old.match(re)?.[0],slug+' preserves '+re);
 const image=now.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
 assert.ok(image?.includes('/assets/img/commercial/'+slug+'-og.png'),'Unique page OG');
 assert.ok(now.includes('name="twitter:image" content="'+image+'"'),'Twitter uses the same cover');
 const png=await readFile(resolve(root,new URL(image).pathname.slice(1)));assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 for(const schema of now.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(schema[1]);
}
await mkdir(output,{recursive:true});
const servers=[spawn('python3',['-m','http.server','4187','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'}),spawn('python3',['-m','http.server','4188','--bind','127.0.0.1'],{cwd:before,stdio:'ignore'})];
let browser;
const report={engine,staticProtected:true,findings:[],errors:[],accessibility:[],performance:[],knownLimitation:'Issue #126: verified conversations and qualified leads require CRM/manual registration outside this site'};
async function newContext(width,height,motion='reduce',analytics='denied',marketing='denied'){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:motion});
 await context.addInitScript(({analytics,marketing})=>{
  localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics,marketing}));
  window.__qaVitals={lcp:null,cls:0,shifts:[]};
  try{new PerformanceObserver(list=>{for(const e of list.getEntries()){window.__qaVitals.lcp=e.startTime;window.__qaVitals.lcpElement={tag:e.element?.tagName,id:e.element?.id,className:String(e.element?.className||''),url:e.url,size:e.size,renderTime:e.renderTime,loadTime:e.loadTime}}}).observe({type:'largest-contentful-paint',buffered:true});}catch{}
  try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){window.__qaVitals.cls+=e.value;window.__qaVitals.shifts.push({value:e.value,sources:(e.sources||[]).map(s=>({node:s.node?.tagName,className:String(s.node?.className||'').slice(0,120),before:s.previousRect,after:s.currentRect}))})}}).observe({type:'layout-shift',buffered:true});}catch{}
 },{analytics,marketing});
 // Intercept collection and offsite navigation. QA never sends production analytics.
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(['127.0.0.1','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.continue();
  return route.fulfill({status:200,contentType:'application/javascript',body:''});
 });
 return context;
}
async function stable(page){
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('img').evaluateAll(async items=>{for(const img of items){img.loading='eager';try{await img.decode()}catch{}}});
 await delay(200);
}
try{
 for(const base of [origin,baseline]){
  let ready=false;for(let n=0;n<40;n++){try{ready=(await fetch(base+'/robots.txt')).ok;if(ready)break}catch{}await delay(200)}
  assert.ok(ready,'Both static servers ready');
 }
 browser=await ({chromium,webkit})[engine].launch({headless:true});
 if(engine==='chromium'){const context=await newContext(1440,900),page=await context.newPage();await page.goto(origin+'/',{waitUntil:'load'});await stable(page);await delay(1200);await page.screenshot({path:resolve(output,'home-reference.jpg'),type:'jpeg',quality:76});await context.close();}
 for(const slug of slugs)for(const [width,height] of sizes){
  const context=await newContext(width,height),page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))missing.push(r.url())});
  try{
   const response=await page.goto(origin+'/'+slug+'/',{waitUntil:'load'});assert.equal(response.status(),200);await stable(page);
   const metrics=await page.evaluate(()=>({
    client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,
    canonical:document.querySelector('link[rel=canonical]')?.href,
    images:[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src),
    defaultConsent:[...window.dataLayer||[]].find(x=>x[0]==='consent'&&x[1]==='default')?.[2],
    primary:(()=>{const r=document.querySelector('.lc-hero .lc-btn-primary,.copy-actions .b-ice')?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,height:r.height}:null})()
   }));
   assert.equal(metrics.h1,1);assert.equal(metrics.canonical,'https://olegariotech.com.br/'+slug+'/');
   if(metrics.scroll>metrics.client+2)metrics.overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(n=>({tag:n.tagName,className:String(n.className||''),left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right})).filter(n=>n.right>document.documentElement.clientWidth+2||n.left< -2).slice(0,20));
   assert.ok(metrics.scroll<=metrics.client+2,'No document overflow '+JSON.stringify(metrics));
   assert.deepEqual(metrics.images,[]);assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
   assert.equal(metrics.defaultConsent?.analytics_storage,'denied');assert.equal(metrics.defaultConsent?.ad_storage,'denied');
   assert.ok(metrics.primary?.height>=44,'Main action touch target');
   if(width>=1366||width<=430)assert.ok(metrics.primary.bottom<=height-8,'Main action visible in first viewport: '+JSON.stringify(metrics.primary));
   if(width<=1100){
    const menu=page.locator('.ot-service-menu');await menu.locator('summary').click();
    assert.ok(await menu.locator('nav').isVisible());assert.equal(await menu.locator('a').count(),6);
    await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('open'),null);
   }
   if(width===390||width===1440){
    const trigger=page.locator('.ot-consent-settings');
    await trigger.scrollIntoViewIfNeeded();
    const box=await trigger.boundingBox();assert.ok(box?.width>=44&&box.width<=240&&box.height>=44,'Privacy pill has a practical touch target');
    assert.equal(await trigger.innerText(),width<=900?'Privacidade':'Privacidade e cookies','Native responsive privacy label stays visible');
    assert.ok(parseFloat(await trigger.evaluate(n=>getComputedStyle(n).fontSize))>=11,'Privacy label is readable');
    assert.notEqual(await trigger.evaluate(n=>getComputedStyle(n,'::before').maskImage),'none','Privacy shield is present');
    assert.equal(await trigger.evaluate(n=>getComputedStyle(n,'::after').content),'none','No settings gear remains');
    const clearance=await trigger.evaluate(n=>{
     const r=n.getBoundingClientRect(),f=document.querySelector('.ot-site-footer').getBoundingClientRect();
     const links=[...document.querySelectorAll('.ot-site-footer a')].map(a=>a.getBoundingClientRect().bottom);
     return {position:getComputedStyle(n).position,top:r.top,bottom:r.bottom,lastLink:Math.max(...links),footerBottom:f.bottom};
    });
    assert.equal(clearance.position,'relative','Privacy uses the reserved footer row below 1600px');
    assert.ok(clearance.top>=clearance.lastLink+8&&clearance.bottom<=clearance.footerBottom-12,'Privacy pill clears footer links and stays in reserved padding');
    await trigger.click();await page.locator('.ot-consent.is-visible').waitFor();
    await page.locator('[data-consent-reject]').click();await page.locator('.ot-consent.is-visible').waitFor({state:'hidden'});
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    report.accessibility.push({slug,violations:axe.violations});
    assert.deepEqual(axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[],'Accessibility '+slug);
   }
   await page.screenshot({path:resolve(output,slug+'-'+engine+'-'+width+'-after.png'),fullPage:true,animations:'disabled'});
   if(width===390||width===1440){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(output,slug+'-'+width+'-after-viewport.jpg'),quality:72,type:'jpeg'});}
   if(width===390||width===1440){
    const oldPage=await context.newPage();await oldPage.goto(baseline+'/'+slug+'/',{waitUntil:'load'});await stable(oldPage);
    await oldPage.screenshot({path:resolve(output,slug+'-'+engine+'-'+width+'-before.png'),fullPage:true,animations:'disabled'});await oldPage.evaluate(()=>window.scrollTo(0,0));await oldPage.screenshot({path:resolve(output,slug+'-'+width+'-before-viewport.jpg'),quality:72,type:'jpeg'});await oldPage.close();
   }
   report.findings.push({slug,width,height,...metrics});
  }catch(e){
   report.errors.push({slug,width,height,error:e.message});
   await page.screenshot({path:resolve(output,slug+'-'+engine+'-'+width+'-failure.png'),fullPage:true}).catch(()=>{});
  }finally{await context.close()}
 }
 {
  const context=await newContext(390,844),page=await context.newPage();
  await page.goto(origin+'/criacao-de-sites-valinhos/?utm_source=instagram&utm_medium=story&utm_campaign=ot_premium&utm_content=valinhos',{waitUntil:'load'});
  const diagnostic=page.locator('.lc-hero a[href*="diagnostico-digital"]');
  const url=new URL(await diagnostic.getAttribute('href'),origin);
  assert.equal(url.searchParams.get('utm_source'),'instagram');assert.equal(url.searchParams.get('origem'),'sites-valinhos');
  await page.goto(url.href,{waitUntil:'load'});
  for(let n=0;n<5;n++){await page.locator('.step.active .opt').first().click();await page.locator('.step.active[data-step="'+(n+1)+'"]').waitFor();}
  await page.locator('#nomeNegocio').fill('Empresa QA');await page.locator('[data-finish]').click();
  await page.locator('.step.active[data-step="6"]').waitFor();
  await page.locator('#waLink').evaluate(link=>link.addEventListener('click',e=>e.preventDefault()));await page.locator('#waLink').click();
  const wa=new URL(await page.locator('#waLink').getAttribute('href')),message=wa.searchParams.get('text');
  assert.equal(wa.hostname,'wa.me');assert.equal(wa.pathname,'/5511912459144');
  assert.ok(message.includes('Negócio: Empresa QA')&&message.includes('Objetivo:')&&message.includes('Dados:'));
  assert.ok(message.includes('Origem da página: Criação de sites em Valinhos.'));assert.ok(!message.includes('utm_'));
  await page.screenshot({path:resolve(output,'diagnostic-result-'+engine+'.png'),fullPage:true});
  await page.locator('[data-restart]').click();assert.ok(await page.locator('.step.active[data-step="0"]').isVisible());await context.close();
 }
 {
  // Protect the complete trust-oriented choice: visible label, internal routing and WhatsApp objective.
  const context=await newContext(390,844),page=await context.newPage();
  await page.goto(origin+'/diagnostico-digital/',{waitUntil:'load'});
  const choice=page.locator('.step.active .opt[data-value="Transmitir mais confiança aos clientes"]');
  assert.equal((await choice.innerText()).trim(),'Transmitir mais confiança aos clientes');
  await choice.click();await page.locator('.step.active[data-step="1"]').waitFor();
  for(let i=1;i<5;i++){await page.locator('.step.active .opt').last().click();await page.locator('.step.active[data-step="'+(i+1)+'"]').waitFor();}
  await page.locator('#nomeNegocio').fill('Empresa Confiança QA');
  await page.locator('[data-finish]').click();await page.locator('.step.active[data-step="6"]').waitFor();
  assert.equal((await page.locator('#priorityTitle').innerText()).trim(),'Fortalecer presença e confiança');
  const wa=new URL(await page.locator('#waLink').getAttribute('href'));
  assert.equal(wa.pathname,'/5511912459144');
  assert.ok(wa.searchParams.get('text').includes('Objetivo: Transmitir mais confiança aos clientes'));
  assert.ok(!wa.searchParams.get('text').includes('Parecer mais profissional'));
  await context.close();
 }
 {
  const context=await newContext(390,844,'no-preference'),page=await context.newPage();
  await page.goto(origin+'/diagnostico-digital/',{waitUntil:'load'});await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('skip-link')),true);
  await page.keyboard.press('Enter');assert.ok(await page.locator('#conteudo').isVisible());await context.close();
 }

 // Prove consent isolation and preserve the known Issue #126 event semantics.
 report.consent=[];
 for(const choice of [['denied','denied'],['granted','denied'],['denied','granted']]){
  const [analytics,marketing]=choice,context=await newContext(390,844,'reduce',analytics,marketing),page=await context.newPage();
  await page.goto(origin+'/diagnostico-digital/?debug_analytics=1',{waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(window.OTAnalytics));
  assert.equal(await page.locator('#ot-ga4-script').count(),analytics==='granted'?1:0);
  assert.equal(await page.locator('#ot-meta-pixel-script').count(),marketing==='granted'?1:0);
  await page.locator('[data-start-link]').click();
  for(let n=0;n<5;n++){await page.locator('.step.active .opt').first().click();await page.locator('.step.active[data-step="'+(n+1)+'"]').waitFor();}
  await page.locator('[data-finish]').click();
  await page.locator('#waLink').evaluate(link=>link.addEventListener('click',e=>e.preventDefault()));await page.locator('#waLink').click();
  const events=await page.evaluate(()=>({
   ga:(window.dataLayer||[]).filter(x=>x[0]==='event').map(x=>x[1]),
   meta:(window.fbq?.queue||[]).filter(x=>x[0]==='track').map(x=>x[1])
  }));
  for(const name of ['diagnostico_inicio','diagnostico_concluido','click_whatsapp'])assert.equal(events.ga.filter(x=>x===name).length,analytics==='granted'?1:0,'GA '+name+' / '+choice);
  assert.equal(events.ga.filter(x=>x==='generate_lead').length,0,'A click is not a received lead');
  if(marketing==='denied')assert.deepEqual(events.meta,[]);
  else for(const name of ['PageView','Contact'])assert.equal(events.meta.filter(x=>x===name).length,1,'Pixel contact intent '+name);
  assert.equal(events.meta.filter(x=>x==='Lead').length,0,'Pixel Lead requires external CRM confirmation');
  report.consent.push({analytics,marketing,events,note:'Issue #126: click intent and received lead separated'});
  await context.close();
 }

 if(engine==='chromium')for(const slug of slugs)for(const [width,height] of [[390,844],[1440,900]]){
  const measured={slug,width,height,before:[],after:[]};
  for(let sample=0;sample<3;sample++)for(const [name,base] of [['before',baseline],['after',origin]]){
   const context=await newContext(width,height),page=await context.newPage();
   await page.goto(base+'/'+slug+'/',{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await delay(800);
   measured[name].push(await page.evaluate(()=>({...window.__qaVitals,dom:document.querySelectorAll('*').length,images:[...document.images].map(i=>({src:new URL(i.currentSrc||i.src).pathname,loading:i.loading,loaded:i.complete&&i.naturalWidth>0})),localResources:performance.getEntriesByType('resource').filter(r=>r.name.startsWith(location.origin)).map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize||0,duration:r.duration,type:r.initiatorType})),localBytes:performance.getEntriesByType('resource').filter(r=>r.name.startsWith(location.origin)).reduce((n,r)=>n+(r.encodedBodySize||0),0)})));
   await context.close();
  }
  report.performance.push(measured);
  const maxCLS=Math.max(...measured.after.map(x=>x.cls));
  if(maxCLS>.1)report.errors.push({slug,width,phase:'performance',error:'CLS exceeds 0.1',cls:maxCLS});
 }
 report.success=report.errors.length===0;await writeFile(resolve(output,'report-'+engine+'.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({engine,success:report.success,viewports:report.findings.length,errors:report.errors,performanceComparisons:report.performance.length,performance:report.performance,consent:report.consent,visualInspection:false}));
 assert.equal(report.errors.length,0,'Review recorded failures');
}catch(e){
 report.success=false;report.fatal=e.stack;await writeFile(resolve(output,'report-'+engine+'.json'),JSON.stringify(report,null,2));throw e;
}finally{if(browser)await browser.close();servers.forEach(s=>s.kill('SIGTERM'))}
