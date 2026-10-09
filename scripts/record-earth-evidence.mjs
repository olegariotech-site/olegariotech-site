// Review-only recording: the application remains byte-identical to the V2.1 application commit.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {execFileSync,spawn} from 'node:child_process';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const output=process.env.OT_EARTH_EVIDENCE||'/tmp/ot-earth-evidence';
const applicationCommit='3c5a507807874e7a95f6b51085bd521668210ac0';
const changed=execFileSync('git',['diff','--name-only',applicationCommit,'HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.ok(changed.every(path=>path==='scripts/record-earth-evidence.mjs'||path==='.github/workflows/earth-visual-evidence.yml'||path.startsWith('docs/reviews/ot-premium-v21/motion/')),'Only review automation/evidence may differ from the approved PR application');
await mkdir(resolve(output,'frames'),{recursive:true});
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+'/'))throw Error('Outside root');if((await stat(file)).isDirectory())file+='/index.html';res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const report={applicationCommit,reviewCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),url,viewport:{width:1440,height:900},browserPath:'Browser plugin not available; existing Playwright QA runner',reducedMotion:'no-preference',unchangedApplication:true,errors:[],notFound:[],samples:[],limitations:['WebGL rendered by SwiftShader in GitHub Ubuntu; this is browser rendering, not a simulated planet animation.','Audio is captured from the real HTMLAudioElement stream; physical speaker output is not certified.','No animation speed, application style, geometry, shader or timeline was changed. Only the review operator scrolls the page.']};
let browser,session;
try{
  browser=await chromium.launch({headless:false,executablePath:process.env.OT_CHROME_EXECUTABLE||undefined,args:['--kiosk','--start-fullscreen','--window-position=0,0','--window-size=1440,900','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.browserVersion=browser.version();
  // Use the native fullscreen viewport. Emulated viewport resizing can race with kiosk bounds.
  const context=await browser.newContext({viewport:null,reducedMotion:'no-preference'});
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
  session=await context.newCDPSession(page);
  const windowInfo=await session.send('Browser.getWindowForTarget');
  await session.send('Browser.setWindowBounds',{windowId:windowInfo.windowId,bounds:{windowState:'fullscreen'}});
  await page.waitForFunction(()=>innerWidth===1440&&innerHeight===900&&devicePixelRatio===1);
  report.windowBounds=(await session.send('Browser.getWindowBounds',{windowId:windowInfo.windowId})).bounds;
  report.observedViewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio}));
  assert.deepEqual(report.observedViewport,{width:1440,height:900,pixelRatio:1});
  // Linux fullscreen outer bounds can round by one pixel; the actual CSS viewport is exact.
  assert.ok(Math.abs(report.windowBounds.width-1440)<=1&&Math.abs(report.windowBounds.height-900)<=1);
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
  // Capture the real virtual desktop separately, without forcing CDP JPEG paints.
  const recording=spawn('ffmpeg',['-y','-loglevel','info','-f','x11grab','-framerate','30','-video_size','1440x900','-i',process.env.DISPLAY,'-t','21','-an','-c:v','libx264','-preset','ultrafast','-crf','19','-pix_fmt','yuv420p',resolve(output,'desktop-raw.mp4')]);
  let recorderLog='';
  const finished=new Promise((resolve,reject)=>{recording.on('error',reject);recording.on('close',code=>code===0?resolve():reject(Error('Desktop recording failed: '+recorderLog.slice(-1000))))});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Desktop recorder did not start')),10000);recording.stderr.on('data',data=>{recorderLog+=data.toString();if(recorderLog.includes('Input #0')){clearTimeout(timer);resolve()}});recording.on('error',reject)});
  await page.evaluate(async()=>{
    const start=performance.now(),heroHeight=document.getElementById('inicio').getBoundingClientRect().height;
    const target=document.getElementById('projetos').getBoundingClientRect().top+scrollY-90;
    const method=document.getElementById('metodo').getBoundingClientRect().top+scrollY-100;
    const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
    window.__qaTimeline=[];window.__qaSound.recorder.start();
    let lastSample=-1;
    await new Promise(resolve=>{
      function step(now){
        const t=(now-start)/1000;
        let y=0;
        if(t>=4.5&&t<6.5)y=heroHeight*.26*smooth((t-4.5)/2);
        else if(t>=6.5&&t<8.3)y=heroHeight*(.26+(.63-.26)*smooth((t-6.5)/1.8));
        else if(t>=8.3&&t<9.1)y=heroHeight*.63;
        else if(t>=9.1&&t<10.6)y=heroHeight*.63+(target-heroHeight*.63)*smooth((t-9.1)/1.5);
        else if(t>=10.6&&t<12)y=target;
        else if(t>=12&&t<15.2)y=target+(method-target)*smooth((t-12)/3.2);
        else if(t>=15.2)y=method;
        scrollTo({top:y,behavior:'instant'});
        if(t-lastSample>=.1){lastSample=t;const e=document.getElementById('earthJourney'),a=document.getElementById('backgroundAudio'),samples=new Float32Array(window.__qaSound.analyser.fftSize);window.__qaSound.analyser.getFloatTimeDomainData(samples);window.__qaTimeline.push({t,scrollY,rotation:window.__qaRotation?.y,progress:Number(e.dataset.progress),pulse:Number(e.dataset.pulse),morph:Number(e.dataset.morph),opacity:Number(e.dataset.opacity),wave:e.classList.contains('is-wave'),audioTime:a.currentTime,audioRms:Math.sqrt(samples.reduce((n,v)=>n+v*v,0)/samples.length),projectVisible:document.getElementById('projectStage').getBoundingClientRect().top<900&&document.getElementById('projectStage').getBoundingClientRect().bottom>90,methodVisible:document.getElementById('metodo').getBoundingClientRect().top<900&&document.getElementById('metodo').getBoundingClientRect().bottom>90,soundButton:document.querySelector('.desktop-audio-toggle').getAttribute('aria-pressed')});}
        if(t<18.5)requestAnimationFrame(step);else resolve();
      }requestAnimationFrame(step);
    });
  });
  await finished;
  report.samples=await page.evaluate(()=>window.__qaTimeline);
  const audioData=await page.evaluate(async()=>{const s=window.__qaSound;await new Promise(r=>{s.recorder.onstop=r;s.recorder.stop()});const blob=new Blob(s.chunks,{type:'audio/webm'});return await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result.split(',')[1]);reader.readAsDataURL(blob)})});
  await writeFile(resolve(output,'real-audio.webm'),Buffer.from(audioData,'base64'));
  await page.screenshot({path:resolve(output,'method-end.jpg'),type:'jpeg',quality:90});
  report.audio.currentTimeAfter=await page.locator('#backgroundAudio').evaluate(a=>a.currentTime);
  assert.ok(report.audio.currentTimeAfter-report.audio.currentTimeBefore>=10,'Real audio playback clock advances throughout the film');
  assert.ok(report.samples.some(s=>s.audioRms>.0001),'Decoded audio contains a real signal');
  report.audio.maxRms=Math.max(...report.samples.map(s=>s.audioRms));
  await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await button.getAttribute('aria-label'),'Ativar som');
  report.audio.off=await page.locator('#backgroundAudio').evaluate(a=>({paused:a.paused,muted:a.muted}));assert.deepEqual(report.audio.off,{paused:true,muted:true});
  const rotation=report.samples.filter(s=>s.t<4.4).map(s=>s.rotation);
  report.rotationDeltaRadians=rotation.at(-1)-rotation[0];report.distinctGlobePoses=new Set(rotation.map(v=>v.toFixed(5))).size;
  // The requirement is observable rotation, not a fixed angle in software rendering.
  // Keep several real mesh poses and a measurable change; never accelerate the planet.
  assert.ok(report.rotationDeltaRadians>.05&&report.distinctGlobePoses>=4,'Original rendered globe changes orientation across multiple actual draws');
  assert.ok(rotation.every((v,i)=>i===0||v>=rotation[i-1]),'Original rotation progresses monotonically during the initial HERO');
  report.limitations.push('Software rendering has a low frame rate in this recording. The existing renderer caps per-frame time at 100ms, so captured rotation is slower than the nominal 42-second cycle. No speed correction was applied.');
  assert.ok(report.samples.some(s=>s.pulse>.55&&s.morph<.2),'Globe becomes continental particles');
  assert.ok(report.samples.some(s=>s.wave&&s.morph>.7&&s.opacity>.1),'Wave stage is visibly present');
  assert.equal(await page.locator('#projetos h2').innerText(),'Prova antes da promessa.');assert.equal(await page.locator('#projectStage').getAttribute('data-selected-project'),'kl');
  assert.ok(report.samples.some(s=>s.t>=10.6&&s.t<12&&s.projectVisible),'Integrated showroom is visible during its hold');
  assert.ok(report.samples.some(s=>s.t>=15.2&&s.methodVisible),'The journey continues to Method');
  report.atmosphere=await page.locator('.ot-atmosphere canvas').evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let pixels=0;for(let i=3;i<data.length;i+=4)if(data[i])pixels++;return {canvases:document.querySelectorAll('.ot-atmosphere canvas').length,pixels,earthOpacity:Number(document.getElementById('earthJourney').dataset.opacity)}});
  assert.equal(report.atmosphere.canvases,1);assert.equal(report.atmosphere.earthOpacity,0);assert.ok(report.atmosphere.pixels>0,'Real cosmic dust remains after the Earth');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.notFound,[]);
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',resolve(output,'desktop-raw.mp4'),'-i',resolve(output,'real-audio.webm'),'-t','21','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',resolve(output,'ot-v21-journey-1440x900.mp4')]);
  report.video=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_streams','-show_format','-of','json',resolve(output,'ot-v21-journey-1440x900.mp4')],{encoding:'utf8'}));
  const track=report.video.streams.find(s=>s.codec_type==='video');assert.equal(track.width,1440);assert.equal(track.height,900);assert.ok(Number(report.video.format.duration)>=20.5&&Number(report.video.format.duration)<=21.5);
  report.frameCount=Number(track.nb_frames);report.duration=Number(report.video.format.duration);report.operatorTimeline=[{seconds:'0–4.5',state:'Complete rotating Earth, real audio on'},{seconds:'4.5–6.5',state:'Continental particles'},{seconds:'6.5–9.1',state:'Perspective waves'},{seconds:'9.1–12',state:'Integrated Premium V2 showroom'},{seconds:'12–18.5',state:'Continue through solutions to Method, persistent cosmic dust'}];
  report.limitations.push('Operator time is not the native movie timecode: the desktop recorder has a short lead-in. Extracted movie frames must be checked at their actual timecodes.');
  report.passed=true;await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));
  await writeFile(resolve(output,'README.md'),`# OT V2.1 — evidência de movimento

Gravação real de **${report.duration} segundos**, desktop **1440 × 900**, Chromium ${report.browserVersion}, WebGL/SwiftShader e movimento habilitado. A aplicação é byte-idêntica ao commit **${applicationCommit}** do PR #93; esta branch contém somente automação e evidências.

[Vídeo com áudio real](./ot-v21-journey-1440x900.mp4) · [Dados e assertions](./report.json)

A jornada mostra Terra inteira, rotação original, dissolução em partículas, ondas, showroom Premium V2 e continuidade até Método. Os horários do operador estão no JSON e diferem do timecode nativo por um curto lead-in da captura. Sem aceleração do filme ou da Terra. Rotação inicial: **${(report.rotationDeltaRadians*180/Math.PI).toFixed(2)}°**, **${report.distinctGlobePoses} poses reais**. Captura por software tem frame rate limitado; não certifica GPU física.

Áudio do MP3 aprovado: botão ativa playback real, volume 0,25, loop, relógio e sinal decodificado verificados. O filme contém o stream real do elemento. Segundo clique pausa/muta e restaura ARIA/label. Saída física de alto-falante não certificada. Zero erros JS/console ou 404. Atmosfera permanece com ${report.atmosphere.pixels} pixels não transparentes depois de a Terra desaparecer.

Sem merge ou publicação. PR #93 permanece em rascunho para aprovação visual e funcional de Alexandre.
`);
  console.log(JSON.stringify({passed:true,renderer:report.renderer,rotationDeltaRadians:report.rotationDeltaRadians,frameCount:report.frameCount,duration:report.duration,audio:report.audio}));
}catch(error){report.failure=error.stack;await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({renderer:report.renderer,rotation:report.rotationDeltaRadians,geometry:report.geometry,windowBounds:report.windowBounds,samples:report.samples.filter((_,i)=>i%8===0),errors:report.errors}));throw error}finally{await browser?.close();server.close();}
