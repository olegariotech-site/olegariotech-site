import {assertConsentTimeline} from './analyze-consent-timeline-137.mjs';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {mkdir} from 'node:fs/promises';
import {hostWithin} from './qa-hostname.mjs';
import {launch,replay,ready,answer,waClick,preferences,snapshot,settled,save,engine,out,FIXTURE,pw,ORIGIN,labelPage} from './qa-pre-ads-134-lib.mjs';

const report={issue:137,engine,phase:'fresh',checks:[],network:[],errors:[],noProductionWrites:true};
let browser;
const events=()=>report.network.filter(x=>(hostWithin(x.host,'google-analytics.com')||hostWithin(x.host,'doubleclick.net'))&&x.path==='/g/collect').flatMap(x=>x.eventRecords.filter(e=>e.measurementId==='G-0YXCH58MXD').map(e=>({...e,document:x.documentLabel,phase:x.phase})));
const count=(name,document)=>events().filter(e=>e.name===name&&(!document||e.document===document)).length;
async function observed(name,document,n){
  const deadline=Date.now()+45000;
  while(count(name,document)<n&&Date.now()<deadline)await settled(report,250);
  assert.equal(count(name,document),n,'Actual collected '+name+' for '+document);
}
async function noFrames(...pages){
  for(const page of pages)await page.waitForFunction(()=>window.OTAnalytics.getConsent()?.analytics==='denied'&&!document.querySelector('#ot-ga4-frame'));
  for(const page of pages)assert.equal((await snapshot(page)).gaDisabled,true);
}
async function openSettings(page){await page.bringToFront();const footer=page.locator('[data-footer-cookie-settings]').filter({visible:true});if(await footer.count())await footer.first().click();else await page.locator('#otConsentSettings').click();await settled(report,2500);}
async function navigated(page){await page.waitForLoadState('load');await page.waitForFunction(()=>Boolean(window.OTAnalytics));}
try{
  browser=await launch();report.browser=browser.version();
  const profile=engine==='webkit'?pw.devices['iPhone 13']:engine==='chromium'?pw.devices['Pixel 7']:{viewport:{width:390,height:844}};
  const context=await browser.newContext({...profile,reducedMotion:'reduce',serviceWorkers:'block'});
  await replay(context,{real:true,report});
  const a=await context.newPage();labelPage(a,'home-first');a.on('pageerror',e=>report.errors.push(e.message));
  await ready(a,'/?utm_source=google&utm_medium=cpc&utm_campaign=ot_auditoria&debug_analytics=1');
  await settled(report,500);assert.equal(report.optionalRequests.length,0);assert.equal(report.network.length,0);
  report.phase='grant-home';await preferences(a,true,false);await observed('page_view','home-first',1);
  const cookieBefore=(await context.cookies(ORIGIN)).find(x=>x.name==='_ga')?.value;assert.ok(cookieBefore);

  report.phase='second-tab';const b=await context.newPage();labelPage(b,'diagnostic-first');b.on('pageerror',e=>report.errors.push(e.message));
  await ready(b,'/diagnostico-digital/?origem=sites-valinhos&utm_source=google&utm_medium=cpc&utm_campaign=ot_auditoria&debug_analytics=1');
  await observed('page_view','diagnostic-first',1);
  assert.deepEqual((await snapshot(b)).consent,{analytics:'granted',marketing:'denied'});
  report.sameFirstPartyCookieAcrossTabs=(await context.cookies(ORIGIN)).find(x=>x.name==='_ga')?.value===cookieBefore;
  assert.equal(report.sameFirstPartyCookieAcrossTabs,true); // Compare only; do not retain identifiers.
  await b.bringToFront();await answer(b);const firstDraft=await waClick(b);
  assert.ok(firstDraft.includes(FIXTURE)&&firstDraft.includes('OT-GADS-SITES-VALINHOS'));
  for(const event of ['diagnostico_inicio','diagnostico_concluido','click_whatsapp'])await observed(event,'diagnostic-first',1);
  report.checks.push('Two real documents share choice/session; each has one page_view and the diagnostic events arrive once');

  report.phase='open-before-revoke';await openSettings(a);
  report.phase='revoke-cross-tab';await a.locator('[data-consent-reject]').click();await noFrames(a,b);
  await b.bringToFront();assert.equal(await waClick(b),firstDraft);
  await b.evaluate(()=>{scrollTo(0,0);scrollTo(0,document.body.scrollHeight)});await settled(report,6500);
  assert.equal(report.network.filter(x=>x.phase==='revoke-cross-tab').length+report.optionalRequests.filter(x=>x.phase==='revoke-cross-tab').length,0,'No optional request after choice propagates across tabs');
  assert.equal((await context.cookies(ORIGIN)).filter(x=>x.name==='_ga'||x.name.startsWith('_ga_')).length,0);
  report.checks.push('Revocation in one tab removes both loaded SDK frames, clears cookies and suppresses new interactions');

  report.phase='reauthorize';await preferences(b,true,false);
  await a.waitForFunction(()=>window.OTAnalytics.getConsent()?.analytics==='granted'&&Boolean(document.querySelector('#ot-ga4-frame')));
  assert.equal(await waClick(b),firstDraft);await observed('click_whatsapp','diagnostic-first',2);await settled(report,2000);
  assert.equal(count('page_view','home-first'),1);assert.equal(count('page_view','diagnostic-first'),1);
  assert.equal(count('diagnostico_inicio','diagnostic-first'),1);assert.equal(count('diagnostico_concluido','diagnostic-first'),1);
  for(const page of [a,b])assert.equal((await snapshot(page)).configs,1);
  report.checks.push('Reauthorization restores real intent collection without repeating page_view or diagnostic completion');

  report.phase='internal-home';labelPage(b,'home-return');
  await b.locator('header a[aria-label*="página inicial"]').filter({visible:true}).first().click();await b.waitForURL(u=>u.pathname==='/');await navigated(b);
  await observed('page_view','home-return',1);assert.equal(new URL(b.url()).searchParams.get('utm_source'),'google');
  report.phase='internal-diagnostic';labelPage(b,'diagnostic-return');
  await b.locator('#inicio .btn-primary').click();await b.waitForURL(u=>u.pathname==='/diagnostico-digital/');await navigated(b);
  await observed('page_view','diagnostic-return',1);await answer(b);assert.ok((await waClick(b)).includes(FIXTURE));
  for(const event of ['diagnostico_inicio','diagnostico_concluido','click_whatsapp'])await observed(event,'diagnostic-return',1);
  await settled(report,2000);
  for(const label of ['home-first','diagnostic-first','home-return','diagnostic-return'])assert.equal(count('page_view',label),1,'No duplicate page_view in '+label);
  assert.equal(count('page_view'),4);assert.equal(count('diagnostico_inicio'),2);assert.equal(count('diagnostico_concluido'),2);assert.equal(count('click_whatsapp'),3);
  report.eventCounts=Object.fromEntries(['page_view','click_whatsapp','diagnostico_inicio','diagnostico_concluido'].map(name=>[name,count(name)]));
  report.checks.push('Internal navigation/revisit creates exactly one page_view per new document and one start/finish per completed new quiz');

  report.phase='open-final-revoke';await openSettings(a);report.phase='final-refusal';await a.locator('[data-consent-reject]').click();await noFrames(a,b);
  labelPage(b,'denied-reload');await b.reload();await b.waitForFunction(()=>Boolean(window.OTAnalytics));await settled(report,6000);
  assert.equal((await snapshot(b)).googleFrames,0);assert.equal(count('page_view','denied-reload'),0);
  assert.equal(report.network.filter(x=>x.phase==='final-refusal').length+report.optionalRequests.filter(x=>x.phase==='final-refusal').length,0);
  assert.ok(!report.network.some(x=>x.containsFixture||x.containsWhatsAppDraft));
  assert.ok(!events().some(x=>x.name==='generate_lead'));
  assert.ok(!report.libraries.some(x=>x.url.includes('facebook')),'Independent marketing refusal persists across all documents');
  assert.ok(report.libraries.some(x=>x.url.includes('/gtag/js')&&x.status===200&&x.bytes>10000));
  assert.deepEqual(report.errors,[]);
  report.checks.push('Second revocation and reload remain denied; no PII, false lead or marketing collection');
  await mkdir(out,{recursive:true});await b.screenshot({path:resolve(out,'ga4-denied-reload-137.png'),animations:'disabled'});
  report.events=events();report.auxiliaryConversionAttempts=report.network.filter(x=>hostWithin(x.host,'googlesyndication.com')&&x.path==='/measurement/conversion').map(x=>({phase:x.phase,document:x.documentLabel,events:x.events,blocked:x.blockedBeforeCollection}));assertConsentTimeline(report);report.status='PASS';console.log(JSON.stringify({status:'PASS',engine,checks:report.checks,eventCounts:report.eventCounts},null,2));
}catch(error){report.status='FAIL';report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{await save('ga4-consent-137.json',report);await browser?.close();}
