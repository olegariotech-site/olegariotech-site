// Real candidate, no external network or real leads; screenshots of exercised states.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyApprovedGastroScope} from './verify-gastro-scope.mjs';
import {PNG} from 'pngjs';
import jsQR from 'jsqr';
import {default as AxeBuilder} from '@axe-core/playwright';
import * as pw from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url)),out=process.env.OT_GASTRO_OUTPUT||'/tmp/ot-gastro-qa',engine=process.env.OT_GASTRO_ENGINE||'chromium';
const dest='https://olegariotech-site.github.io/ot-cardapio-3d/';
const report={scope:verifyApprovedGastroScope(),engine,cases:[]};
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2','.ico':'image/x-icon'};
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{let p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));assert.ok(p===resolve(root)||p.startsWith(resolve(root)+'/'));if((await stat(p)).isDirectory())p=resolve(p,'index.html');res.setHeader('Content-Type',types[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await pw[engine].launch();
 for(const width of [360,390,768,1366]){
  const c=await browser.newContext({viewport:{width,height:width<768?844:900},reducedMotion:'reduce',serviceWorkers:'block',deviceScaleFactor:2});
  const outbound=[],errors=[],missing=[];
  await c.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();outbound.push(u.href);return route.fulfill({status:200,contentType:'text/plain',body:''});});
  await c.addInitScript(()=>{localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__gastroCopied=text;}}});Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__gastroShared=data;}});});
  const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)missing.push(r.url())});
  assert.equal((await page.goto(origin+'/#cardapio-3d',{waitUntil:'load'})).status(),200);
  const section=page.locator('#cardapio-3d');assert.equal(await section.count(),1);await section.scrollIntoViewIfNeeded();
  await page.evaluate(()=>document.fonts.ready);
  for(const im of await section.locator('img').all()){await im.scrollIntoViewIfNeeded();await im.evaluate(e=>e.decode());assert.ok(await im.evaluate(e=>e.naturalWidth>0));}
  assert.equal(await section.locator('.ot-gastro__gallery figure').count(),3);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'No full-page horizontal overflow');
  const direct=section.locator('.ot-gastro__primary'),wa=section.locator('.ot-gastro__secondary'),qr=section.locator('.ot-gastro__qr img');
  assert.equal(await direct.getAttribute('href'),dest);assert.equal(await direct.getAttribute('target'),'_blank');assert.equal(await direct.getAttribute('rel'),'noopener noreferrer');
  assert.equal(new URL(await wa.getAttribute('href')).pathname,'/5511912459144');assert.match(new URL(await wa.getAttribute('href')).searchParams.get('text'),/Cardápio 3D/);
  await qr.evaluate(e=>e.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const qrBytes=await qr.screenshot({animations:'disabled'});await writeFile(resolve(out,'qr-'+width+'.png'),qrBytes);const png=PNG.sync.read(qrBytes);const decoded=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);assert.equal(decoded?.data,dest,'Actual rendered QR decodes');
  await section.locator('[data-gastro-copy]').click();assert.equal(await page.evaluate(()=>window.__gastroCopied),dest);
  await section.locator('[data-gastro-share]').click();assert.equal(await page.evaluate(()=>window.__gastroShared.url),dest);
  await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});window.__gastroCopied='';});await section.locator('[data-gastro-share]').click();assert.equal(await page.evaluate(()=>window.__gastroCopied),dest);
  await section.locator('summary').click();assert.ok(await section.locator('details').evaluate(e=>e.open));
  const axe=await new AxeBuilder({page}).include('#cardapio-3d').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],'Showcase accessibility');
  await section.locator('summary').click();
  await section.screenshot({path:resolve(out,'showcase-'+width+'.png'),animations:'disabled'});
  const popupPromise=page.waitForEvent('popup');await direct.click();const popup=await popupPromise;await popup.waitForLoadState();assert.equal(popup.url(),dest);assert.equal(await popup.evaluate(()=>window.opener),null);await popup.close();
  assert.deepEqual(outbound.filter(u=>/googletagmanager|google-analytics|facebook\.com|facebook\.net/i.test(u)),[],'Denied consent: no optional SDK requests');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  report.cases.push({width,qr:decoded.data,copy:true,share:true,shareFallback:true,actualPopup:true,accessibility:true,overflow:false});await c.close();
 }
 const c=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());const page=await c.newPage();await page.goto(origin+'/#cardapio-3d');assert.equal(await page.locator('.ot-gastro__primary').getAttribute('href'),dest);assert.equal(await page.locator('[data-gastro-copy]').isVisible(),false);assert.equal(await page.locator('[data-gastro-url]').inputValue(),dest);await c.close();report.noJS=true;report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;console.error(e);process.exitCode=1;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
