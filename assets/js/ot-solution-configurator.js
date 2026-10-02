/* OT Experience 2.0 — Solution Configurator */
(() => {
  'use strict';

  const stage=document.getElementById('solutionStage');
  const content=document.getElementById('solutionContent');
  const media=document.getElementById('solutionMedia');
  if(!stage||!content||!media)return;

  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const mobile=matchMedia('(max-width:900px)');
  const saveData=!!navigator.connection?.saveData;

  const routes={
    presenca:{
      label:'Rota 01 · confiança',
      modules:['marca','site','Google','WhatsApp'],
      meta:'marca · presença · confiança'
    },
    oferta:{
      label:'Rota 02 · conversão',
      modules:['oferta','prova','CTA','dados'],
      meta:'oferta · CTA · mensuração'
    },
    digital:{
      label:'Rota 03 · ecossistema',
      modules:['site','WhatsApp','busca','dados'],
      meta:'site · WhatsApp · busca · dados'
    }
  };

  stage.classList.add('is-configurator');

  const head=document.createElement('div');
  head.className='solution-configurator-head';
  head.setAttribute('aria-hidden','true');
  head.innerHTML='<span class="solution-configurator-head__route">configurando · <b>rota ativa</b></span><div class="solution-configurator-head__modules"></div>';
  stage.prepend(head);

  const scan=document.createElement('span');
  scan.className='solution-configurator-scan';
  scan.setAttribute('aria-hidden','true');
  stage.appendChild(scan);

  const routeLabel=head.querySelector('.solution-configurator-head__route');
  const moduleWrap=head.querySelector('.solution-configurator-head__modules');
  let currentKey='';
  let switchTimer=0;

  function decorate(key,animate=true){
    const route=routes[key]||routes.presenca;
    if(!route)return;
    stage.dataset.configMode=key;

    if(routeLabel) routeLabel.innerHTML='configurando · <b>'+route.label+'</b>';
    if(moduleWrap) moduleWrap.innerHTML=route.modules.map(item=>'<span>'+item+'</span>').join('');

    const meta=media.querySelector('.solution-meta');
    if(meta) meta.textContent=route.meta;

    if(key!==currentKey && animate && !reduced.matches){
      stage.classList.remove('is-switching');
      void stage.offsetWidth;
      stage.classList.add('is-switching');
      clearTimeout(switchTimer);
      switchTimer=setTimeout(()=>stage.classList.remove('is-switching'),560);
    }
    currentKey=key;
  }

  function sync(){
    const key=content.dataset.solution||'presenca';
    requestAnimationFrame(()=>decorate(key,key!==currentKey));
  }

  new MutationObserver(sync).observe(content,{attributes:true,attributeFilter:['data-solution'],childList:true,subtree:false});
  new MutationObserver(()=>{
    const key=content.dataset.solution||currentKey||'presenca';
    const meta=media.querySelector('.solution-meta');
    if(meta && routes[key]) meta.textContent=routes[key].meta;
  }).observe(media,{childList:true,subtree:true});

  document.querySelectorAll('.choice-tab[data-solution],.desktop-rail [data-solution]').forEach(btn=>{
    btn.addEventListener('click',()=>requestAnimationFrame(sync));
  });

  if(!mobile.matches&&!reduced.matches&&!saveData){
    stage.addEventListener('pointermove',event=>{
      const r=stage.getBoundingClientRect();
      const x=((event.clientX-r.left)/Math.max(1,r.width)-.5)*2;
      const y=((event.clientY-r.top)/Math.max(1,r.height)-.5)*2;
      stage.style.setProperty('--config-mx',Math.max(-1,Math.min(1,x)).toFixed(3));
      stage.style.setProperty('--config-my',Math.max(-1,Math.min(1,y)).toFixed(3));
    },{passive:true});
    stage.addEventListener('pointerleave',()=>{
      stage.style.setProperty('--config-mx','0');
      stage.style.setProperty('--config-my','0');
    },{passive:true});
  }

  sync();
})();
