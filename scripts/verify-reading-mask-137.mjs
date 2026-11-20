// Pixel comparison of the browser-rendered original SVG and its production cache.
// The temporary white/black fixture isolates alpha from the moving globe underneath.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {launch,replay,ready,pw,engine,out,save} from './qa-pre-ads-134-lib.mjs';
const {PNG}=await import(process.env.OT_PNG_MODULE||'pngjs');
const report={issue:137,engine,cases:[],network:[],status:'FAIL'};
let browser;
try{
  browser=await launch();await mkdir(out,{recursive:true});
  for(const width of [390,768]){
    const profile=engine==='webkit'?pw.devices['iPhone 13']:engine==='chromium'?pw.devices['Pixel 7']:{viewport:{width,height:844}};
    const context=await browser.newContext({...profile,viewport:{width,height:844},reducedMotion:'no-preference',serviceWorkers:'block'});await replay(context,{report});
    await context.addInitScript(()=>{
      localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
      Object.defineProperty(navigator,'deviceMemory',{value:4,configurable:true});Object.defineProperty(navigator,'hardwareConcurrency',{value:8,configurable:true});
      document.addEventListener('ot-earth-continuum',()=>{const earth=document.querySelector('#earthJourney'),mask=earth.style.getPropertyValue('mask-image');if(mask.includes('data:image/svg+xml'))window.__originalReadingMask=mask;},true);
    });
    const page=await context.newPage();await ready(page,'/');await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';const r=document.querySelector('#projetos').getBoundingClientRect();scrollTo({top:scrollY+r.bottom-innerHeight*.55,behavior:'instant'});});
    await page.waitForFunction(()=>document.querySelector('#earthJourney').dataset.readingMask==='bitmap'&&window.__originalReadingMask);
    const state=await page.evaluate(()=>({svg:window.__originalReadingMask,bitmap:document.querySelector('#earthJourney').style.getPropertyValue('mask-image'),width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));
    assert.ok(state.svg.includes('data:image/svg+xml'));assert.ok(state.bitmap.includes('data:image/png'));
    await page.evaluate(state=>{
      const background=document.createElement('div');background.style.cssText='position:fixed;inset:0;background:black;z-index:2147483646';document.body.append(background);
      const sample=document.createElement('div');sample.id='mask-alpha-fixture';sample.style.cssText='position:fixed;inset:0;background:white;z-index:2147483647';
      sample.style.maskImage=state.svg;sample.style.webkitMaskImage=state.svg;sample.style.maskSize=state.width+'px '+state.height+'px';sample.style.webkitMaskSize=sample.style.maskSize;document.body.append(sample);
    },state);
    const before=await page.screenshot({path:resolve(out,'mask-alpha-'+width+'-svg.png'),animations:'disabled'});
    await page.locator('#mask-alpha-fixture').evaluate((el,mask)=>{el.style.maskImage=mask;el.style.webkitMaskImage=mask;},state.bitmap);
    const after=await page.screenshot({path:resolve(out,'mask-alpha-'+width+'-bitmap.png'),animations:'disabled'});
    const a=PNG.sync.read(before),b=PNG.sync.read(after);assert.equal(a.width,b.width);assert.equal(a.height,b.height);
    let maximum=0,total=0,changed=0;
    for(let i=0;i<a.data.length;i+=4){let different=false;for(let c=0;c<3;c++){const d=Math.abs(a.data[i+c]-b.data[i+c]);maximum=Math.max(maximum,d);total+=d;different||=d>0;}if(different)changed++;}
    const mean=total/(a.width*a.height*3);report.cases.push({width,dpr:state.dpr,pixels:a.width*a.height,maximum,mean,changed});
    // Chosen before sampling: at most two 8-bit levels of raster quantization,
    // mean below 0.05. No geometry, blur, opacity or native DPR reduction allowed.
    assert.ok(maximum<=2,'Native-DPR mask alpha differs by at most two 8-bit levels');assert.ok(mean<=.05,'Mean alpha quantization stays below 0.05');
    await context.close();
  }
  report.status='PASS';console.log(JSON.stringify({status:'PASS',engine,cases:report.cases},null,2));
}catch(error){report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{await save('reading-mask-137.json',report);await browser?.close();}
