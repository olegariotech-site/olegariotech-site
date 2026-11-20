// Diagnostic only: original 1px assertions and required journey gate remain intact.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {launch,replay,ready,root,engine} from './qa-pre-ads-134-lib.mjs';
const base=process.env.OT_134_BEFORE;assert.ok(base,'Published immutable checkout required');
const out=resolve(process.env.OT_137_LAYOUT_OUTPUT||'/tmp/ot-layout-137',engine);await mkdir(out,{recursive:true});
const rows=[],browser=await launch();
async function sample(page){return page.evaluate(()=>{
 const selectors=['h1','.hero-actions','#produtos','.ot-products-teaser__box','#produtos h2','footer'];
 return {at:performance.now(),fonts:{status:document.fonts.status,faces:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status}))},htmlClass:document.documentElement.className,sheets:[...document.styleSheets].map(s=>({href:s.href,id:s.ownerNode.id,disabled:s.disabled,media:s.media.mediaText,rules:(()=>{try{return s.cssRules.length;}catch{return 'cross-origin';}})()})),elements:selectors.map(selector=>{const el=document.querySelector(selector);if(!el)return {selector,missing:true};const s=getComputedStyle(el),r=el.getBoundingClientRect();return {selector,cls:el.className,rect:{x:r.x,y:r.y,width:r.width,height:r.height},style:Object.fromEntries(['display','font-family','font-size','line-height','padding','margin','width','height','transform','animation','transition','grid-template-columns','gap'].map(k=>[k,s.getPropertyValue(k)]))};})};
 });}
try{for(const [index,version] of ['base','candidate','candidate','base'].entries()){
 const report={network:[],version,index,engine,samples:[]};
 const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 await context.addInitScript(()=>localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'})));
 await replay(context,{report,base:version==='base'?resolve(base):root});
 const page=await context.newPage();await ready(page,'/');
 await page.waitForFunction(()=>['ot-v2-css','ot-mobile-v3-css','ot-footer-v4-css'].every(id=>{const link=document.getElementById(id);return link?.sheet?.cssRules.length;}));
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('footer[data-ot-footer-v4="1"]').waitFor();
 report.samples.push({phase:'original-geometry',...(await sample(page))});
 await page.screenshot({path:resolve(out,index+'-'+version+'.png'),animations:'disabled'});
 report.samples.push({phase:'after-original-screenshot',...(await sample(page))});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 report.samples.push({phase:'two-animation-frames',...(await sample(page))});
 // CSSOM can be present before a rendering update; this diagnostic records both states.
 rows.push(report);await writeFile(resolve(out,'layout.json'),JSON.stringify({engine,rows},null,2));
 console.log(JSON.stringify({version,index,samples:report.samples.map(s=>({phase:s.phase,at:s.at,fonts:s.fonts.status,elements:s.elements}))}));
 await context.close();
}}finally{await browser.close();}
