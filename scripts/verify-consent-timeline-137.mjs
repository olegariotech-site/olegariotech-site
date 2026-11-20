import assert from 'node:assert/strict';
import {analyzeConsentTimeline} from './analyze-consent-timeline-137.mjs';
const base=1700000000000;
function fixture(at,{cancelled=false,native=true,browser=true,phase='revoke'}={}){
 const endpoint={host:'www.googletagmanager.com',path:'/gtag/js',urlHash:'control'};
 return {consentTimeline:{clock:'fixture Unix epoch ms',events:[
  {type:'decision-write-start',epoch:base,sequence:1,frameId:'parent',next:{analytics:'granted',marketing:'denied'}},
  {type:'decision-effective',epoch:base+1,sequence:2,frameId:'parent'},
  {type:'decision-write-start',epoch:base+100,sequence:3,frameId:'parent',next:{analytics:'denied',marketing:'denied'}},
  {type:'decision-effective',epoch:base+101,sequence:4,frameId:'parent'},
  ...(browser?[{type:'script-insert',epoch:base+at,sequence:1,frameId:'child',endpoint,initiates:true,effective:{analytics:at<100?'granted':'denied',marketing:'denied'}}]:[])
 ],requests:[{id:1,phase,endpoint,frameId:'child',observedEpoch:base+150,endObservedEpoch:base+160,status:cancelled?'failed':'finished',native:{startTime:native?base+at:0}}]}};
}
assert.equal(analyzeConsentTimeline(fixture(80,{cancelled:true})).status,'PASS','Prior request observed/cancelled in refusal phase is still prior');
assert.equal(analyzeConsentTimeline(fixture(120,{cancelled:true})).status,'FAIL','Cancelled post-refusal initiation must fail');
assert.equal(analyzeConsentTimeline(fixture(120,{phase:'grant',cancelled:false})).status,'FAIL','An incorrect phase cannot hide post-refusal initiation');
assert.equal(analyzeConsentTimeline(fixture(120,{cancelled:true,native:false})).status,'FAIL','Matched post-refusal DOM initiation fails even without native timing');
assert.equal(analyzeConsentTimeline(fixture(80,{cancelled:true,native:false})).status,'PASS','Matched prior DOM initiation remains prior, without filtering cancellation');
assert.equal(analyzeConsentTimeline(fixture(120,{cancelled:true,native:false,browser:false})).status,'INCONCLUSIVE','Unknown start is never a silent PASS');
assert.equal(analyzeConsentTimeline(fixture(101,{browser:false})).status,'INCONCLUSIVE','Clock boundary uncertainty never produces PASS');
const sameMillisecond=fixture(120,{cancelled:false});
sameMillisecond.consentTimeline.events.push({type:'decision-write-start',epoch:base+120,sequence:5,frameId:'child',next:{analytics:'granted',marketing:'denied'}},{type:'decision-effective',epoch:base+120,sequence:6,frameId:'child'});
const call=sameMillisecond.consentTimeline.events.find(e=>e.type==='script-insert');call.sequence=7;call.effective={analytics:'granted',marketing:'denied'};call.stored={analytics:'granted',marketing:'denied'};
assert.equal(analyzeConsentTimeline(sameMillisecond).status,'PASS','Completed grant before script in the same document resolves a quantized clock tie');
const laterDenial=structuredClone(sameMillisecond);laterDenial.consentTimeline.events.push({type:'decision-write-start',epoch:base+110,sequence:1,frameId:'other-tab',next:{analytics:'denied',marketing:'denied'}},{type:'decision-effective',epoch:base+111,sequence:2,frameId:'other-tab'});
// Move the other-tab denial after the grant: same-frame history cannot override
// a newer effective refusal elsewhere, regardless of a stale local snapshot.
laterDenial.consentTimeline.events.at(-2).epoch=base+125;laterDenial.consentTimeline.events.at(-1).epoch=base+126;laterDenial.consentTimeline.requests[0].native.startTime=base+140;call.epoch=base+120;
assert.notEqual(analyzeConsentTimeline(laterDenial).status,'PASS','A stale local grant cannot override a later refusal from another tab');
console.log('PASS consent chronology: prior/cancelled, post/cancelled, wrong phase, missing native timing, and unresolved boundary controls');
