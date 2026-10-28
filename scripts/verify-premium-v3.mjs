// OT V3 regression suite. Self-contained local server; never deploys or sends analytics.
// npm install --no-save --package-lock=false playwright@1.56.1 @axe-core/playwright@4.10.2
// npx playwright install --with-deps chromium firefox webkit
// node scripts/verify-premium-v3.mjs
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
const pw=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const output=process.env.OT_QA_OUTPUT||'/tmp/ot-premium-v3-qa';await mkdir(output,{recursive:true});
const baseline=process.env.OT_BASELINE_COMMIT||'66db8f5169c30b0904667b56c03a8e9d7e8c3549';
const source=await readFile(resolve(root,'index.html'),'utf8');
const before=execFileSync('git',['show',`${baseline}:index.html`],{cwd:root,encoding:'utf8'});
const catalog=s=>JSON.parse(s.match(/const projects=(\{[\s\S]*?\n\});/)[1]);
const projects=catalog(source),approvedProjects=catalog(before);assert.equal(approvedProjects.ripamonti.testimonial.quote,'Exatamente como eu queria. Trabalho perfeito, estou muito satisfeito.');approvedProjects.ripamonti.testimonial.quote='Exatamente como eu queria .trabalho perfeito estou muito satisfeito';assert.deepEqual(projects,approvedProjects,'catalog unchanged except verified literal Ripamonti punctuation correction');
const seo=html=>[...html.matchAll(/<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*rel="canonical"[^>]*>/g)].map(m=>m[0]);
assert.deepEqual(seo(source),seo(before),'home title, metadata and canonical unchanged');
const section=(html,id)=>html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))[0];
for(const id of ['inicio','solucoes','metodo','produtos','faq','contato'])assert.equal(section(source,id),section(before,id),`protected ${id} markup`);
const baselineAbout=section(before,'sobre');
const approvedAbout=baselineAbout.replace('<div class="about-photo"><img src="/assets/img/alexandre-olegario.jpeg" alt="Alexandre Olegario, fundador da Olegario Tech" loading="lazy"></div>','<figure class="about-photo"><img src="/assets/img/alexandre-olegario.jpeg" alt="Alexandre Olegario, fundador da Olegario Tech" width="1280" height="1280" loading="lazy" decoding="async"><figcaption><strong>Alexandre Olegario</strong><span>Fundador · Olegario Tech</span></figcaption></figure>').replace('<div class="about-stats"><span>30+ anos em vendas</span><span>Valinhos e Campinas</span><span>Design + visão comercial</span></div>','<div class="about-stats"><span>30+ anos em vendas</span><span>Valinhos e Campinas</span><span>Design + visão comercial</span></div><a class="btn btn-ghost about-diagnostic" href="/diagnostico-digital/">Fazer meu diagnóstico gratuito <span aria-hidden="true">↗</span></a>');
assert.equal(section(source,'sobre'),approvedAbout,'founder section permits only the caption, image dimensions and existing diagnosis CTA');
const originalV2=execFileSync('git',['show',`${baseline}:assets/js/ot-v2.js`],{cwd:root,encoding:'utf8'});
const aboutStart=originalV2.indexOf('  function tuneAbout(){'),aboutEnd=originalV2.indexOf('\n  function tuneProducts()',aboutStart);
const expectedV2=originalV2.slice(0,aboutStart)+'  // Institutional copy is owned by index.html. Do not overwrite the founder or local positioning.\n  function tuneAbout(){}\n'+originalV2.slice(aboutEnd);
assert.equal(await readFile(resolve(root,'assets/js/ot-v2.js'),'utf8'),expectedV2.replace("if(key&&typeof renderProject==='function')renderProject(key);safeTrack('click_proof_case'","if(key&&window.OTProjectShowroom?.open){e.preventDefault();window.OTProjectShowroom.open(key);}else if(key&&typeof renderProject==='function')renderProject(key);safeTrack('click_proof_case'"),'runtime allows only canonical founder copy and direct proof-case navigation');
for(const path of ['criacao-de-sites-valinhos/index.html','criacao-de-sites-campinas/index.html','diagnostico-digital/index.html','produtos/index.html','privacidade/index.html','cookies/index.html']){
 const original=execFileSync('git',['show',`${baseline}:${path}`],{cwd:root,encoding:'utf8'});
 const current=await readFile(resolve(root,path),'utf8');
 assert.equal(current,original.replace(/ot-analytics\.js\?v=\d+/g,'ot-analytics.js?v=9').replace(/ot-consent\.css\?v=\d+/g,'ot-consent.css?v=4'),`${path}: only shared asset cache versions changed`);
}
const inline=s=>[...s.matchAll(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g)].map(m=>m[0]).filter(t=>!t.slice(0,t.indexOf('>')).includes(' src='));
assert.deepEqual(inline(source).map(script=>script.replace('Exatamente como eu queria .trabalho perfeito estou muito satisfeito','Exatamente como eu queria. Trabalho perfeito, estou muito satisfeito.')),inline(before),'inline commercial logic and structured data unchanged');
for(const path of ['assets/js/ot-earth-journey.js','assets/js/ot-earth-spin.js','assets/js/ot-cosmic-scene.js','assets/js/ot-solution-configurator.js','assets/js/ot-experience-polish.js','assets/js/ot-digital-pulse.js','assets/js/ot-mobile-v3.js','assets/css/ot-solution-case.css','DESIGN.md']){
 const original=execFileSync('git',['show',`${baseline}:${path}`],{cwd:root});assert.deepEqual(await readFile(resolve(root,path)),original,`protected ${path}`);
}
const analyticsBefore=execFileSync('git',['show',`${baseline}:assets/js/ot-analytics-core.js`],{cwd:root,encoding:'utf8'});
const analyticsAfter=await readFile(resolve(root,'assets/js/ot-analytics-core.js'),'utf8');
assert.equal(analyticsAfter.slice(0,analyticsAfter.indexOf('  let consentReturnFocus')),analyticsBefore.slice(0,analyticsBefore.indexOf('  function bannerTemplate()')),'consent guards, tag loaders and analytic events unchanged');
assert.equal(analyticsAfter.slice(analyticsAfter.indexOf('  function installEcosystemSection()')),analyticsBefore.slice(analyticsBefore.indexOf('  function installEcosystemSection()')),'shared setup and boot policy unchanged');
if(process.env.OT_QA_STATIC_ONLY==='1'){console.log('Protected copy, catalog, SEO, event guards and engine scripts: PASS');process.exit(0);}
const {default:AxeBuilder}=await import(process.env.OT_AXE_MODULE||'@axe-core/playwright');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+'/'))throw Error('path');if((await stat(file)).isDirectory())file+='/index.html';res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const report={baseline,browserPath:'Browser plugin not available; Playwright',engines:{},privacy:[],pages:[],limitations:['Linux engine simulations; no physical iPhone/Android, Safari chrome or real audio-output certification.','Automatic contrast checks cover exercised states; manual accessibility review is still required.','GA/Meta tag destinations intercepted; no real events sent.']};
const fonts=new Map();
async function transport(context){
 if(process.env.OT_QA_PROXY_FONTS==='1')await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{const url=route.request().url();try{if(!fonts.has(url)){const response=await fetch(url,{signal:AbortSignal.timeout(20000)});assert.ok(response.ok);fonts.set(url,{body:Buffer.from(await response.arrayBuffer()),contentType:response.headers.get('content-type')});}await route.fulfill(fonts.get(url));}catch(e){fonts.delete(url);await route.abort();}});
 await context.route(/https:\/\/(www\.googletagmanager\.com|connect\.facebook\.net)\//,route=>route.fulfill({contentType:'application/javascript',body:'/* OT QA: external tag intercepted */'}));
}
async function ready(page){const response=await page.goto(base,{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.locator('#projectStage[data-interactive=true]').waitFor();await page.locator('#otConsent.is-visible').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function selected(page,key){await page.waitForFunction(k=>document.querySelector('#projectStage').dataset.selectedProject===k&&!document.querySelector('#projectStage').hasAttribute('aria-busy'),key);await page.waitForFunction(()=>{const img=document.querySelector('#caseCapture img');return img?.complete&&img.naturalWidth>0});}
async function reject(page){await page.getByRole('button',{name:'Recusar opcionais',exact:true}).click();await page.locator('#otConsent').waitFor({state:'hidden'});}
async function sweep(page){await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');for(let y=0;y<await page.evaluate(()=>document.documentElement.scrollHeight);y+=650){await page.evaluate(v=>scrollTo(0,v),y);await page.waitForTimeout(80);}await page.evaluate(()=>document.fonts.ready);}
try{
 for(const name of (process.env.OT_QA_ENGINES||'chromium,firefox,webkit').split(',')){
  let browser;try{browser=await pw[name].launch(name==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{});}catch(e){report.engines[name]={unavailable:e.message};continue;}
  let probeTimer;
  try{const probe=await Promise.race([browser.newPage(),new Promise((_,reject)=>{probeTimer=setTimeout(()=>reject(new Error('Browser content process unavailable after 15s')),15000)})]);clearTimeout(probeTimer);await probe.setContent('<h1>OT engine probe</h1>');assert.equal(await probe.locator('h1').innerText(),'OT engine probe');await probe.close();}
  catch(error){clearTimeout(probeTimer);report.engines[name]={unavailable:error.message};await browser.close();continue;}
  const runs=[];report.engines[name]={version:browser.version(),runs};
  try{
   for(const width of (process.env.OT_QA_WIDTHS||'360,390,430,768,1366,1440,1920').split(',').map(Number)){
    const height=width<768?844:width===768?1024:900;const context=await browser.newContext({viewport:{width,height},hasTouch:width<=768,isMobile:name!=='firefox'&&width<768});await transport(context);const page=await context.newPage();
    const errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))missing.push(r.url());});
    await ready(page);const panel=await page.locator('#otConsent').boundingBox();
    if(width<=780){const cta=await page.locator('#inicio .btn-primary').boundingBox();assert.ok(panel.y>=cta.y+cta.height,'consent does not cover the main diagnosis CTA');assert.equal(await page.locator('#otConsent').getAttribute('role'),'region');}assert.ok(panel.height<height*.42,'compact initial consent');
    assert.equal(await page.locator('#otConsentPreferences').isVisible(),false);assert.equal(await page.locator('[data-consent-analytics]').isChecked(),false);assert.equal(await page.locator('[data-consent-marketing]').isChecked(),false);
    if([390,1440].includes(width))await page.screenshot({path:`${output}/${name}-cookies-${width}.png`});
    await reject(page);await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
    assert.equal((await page.locator('h1').innerText()).replace(/\s+/g,' ').trim(),'Sites que geram negócios.');
    assert.match(await page.locator('.hero-sub').innerText(),/Valinhos e Campinas/);
    assert.match(await page.locator('#sobre').innerText(),/Alexandre Olegario reúne mais de 30 anos/);
    assert.equal(await page.locator('.featured-project').count(),3);
    await page.locator('#prova a[data-project=acai]').click();await selected(page,'acai');assert.equal(await page.locator('#projectStage').evaluate(e=>e===document.activeElement),true,'existing proof rail opens the selected case after the new overview');
    await page.locator('[data-featured-project=advocacia]').focus();await page.keyboard.press('Enter');await selected(page,'advocacia');assert.equal(await page.locator('#projectStage').evaluate(el=>el===document.activeElement),true);
    const featureRect=await page.locator('#projectStage').boundingBox();const headerBottom=await page.locator(width<=900?'.mobile-header':'.topbar').evaluate(e=>e.getBoundingClientRect().bottom);assert.ok(featureRect.y>=headerBottom-2,`stage focus below fixed header: ${JSON.stringify({width,featureRect,headerBottom,scroll:await page.evaluate(()=>({y:scrollY,padding:getComputedStyle(document.documentElement).scrollPaddingTop,margin:getComputedStyle(document.querySelector('#projectStage')).scrollMarginTop}))})}`);
    for(const key of ['acai','kl','adega','advocacia','ripamonti','navalha']){
     await page.locator(`#project-tab-${key}`).click();await selected(page,key);assert.equal(await page.locator('#projectStage h3').innerText(),projects[key].title);
     assert.equal(await page.locator(`#project-tab-${key}`).getAttribute('aria-selected'),'true');
     if(projects[key].testimonial){assert.equal(await page.locator('.case-testimonial blockquote').innerText(),`“${projects[key].testimonial.quote}”`);}
    }
    await page.locator('#project-tab-navalha').focus();await page.keyboard.press('Home');await selected(page,'acai');await page.keyboard.press('ArrowRight');await selected(page,'kl');await page.keyboard.press('End');await selected(page,'navalha');
    for(const key of ['acai','advocacia','ripamonti']){
     const card=page.locator(`.featured-project:has([data-featured-project=${key}])`);assert.equal(await card.locator('blockquote').innerText(),`“${projects[key].testimonial.quote}”`);assert.equal(await card.locator('figcaption strong').innerText(),projects[key].testimonial.author);assert.equal(await card.locator('figcaption a').getAttribute('href'),projects[key].testimonial.source);assert.match(await card.locator('figcaption a').getAttribute('aria-label'),/listagem geral/);
    }
    await page.locator('#project-tab-kl').click();await selected(page,'kl');await page.locator('#projectStage').getByRole('button',{name:'Identidade',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.kind==='brand');await page.locator('#projectStage').getByRole('button',{name:'Website',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.kind==='website');
    if(width>600){await page.getByRole('button',{name:'Mobile',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.view==='mobile');await page.getByRole('button',{name:'Desktop',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.view==='desktop');}
    else{await page.locator('[data-expand]').click();assert.equal(await page.locator('[data-expand]').getAttribute('aria-expanded'),'true');await page.locator('[data-expand]').click();assert.equal(await page.locator('[data-expand]').getAttribute('aria-expanded'),'false');}
    await sweep(page);
    const layout=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>i.getBoundingClientRect().width>0&&i.complete&&!i.naturalWidth).map(i=>i.src),fonts:[...document.fonts].filter(f=>f.status==='error').map(f=>f.family)}));assert.equal(layout.scrollWidth,layout.width,'no horizontal overflow');assert.deepEqual(layout.broken,[],'all rendered images loaded');assert.deepEqual(layout.fonts,[]);
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();const violations=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
    assert.deepEqual(violations,[],'no automatic WCAG A/AA violations in exercised state');
    if([390,768,1440].includes(width)){
     await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);await page.screenshot({path:`${output}/${name}-hero-${width}.png`});
     await page.locator('.featured-projects').scrollIntoViewIfNeeded();await page.waitForTimeout(350);await page.screenshot({path:`${output}/${name}-featured-${width}.png`});
     await page.locator('#caseCapture img').scrollIntoViewIfNeeded();await page.locator('#caseCapture img').evaluate(img=>img.decode());await page.waitForTimeout(350);await page.screenshot({path:`${output}/${name}-stage-${width}.png`});
     await page.locator('#sobre .about-photo').scrollIntoViewIfNeeded();await page.waitForTimeout(350);await page.screenshot({path:`${output}/${name}-founder-${width}.png`});
    }
    await page.locator('[data-footer-cookie-settings]').click();await page.getByRole('button',{name:'Personalizar',exact:true}).click();assert.equal(await page.locator('[data-consent-analytics]').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#otConsentPreferences').isVisible(),false);assert.equal(await page.getByRole('button',{name:'Personalizar',exact:true}).evaluate(e=>e===document.activeElement),true);await reject(page);assert.equal(await page.locator('[data-footer-cookie-settings]').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('Tab');await page.locator('[data-footer-cookie-settings]').focus();const focus=await page.locator('[data-footer-cookie-settings]').evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));assert.notEqual(focus.style,'none');
    const environmentWarnings=errors.filter(e=>name==='firefox'&&/Cookie ._(fbp|fbc). has been rejected for invalid domain/.test(e));
    assert.deepEqual(errors.filter(e=>!environmentWarnings.includes(e)),[],`${name}/${width} relevant console`);assert.deepEqual(missing,[],`${name}/${width} missing files`);runs.push({width,height,layout,consentHeight:panel.height,violations,errors,environmentWarnings,missing});await context.close();await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));console.log(`${name} ${width}: PASS`);
   }
   // Short mobile viewport: expanded choices scroll inside the panel and focused input stays visible.
   const short=await browser.newContext({viewport:{width:360,height:640}});await transport(short);const sp=await short.newPage();await ready(sp);await sp.locator('[data-consent-customize]').click();
   const focusBounds=await sp.locator('[data-consent-analytics]').evaluate(e=>({input:e.getBoundingClientRect().toJSON(),panel:document.querySelector('#otConsent').getBoundingClientRect().toJSON()}));
   assert.ok(focusBounds.input.top>=focusBounds.panel.top&&focusBounds.input.bottom<=focusBounds.panel.bottom,'short mobile focused category visible');
   await sp.locator('[data-consent-save]').click();await short.close();
   // Reduced motion changes at runtime must cancel the showroom animation.
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await transport(context);const page=await context.newPage();await ready(page);await reject(page);await page.locator('#project-tab-acai').click();await selected(page,'acai');assert.equal(await page.locator('#projectStage').evaluate(e=>e.getAnimations().length),0);assert.equal(await page.locator('.earth-journey__canvas').evaluate(e=>getComputedStyle(e).display),'none');await context.close();
  }finally{await browser.close();}
 }
 const browser=await pw.chromium.launch();try{
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});await transport(nojs);const fallback=await nojs.newPage();await fallback.goto(base,{waitUntil:'networkidle'});assert.equal(await fallback.locator('.featured-project').count(),3);assert.equal(await fallback.locator('#projectStage h3').innerText(),projects.kl.title);assert.equal(await fallback.locator('[data-featured-project=acai]').getAttribute('href'),projects.acai.link);await nojs.close();
  for(const choice of ['reject','accept','analytics','marketing','neither']){
   const context=await browser.newContext({viewport:{width:390,height:844}});await transport(context);const tags=[];context.on('request',r=>{if(/googletagmanager|connect\.facebook/.test(r.url()))tags.push(r.url());});const page=await context.newPage();await ready(page);assert.deepEqual(tags,[],'no tag before explicit choice');
   if(choice==='accept')await page.locator('[data-consent-accept]').click();else if(choice==='reject')await page.locator('[data-consent-reject]').click();else{await page.locator('[data-consent-customize]').click();if(choice==='analytics')await page.locator('[data-consent-analytics]').check();if(choice==='marketing')await page.locator('[data-consent-marketing]').check();await page.locator('[data-consent-save]').click();}
   await page.locator('#otConsent').waitFor({state:'hidden'});await page.waitForTimeout(150);const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('ot_consent_preferences_v2')));assert.equal(stored.analytics,['analytics','accept'].includes(choice)?'granted':'denied');assert.equal(stored.marketing,['marketing','accept'].includes(choice)?'granted':'denied');assert.equal(tags.some(t=>t.includes('googletagmanager')),stored.analytics==='granted');assert.equal(tags.some(t=>t.includes('connect.facebook')),stored.marketing==='granted');
   const count=tags.length;await page.locator('[data-footer-cookie-settings]').click();await page.locator('[data-consent-customize]').click();assert.equal(await page.locator('[data-consent-analytics]').isChecked(),stored.analytics==='granted');assert.equal(await page.locator('[data-consent-marketing]').isChecked(),stored.marketing==='granted');await page.locator('[data-consent-reject]').click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ot_consent_preferences_v2'))),{analytics:'denied',marketing:'denied'});await page.reload({waitUntil:'networkidle'});assert.equal(tags.length,count,'revoked preferences do not reload tags');report.privacy.push({choice,tags,stored,passed:true});await context.close();
  }
  for(const route of ['/criacao-de-sites-valinhos/','/criacao-de-sites-campinas/','/diagnostico-digital/','/produtos/','/privacidade/','/cookies/']){const context=await browser.newContext();await transport(context);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const response=await page.goto(base+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.locator('#otConsent.is-visible').waitFor();await page.locator('[data-consent-customize]').click();await page.locator('[data-consent-save]').click();assert.deepEqual(errors,[]);report.pages.push({route,passed:true});await context.close();}
 }finally{await browser.close();}
 for(const name of (process.env.OT_QA_ENGINES||'chromium,firefox,webkit').split(','))if(!report.engines[name]?.unavailable)assert.equal(report.engines[name]?.runs?.length,(process.env.OT_QA_WIDTHS?.split(',').length||7));if(process.env.OT_QA_REQUIRE_ENGINES==='1')for(const name of ['firefox','webkit'])assert.ok(report.engines[name]?.runs?.length===7,`${name} required`);
 report.passed=true;
}catch(e){report.passed=false;report.failure=e.stack;throw e;}finally{await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));server.close();}
