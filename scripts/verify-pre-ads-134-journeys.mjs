import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {launch,replay,ready,answer,waClick,snapshot,save,engine,out,ORIGIN,FIXTURE,root,pw} from './qa-pre-ads-134-lib.mjs';
const {default:AxeBuilder}=await import('@axe-core/playwright');
const report={issue:134,engine,journeys:[],accessibility:[],visual:[],network:[]};
let browser;
async function context(width,choice={analytics:'denied',marketing:'denied'},base=root){
 const c=await browser.newContext({viewport:{width,height:width<768?844:900},reducedMotion:'reduce',serviceWorkers:'block'});
 await c.addInitScript(value=>localStorage.setItem('ot_consent_preferences_v2',JSON.stringify(value)),choice);
 await replay(c,{report,base});return c;
}
async function go(page,selector){
 const link=page.locator(selector).filter({visible:true}).first();
 if(!await link.count()&&selector.startsWith('header')&&await page.locator('.ot-service-menu summary').isVisible())await page.locator('.ot-service-menu summary').click();
 await link.click();await page.waitForLoadState('load');await page.waitForFunction(()=>Boolean(window.OTAnalytics));
}
async function geometry(page){
 await page.evaluate(()=>document.fonts.ready);
 if(await page.locator('body[data-page="home"]').count())await page.locator('footer[data-ot-footer-v4="1"]').waitFor();
 return page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.textContent,rects:[...document.querySelectorAll('h1,main h2,.hero-actions,.lc-hero,.ot-hero,.diagnostic-card,header,footer')].map(x=>{const r=x.getBoundingClientRect();return {tag:x.tagName,id:x.id,cls:x.className,x:r.x,y:r.y,width:r.width,height:r.height}})}));
}
try{
 browser=await launch();await mkdir(out,{recursive:true});
 for(const width of [390,1366])for(const city of ['valinhos','campinas'])for(const route of ['direct','footer','via-home','diagnostic-header']){
  const c=await context(width),page=await c.newPage(),row={width,city,route,status:'PASS'};
  try{
   const query='?utm_source=google&utm_medium=cpc&utm_campaign=ot_auditoria&utm_content=cta&utm_term=site&gclid=DO_NOT_FORWARD_134';
   await ready(page,'/criacao-de-sites-'+city+'/'+query);
   if(route==='direct'){
    row.direct=await waClick(page,'main a[href*="wa.me"]');assert.ok(row.direct.includes('OT-GADS-SITES-'+city.toUpperCase()));
    await go(page,'main a[href*="diagnostico-digital"]');
   }else if(route==='footer')await go(page,'.ot-site-footer a[href*="diagnostico-digital"]');
   else if(route==='via-home'){await go(page,'header a[aria-label*="página inicial"]');await go(page,'a[href*="diagnostico-digital"]');}
   else {await go(page,'main a[href*="diagnostico-digital"]');await go(page,'header a[href*="diagnostico-digital"]');}
   const u=new URL(page.url());row.url=u.href;
   for(const [key,value] of Object.entries({utm_source:'google',utm_medium:'cpc',utm_campaign:'ot_auditoria',utm_content:'cta',utm_term:'site',origem:'sites-'+city}))assert.equal(u.searchParams.get(key),value,key+' survives '+route);
   assert.equal(u.searchParams.has('gclid'),false);
   await answer(page);row.draft=await waClick(page);const again=await waClick(page);assert.equal(again,row.draft);
   for(const value of [FIXTURE,'Objetivo:','Estrutura atual:','Google:','WhatsApp:','Dados:','Origem da página: Criação de sites em '+(city==='valinhos'?'Valinhos':'Campinas'),'Referência OT: OT-GADS-SITES-'+city.toUpperCase()])assert.ok(row.draft.includes(value),value);
   assert.equal((row.draft.match(/Referência OT:/g)||[]).length,1);assert.ok(!row.draft.includes('DO_NOT_FORWARD_134'));assert.deepEqual((await snapshot(page)).ga,[]);
   row.capture='journey-'+city+'-'+route+'-'+width+'.png';await page.screenshot({path:resolve(out,row.capture),animations:'disabled'});
  }catch(error){row.status='FAIL';row.failure=error.message;throw error;}finally{report.journeys.push(row);await c.close();await save('journeys.json',report);}
 }
 for(const source of ['google','chatgpt.com'])for(const city of ['valinhos','campinas']){
  const c=await context(390),page=await c.newPage(),row={city,source,route:'negative-paid-claim',status:'PASS'};
  try{await ready(page,'/criacao-de-sites-'+city+'/?utm_source='+source+'&utm_medium='+(source==='google'?'organic':'referral'));await go(page,'.ot-site-footer a[href*="diagnostico-digital"]');await answer(page);row.draft=await waClick(page);assert.ok(!row.draft.includes('Referência OT:'));assert.ok(row.draft.includes('Origem da página: Criação de sites em '+(city==='valinhos'?'Valinhos':'Campinas')));}finally{report.journeys.push(row);await c.close();}
 }
 {
  const c=await context(390),page=await c.newPage();await ready(page,'/?utm_source=google&utm_medium=cpc&utm_campaign=ot_auditoria&gclid=DO_NOT_FORWARD_134');
  await go(page,'a[href*="diagnostico-digital"]');assert.equal(new URL(page.url()).searchParams.get('utm_source'),'google');await answer(page);const text=await waClick(page);assert.ok(!text.includes('OT-GADS-SITES-'));assert.ok(text.includes('Origem da página: Site principal da Olegario Tech'));report.journeys.push({route:'home-entry-unknown-city',status:'PASS',url:page.url()});await c.close();
 }
 for(const origin of ['unknown','https://evil.example/']){
  const c=await context(390),page=await c.newPage();await ready(page,'/diagnostico-digital/?origem='+encodeURIComponent(origin)+'&utm_source=google&utm_medium=cpc');await answer(page);const text=await waClick(page);assert.ok(!text.includes('OT-GADS-SITES-')&&!text.includes('Origem da página:'));report.journeys.push({route:'invalid-origin',origin,status:'PASS'});await c.close();
 }
 for(const width of [360,390]){
  const c=await context(width),page=await c.newPage();await ready(page,'/cookies/');
  const wrapper=page.locator('.table-wrap');assert.equal(await wrapper.getAttribute('tabindex'),'0');assert.equal(await wrapper.getAttribute('role'),'region');
  await wrapper.focus();await wrapper.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.table-wrap').scrollLeft>0);
  assert.equal(await wrapper.evaluate(x=>document.activeElement===x),true);
  assert.equal(await wrapper.evaluate(x=>getComputedStyle(x).outlineStyle),'solid');
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  assert.equal(result.violations.filter(x=>['serious','critical'].includes(x.impact)).length,0);
  const capture='cookies-keyboard-'+width+'.png';await page.screenshot({path:resolve(out,capture)});report.accessibility.push({width,status:'PASS',violations:result.violations,capture});await c.close();
 }
 const before=process.env.OT_134_BEFORE;
 if(before)for(const url of ['/','/criacao-de-sites-valinhos/','/criacao-de-sites-campinas/','/presenca-no-google/','/anuncios-google-instagram/','/diagnostico-digital/'])for(const width of [390,1366]){
  const pair=[];
  for(const [name,base] of [['before',resolve(before)],['after',root]]){
   const c=await context(width,undefined,base),page=await c.newPage();await ready(page,url);const info=await geometry(page);
   const capture='visual-'+(url==='/'?'home':url.replaceAll('/',''))+'-'+width+'-'+name+'.png';await page.screenshot({path:resolve(out,capture),animations:'disabled'});pair.push({info,capture});await c.close();
  }
  assert.equal(pair[0].info.h1,pair[1].info.h1);
  assert.ok(pair[1].info.scroll<=width+2,'No horizontal overflow');
  // Same content/font/layout, including all headings and commercial actions.
  assert.equal(pair[0].info.rects.length,pair[1].info.rects.length);
  for(let i=0;i<pair[0].info.rects.length;i++)for(const axis of ['x','y','width','height'])assert.ok(Math.abs(pair[0].info.rects[i][axis]-pair[1].info.rects[i][axis])<=1,'No geometric redesign '+url+' '+axis);
  report.visual.push({url,width,status:'PASS',before:pair[0],after:pair[1]});await save('journeys.json',report);
 }
 report.status='PASS';console.log(JSON.stringify({status:'PASS',engine,journeys:report.journeys.length,accessibility:report.accessibility.length,visual:report.visual.length}));
}catch(error){report.status='FAIL';report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{await save('journeys.json',report);await browser?.close();}
