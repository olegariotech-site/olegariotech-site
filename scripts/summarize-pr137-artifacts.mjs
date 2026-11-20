// QA evidence recovery; all data stay in the same repository's Actions artifacts.
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,basename} from 'node:path';
import {analyzeConsentTimeline} from './analyze-consent-timeline-137.mjs';
const root=resolve(process.argv[2]),out=resolve(process.argv[3]);await mkdir(out,{recursive:true});
async function* walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())yield*walk(path);else yield path;}}
const results=[];
for await(const path of walk(root)){
 const name=basename(path),file=relative(root,path);
 if(/native-(failure|stalls)/.test(file)&&name.endsWith('.json')){try{const native=JSON.parse(await readFile(path,'utf8'));console.log(JSON.stringify({file,kind:'native-stack',processes:native.processes,gdb:native.gdb?{pid:native.gdb.pid,error:native.gdb.error,stdout:native.gdb.stdout?(native.gdb.stdout.length>20000?native.gdb.stdout.slice(0,2000)+'\n[intermediate worker threads omitted here; full stack in artifact]\n'+native.gdb.stdout.slice(-18000):native.gdb.stdout):null,stderr:native.gdb.stderr}:null}));}catch{}continue;}
 if(!['real-sdk.json','ga4-consent-137.json','ga4-resource-gates-137.json','control-summary.json','results.json','earth-report.json','summary.json','comparison.json','navigation-timeline.json','mobile.json','journeys.json'].includes(name))continue;
 let data;try{data=JSON.parse(await readFile(path,'utf8'));}catch{continue;}
 const row={file};
 if(name==='journeys.json'){
  const p=data.visualPending,deltas=[];
  if(p)for(let i=0;i<Math.min(p.before.info.rects.length,p.after.info.rects.length);i++){const b=p.before.info.rects[i],a=p.after.info.rects[i];for(const axis of ['x','y','width','height'])if(Math.abs(b[axis]-a[axis])>1)deltas.push({index:i,tag:a.tag,id:a.id,cls:a.cls,axis,before:b[axis],after:a[axis],delta:a[axis]-b[axis]});}
  Object.assign(row,{kind:'journeys',engine:data.engine,status:data.status,failure:data.failure,journeys:data.journeys.length,accessibility:data.accessibility.length,visual:data.visual.length,pending:p?{url:p.url,width:p.width,before:p.before.capture,after:p.after.capture,deltas}:null});
 }else if(name==='ga4-resource-gates-137.json'){
  Object.assign(row,{kind:'resource-gates',status:data.status,failure:data.failure,reauthorization:data.reauthorization,modes:data.modes,libraries:data.libraries,vendorFailures:data.vendorFailures,requests:data.consentTimeline?.requests?.map(r=>({id:r.id,phase:r.phase,endpoint:r.endpoint,status:r.status,native:r.native,frameId:r.frameId})),events:data.consentTimeline?.events?.filter(e=>/decision|storage|document-init|script-insert/.test(e.type))});
 }else if(data.consentTimeline&&!data.fixtureOnly){
  const causal=analyzeConsentTimeline(data),suspects=causal.requests.filter(r=>/revoke|refusal/.test(r.phase)||r.finding!=='allowed');
  Object.assign(row,{kind:'consent',status:data.status,failure:data.failure||null,eventCounts:data.eventCounts,causalStatus:causal.status,violations:causal.violations,inconclusive:causal.inconclusive,decisions:causal.decisions,suspects});
  row.correlations=suspects.map(r=>({request:r,events:data.consentTimeline.events.filter(e=>Math.abs(e.epoch-(r.nativeStartEpoch??r.browserInitiationEpoch??r.observedEpoch))<100&&['decision-write-start','decision-effective','storage-received','storage-after-handler','measurement-frame-removed','script-insert','action-start'].includes(e.type))}));
  row.optionalByPhase=data.optionalRequests;
 }else if(name==='results.json'){
  Object.assign(row,{kind:'v3',passed:data.passed,failure:data.failure||null,runtimeHead:data.runtime?.head,engines:Object.fromEntries(Object.entries(data.engines||{}).map(([key,value])=>[key,{runs:value.runs?.length,processEvents:value.processEvents}])),cases:data.caseTimeline,pages:data.pages,privacy:data.privacy});
 }else if(name==='earth-report.json'){
  Object.assign(row,{kind:'earth',passed:data.passed,failure:data.failure||null,cases:data.cases,probes:data.probes?.map(p=>({engine:p.engine,profile:p.profile,earthFPS:p.earthFPS,frameDelta:p.frameDelta,windowSeconds:p.windowSeconds,frameIntervals:p.frameIntervals,first:p.first,last:p.last})),runtimeSources:data.runtimeSources?.map(r=>({head:r.head,served:r.served?.length,browser:r.browser?.length,failures:r.failures}))});
  console.log(JSON.stringify({file,kind:'earth-metrics',passed:data.passed,failure:data.failure,probes:data.probes?.map(p=>({engine:p.engine,profile:p.profile,earthFPS:p.earthFPS,elapsed:p.elapsed,frames:p.frames,firstTime:p.first?.now,lastTime:p.last?.now,firstPaints:p.first?.webglPaints,lastPaints:p.last?.webglPaints,firstRaf:p.first?.raf,lastRaf:p.last?.raf,firstVisible:p.first?.hidden,lastVisible:p.last?.hidden}))}));
 }else if(name==='navigation-timeline.json'){row.kind='mobile-navigation';row.cases=data;}
 else if(name==='mobile.json'){row.kind='mobile-completion';row.completed=data.map(r=>({engine:r.engine,width:r.width,variant:r.variant}));}
 else if(name==='summary.json'||name==='comparison.json'||name==='control-summary.json'){row.kind='orchestrator';row.data=data;}
 else continue;
 results.push(row);
 if(row.kind==='v3')console.log(JSON.stringify({file,kind:'v3-overview',passed:row.passed,failure:row.failure,engines:row.engines,cases:row.cases?.map(c=>({engine:c.engine,width:c.width,last:c.events?.at(-1),rendererUnavailable:c.rendererUnavailable,googleFrame:c.renderer?.googleFrame,hidden:c.renderer?.hidden,consent:c.renderer?.consent,observers:c.renderer?.probe?.observers,paintUnavailable:c.renderer?.probe?.paintUnavailable}))}));
 const printed=JSON.stringify(row);console.log(printed.length>45000?JSON.stringify({file,kind:row.kind,notice:'Complete details in analysis-summary.json',passed:row.passed,failure:row.failure}):printed);
}
await writeFile(resolve(out,'analysis-summary.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({files:results.length,analysis:'analysis-summary.json',note:'Reanalyses keep original exits; retrospective analysis never converts a failed qualification job to PASS.'}));
