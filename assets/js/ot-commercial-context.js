/* Navigation context only. No analytics events, cookies, storage, PII or message-send detection. */
(() => {
 'use strict';
 const sources={
  '/':['home','Site principal da Olegario Tech'],
  '/criacao-de-sites-valinhos/':['sites-valinhos','Criação de sites em Valinhos'],
  '/criacao-de-sites-campinas/':['sites-campinas','Criação de sites em Campinas'],
  '/presenca-no-google/':['google-local','Presença no Google'],
  '/anuncios-google-instagram/':['anuncios','Anúncios Google e Instagram'],
  '/diagnostico-digital/':['diagnostico','Diagnóstico Digital']
 };
 const current=sources[location.pathname];
 if(!current)return;
 const incoming=new URL(location.href);
 const known=Object.values(sources).find(source=>source[0]===incoming.searchParams.get('origem'));
 const context=(current[0]==='home'||current[0]==='diagnostico')&&known?known:current;
 const utms=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
 // Fixed operational context, never proof of a received or attributed lead.
 const adsByService=Object.freeze({
  'sites-valinhos':'OT-GADS-SITES-VALINHOS',
  'sites-campinas':'OT-GADS-SITES-CAMPINAS'
 });
 const paidGoogle=incoming.searchParams.get('utm_source')?.toLowerCase()==='google' &&
  ['cpc','ppc'].includes(incoming.searchParams.get('utm_medium')?.toLowerCase());
 const adsReference=paidGoogle?adsByService[context[0]]:null;

 function decorateInternal(link){
  const original=link.getAttribute('href');
  // Preserve hash navigation and the selectors/event classification that use it.
  if(!original||original.startsWith('#'))return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||!sources[url.pathname])return;
  if((url.pathname==='/'||url.pathname==='/diagnostico-digital/')&&context[0]!=='diagnostico'){
   url.searchParams.set('origem',context[0]);
  }
  for(const key of utms){
   const value=incoming.searchParams.get(key);
   if(value&&/^[a-z0-9._~-]{1,100}$/i.test(value)&&!url.searchParams.has(key))url.searchParams.set(key,value);
  }
  // Explicit QA is URL-local: no storage and no signal on external/WhatsApp links.
  if(incoming.searchParams.get('debug_analytics')==='1')url.searchParams.set('debug_analytics','1');
  if(url.href!==new URL(original,location.href).href)link.href=url.href;
 }
 function decorateTree(node){
  if(node.matches?.('a[href]')){try{decorateInternal(node)}catch{}}
  node.querySelectorAll?.('a[href]').forEach(link=>{try{decorateInternal(link)}catch{}});
 }
 decorateTree(document);
 // The approved footer and configurator can add links after this deferred script.
 new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='attributes'){try{decorateInternal(record.target)}catch{}}
   else record.addedNodes.forEach(decorateTree);
  }
 }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['href']});
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');
  if(!link)return;
  try{
   decorateInternal(link);
   const url=new URL(link.href,location.href);
   if(url.protocol!=='https:'||url.hostname!=='wa.me'||url.pathname!=='/5511912459144')return;
   const text=url.searchParams.get('text');
   if(!text)return;
   const notes=[];
   if(current[0]==='diagnostico'&&known&&!text.includes('\nOrigem da página: ')){
    notes.push('Origem da página: '+known[1]+'.');
   }
   if(adsReference&&!text.includes('\nReferência OT: '))notes.push('Referência OT: '+adsReference);
   if(!notes.length)return;
   url.searchParams.set('text',text+'\n'+notes.join('\n'));
   link.href=url.href;
  }catch{}
 },true);
 const menu=document.querySelector('.ot-service-menu');
 menu?.addEventListener('keydown',event=>{
  if(event.key==='Escape'){menu.open=false;menu.querySelector('summary')?.focus();}
 });
})();
