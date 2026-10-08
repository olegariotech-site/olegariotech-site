// Review-only recording: the application remains byte-identical to PR #91.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const output=process.env.OT_EARTH_EVIDENCE||'/tmp/ot-earth-evidence';
const applicationCommit='8667ec5473c7f97525826f2a6a91c6067698db65';
const changed=execFileSync('git',['diff','--name-only',applicationCommit,'HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.ok(changed.every(path=>path==='scripts/record-earth-evidence.mjs'||path==='.github/workflows/earth-visual-evidence.yml'||path.startsWith('docs/reviews/ot-premium-v2-gate-b/earth-validation/')),'Only review automation/evidence may differ from the approved PR application');
await mkdir(resolve(output,'frames'),{recursive:true});
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+'/'))throw Error('Outside root');if((await stat(file)).isDirectory())file+='/index.html';res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const report={applicationCommit,reviewCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),url,viewport:{width:1440,height:900},browserPath:'Browser plugin not available; existing Playwright QA runner',reducedMotion:'no-preference',unchangedApplication:true,errors:[],notFound:[],samples:[],limitations:['WebGL rendered by SwiftShader in GitHub Ubuntu; this is browser rendering, not a simulated planet animation.','Audio is captured from the real HTMLAudioElement stream; physical speaker output is not certified.','No animation speed, application style, geometry, shader or timeline was changed. Only the review operator scrolls the page.']};
let browser,session;
try{
  browser=await chromium.launch({executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.browserVersion=browser.version();
  const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,reducedMotion:'no-preference'});
  await context.addInitScript(()=>localStorage.setItem('ot_consent_preferences_v2',JSON.stringify({analytics:'denied',marketing:'denied'})));
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});page.on('response',r=>{if(r.status()===404)report.notFound.push(r.url())});
  assert.equal((await page.goto(url,{waitUntil:'networkidle'})).status(),200);
  await page.waitForFunction(()=>window.OTProjectShowroom&&document.getElementById('earthJourney').dataset.renderer);
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>document.getElementById('earthJourney').dataset.renderer==='webgl');
  assert.equal(await page.title(),'Olegario Tech | Sites e páginas de venda que geram negócios');
  assert.ok(await page.locator('main').innerText());assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(),0);
  report.title=await page.title();report.renderer=await page.locator('#earthJourney').getAttribute('data-renderer');
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches),false);
  // Observe the original mesh draw callback; do not modify objects or uniforms.
  // r128 assigns renderer.render on the instance, while Mesh.onBeforeRender is inherited.
  await page.evaluate(()=>{const original=THREE.Mesh.prototype.onBeforeRender;THREE.Mesh.prototype.onBeforeRender=function(...args){if(this.material?.map)window.__qaRotation={y:this.rotation.y,at:performance.now()};return original.apply(this,args)}});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>window.__qaRotation&&document.getElementById('earthJourney').dataset.animate==='true');
  const button=page.locator('.desktop-audio-toggle');assert.ok(await button.isVisible());
  assert.equal(await button.getAttribute('aria-label'),'Ativar som');assert.equal(await button.getAttribute('aria-pressed'),'false');
  await button.click();await page.waitForFunction(()=>{const a=document.getElementById('backgroundAudio');return !a.paused&&!a.muted&&a.currentTime>.2});
  assert.equal(await button.getAttribute('aria-label'),'Desativar som');assert.equal(await button.getAttribute('aria-pressed'),'true');
  await page.mouse.move(1,1);
  report.audio=await page.locator('#backgroundAudio').evaluate(a=>({src:a.currentSrc,currentTimeBefore:a.currentTime,loop:a.loop,volume:a.volume,paused:a.paused,muted:a.muted}));
  assert.ok(report.audio.src.endsWith('/assets/audio/background.mp3'));assert.equal(report.audio.volume,.25);assert.equal(report.audio.loop,true);
  report.geometry=await page.evaluate(()=>{const e=document.getElementById('earthJourney'),d=Number(e.dataset.diameter),x=Number(e.dataset.centerX),y=Number(e.dataset.centerY);return {diameter:d,x,y,entireGlobeInViewport:x-d/2>=0&&x+d/2<=innerWidth&&y-d/2>=0&&y+d/2<=innerHeight,heroHeight:document.getElementById('inicio').getBoundingClientRect().height,projectsTop:document.getElementById('projetos').getBoundingClientRect().top+scrollY}});
  assert.equal(report.geometry.entireGlobeInViewport,true,'The initial complete globe must be inside 1440×900');
  await page.screenshot({path:resolve(output,'hero-start.jpg'),type:'jpeg',quality:90});
  // Capture the decoded, real audio stream without rerouting the element playback.
  await page.evaluate(async()=>{const a=document.getElementById('backgroundAudio'),stream=a.captureStream();if(!stream.getAudioTracks().length)throw Error('No audio track');const audioContext=new AudioContext(),source=audioContext.createMediaStreamSource(stream),analyser=audioContext.createAnalyser();source.connect(analyser);await audioContext.resume();const chunks=[],recorder=new MediaRecorder(stream,{mimeType:'audio/webm'});recorder.ondataavailable=e=>chunks.push(e.data);window.__qaSound={audioContext,analyser,chunks,recorder,stream};});
  session=await context.newCDPSession(page);
  const frames=[],pending=[];
  let epoch;
  session.on('Page.screencastFrame',event=>{
    const index=frames.length,file=resolve(output,'frames',String(index).padStart(5,'0')+'.jpg');
    frames.push({file,timestamp:event.metadata.timestamp,relative:event.metadata.timestamp-epoch});
    pending.push(writeFile(file,Buffer.from(event.data,'base64')));
    session.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  });
  epoch=await page.evaluate(()=>Date.now()/1000);
  await session.send('Page.startScreencast',{format:'jpeg',quality:86,maxWidth:1440,maxHeight:900,everyNthFrame:1});
  await page.evaluate(async()=>{
    const start=performance.now(),heroHeight=document.getElementById('inicio').getBoundingClientRect().height;
    const target=document.getElementById('projetos').getBoundingClientRect().top+scrollY-90;
    const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
    window.__qaTimeline=[];window.__qaSound.recorder.start();
    let lastSample=-1;
    await new Promise(resolve=>{
      function step(now){
        const t=(now-start)/1000;
        let y=0;
        if(t>=3.8&&t<6)y=heroHeight*.26*smooth((t-3.8)/2.2);
        else if(t>=6&&t<7.8)y=heroHeight*(.26+(.63-.26)*smooth((t-6)/1.8));
        else if(t>=7.8&&t<8.7)y=heroHeight*.63;
        else if(t>=8.7&&t<10.3)y=heroHeight*.63+(target-heroHeight*.63)*smooth((t-8.7)/1.6);
        else if(t>=10.3)y=target;
        scrollTo({top:y,behavior:'instant'});
        if(t-lastSample>=.1){lastSample=t;const e=document.getElementById('earthJourney'),a=document.getElementById('backgroundAudio'),samples=new Float32Array(window.__qaSound.analyser.fftSize);window.__qaSound.analyser.getFloatTimeDomainData(samples);window.__qaTimeline.push({t,scrollY,rotation:window.__qaRotation?.y,progress:Number(e.dataset.progress),pulse:Number(e.dataset.pulse),morph:Number(e.dataset.morph),opacity:Number(e.dataset.opacity),wave:e.classList.contains('is-wave'),audioTime:a.currentTime,audioRms:Math.sqrt(samples.reduce((n,v)=>n+v*v,0)/samples.length),soundButton:document.querySelector('.desktop-audio-toggle').getAttribute('aria-pressed')});}
        if(t<11.5)requestAnimationFrame(step);else resolve();
      }requestAnimationFrame(step);
    });
  });
  await session.send('Page.stopScreencast');await Promise.all(pending);
  report.samples=await page.evaluate(()=>window.__qaTimeline);
  const audioData=await page.evaluate(async()=>{const s=window.__qaSound;await new Promise(r=>{s.recorder.onstop=r;s.recorder.stop()});const blob=new Blob(s.chunks,{type:'audio/webm'});return await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result.split(',')[1]);reader.readAsDataURL(blob)})});
  await writeFile(resolve(output,'real-audio.webm'),Buffer.from(audioData,'base64'));
  await page.screenshot({path:resolve(output,'premium-v2.jpg'),type:'jpeg',quality:90});
  report.audio.currentTimeAfter=await page.locator('#backgroundAudio').evaluate(a=>a.currentTime);
  assert.ok(report.audio.currentTimeAfter-report.audio.currentTimeBefore>=10,'Real audio playback clock advances throughout the film');
  assert.ok(report.samples.some(s=>s.audioRms>.0001),'Decoded audio contains a real signal');
  report.audio.maxRms=Math.max(...report.samples.map(s=>s.audioRms));
  await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await button.getAttribute('aria-label'),'Ativar som');
  report.audio.off=await page.locator('#backgroundAudio').evaluate(a=>({paused:a.paused,muted:a.muted}));assert.deepEqual(report.audio.off,{paused:true,muted:true});
  const rotation=report.samples.filter(s=>s.t<3.7).map(s=>s.rotation);
  report.rotationDeltaRadians=rotation.at(-1)-rotation[0];assert.ok(report.rotationDeltaRadians>.25,'Original rendered globe actually rotates');
  assert.ok(report.samples.some(s=>s.pulse>.55&&s.morph<.2),'Globe becomes continental particles');
  assert.ok(report.samples.some(s=>s.wave&&s.morph>.7&&s.opacity>.1),'Wave stage is visibly present');
  assert.equal(await page.locator('#projetos h2').innerText(),'Prova antes da promessa.');assert.equal(await page.locator('#projectStage').getAttribute('data-selected-project'),'kl');
  const box=await page.locator('#projectStage').boundingBox();assert.ok(box.y<900&&box.y+box.height>90,'Integrated showroom appears in the recording');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.notFound,[]);
  assert.ok(frames.length>=40,'Enough real screencast frames to show continuous motion');
  // Preserve the native frame timestamps; no speed-up or synthetic animation.
  const origin=frames[0].timestamp;
  const normalized=frames.map(f=>({...f,t:f.timestamp-origin}));
  const concat=normalized.map((f,i)=>`file '${f.file}'\nduration ${i+1<normalized.length?Math.max(.001,normalized[i+1].t-f.t):.1}`).join('\n')+'\n'+`file '${normalized.at(-1).file}'\n`;
  await writeFile(resolve(output,'frames.txt'),concat);
  execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',resolve(output,'frames.txt'),'-i',resolve(output,'real-audio.webm'),'-t','11.5','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-vf','fps=30','-c:a','aac','-b:a','128k','-movflags','+faststart',resolve(output,'earth-home-1440x900.mp4')]);
  for(const [name,time] of [['particles',5.9],['waves',8.2]]){
    const nearest=normalized.reduce((best,f)=>Math.abs(f.t-time)<Math.abs(best.t-time)?f:best,normalized[0]);await copyFile(nearest.file,resolve(output,name+'.jpg'));
  }
  report.frameCount=frames.length;report.frameTimestampSpan=normalized.at(-1).t;report.duration=11.5;report.timeline=[{seconds:'0–3.8',state:'Complete rotating Earth in the original HERO, real audio on'},{seconds:'3.8–6',state:'Scroll into continental particles'},{seconds:'6–8.7',state:'Perspective waves'},{seconds:'8.7–11.5',state:'Passage into integrated Premium V2 showroom'}];
  report.passed=true;await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));
  await writeFile(resolve(output,'README.md'),`# Terra — validação visual do PR #91\n\nGravação real de **11,5 segundos**, viewport **1440 × 900**, Chromium ${report.browserVersion}, WebGL/SwiftShader e movimento habilitado. A aplicação é byte-idêntica ao commit **${applicationCommit}**; esta branch contém apenas automação e evidências de revisão.\n\n[Assistir ao vídeo com áudio real](./earth-home-1440x900.mp4) · [Dados e assertions](./report.json)\n\n0–3,8s: Terra inteira e rotação original. 3,8–6s: partículas. 6–8,7s: ondas. 8,7–11,5s: vitrine Premium V2 integrada. Sem aceleração do filme ou da Terra; timestamps nativos preservados.\n\nÁudio: clique no botão original ativa playback, volume desktop 0,25, loop e MP3 aprovados; o relógio avança e há sinal decodificado não nulo. O filme contém o stream real do elemento. Segundo clique pausa/muta e restaura ARIA/label. Nenhuma certificação de saída física de alto-falante. Zero erros JS/imagens 404.\n\nRenderer, shaders, geometria, estilos, conteúdo e código de áudio não foram alterados. O fallback sem WebGL mantém a foto inicial estática por comportamento já existente, e reduced motion/mobile também desabilitam rotação.\n\nSem merge ou publicação. PR #91 permanece em rascunho para aprovação de Alexandre.\n`);
  console.log(JSON.stringify({passed:true,renderer:report.renderer,rotationDeltaRadians:report.rotationDeltaRadians,frameCount:frames.length,duration:report.duration,audio:report.audio}));
}catch(error){report.failure=error.stack;await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));throw error}finally{await browser?.close();server.close();}
