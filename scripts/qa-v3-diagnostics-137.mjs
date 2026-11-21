// Supplemental-only renderer/observer probes. No style, geometry or animation is changed.
import {mkdir,writeFile,readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const epoch=()=>Date.now();
export async function nativeSnapshot(directory,label){
 await mkdir(directory,{recursive:true});const rows=[];
 for(const id of await readdir('/proc'))if(/^\d+$/.test(id)){
  try{const status=await readFile('/proc/'+id+'/status','utf8'),name=status.match(/^Name:\s+(.*)$/m)?.[1];if(!/WebProcess|WebKitWeb|MiniBrowser|WPEWeb/.test(name||''))continue;
   rows.push({pid:Number(id),name,ppid:Number(status.match(/^PPid:\s+(\d+)/m)?.[1]),rssKiB:Number(status.match(/^VmRSS:\s+(\d+)/m)?.[1]||0),wchan:await readFile('/proc/'+id+'/wchan','utf8').catch(()=>null),stack:await readFile('/proc/'+id+'/stack','utf8').catch(error=>'unavailable: '+error.code)});
  }catch{}
 }
 const report={epoch:epoch(),processes:rows,corePattern:await readFile('/proc/sys/kernel/core_pattern','utf8').catch(()=>null)};
 const target=rows.filter(p=>/WebProcess|WebKitWeb|WPEWeb/.test(p.name)).sort((a,b)=>b.rssKiB-a.rssKiB)[0];
 if(target&&process.env.OT_137_STACKS==='1'){
  // Attaching pauses this diagnostic process briefly. Such a run never qualifies
  // the production candidate; required gates run without this flag.
  try{const r=await run('sudo',['-n','gdb','--batch','--nx','-ex','set pagination off','-ex','thread apply all bt','-ex','detach','-p',String(target.pid)],{timeout:5000,maxBuffer:1024*1024});report.gdb={pid:target.pid,stdout:r.stdout,stderr:r.stderr};}
  catch(error){report.gdb={pid:target.pid,error:error.message,stdout:error.stdout,stderr:error.stderr};}
 }
 await writeFile(resolve(directory,label+'.json'),JSON.stringify(report,null,2));return report;
}
export function v3Probe(page,report,engine,width,output){
 const enabled=process.env.OT_137_V3_DIAGNOSTIC==='1';
 const record={engine,width,events:[]};(report.caseTimeline??=[]).push(record);let stage='created',at=epoch(),snapshotted=false;
 function mark(name){stage=name;at=epoch();snapshotted=false;record.events.push({event:'stage',stage,epoch:at});}
 const timer=enabled?setInterval(()=>{
  if(!snapshotted&&epoch()-at>8000){snapshotted=true;nativeSnapshot(resolve(output,'native-stalls'),engine+'-'+width+'-'+stage.replace(/\W/g,'_')).catch(error=>record.nativeError=error.message);}
 },1000):null;timer?.unref();
 if(enabled){
  page.addInitScript(()=>{
   const state=window.__otV3Probe137={raf:[],observers:[],frames:[]};let previous=0;
   function frame(at){if(previous){state.raf.push({at,delta:at-previous});if(state.raf.length>240)state.raf.shift();}previous=at;requestAnimationFrame(frame);}requestAnimationFrame(frame);
   const Native=MutationObserver;
   window.MutationObserver=new Proxy(Native,{construct(target,args,newTarget){
    const row={source:String(new Error().stack||'').split('\n').slice(1,4).join('\n'),calls:0,records:0,totalMs:0,maxMs:0};state.observers.push(row);const callback=args[0];
    return Reflect.construct(target,[(records,observer)=>{const start=performance.now();try{return callback(records,observer);}finally{const ms=performance.now()-start;row.calls++;row.records+=records.length;row.totalMs+=ms;row.maxMs=Math.max(row.maxMs,ms);}}],newTarget);
   }});
   if(PerformanceObserver.supportedEntryTypes.includes('paint'))new PerformanceObserver(list=>{for(const e of list.getEntries())state.frames.push({type:e.entryType,at:e.startTime,duration:e.duration});}).observe({type:'paint',buffered:true});else state.paintUnavailable=true;
  }).catch(error=>record.initError=error.message);
 }
 page.on('frameattached',frame=>record.events.push({event:'frame-attached',epoch:epoch(),parent:!!frame.parentFrame()}));
 async function renderer(){return page.evaluate(()=>({probe:window.__otV3Probe137,hidden:document.hidden,scrollY,earth:{...document.querySelector('#earthJourney')?.dataset},googleFrame:!!document.querySelector('#ot-ga4-frame'),consent:window.OTAnalytics?.getConsent()}));}
 return {record,mark,stage:()=>stage,close(){if(timer)clearInterval(timer);},async complete(){if(enabled)try{record.renderer=await renderer();}catch(error){record.rendererUnavailable=error.message;}},async failed(error){
  record.events.push({event:'action-failed-before-cleanup',stage,epoch:epoch(),error:error.message});
  if(enabled){
   try{record.renderer=await Promise.race([renderer(),new Promise((_,reject)=>setTimeout(()=>reject(Error('renderer snapshot unavailable after 1500 ms')),1500))]);}catch(e){record.rendererUnavailable=e.message;}
   record.failureNative=await nativeSnapshot(resolve(output,'native-failure'),engine+'-'+width).catch(e=>({error:e.message}));
  }
 }};
}
