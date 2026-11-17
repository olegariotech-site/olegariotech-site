import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {verifyCampaignTree,CAMPAIGN_BASE,CAMPAIGN_TITLE,CAMPAIGN_DESCRIPTION,CAMPAIGN_H1,CAMPAIGN_DISCLOSURE,CAMPAIGN_ASSET_PATHS} from './verify-kl-campaign-contract.mjs';
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),before=process.env.OT_KL_BEFORE;
assert.ok(before,'Separate published checkout required');assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:before,encoding:'utf8'}).trim(),CAMPAIGN_BASE);
const engine=process.env.OT_KL_ENGINE||'chromium';assert.ok(['chromium','webkit'].includes(engine));
const out=process.env.OT_KL_OUTPUT||'/tmp/ot-kl-campaigns';await mkdir(out,{recursive:true});
const report={engine,publishedRef:CAMPAIGN_BASE,scope:await verifyCampaignTree(root),views:[],accessibility:[],performance:[],images:[],limitations:['Linux browser engines and viewport simulations; no physical Safari/Android certification.','Cold local samples without network/CPU throttling; no field CWV or INP claim.','Client identity is public; promotional authorization remains unconfirmed. No publication is authorized.']};
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
let browser,currentPage;const servers=[];
async function serve(dir){const s=createServer(async(req,res)=>{try{let p=resolve(dir,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));assert.ok(p===dir||p.startsWith(dir+'/'));if((await stat(p)).isDirectory())p+='/index.html';res.setHeader('content-type',types[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end()}});await new Promise(r=>s.listen(0,'127.0.0.1',r));servers.push(s);return 'http://127.0.0.1:'+s.address().port}
async function context(width,height,motion='reduce'){
 const c=await browser.newContext({viewport:{width,height},reducedMotion:motion});
 await c.addInitScript(()=>{
  localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));window.__campaignVitals={lcp:null,cls:0};
  try{new PerformanceObserver(l=>{for(const e of l.getEntries()){window.__campaignVitals.lcp=e.startTime;window.__campaignVitals.lcpElement={tag:e.element?.tagName,url:e.url}}}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__campaignVitals.cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch{}
 });
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(['127.0.0.1','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return r.continue();return r.fulfill({status:200,contentType:'application/javascript',body:'/* QA: collectors and offsite navigation intercepted */'})});return c;
}
async function ready(p,capture=false){await p.evaluate(()=>document.fonts.ready);if(capture)await p.locator('img').evaluateAll(async imgs=>{for(const i of imgs){i.loading='eager';await i.decode()}});await delay(200)}
async function shot(p,name,options={}){await p.screenshot({path:resolve(out,name),animations:'disabled',...options});report.images.push(name)}
async function info(p){return p.evaluate(()=>({title:document.title,descriptions:[...document.querySelectorAll('meta[name=description]')].map(n=>n.content),h1:[...document.querySelectorAll('h1')].map(n=>n.textContent.trim().replace(/\s+/g,' ')),canonical:[...document.querySelectorAll('link[rel=canonical]')].map(n=>n.href),ogTitle:document.querySelector('meta[property="og:title"]')?.content,ogDescription:document.querySelector('meta[property="og:description"]')?.content,twitterTitle:document.querySelector('meta[name="twitter:title"]')?.content,twitterDescription:document.querySelector('meta[name="twitter:description"]')?.content,schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),whatsapp:[...document.querySelectorAll('a[href*="wa.me/"]')].map(n=>n.getAttribute('href')),diagnosis:[...document.querySelectorAll('.lc-hero a[href*="diagnostico-digital"]')].map(n=>n.getAttribute('href')),scriptTags:[...document.scripts].filter(n=>n.type!=='application/ld+json').map(n=>n.outerHTML),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2}));}
try{
 const afterURL=await serve(root),beforeURL=await serve(before);browser=await ({chromium,webkit})[engine].launch({headless:true});report.browserVersion=browser.version();
 const refContext=await context(1440,900),refPage=await refContext.newPage();await refPage.goto(beforeURL+'/anuncios-google-instagram/');await ready(refPage);const baselineInfo=await info(refPage);await refContext.close();
 const expectedSchemas=structuredClone(baselineInfo.schemas),graph=expectedSchemas[0]['@graph'];
 graph.find(n=>n['@type']==='WebPage').name=CAMPAIGN_TITLE;graph.find(n=>n['@type']==='WebPage').description=CAMPAIGN_DESCRIPTION;
 graph.find(n=>n['@type']==='Service').name='Planejamento e gestão de anúncios no Google, Instagram e Facebook';graph.find(n=>n['@type']==='Service').serviceType='Campanhas de anúncios digitais no Google Ads e Meta Ads (Instagram e Facebook)';
 graph.find(n=>n['@type']==='BreadcrumbList').itemListElement[1].name='Anúncios Google, Instagram e Facebook';
 for(const [width,height] of [[1920,1080],[1440,900],[1366,612],[1024,768],[768,1024],[360,780],[390,844],[430,932]]){
  const c=await context(width,height),p=await c.newPage();currentPage=p;const errors=[],missing=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(afterURL))missing.push(r.url())});
  const response=await p.goto(afterURL+'/anuncios-google-instagram/',{waitUntil:'load'});assert.equal(response.status(),200);await ready(p,true);
  const seo=await info(p);assert.equal(seo.title,CAMPAIGN_TITLE);assert.deepEqual(seo.descriptions,[CAMPAIGN_DESCRIPTION]);assert.deepEqual(seo.h1,[CAMPAIGN_H1]);
  assert.deepEqual(seo.canonical,['https://olegariotech.com.br/anuncios-google-instagram/']);for(const k of ['ogTitle','twitterTitle'])assert.equal(seo[k],CAMPAIGN_TITLE);for(const k of ['ogDescription','twitterDescription'])assert.equal(seo[k],CAMPAIGN_DESCRIPTION);
  assert.deepEqual(seo.schemas,expectedSchemas,'Only authorized three-channel schema fields change');assert.deepEqual(seo.whatsapp,baselineInfo.whatsapp);assert.deepEqual(seo.diagnosis,baselineInfo.diagnosis);assert.deepEqual(seo.scriptTags,baselineInfo.scriptTags,'No script or consent changes');assert.equal(seo.overflow,false);
  assert.equal(await p.locator('#ot-ga4-script,#ot-meta-pixel-script').count(),0);assert.equal(await p.locator('.ot-ads-device').count(),2);
  const text=await p.locator('.ot-ads-example').innerText();assert.ok(text.includes(CAMPAIGN_DISCLOSURE));assert.ok(!/ROTA 019|Patrocinado|Empresa fictícia/.test(text));
  assert.equal(await p.locator('.ot-ads-example a,.ot-ads-example button').count(),0,'Illustrative CTAs are not fake platform controls');
  const ig=p.getByRole('radio',{name:'Instagram',exact:true}),fb=p.getByRole('radio',{name:'Facebook',exact:true});assert.equal(await ig.isChecked(),true);assert.equal(await fb.isChecked(),false);
  assert.equal(await p.getByRole('region',{name:'Conceito de Facebook Ads para a K.L',exact:true}).count(),0,'Inactive concept is excluded from accessibility tree');
  const cta=await p.locator('.lc-hero .lc-btn-primary').boundingBox();assert.ok(cta.height>=44&&cta.y+cta.height<=height-8,'Primary conversion remains above the fold');
  for(const label of await p.locator('.kl-channel-selector>label').all()){const b=await label.boundingBox();assert.ok(b.width>=44&&b.height>=44)}
  const originalBox=await p.locator('.kl-social-panels').boundingBox(),heroBox=await p.locator('.ot-ads-hero').boundingBox();
  const eventCount=await p.evaluate(()=>(window.dataLayer||[]).filter(n=>n[0]==='event').length);
  if(width===390||width===1440){
   const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations,[]);report.accessibility.push({width,channel:'instagram',violations:0});
   await p.evaluate(()=>scrollTo(0,0));await shot(p,'ads-'+engine+'-'+width+'-instagram.png',{fullPage:width===390});
   await p.locator('.ot-ads-stage').screenshot({path:resolve(out,'cards-'+engine+'-'+width+'-instagram.png'),animations:'disabled'});report.images.push('cards-'+engine+'-'+width+'-instagram.png');
   const old=await c.newPage();await old.goto(beforeURL+'/anuncios-google-instagram/');await ready(old,true);await shot(old,'ads-'+engine+'-'+width+'-before.png',{fullPage:width===390});await old.close();
  }
  await ig.focus();await p.keyboard.press('ArrowRight');assert.equal(await fb.isChecked(),true);assert.equal(await ig.isChecked(),false);
  assert.ok(await p.locator('[data-concept-channel=facebook]').isVisible());assert.equal(await p.locator('[data-concept-channel=instagram]').isVisible(),false);
  assert.equal(await p.getByRole('region',{name:'Conceito de Instagram Ads para a K.L',exact:true}).count(),0);
  const focusStyle=await p.locator('label[for=kl-channel-facebook]').evaluate(n=>({width:parseFloat(getComputedStyle(n).outlineWidth),style:getComputedStyle(n).outlineStyle}));assert.ok(focusStyle.width>=2&&focusStyle.style!=='none','Keyboard focus is visible on the real control label');
  const swapped=await p.locator('.kl-social-panels').boundingBox(),swappedHero=await p.locator('.ot-ads-hero').boundingBox();assert.ok(Math.abs(swapped.height-originalBox.height)<1&&Math.abs(swappedHero.height-heroBox.height)<1,'Channel selection does not change layout height');
  assert.equal(await p.evaluate(()=>(window.dataLayer||[]).filter(n=>n[0]==='event').length),eventCount,'Selecting a concept does not generate a new tracking event');
  if(width===390||width===1440){
   const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations,[]);report.accessibility.push({width,channel:'facebook',violations:0});
   await p.evaluate(()=>scrollTo(0,0));await shot(p,'ads-'+engine+'-'+width+'-facebook.png',{fullPage:width===390});
   await p.locator('.ot-ads-stage').screenshot({path:resolve(out,'cards-'+engine+'-'+width+'-facebook.png'),animations:'disabled'});report.images.push('cards-'+engine+'-'+width+'-facebook.png');
  }
  await p.keyboard.press('ArrowLeft');assert.equal(await ig.isChecked(),true);assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);report.views.push({width,height,channels:2,overflow:false,keyboard:true,stableHeight:true,errors,missing});await c.close();
 }
 // Exercise natural initial loading in fresh contexts, separately from forced screenshot images.
 if(engine==='chromium')for(const slug of ['anuncios-google-instagram','criacao-de-sites-valinhos','criacao-de-sites-campinas','presenca-no-google','diagnostico-digital'])for(const [width,height] of [[390,844],[1440,900]]){
  const sample={slug,width,before:[],after:[]};
  for(let n=0;n<3;n++)for(const [version,url] of [['before',beforeURL],['after',afterURL]]){
   const c=await context(width,height,'no-preference'),p=await c.newPage();await p.goto(url+'/'+slug+'/',{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await delay(800);
   sample[version].push(await p.evaluate(()=>({...window.__campaignVitals,fonts:{inter:document.fonts.check('16px Inter'),space:document.fonts.check('16px "Space Grotesk"')},documentBytes:performance.getEntriesByType('navigation')[0]?.encodedBodySize||0,resources:performance.getEntriesByType('resource').filter(r=>r.name.startsWith(location.origin)).map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize,type:r.initiatorType})),images:[...document.images].map(i=>({path:new URL(i.currentSrc||i.src).pathname,loading:i.loading,loaded:i.complete&&i.naturalWidth>0}))})));await c.close();
  }
  assert.ok(Math.max(...sample.after.map(s=>s.cls))<=.1,'Unchanged CLS budget: '+slug+' '+width);
  const oldImages=new Set(sample.before.flatMap(s=>s.resources.filter(r=>r.type==='img').map(r=>r.path)));
  for(const r of sample.after.flatMap(s=>s.resources.filter(r=>r.type==='img')))assert.ok(oldImages.has(r.path)||CAMPAIGN_ASSET_PATHS.includes(r.path),'Only the two approved brand assets may add image transfers');
  report.performance.push(sample);
 }
 if(engine==='chromium'){
  const kit=process.env.OT_KL_KIT_OUTPUT;assert.ok(kit,'Fresh browser-rendered sharing kit required');
  const saved=await readFile(resolve(root,'assets/img/commercial/anuncios-google-instagram-og.png')),rendered=await readFile(resolve(kit,'kit/anuncios-google-instagram-og.png'));
  assert.ok(saved.equals(rendered),'Candidate OG raster must match the freshly rendered three-channel SVG source');
 }
 const approval=report.scope.brandPublicationApproval;report.success=true;report.release={technicalQA:true,brandAuthorization:approval,readyToPublish:approval==='confirmed',directionPublicationAuthorization:false};
}catch(e){report.success=false;report.error=e.stack;if(currentPage&&!currentPage.isClosed())await shot(currentPage,'failure-'+engine+'.png',{fullPage:true}).catch(()=>{});throw e;}
finally{await writeFile(resolve(out,'report-'+engine+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({engine,success:report.success,views:report.views.length,accessibility:report.accessibility.length,performance:report.performance.length,release:report.release,error:report.error}));if(browser)await browser.close();for(const s of servers)s.close();}
