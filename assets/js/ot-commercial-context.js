/* Navigation context only. No analytics events, cookies, storage, PII or message-send detection. */
(() => {
 'use strict';
 const sources={
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
 const utms=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
 // A fixed service marker is attribution context, not proof of a received lead.
 // It is enabled only by Google paid-search UTMs; never copy gclid or free-text UTMs into a message.
 const adsByService=Object.freeze({
  'sites-valinhos':'OT-GADS-SITES-VALINHOS',
  'sites-campinas':'OT-GADS-SITES-CAMPINAS'
 });
 const paidGoogle=incoming.searchParams.get('utm_source')?.toLowerCase()==='google' &&
  ['cpc','ppc'].includes(incoming.searchParams.get('utm_medium')?.toLowerCase());
 const serviceContext=current[0]==='diagnostico'&&known?known[0]:current[0];
 const adsReference=paidGoogle?adsByService[serviceContext]:null;

 function decorateInternal(link){
  if(link.closest('.ot-site-footer'))return;
  const original=link.getAttribute('href');
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||!sources[url.pathname])return;
  if(url.pathname==='/diagnostico-digital/'&&current[0]!=='diagnostico')url.searchParams.set('origem',current[0]);
  for(const key of utms){
   const value=incoming.searchParams.get(key);
   // Restrained campaign slugs only; do not forward arbitrary query values.
   if(value&&/^[a-z0-9._~-]{1,100}$/i.test(value)&&!url.searchParams.has(key))url.searchParams.set(key,value);
  }
  if(url.href!==new URL(original,location.href).href)link.href=url.href;
 }
 document.querySelectorAll('a[href]').forEach(link=>{try{decorateInternal(link)}catch{}});
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');
  if(!link)return;
  try{
   decorateInternal(link);
   // Read the final href at click time so the diagnostic's answer summary is retained.
   const url=new URL(link.href,location.href);
   if(url.protocol!=='https:'||url.hostname!=='wa.me'||url.pathname!=='/5511912459144')return;
   const text=url.searchParams.get('text');
   if(!text)return;
   const notes=[];
   if(current[0]==='diagnostico'&&known&&!text.includes('\nOrigem da página: ')){
    notes.push('Origem da página: '+known[1]+'.');
   }
   if(adsReference&&!text.includes('\nReferência OT: ')){
    notes.push('Referência OT: '+adsReference);
   }
   if(!notes.length)return;
   // Keep the visitor's exact WhatsApp draft; append only fixed, non-personal context.
   url.searchParams.set('text',text+'\n'+notes.join('\n'));
   link.href=url.href;
  }catch{}
 },true);
 const menu=document.querySelector('.ot-service-menu');
 menu?.addEventListener('keydown',event=>{
  if(event.key==='Escape'){menu.open=false;menu.querySelector('summary')?.focus();}
 });
})();
