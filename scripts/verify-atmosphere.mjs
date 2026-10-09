// Actual canvas output, preference changes and whole-home continuity, not source-only assertions.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const playwright=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const output=process.env.OT_ATMOSPHERE_OUTPUT||'/tmp/ot-v21-atmosphere';await mkdir(output,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+'/')&&file!==root)throw Error('Outside root');if((await stat(file)).isDirectory())file+='/index.html';res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
const report={browserPath:'Browser plugin not available; existing Playwright runner',viewports:[],preferences:[],limitations:['Linux engine simulation, no physical GPU/iPhone or speaker certification.','Document visibility is emulated for deterministic lifecycle validation.','Canvas duration measures JS submission, not GPU raster duration.']};
const fonts=new Map();
async function configure(context,mode='full'){
  await context.addInitScript(mode=>{
    localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'}));
    if(mode==='saveData')Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true,addEventListener(){}}});
    if(mode==='lowMemory')Object.defineProperty(navigator,'deviceMemory',{configurable:true,value:4});
    window.__dustDraws=[];
    const clear=CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect=function(...args){
      if(this.canvas.matches('.cosmic-scene')&&args[0]===0&&args[1]===0){const start=performance.now();queueMicrotask(()=>window.__dustDraws.push(performance.now()-start));}
      return clear.apply(this,args);
    };
  },mode);
  if(process.env.OT_QA_PROXY_FONTS==='1')await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,async route=>{const u=route.request().url();if(!fonts.has(u))fonts.set(u,(async()=>{const r=await fetch(u,{signal:AbortSignal.timeout(20000)});assert.ok(r.ok,'Font transport');return {body:Buffer.from(await r.arrayBuffer()),contentType:r.headers.get('content-type')}})());await route.fulfill(await fonts.get(u));});
}
async function pixels(page){return page.locator('.cosmic-scene').evaluate(canvas=>{
  const bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  let painted=0,alpha=0,hash=2166136261;
  for(let i=3;i<bytes.length;i+=4){const a=bytes[i];if(a)painted++;alpha+=a;hash=Math.imul(hash^a,16777619);}
  return {painted,alpha,hash:hash>>>0,width:canvas.width,height:canvas.height};
});}
async function checkPage(page){
  assert.match(await page.title(),/Olegario Tech/);assert.equal(await page.locator('.ot-atmosphere').count(),1);assert.equal(await page.locator('.cosmic-scene').count(),1);
  assert.equal(await page.locator('.ot-atmosphere').getAttribute('aria-hidden'),'true');
  assert.equal(await page.locator('.ot-atmosphere').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'No horizontal overflow');
  assert.equal(await page.locator('#inicio h1').innerText(),'Sites que\ngeram\nnegócios.');
}
try{for(const engine of (process.env.OT_QA_ENGINES||'chromium').split(',')){
  const browser=await playwright[engine].launch(engine==='chromium'?{executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{});
  try{
    for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[768,1024],[360,800],[390,844],[430,932]]){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});await configure(context);const page=await context.newPage(),errors=[],consoleErrors=[],notFound=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});page.on('response',r=>{if(r.status()===404)notFound.push(r.url())});
      await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);await checkPage(page);
      const samples=[];
      if(width===1440){
        await page.waitForFunction(()=>['webgl','canvas2d'].includes(document.getElementById('earthJourney').dataset.renderer));
        const renderer=await page.locator('#earthJourney').getAttribute('data-renderer');
        let rotation=null;
        if(renderer==='webgl'){
          await page.evaluate(()=>{window.__globePoses=[];const original=THREE.Mesh.prototype.onBeforeRender;THREE.Mesh.prototype.onBeforeRender=function(...args){if(this.material?.map)window.__globePoses.push(this.rotation.y);return original.apply(this,args)}});
          await page.waitForTimeout(1500);const poses=await page.evaluate(()=>window.__globePoses);
          assert.ok(new Set(poses.map(v=>v.toFixed(5))).size>=2&&poses.at(-1)>poses[0],'Original WebGL globe really rotates');rotation={poses:poses.length,deltaRadians:poses.at(-1)-poses[0]};
        }
        const phases=[];
        for(const [name,progress] of [['particles',.29],['waves',.69]]){
          await page.evaluate(progress=>{const h=document.getElementById('inicio').getBoundingClientRect().height;scrollTo({top:h*.9*progress,behavior:'instant'})},progress);await page.waitForTimeout(350);
          const state=await page.locator('#earthJourney').evaluate(el=>({pulse:Number(el.dataset.pulse),morph:Number(el.dataset.morph),opacity:Number(el.dataset.opacity)}));
          if(name==='particles')assert.ok(state.pulse>.6&&state.morph<.25);else assert.ok(state.morph>.55&&state.opacity>.1);
          phases.push({name,...state});await page.screenshot({path:`${output}/${engine}-1440x900-${name}.png`});
        }
        if(engine==='chromium'){
          const button=page.locator('.desktop-audio-toggle');await button.click();await page.waitForFunction(()=>{const a=document.getElementById('backgroundAudio');return !a.paused&&a.currentTime>.1});
          const audio=await page.locator('#backgroundAudio').evaluate(a=>({src:new URL(a.currentSrc).pathname,loop:a.loop,volume:a.volume,paused:a.paused}));
          assert.equal(audio.src,'/assets/audio/background.mp3');assert.equal(audio.loop,true);assert.equal(audio.volume,.25);assert.equal(await button.getAttribute('aria-pressed'),'true');
          await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');assert.ok(await page.locator('#backgroundAudio').evaluate(a=>a.paused&&a.muted));report.audio={...audio,togglePreserved:true};
        }
        (report.timeline||=[]).push({engine,renderer,rotation,phases});
      }
      for(const [label,selector] of [['hero','#inicio'],['projects','#projetos'],['solutions','#solucoes'],['method','#metodo'],['closing','.footer']]){
        await page.locator(selector).scrollIntoViewIfNeeded();if(label==='hero')await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
        await page.waitForTimeout(450);await checkPage(page);const a=await pixels(page);assert.ok(a.painted>0,`${label} has real atmosphere pixels`);
        if(label==='method'){
          assert.equal(Number(await page.locator('#earthJourney').getAttribute('data-opacity')),0,'Globe is already out of view');
          await page.waitForTimeout(350);const b=await pixels(page);assert.notEqual(a.hash,b.hash,'Atmosphere moves beyond the HERO');
        }
        samples.push({label,...a});await page.screenshot({path:`${output}/${engine}-${width}x${height}-${label}.png`});
      }
      const draws=await page.evaluate(()=>window.__dustDraws);const sorted=draws.slice().sort((a,b)=>a-b);
      report.viewports.push({engine,width,height,samples,drawCount:draws.length,canvasJSSubmissionP95ms:sorted[Math.floor(sorted.length*.95)],errors,consoleErrors,notFound});
      assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(notFound,[]);await context.close();
    }
    for(const mode of ['reduce','saveData','lowMemory']){
      const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:mode==='reduce'?'reduce':'no-preference'});await configure(context,mode);
      const page=await context.newPage();await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.locator('#metodo').scrollIntoViewIfNeeded();await page.waitForTimeout(650);
      const a=await pixels(page),n=await page.evaluate(()=>window.__dustDraws.length);await page.waitForTimeout(350);const b=await pixels(page),end=await page.evaluate(()=>window.__dustDraws.length);
      assert.equal(a.hash,b.hash,mode+' has stable atmosphere');assert.equal(n,end,mode+' has no continuous canvas loop');assert.ok(a.painted>0);
      if(mode==='reduce'){
        await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(400);const started=await page.evaluate(()=>window.__dustDraws.length);assert.ok(started>end,'Dynamic preference resumes atmosphere');
        await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(500);const stopped=await page.evaluate(()=>window.__dustDraws.length);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__dustDraws.length),stopped,'Dynamic reduced motion stops the loop');
      }
      report.preferences.push({engine,mode,stable:true,loopStopped:true});await context.close();
    }
    const context=await browser.newContext({viewport:{width:1440,height:900}});await configure(context);const page=await context.newPage();await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(600);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForTimeout(250);const stopped=await page.evaluate(()=>window.__dustDraws.length);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__dustDraws.length),stopped,'Hidden page pauses atmosphere');
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(350);assert.ok(await page.evaluate(()=>window.__dustDraws.length)>stopped,'Visible page resumes atmosphere');
    for(const size of [{width:390,height:844},{width:1440,height:900},{width:430,height:932}]){await page.setViewportSize(size);await page.waitForTimeout(300);await checkPage(page);}
    assert.equal(await page.locator('.ot-atmosphere').count(),1);report.preferences.push({engine,mode:'visibility-and-resize',pauseResume:true,singleCanvas:true});await context.close();
  }finally{await browser.close()}
}
report.passed=true;console.log(JSON.stringify({passed:true,viewports:report.viewports.length,preferenceScenarios:report.preferences.length}));
}finally{await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));server.close();}
