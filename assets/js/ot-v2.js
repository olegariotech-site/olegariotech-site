(function(){
  'use strict';

  function ready(fn){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }

  function safeTrack(name,params){
    try{ if(window.OTAnalytics&&typeof window.OTAnalytics.track==='function') window.OTAnalytics.track(name,params||{}); }catch(e){}
  }

  function setText(selector,text){var el=document.querySelector(selector);if(el)el.textContent=text;return el;}

  function installProofStrip(){
    if(document.getElementById('prova'))return;
    var hero=document.getElementById('inicio');if(!hero)return;
    var section=document.createElement('section');
    section.id='prova';section.className='ot-proof-strip';section.setAttribute('aria-label','Projetos reais da Olegario Tech');
    section.innerHTML='<div class="inner ot-proof-strip__inner"><div class="ot-proof-strip__lead"><span>Projetos reais em operação</span><strong>Antes de prometer, mostramos o que já colocamos no ar.</strong></div><div class="ot-proof-strip__cases"><a href="#projetos" data-proof-case="Açaí do Dudu"><b>Açaí do Dudu</b><span>Marca + site + presença digital</span></a><a href="#projetos" data-proof-case="Adega São Marcos"><b>Adega São Marcos</b><span>Site + campanhas + WhatsApp</span></a><a href="#projetos" data-proof-case="Cíntia Advocacia"><b>Cíntia Advocacia</b><span>Presença profissional + autoridade</span></a></div></div>';
    hero.insertAdjacentElement('afterend',section);
  }

  function tuneHero(){
    setText('.hero-brandline','Consultoria digital com cabeça de vendas');
    setText('.hero-sub','A OT organiza marca, site, WhatsApp, Google e dados para transformar presença digital em oportunidade comercial.');
    var actions=document.querySelector('.hero .hero-actions');
    if(actions){
      var primary=actions.querySelector('.btn-primary');
      if(primary) primary.innerHTML='Quero meu diagnóstico digital <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      var secondary=actions.querySelector('.btn-wa');
      if(secondary){secondary.textContent='Ver projetos reais';secondary.href='#projetos';secondary.removeAttribute('target');secondary.removeAttribute('rel');secondary.removeAttribute('data-generate-lead');secondary.classList.remove('btn-wa');secondary.classList.add('btn-ghost');}
    }
    var mobileCta=document.querySelector('.mobile-cta');if(mobileCta)mobileCta.textContent='Diagnóstico';
    var orbit=document.querySelector('.orbit-status');
    if(orbit)orbit.innerHTML='ECOSSISTEMA · OT<br>site · <b>online</b><br>WhatsApp · <b>conectado</b><br>dados · <b>medindo</b><br>base · <b>Valinhos/SP</b>';
  }

  function tuneSolutions(){
    var heading=document.querySelector('.choice-heading .section-title');if(heading)heading.innerHTML='O que está travando seu <span class="accent">digital hoje?</span>';
    setText('.choice-heading .section-copy','Escolha a situação que mais parece com o seu negócio. A OT mostra a rota mais direta para resolver.');
    var map={presenca:['Minha empresa não parece profissional','Falta confiança antes do primeiro contato.'],oferta:['Preciso vender uma oferta','A página precisa transformar interesse em ação.'],digital:['Meu digital está todo solto','Site, WhatsApp, conteúdo e dados não trabalham juntos.']};
    document.querySelectorAll('.choice-tab[data-solution]').forEach(function(btn){var item=map[btn.dataset.solution];if(!item)return;var strong=btn.querySelector('strong'),span=btn.querySelector('span');if(strong)strong.textContent=item[0];if(span)span.textContent=item[1];});
    var proofTab=document.querySelector('.choice-tab[data-scroll="projetos"]');if(proofTab){var s=proofTab.querySelector('strong'),p=proofTab.querySelector('span');if(s)s.textContent='Quero ver prova real';if(p)p.textContent='Conheça projetos entregues e em operação.';}
    var railMap={presenca:'Parecer profissional',oferta:'Vender melhor',digital:'Organizar meu digital'};document.querySelectorAll('.desktop-rail [data-solution]').forEach(function(btn){var label=btn.querySelector('span:last-child');if(label&&railMap[btn.dataset.solution])label.textContent=railMap[btn.dataset.solution];});
    try{if(typeof solutions!=='undefined'){
      solutions.presenca.title='Parecer profissional antes do primeiro contato';solutions.presenca.text='Sua presença digital precisa gerar confiança antes de o cliente chamar no WhatsApp.';solutions.presenca.bullets=['Marca e apresentação coerentes','Site rápido e responsivo','WhatsApp no contexto certo','SEO local e presença no Google','Estrutura pronta para medir e evoluir'];solutions.presenca.cta='Quero profissionalizar meu digital';
      solutions.oferta.title='Transformar uma oferta em conversa';solutions.oferta.text='Organizamos promessa, prova e chamada para ação para o cliente entender rápido por que deve falar com você.';solutions.oferta.cta='Quero vender melhor minha oferta';
      solutions.digital.title='Fazer o digital trabalhar na mesma direção';solutions.digital.text='Site, WhatsApp, criativos, busca e dados deixam de ser peças soltas e passam a sustentar a mesma estratégia.';solutions.digital.cta='Quero organizar meu ecossistema';if(typeof renderSolution==='function')renderSolution('presenca',false);
    }}catch(e){}
    var solutionContent=document.getElementById('solutionContent');function markLead(){var link=solutionContent&&solutionContent.querySelector('a[href*="wa.me/"]');if(link)link.setAttribute('data-generate-lead','');}markLead();if(solutionContent)new MutationObserver(markLead).observe(solutionContent,{childList:true,subtree:true});
  }

  function tuneProjects(){
    var label=document.querySelector('#projetos .projects-head .section-label');if(label)label.textContent='Prova antes da promessa';
    var title=document.querySelector('#projetos .projects-head .section-title');if(title)title.innerHTML='Projetos reais. <span class="accent">Negócios reais.</span>';
    var headerCta=document.querySelector('#projetos .projects-head .btn');if(headerCta)headerCta.textContent='Quero uma estrutura assim';
    try{if(typeof projects!=='undefined'&&projects.acai){projects.acai.label='Projeto entregue · Marca + ecossistema digital';projects.acai.text='Projeto concluído e entregue. A OT organizou a marca e construiu uma presença digital pronta para vender confiança antes do primeiro contato.';projects.acai.points=['Desafio · organizar marca e presença digital antes fragmentadas','OT entregou · identidade, logotipo, site, mobile, WhatsApp e mensuração','Agora · projeto publicado, entregue e preparado para evolução contínua'];if(typeof renderProject==='function')renderProject('acai');}}catch(e){}
  }

  function tuneMethod(){
    var title=document.querySelector('#metodo .section-title');if(title)title.innerHTML='Não começamos pelo <span class="accent">site.</span>';
    setText('#metodo .section-copy','Começamos pelo negócio. Entendemos o problema, definimos a direção, implantamos e acompanhamos a presença digital.');
    var data=[['01','Diagnóstico','Entendemos negócio, cliente, oferta e objetivo.'],['02','Direção','Definimos a estrutura visual e comercial que faz sentido.'],['03','Implantação','Criamos marca, páginas, integrações e colocamos no ar.'],['04','Presença contínua','Medimos, ajustamos e evoluímos conforme o negócio cresce.']];
    var cards=[].slice.call(document.querySelectorAll('#metodo .method-card'));cards.forEach(function(card,i){if(i>=4){card.remove();return;}var d=data[i],b=card.querySelector('b'),strong=card.querySelector('strong'),p=card.querySelector('p');if(b)b.textContent=d[0];if(strong)strong.textContent=d[1];if(p)p.textContent=d[2];});
    var items=[].slice.call(document.querySelectorAll('#metodo .method-item'));items.forEach(function(item,i){if(i>=4){item.remove();return;}var d=data[i],toggle=item.querySelector('.method-toggle span'),p=item.querySelector('.method-panel p');if(toggle)toggle.innerHTML='<b>'+d[0]+'</b>'+d[1];if(p)p.textContent=d[2];});
  }

  function tuneAbout(){
    var label=document.querySelector('#sobre .section-label');if(label)label.textContent='Tecnologia + experiência comercial';
    var paragraphs=document.querySelectorAll('#sobre .about-grid p');if(paragraphs[0])paragraphs[0].textContent='A Olegario Tech combina tecnologia com experiência comercial real. Não pensamos só em layout: pensamos no que o cliente vê, entende, sente e faz depois.';if(paragraphs[1])paragraphs[1].textContent='A estratégia nasce do diagnóstico e vira uma estrutura digital que organiza marca, oferta, atendimento e mensuração para gerar novas oportunidades.';
    var stats=document.querySelectorAll('#sobre .about-stats span');if(stats[0])stats[0].textContent='30+ anos em vendas';if(stats[1])stats[1].textContent='Projetos reais em operação';if(stats[2])stats[2].textContent='Valinhos · Campinas · Brasil';
  }

  function tuneProducts(){var section=document.getElementById('produtos');if(!section)return;section.classList.add('ot-products-teaser');section.innerHTML='<div class="inner ot-products-teaser__box"><div><span class="section-label">Conteúdo autoral</span><h2 class="section-title">Produtos digitais <span class="accent">em um espaço próprio.</span></h2><p class="section-copy">Livros e materiais práticos continuam disponíveis, sem disputar atenção com a jornada comercial da Olegario Tech.</p></div><a class="btn btn-ghost" href="/produtos/">Ver produtos digitais</a></div>';}

  function tuneEcosystem(){var section=document.getElementById('ecossistema');if(!section)return false;var title=section.querySelector('.ot-ecosystem__title');if(title)title.innerHTML='Tudo o que usamos para crescer também pode trabalhar pelo <span class="gradient-text">seu negócio.</span>';var p=section.querySelector('.ot-ecosystem__copy p');if(p)p.textContent='Marca, site, WhatsApp, Google, dados e campanhas conectados para transformar presença digital em oportunidade comercial.';var cta=section.querySelector('.ot-ecosystem__cta');if(cta)cta.textContent='Quero montar meu ecossistema';return true;}

  function tuneFinalCta(){var title=document.querySelector('#contato .cta-box h2');if(title)title.innerHTML='Seu digital não precisa ser um monte de <span class="gradient-text">peças soltas.</span>';setText('#contato .cta-box p','Comece pelo diagnóstico. A OT entende o momento do seu negócio e mostra a estrutura mais direta para gerar confiança, contatos e oportunidades.');var buttons=document.querySelectorAll('#contato .hero-actions .btn');if(buttons[0])buttons[0].textContent='Quero meu diagnóstico digital';if(buttons[1])buttons[1].textContent='Falar sobre meu projeto';}

  function installHomeTracking(){
    var seen={};if('IntersectionObserver'in window){var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting&&entry.intersectionRatio>=.35&&!seen[entry.target.id]){seen[entry.target.id]=true;safeTrack('view_section',{section_name:entry.target.id});}});},{threshold:[.35]});['inicio','prova','solucoes','projetos','metodo','sobre','ecossistema','contato'].forEach(function(id){var el=document.getElementById(id);if(el)observer.observe(el);});}
    var depths=[25,50,75,90],sent={};addEventListener('scroll',function(){var doc=document.documentElement,max=Math.max(1,doc.scrollHeight-innerHeight),pct=Math.round((scrollY/max)*100);depths.forEach(function(d){if(pct>=d&&!sent[d]){sent[d]=true;safeTrack('scroll_depth',{percent:d});}});},{passive:true});
    document.addEventListener('click',function(e){var proof=e.target.closest('[data-proof-case]');if(proof)safeTrack('click_proof_case',{project_name:proof.dataset.proofCase});},true);
    var params=new URLSearchParams(location.search),attribution={};['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k){if(params.get(k))attribution[k]=params.get(k).slice(0,100);});if(Object.keys(attribution).length){try{sessionStorage.setItem('ot_attribution',JSON.stringify(attribution));}catch(e){}}
    document.addEventListener('click',function(e){var link=e.target.closest('a[href*="wa.me/"]');if(!link)return;var a={};try{a=JSON.parse(sessionStorage.getItem('ot_attribution')||'{}');}catch(err){}if(Object.keys(a).length)safeTrack('lead_attribution',a);},true);
  }

  function enhanceHome(){tuneHero();installProofStrip();tuneSolutions();tuneProjects();tuneMethod();tuneAbout();tuneProducts();tuneFinalCta();if(!tuneEcosystem()){var obs=new MutationObserver(function(){if(tuneEcosystem())obs.disconnect();});obs.observe(document.body,{childList:true,subtree:true});}installHomeTracking();}

  function diagnosticRecommendation(objective){if(/Gerar mais contatos/i.test(objective))return 'Organizar uma página comercial com prova, oferta clara e um caminho direto para o WhatsApp.';if(/Parecer mais profissional/i.test(objective))return 'Fortalecer marca, apresentação e presença digital para gerar confiança antes do primeiro contato.';if(/Vender produto ou serviço/i.test(objective))return 'Estruturar a oferta com benefícios, prova e chamadas para ação que levem o cliente à conversa certa.';if(/Criar página para campanha/i.test(objective))return 'Criar uma landing page focada em uma única campanha, com mensagem objetiva e mensuração dos contatos.';return 'Organizar sua presença digital para que marca, página e WhatsApp trabalhem na mesma direção.';}

  function enhanceDiagnostic(){
    var lead=document.querySelector('.lead');if(lead)lead.textContent='Responda 4 perguntas rápidas e receba um diagnóstico inicial sobre sua presença digital antes de continuar pelo WhatsApp.';var start=document.querySelector('[data-start-link]');if(start)start.textContent='Fazer meu diagnóstico gratuito →';var finish=document.querySelector('[data-finish]');if(finish)finish.textContent='Ver meu diagnóstico';
    document.addEventListener('click',function(e){var btn=e.target.closest('[data-finish]');if(!btn)return;setTimeout(function(){var structure=document.querySelector('[data-name="estrutura"] .opt.selected'),objective=document.querySelector('[data-name="objetivo"] .opt.selected'),business=document.getElementById('nomeNegocio');var structureValue=structure?structure.dataset.value:'',objectiveValue=objective?objective.dataset.value:'',recommendation=diagnosticRecommendation(objectiveValue);var presence=/Ainda não tenho|Instagram e WhatsApp|site, mas está antigo/i.test(structureValue)?'Precisa evoluir':'Estrutura existente';var conversion=/não gera contato/i.test(structureValue)?'Atenção':'Pode ser fortalecida';var title=document.querySelector('[data-step="4"] .question');if(title)title.textContent='Seu diagnóstico inicial está pronto.';var hint=document.querySelector('[data-step="4"] .hint');if(hint)hint.textContent='Pelo que você respondeu, este é o principal caminho para melhorar sua presença digital agora.';var summary=document.getElementById('summary');if(summary)summary.innerHTML='<div class="ot-diagnostic-result"><div><span>Estrutura digital</span><strong>'+presence+'</strong></div><div><span>Clareza comercial</span><strong>Oportunidade de melhoria</strong></div><div><span>Conversão para WhatsApp</span><strong>'+conversion+'</strong></div><p><b>Recomendação OT:</b> '+recommendation+'</p></div>';var wa=document.getElementById('waLink');if(wa){var name=(business&&business.value.trim())||'meu negócio',msg='Olá, OT! Fiz o diagnóstico digital. Negócio: '+name+'. Estrutura atual: '+structureValue+'. Objetivo: '+objectiveValue+'. Recomendação inicial: '+recommendation+' Quero receber um plano de ação.';wa.href='https://wa.me/5511912459144?text='+encodeURIComponent(msg);wa.textContent='Receber meu plano de ação no WhatsApp →';}var small=document.querySelector('[data-step="4"] .small');if(small)small.textContent='Você já recebeu a leitura inicial. No WhatsApp, a OT aprofunda o contexto e mostra os próximos passos.';safeTrack('diagnostico_resultado_exibido',{estrutura:structureValue,objetivo:objectiveValue});},0);},true);
  }

  ready(function(){if(document.body&&document.body.dataset.page==='home')enhanceHome();if(location.pathname.indexOf('/diagnostico-digital/')!==-1)enhanceDiagnostic();});
})();
