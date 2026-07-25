(()=>{
  'use strict';
  const CDN='https://cdn.jsdelivr.net/npm/globe.gl@2.46.1/dist/globe.gl.min.js';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=matchMedia('(max-width: 820px)').matches;
  const C={ice:'#67e8f9',purple:'#a855f7',violet:'#c084fc',amber:'#f59e0b',green:'#25d366'};
  const STEPS=[
    ['Visão geral','00 / 05','Ecossistema digital em movimento','Site, IA, automação, presença e estratégia trabalhando na mesma órbita para gerar oportunidades reais.',C.ice],
    ['Sites e páginas de venda','01 / 05','Estrutura digital que apresenta e direciona','O site organiza a proposta, fortalece confiança e conduz o visitante para uma ação comercial.',C.ice],
    ['Inteligência Artificial','02 / 05','IA aplicada ao negócio real','Tecnologia para atender melhor, acelerar conteúdo e apoiar processos sem perder linguagem humana.',C.violet],
    ['Automação e WhatsApp','03 / 05','Menos atrito entre interesse e conversa','Fluxos objetivos levam o cliente ao canal certo, com contexto e uma próxima ação clara.',C.green],
    ['Presença digital','04 / 05','Uma marca coerente em cada ponto de contato','Identidade, mensagem e canais trabalham juntos para transmitir profissionalismo antes da conversa.',C.amber],
    ['Diagnóstico e estratégia','05 / 05','Primeiro entendemos a rota. Depois aceleramos.','O diagnóstico identifica gargalos, oportunidades e prioridades para orientar o crescimento.',C.purple]
  ];
  const HQ={id:'hq',kind:'hq',label:'Olegario Tech • Valinhos',lat:-22.97,lng:-46.99,color:C.amber};
  const SERVICES=[
    {id:'sites',label:'Sites',lat:-7,lng:-34,color:C.ice},
    {id:'ia',label:'Inteligência Artificial',lat:36,lng:-116,color:C.violet},
    {id:'automacao',label:'Automação + WhatsApp',lat:45,lng:4,color:C.green},
    {id:'presenca',label:'Presença digital',lat:8,lng:96,color:C.amber},
    {id:'diagnostico',label:'Diagnóstico + estratégia',lat:-31,lng:145,color:C.purple}
  ];
  const CAMERA=[
    {lat:4,lng:-24,altitude:2.46},{lat:-7,lng:-34,altitude:2.34},{lat:36,lng:-116,altitude:2.31},
    {lat:45,lng:4,altitude:2.34},{lat:8,lng:96,altitude:2.31},{lat:-31,lng:145,altitude:2.29}
  ];
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const stage=$('.orbit-stage'),grid=$('.orbit-grid'),bar=$('#progress-bar'),globeEl=$('#globe'),status=$('#load-status');
  const kicker=$('#step-kicker'),count=$('#step-count'),title=$('#step-title'),text=$('#step-text'),card=$('.step-card'),dots=$$('.step-dot');
  let globe=null,active=0,ticking=false,stageVisible=true,tabVisible=!document.hidden;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;
  const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return`rgba(${n>>16},${n>>8&255},${n&255},${a})`};
  function rand(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  const r=rand(20260725),surface=Array.from({length:mobile?170:400},(_,i)=>{const u=r(),v=r();return{id:`d${i}`,kind:'surface',lat:Math.asin(2*u-1)*180/Math.PI,lng:360*v-180,color:i%5?'rgba(103,232,249,.24)':'rgba(168,85,247,.2)',radius:mobile?.105:.09,altitude:.004+r()*.006}});
  const pointData=()=>{const ai=active-1;return[...surface,{...HQ,radius:active?.29:.42,altitude:active?.07:.105,color:active?'rgba(245,158,11,.65)':C.amber},...SERVICES.map((s,i)=>({...s,radius:i===ai?.48:.22,altitude:i===ai?.16:.065,color:i===ai?s.color:rgba(s.color,.48)}))]};
  const arcData=()=>{const ai=active-1;return SERVICES.map((s,i)=>({startLat:HQ.lat,startLng:HQ.lng,endLat:s.lat,endLng:s.lng,color:i===ai?[C.amber,s.color]:['rgba(245,158,11,.18)','rgba(103,232,249,.13)'],stroke:i===ai?.7:.24,altitude:i===ai?.29:.18}))};
  const labelData=()=>{const ai=active-1;return[HQ,...SERVICES].map((s,i)=>{const on=s.kind==='hq'?active===0:i-1===ai;return{...s,text:s.label,size:on?.54:.32,altitude:on?.19:.09,color:on?s.color:'rgba(238,240,255,.43)',dotRadius:on?.38:.18}})};
  function refresh(){if(!globe)return;globe.pointsData(pointData()).arcsData(arcData()).labelsData(labelData());const p=active?SERVICES[active-1]:HQ;globe.ringsData([{lat:p.lat,lng:p.lng,color:p.color}])}
  function setStep(i){i=clamp(i,0,5);active=i;const s=STEPS[i];kicker.textContent=s[0];count.textContent=s[1];title.textContent=s[2];text.textContent=s[3];card.style.setProperty('--active-glow',rgba(s[4],.72));dots.forEach((d,n)=>n===i?d.setAttribute('aria-current','step'):d.removeAttribute('aria-current'));refresh()}
  function camera(p){const x=p*5,i=Math.min(4,Math.floor(x)),t=clamp(x-i,0,1),a=CAMERA[i],b=CAMERA[i+1];return{lat:lerp(a.lat,b.lat,t),lng:lerp(a.lng,b.lng,t),altitude:lerp(a.altitude,b.altitude,t)+(mobile?.32:0)}}
  function progress(){if(reduced)return 0;const rect=stage.getBoundingClientRect(),max=Math.max(1,stage.offsetHeight-innerHeight);return clamp(-rect.top/max,0,1)}
  function render(){ticking=false;const p=progress();bar.style.width=`${(p*100).toFixed(2)}%`;const exit=clamp((p-.935)/.065,0,1);grid.style.opacity=String(1-exit);grid.style.transform=`translateY(${-30*exit}px)`;setStep(Math.round(p*5));if(globe&&stageVisible&&tabVisible&&!reduced)globe.pointOfView(camera(p),0)}
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(render)}}
  function webgl(){try{const c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))}catch{return false}}
  function resize(){if(!globe)return;globe.width(Math.max(280,globeEl.clientWidth)).height(Math.max(260,globeEl.clientHeight));const renderer=globe.renderer?.();renderer?.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.2:1.55))}
  function animateState(){if(!globe)return;const run=tabVisible&&stageVisible;run?globe.resumeAnimation?.():globe.pauseAnimation?.()}
  function fallback(msg){document.documentElement.classList.remove('globe-ready');document.documentElement.classList.add('globe-fallback');status.textContent=msg}
  function init(){if(typeof Globe!=='function')return fallback('Biblioteca 3D indisponível');try{globe=Globe({animateIn:false})(globeEl).backgroundColor('rgba(0,0,0,0)').showAtmosphere(true).atmosphereColor(C.ice).atmosphereAltitude(.14).pointsMerge(false).pointLat('lat').pointLng('lng').pointColor('color').pointAltitude('altitude').pointRadius('radius').pointResolution(mobile?6:8).arcsData(arcData()).arcStartLat('startLat').arcStartLng('startLng').arcEndLat('endLat').arcEndLng('endLng').arcColor('color').arcStroke('stroke').arcAltitude('altitude').arcDashLength(.52).arcDashGap(.22).arcDashAnimateTime(reduced?1e9:3600).labelsData(labelData()).labelLat('lat').labelLng('lng').labelText('text').labelColor('color').labelSize('size').labelAltitude('altitude').labelDotRadius('dotRadius').labelResolution(2).ringsData([{lat:HQ.lat,lng:HQ.lng,color:HQ.color}]).ringLat('lat').ringLng('lng').ringColor('color').ringMaxRadius(mobile?2.2:3.3).ringPropagationSpeed(reduced?0:1.5).ringRepeatPeriod(reduced?1e6:980);const m=globe.globeMaterial?.();if(m){m.color?.set('#071027');m.emissive?.set('#02040d');m.emissiveIntensity=.55;m.shininess=.55;m.transparent=true;m.opacity=.94}const controls=globe.controls?.();if(controls){controls.enablePan=false;controls.enableZoom=false;controls.enableRotate=false;controls.autoRotate=false}refresh();resize();globe.pointOfView(camera(progress()),0);document.documentElement.classList.add('globe-ready');status.textContent='Modo 3D ativo';animateState()}catch(e){console.warn('[Orbit Lab]',e);fallback('Modo visual leve ativo')}}
  function load(){if(!webgl())return fallback('WebGL indisponível • modo leve');const s=document.createElement('script');s.src=CDN;s.async=true;s.crossOrigin='anonymous';s.onload=init;s.onerror=()=>fallback('CDN indisponível • modo leve');document.head.appendChild(s)}
  dots.forEach(d=>d.addEventListener('click',()=>{const i=Number(d.dataset.step),max=Math.max(1,stage.offsetHeight-innerHeight);scrollTo({top:stage.offsetTop+i/5*max,behavior:reduced?'auto':'smooth'})}));
  document.addEventListener('visibilitychange',()=>{tabVisible=!document.hidden;animateState()});new IntersectionObserver(e=>{stageVisible=e.some(x=>x.isIntersecting);animateState()},{threshold:.01}).observe(stage);addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{resize();onScroll()},{passive:true});setStep(0);render();'requestIdleCallback'in window?requestIdleCallback(load,{timeout:1200}):setTimeout(load,350);
})();
