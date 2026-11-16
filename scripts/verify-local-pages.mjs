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
  {slug:'criacao-de-sites-campinas',city:'Campinas',proof:'K.L Transporte Express',other:'Valinhos'},
  {slug:'presenca-no-google',city:'Google',proof:'K.L Transporte Express',other:'Campinas',minCards:3},
  {slug:'anuncios-google-instagram',city:'Valinhos',proof:null,other:'Campinas',minCards:0,kind:'ads'}
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
    for(const {width,height,profile} of (s.kind==='ads'?[...viewports,{width:1366,height:768,profile:'notebook'}]:viewports)){
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
      if(s.kind==='ads'){
        assert.ok(info.h1Text.includes('Google')&&info.h1Text.includes('Instagram'),'Ads H1 names both ad channels');
      }else assert.ok(info.h1Text.includes(s.city),'H1 targets city');
      assert.ok(info.description.includes(s.city),'Meta description targets city');
      assert.ok(info.cards>=(s.minCards??2),'Expected portfolio cards present');
      assert.ok(info.ctaHeight>=44,'CTA touch target');
      if(info.scrollWidth>info.viewportWidth+2){
        const detail=await page.evaluate(()=>{
          const el=document.documentElement,body=document.body;
          const styles=node=>{const s=getComputedStyle(node);return {overflowX:s.overflowX,width:s.width,minWidth:s.minWidth,transform:s.transform}};
          const sized=[...document.querySelectorAll('body,body *')].map(node=>({node,rect:node.getBoundingClientRect(),client:node.clientWidth,scroll:node.scrollWidth}));
          const offenders=sized.filter(x=>x.rect.left<-3||x.rect.right>innerWidth+3||x.scroll>x.client+2).sort((a,b)=>b.rect.right-a.rect.right).slice(0,30).map(x=>({tag:x.node.tagName.toLowerCase(),className:String(x.node.className||'').slice(0,140),left:Math.round(x.rect.left),right:Math.round(x.rect.right),client:x.client,scroll:x.scroll,styles:styles(x.node)}));
          const suspects=[...document.querySelectorAll('.lc-orbit,.lc-hero,.lc-header,.lc-shell,.lc-nav,.lc-breadcrumb')].slice(0,16).map(node=>({tag:node.tagName,className:node.className,rect:{left:node.getBoundingClientRect().left,right:node.getBoundingClientRect().right},client:node.clientWidth,scroll:node.scrollWidth}));
          return {innerWidth,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,bodyWidth:body.scrollWidth,bodyClient:body.clientWidth,htmlStyles:styles(el),bodyStyles:styles(body),offenders,suspects};
        });
        try{await page.screenshot({path:resolve(output,s.slug+'-'+engine+'-'+profile+'-OVERFLOW.png'),fullPage:true,animations:'disabled'})}catch{}
        console.error('Horizontal overflow diagnostics',JSON.stringify({slug:s.slug,city:s.city,profile,width,height,...detail},null,2));
      }
      assert.ok(info.scrollWidth<=info.viewportWidth+2,'No horizontal overflow in '+profile+' '+s.slug+' ('+info.scrollWidth+' vs '+info.viewportWidth+')');
      assert.ok(info.links.some(x=>x.href==='/diagnostico-digital/'),'Diagnostic CTA available');
      assert.ok(info.links.some(x=>x.href.includes('wa.me/')),'WhatsApp CTA available');
      assert.ok(info.links.some(x=>x.href.includes(s.other==='Valinhos'?'criacao-de-sites-valinhos':'criacao-de-sites-campinas')),'Cross city navigation');
      assert.ok(info.schema[0]['@graph'].some(n=>n['@type']==='Service'),'Valid service structured data');
      if(s.proof)assert.ok(await page.getByText(s.proof).count()>0,'Real case is present '+s.proof);
      if(s.kind==='ads'){
        const ads=await page.evaluate(()=>{
          const stage=document.querySelector('.ot-ads-stage');
          const preview=document.querySelector('.ot-ads-preview');
          const box=stage?.getBoundingClientRect();
          return {
            stageHeight:box?.height,
            devices:preview?.querySelectorAll('.ot-ads-device').length,
            faq:document.querySelectorAll('.lc-faq details').length,
            text:document.querySelector('main')?.innerText||'',
            hasNoTrackingWithoutConsent:document.head.innerHTML.includes("analytics_storage:'denied'")
          };
        });
        assert.ok(ads.stageHeight>=160,'Ad preview keeps visible height on '+engine+' '+profile);
        assert.equal(ads.devices,2,'Both example ad formats are shown');
        assert.ok(ads.faq>=4,'Transparent ad FAQs are available');
        assert.ok(ads.text.includes('verba de mídia')||ads.text.includes('verba paga'),'Media budget is explained separately');
        assert.ok(ads.text.includes('Não garantimos'),'No guaranteed sales or ad results');
        assert.ok(ads.hasNoTrackingWithoutConsent,'Analytics consent defaults to denied');
        assert.ok(await page.locator('a[href="/presenca-no-google/"]').count()>0,'Organic SEO service link is available');
        const polish=await page.evaluate(()=>{
          const rect=node=>{const r=node?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width}:null};
          const links=document.querySelector('.lc-footer-links');
          const items=links?[...links.querySelectorAll('a')]:[];
          const section=document.querySelector('[aria-labelledby="ads-processo"]');
          return {
            heroCta:rect(document.querySelector('.ot-ads-hero .lc-btn-primary')),
            footerFirst:rect(items[0]),footerLast:rect(items.at(-1)),
            processPadding:parseFloat(getComputedStyle(section).paddingTop),
            privacy:rect(document.querySelector('.ot-consent-settings')),
            viewport:innerWidth
          };
        });
        assert.ok(polish.processPadding<=65,'V1.1 reduces inter-section spacing');
        if(profile==='notebook'||profile==='desktop'){
          assert.ok(polish.heroCta&&polish.heroCta.bottom<=height-8,
            'Main diagnostic CTA must appear in first viewport on '+profile+' ('+(polish.heroCta?.bottom||0)+' vs '+height+')');
          assert.ok(polish.footerFirst&&polish.footerLast&&Math.abs(polish.footerFirst.top-polish.footerLast.top)<3,
            'Desktop footer links must remain on the same row');
        }
        assert.ok(polish.privacy,'Privacy settings trigger must exist');
        if(polish.privacy){
          assert.ok(polish.privacy.height>=44,'Privacy trigger keeps a 44px minimum touch target');
          if(profile==='mobile')assert.ok(polish.privacy.width<=48,'Mobile privacy icon stays compact');
          assert.ok(polish.privacy.right>=polish.viewport-38,'Privacy preferences remain docked right');
        }

      }
      if(s.slug==='presenca-no-google'){
        const portfolio=await page.locator('.lc-google-portfolio').evaluate(node=>({
          featured:node.querySelectorAll('.lc-google-featured').length,
          supporting:node.querySelectorAll('.lc-google-more .lc-case').length,
          names:[...node.querySelectorAll('.lc-case h3')].map(x=>x.textContent.trim()),
          links:[...node.querySelectorAll('.lc-case a[href]')].map(x=>x.href)
        }));
        const featuredMedia=await page.locator('.lc-google-featured .lc-case-media').boundingBox();
        const featuredImage=await page.locator('.lc-google-featured .lc-case-media img').boundingBox();
        assert.ok(featuredMedia&&featuredMedia.height>=100,'K.L featured media must remain visually visible on '+engine+' '+profile);
        assert.ok(featuredImage&&featuredImage.height>=100,'K.L image must have visible height on '+engine+' '+profile);
        assert.equal(portfolio.featured,1,'K.L is a single featured case');
        assert.equal(portfolio.supporting,2,'Açaí and Adega are two supporting cases');
        assert.deepEqual(portfolio.names,['K.L Transporte Express','Açaí do Dudu','Adega São Marcos']);
        for(const url of ['https://kltransporteexpress.com.br/','https://acaidodudu.com.br/','https://adegasaomarcos.com.br/'])assert.ok(portfolio.links.includes(url),'Verified case link '+url);
      }
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
      if(s.kind==='ads'&&profile==='mobile'){
        const trigger=page.locator('.ot-consent-settings');
        assert.match(await trigger.innerText(),/Privacidade/i,'Privacy icon retains accessible text');
        await trigger.click();
        assert.ok(await page.locator('.ot-consent.is-visible').count()>0,'Privacy panel can still be opened from compact icon');
      }
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
