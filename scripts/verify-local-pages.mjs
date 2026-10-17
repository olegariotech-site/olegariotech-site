import assert from 'node:assert/strict';
import { readFile, access, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, webkit } from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=process.env.OT_LOCAL_QA_OUTPUT||'/tmp/ot-seo-local-qa';
const engine=process.env.OT_LOCAL_QA_ENGINE||'chromium';
const port=Number(process.env.OT_LOCAL_QA_PORT||4173);
const origin='http://127.0.0.1:'+port;
const scenarios=[
  {slug:'criacao-de-sites-valinhos',city:'Valinhos',proof:'Armazém Ripamonti',other:'Campinas'},
  {slug:'criacao-de-sites-campinas',city:'Campinas',proof:'K.L Transporte Express',other:'Valinhos'}
];
const viewports=[
  {width:1440,height:900,profile:'desktop'},
  {width:768,height:1024,profile:'tablet'},
  {width:390,height:844,profile:'mobile'}
];

for(const path of ['index.html','sitemap.xml','assets/css/ot-local-commercial.css',...scenarios.map(s=>s.slug+'/index.html')])await access(resolve(root,path));
const main=await readFile(resolve(root,'index.html'),'utf8');
const sitemap=await readFile(resolve(root,'sitemap.xml'),'utf8');
for(const s of scenarios){
  assert.ok(main.includes('href="/'+s.slug+'/"'),'Home links to '+s.city);
  assert.ok(sitemap.includes('https://olegariotech.com.br/'+s.slug+'/'),'Sitemap lists '+s.city);
}
assert.equal((main.match(/<h1\b/g)||[]).length,1,'Home still has exactly one H1');
await mkdir(output,{recursive:true});

const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try{
  let ready=false;
  for(let i=0;i<45;i++){
    try{const resp=await fetch(origin+'/robots.txt');if(resp.ok){ready=true;break;}}catch{}
    await delay(300);
  }
  assert.ok(ready,'Local static web server starts');
  browser=await ({chromium,webkit})[engine].launch({headless:true});
  const findings=[];
  const screenshotPaths=[];
  for(const s of scenarios){
    for(const {width,height,profile} of viewports){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
      await context.addInitScript(()=>{
        localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
      });
      // Avoid running analytics external requests during visual QA; CSS/fonts stay available.
      await context.route(/(googletagmanager|google-analytics|connect\.facebook)\.com/,route=>route.abort());
      const page=await context.newPage();
      const missing=[],jsErrors=[];
      page.on('response',response=>{if(response.status()===404&&response.url().startsWith(origin))missing.push(response.url())});
      page.on('pageerror',error=>jsErrors.push(error.message));
      const target=origin+'/'+s.slug+'/';
      const response=await page.goto(target,{waitUntil:'domcontentloaded'});
      assert.equal(response.status(),200,s.city+' loads with HTTP 200');
      await page.locator('main .lc-callout').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      const info=await page.evaluate(({city,slug})=>{
        const canonical=document.querySelector('link[rel=canonical]')?.href;
        const title=document.title;
        const h1=document.querySelectorAll('h1');
        const desc=document.querySelector('meta[name=description]')?.content;
        const schema=[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent));
        return {
          canonical,title,h1Count:h1.length,h1Text:h1[0]?.innerText,description:desc,
          schema,links:[...document.querySelectorAll('a[href]')].map(x=>({href:x.getAttribute('href'),text:x.textContent.trim()})),
          scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
          cards:document.querySelectorAll('.lc-case').length,
          ctaHeight:document.querySelector('.lc-btn-primary')?.getBoundingClientRect().height,
          images:[...document.querySelectorAll('img[src]')].map(img=>img.getAttribute('src'))
        };
      },s);
      assert.equal(info.canonical,'https://olegariotech.com.br/'+s.slug+'/');
      assert.equal(info.h1Count,1);
      assert.ok(info.h1Text.includes(s.city),'H1 targets city');
      assert.ok(info.description.includes(s.city),'Meta description targets city');
      assert.ok(info.cards>=2,'Real portfolio case cards exist');
      assert.ok(info.ctaHeight>=44,'CTA touch target');
      assert.ok(info.scrollWidth<=info.viewportWidth+2,'No horizontal overflow in '+profile+' '+s.city+' ('+info.scrollWidth+' vs '+info.viewportWidth+')');
      assert.ok(info.links.some(x=>x.href==='/diagnostico-digital/'),'Diagnostic CTA available');
      assert.ok(info.links.some(x=>x.href.includes('wa.me/')),'WhatsApp CTA available');
      assert.ok(info.links.some(x=>x.href.includes(s.other==='Valinhos'?'criacao-de-sites-valinhos':'criacao-de-sites-campinas')),'Cross city navigation');
      assert.ok(info.schema[0]['@graph'].some(n=>n['@type']==='Service'),'Valid service structured data');
      assert.ok(await page.getByText(s.proof).count()>0,'Real case is present '+s.proof);
      // Force lazy assets into screenshot; never change the production page.
      await page.locator('img[loading="lazy"]').evaluateAll(items=>items.forEach(img=>img.loading='eager'));
      const imgData=await page.locator('img').evaluateAll(items=>Promise.all(items.map(async img=>{
        try{await img.decode()}catch{}
        return {src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0};
      })));
      assert.ok(imgData.every(x=>x.loaded),'All page images loaded: '+JSON.stringify(imgData.filter(x=>!x.loaded)));
      assert.deepEqual(missing,[],'No missing local assets');
      assert.deepEqual(jsErrors,[],'No browser JavaScript errors');
      const png=resolve(output,s.slug+'-'+engine+'-'+profile+'.png');
      await page.screenshot({path:png,fullPage:true,animations:'disabled'});
      screenshotPaths.push(png);
      findings.push({city:s.city,engine,profile,viewport:width+'x'+height,title:info.title,h1:info.h1Text,canonical:info.canonical,imageCount:imgData.length,jsErrors,missing,noHorizontalOverflow:true});
      await context.close();
    }
  }
  assert.notEqual(findings[0].h1,findings[3].h1,'Local copy must differ between cities');
  await writeFile(resolve(output,'report-'+engine+'.json'),JSON.stringify({success:true,findings,screenshotPaths},null,2));
  console.log(JSON.stringify({success:true,engine,scenarios:findings.length,screenshots:screenshotPaths.length}));
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
