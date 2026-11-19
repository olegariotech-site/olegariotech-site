// Issue #134 QA only. No collector or WhatsApp navigation is ever sent.
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
export const ORIGIN='https://olegariotech.com.br';
export const FIXTURE='AUDITORIA_OT_134_FICTICIO';
export const root=resolve(process.env.OT_134_ROOT||fileURLToPath(new URL('../',import.meta.url)));
export const engine=process.env.OT_134_ENGINE||'chromium';
export const out=resolve(process.env.OT_134_OUTPUT||'/tmp/ot-pre-ads-134',engine);
export const pw=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
export async function launch(){
 const options={headless:true};
 if(engine==='chromium'&&process.env.OT_CHROME_EXECUTABLE)options.executablePath=process.env.OT_CHROME_EXECUTABLE;
 if(process.env.HTTPS_PROXY)options.proxy={server:process.env.HTTPS_PROXY};
 if(engine==='firefox'&&process.env.OT_FIREFOX_PROFILE){
  const context=await pw.firefox.launchPersistentContext(process.env.OT_FIREFOX_PROFILE,options);
  return context.browser();
 }
 return pw[engine].launch(options);
}
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff2':'font/woff2'};
function vendor(url){
 return url.protocol==='https:'&&(
  url.hostname==='www.googletagmanager.com'&&['/gtag/js','/gtag/destination'].includes(url.pathname)||
  url.hostname==='connect.facebook.net'&&(/^\/[a-z_]+\/fbevents\.js$/i.test(url.pathname)||/^\/signals\/config\/1822005305910193\/?$/.test(url.pathname)));
}
function decode(value){for(let i=0;i<5;i++){try{const next=decodeURIComponent(value);if(next===value)break;value=next;}catch{break;}}return value;}
function attempt(request,phase){
 const url=new URL(request.url()),body=request.postData()||'',multi={};
 const boundary=request.headers()['content-type']?.split('boundary=')[1];
 if(boundary)for(const part of body.split('--'+boundary)){const match=part.match(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/);if(match)multi[match[1]]=match[2];}
 const rows=body.split('\n').map(line=>new URLSearchParams(url.search.slice(1)+'&'+line));
 const text=decode(url.href+' '+body);
 let pagePath=null;try{pagePath=new URL(rows[0].get('dl')||'').pathname;}catch{ /* Non-GA request. */ }
 return {phase,time:new Date().toISOString(),host:url.hostname,path:url.pathname,method:request.method(),
  events:multi.ev?[multi.ev]:[...new Set(rows.flatMap(p=>[...p.getAll('en'),...p.getAll('ev')]))],
  keys:boundary?Object.keys(multi):[...new Set(rows.flatMap(p=>[...p.keys()]))],
  googleConsent:rows[0].get('gcs'),
  pagePath,
  containsFixture:text.includes(FIXTURE),containsWhatsAppDraft:/wa\.me\/[^"\s]*\?text=/.test(text),
  blockedBeforeCollection:true};
}
export async function replay(context,{real=false,report,base=root}={}){
 report.network??=[];report.libraries??=[];report.vendorFailures??=[];report.pendingBodies??=[];report.optionalRequests??=[];
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin===ORIGIN){
   try{let file=resolve(base,'.'+decodeURIComponent(url.pathname));if(file!==base&&!file.startsWith(base+'/'))throw Error('Path escape');if((await stat(file)).isDirectory())file=resolve(file,'index.html');return route.fulfill({status:200,contentType:mime[extname(file)]||'application/octet-stream',body:await readFile(file)});}
   catch{return route.fulfill({status:404,body:'Not found'});}
  }
  if(real&&vendor(url)){report.optionalRequests.push({phase:report.phase||'initial',url:url.origin+url.pathname});return route.continue();}
  // Fonts are read-only assets; all other external destinations fail closed.
  if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.continue();
  const row=attempt(request,report.phase||'initial');
  report.network.push(row);
  return route.fulfill({status:200,contentType:'application/javascript',body:''});
 });
 context.on('response',response=>{
  if(!real||!vendor(new URL(response.url())))return;
  report.pendingBodies.push((async()=>{try{const bytes=await response.body();report.libraries.push({url:response.url().split('?')[0],status:response.status(),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}catch(error){report.vendorFailures.push({url:response.url().split('?')[0],error:error.message});}})());
 });
 context.on('requestfailed',request=>{if(vendor(new URL(request.url())))report.vendorFailures.push({url:request.url().split('?')[0],error:request.failure()?.errorText});});
}
export async function settled(report,ms=2500){await delay(ms);await Promise.allSettled(report.pendingBodies||[]);}
export const collections=report=>report.network.filter(x=>/google-analytics\.com$|facebook\.com$|googlesyndication\.com$|doubleclick\.net$|googleadservices\.com$/.test(x.host));
export async function ready(page,path){await page.goto(path.startsWith('https:')?path:ORIGIN+path,{waitUntil:'load'});await page.waitForFunction(()=>Boolean(window.OTAnalytics));}
export async function answer(page){for(let i=0;i<5;i++){await page.locator('.step.active .opt').first().click();await page.locator('.step.active[data-step="'+(i+1)+'"]').waitFor();}await page.locator('#nomeNegocio').fill(FIXTURE);await page.locator('[data-finish]').click();await page.locator('.step.active[data-step="6"]').waitFor();}
export async function waClick(page,selector='#waLink'){
 const link=page.locator(selector).first();
 await link.evaluate(el=>{if(!el.dataset.otQaPreventNavigation){el.dataset.otQaPreventNavigation='1';el.addEventListener('click',event=>event.preventDefault());}});
 await link.click();return new URL(await link.getAttribute('href'),ORIGIN).searchParams.get('text');
}
export async function preferences(page,analytics,marketing){
 if(!await page.locator('#otConsent').isVisible())await page.locator('#otConsentSettings').click();
 await page.locator('[data-consent-customize]').click();
 await page.locator('[data-consent-analytics]').setChecked(analytics);
 await page.locator('[data-consent-marketing]').setChecked(marketing);
 await page.locator('[data-consent-save]').click();
}
export async function snapshot(page){return page.evaluate(()=>({consent:window.OTAnalytics.getConsent(),gaDisabled:window['ga-disable-'+window.OT_GA_ID],googleFrames:document.querySelectorAll('#ot-ga4-frame').length,ga:(window.dataLayer||[]).filter(x=>x[0]==='event').map(x=>({event:x[1],params:x[2]})),configs:(window.dataLayer||[]).filter(x=>x[0]==='config').length,scripts:[...document.scripts].map(x=>x.src).filter(Boolean)}));}
export async function save(name,report){await mkdir(out,{recursive:true});const {pendingBodies,...safe}=report;await writeFile(resolve(out,name),JSON.stringify(safe,null,2)+'\n');}
