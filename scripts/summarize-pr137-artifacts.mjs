// QA evidence recovery; all data stay in the same repository's Actions artifacts.
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,basename} from 'node:path';
import {analyzeConsentTimeline} from './analyze-consent-timeline-137.mjs';
const root=resolve(process.argv[2]),out=resolve(process.argv[3]);await mkdir(out,{recursive:true});
async function* walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())yield*walk(path);else yield path;}}
const results=[];
for await(const path of walk(root)){
 const name=basename(path),file=relative(root,path);
 if(!['real-sdk.json','ga4-consent-137.json','results.json','earth-report.json','summary.json','comparison.json','navigation-timeline.json','mobile.json'].includes(name))continue;
 let data;try{data=JSON.parse(await readFile(path,'utf8'));}catch{continue;}
 const row={file};
 if(data.consentTimeline&&!data.fixtureOnly){
  const causal=analyzeConsentTimeline(data),suspects=causal.requests.filter(r=>/revoke|refusal/.test(r.phase)||r.finding!=='allowed');
  Object.assign(row,{kind:'consent',status:data.status,failure:data.failure||null,eventCounts:data.eventCounts,causalStatus:causal.status,violations:causal.violations,inconclusive:causal.inconclusive,decisions:causal.decisions,suspects});
  row.correlations=suspects.map(r=>({request:r,events:data.consentTimeline.events.filter(e=>Math.abs(e.epoch-(r.nativeStartEpoch??r.browserInitiationEpoch??r.observedEpoch))<100&&['decision-write-start','decision-effective','storage-received','storage-after-handler','measurement-frame-removed','script-insert','action-start'].includes(e.type))}));
  row.optionalByPhase=data.optionalRequests;
 }else if(name==='results.json'){
  Object.assign(row,{kind:'v3',passed:data.passed,failure:data.failure||null,runtimeHead:data.runtime?.head,engines:Object.fromEntries(Object.entries(data.engines||{}).map(([key,value])=>[key,{runs:value.runs?.length,processEvents:value.processEvents}])),cases:data.caseTimeline,pages:data.pages,privacy:data.privacy});
 }else if(name==='earth-report.json'){
  Object.assign(row,{kind:'earth',passed:data.passed,failure:data.failure||null,cases:data.cases,probes:data.probes?.map(p=>({engine:p.engine,profile:p.profile,earthFPS:p.earthFPS,frameDelta:p.frameDelta,windowSeconds:p.windowSeconds,frameIntervals:p.frameIntervals,first:p.first,last:p.last})),runtimeSources:data.runtimeSources?.map(r=>({head:r.head,served:r.served?.length,browser:r.browser?.length,failures:r.failures}))});
 }else if(name==='navigation-timeline.json'){row.kind='mobile-navigation';row.cases=data;}
 else if(name==='mobile.json'){row.kind='mobile-completion';row.completed=data.map(r=>({engine:r.engine,width:r.width,variant:r.variant}));}
 else if(name==='summary.json'||name==='comparison.json'){row.kind='orchestrator';row.data=data;}
 else continue;
 results.push(row);
 const printed=JSON.stringify(row);console.log(printed.length>45000?JSON.stringify({file,kind:row.kind,notice:'Complete details in analysis-summary.json',passed:row.passed,failure:row.failure}):printed);
}
await writeFile(resolve(out,'analysis-summary.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({files:results.length,analysis:'analysis-summary.json',note:'Reanalyses keep original exits; retrospective analysis never converts a failed qualification job to PASS.'}));
