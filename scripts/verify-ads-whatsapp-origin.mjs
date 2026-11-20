// Offline functional QA: fixed Google paid-search marker on OT's WhatsApp CTAs.
// No HTTP, Google/Meta collection or WhatsApp send; native URL resolution and VM click handlers.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {verifyApprovedAdsOriginScope} from './verify-ads-whatsapp-origin-scope.mjs';

await verifyApprovedAdsOriginScope(fileURLToPath(new URL('../',import.meta.url)));
const helper=await readFile(new URL('../assets/js/ot-commercial-context.js',import.meta.url),'utf8');
let passed=0;

function scenario(pageUrl,items){
 const loc=new URL(pageUrl);
 const links=items.map(item=>{
  const raw=typeof item==='string'?item:item.href;
  return {
   href:new URL(raw,pageUrl).href,
   footer:typeof item==='object'&&Boolean(item.footer),
   getAttribute(name){return name==='href'?this.href:null;},
   closest(selector){return selector==='.ot-site-footer'&&this.footer?{}:null;}
  };
 });
 const handlers={};
 const document={
  querySelectorAll(selector){assert.equal(selector,'a[href]');return links;},
  querySelector(selector){assert.equal(selector,'.ot-service-menu');return null;},
  addEventListener(type,fn,capture){
   assert.equal(type,'click');assert.equal(capture,true);handlers[type]=fn;
  }
 };
 runInNewContext(helper,{URL,MutationObserver:class{observe(){}},location:{href:loc.href,origin:loc.origin,pathname:loc.pathname},document});
 assert.equal(typeof handlers.click,'function');
 return {
  links,
  click(i){
   const link=links[i];
   handlers.click({target:{closest(selector){assert.equal(selector,'a[href]');return link;}}});
   return link.href;
  }
 };
}
function expected(message,from,origin){
 const values=[message];
 if(origin)values.push('Origem da página: '+origin+'.');
 if(from)values.push('Referência OT: '+from);
 return values.join('\n');
}
function check(name,fn){fn();passed++;console.log('PASS '+name);}

const url=(path,query='')=>'https://olegariotech.com.br'+path+query;
const wa=(message,phone='5511912459144')=>'https://wa.me/'+phone+'?text='+encodeURIComponent(message);
const draft='Olá, OT! Preciso de um site profissional.';
const privateCampaign='cliente_privado_12345';

check('Valinhos paid-search marker is fixed, not copied from arbitrary UTMs or GCLID',()=>{
 const page=scenario(url('/criacao-de-sites-valinhos/','?utm_source=google&utm_medium=cpc&utm_campaign='+privateCampaign+'&gclid=PRIVATE-CLICK-ID'),[wa(draft)]);
 const href=page.click(0),text=new URL(href).searchParams.get('text');
 assert.equal(text,expected(draft,'OT-GADS-SITES-VALINHOS'));
 assert.ok(!text.includes(privateCampaign)&&!text.includes('PRIVATE-CLICK-ID'));
 assert.equal(new URL(href).pathname,'/5511912459144');
 assert.equal(new URL(href).searchParams.size,1);
 assert.equal(new URL(page.click(0)).searchParams.get('text'),text,'no duplicate marker');
});

check('Campinas paid-search marker and unmodified original WhatsApp text',()=>{
 const page=scenario(url('/criacao-de-sites-campinas/','?utm_source=GOOGLE&utm_medium=PPC'),[wa(draft)]);
 assert.equal(new URL(page.click(0)).searchParams.get('text'),expected(draft,'OT-GADS-SITES-CAMPINAS'));
});

check('Service to diagnostic preserves validated UTMs; result keeps summary and origin',()=>{
 const initial=scenario(url('/criacao-de-sites-valinhos/','?utm_source=google&utm_medium=cpc&utm_campaign=ot_pesquisa_valinhos'),['/diagnostico-digital/']);
 const next=initial.links[0].href,u=new URL(next);
 assert.equal(u.pathname,'/diagnostico-digital/');
 assert.equal(u.searchParams.get('origem'),'sites-valinhos');
 assert.equal(u.searchParams.get('utm_source'),'google');
 assert.equal(u.searchParams.get('utm_medium'),'cpc');
 const summary='Olá, OT! Concluí o Diagnóstico Digital no site.\nNegócio: Oficina da Ana\nObjetivo: Gerar mais contatos';
 const diag=scenario(next,[wa(summary)]);
 const text=new URL(diag.click(0)).searchParams.get('text');
 assert.equal(text,expected(summary,'OT-GADS-SITES-VALINHOS','Criação de sites em Valinhos'));
 assert.equal(new URL(diag.click(0)).searchParams.get('text'),text);
});

check('Diagnostic can receive a newly generated summary at click time',()=>{
 const page=scenario(url('/diagnostico-digital/','?origem=sites-campinas&utm_source=google&utm_medium=cpc'),[wa('Mensagem inicial')]);
 page.links[0].href=wa('Mensagem final com respostas');
 assert.equal(new URL(page.click(0)).searchParams.get('text'),expected('Mensagem final com respostas','OT-GADS-SITES-CAMPINAS','Criação de sites em Campinas'));
});

check('Organic and non-Google traffic never claim a Google Ads origin',()=>{
 for(const query of ['','?utm_source=google&utm_medium=organic','?utm_source=instagram&utm_medium=cpc','?utm_source=google&utm_medium=email']){
  const page=scenario(url('/criacao-de-sites-valinhos/',query),[wa(draft)]);
  assert.equal(new URL(page.click(0)).searchParams.get('text'),draft);
 }
});

check('Unauthenticated or unknown diagnostic origin does not invent service marker',()=>{
 const page=scenario(url('/diagnostico-digital/','?origem=unknown&utm_source=google&utm_medium=cpc'),[wa(draft)]);
 assert.equal(new URL(page.click(0)).searchParams.get('text'),draft);
});

check('Existing non-ad diagnostic origin is preserved',()=>{
 const page=scenario(url('/diagnostico-digital/','?origem=google-local'),[wa(draft)]);
 assert.equal(new URL(page.click(0)).searchParams.get('text'),expected(draft,null,'Presença no Google'));
});

check('Unrelated or non-HTTPS WhatsApp URLs are never changed',()=>{
 const badNumber=scenario(url('/criacao-de-sites-valinhos/','?utm_source=google&utm_medium=cpc'),[wa(draft,'5511000000000')]);
 const before=badNumber.links[0].href;
 assert.equal(badNumber.click(0),before);
 const badProtocol=scenario(url('/criacao-de-sites-valinhos/','?utm_source=google&utm_medium=cpc'),['http://wa.me/5511912459144?text=Teste']);
 assert.equal(badProtocol.click(0),'http://wa.me/5511912459144?text=Teste');
});

check('Footer navigation preserves paid campaign and regional context',()=>{
 const page=scenario(url('/criacao-de-sites-valinhos/','?utm_source=google&utm_medium=cpc'),[{href:'/diagnostico-digital/',footer:true}]);
 assert.equal(new URL(page.links[0].href).searchParams.get('utm_source'),'google');
 assert.equal(new URL(page.links[0].href).searchParams.get('origem'),'sites-valinhos');
});

console.log('OT_ADS_WHATSAPP_ORIGIN_QA '+JSON.stringify({passed,externalRequests:0,analyticsEvents:0,whatsappMessagesSent:0}));
