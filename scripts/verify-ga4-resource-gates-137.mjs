// Real SDK first; deliberately late DOM/transport probes stay inside its empty iframe.
// These are regression fixtures, not claims that a customer performed these calls.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {launch,replay,ready,preferences,settled,save,engine,collections,root} from './qa-pre-ads-134-lib.mjs';
import {assertConsentTimeline} from './analyze-consent-timeline-137.mjs';
const report={issue:137,engine,fixtureOnly:true,status:'RUNNING',checks:[],modes:[]};let browser;
const sha=value=>createHash('sha256').update(value).digest('hex');
try{
 browser=await launch();
 for(const mode of ['explicit-stop','shared-storage-race']){
  const libraryStart=report.libraries?.length||0;
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
  await replay(context,{real:true,report,base:process.env.OT_GUARD137_BASE||root});
  const page=await context.newPage();report.phase=mode+'-grant';await ready(page,'/diagnostico-digital/');await preferences(page,true,false);await settled(report,8000);
  assert.ok(report.libraries.slice(libraryStart).some(r=>r.url.includes('/gtag/js')&&r.status===200&&r.bytes>10000),'Real Google SDK positive setup must finish');
  const pv=()=>collections(report).flatMap(r=>r.eventRecords||[]).filter(e=>e.name==='page_view').length;
  const beforePV=pv();report.phase=mode+'-denied-probe';
  const proof=await page.locator('#ot-ga4-frame').evaluate(async(frame,mode)=>{
   const w=frame.contentWindow,d=frame.contentDocument,urls=[];
   const url=kind=>{const value='https://www.googletagmanager.com/gtag/js?id=G-0YXCH58MXD&ot_qa_gate='+kind;urls.push(value);return value;};
   const connected=d.createElement('script');d.head.appendChild(connected);
   const anchor=d.createElement('meta');d.head.appendChild(anchor);
   const fragment=d.createElement('template');fragment.innerHTML='<script src="'+url('parser-fragment')+'"><\/script>';
   if(mode==='explicit-stop')w.OTGoogleMeasurement.stop();
   else w.localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
   const parentChoiceBeforeAPIs=w.parent.OTAnalytics.getConsent(),storedAfterWrite=JSON.parse(w.localStorage.getItem('ot_consent_preferences_v2'));
   let s=d.createElement('script');s.src=url('property-append');d.head.appendChild(s);
   s=d.createElement('script');s.setAttribute('src',url('attribute-insert'));d.head.insertBefore(s,d.head.firstChild);
   d.head.replaceChild(fragment.content,anchor);
   const parser=d.createElement('template');parser.innerHTML='<script src="'+url('parser-append')+'"><\/script>';d.head.append(parser.content);
   connected.src=url('connected-property');connected.setAttribute('src',url('connected-attribute'));connected.setAttributeNS(null,'src',url('connected-attribute-ns'));
   const image=new w.Image();image.src=url('image-property');image.setAttribute('src',url('image-attribute'));image.setAttributeNS(null,'src',url('image-attribute-ns'));
   const collect=kind=>{const value='https://www.google-analytics.com/g/collect?ot_qa_gate='+kind;urls.push(value);return value;};
   const beaconReturn=w.navigator.sendBeacon(collect('beacon'),'fixture');
   const xhr=new w.XMLHttpRequest();xhr.open('POST',collect('xhr'));xhr.send('fixture');
   const response=await w.fetch(collect('fetch'),{method:'POST',body:'fixture'});
   return {urls,parentChoiceBeforeAPIs,storedAfterWrite,beaconReturn,fetchStatus:response.status};
  },mode);
  assert.equal(proof.parentChoiceBeforeAPIs.analytics,'granted','Probe executes before the parent receives the shared storage event');
  if(mode==='shared-storage-race')assert.equal(proof.storedAfterWrite.analytics,'denied','Persisted refusal is already effective before the parent storage handler');
  await settled(report,1200);
  const hashes=new Set(proof.urls.map(sha)),attempts=report.consentTimeline.requests.filter(r=>hashes.has(r.endpoint.urlHash));
  report.modes.push({mode,parentChoiceBeforeAPIs:proof.parentChoiceBeforeAPIs,storedAfterWrite:proof.storedAfterWrite,probeCount:hashes.size,attempts:attempts.map(r=>({id:r.id,endpoint:r.endpoint,status:r.status})),beaconReturn:proof.beaconReturn,fetchStatus:proof.fetchStatus});
  assert.deepEqual(attempts,[],'No post-revocation script or transport initiation from the late-SDK regression fixtures');
  assert.equal(proof.beaconReturn,false);assert.equal(proof.fetchStatus,204);
  if(mode==='shared-storage-race'){
   await page.waitForFunction(()=>!document.querySelector('#ot-ga4-frame'));
   assertConsentTimeline(report);
   report.phase='guard-reauthorize';const libraries=report.libraries.length;await preferences(page,true,false);await settled(report,8000);
   report.reauthorization={librariesBefore:libraries,librariesAfter:report.libraries.length,vendorFailures:report.vendorFailures,optionalRequests:report.optionalRequests,frames:await page.locator('#ot-ga4-frame').count(),state:await page.evaluate(()=>{const f=document.querySelector('#ot-ga4-frame');return {choice:window.OTAnalytics.getConsent(),stored:localStorage.getItem('ot_consent_preferences_v2'),frameURL:f?.contentWindow.location.href,ready:f?.contentDocument.readyState,googleGlobals:Object.keys(f?.contentWindow.google_tag_manager||{}),sdkResourceTiming:f?.contentWindow.performance.getEntriesByType('resource').filter(r=>r.name.includes('googletagmanager.com/gtag/js')).map(r=>({start:r.startTime,end:r.responseEnd,transferSize:r.transferSize,decodedBodySize:r.decodedBodySize}))};})};
   assert.ok(report.reauthorization.state.googleGlobals.includes('G-0YXCH58MXD'),'The real Google container executes in the newly authorized iframe');
   const clicks=()=>collections(report).flatMap(r=>r.eventRecords||[]).filter(e=>e.name==='click_whatsapp').length,priorClicks=clicks();
   const collected=page.waitForRequest(request=>{const u=new URL(request.url());if(!['www.google-analytics.com','region1.google-analytics.com','google-analytics.com'].includes(u.hostname))return false;return (request.postData()||'').split('\n').some(line=>new URLSearchParams(u.search.slice(1)+'&'+line).get('en')==='click_whatsapp');});
   await page.evaluate(()=>window.OTAnalytics.track('click_whatsapp',{cta_text:'Teste fictício QA',cta_location:'resource_guard_137',destination_url:'https://wa.me/5511912459144'}));
   await collected;await settled(report,1200);
   assert.equal(clicks(),priorClicks+1,'Reauthorization restores exactly one real SDK commercial event, with the collector intercepted');
   assertConsentTimeline(report);
   assert.equal(pv(),beforePV,'Reauthorization does not duplicate page_view');
   assert.equal(await page.locator('#ot-ga4-frame').count(),1);
   report.phase='guard-analytics-only-policy';
   const forbidden=await page.locator('#ot-ga4-frame').evaluate(async frame=>{
    const w=frame.contentWindow,d=frame.contentDocument,urls=[
     'https://pagead2.googlesyndication.com/measurement/conversion?ot_qa_policy=fetch',
     'https://www.googleadservices.com/pagead/conversion/1/?ot_qa_policy=beacon',
     'https://stats.g.doubleclick.net/g/collect?ot_qa_policy=xhr',
     'https://www.google-analytics.com.evil.example/g/collect?ot_qa_policy=lookalike',
     'https://www.googletagmanager.com.evil.example/gtag/js?ot_qa_policy=script'
    ];
    await w.fetch(urls[0],{method:'POST',body:'fixture'});w.navigator.sendBeacon(urls[1],'fixture');
    const xhr=new w.XMLHttpRequest();xhr.open('POST',urls[2]);xhr.send('fixture');
    const image=new w.Image();image.src=urls[3];
    const script=d.createElement('script');script.src=urls[4];d.head.appendChild(script);return urls;
   });
   await settled(report,1000);
   const forbiddenHashes=new Set(forbidden.map(sha));
   report.policyAttempts=report.consentTimeline.requests.filter(r=>forbiddenHashes.has(r.endpoint.urlHash));
   assert.deepEqual(report.policyAttempts,[],'Analytics consent never authorizes advertising collectors or lookalike domains');
  }
  report.checks.push(mode+': 13 late resource/transport probes blocked before any native request');
  await context.close();
 }
 report.status='PASS';console.log(JSON.stringify({engine,status:report.status,modes:report.modes,checks:report.checks}));
}catch(error){report.status='FAIL';report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{await browser?.close();await save('ga4-resource-gates-137.json',report);}
