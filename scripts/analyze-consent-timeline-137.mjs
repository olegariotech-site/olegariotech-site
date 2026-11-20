// A cancelled request is judged by initiation, exactly like a completed one.
import {hostWithin} from './qa-hostname.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

export function analyzeConsentTimeline(report){
 const trace=report.consentTimeline;if(!trace)throw Error('Causal trace required');
 const events=[...trace.events].sort((a,b)=>a.epoch-b.epoch||a.sequence-b.sequence);
 const writes=events.filter(e=>e.type==='decision-write-start'&&e.next);
 const decisions=writes.map(start=>{const commit=events.find(e=>e.type==='decision-effective'&&e.frameId===start.frameId&&e.documentId===start.documentId&&e.sequence===start.sequence+1);return {start:start.epoch,commit:commit?.epoch??null,startSequence:start.sequence,commitSequence:commit?.sequence??null,next:start.next,frameId:start.frameId,documentId:start.documentId};});
 const usedInitiators=new Set();
 const result={clock:trace.clock,resolutionGuardMs:2,decisions,requests:[],violations:[],inconclusive:[]};
 for(const request of trace.requests){
  const host=request.endpoint.host;
  const category=hostWithin(host,'facebook.com')||hostWithin(host,'facebook.net')?'marketing':'analytics';
  const lower=writes.find(e=>e.next[category]==='denied');
  if(!lower)continue;
  const native=request.native?.startTime>1e12?request.native.startTime:null;
  const eligible=events.filter(e=>e.initiates===true&&!usedInitiators.has(e)&&e.endpoint?.urlHash===request.endpoint.urlHash&&e.frameId===request.frameId&&e.epoch<= (native??request.observedEpoch)+2);
  const initiation=eligible.at(-1)||null;if(initiation)usedInitiators.add(initiation);
  const times=[native,initiation?.epoch].filter(x=>Number.isFinite(x));
  const first=times.length?Math.min(...times):null,last=times.length?Math.max(...times):null;
  let finding='allowed',reason='Initiation outside an effective refusal interval';
  if(first===null){finding='inconclusive';reason='No native start or matched browser initiator';}
  else for(let i=0;i<decisions.length;i++){
   const denial=decisions[i];if(denial.next[category]!=='denied')continue;
   const grant=decisions.slice(i+1).find(e=>e.next[category]==='granted');
   if(last<denial.start-2||grant&&grant.commit!==null&&first>grant.commit+2)continue;
   // Resolve quantized equal-millisecond reauthorization using same-document
   // program order, never the request's status. Other denial intervals are
   // still checked, including decisions coming from another tab.
   const sameDocument=grant&&initiation&&(grant.documentId&&initiation.documentId?grant.documentId===initiation.documentId:!events.some(e=>e.type==='document-init'&&e.frameId===initiation.frameId&&e.epoch>=grant.start-2&&e.epoch<=initiation.epoch+2));
   if(grant&&initiation&&sameDocument&&grant.start<=initiation.epoch&&grant.frameId===initiation.frameId&&grant.commitSequence!==null&&grant.commitSequence<initiation.sequence&&initiation.stored?.[category]==='granted'&&initiation.effective?.[category]==='granted')continue;
   if(denial.commit!==null&&first>denial.commit+2&&(!grant||last<grant.start-2)){
    finding='violation';reason='New optional initiation while consent is effectively denied';break;
   }
   if(first<=denial.start+2&&last>=denial.start-2||denial.commit===null||grant&&first<=grant.commit+2&&last>=grant.start-2){
    finding='inconclusive';reason='Initiation overlaps the decision/resolution boundary';
   }
  }
  // A direct parent/own effective denial at a browser API call is independently
  // conclusive, even when clock quantization puts the call on a boundary.
  if(initiation?.effective?.[category]==='denied'){
   finding='violation';reason='Browser initiator observed the effective choice as denied';
  }
  const row={id:request.id,endpoint:request.endpoint,phase:request.phase,frameId:request.frameId,category,nativeStartEpoch:native,browserInitiationEpoch:initiation?.epoch??null,initiator:initiation?.type??null,observedEpoch:request.observedEpoch,endObservedEpoch:request.endObservedEpoch,status:request.status,finding,reason};
  result.requests.push(row);if(finding==='violation')result.violations.push(row);if(finding==='inconclusive')result.inconclusive.push(row);
 }
 result.status=result.violations.length?'FAIL':result.inconclusive.length?'INCONCLUSIVE':'PASS';return result;
}
export function assertConsentTimeline(report){
 const result=analyzeConsentTimeline(report);report.causalConsent=result;
 assert.deepEqual(result.violations,[],'Zero new optional initiations during effective refusal, including cancelled requests');
 assert.deepEqual(result.inconclusive,[],'Every optional request has a resolved causal position');
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const report=JSON.parse(await readFile(process.argv[2],'utf8')),result=analyzeConsentTimeline(report);
 if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:result.status,requests:result.requests.length,violations:result.violations,inconclusive:result.inconclusive},null,2));
 if(result.status!=='PASS')process.exitCode=1;
}
