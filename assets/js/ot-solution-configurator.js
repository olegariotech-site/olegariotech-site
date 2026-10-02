/* OT Experience 2.0 — interactive solution configurator */
(() => {
  'use strict';
  if (document.body?.dataset.page !== 'home') return;

  const stage=document.getElementById('solutionStage');
  const content=document.getElementById('solutionContent');
  const media=document.getElementById('solutionMedia');
  if(!stage||!content||!media)return;

  const routes={
    presenca:{
      label:'rota · confiança',
      nodes:['Identidade','Site','WhatsApp']
    },
    oferta:{
      label:'rota · conversão',
      nodes:['Oferta','Prova','CTA']
    },
    digital:{
      label:'rota · ecossistema',
      nodes:['Site','Google','Dados','WhatsApp']
    }
  };

  let syncing=false;
  function currentRoute(){
    return content.dataset.solution&&routes[content.dataset.solution]?content.dataset.solution:'presenca';
  }

  function ensureStatus(){
    let status=stage.querySelector('.solution-config-status');
    if(!status){
      status=document.createElement('div');
      status.className='solution-config-status';
      status.setAttribute('aria-hidden','true');
      status.innerHTML='<i></i><span>configurador OT · <b></b></span>';
      stage.prepend(status);
    }
    return status;
  }

  function decorate(){
    if(syncing)return;
    syncing=true;
    requestAnimationFrame(()=>{
      const key=currentRoute(),route=routes[key];
      stage.dataset.route=key;
      stage.classList.add('is-configuring');

      const status=ensureStatus();
      const statusText=status.querySelector('b');
      if(statusText)statusText.textContent=route.label;

      media.querySelectorAll('.solution-signal-layer,.solution-scan').forEach(el=>el.remove());

      const scan=document.createElement('div');
      scan.className='solution-scan';
      scan.setAttribute('aria-hidden','true');
      media.appendChild(scan);

      const layer=document.createElement('div');
      layer.className='solution-signal-layer';
      layer.setAttribute('aria-hidden','true');
      const flow=document.createElement('div');
      flow.className='solution-route-flow';
      flow.style.setProperty('--route-count',String(route.nodes.length));
      flow.innerHTML=route.nodes.map(node=>'<div class="solution-route-node"><span></span>'+node+'</div>').join('');
      layer.appendChild(flow);
      media.appendChild(layer);

      setTimeout(()=>stage.classList.remove('is-configuring'),520);
      syncing=false;
    });
  }

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.type==='attributes'&&m.attributeName==='data-solution')){
      decorate();
    }
  });
  observer.observe(content,{attributes:true,attributeFilter:['data-solution']});

  document.querySelectorAll('[data-solution]').forEach(btn=>{
    btn.addEventListener('click',()=>setTimeout(decorate,0));
  });

  decorate();
})();
