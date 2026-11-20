// QA only: causal timestamps, never SDK stubs or changes to a consent decision.
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';

const clock=()=>performance.timeOrigin+performance.now();
const sha=value=>createHash('sha256').update(value).digest('hex');
const fonts=new Set(['fonts.googleapis.com','fonts.gstatic.com']);
function endpoint(value){
  try{const u=new URL(value);return {host:u.hostname,path:u.pathname,urlHash:sha(u.href)};}catch{return null;}
}
export async function consentTimeline(context,report){
  const frames=new WeakMap(),requests=new WeakMap();let frameSeq=0,requestSeq=0;
  const frameId=frame=>{if(!frame)return null;if(!frames.has(frame))frames.set(frame,'frame-'+(++frameSeq));return frames.get(frame);};
  const timeline=report.consentTimeline={version:1,clock:'Unix epoch milliseconds: performance.timeOrigin + performance.now; native Playwright timing.startTime uses Unix epoch ms',events:[],requests:[],clockCalibration:[],notes:['Node observation is an upper bound, not a browser initiation time.','Cancelled requests remain in the evidence; cancellation is never an exemption.','Zero/negative native startTime means unavailable; use a matched browser initiation or fail inconclusive.']};
  await context.exposeBinding('__otQaConsentTrace137',async(source,event)=>{
    const {rawURL,...safe}=event;
    timeline.events.push({...safe,...(rawURL?{endpoint:endpoint(rawURL)}:{}),frameId:frameId(source.frame),parentFrameId:frameId(source.frame?.parentFrame()),observedEpoch:clock(),phase:report.phase||'initial'});
    if(event.type==='document-init')for(let i=0;i<3;i++){
      const hostBefore=clock();
      try{const browser=await source.frame.evaluate(()=>({epoch:performance.timeOrigin+performance.now(),wall:Date.now(),origin:performance.timeOrigin}));const hostAfter=clock();timeline.clockCalibration.push({frameId:frameId(source.frame),hostBefore,hostAfter,...browser,minimumHostOffset:hostBefore-browser.epoch,maximumHostOffset:hostAfter-browser.epoch});}
      catch(error){timeline.clockCalibration.push({frameId:frameId(source.frame),unavailable:error.message});break;}
    }
  });
  await context.addInitScript(()=>{
    const key='ot_consent_preferences_v2',documentId=crypto.randomUUID();let sequence=0;
    const now=()=>performance.timeOrigin+performance.now();
    const choice=value=>{try{const x=JSON.parse(value);return x&&['granted','denied'].includes(x.analytics)&&['granted','denied'].includes(x.marketing)?{analytics:x.analytics,marketing:x.marketing}:null;}catch{return null;}};
    const stored=()=>{try{return choice(localStorage.getItem(key));}catch{return null;}};
    const effective=()=>{try{return (window.OTAnalytics||window.parent.OTAnalytics)?.getConsent()??null;}catch{return null;}};
    const optional=value=>{try{const u=new URL(value,location.href);return /^https?:$/.test(u.protocol)&&u.origin!==location.origin&&!['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname);}catch{return false;}};
    function emit(type,details={}){
      const event={type,epoch:now(),wallEpoch:Date.now(),documentId,sequence:++sequence,documentPath:location.pathname,topFrame:window.parent===window,frameElementId:window.frameElement?.id||null,stored:stored(),effective:effective(),...details};
      window.__otQaConsentTrace137(event).catch(()=>{window.__otQaConsentTraceErrors137=(window.__otQaConsentTraceErrors137||0)+1;});
    }
    const callsite=()=>String(new Error().stack||'').split('\n').slice(2,6).map(line=>line.replace(/https?:\/\/[^\s)]+/g,value=>{try{const u=new URL(value);return u.origin+u.pathname;}catch{return '[source]';}})).join('\n').slice(0,600);
    const start=(type,url,details={})=>{if(optional(url))emit(type,{rawURL:new URL(url,location.href).href,stack:callsite(),initiates:true,...details});};
    emit('document-init');
    document.addEventListener('click',event=>{
      const target=event.target.closest?.('[data-consent-reject],[data-consent-save],[data-consent-accept]');
      if(target)emit('action-start',{action:target.hasAttribute('data-consent-reject')?'reject':target.hasAttribute('data-consent-save')?'save':'accept'});
    },true);
    const set=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){
      if(name!==key)return set.call(this,name,value);
      emit('decision-write-start',{next:choice(value)});
      const result=set.call(this,name,value);
      emit('decision-effective',{next:choice(value)});return result;
    };
    window.addEventListener('storage',event=>{if(event.key===key){emit('storage-received',{next:choice(event.newValue)});setTimeout(()=>emit('storage-after-handler'),0);}},true);
    const beacon=navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon=function(url,...args){start('beacon-start',url);return beacon(url,...args);};
    const fetch=window.fetch;
    window.fetch=function(input,...args){start('fetch-start',input instanceof Request?input.url:input);return fetch.call(this,input,...args);};
    const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send,urls=new WeakMap();
    XMLHttpRequest.prototype.open=function(method,url,...args){urls.set(this,url);return open.call(this,method,url,...args);};
    XMLHttpRequest.prototype.send=function(...args){start('xhr-start',urls.get(this));return send.apply(this,args);};
    for(const [Ctor,kind] of [[HTMLScriptElement,'script'],[HTMLImageElement,'image']]){
      const src=Object.getOwnPropertyDescriptor(Ctor.prototype,'src');
      Object.defineProperty(Ctor.prototype,'src',{...src,set(value){start(kind+'-src',value,{connected:this.isConnected,initiates:kind==='image'||this.isConnected});return src.set.call(this,value);}});
      const attribute=Ctor.prototype.setAttribute;
      Ctor.prototype.setAttribute=function(name,value){if(String(name).toLowerCase()==='src')start(kind+'-attribute',value,{connected:this.isConnected,initiates:kind==='image'||this.isConnected});return attribute.call(this,name,value);};
    }
    function inserted(node,connected){
      if(!connected)return;
      const scripts=node instanceof HTMLScriptElement?[node]:[...(node.querySelectorAll?.('script[src]')||[])];
      for(const script of scripts)start('script-insert',script.src,{initiates:true,connected:true});
    }
    for(const name of ['appendChild','insertBefore','replaceChild']){
      const method=Node.prototype[name];Node.prototype[name]=function(node,...args){inserted(node,this.isConnected||this.nodeType===9);return method.call(this,node,...args);};
    }
    new MutationObserver(records=>{for(const record of records)for(const node of record.removedNodes){
      if(node instanceof HTMLIFrameElement&&node.id==='ot-ga4-frame')emit('measurement-frame-removed');
    }}).observe(document,{subtree:true,childList:true});
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(optional(e.name))emit('resource-finished',{rawURL:e.name,nativeStartEpoch:performance.timeOrigin+e.startTime,nativeEndEpoch:performance.timeOrigin+e.responseEnd,duration:e.duration,initiatorType:e.initiatorType});}).observe({type:'resource',buffered:true});}catch{}
  });
  context.on('request',request=>{
    const u=new URL(request.url());if(u.origin==='https://olegariotech.com.br'||fonts.has(u.hostname))return;
    let frame=null;try{frame=request.frame();}catch{}
    const row={id:++requestSeq,endpoint:endpoint(request.url()),resourceType:request.resourceType(),frameId:frameId(frame),parentFrameId:frameId(frame?.parentFrame()),observedEpoch:clock(),phase:report.phase||'initial',native:request.timing(),status:'pending'};
    requests.set(request,row);timeline.requests.push(row);
  });
  for(const kind of ['requestfinished','requestfailed'])context.on(kind,request=>{
    const row=requests.get(request);if(!row)return;
    row.endObservedEpoch=clock();row.native=request.timing();row.status=kind==='requestfailed'?'failed':'finished';
    if(kind==='requestfailed')row.failure=request.failure()?.errorText;
  });
  return {requestId:request=>requests.get(request)?.id??null};
}
