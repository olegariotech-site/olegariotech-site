/* Optional Google SDK lifecycle. This empty document never sees the quiz or WA link. */
(() => {
 'use strict';
 if(window.parent===window)return;
 let started=false;
 let active=false,revoked=false;
 // This gate belongs only to this disposable, empty measurement document.
 // Recheck the shared choice at the native API boundary: another tab's storage
 // notification and this frame's removal can arrive after the effective denial.
 function permitted(){
  if(!active||revoked)return false;
  try{if(window.parent.OTAnalytics.getConsent()?.analytics!=='granted')return false;}catch{return false;}
  let raw;try{raw=localStorage.getItem('ot_consent_preferences_v2');}catch{return true;}
  if(raw===null)return true; // The parent still supports an in-memory choice.
  try{return JSON.parse(raw)?.analytics==='granted';}catch{return false;}
 }
 // This document has analytics consent only. Google can also emit an automatic
 // advertising conversion for a key event, even with ad_storage denied.
 // Stop that extra destination before the browser starts a request.
 function endpointAllowed(value){
  try{
   if(value===undefined||value===null)return false;
   const url=new URL(value,location.href),host=url.hostname;
   if(url.origin===location.origin)return true;
   if(url.protocol!=='https:')return false;
   const analytics=domain=>host===domain||host.endsWith('.'+domain);
   const library=host==='www.googletagmanager.com'&&(url.pathname==='/gtag/js'||url.pathname==='/gtag/destination'&&/^G-[A-Z0-9]+$/.test(url.searchParams.get('id')||''));
   return library||analytics('google-analytics.com')||analytics('analytics.google.com');
  }catch{return false;}
 }
 const nativeBeacon=navigator.sendBeacon.bind(navigator);
 const beacon=(url,...args)=>endpointAllowed(url)?nativeBeacon(url,...args):false;
 navigator.sendBeacon=function(...args){return permitted()?beacon(...args):false;};
 const nativeFetch=window.fetch.bind(window);
 const fetch=(input,...args)=>endpointAllowed(input&&typeof input==='object'&&typeof input.url==='string'?input.url:input)?nativeFetch(input,...args):Promise.resolve(new Response(null,{status:204}));
 window.fetch=function(...args){return permitted()?fetch(...args):Promise.resolve(new Response(null,{status:204}));};
 const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send,requestURLs=new WeakMap();
 XMLHttpRequest.prototype.open=function(method,url,...args){requestURLs.set(this,url);return open.call(this,method,url,...args);};
 XMLHttpRequest.prototype.send=function(...args){if(permitted()&&endpointAllowed(requestURLs.get(this)))return send.apply(this,args);};
 for(const Ctor of [HTMLImageElement,HTMLScriptElement]){
  const src=Object.getOwnPropertyDescriptor(Ctor.prototype,'src');
  Object.defineProperty(Ctor.prototype,'src',{...src,set(value){if(permitted()&&endpointAllowed(value))src.set.call(this,value);}});
  const setAttribute=Ctor.prototype.setAttribute,setAttributeNS=Ctor.prototype.setAttributeNS;
  Ctor.prototype.setAttribute=function(name,value){if(String(name).toLowerCase()!=='src'||permitted()&&endpointAllowed(value))return setAttribute.call(this,name,value);};
  Ctor.prototype.setAttributeNS=function(namespace,name,value){if(String(name).toLowerCase().split(':').at(-1)!=='src'||permitted()&&endpointAllowed(value))return setAttributeNS.call(this,namespace,name,value);};
 }
 // A real Google SDK inserts another gtag/js through insertBefore during
 // revocation. Transport gates alone do not cover this resource-initiation path.
 const containsScript=node=>node instanceof HTMLScriptElement||Boolean(node?.querySelector?.('script'));
 const scriptEndpointsAllowed=node=>(node instanceof HTMLScriptElement?[node]:[...(node?.querySelectorAll?.('script')||[])]).every(script=>endpointAllowed(script.src||location.href));
 for(const name of ['appendChild','insertBefore','replaceChild']){
  const original=Node.prototype[name];
  Node.prototype[name]=function(node,...args){if(containsScript(node)&&!permitted())return node;if(!scriptEndpointsAllowed(node))return node;return original.call(this,node,...args);};
 }
 for(const name of ['append','prepend','replaceChildren']){
  const original=Element.prototype[name];
  Element.prototype[name]=function(...nodes){if(!permitted()&&nodes.some(containsScript))return;if(!nodes.every(scriptEndpointsAllowed))return;return original.apply(this,nodes);};
 }
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
   active=true;
   if(!permitted()){active=false;return;}
   started=true;
   // Same-origin first-party cookies/session remain available to the real SDK.
   history.replaceState(null,'',pageLocation);
   document.title=String(data.pageTitle||'').slice(0,250);
   window.dataLayer=[];
   window.gtag=function(){window.dataLayer.push(arguments);};
   window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
   window.gtag('js',new Date());
   window.gtag('config',data.id,{page_location:pageLocation,page_referrer:pageReferrer,page_title:document.title,allow_google_signals:false,allow_ad_personalization_signals:false,send_page_view:data.sendPageView===true,debug_mode:data.debug===true});
   const script=document.createElement('script');script.id='ot-ga4-script';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(data.id);document.head.appendChild(script);
  }else if(data.type==='ot-google-event'&&started&&permitted()){
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
