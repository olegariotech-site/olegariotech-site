// Targeted regression for Issue #138. Offline controls use the actual runtime;
// --browser loads real vendor SDKs but intercepts EVERY collection destination.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {BASE138,verifyApproved138Scope} from './verify-issue-138-scope.mjs';
const root=resolve(new URL('../',import.meta.url).pathname);
const output=resolve(process.env.OT_138_OUTPUT||'/tmp/ot-issue-138');
const report={issue:138,base:BASE138,mode:process.argv.includes('--browser')?'real-sdk-intercepted':'offline-runtime',checks:[],noProductionWrites:true};
const current=path=>readFile(resolve(root,path),'utf8');
const baseline=path=>execFileSync('git',['show',BASE138+':'+path],{cwd:root,encoding:'utf8'});
function navigation(source,pageUrl,hrefs){
 const location=new URL(pageUrl),listeners={};let observer;
 const link=href=>({href:new URL(href,pageUrl).href,getAttribute(name){return name==='href'?this.href:null;}});
 const links=hrefs.map(link);
 const document={documentElement:{},querySelectorAll:()=>links,querySelector:()=>null,addEventListener:(name,fn)=>listeners[name]=fn};
 runInNewContext(source,{URL,location,document,MutationObserver:class{constructor(fn){observer=fn;}observe(){}}});
 return {links,add(href){const item=link(href);observer([{type:'childList',addedNodes:[{matches:()=>true,...item,getAttribute:item.getAttribute,querySelectorAll:()=>[]}]}]);},click(i){listeners.click({target:{closest:()=>links[i]}});return links[i].href;}};
}
function measurement(source,debug){
 const listeners={},scripts=[];let choice='granted';
 class Node {appendChild(n){scripts.push(n);return n;}insertBefore(n){return this.appendChild(n);}replaceChild(n){return this.appendChild(n);}}
 class Element extends Node {querySelector(){return null;}querySelectorAll(){return [];}setAttribute(name,value){this[name]=value;}setAttributeNS(ns,name,value){this.setAttribute(name,value);}append(...nodes){nodes.forEach(n=>this.appendChild(n));}prepend(...nodes){this.append(...nodes);}replaceChildren(...nodes){this.append(...nodes);}}
 class Image extends Element {} class Script extends Element {}
 for(const C of [Image,Script])Object.defineProperty(C.prototype,'src',{configurable:true,get(){return this._src;},set(value){this._src=value;}});
 class XHR {open(){}send(){}}
 const parent={OTAnalytics:{getConsent:()=>({analytics:choice,marketing:'denied'})}};
 const location=new URL('https://olegariotech.com.br/assets/ot-google-measurement.html');
 const window={parent,fetch:async()=>new Response(null,{status:204}),addEventListener:(name,fn)=>listeners[name]=fn};
 const document={title:'',head:new Element(),createElement:()=>new Script()};
 const navigator={sendBeacon:()=>true};
 runInNewContext(source,{window,document,navigator,location,URL,Response,XMLHttpRequest:XHR,HTMLImageElement:Image,HTMLScriptElement:Script,Node,Element,localStorage:{getItem:()=>JSON.stringify({analytics:choice,marketing:'denied'})},history:{replaceState(){}},Date});
 const send=(data,origin=location.origin,source=parent)=>listeners.message({data,origin,source});
 const start={type:'ot-google-start',id:'G-0YXCH58MXD',pageLocation:'https://olegariotech.com.br/diagnostico-digital/?debug_analytics=1&nome=PRIVATE_FIXTURE&utm_source=google',pageTitle:'Diagnóstico',sendPageView:true,debug};
 send(start,'https://evil.example');assert.equal(window.dataLayer,undefined,'Foreign origin cannot start the SDK');
 send(start);
 return {window,scripts,send,config:window.dataLayer.find(x=>x[0]==='config')[2],stop(){choice='denied';window.OTGoogleMeasurement.stop();assert.equal(navigator.sendBeacon('https://www.google-analytics.com/g/collect','probe'),false);}};
}
async function offline(){
 verifyApproved138Scope();
 const helper=await current('assets/js/ot-commercial-context.js');
 const start='https://olegariotech.com.br/?debug_analytics=1&utm_source=google&utm_medium=cpc&utm_campaign=ot_138';
 const hrefs=['/diagnostico-digital/','/criacao-de-sites-valinhos/','/criacao-de-sites-campinas/','https://wa.me/5511912459144?text=Mensagem%20original','https://external.example/diagnostico-digital/','/privacidade/'];
 const n=navigation(helper,start,hrefs);
 for(let i=0;i<3;i++){assert.equal(new URL(n.links[i].href).searchParams.get('debug_analytics'),'1');assert.equal(new URL(n.links[i].href).searchParams.get('utm_campaign'),'ot_138');}
 for(let i=3;i<hrefs.length;i++)assert.equal(n.links[i].href,new URL(hrefs[i],start).href,'No QA added to WA, external or ineligible pages');
 assert.equal(new URL(n.click(3)).searchParams.get('text'),'Mensagem original');
 const second=navigation(helper,n.links[0].href,['/']);assert.equal(new URL(second.links[0].href).searchParams.get('debug_analytics'),'1');
 for(const value of ['', '?debug_analytics=0','?debug_analytics=true','?debug_analytics=2']){
  const normal=navigation(helper,'https://olegariotech.com.br/'+value,['/diagnostico-digital/']);assert.equal(new URL(normal.links[0].href).searchParams.has('debug_analytics'),false);
 }
 assert.throws(()=>assert.equal(new URL(navigation(baseline('assets/js/ot-commercial-context.js'),start,['/diagnostico-digital/']).links[0].href).searchParams.get('debug_analytics'),'1'),'Base control reproduces lost QA during navigation');
 report.checks.push('QA=1 follows internal eligible navigation, keeps UTMs; normal/invalid QA, WA and external links stay unchanged; baseline fails this assertion');
 const source=await current('assets/js/ot-google-measurement.js');
 for(const debug of [undefined,false,true]){
  const m=measurement(source,debug);assert.equal(Object.hasOwn(m.config,'debug_mode'),debug===true);if(debug===true)assert.equal(m.config.debug_mode,true);
  const u=new URL(m.config.page_location);assert.equal(u.searchParams.has('nome'),false);assert.equal(u.searchParams.has('debug_analytics'),false);assert.equal(u.searchParams.get('utm_source'),'google');
  m.send({type:'ot-google-event',event:{name:'diagnostico_resposta',params:{question_name:'estrutura',step_number:2,answer_category:'PRIVATE_FIXTURE',estrutura:'PRIVATE_FIXTURE',objetivo:'PRIVATE_FIXTURE',business_name:'PRIVATE_FIXTURE'}}});
  const payload=m.window.dataLayer.find(x=>x[0]==='event')[2];assert.deepEqual(JSON.parse(JSON.stringify(payload)),{question_name:'estrutura',step_number:2});
  m.stop();
 }
 assert.throws(()=>assert.equal(Object.hasOwn(measurement(baseline('assets/js/ot-google-measurement.js'),false).config,'debug_mode'),false),'Base control reproduces explicit false');
 const old=measurement(baseline('assets/js/ot-google-measurement.js'),true);old.send({type:'ot-google-event',event:{name:'diagnostico_resposta',params:{answer_category:'PRIVATE_FIXTURE'}}});
 assert.throws(()=>assert.ok(!JSON.stringify(old.window.dataLayer).includes('PRIVATE_FIXTURE')),'Base control detects the actual answer leak');
 report.checks.push('Actual transport runtime omits normal debug, accepts only true QA, strips answer keys and URL PII, enforces origin and revocation; both baseline defects detected');
 report.status='PASS';
}
async function browserTest(){
 const {launch,replay,ready,answer,waClick,preferences,snapshot,settled,labelPage,engine,FIXTURE}=await import('./qa-pre-ads-134-lib.mjs');
 const samples=[],raws=[];let browser;
 report.engine=engine;
 try{
  browser=await launch();report.browser=browser.version();
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  await replay(context,{real:true,report});
  context.on('request',request=>{
   const u=new URL(request.url());if(!/(^|\.)google-analytics\.com$/.test(u.hostname)||u.pathname!=='/g/collect')return;
   const text=u.search.slice(1)+'&'+(request.postData()||'');raws.push(text);
   for(const line of (request.postData()||'').split('\n')){const p=new URLSearchParams(u.search.slice(1)+'&'+line);for(const name of p.getAll('en'))samples.push({name,debug:p.get('_dbg')==='1'||p.get('ep.debug_mode')==='true'||p.get('ep.debug_mode')==='1',answerKeys:[...p.keys()].some(k=>/answer_category|^ep\.(estrutura|objetivo)$/.test(k))});}
  });
  const page=await context.newPage();labelPage(page,'138-qa-home');
  report.phase='qa-initial';await ready(page,'/?debug_analytics=1&utm_source=google&utm_medium=cpc&utm_campaign=ot_138_qa');
  assert.equal(report.network.length,0);assert.equal(report.optionalRequests.length,0);
  report.phase='qa-grant';await preferences(page,true,false);
  await page.locator('#ot-ga4-frame').waitFor({state:'attached'});
  await page.locator('#inicio .btn-primary').click();await page.waitForURL(u=>u.pathname==='/diagnostico-digital/');
  assert.equal(new URL(page.url()).searchParams.get('debug_analytics'),'1');assert.equal(new URL(page.url()).searchParams.get('utm_campaign'),'ot_138_qa');
  await page.waitForFunction(()=>Boolean(window.OTAnalytics));labelPage(page,'138-qa-diagnostic');
  await answer(page);const draft=await waClick(page);assert.ok(draft.includes(FIXTURE));
  const deadline=Date.now()+45000;while(!samples.some(x=>x.name==='click_whatsapp')&&Date.now()<deadline)await settled(report,250);
  await settled(report,4000);
  for(const event of ['diagnostico_inicio','diagnostico_concluido','click_whatsapp'])assert.equal(samples.filter(x=>x.name===event).length,1,'One real SDK commercial event per action: '+event);
  assert.equal(samples.filter(x=>x.name==='page_view').length,2,'One page_view for each of the two actual documents');
  assert.equal(samples.filter(x=>x.name==='diagnostico_resposta').length,5);
  assert.ok(samples.filter(x=>/diagnostico_|click_whatsapp|page_view/.test(x.name)).every(x=>x.debug),'All QA commercial hits carry real debug');
  assert.ok(samples.every(x=>!x.answerKeys));
  assert.ok(!report.network.some(x=>x.containsFixture||x.containsWhatsAppDraft));
  assert.ok(!samples.some(x=>x.name==='generate_lead'));
  report.checks.push('Real SDK: home → diagnostic preserves UTM/QA, 2 page_view, 5 safe progress, 1 start/finish/WA; no false lead, answer keys or draft');
  report.phase='open-preferences';await preferences(page,false,false);await settled(report,1000);
  report.phase='denied';const before=report.network.length+report.optionalRequests.length;await waClick(page);await settled(report,2500);assert.equal(report.network.length+report.optionalRequests.length,before);assert.equal((await snapshot(page)).googleFrames,0);
  await context.close();
  const normal=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});await replay(normal,{real:true,report});
  const normalPage=await normal.newPage();report.phase='normal';await ready(normalPage,'/diagnostico-digital/');await preferences(normalPage,true,false);
  await normalPage.waitForFunction(()=>document.querySelector('#ot-ga4-frame')?.contentWindow?.dataLayer?.some(x=>x[0]==='config'));
  const flags=await normalPage.evaluate(()=>({parent:(window.dataLayer||[]).filter(x=>x[0]==='config').map(x=>Object.hasOwn(x[2],'debug_mode')),frame:document.querySelector('#ot-ga4-frame').contentWindow.dataLayer.filter(x=>x[0]==='config').map(x=>Object.hasOwn(x[2],'debug_mode'))}));
  assert.deepEqual(flags,{parent:[false],frame:[false]});await normal.close();
  report.checks.push('Normal session omits debug in parent and SDK document; refusal suppresses optional requests');
  report.events=samples;report.status='PASS';
 }finally{await browser?.close();}
}
try{if(report.mode==='offline-runtime')await offline();else await browserTest();}catch(error){report.status='FAIL';report.failure=error.stack;process.exitCode=1;}
await mkdir(output,{recursive:true});
const filename=report.mode==='offline-runtime'?'offline.json':(report.engine||'browser')+'.json';
const {pendingBodies,...safe}=report;await writeFile(resolve(output,filename),JSON.stringify(safe,null,2)+'\n');
console.log(JSON.stringify({status:report.status,mode:report.mode,engine:report.engine,checks:report.checks,failure:report.failure},null,2));
