/* Optional Google SDK lifecycle. This empty document never sees the quiz or WA link. */
(() => {
 'use strict';
 if(window.parent===window)return;
 let started=false;
 let active=false,revoked=false;
 // This gate belongs only to this disposable, empty measurement document.
 // In particular, GA's pagehide/unload flush must not escape on frame removal.
 const beacon=navigator.sendBeacon.bind(navigator);
 navigator.sendBeacon=function(...args){return active?beacon(...args):false;};
 const fetch=window.fetch.bind(window);
 window.fetch=function(...args){return active?fetch(...args):Promise.resolve(new Response(null,{status:204}));};
 const send=XMLHttpRequest.prototype.send;
 XMLHttpRequest.prototype.send=function(...args){if(active)return send.apply(this,args);};
 const src=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{...src,set(value){if(active)src.set.call(this,value);}});
 const setAttribute=HTMLImageElement.prototype.setAttribute;
 HTMLImageElement.prototype.setAttribute=function(name,value){if(active||String(name).toLowerCase()!=='src')return setAttribute.call(this,name,value);};
 Object.defineProperty(window,'OTGoogleMeasurement',{value:Object.freeze({stop(){revoked=true;active=false;}})});
 const names=new Set(['page_path','page_title','cta_text','cta_location','destination_url','plan_name','plan_tier','project_name','product_name','social_network','solution_name','audio_state','question_name','answer_category','step_number','completed_steps','section_name','percent','percent_scrolled','estrutura','objetivo','utm_source','utm_medium','utm_campaign','utm_content','utm_term']);
 function pageURL(value){
  const input=new URL(value),url=new URL(location.origin);
  if(input.origin!==location.origin)throw Error('Unexpected measurement origin');
  url.pathname=input.pathname;
  // Campaign attribution belongs in the page URL, never in arbitrary event fields.
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','origem']){
   const value=input.searchParams.get(key);
   if(value&&/^[a-z0-9._~-]{1,250}$/i.test(value))url.searchParams.set(key,value);
  }
  return url.href;
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent)return;
  const data=event.data;
  if(!data||typeof data!=='object')return;
  if(data.type==='ot-google-start'&&!started&&!revoked){
   if(typeof data.id!=='string'||!/^G-[A-Z0-9]+$/.test(data.id))return;
   let pageLocation,pageReferrer='';
   try{pageLocation=pageURL(data.pageLocation);if(data.pageReferrer){const u=new URL(data.pageReferrer);if(/^https?:$/.test(u.protocol))pageReferrer=u.origin+u.pathname;}}catch{return;}
   started=true;
   active=true;
   // Same-origin first-party cookies/session remain available to the real SDK.
   history.replaceState(null,'',pageLocation);
   document.title=String(data.pageTitle||'').slice(0,250);
   window.dataLayer=[];
   window.gtag=function(){window.dataLayer.push(arguments);};
   window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
   window.gtag('js',new Date());
   window.gtag('config',data.id,{page_location:pageLocation,page_referrer:pageReferrer,page_title:document.title,allow_google_signals:false,allow_ad_personalization_signals:false,send_page_view:data.sendPageView===true,debug_mode:data.debug===true});
   const script=document.createElement('script');script.id='ot-ga4-script';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(data.id);document.head.appendChild(script);
  }else if(data.type==='ot-google-event'&&started&&active){
   const value=data.event;
   if(!value||typeof value.name!=='string'||!/^\w{1,40}$/.test(value.name))return;
   const params={};
   for(const [key,item] of Object.entries(value.params||{})){
    if(!names.has(key))continue;
    if(typeof item==='number'&&Number.isFinite(item))params[key]=item;
    else if(typeof item==='string'){
     if(key.startsWith('utm_')&&!/^[a-z0-9._~-]{1,100}$/i.test(item))continue;
     if(key==='destination_url'){
      try{const u=new URL(item);if(/^https?:$/.test(u.protocol))params[key]=(u.origin+u.pathname).slice(0,500);}catch{ /* Invalid destination is not a measurement parameter. */ }
     }else params[key]=item.slice(0,250);
    }
   }
   window.gtag('event',value.name,params);
  }
 });
})();
