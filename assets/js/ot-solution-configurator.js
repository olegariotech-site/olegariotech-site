/* Solution choices build an explorable blueprint below the real project imagery. */
(() => {
  'use strict';
  if (document.body?.dataset.page !== 'home') return;
  const stage=document.getElementById('solutionStage');
  const content=document.getElementById('solutionContent');
  const media=document.getElementById('solutionMedia');
  if(!stage||!content||!media)return;
  const routes={
    presenca:{label:'Presença que gera confiança',nodes:[
      ['Identidade','Marca e apresentação coerentes','A identidade organiza a primeira impressão e mantém a mesma linguagem no site e no atendimento.','brand'],
      ['Site','Site rápido e responsivo','O cliente encontra sua empresa, entende o que você oferece e navega com clareza no computador e no celular.','site'],
      ['WhatsApp','WhatsApp no contexto certo','O contato começa com uma mensagem ligada ao que o visitante acabou de conhecer.','chat']
    ]},
    oferta:{label:'Uma oferta com caminho até o contato',nodes:[
      ['Oferta','Copy comercial da oferta','A página apresenta o benefício, o público e o próximo passo com uma mensagem comercial clara.','offer'],
      ['Prova','Seções objetivas e persuasivas','Projetos, exemplos e depoimentos ajudam o cliente a avaliar a entrega antes de entrar em contato.','brand'],
      ['Contato','Medição de cliques e leads','A chamada para ação conecta o interesse ao atendimento e permite acompanhar os contatos iniciados.','chat']
    ]},
    digital:{label:'As peças do seu digital trabalhando juntas',nodes:[
      ['Site','Site responsivo com foco comercial.','Uma base organizada apresenta sua empresa e direciona cada visitante para a informação certa.','site'],
      ['Presença local','Presença local e organização das informações.','Localização, horários e informações organizadas ajudam o cliente a encontrar e conhecer o seu negócio.','search'],
      ['Evolução','Estrutura preparada para medir e evoluir.','Uma base organizada permite planejar a mensuração e orientar os próximos ajustes conforme o negócio cresce.','data'],
      ['WhatsApp','WhatsApp integrado à jornada do cliente.','Mensagens contextualizadas tornam mais simples continuar a conversa com o seu negócio.','chat']
    ]}
  };
  const paths={brand:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 3 3 5-6"/>',site:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01M7 13h5M7 16h9"/>',chat:'<path d="M20 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.1-4.3A8.5 8.5 0 1 1 20 11.5Z"/><path d="M8 9h8M8 13h5"/>',offer:'<path d="M3 12V5h7l11 11-5 5Z"/><circle cx="7" cy="8" r="1"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',data:'<path d="M5 20V12M12 20V4M19 20V8"/>'};
  let queued=false, current='', selected=0;
  let blueprint=document.createElement('div'); blueprint.className='solution-blueprint';
  media.insertAdjacentElement('afterend',blueprint);
  function select(index) {
    const nodes=routes[current].nodes; selected=index;
    const detail=blueprint.querySelector('.solution-blueprint__detail');
    detail.querySelector('strong').textContent=nodes[index][1];
    detail.querySelector('p').textContent=nodes[index][2];
    blueprint.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    stage.dataset.component=String(index);
  }
  function decorate() {
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      const key=routes[content.dataset.solution]?content.dataset.solution:'presenca';
      if(key===current&&blueprint.querySelector('button'))return;
      current=key;selected=0;stage.dataset.route=key;
      media.querySelectorAll('.solution-signal-layer,.solution-scan').forEach(el=>el.remove());
      stage.querySelector('.solution-config-status')?.remove();
      blueprint.style.setProperty('--route-count',String(routes[key].nodes.length));
      blueprint.innerHTML='<p class="solution-blueprint__label"></p><div class="solution-blueprint__nodes"></div><div class="solution-blueprint__detail" aria-live="polite"><strong></strong><p></p></div>';
      blueprint.querySelector('.solution-blueprint__label').textContent=routes[key].label;
      const list=blueprint.querySelector('.solution-blueprint__nodes');
      routes[key].nodes.forEach((node,index)=>{
        const button=document.createElement('button');button.type='button';button.className='solution-blueprint__node';
        button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[node[3]]+'</svg><span></span>';
        button.querySelector('span').textContent=node[0];button.setAttribute('aria-pressed',String(index===0));
        button.addEventListener('click',()=>select(index));list.appendChild(button);
      });
      select(0);
    });
  }
  const observer=new MutationObserver(decorate);
  observer.observe(content,{attributes:true,attributeFilter:['data-solution']});
  // Pointer depth is shared with the portfolio and method in ot-surface-motion.js.
  decorate();
})();
