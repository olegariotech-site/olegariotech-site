// End-to-end regression checks for the scroll narrative, real route controls, and fallbacks.
const { chromium } = await import(process.env.OT_PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
// Validate the actual inline entry point: a broken template literal disables every control.
const source=await readFile(new URL('../index.html',import.meta.url),'utf8');
for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/type=["']application\/ld\+json["']/.test(match[1])&&match[2].trim())new Script(match[2],{filename:'index.html inline script'});
}
const base = process.env.OT_TEST_URL || 'http://127.0.0.1:4173';
const output = process.env.OT_QA_OUTPUT || '/tmp/ot-immersive-qa';
await mkdir(output, {recursive:true});
const browser = await chromium.launch({executablePath:process.env.OT_CHROME_EXECUTABLE || undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[];
const fontCache=new Map();
const expectedHero=['Sites que','geram','negócios.'];
async function run(name,viewport,options={}) {
  if(process.env.OT_QA_SCENARIOS&&!process.env.OT_QA_SCENARIOS.split(',').includes(name))return;
  const context=await browser.newContext({viewport,reducedMotion:options.reduced?'reduce':'no-preference'});
  // Optional QA transport for managed environments where Chromium cannot use the host proxy.
  if(process.env.OT_QA_PROXY_FONTS==='1')await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{
    const url=route.request().url();
    if(!fontCache.has(url))fontCache.set(url,(async()=>{
      const response=await fetch(url,{headers:{'User-Agent':route.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error(`Font transport: ${response.status} ${url}`);
      return {body:Buffer.from(await response.arrayBuffer()),contentType:response.headers.get('content-type')||'application/octet-stream'};
    })());
    try{await route.fulfill(await fontCache.get(url));}catch(error){fontCache.delete(url);await route.abort('failed');}
  });
  if(options.fallback) await context.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2')return null;return original.call(this,type,...args);};
  });
  const page=await context.newPage();
  const errors=[];
  const notFound=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(`${msg.text()} (${msg.location().url})`);});
  page.on('response',response=>{if(response.status()===404)notFound.push(response.url());});
  const response=await page.goto(base,{waitUntil:'networkidle'});
  assert.equal(response.status(),200);
  await page.getByRole('button',{name:'Recusar opcionais',exact:true}).click();
  await page.locator('#otConsent').waitFor({state:'hidden'});
  await page.locator('.solution-blueprint__node').first().waitFor();
  await page.waitForFunction(()=>document.querySelector('#metodo .method-card')?.textContent.includes('Diagnóstico'));
  if(!options.reduced) await page.waitForFunction(()=>!!document.querySelector('#earthJourney').dataset.renderer);
  await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
  assert.match(await page.title(),/Olegario Tech/i);
  assert.ok(await page.locator('main').innerText());
  assert.deepEqual(await page.locator('#inicio h1 > span').allTextContents(),expectedHero);
  assert.ok(await page.locator('#inicio h1 > span').evaluateAll(spans=>spans.every(span=>{
    const range=document.createRange();range.selectNodeContents(span);
    const text=range.getBoundingClientRect(),copy=span.closest('.hero-copy').getBoundingClientRect(),box=span.getBoundingClientRect();
    return text.left>=copy.left-1&&text.right<=copy.right+1&&text.top>=box.top-1&&text.bottom<=box.bottom+1;
  })),'every headline glyph, accent and period fits its column and line box');
  assert.equal(await page.locator('#projetos h2').innerText(),'Prova antes da promessa.');
  async function noOverflow(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' overflow');}
  async function capture(label){await page.waitForTimeout(250);await noOverflow();await page.screenshot({path:`${output}/${name}-${label}.png`});}
  async function verifyAudio() {
    const control=page.locator(viewport.width>900?'.desktop-audio-toggle':'.mobile-audio-toggle');
    assert.ok(await control.isVisible(),'sound control remains visible');
    assert.notEqual(await control.getAttribute('aria-hidden'),'true','sound control stays accessible');
    await control.click();
    await page.waitForFunction(()=>{const audio=document.getElementById('backgroundAudio');return !audio.paused&&audio.currentTime>.15&&[...document.querySelectorAll('.audio-toggle')].every(e=>e.getAttribute('aria-pressed')==='true');});
    assert.equal(await control.getAttribute('aria-pressed'),'true');
    assert.equal(await control.getAttribute('aria-label'),'Desativar som');
    assert.ok(await page.locator('#backgroundAudio').evaluate(audio=>audio.loop&&audio.currentSrc.endsWith('/assets/audio/background.mp3')));
    await control.click();
    assert.equal(await control.getAttribute('aria-pressed'),'false');
    assert.ok(await page.locator('#backgroundAudio').evaluate(audio=>audio.paused&&audio.muted));
  }
  async function pointerDepth(selector,label) {
    const surface=page.locator(selector);
    await surface.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    const box=await surface.boundingBox();
    await page.mouse.move(1,1);
    await page.mouse.move(box.x+box.width*.78,Math.max(90,box.y+box.height*.3),{steps:12});
    if(viewport.width>900&&!options.reduced){
      try{
        await page.waitForFunction(selector=>Math.abs(parseFloat(document.querySelector(selector).style.getPropertyValue('--surface-ry'))||0)>.1,selector,{timeout:5000});
      }catch(error){
        console.log(await page.evaluate(({selector,box})=>({selector,box,pointer:matchMedia('(hover:hover) and (pointer:fine) and (min-width:901px)').matches,hidden:document.hidden,saveData:navigator.connection?.saveData,surface:document.querySelector(selector).outerHTML.slice(0,600),hit:document.elementFromPoint(box.x+box.width*.78,Math.max(90,box.y+box.height*.3))?.outerHTML.slice(0,200)}),{selector,box}));
        await capture(label+'-failed-pointer');throw error;
      }
      await capture(label+'-pointer');
      await page.mouse.move(1,1);
      await page.waitForFunction(selector=>!document.querySelector(selector).style.getPropertyValue('--surface-ry'),selector,{timeout:3000});
    }else{
      assert.equal(await surface.evaluate(e=>e.style.getPropertyValue('--surface-ry')),'','touch/reduced surface stays stable');
    }
  }
  assert.equal(await page.locator('#inicio').evaluate(e=>e.nextElementSibling.id),'projetos','projects follow the opening as in the approved visual');
  assert.equal(await page.locator('#prova').evaluate(e=>e.previousElementSibling.id),'solucoes','proof remains after solutions');
  assert.equal(await page.locator('#projectStage').getAttribute('data-project'),'kl','reference case selected initially');
  if(viewport.width>900){
    assert.equal(Math.round((await page.locator('.desktop-rail').boundingBox()).width),64,'compact rail frees the hero composition');
    const route=page.locator('.desktop-rail .rail-btn').first();
    await page.locator('.skip-link').focus();await page.keyboard.press('Tab');
    assert.ok(await route.evaluate(e=>e===document.activeElement),'keyboard reaches the first compact route');
    assert.equal(await route.locator('span').last().evaluate(e=>getComputedStyle(e).opacity),'1','route name is visible on keyboard focus');
    await page.locator('.top-nav a[href="#solucoes"]').click();await page.waitForTimeout(200);
    assert.ok((await page.locator('#solucoes').boundingBox()).y<viewport.height,'top navigation reaches solutions');
    await page.locator('.top-nav a[href="#inicio"]').click();await page.waitForTimeout(200);
    assert.ok((await page.locator('#inicio').boundingBox()).y>=-1,'top navigation returns to opening');
  }
  await capture('01-hero');
  await verifyAudio();
  const primary=await page.locator('#inicio .btn-primary').boundingBox();
  assert.ok(primary.x>=0&&primary.x+primary.width<=viewport.width,'primary action fits the viewport');
  if(viewport.width>900)assert.ok(primary.y+primary.height<=viewport.height,'desktop primary action visible in first viewport');
  else {
    const copy=await page.locator('#inicio .hero-copy').boundingBox(),visual=await page.locator('#inicio .hero-visual').boundingBox();
    assert.ok(visual.y>=copy.y+copy.height,'mobile globe has its own block below commercial copy');
  }
  assert.equal(await page.locator('#prova .ot-proof-strip__cases a').count(),5,'proof strip has five real projects');
  assert.equal(await page.locator('#prova .ot-proof-strip__cases img').count(),5,'each real project has a visual thumbnail');
  assert.equal(await page.locator('#prova .ot-proof-case__rating').count(),3,'only the three approved Google reviews show stars');
  for(const key of ['acai','kl','adega','advocacia','ripamonti']){
    await page.locator(`#prova a[data-project="${key}"]`).click();
    assert.equal(await page.locator('#projectStage').getAttribute('data-project'),key,'rail selects the real case: '+key);
  }
  await page.locator('#prova .ot-proof-strip__cases').evaluate(e=>{e.scrollLeft=0;});
  await page.locator('#prova').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>[...document.querySelectorAll('#prova img')].every(img=>img.complete&&img.naturalWidth>0));
  if(viewport.width<=900){
    assert.ok(await page.locator('#prova .ot-proof-strip__cases').evaluate(rail=>{
      const first=rail.children[0].getBoundingClientRect(),next=rail.children[1].getBoundingClientRect(),box=rail.getBoundingClientRect();
      return first.left>=box.left&&first.right<=box.right&&next.left<box.right&&next.right>box.right&&rail.scrollWidth>rail.clientWidth;
    }),'mobile rail shows one whole case and part of the next');
  }
  await page.locator('#prova').screenshot({path:`${output}/${name}-proof-rail.png`,style:'.mobile-header,.mobile-nav,.experience-controls,.skip-link{visibility:hidden!important}'});
  assert.ok((await page.locator('#prova .ot-proof-strip__cases').innerText()).includes('Adega São Marcos'),'proof strip includes Adega São Marcos');
  if(options.reduced)assert.ok(await page.evaluate(()=>document.querySelector('#prova').getBoundingClientRect().top>=document.querySelector('.hero-proof').getBoundingClientRect().bottom),'proof strip clears hero content');
  for(const [label,amount] of [['02-particles',.30],['03-wave',.72]]){
    await page.evaluate(amount=>scrollTo(0,innerHeight*amount),amount);
    await capture(label);
  }
  const earthState=await page.locator('#earthJourney').evaluate(e=>({...e.dataset}));
  if(!options.reduced){
    if(viewport.width>900)assert.ok(+earthState.morph>.1,'desktop wave morph advances');
    else {assert.equal(+earthState.morph,0,'mobile globe stays static');assert.equal(earthState.animate,'false');}
    if(options.fallback)assert.equal(earthState.renderer,'canvas2d');else assert.equal(earthState.renderer,'webgl');
  }
  await page.locator('#solucoes').scrollIntoViewIfNeeded();
  for(const [label,key,nodeCount] of [['MINHA EMPRESA NÃO PARECE PROFISSIONAL','presenca',3],['PRECISO VENDER UMA OFERTA','oferta',3],['MEU DIGITAL ESTÁ TODO SOLTO','digital',4]]){
    await page.getByRole('tab',{name:new RegExp(label,'i')}).click();
    await page.waitForFunction(key=>document.querySelector('#solutionStage').dataset.route===key,key);
    assert.equal(await page.locator('.solution-blueprint__node').count(),nodeCount);
    assert.ok(await page.locator('#solutionMedia').isVisible(),'project imagery stays visible');
    await page.waitForFunction(()=>[...document.querySelectorAll('#solutionMedia img')].every(img=>img.complete&&img.naturalWidth>0));
    const ratios=await page.locator('#solutionMedia img').evaluateAll(images=>images.map(img=>{
      const r=img.getBoundingClientRect();return {source:img.naturalWidth/img.naturalHeight,rendered:r.width/r.height};
    }));
    assert.ok(ratios.every(r=>Math.abs(r.source-r.rendered)<.035),'complete preview keeps source aspect ratio');
    if(key==='presenca')await pointerDepth('#solutionMedia','solution-brand');
    const last=page.locator('.solution-blueprint__node').last();
    await last.click();
    assert.equal(await last.getAttribute('aria-pressed'),'true');
    const detail=await page.locator('.solution-blueprint__detail').innerText();
    assert.ok(detail.length>60);
    await page.locator('#solutionStage').scrollIntoViewIfNeeded();
    await capture('04-solution-'+key);
    await page.locator('#solutionStage').screenshot({path:`${output}/${name}-solution-full-${key}.png`,style:'.mobile-header,.mobile-nav,.experience-controls,.skip-link{visibility:hidden!important}'});
    // Repeated selection must not duplicate the blueprint.
    await page.getByRole('tab',{name:new RegExp(label,'i')}).click();
    assert.equal(await page.locator('.solution-blueprint').count(),1);
  }
  const firstNode=page.locator('.solution-blueprint__node').first();
  await firstNode.focus();await page.keyboard.press('Enter');
  assert.equal(await firstNode.getAttribute('aria-pressed'),'true');
  await page.locator('#projetos').scrollIntoViewIfNeeded();
  await page.getByRole('tab',{name:/K\.L Transporte/i}).click();
  await verifyAudio();
  assert.equal(await page.locator('#projectStage h3').innerText(),'K.L Transporte Express');
  assert.equal(await page.locator('#projectStage a').first().getAttribute('href'),'https://kltransporteexpress.com.br/');
  await pointerDepth('#projectStage .project-image','project');
  await capture('05-project');
  const selected=page.locator('.project-tab.is-active');
  await selected.focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#projectStage').getAttribute('data-project'),'adega','keyboard switches cases');
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#projectStage').getAttribute('data-project'),'acai');
  for(const key of ['acai','adega','advocacia','ripamonti','navalha']){
    await page.locator(`.project-tab[data-project="${key}"]`).click();
    await page.waitForFunction(()=>[...document.querySelectorAll('#projectStage img')].every(img=>img.complete&&img.naturalWidth>0));
    await page.locator('#projectStage').scrollIntoViewIfNeeded();
    const coverImage=page.locator('#projectStage .project-image > img');
    if(await coverImage.count())assert.equal(await coverImage.evaluate(img=>getComputedStyle(img).objectFit),'contain');
    else{
      assert.equal(await page.locator('#projectStage .case-cover').count(),1);
      assert.ok(await page.locator('#projectStage .case-cover').isVisible());
      if(key==='advocacia')assert.match(await page.locator('.case-cover__title').innerText(),/Advocacia estratégica/);
    }
    await noOverflow();
    const title=page.locator('#projectStage h3');
    assert.ok(await title.evaluate(e=>{
      const range=document.createRange();range.selectNodeContents(e);
      const text=range.getBoundingClientRect(),panel=e.closest('.project-stage').getBoundingClientRect();
      return text.left>=panel.left&&text.right<=panel.right&&text.top>=panel.top&&text.bottom<=panel.bottom;
    }),'case title stays inside the panel: '+key);
    assert.equal(await page.locator('#projectStage').getAttribute('aria-labelledby'),`project-tab-${key}`);
    const testimonial=page.locator('#projectStage .project-testimonial');
    assert.equal(await testimonial.count(),['acai','advocacia','ripamonti'].includes(key)?1:0,'approved social proof only: '+key);
    if(key==='ripamonti'){
      assert.equal(await testimonial.locator('blockquote').innerText(),'“Exatamente como eu queria. Trabalho perfeito, estou muito satisfeito.”');
      assert.equal(await testimonial.locator('figcaption strong').innerText(),'Evandro Ripamonti');
      assert.ok((await page.locator('#projectStage .project-image>img').getAttribute('src')).startsWith('/assets/img/projetos/ripamonti/'));
      await testimonial.screenshot({path:`${output}/${name}-evandro-review.png`});
    }
    const contact=page.locator('#projectStage [data-generate-lead]');
    assert.ok(decodeURIComponent(await contact.getAttribute('href')).includes(await page.locator('#projectStage h3').innerText()),'contact message includes the active project');
    if(key==='advocacia'||key==='acai'||key==='ripamonti')await page.locator('#projetos').screenshot({path:`${output}/${name}-project-full-${key}.png`,style:'.mobile-header,.mobile-nav,.experience-controls,.skip-link{visibility:hidden!important}'});
  }
  await page.locator('#metodo').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#metodo .method-card').count(),4);
  assert.equal(await page.locator('.ot-method-build').count(),1);
  await pointerDepth('.ot-method-build','method');
  if(!options.reduced){
    await page.waitForFunction(()=>document.querySelector('#metodo').classList.contains('is-method-active'));
    assert.equal(await page.locator('.build-runner').evaluate(e=>getComputedStyle(e).animationPlayState),'running');
  }else{
    assert.equal(await page.locator('.build-runner').evaluate(e=>getComputedStyle(e).display),'none');
  }
  const thirdCard=page.locator('#metodo .method-card').nth(2);
  await thirdCard.hover();
  assert.equal(await page.locator('#metodo').getAttribute('data-method-focus'),'3');
  await capture('06-method');
  await page.locator('.method-scene').screenshot({path:`${output}/${name}-method-full.png`,style:'.mobile-header,.mobile-nav,.experience-controls,.skip-link{visibility:hidden!important}'});
  await page.locator('#ecossistema').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
  await page.waitForFunction(()=>!document.querySelector('#metodo').classList.contains('is-method-active'),null,{timeout:5000});
  assert.equal(await page.locator('.build-runner').evaluate(e=>getComputedStyle(e).animationPlayState),'paused','method animation pauses offscreen');
  await capture('07-ecosystem');
  if(viewport.width>1100&&!options.reduced)assert.ok(await page.locator('.ot-pulse-network path').count()>0);
  await page.locator('#contato').scrollIntoViewIfNeeded();
  await capture('08-contact');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>+document.querySelector('#earthJourney').dataset.morph===0,{},{timeout:5000});
  assert.equal(+await page.locator('#earthJourney').getAttribute('data-morph'),0);
  if(options.reduced){assert.equal(await page.locator('.earth-journey__canvas').evaluate(e=>getComputedStyle(e).display),'none');}
  assert.deepEqual(errors,[],name+' runtime errors');
  assert.deepEqual(notFound,[],name+' missing resources');
  report.push({name,viewport,renderer:earthState.renderer||'static',checks:'passed',errors,notFound});
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  console.log(name+': passed');
  await context.close();
}
try{
  await run('desktop',{width:1440,height:900});
  await run('notebook',{width:1366,height:768});
  await run('desktop-1536',{width:1536,height:864});
  await run('desktop-1600',{width:1600,height:900});
  await run('desktop-1920',{width:1920,height:1080});
  await run('short-notebook',{width:1366,height:612});
  await run('tablet',{width:1024,height:768});
  await run('mobile',{width:390,height:844});
  await run('small-mobile',{width:360,height:800});
  await run('large-mobile',{width:430,height:932});
  await run('reduced-motion',{width:1440,height:900},{reduced:true});
  await run('mobile-reduced-motion',{width:390,height:844},{reduced:true});
  await run('no-webgl',{width:1440,height:900},{fallback:true});
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
