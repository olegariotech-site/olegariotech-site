// Focused regression for Solution 03 and the existing solution controls.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.OT_TEST_URL||'http://127.0.0.1:4173';
const output=process.env.OT_QA_OUTPUT||'/tmp/ot-immersive-qa';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const message='Olá, OT! Vi o projeto Armazém Ripamonti na Solução 03 e quero avaliar uma estrutura semelhante para minha empresa.';
const bullets=['Identidade e apresentação profissional.','Site responsivo com foco comercial.','WhatsApp integrado à jornada do cliente.','Presença local e organização das informações.','Estrutura preparada para medir e evoluir.'];
const captures='.topbar,.desktop-rail,.mobile-header,.mobile-nav,.experience-controls,.scroll-progress,.wa-fab,.skip-link,.skip-link:focus,.skip-link:focus-visible{visibility:hidden!important}';
const report=[];
const fonts=new Map();
async function contextFor(viewport,reduced=false,consent=false){
  const context=await browser.newContext({viewport,reducedMotion:reduced?'reduce':'no-preference'});
  // Keep QA clicks out of production analytics; the real tracking implementation still queues events.
  await context.route(/https:\/\/(www\.googletagmanager\.com|connect\.facebook\.net)\//,route=>route.fulfill({contentType:'text/javascript',body:''}));
  await context.route(/https:\/\/(wa\.me|armazemripamonti\.com\.br)\//,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>QA destination</title>'}));
  if(consent)await context.addInitScript(()=>localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'granted',marketing:'granted'})));
  if(process.env.OT_QA_PROXY_FONTS==='1')await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{
    const url=route.request().url();
    if(!fonts.has(url))fonts.set(url,(async()=>{const r=await fetch(url,{headers:{'User-Agent':route.request().headers()['user-agent']},signal:AbortSignal.timeout(20000)});assert.ok(r.ok);return {body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')};})());
    await route.fulfill(await fonts.get(url));
  });
  return context;
}
async function load(context){
  const page=await context.newPage();
  const errors=[],notFound=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
  page.on('response',r=>{if(r.status()===404)notFound.push(r.url())});
  assert.equal((await page.goto(base,{waitUntil:'networkidle'})).status(),200);
  await page.locator('.solution-blueprint__node').first().waitFor();
  await page.waitForFunction(()=>window.OTAnalytics&&document.querySelector('#prova'));
  const reject=page.getByRole('button',{name:'Recusar opcionais',exact:true});
  if(await reject.isVisible())await reject.click();
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.activeElement?.blur()});
  await page.evaluate(()=>document.fonts.ready);
  assert.match(await page.title(),/Olegario Tech/);
  assert.ok((await page.locator('main').innerText()).includes('Prova antes da promessa.'));
  assert.equal(await page.locator('nextjs-portal,vite-error-overlay').count(),0);
  return {page,errors,notFound};
}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'no horizontal overflow');}
async function select(page,key){
  await page.locator(`.choice-tab[data-solution="${key}"]`).click();
  await page.waitForFunction(k=>document.querySelector('#solutionContent').dataset.solution===k&&document.querySelector('#solutionStage').dataset.route===k,key);
  await page.locator('#solutionMedia img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  assert.equal(await page.locator('.choice-tab[data-solution][aria-selected="true"]').count(),1);
}
async function run(width,height,reduced=false){
  const name=`solution-${width}x${height}${reduced?'-reduced':''}`;
  const context=await contextFor({width,height},reduced);
  const {page,errors,notFound}=await load(context);
  await page.screenshot({path:`${output}/${name}-initial.png`});
  for(const key of ['presenca','oferta','digital','presenca','digital']){
    await select(page,key);
    assert.ok((await page.locator('#solutionContent h3').innerText()).length>20);
    assert.ok(await page.locator('#solutionContent [data-generate-lead]').count());
    await noOverflow(page);
    if(key!=='digital'){
      assert.equal(await page.locator('#solutionMedia .solution-screen').count(),1);
      assert.equal(await page.locator('#solutionMedia .solution-phone').count(),1);
      assert.equal(await page.locator('#solutionMedia .solution-case').count(),0);
      assert.equal(await page.locator('#solutionMedia').getAttribute('aria-hidden'),'true');
    }
  }
  // Same selection keeps the live nodes; rapid switching must finish on the last choice.
  await page.evaluate(()=>window.__qaCase=document.querySelector('.solution-case'));
  await select(page,'digital');
  assert.equal(await page.evaluate(()=>window.__qaCase===document.querySelector('.solution-case')),true);
  await page.evaluate(()=>['oferta','digital','presenca','digital','oferta','digital'].forEach(k=>document.querySelector(`.choice-tab[data-solution="${k}"]`).click()));
  await page.waitForFunction(()=>document.querySelector('#solutionStage').dataset.route==='digital'&&document.querySelector('.solution-blueprint__nodes').children.length===4);
  assert.equal(await page.locator('.solution-case').count(),1);
  assert.equal(await page.locator('#solutionMedia').getAttribute('aria-hidden'),'false');
  assert.equal(await page.locator('#solutionContent h3').innerText(),'Fazer o digital trabalhar na mesma direção');
  assert.deepEqual(await page.locator('#solutionContent li').allTextContents(),bullets);
  assert.equal(await page.locator('.solution-case__status').innerText(),'PROJETO REAL · PUBLICADO');
  assert.equal(await page.locator('.solution-case h4').innerText(),'Armazém Ripamonti');
  assert.equal(await page.locator('.solution-case blockquote').innerText(),'“Exatamente como eu queria. Trabalho perfeito, estou muito satisfeito.”');
  assert.equal(await page.locator('.solution-case figcaption').innerText(),'— Evandro Ripamonti');
  assert.ok(!(await page.locator('#solutionStage').innerText()).includes('Mini Mercado'));
  const primary=page.locator('#solutionContent [data-generate-lead]'),secondary=page.locator('.solution-case__link');
  const href=await primary.getAttribute('href'),url=new URL(href);
  assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/5511912459144');assert.equal(url.searchParams.get('text'),message);
  assert.equal((await primary.innerText()).trim(),'Quero um projeto assim');
  assert.equal(await secondary.getAttribute('href'),'https://armazemripamonti.com.br/');
  for(const link of [primary,secondary]){
    assert.equal(await link.getAttribute('target'),'_blank');
    assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
    assert.ok((await link.boundingBox()).height>=44,'adequate touch target');
  }
  // Exercise the existing explanatory controls, including their keyboard activation.
  const nodes=page.locator('.solution-blueprint__node');
  for(let i=0;i<4;i++){await nodes.nth(i).focus();await page.keyboard.press('Enter');assert.equal(await nodes.nth(i).getAttribute('aria-pressed'),'true');}
  await nodes.first().click();
  // Tabs retain their established left/right/Home/End keyboard behavior.
  await page.locator('.choice-tab[data-solution="digital"]').focus();
  await page.keyboard.press('Home');assert.equal(await page.locator('#solutionContent').getAttribute('data-solution'),'presenca');
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#solutionContent').getAttribute('data-solution'),'oferta');
  await page.keyboard.press('End');assert.equal(await page.locator('#solutionContent').getAttribute('data-solution'),'digital');
  await page.keyboard.press('Tab');assert.equal(await page.locator('.choice-tab[data-scroll="projetos"]').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Tab');assert.equal(await primary.evaluate(e=>e===document.activeElement),true);
  assert.equal(await primary.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  await page.keyboard.press('Tab');assert.equal(await secondary.evaluate(e=>e===document.activeElement),true);
  assert.equal(await secondary.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  await page.screenshot({path:`${output}/${name}-focus.png`});
  await page.evaluate(()=>document.activeElement?.blur());
  await page.locator('.solution-case img').evaluate(i=>i.decode());
  const media=await page.locator('.solution-case img').evaluate(img=>({src:img.currentSrc,natural:[img.naturalWidth,img.naturalHeight],box:[img.clientWidth,img.clientHeight],fit:getComputedStyle(img).objectFit}));
  assert.ok(media.src.includes(width<=600?'site-mobile-v1':'site-desktop-v1'));
  assert.ok(Math.abs(media.box[0]/media.box[1]-media.natural[0]/media.natural[1])<.01,'no cropping or distorted screenshot');
  if(reduced){
    assert.equal(await page.locator('#solutionMedia').evaluate(e=>getComputedStyle(e).animationName),'none');
    assert.equal(await page.locator('.solution-case__browser').evaluate(e=>getComputedStyle(e).transform),'none');
  }
  await noOverflow(page);
  await page.locator('#solutionStage').screenshot({path:`${output}/${name}-stage.png`,style:captures});
  if(width===1440&&!reduced)await page.locator('#solucoes').screenshot({path:`${output}/${name}-section.png`,style:captures});
  await page.locator('#solutionStage').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-viewport.png`});
  // Rejected consent must not queue conversion events.
  await page.evaluate(()=>document.querySelector('#solutionContent a').addEventListener('click',e=>e.preventDefault(),{once:true}));
  await primary.click();
  assert.equal(await page.evaluate(()=>dataLayer.filter(e=>e[0]==='event'&&e[1]==='generate_lead').length),0);
  assert.deepEqual(errors,[]);assert.deepEqual(notFound,[]);
  report.push({name,viewport:{width,height},reducedMotion:reduced,checks:'passed',media,cta:href,errors,notFound});
  console.log(name+': passed');
  await context.close();
}
try{
  for(const [w,h] of [[1366,768],[1440,900],[1920,1080],[768,1024],[360,800],[390,844],[430,932]])await run(w,h);
  await run(1440,900,true);await run(390,844,true);
  const context=await contextFor({width:1440,height:900},false,true);
  const {page,errors,notFound}=await load(context);
  for(let click=1;click<=3;click++){
    await select(page,'oferta');await select(page,'digital');
    const popupPromise=page.waitForEvent('popup');
    await page.locator('#solutionContent [data-generate-lead]').click();
    const popup=await popupPromise;await popup.waitForLoadState();
    assert.equal(new URL(popup.url()).searchParams.get('text'),message);
    await popup.close();
    const events=await page.evaluate(()=>({leads:dataLayer.filter(e=>e[0]==='event'&&e[1]==='generate_lead').map(e=>e[2]),clicks:dataLayer.filter(e=>e[0]==='event'&&e[1]==='click_whatsapp').length,meta:fbq.queue.filter(e=>e[0]==='track'&&e[1]==='Lead').length}));
    assert.equal(events.leads.length,click);assert.equal(events.clicks,click);assert.equal(events.meta,click);
    assert.equal(events.leads.at(-1).cta_location,'solucoes');
    report.push({analyticsClick:click,events});
  }
  const external=page.waitForEvent('popup');await page.locator('.solution-case__link').click();
  const published=await external;await published.waitForLoadState();
  assert.equal(published.url(),'https://armazemripamonti.com.br/');
  assert.equal(await published.evaluate(()=>window.opener===null),true);
  await published.close();
  assert.deepEqual(errors,[]);assert.deepEqual(notFound,[]);
  report.push({externalLink:'passed',note:'Destination routing verified without sending messages or production analytics. Live site availability and capture verified separately.'});
  await context.close();
  await writeFile(`${output}/solution-report.json`,JSON.stringify(report,null,2));
}finally{await browser.close()}
