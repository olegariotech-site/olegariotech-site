// First-visit mobile conversion + privacy, exact published review excerpts and contrast regression.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const pw=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');const {default:AxeBuilder}=await import(process.env.OT_AXE_MODULE||'@axe-core/playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),before=process.env.OT_V3_BEFORE_DIR,output=process.env.OT_FINAL_OUTPUT||'/tmp/ot-v3-final-qa';assert.ok(before,'OT_V3_BEFORE_DIR must be the immutable d89b56b checkout');await mkdir(output,{recursive:true});
const servers=[],urls={},fonts=new Map(),results=[];
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
for(const [variant,directory]of Object.entries({before:resolve(before),after:root})){const s=createServer(async(req,res)=>{try{let f=resolve(directory,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(f!==directory&&!f.startsWith(directory+'/'))throw Error('Outside root');if((await stat(f)).isDirectory())f+='/index.html';res.setHeader('Content-Type',types[extname(f)]||'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404);res.end();}});await new Promise(r=>s.listen(0,'127.0.0.1',r));servers.push(s);urls[variant]=`http://127.0.0.1:${s.address().port}`;}
async function configure(c){await c.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{const url=route.request().url();try{if(!fonts.has(url)){const r=await fetch(url,{signal:AbortSignal.timeout(20000)});assert.ok(r.ok);fonts.set(url,{body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')});}await route.fulfill(fonts.get(url));}catch{await route.abort();}});await c.route(/https:\/\/(www\.googletagmanager\.com|connect\.facebook\.net)\//,r=>r.fulfill({contentType:'application/javascript',body:''}));}
async function ready(p,url){assert.equal((await p.goto(url,{waitUntil:'networkidle'})).status(),200);await p.locator('#otConsent.is-visible').waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(350);}
try{
for(const engine of (process.env.OT_QA_ENGINES||'chromium,webkit,firefox').split(',')){
 const b=await pw[engine].launch();try{
 for(const width of [360,390,430])for(const variant of ['before','after']){
  const c=await b.newContext({viewport:{width,height:844},hasTouch:true,isMobile:engine!=='firefox'});await configure(c);const p=await c.newPage(),tags=[],errors=[];c.on('request',r=>{if(/googletagmanager|connect\.facebook/.test(r.url()))tags.push(r.url())});p.on('pageerror',e=>errors.push(e.message));
  await ready(p,urls[variant]);assert.deepEqual(tags,[],'no optional tag before consent');
  const initial=await p.evaluate(()=>{const c=document.querySelector('#inicio .btn-primary'),b=document.querySelector('#otConsent'),r=c.getBoundingClientRect(),br=b.getBoundingClientRect();return{cta:r.toJSON(),banner:br.toJSON(),visibleCTA:r.top>=0&&r.bottom<=innerHeight-66,ctaHit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a')===c,policy:document.querySelector('#otConsentText').innerText,role:b.getAttribute('role'),position:getComputedStyle(b).position};});
  if(engine==='chromium'){await p.screenshot({path:`${output}/${variant}-first-${width}.png`});await p.locator('#otConsent').screenshot({path:`${output}/${variant}-notice-${width}.png`});}
  if(variant==='after'){
   assert.equal(initial.ctaHit,true,'diagnosis CTA unobstructed on first visit');assert.equal(initial.visibleCTA,true,'diagnosis CTA fits first viewport');assert.equal(initial.role,'region');assert.equal(initial.position,'relative');assert.ok(initial.banner.y>=initial.cta.bottom);
   const reject=await p.locator('[data-consent-reject]').boundingBox(),accept=await p.locator('[data-consent-accept]').boundingBox();assert.ok(reject.height>=44&&accept.height>=44);assert.ok(Math.abs(reject.width-accept.width)<2,'equal accept/reject hit targets');
   assert.equal(initial.policy,'Análise e marketing são opcionais. O Google Analytics e o Pixel da Meta só carregam nas categorias autorizadas.');
   await p.locator('[data-consent-reject]').focus();await p.keyboard.press('Tab');assert.equal(await p.locator('[data-consent-accept]').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Tab');assert.equal(await p.locator('[data-consent-customize]').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Enter');assert.equal(await p.locator('[data-consent-analytics]').evaluate(e=>e===document.activeElement),true);assert.equal(await p.locator('[data-consent-analytics]').isChecked(),false);assert.equal(await p.locator('[data-consent-marketing]').isChecked(),false);
   await p.keyboard.press('Escape');assert.equal(await p.locator('[data-consent-customize]').getAttribute('aria-expanded'),'false');assert.equal(await p.evaluate(()=>localStorage.getItem('ot_consent_preferences_v2')),null,'Escape is not consent');
   // Conversion remains usable without accepting or rejecting cookies.
   await p.locator('#inicio .btn-primary').click();await p.waitForURL('**/diagnostico-digital/**');assert.match(await p.title(),/Diagnóstico/i);assert.deepEqual(tags,[],'visiting diagnosis does not authorize tags');
   await p.goto(urls.after,{waitUntil:'networkidle'});await p.locator('#otConsent.is-visible').waitFor();await p.locator('[data-consent-reject]').click();await p.locator('#otConsent').waitFor({state:'hidden'});
   await p.locator('[data-footer-cookie-settings]').click();assert.equal(await p.locator('#otConsent').getAttribute('role'),'dialog');assert.equal(await p.locator('#otConsent').evaluate(e=>getComputedStyle(e).position),'fixed');await p.locator('[data-consent-customize]').click();await p.locator('[data-consent-analytics]').check();await p.locator('[data-consent-save]').click();assert.equal(tags.some(u=>u.includes('googletagmanager')),true);assert.equal(tags.some(u=>u.includes('connect.facebook')),false);assert.equal(await p.locator('[data-footer-cookie-settings]').evaluate(e=>e===document.activeElement),true);
   await p.locator('[data-footer-cookie-settings]').click();await p.locator('[data-consent-reject]').click();
   await p.evaluate(()=>document.documentElement.style.scrollBehavior='auto');for(let y=0;y<await p.evaluate(()=>document.body.scrollHeight);y+=650){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(60);}
   const axe=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],'known contrast defects fixed; no automatic violations');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);assert.deepEqual(errors,[]);
  }
  results.push({engine,version:b.version(),variant,width,initial,errors});await c.close();await writeFile(`${output}/mobile.json`,JSON.stringify(results,null,2));console.log(`${engine}/${variant}/${width}: PASS`);
 }
 }finally{await b.close();}
}
}finally{for(const s of servers)s.close();await writeFile(`${output}/mobile.json`,JSON.stringify(results,null,2));}
