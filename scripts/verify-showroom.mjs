// Gate B: actual home, canonical copy, complete-home regression and equivalent performance.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {media,order} from '../assets/js/ot-project-showroom.mjs';
const initial='kl';
const playwright=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const dir='';
const output=process.env.OT_QA_OUTPUT||'/tmp/ot-premium-v2-qa';
await mkdir(output,{recursive:true});
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const server=createServer(async(req,res)=>{
  try{
    let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+'/')&&file!==root)throw Error('Outside root');
    if((await stat(file)).isDirectory())file+='/index.html';
    res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
  }catch{res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const preview=base+'/';
const baselineRoot=process.env.OT_BASELINE_DIR;
let baselineServer,baselineDirectory;
async function closeBaseline(){baselineServer?.close();if(baselineDirectory)execFileSync('git',['worktree','remove','--force',baselineDirectory],{cwd:root});}

const report={baseCommit:process.env.OT_BASELINE_COMMIT||'cef32459b58c3ce779e526a4e6ef7b76e74f8c67',browserPath:'Browser plugin not available; existing Playwright runner',scenarios:[],responsive:[],links:[],performance:[],limitations:['Engine simulation on Linux; no physical Safari/iPhone, real speaker output or WhatsApp send.','Real consent and analytics implementation exercised against intercepted tag/network destinations.','Performance compares the complete baseline and integrated home under equivalent lab conditions; not field INP.']};
const source=await readFile(resolve(root,'index.html'),'utf8');
const baselineSource=execFileSync('git',['show',report.baseCommit+':index.html'],{cwd:root,encoding:'utf8'});
const projects=JSON.parse(source.match(/const projects=(\{[\s\S]*?\n\});/)[1]);
assert.deepEqual(projects,JSON.parse(baselineSource.match(/const projects=(\{[\s\S]*?\n\});/)[1]),'Approved project catalog is unchanged.');
const changed=execFileSync('git',['diff','--name-only',report.baseCommit],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.equal(initial,'kl');assert.equal(order.length,6);
// V2.1 owns only the cosmic atmosphere; protected Earth, commercial markup and audio remain byte-identical.
for(const id of ['inicio','solucoes','metodo','sobre','produtos','faq','contato']){
  const section=new RegExp('<section[^>]+id="'+id+'"[\\s\\S]*?</section>');
  assert.equal(source.match(section)?.[0],baselineSource.match(section)?.[0],id+' markup preserved');
}
for(const path of ['assets/js/ot-analytics-core.js','assets/js/ot-earth-journey.js','assets/js/ot-earth-spin.js','assets/js/ot-solution-configurator.js','assets/js/ot-mobile-v3.js','assets/js/ot-v2.js','assets/css/ot-solution-case.css','DESIGN.md']){
  assert.equal(await readFile(resolve(root,path),'utf8'),execFileSync('git',['show',report.baseCommit+':'+path],{cwd:root,encoding:'utf8'}),path+' preserved');
}
const stripRenderer=text=>text.replace(/    function renderProjectMedia\([\s\S]*?(?=    const mobileLinks=)/,'').replace(/    \/\/ Compatibility entry point[^\n]*\n    function renderProject[^\n]*\n\n/,'');
const mainScript=text=>text.slice(text.indexOf('    const solutions='),text.indexOf('  </script>',text.indexOf('    const solutions=')));
assert.equal(stripRenderer(mainScript(source)),stripRenderer(mainScript(baselineSource)),'All inline solution, navigation, audio and planet code preserved');
const fonts=new Map();
async function configure(context,{baseline=false}={}){
  await context.addInitScript(()=>{
    localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
    window.__qaMetrics={lcp:0,cls:0,interactionDuration:0,layoutShifts:[]};
    let clsSessionStart=0,lastShift=0,clsSessionValue=0;
    for(const type of ['largest-contentful-paint','layout-shift','event']){
      if(!PerformanceObserver.supportedEntryTypes.includes(type))continue;
      new PerformanceObserver(list=>{for(const entry of list.getEntries()){
        if(type==='largest-contentful-paint')window.__qaMetrics.lcp=entry.startTime;
        if(type==='layout-shift'&&!entry.hadRecentInput){
          if(entry.startTime-lastShift>1000||entry.startTime-clsSessionStart>5000){clsSessionStart=entry.startTime;clsSessionValue=0;}
          clsSessionValue+=entry.value;lastShift=entry.startTime;
          window.__qaMetrics.cls=Math.max(window.__qaMetrics.cls,clsSessionValue);
          window.__qaMetrics.layoutShifts.push({value:entry.value,time:Math.round(entry.startTime),sources:entry.sources.map(source=>({node:source.node?.id||source.node?.className||source.node?.nodeName,previous:source.previousRect.toJSON(),current:source.currentRect.toJSON()}))});
        }
        if(type==='event'&&entry.interactionId)window.__qaMetrics.interactionDuration=Math.max(window.__qaMetrics.interactionDuration,entry.duration);
      }}).observe({type,buffered:true,...type==='event'?{durationThreshold:16}:{}});
    }
  });
  if(process.env.OT_QA_PROXY_FONTS==='1')await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{
    const url=route.request().url();
    if(!fonts.has(url))fonts.set(url,(async()=>{const r=await fetch(url,{headers:{'User-Agent':route.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});return {body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')}})());
    await route.fulfill({...await fonts.get(url),headers:{'access-control-allow-origin':'*','timing-allow-origin':'*'}});
  });
  await context.route(/https:\/\/(wa\.me|acaidodudu\.com\.br|kltransporteexpress\.com\.br|adegasaomarcos\.com\.br|cintiaalmeidaadvocacia\.com\.br|armazemripamonti\.com\.br|olegariotech-site\.github\.io|www\.google\.com)\//,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>QA link destination</title>'}));
}
// Offscreen lazy thumbnails need not load until the rail exposes them (WebKit).
// Decode eager media and already-loaded images; each selected thumbnail is checked below.
async function decode(page){await page.locator('img').evaluateAll(images=>Promise.all(images.filter(image=>image.loading!=='lazy'||image.complete).map(image=>image.decode())))}
async function overflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'No document horizontal overflow');}
async function select(page,key,touch=false){
  const tab=page.locator(`[role=tab][data-project="${key}"]`);
  if(touch)await tab.tap();else await tab.click();
  await page.waitForFunction(k=>document.querySelector('#projectStage').dataset.selectedProject===k&&!document.querySelector('#projectStage').hasAttribute('aria-busy'),key);
  await decode(page);
  await page.waitForTimeout(280);
  await tab.locator('img').evaluate(image=>image.decode());
  assert.equal(await page.locator('#projetos [role=tab][aria-selected=true]').count(),1);
  assert.equal(await page.locator(`[data-project="${key}"][role=tab]`).getAttribute('aria-selected'),'true');
  assert.ok(await tab.evaluate(el=>{const a=el.getBoundingClientRect(),r=el.parentElement.getBoundingClientRect();return a.left>=r.left-1&&a.right<=r.right+1}),'Active project is completely visible in its manual index');
}
async function checkCase(page,key,width){
  const p=projects[key];
  assert.equal(await page.locator('.case-copy h3').innerText(),p.title);
  assert.equal(await page.locator('.case-description').innerText(),p.text);
  assert.equal(await page.locator('.case-segment').innerText(),p.segment);
  assert.deepEqual(await page.locator('.case-deliverables li').allTextContents(),p.points);
  if(p.testimonial){
    assert.equal(await page.locator('.case-testimonial blockquote').innerText(),`“${p.testimonial.quote}”`);
    assert.equal(await page.locator('.case-testimonial figcaption strong').innerText(),p.testimonial.author);
    assert.equal(await page.locator('.case-testimonial a').getAttribute('href'),p.testimonial.source);
  }else assert.equal(await page.locator('.case-testimonial').count(),0);
  assert.match(await page.locator('.case-status').innerText(),key==='navalha'?/CONCEITO \/ DEMONSTRAÇÃO OT/:/PROJETO REAL · NO AR/);
  const details=page.locator('.case-story');await details.locator('summary').click();
  assert.equal(await details.getAttribute('open'),'');
  assert.deepEqual(await details.locator('dd').allTextContents(),[p.challenge,p.strategy]);
  assert.equal(await details.locator('.canonical-label').innerText(),p.label);
  await details.locator('summary').click();
  const primary=page.locator('[data-project-link]');
  assert.equal(await primary.getAttribute('href'),p.link);assert.equal((await primary.innerText()).replace('↗','').trim(),p.cta);
  const lead=page.locator('.case-actions [data-generate-lead]');
  const url=new URL(await lead.getAttribute('href'));
  assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/5511912459144');
  assert.equal(url.searchParams.get('text'),`Olá, OT! Vi o case ${p.title} no site e quero entender uma estrutura parecida para o meu negócio.`);
  for(const anchor of [primary,lead]){assert.equal(await anchor.getAttribute('target'),'_blank');assert.equal(await anchor.getAttribute('rel'),'noopener noreferrer');assert.ok((await anchor.boundingBox()).height>=48);}
  const screen=page.locator('.case-screen img');
  const actual=await screen.evaluate(img=>({src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight,box:img.getBoundingClientRect().toJSON()}));
  assert.ok(actual.width>0&&actual.height>0);
  assert.ok(Math.abs(actual.box.width/actual.box.height-actual.width/actual.height)<.01,'Screen image retains its native ratio');
  if(key!=='navalha')assert.ok(actual.src.endsWith(width<=600?media[key].mobile.replace(/^\.\//,''):media[key].desktop.replace(/^\.\//,'')));
  assert.equal(await page.locator('#projectStage [data-project-link]').count(),1,'Published-project CTA is unique');
  assert.equal(await page.locator('#projectStage [data-generate-lead]').count(),1,'Contact CTA is unique');
  const device=width<=600?'mobile':'desktop';
  assert.equal(await page.locator('.case-screen').getAttribute('data-view'),device);
  if(key!=='navalha'){
    assert.equal(await page.locator(`button[data-view=${device}]`).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('button[data-view][aria-pressed=true]').count(),1);
  }
  if(width<=600){
    const imageBox=await page.locator('.case-media').boundingBox(),copyBox=await page.locator('.case-copy').boundingBox(),action=await primary.boundingBox();
    assert.ok(copyBox.y+copyBox.height<=imageBox.y,'Mobile identifies the client and delivery before the image');
    assert.ok(action.y+action.height<=imageBox.y,'Published project is accessible before the image');
    if(key!=='navalha'){
      const toggle=page.locator('[data-expand]'),picture=page.locator('#caseCapture');
      const collapsed=(await picture.boundingBox()).height;
      assert.ok(collapsed<=320,'Initial mobile preview has a bounded height');
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      assert.equal(await toggle.getAttribute('aria-controls'),'caseCapture');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'),'true');
      const full=(await picture.boundingBox()).height;
      assert.ok(full>collapsed,'Full capture can be inspected');
      assert.ok(Math.abs(full-(await screen.boundingBox()).height)<1,'Expanded capture is complete');
      await toggle.focus();await page.keyboard.press('Space');
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
      assert.equal(await page.locator('#projectStage [data-project-link]').count(),1);
    }
  }
  await overflow(page);
}
async function links(page){
  for(const key of order){
    await select(page,key);
    for(const selector of ['[data-project-link]','.case-actions [data-generate-lead]']){
      const link=page.locator(selector),expected=await link.getAttribute('href');
      const [popup]=await Promise.all([page.waitForEvent('popup'),link.click()]);
      await popup.waitForLoadState();assert.equal(popup.url(),expected);assert.equal(await popup.evaluate(()=>window.opener),null);await popup.close();
      report.links.push({key,type:selector==='[data-project-link]'?'published project':'contextual WhatsApp',url:expected,passed:true});
    }
  }
}
async function ready(page){await page.waitForFunction(()=>window.OTProjectShowroom&&window.OTAnalytics&&document.querySelector('#prova')&&document.querySelector('#metodo .method-card')?.textContent.includes('Diagnóstico'));await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.activeElement?.blur()});}
async function scenario(browser,engine,width,height,{reduced=false}={}){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference',hasTouch:width<=600});
  await configure(context);
  const page=await context.newPage(),errors=[],notFound=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()===404)notFound.push(r.url())});page.on('request',r=>{if(!r.url().startsWith(base)&&!/https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url()))external.push(r.url())});
  assert.equal((await page.goto(preview,{waitUntil:'networkidle'})).status(),200);await ready(page);await page.evaluate(()=>document.fonts.ready);await decode(page);
  assert.match(await page.title(),/Olegario Tech/);assert.equal(page.url(),preview);
  assert.equal(await page.locator('#projetos h2').innerText(),'Prova antes da promessa.');
  assert.equal(await page.locator('#projetos [role=tab]').count(),6);assert.equal(await page.locator('.case-rail [role=tab]').count(),5);
  assert.equal(await page.locator('#projectStage').getAttribute('data-selected-project'),initial);
  if(width<=600){
    const selectedBox=await page.locator(`[role=tab][data-project="${initial}"]`).boundingBox(),railBox=await page.locator('.case-rail').boundingBox();
    assert.ok(selectedBox.x>=railBox.x&&selectedBox.x+selectedBox.width<=railBox.x+railBox.width,'The initial selected project is fully visible in the mobile rail');
  }
  assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(),0);await overflow(page);
  const name=`${engine}-${width}x${height}${reduced?'-reduced':''}`;
  await captureHome(page,`${name}-home`);await globalRegression(page,width,reduced);await select(page,initial);
  await passage(page,`${name}-passage`);
  await captureSection(page,`${name}-${initial}`);
  await page.evaluate(()=>scrollTo({top:document.getElementById('projetos').offsetTop,behavior:'instant'}));
  await page.screenshot({path:`${output}/${name}-viewport.png`});
  for(const key of order){
    await select(page,key,width<=600);await checkCase(page,key,width);
    if(key==='acai'||key==='ripamonti'||(key==='advocacia'&&width===1440))await captureSection(page,`${name}-${key}`);
    if(key!=='navalha'){
      const copy=await page.locator('.case-copy').innerHTML();
      await page.locator('button[data-kind=brand]').click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.kind==='brand');await decode(page);
      assert.equal(await page.locator('.case-copy').innerHTML(),copy,'View changes preserve copy and live actions');await overflow(page);
      await page.locator('button[data-kind=website]').click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.kind==='website');await decode(page);
      if(width>600){
        await page.locator('button[data-view=mobile]').click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.view==='mobile');await decode(page);
        assert.ok((await page.locator('.case-screen img').getAttribute('src')).endsWith(media[key].mobile.replace(/^\.\//,'')));
        await page.locator('button[data-view=desktop]').click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.view==='desktop');await decode(page);
      }
    }
  }
  // A rapid burst must settle on the final request without stale images/copy or lost tab focus.
  await page.evaluate(()=>['kl','ripamonti','acai','advocacia','adega','ripamonti'].forEach(key=>document.querySelector(`[role=tab][data-project="${key}"]`).click()));
  await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.selectedProject==='ripamonti'&&!document.querySelector('#projectStage').hasAttribute('aria-busy'));await decode(page);
  await page.evaluate(()=>window.__qaNode=document.querySelector('.case-copy'));
  await select(page,'ripamonti');assert.equal(await page.evaluate(()=>window.__qaNode===document.querySelector('.case-copy')),true);
  await page.locator('[role=tab][data-project=ripamonti]').focus();
  await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.selectedProject==='acai');
  await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.selectedProject==='kl');
  await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.selectedProject==='navalha');
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.selectedProject==='ripamonti');await decode(page);
  assert.equal(await page.locator('[data-project=ripamonti][role=tab]').evaluate(el=>el===document.activeElement),true);
  assert.equal(await page.locator('[data-project=ripamonti][role=tab]').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  await captureSection(page,`${name}-focus`);
  await page.keyboard.press('Tab');assert.equal(await page.locator('#projectStage').evaluate(el=>el===document.activeElement),true);
  if(reduced){assert.equal(await page.locator('#projetos').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);assert.equal(await page.locator('.case-tab').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');}
  if(width<=600){assert.match(await page.locator('.case-rail').evaluate(el=>getComputedStyle(el).scrollSnapType),/^x(?: proximity)?$/);assert.ok(await page.locator('.case-rail').evaluate(el=>el.scrollWidth>el.clientWidth));}
  await overflow(page);
  assert.deepEqual(errors,[]);assert.deepEqual(notFound,[]);assert.deepEqual(external,[],'Denied consent sends no analytics requests; canonical external fonts remain allowed.');
  report.scenarios.push({engine,width,height,reduced,passed:true,errors,notFound,externalRequests:external.length,labInteractionMaxMs:await page.evaluate(()=>window.__qaMetrics.interactionDuration),note:'Event Timing maximum observed duration in lab; not a field INP measurement.'});
  if(engine==='chromium'&&width===1440&&!reduced)await links(page);
  await context.close();console.log('PASS',name);
  if(engine==='chromium'&&!reduced)await baselineCaptures(browser,width,height);
}
async function responsive(browser,engine){
  const context=await browser.newContext({viewport:{width:1440,height:900}});await configure(context);
  // Slow image delivery exposes races between async view changes and breakpoints.
  await context.route(/\/assets\/.*\.webp$/,async route=>{await new Promise(r=>setTimeout(r,120));await route.continue()});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(preview);await ready(page);await decode(page);
  async function state(width,key=initial,kind='website'){
    const device=width<=600?'mobile':'desktop',set=kind==='brand'?media[key].brand:media[key];
    await page.waitForFunction(({device,key,kind,expectedSource})=>{
      const stage=document.querySelector('#projectStage'),screen=stage.querySelector('.case-screen');
      const image=screen.querySelector('img');
      const devices=stage.querySelector('.device-switch'),expand=stage.querySelector('[data-expand]');
      // A manually selected mobile asset can already match before matchMedia fires.
      // Await the complete responsive commit, not only the image's device label.
      const controlsReady=key==='navalha'||(
        devices.hidden===(device==='mobile')&&expand.hidden===!(device==='mobile'&&kind==='website')&&
        expand.getAttribute('aria-expanded')==='false'&&
        stage.querySelector(`button[data-view="${device}"]`).getAttribute('aria-pressed')==='true'&&
        stage.querySelectorAll('button[data-view][aria-pressed=true]').length===1
      );
      return stage.dataset.selectedProject===key&&!stage.hasAttribute('aria-busy')&&screen.dataset.view===device&&screen.dataset.kind===kind&&controlsReady&&image.complete&&image.naturalWidth>0&&image.currentSrc.endsWith(expectedSource);
    },{device,key,kind,expectedSource:set[device].replace(/^\.\//,'')});await decode(page);
    const src=await page.locator('.case-screen img').evaluate(img=>img.currentSrc);
    assert.ok(src.endsWith(set[device].replace(/^\.\//,'')),'Breakpoint uses the current device asset');
    if(key!=='navalha'){
      assert.equal(await page.locator(`button[data-view=${device}]`).getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('button[data-view][aria-pressed=true]').count(),1);
      assert.equal(await page.locator('.device-switch').isVisible(),width>600);
      assert.equal(await page.locator('[data-expand]').isVisible(),width<=600&&kind==='website');
      assert.equal(await page.locator('[data-expand]').getAttribute('aria-expanded'),'false');
    }
    await overflow(page);
  }
  for(const key of order){
    await page.setViewportSize({width:1440,height:900});await select(page,key);
    await state(1440,key,key==='navalha'?'brand':'website');
    if(key!=='navalha'){
      await page.locator('button[data-view=mobile]').click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.view==='mobile');
      await page.locator('button[data-view=mobile]').focus();
    }
    await page.setViewportSize({width:390,height:844});await state(390,key,key==='navalha'?'brand':'website');
    if(key!=='navalha'){
      assert.equal(await page.locator('button[data-kind=website]').evaluate(el=>el===document.activeElement),true,'Focus transfers before hiding device controls');
      await page.locator('[data-expand]').focus();await page.locator('[data-expand]').click();assert.equal(await page.locator('[data-expand]').getAttribute('aria-expanded'),'true');
    }
    await page.setViewportSize({width:601,height:900});await state(601,key,key==='navalha'?'brand':'website');
    if(key!=='navalha')assert.equal(await page.locator('button[data-kind=website]').evaluate(el=>el===document.activeElement),true,'Focus transfers before hiding expansion');
    await page.setViewportSize({width:600,height:900});await state(600,key,key==='navalha'?'brand':'website');
    if(key!=='navalha'){
      await page.locator('button[data-kind=brand]').click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.kind==='brand');
      await page.setViewportSize({width:768,height:1024});await state(768,key,'brand');
      await page.setViewportSize({width:430,height:932});await state(430,key,'brand');
    }
    // The rail must also follow a resize that does not cross its media breakpoint.
    await page.setViewportSize({width:390,height:844});await state(390,key,'brand');
    await page.setViewportSize({width:430,height:932});await state(430,key,'brand');
    await page.waitForFunction(()=>{const tab=document.querySelector('[role=tab][aria-selected=true]'),a=tab.getBoundingClientRect(),r=tab.parentElement.getBoundingClientRect();return a.left>=r.left-1&&a.right<=r.right+1});
  }
  await page.setViewportSize({width:1440,height:900});await page.reload();await state(1440);
  await page.evaluate(()=>document.querySelector('button[data-view=mobile]').click());
  await page.setViewportSize({width:390,height:844});await state(390);
  await page.setViewportSize({width:1440,height:900});await state(1440);
  await page.evaluate(()=>document.querySelector('[role=tab][data-project=acai]').click());
  await page.setViewportSize({width:390,height:844});await state(390,'acai');
  await captureSection(page,`${engine}-responsive-final`);
  assert.deepEqual(errors,[]);await context.close();
  report.responsive.push({engine,passed:true,projects:order.length,widths:[1440,390,601,600,768,430],delayedImagesMs:120,checks:['device source','unique aria-pressed','hidden controls','focus transfer','expansion reset','view and project races']});
  console.log('PASS',engine+'-responsive-state');
}
async function noJS(browser){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();await page.goto(preview);await page.locator('#projetos').scrollIntoViewIfNeeded();assert.equal(await page.locator('.case-copy h3').innerText(),projects[initial].title);assert.equal(await page.locator('.case-actions [data-generate-lead]').count(),1);await decode(page);await overflow(page);assert.equal(await page.locator('[data-expand]').isVisible(),false);assert.ok(Math.abs((await page.locator('#caseCapture').boundingBox()).height-(await page.locator('.case-screen img').boundingBox()).height)<1,'No-JS keeps the full capture available');await context.close();report.noJavaScriptInitialCase=true;
}
async function zoom(browser){
  const baseline=await browser.newContext({viewport:{width:1440,height:900}});await configure(baseline);
  const beforePage=await baseline.newPage();await beforePage.goto((await baselineURL())+'/');
  await beforePage.waitForFunction(()=>window.OTAnalytics&&document.querySelector('#prova'));
  await beforePage.evaluate(()=>document.fonts.ready);await beforePage.evaluate(()=>document.documentElement.style.zoom='200%');
  const baselineOverflow=await beforePage.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth));await baseline.close();
  const context=await browser.newContext({viewport:{width:1440,height:900}});await configure(context);const page=await context.newPage();await page.goto(preview);await ready(page);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.documentElement.style.zoom='200%');
  let integratedOverflow=0;
  for(const key of order){await select(page,key);const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth));integratedOverflow=Math.max(integratedOverflow,overflow);assert.ok(overflow<=baselineOverflow,'CSS zoom does not add overflow beyond the unchanged header/footer baseline');const title=await page.locator('.case-copy h3').boundingBox();assert.ok(title.x>=0&&title.x+title.width<=1440)}
  await page.screenshot({path:`${output}/chromium-zoom-200.png`,fullPage:true});await context.close();report.cssZoom200={baselineOverflow,integratedOverflow,noAdditionalOverflow:true};report.limitations.push('CSS zoom 200% inherits baseline header/footer overflow; no added overflow from the showroom. Actual seven responsive viewports have zero overflow. CSS zoom does not emulate native browser zoom or Safari pinch.');
}
async function captureSection(page,name){
  // These fixed controls are included in complete-home and passage captures.
  // Hide them only for an unobstructed, equal section-to-section comparison.
  const style=await page.addStyleTag({content:'.topbar,.desktop-rail,.mobile-header,.mobile-nav,.experience-controls,.skip-link,.scroll-progress{display:none!important}'});
  try{await page.locator('#projetos').screenshot({path:`${output}/${name}.png`,animations:'disabled'});}
  finally{await style.evaluate(el=>el.remove())}
}
async function captureHome(page,name){
  await page.evaluate(()=>document.querySelectorAll('img').forEach(img=>img.loading='eager'));
  for(const section of await page.locator('main>section').all()){await section.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(25);}
  await decode(page);await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);
  await page.screenshot({path:`${output}/${name}.png`,fullPage:true,animations:'disabled'});
}
async function passage(page,name){
  await page.evaluate(()=>scrollTo({top:Math.max(0,document.getElementById('projetos').getBoundingClientRect().top+scrollY-innerHeight*.45),behavior:'instant'}));
  await page.waitForTimeout(300);await page.screenshot({path:`${output}/${name}.png`,animations:'disabled'});
}
async function globalRegression(page,width,reduced){
  assert.deepEqual(await page.locator('#inicio h1>span').allTextContents(),['Sites que','geram','negócios.']);
  assert.equal(await page.locator('#prova [data-proof-case]').count(),5);
  const control=page.locator(width>900?'.desktop-audio-toggle':'.mobile-audio-toggle');
  assert.ok(await control.isVisible());await control.click();
  await page.waitForFunction(()=>{const a=document.getElementById('backgroundAudio');return !a.paused&&a.currentTime>.1});
  assert.equal(await control.getAttribute('aria-pressed'),'true');
  assert.ok(await page.locator('#backgroundAudio').evaluate(a=>a.loop&&a.volume>0&&a.volume<1&&a.currentSrc.endsWith('/assets/audio/background.mp3')));
  await control.click();assert.ok(await page.locator('#backgroundAudio').evaluate(a=>a.paused&&a.muted));
  if(reduced)assert.equal(await page.locator('.earth-journey__canvas').evaluate(el=>getComputedStyle(el).display),'none');
  else{
    await page.waitForFunction(()=>!!document.getElementById('earthJourney').dataset.renderer);
    assert.ok(['webgl','canvas2d'].includes(await page.locator('#earthJourney').getAttribute('data-renderer')));
    // The timeline is based on HERO height, which need not equal the viewport.
    // Wait for its scroll commit instead of assuming a fixed GPU/frame duration.
    await page.evaluate(()=>{const hero=document.getElementById('inicio'),box=hero.getBoundingClientRect();scrollTo({top:scrollY+box.top+box.height*.72,behavior:'instant'})});
    if(width>900)await page.waitForFunction(()=>Number(document.getElementById('earthJourney').dataset.morph)>.1);
    else await page.waitForFunction(()=>Number(document.getElementById('earthJourney').dataset.morph)===0);
    const morph=Number(await page.locator('#earthJourney').getAttribute('data-morph'));
    if(width>900)assert.ok(morph>.1);else assert.equal(morph,0);
  }
  for(const key of ['presenca','oferta','digital']){
    await page.locator(`.choice-tab[data-solution=${key}]`).click();
    await page.waitForFunction(key=>document.getElementById('solutionStage').dataset.route===key&&document.querySelectorAll('.solution-blueprint__node').length===(key==='digital'?4:3),key);
    assert.equal(await page.locator('.solution-blueprint__node').count(),key==='digital'?4:3);
    const node=page.locator('.solution-blueprint__node').last();await node.click();assert.equal(await node.getAttribute('aria-pressed'),'true');
  }
  assert.equal(await page.locator('.solution-case h4').innerText(),'Armazém Ripamonti');
  assert.equal(await page.locator('.solution-case blockquote').innerText(),'“Exatamente como eu queria. Trabalho perfeito, estou muito satisfeito.”');
  const wa=new URL(await page.locator('#solutionContent [data-generate-lead]').getAttribute('href'));
  assert.equal(wa.searchParams.get('text'),'Olá, OT! Vi o projeto Armazém Ripamonti na Solução 03 e quero avaliar uma estrutura semelhante para minha empresa.');
  await page.locator('.choice-tab[data-solution=presenca]').click();
  await page.locator(width>900?'.top-nav a[href="#metodo"]':'.mobile-nav a[href="#metodo"]').click();
  await page.waitForFunction(()=>document.querySelector('#metodo').getBoundingClientRect().top<innerHeight/2);
  assert.equal(await page.locator('#metodo .method-card').count(),4);assert.equal(await page.locator('.ot-method-build').count(),1);
  await page.waitForFunction(selector=>document.querySelector(selector).getAttribute('aria-current')==='location',width>900?'.top-nav a[href="#metodo"]':'.mobile-nav a[href="#metodo"]');
  assert.equal(await page.locator(width>900?'.top-nav a[href="#metodo"]':'.mobile-nav a[href="#metodo"]').getAttribute('aria-current'),'location');
  await page.locator('.faq-item summary').first().click();assert.equal(await page.locator('.faq-item').first().getAttribute('open'),'');await page.locator('.faq-item summary').first().click();
  await page.locator(width>900?'.top-nav a[href="#inicio"]':'.mobile-header .brand').click();await page.waitForFunction(()=>document.getElementById('inicio').getBoundingClientRect().top>=-1);
  assert.ok((await page.locator('#inicio').boundingBox()).y>=-1);
  assert.ok(await page.locator('footer').innerText());await overflow(page);
}
async function tracking(browser,engine){
  for(const granted of [false,true]){
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await configure(context);
    if(granted)await context.addInitScript(()=>localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'granted',marketing:'granted'})));
    await context.route(/https:\/\/(www\.googletagmanager\.com|connect\.facebook\.net)\//,route=>route.fulfill({contentType:'text/javascript',body:''}));
    const page=await context.newPage();await page.goto(preview);await ready(page);
    const count=name=>page.evaluate(name=>(window.dataLayer||[]).filter(e=>e[0]==='event'&&e[1]===name).length,name);
    const before=await count('select_project');await select(page,'acai');assert.equal(await count('select_project')-before,granted?1:0);
    const current=await count('select_project');await page.locator('button[data-kind=brand]').click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.kind==='brand');
    await page.locator('button[data-kind=website]').click();await page.waitForFunction(()=>document.querySelector('.case-screen').dataset.kind==='website');
    await page.locator('[data-expand]').click();await page.locator('[data-expand]').click();assert.equal(await count('select_project'),current,'View/expand controls do not emit project selections');
    for(const [selector,event] of [['[data-project-link]','click_projeto'],['.case-actions [data-generate-lead]','generate_lead']]){
      const n=await count(event),waCount=await count('click_whatsapp');const [popup]=await Promise.all([page.waitForEvent('popup'),page.locator(selector).click()]);await popup.waitForLoadState();await popup.close();
      assert.equal(await count(event)-n,granted?1:0,'One event per authorized click: '+event);
      if(event==='generate_lead')assert.equal(await count('click_whatsapp')-waCount,granted?1:0);
    }
    const proofCount=await count('click_proof_case'),selectionCount=await count('select_project');await page.locator('#prova [data-project=ripamonti]').click();await page.waitForFunction(()=>document.getElementById('projectStage').dataset.selectedProject==='ripamonti'&&!document.getElementById('projectStage').hasAttribute('aria-busy'));
    assert.equal(await count('click_proof_case')-proofCount,granted?1:0);assert.equal(await count('select_project')-selectionCount,granted?1:0);
    if(granted){
      // The approved home exposes preference management in its existing footer.
      await page.locator('[data-footer-cookie-settings]').click();
      await page.getByRole('button',{name:'Recusar opcionais',exact:true}).click();
      const n=await count('select_project');await select(page,'kl');assert.equal(await count('select_project'),n,'Revocation suppresses further events');
    }
    await writeFile(`${output}/${engine}-accessible-case-${granted}.txt`,await page.locator('#projectStage').ariaSnapshot());
    await context.close();
  }
  report.analytics=report.analytics||[];report.analytics.push({engine,denied:true,granted:true,revoked:true,uniqueLead:true,uniqueProjectClick:true,controlsEmitNoSelection:true,proofRail:true});console.log('PASS',engine+'-consent-and-analytics');
}
async function baselineURL(){
  if(baselineServer)return `http://127.0.0.1:${baselineServer.address().port}`;
  let dir=baselineRoot;
  if(!dir){baselineDirectory=resolve(await mkdtemp(resolve(tmpdir(),'ot-gate-b-')),'baseline');execFileSync('git',['worktree','add','--detach',baselineDirectory,report.baseCommit],{cwd:root});dir=baselineDirectory;}
  baselineServer=createServer(async(req,res)=>{try{let file=resolve(dir,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(dir+'/')&&file!==dir)throw Error('Outside baseline');if((await stat(file)).isDirectory())file+='/index.html';res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end()}});
  await new Promise(r=>baselineServer.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${baselineServer.address().port}`;
}
async function baselineCaptures(browser,width,height){
  const url=await baselineURL(),context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});await configure(context,{baseline:true});
  const page=await context.newPage();await page.goto(url+'/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.OTAnalytics&&document.querySelector('#prova'));await page.evaluate(()=>document.fonts.ready);
  const name=`before-${width}x${height}`;await captureHome(page,name+'-home');await passage(page,name+'-passage');
  for(const key of ['kl','acai','ripamonti']){
    await page.locator(`.project-tab[data-project=${key}]`).click();await page.locator('#projectStage img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    await captureSection(page,`${name}-${key}`);
  }
  await context.close();
}
async function performanceHome(browser,width,height){
  const before=await baselineURL();
  // When running this part alone, warm only the optional shared font transport first.
  // Every measured browser context remains fresh, identically for both versions.
  if(process.env.OT_QA_PROXY_FONTS==='1'&&!fonts.size){const warm=await browser.newContext();await configure(warm);const page=await warm.newPage();await page.goto(before+'/');await page.evaluate(()=>document.fonts.ready);await warm.close();}
  for(const [version,url] of [['before',before],['after',base]]){
    const runs=[];
    for(let i=0;i<3;i++){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});await configure(context,{baseline:true});const page=await context.newPage();
      await page.goto(url+'/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.OTAnalytics&&document.querySelector('#prova'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(600);
      const metrics=await page.evaluate(()=>({...window.__qaMetrics,navigation:performance.getEntriesByType('navigation')[0].toJSON(),resources:performance.getEntriesByType('resource').map(e=>({name:e.name,bytes:e.encodedBodySize,type:e.initiatorType}))}));
      const resources=metrics.resources.filter(r=>r.name.startsWith(url)||/https:\/\/fonts\./.test(r.name));
      const js=resources.filter(r=>r.name.match(/\.(m?js)(\?|$)/));
      const inlineBytes=await page.locator('script:not([src]):not([type="application/ld+json"])').evaluateAll(nodes=>nodes.reduce((sum,node)=>sum+new TextEncoder().encode(node.textContent).length,0));
      const renderReadyMs=[];
      for(const key of ['acai','kl','ripamonti']){const start=performance.now();await page.locator(`[role=tab][data-project=${key}]`).click();await page.waitForFunction(key=>{const s=document.getElementById('projectStage');return (s.dataset.selectedProject||s.dataset.project)===key&&!s.hasAttribute('aria-busy')},key);renderReadyMs.push(Math.round(performance.now()-start));}
      await page.waitForTimeout(100);const interactionMaxMs=await page.evaluate(()=>window.__qaMetrics.interactionDuration);
      runs.push({lcpMs:Math.round(metrics.lcp),cls:Number(metrics.cls.toFixed(5)),layoutShifts:metrics.layoutShifts,htmlBodyBytes:metrics.navigation.encodedBodySize,jsBodyBytes:js.reduce((sum,r)=>sum+r.bytes,0),inlineJSBytes:inlineBytes,totalBodyBytes:metrics.navigation.encodedBodySize+resources.reduce((sum,r)=>sum+r.bytes,0),interactionMaxMs,renderReadyMs});
      if(i===0){await captureHome(page,`performance-${version}-${width}-home`);await passage(page,`performance-${version}-${width}-passage`);}
      await context.close();
    }
    report.performance.push({version,width,height,runs,conditions:'Complete home in both versions; 3 cold Chromium contexts, identical viewport, same local HTTP transport, fonts, denied consent and reduced motion; no artificial CPU/network throttling. Body bytes include document and resource bodies; interaction Event Timing is lab-only, not field INP. Render-ready timing includes browser-driver overhead and requested image decoding.'});
  }
}
const parts=new Set((process.env.OT_QA_PARTS||'scenarios,responsive,nojs,analytics,zoom,performance').split(','));
if(process.env.OT_QA_PARTS)report.limitations.push('Focused QA parts only: '+[...parts].join(', ')+'; omitted parts are not asserted by this report.');
try{
  for(const engine of (process.env.OT_QA_ENGINES||'chromium').split(',')){
    const browser=await playwright[engine].launch(engine==='chromium'?{executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{});
    try{
      if(parts.has('scenarios'))for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[768,1024],[360,800],[390,844],[430,932]]){
        if(process.env.OT_QA_WIDTHS&&!process.env.OT_QA_WIDTHS.split(',').includes(String(width)))continue;
        await scenario(browser,engine,width,height);
      }
      if(process.env.OT_QA_WIDTHS){report.limitations.push('Diagnostic viewport subset: reduced motion, resize, analytics and performance suites skipped.');continue;}
      if(parts.has('scenarios')){await scenario(browser,engine,1440,900,{reduced:true});await scenario(browser,engine,390,844,{reduced:true});}
      if(parts.has('responsive'))await responsive(browser,engine);
      if(parts.has('nojs'))await noJS(browser);
      if(parts.has('analytics'))await tracking(browser,engine);
      if(engine==='chromium'){
        if(parts.has('zoom'))await zoom(browser);
        if(parts.has('performance')){await performanceHome(browser,1440,900);await performanceHome(browser,390,844);}
      }
    }finally{await browser.close()}
  }
  report.protectedMarkupAndCodeUnchanged=true;report.changedFiles=changed;
  await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log('All integrated home showroom checks passed.');
}finally{server.close();await closeBaseline();}
