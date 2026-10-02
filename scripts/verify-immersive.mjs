// End-to-end regression checks for the scroll narrative, real route controls, and fallbacks.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.OT_TEST_URL || 'http://127.0.0.1:4173';
const output = process.env.OT_QA_OUTPUT || '/tmp/ot-immersive-qa';
await mkdir(output, {recursive:true});
const browser = await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[];
const expectedHero=['Sites que','geram','negócios.'];
async function run(name,viewport,options={}) {
  const context=await browser.newContext({viewport,reducedMotion:options.reduced?'reduce':'no-preference'});
  if(options.fallback) await context.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2')return null;return original.call(this,type,...args);};
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error'&& !msg.text().includes('fonts.googleapis'))errors.push(msg.text());});
  const response=await page.goto(base,{waitUntil:'networkidle'});
  assert.equal(response.status(),200);
  await page.getByRole('button',{name:'Recusar opcionais',exact:true}).click();
  await page.locator('#otConsent').waitFor({state:'hidden'});
  await page.locator('.solution-blueprint__node').first().waitFor();
  await page.waitForFunction(()=>document.querySelector('#metodo .method-card')?.textContent.includes('Diagnóstico'));
  if(!options.reduced) await page.waitForFunction(()=>!!document.querySelector('#earthJourney').dataset.renderer);
  await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
  assert.deepEqual(await page.locator('#inicio h1 > span').allTextContents(),expectedHero);
  assert.equal(await page.locator('#projetos h2').innerText(),'Prova antes da promessa.');
  async function noOverflow(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' overflow');}
  async function capture(label){await page.waitForTimeout(250);await noOverflow();await page.screenshot({path:`${output}/${name}-${label}.png`});}
  await capture('01-hero');
  if(options.reduced)assert.ok(await page.evaluate(()=>document.querySelector('#prova').getBoundingClientRect().top>=document.querySelector('.hero-proof').getBoundingClientRect().bottom),'proof strip clears hero content');
  for(const [label,amount] of [['02-particles',.30],['03-wave',.72]]){
    await page.evaluate(amount=>scrollTo(0,innerHeight*amount),amount);
    await capture(label);
  }
  const earthState=await page.locator('#earthJourney').evaluate(e=>({...e.dataset}));
  if(!options.reduced){assert.ok(+earthState.morph>.1,'wave morph advances');if(options.fallback)assert.equal(earthState.renderer,'canvas2d');else assert.equal(earthState.renderer,'webgl');}
  await page.locator('#solucoes').scrollIntoViewIfNeeded();
  for(const [label,key,nodeCount] of [['MINHA EMPRESA NÃO PARECE PROFISSIONAL','presenca',3],['PRECISO VENDER UMA OFERTA','oferta',3],['MEU DIGITAL ESTÁ TODO SOLTO','digital',4]]){
    await page.getByRole('tab',{name:new RegExp(label,'i')}).click();
    await page.waitForFunction(key=>document.querySelector('#solutionStage').dataset.route===key,key);
    assert.equal(await page.locator('.solution-blueprint__node').count(),nodeCount);
    assert.ok(await page.locator('#solutionMedia').isVisible(),'project imagery stays visible');
    await page.waitForFunction(()=>[...document.querySelectorAll('#solutionMedia img')].every(img=>img.complete&&img.naturalWidth>0));
    const last=page.locator('.solution-blueprint__node').last();
    await last.click();
    assert.equal(await last.getAttribute('aria-pressed'),'true');
    const detail=await page.locator('.solution-blueprint__detail').innerText();
    assert.ok(detail.length>60);
    await page.locator('#solutionStage').scrollIntoViewIfNeeded();
    await capture('04-solution-'+key);
    await page.locator('#solutionStage').screenshot({path:`${output}/${name}-solution-full-${key}.png`,style:'.mobile-header,.mobile-nav,.experience-controls{visibility:hidden!important}'});
    // Repeated selection must not duplicate the blueprint.
    await page.getByRole('tab',{name:new RegExp(label,'i')}).click();
    assert.equal(await page.locator('.solution-blueprint').count(),1);
  }
  const firstNode=page.locator('.solution-blueprint__node').first();
  await firstNode.focus();await page.keyboard.press('Enter');
  assert.equal(await firstNode.getAttribute('aria-pressed'),'true');
  await page.locator('#projetos').scrollIntoViewIfNeeded();
  await page.getByRole('tab',{name:/K\.L Transporte/i}).click();
  assert.equal(await page.locator('#projectStage h3').innerText(),'K.L Transporte Express');
  assert.equal(await page.locator('#projectStage a').first().getAttribute('href'),'https://kltransporteexpress.com.br/');
  await capture('05-project');
  await page.locator('#metodo').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#metodo .method-card').count(),4);
  assert.equal(await page.locator('.ot-method-build').count(),1);
  await capture('06-method');
  await page.locator('.method-scene').screenshot({path:`${output}/${name}-method-full.png`,style:'.mobile-header,.mobile-nav,.experience-controls{visibility:hidden!important}'});
  await page.locator('#ecossistema').scrollIntoViewIfNeeded();
  await capture('07-ecosystem');
  if(viewport.width>1100&&!options.reduced)assert.ok(await page.locator('.ot-pulse-network path').count()>0);
  await page.locator('#contato').scrollIntoViewIfNeeded();
  await capture('08-contact');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>+document.querySelector('#earthJourney').dataset.morph===0,{},{timeout:5000});
  assert.equal(+await page.locator('#earthJourney').getAttribute('data-morph'),0);
  if(options.reduced){assert.equal(await page.locator('.earth-journey__canvas').evaluate(e=>getComputedStyle(e).display),'none');}
  assert.deepEqual(errors,[],name+' runtime errors');
  report.push({name,viewport,renderer:earthState.renderer||'static',checks:'passed',errors});
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  console.log(name+': passed');
  await context.close();
}
try{
  await run('desktop',{width:1440,height:900});
  await run('notebook',{width:1366,height:768});
  await run('mobile',{width:390,height:844});
  await run('small-mobile',{width:360,height:780});
  await run('reduced-motion',{width:1440,height:900},{reduced:true});
  await run('no-webgl',{width:1440,height:900},{fallback:true});
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
