// Real-browser negative controls. The deliberately invalid request is aborted,
// never counted as candidate behaviour and MUST be rejected despite cancellation.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {launch,replay,ready,preferences,settled,save,engine} from './qa-pre-ads-134-lib.mjs';
import {analyzeConsentTimeline} from './analyze-consent-timeline-137.mjs';
const report={issue:137,engine,phase:'initial',fixtureOnly:true,network:[],controls:[]};let browser;
const loader=kind=>'https://www.googletagmanager.com/gtag/js?id=G-0YXCH58MXD&ot_qa_control='+kind;
const hash=value=>createHash('sha256').update(value).digest('hex');
try{
 browser=await launch();const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});await replay(context,{real:true,report});
 const p=await context.newPage();await ready(p,'/diagnostico-digital/');await preferences(p,true,false);await settled(report,8000);
 assert.ok(report.libraries.some(x=>x.url.includes('/gtag/js')&&x.status===200&&x.bytes>10000),'Positive setup loads the real SDK');
 let release;const pending=new Promise(r=>release=r);
 await context.route('https://www.googletagmanager.com/gtag/js?**',async route=>{
  const u=new URL(route.request().url());if(!u.searchParams.has('ot_qa_control'))return route.fallback();
  if(u.searchParams.get('ot_qa_control')==='prior')await pending;
  try{await route.abort('aborted');}catch(error){report.routeCancellation=error.message;}
 });
 report.phase='revoke-observation-before-action';
 const prior=loader('prior');await p.locator('#ot-ga4-frame').evaluate((frame,url)=>{const s=frame.contentDocument.createElement('script');s.src=url;frame.contentDocument.head.appendChild(s);},prior);
 await p.waitForTimeout(200);assert.ok(report.consentTimeline.requests.some(x=>x.endpoint.urlHash===hash(prior)));
 await p.locator('#otConsentSettings').click();await p.locator('[data-consent-reject]').click();release();await settled(report,1000);
 const old=report.consentTimeline.requests.find(x=>x.endpoint.urlHash===hash(prior));assert.equal(old.status,'failed','Prior load is cancelled on frame disposal');
 let analyzed=analyzeConsentTimeline(report),row=analyzed.requests.find(x=>x.id===old.id);assert.equal(row.finding,'allowed','An earlier request remains earlier, although observed in the refusal phase and cancelled later');report.controls.push({name:'prior-cancelled-request-in-revoke-phase',expected:'allowed',actual:row});
 // Direct script injection is a negative fixture, not the application loader.
 const negative=await context.newPage();await ready(negative,'/diagnostico-digital/');
 assert.equal(await negative.evaluate(()=>window.OTAnalytics.getConsent().analytics),'denied');
 const after=loader('after');await negative.evaluate(url=>{const s=document.createElement('script');s.src=url;document.head.appendChild(s);},after);await settled(report,1000);
 analyzed=analyzeConsentTimeline(report);const bad=report.consentTimeline.requests.find(x=>x.endpoint.urlHash===hash(after));assert.ok(bad);row=analyzed.requests.find(x=>x.id===bad.id);assert.equal(bad.status,'failed');assert.equal(row.finding,'violation','A new post-refusal request must fail even when immediately cancelled');report.controls.push({name:'post-refusal-cancelled-request',expected:'violation',actual:row});
 report.status='PASS';console.log(JSON.stringify({status:report.status,engine,controls:report.controls.map(x=>({name:x.name,actual:x.actual.finding}))}));
}catch(error){report.status='FAIL';report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{await browser?.close();await save('temporal-controls-137.json',report);}
