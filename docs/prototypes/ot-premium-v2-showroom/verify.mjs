// Real browser checks for the isolated draft. Uses the repo's existing Playwright runner.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {projects,media,initial} from './projects.generated.mjs';
import {order} from './templates.mjs';
const playwright=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../../../',import.meta.url)));
const dir='docs/prototypes/ot-premium-v2-showroom';
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
const preview=base+'/'+dir+'/';
const report={baseCommit:'4f2550af3e0211b54d4694de6d2e6fce80442dfd',browserPath:'Browser plugin not available; existing Playwright runner',scenarios:[],links:[],performance:[],limitations:['Engine simulation on Linux; no physical Safari/iPhone or real WhatsApp send.','Isolated prototype intentionally loads no analytics; production tracking is unchanged.','Performance compares a complete home with an isolated section; it is not a prediction of the future integration.']};
const changed=execFileSync('git',['diff','--name-only',report.baseCommit],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.ok(changed.every(file=>file.startsWith(dir+'/')||file==='.github/workflows/premium-v2-preview-qa.yml'),'Production files must remain unchanged.');
assert.equal(initial,'kl');
assert.equal(order.length,6);
const canonical=JSON.parse((await readFile(resolve(root,'index.html'),'utf8')).match(/const projects=(\{[\s\S]*?\n\});/)[1]);
assert.deepEqual(projects,canonical,'All approved copy, points, testimonials and URLs come from production projects.');
const fonts=new Map();
async function configure(context,{baseline=false}={}){
  await context.addInitScript(()=>{
    localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
    window.__qaMetrics={lcp:0,cls:0,interactionDuration:0};
    for(const type of ['largest-contentful-paint','layout-shift','event']){
      if(!PerformanceObserver.supportedEntryTypes.includes(type))continue;
      new PerformanceObserver(list=>{for(const entry of list.getEntries()){
        if(type==='largest-contentful-paint')window.__qaMetrics.lcp=entry.startTime;
        if(type==='layout-shift'&&!entry.hadRecentInput)window.__qaMetrics.cls+=entry.value;
        if(type==='event'&&entry.interactionId)window.__qaMetrics.interactionDuration=Math.max(window.__qaMetrics.interactionDuration,entry.duration);
      }}).observe({type,buffered:true,...type==='event'?{durationThreshold:16}:{}});
    }
  });
  if(baseline&&process.env.OT_QA_PROXY_FONTS==='1')await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{
    const url=route.request().url();
    if(!fonts.has(url))fonts.set(url,(async()=>{const r=await fetch(url,{headers:{'User-Agent':route.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});return {body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')}})());
    await route.fulfill(await fonts.get(url));
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
  await page.waitForFunction(k=>document.querySelector('#projectStage').dataset.project===k&&!document.querySelector('#projectStage').hasAttribute('aria-busy'),key);
  await decode(page);
  await page.waitForTimeout(280);
  await tab.locator('img').evaluate(image=>image.decode());
  assert.equal(await page.locator('[role=tab][aria-selected=true]').count(),1);
  assert.equal(await page.locator(`[data-project="${key}"][role=tab]`).getAttribute('aria-selected'),'true');
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
  if(width<=600){const imageBox=await page.locator('.case-media').boundingBox(),copyBox=await page.locator('.case-copy').boundingBox();assert.ok(imageBox.y+imageBox.height<=copyBox.y,'Mobile image precedes narrative');}
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
async function scenario(browser,engine,width,height,{reduced=false}={}){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference',hasTouch:width<=600});
  await configure(context);
  const page=await context.newPage(),errors=[],notFound=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()===404)notFound.push(r.url())});page.on('request',r=>{if(!r.url().startsWith(base))external.push(r.url())});
  assert.equal((await page.goto(preview,{waitUntil:'networkidle'})).status(),200);await page.evaluate(()=>document.fonts.ready);await decode(page);
  assert.match(await page.title(),/OT Premium V2/);assert.equal(page.url(),preview);
  assert.equal(await page.locator('#showroomTitle').innerText(),'Prova antes da promessa.');
  assert.equal(await page.locator('[role=tab]').count(),6);assert.equal(await page.locator('.index-group--real [role=tab]').count(),5);
  assert.equal(await page.locator('#projectStage').getAttribute('data-project'),initial);
  if(width<=600){
    const selectedBox=await page.locator(`[role=tab][data-project="${initial}"]`).boundingBox(),railBox=await page.locator('.case-rail').boundingBox();
    assert.ok(selectedBox.x>=railBox.x&&selectedBox.x+selectedBox.width<=railBox.x+railBox.width,'The initial selected project is fully visible in the mobile rail');
  }
  assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(),0);await overflow(page);
  const name=`${engine}-${width}x${height}${reduced?'-reduced':''}`;
  await page.screenshot({path:`${output}/${name}-context.png`,fullPage:true});
  await page.locator('#projetos').screenshot({path:`${output}/${name}-${initial}.png`});
  await page.evaluate(()=>scrollTo({top:document.getElementById('projetos').offsetTop,behavior:'instant'}));
  await page.screenshot({path:`${output}/${name}-viewport.png`});
  for(const key of order){
    await select(page,key,width<=600);await checkCase(page,key,width);
    if(key==='acai'||key==='ripamonti'||(key==='advocacia'&&width===1440))await page.locator('#projetos').screenshot({path:`${output}/${name}-${key}.png`});
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
  await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.project==='ripamonti'&&!document.querySelector('#projectStage').hasAttribute('aria-busy'));await decode(page);
  await page.evaluate(()=>window.__qaNode=document.querySelector('.case-copy'));
  await select(page,'ripamonti');assert.equal(await page.evaluate(()=>window.__qaNode===document.querySelector('.case-copy')),true);
  await page.locator('[role=tab][data-project=ripamonti]').focus();
  await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.project==='acai');
  await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.project==='kl');
  await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.project==='navalha');
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.querySelector('#projectStage').dataset.project==='ripamonti');await decode(page);
  assert.equal(await page.locator('[data-project=ripamonti][role=tab]').evaluate(el=>el===document.activeElement),true);
  assert.equal(await page.locator('[data-project=ripamonti][role=tab]').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  await page.locator('#projetos').screenshot({path:`${output}/${name}-focus.png`});
  await page.keyboard.press('Tab');assert.equal(await page.locator('#projectStage').evaluate(el=>el===document.activeElement),true);
  if(reduced){assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);assert.equal(await page.locator('.case-tab').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');}
  if(width<=600){assert.match(await page.locator('.case-rail').evaluate(el=>getComputedStyle(el).scrollSnapType),/^x(?: proximity)?$/);assert.ok(await page.locator('.case-rail').evaluate(el=>el.scrollWidth>el.clientWidth));}
  await overflow(page);
  assert.deepEqual(errors,[]);assert.deepEqual(notFound,[]);assert.deepEqual(external,[],'The isolated preview makes zero external requests and sends no analytics.');
  report.scenarios.push({engine,width,height,reduced,passed:true,errors,notFound,externalRequests:external.length,labInteractionMaxMs:await page.evaluate(()=>window.__qaMetrics.interactionDuration),note:'Event Timing maximum observed duration in lab; not a field INP measurement.'});
  if(engine==='chromium'&&width===1440&&!reduced)await links(page);
  await context.close();console.log('PASS',name);
}
async function noJS(browser){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();await page.goto(preview);assert.equal(await page.locator('.case-copy h3').innerText(),projects[initial].title);assert.equal(await page.locator('.case-actions [data-generate-lead]').count(),1);await decode(page);await overflow(page);await context.close();report.noJavaScriptInitialCase=true;
}
async function offline(browser){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('./preview-offline.html',import.meta.url).href);await decode(page);
  assert.equal(await page.locator('.case-copy h3').innerText(),projects[initial].title);
  for(const key of order){await select(page,key);assert.equal(await page.locator('.case-copy h3').innerText(),projects[key].title);assert.match(await page.locator('.case-screen img').getAttribute('src'),/^data:image\//);await overflow(page);}
  assert.deepEqual(errors,[]);await context.close();report.offlineArtifactPassed=true;
}
async function zoom(browser){
  const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();await page.goto(preview);await page.evaluate(()=>document.documentElement.style.zoom='200%');
  for(const key of order){await select(page,key);await overflow(page);const title=await page.locator('.case-copy h3').boundingBox();assert.ok(title.x>=0&&title.x+title.width<=1440)}
  await page.screenshot({path:`${output}/chromium-zoom-200.png`,fullPage:true});await context.close();report.cssZoom200=true;report.limitations.push('Zoom exercised with CSS zoom 200% plus narrow viewports; native Safari pinch/browser chrome remain untested.');
}
async function performance(browser,width,height){
  for(const path of ['/',`/${dir}/`]){
    const runs=[];
    for(let i=0;i<3;i++){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});await configure(context,{baseline:path==='/'});
      const page=await context.newPage();
      await page.goto(base+path,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
      if(path==='/')await page.waitForFunction(()=>window.OTAnalytics&&document.querySelector('#prova'));
      const metrics=await page.evaluate(()=>({...window.__qaMetrics,resources:performance.getEntriesByType('resource').map(e=>({name:e.name,bytes:e.encodedBodySize,type:e.initiatorType}))}));
      const local=metrics.resources.filter(r=>r.name.startsWith(base));
      const js=local.filter(r=>r.name.match(/\.(m?js)(\?|$)/));
      runs.push({lcpMs:Math.round(metrics.lcp),cls:Number(metrics.cls.toFixed(5)),jsBodyBytes:js.reduce((sum,r)=>sum+r.bytes,0),localBodyBytes:local.reduce((sum,r)=>sum+r.bytes,0)});
      await context.close();
    }
    report.performance.push({path,width,height,runs,conditions:'3 cold contexts, same browser/viewport, local HTTP without artificial network/CPU throttling, consent denied and reduced motion. Encoded bodies from Resource Timing; external fonts excluded from byte total.'});
  }
}
try{
  for(const engine of (process.env.OT_QA_ENGINES||'chromium').split(',')){
    const browser=await playwright[engine].launch(engine==='chromium'?{executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args:['--no-zygote','--disable-gpu']}:{});
    try{
      for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[768,1024],[360,800],[390,844],[430,932]])await scenario(browser,engine,width,height);
      await scenario(browser,engine,1440,900,{reduced:true});await scenario(browser,engine,390,844,{reduced:true});
      await noJS(browser);
      if(engine==='chromium'){await offline(browser);await zoom(browser);await performance(browser,1440,900);await performance(browser,390,844);}
    }finally{await browser.close()}
  }
  report.productionFilesUnchanged=true;report.changedFiles=changed;
  await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log('All isolated preview checks passed.');
}finally{server.close()}
