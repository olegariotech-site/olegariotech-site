import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const before=process.env.OT_COMMERCIAL_BEFORE;
assert.ok(before,'Baseline checkout required; never silently compare current to itself');
const output=process.env.OT_COMMERCIAL_OUTPUT||'/tmp/ot-commercial-premium';
const engine=process.env.OT_COMMERCIAL_ENGINE||'chromium';
const origin='http://127.0.0.1:4187',baseline='http://127.0.0.1:4188';
const slugs=['criacao-de-sites-valinhos','criacao-de-sites-campinas','presenca-no-google','anuncios-google-instagram','diagnostico-digital'];
const sizes=[[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[360,780],[390,844],[430,932]];
for(const path of ['index.html','scripts/verify-premium-v3.mjs','assets/js/ot-analytics.js','assets/js/ot-analytics-core.js','assets/css/ot-consent.css','robots.txt','sitemap.xml']){
 assert.equal(await readFile(resolve(root,path),'utf8'),await readFile(resolve(before,path),'utf8'),'Protected file unchanged: '+path);
}
for(const slug of slugs){
 const now=await readFile(resolve(root,slug,'index.html'),'utf8'),old=await readFile(resolve(before,slug,'index.html'),'utf8');
 for(const re of [/<title>[\s\S]*?<\/title>/,/<meta name="description"[^>]*>/,/<link rel="canonical"[^>]*>/,/<h1\b[\s\S]*?<\/h1>/])assert.equal(now.match(re)?.[0],old.match(re)?.[0],slug+' preserves '+re);
 for(const schema of now.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(schema[1]);
}
await mkdir(output,{recursive:true});
const servers=[spawn('python3',['-m','http.server','4187','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'}),spawn('python3',['-m','http.server','4188','--bind','127.0.0.1'],{cwd:before,stdio:'ignore'})];
let browser;
const report={engine,staticProtected:true,findings:[],errors:[],accessibility:[],performance:[],knownLimitation:'Issue #126: intent is not received conversation or qualified lead; semantics unchanged'};
async function newContext(width,height,motion='reduce'){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:motion});
 await context.addInitScript(()=>{
  localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
  window.__qaVitals={lcp:null,cls:0};
  try{new PerformanceObserver(list=>{for(const e of list.getEntries())window.__qaVitals.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});}catch{}
  try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__qaVitals.cls+=e.value}).observe({type:'layout-shift',buffered:true});}catch{}
 });
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
   assert.ok(metrics.scroll<=metrics.client+2,'No document overflow '+JSON.stringify(metrics));
   assert.deepEqual(metrics.images,[]);assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
   assert.equal(metrics.defaultConsent?.analytics_storage,'denied');assert.equal(metrics.defaultConsent?.ad_storage,'denied');
   assert.ok(metrics.primary?.height>=44,'Main action touch target');
   if(width>=1366||width<=430)assert.ok(metrics.primary.bottom<=height-8,'Main action visible in first viewport: '+JSON.stringify(metrics.primary));
   if(width<=980){
    const menu=page.locator('.ot-service-menu');await menu.locator('summary').click();
    assert.ok(await menu.locator('nav').isVisible());assert.equal(await menu.locator('a').count(),6);
    await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('open'),null);
   }
   if(width===390){
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    report.accessibility.push({slug,violations:axe.violations});
    assert.deepEqual(axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[],'Accessibility '+slug);
   }
   await page.screenshot({path:resolve(output,slug+'-'+engine+'-'+width+'-after.png'),fullPage:true,animations:'disabled'});
   if(width===390||width===1440){
    const oldPage=await context.newPage();await oldPage.goto(baseline+'/'+slug+'/',{waitUntil:'load'});await stable(oldPage);
    await oldPage.screenshot({path:resolve(output,slug+'-'+engine+'-'+width+'-before.png'),fullPage:true,animations:'disabled'});await oldPage.close();
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
  const context=await newContext(390,844,'no-preference'),page=await context.newPage();
  await page.goto(origin+'/diagnostico-digital/',{waitUntil:'load'});await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('skip-link')),true);
  await page.keyboard.press('Enter');assert.ok(await page.locator('#conteudo').isVisible());await context.close();
 }
 if(engine==='chromium')for(const slug of slugs)for(const [width,height] of [[390,844],[1440,900]]){
  const measured={slug,width,height,before:[],after:[]};
  for(let sample=0;sample<3;sample++)for(const [name,base] of [['before',baseline],['after',origin]]){
   const context=await newContext(width,height),page=await context.newPage();
   await page.goto(base+'/'+slug+'/',{waitUntil:'load'});await stable(page);await delay(600);
   measured[name].push(await page.evaluate(()=>({...window.__qaVitals,dom:document.querySelectorAll('*').length,localBytes:performance.getEntriesByType('resource').filter(r=>r.name.startsWith(location.origin)).reduce((n,r)=>n+(r.encodedBodySize||0),0)})));
   await context.close();
  }
  report.performance.push(measured);
 }
 report.success=report.errors.length===0;await writeFile(resolve(output,'report-'+engine+'.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({engine,success:report.success,viewports:report.findings.length,errors:report.errors,performanceComparisons:report.performance.length,visualInspection:false}));
 assert.equal(report.errors.length,0,'Review recorded failures');
}catch(e){
 report.success=false;report.fatal=e.stack;await writeFile(resolve(output,'report-'+engine+'.json'),JSON.stringify(report,null,2));throw e;
}finally{if(browser)await browser.close();servers.forEach(s=>s.kill('SIGTERM'))}
