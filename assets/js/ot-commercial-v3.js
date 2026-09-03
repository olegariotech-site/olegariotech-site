(function(){
  'use strict';

  var WA='5511912459144';
  var DIAG='/diagnostico-digital/';

  function ready(fn){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }

  function internalLink(anchor,href,label){
    if(!anchor)return;
    anchor.href=href;
    if(label)anchor.textContent=label;
    anchor.removeAttribute('target');
    anchor.removeAttribute('rel');
    anchor.removeAttribute('data-generate-lead');
  }

  function svgArrow(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';}

  function initHome(){
    if(document.body.dataset.page!=='home')return;

    rewriteHero();
    rewriteNavigation();
    rewriteChoices();
    installSolutionLayer();
    installProjectLayer();
    rewriteMethod();
    rewriteAbout();
    insertDiagnosticSection();
    insertTrustSection();
    insertInvestmentAndFaq();
    rewriteProducts();
    rewriteFinalCta();
    rewriteFooter();
    setupPlanetInteraction();
    setupReveal();
  }

  function rewriteHero(){
    var hero=document.getElementById('inicio');
    if(!hero)return;
    var brandline=hero.querySelector('.hero-brandline');
    if(brandline)brandline.textContent='Tecnologia com chão de venda';
    var sub=hero.querySelector('.hero-sub');
    if(sub)sub.textContent='Estruturas digitais com visão comercial para transformar presença em confiança, contatos e oportunidades de negócio.';
    var actions=hero.querySelectorAll('.hero-actions .btn');
    if(actions[0]){
      actions[0].href=DIAG;
      actions[0].innerHTML='Analisar meu negócio '+svgArrow();
    }
    if(actions[1]){
      actions[1].classList.remove('btn-wa');
      actions[1].classList.add('btn-ghost');
      internalLink(actions[1],'#projetos','Ver projetos reais');
    }
    var orbit=hero.querySelector('.orbit-status');
    if(orbit){
      orbit.innerHTML='ORBIT · OT<br>operação · <b id="orbitClock">--:--:-- BRT</b><div class="otv3-orbit-stack"><span>ecossistema conectado</span><b>Marca · Site · Google</b><b>WhatsApp · Dados</b><span>base · Valinhos/SP</span></div>';
    }
  }

  function rewriteNavigation(){
    var railLabel=document.querySelector('.rail-label');
    if(railLabel)railLabel.innerHTML='O que está travando<br>seu negócio?';
    var railNames={presenca:'Parecer profissional',oferta:'Vender uma oferta',digital:'Conectar meu digital'};
    document.querySelectorAll('.desktop-rail [data-solution]').forEach(function(btn){
      var label=btn.querySelector('span:last-child');
      if(label&&railNames[btn.dataset.solution])label.textContent=railNames[btn.dataset.solution];
    });
    var railContact=document.querySelector('.rail-contact');
    if(railContact){
      var small=railContact.querySelector('small');if(small)small.textContent='Base em Valinhos/SP';
      var metas=railContact.querySelectorAll('.rail-meta span');
      if(metas[0])metas[0].textContent='Projetos para todo o Brasil';
      if(metas[1])metas[1].textContent='Sites · páginas de venda · ecossistema';
    }
    var topDiag=document.querySelector('.top-nav a[href="/diagnostico-digital/"]');
    if(topDiag)topDiag.textContent='Diagnóstico OT';
    var mobileCta=document.querySelector('.mobile-cta');
    if(mobileCta)mobileCta.textContent='Diagnóstico OT';
  }

  function rewriteChoices(){
    var heading=document.querySelector('#solucoes .choice-heading');
    if(heading){
      var label=heading.querySelector('.section-label');if(label)label.textContent='Comece pelo problema';
      var title=heading.querySelector('.section-title');if(title)title.innerHTML='O que está <span class="accent">travando seu negócio?</span>';
      var copy=heading.querySelector('.section-copy');if(copy)copy.textContent='Você não precisa saber qual serviço contratar. Escolha a dor mais urgente e a OT mostra a rota mais adequada.';
    }
    var cards={
      presenca:{title:'Não pareço profissional',desc:'Meu negócio entrega bem, mas o digital não transmite a mesma confiança.'},
      oferta:{title:'Minha oferta não avança',desc:'Tenho produto ou serviço, mas a página não ajuda o cliente a decidir.'},
      digital:{title:'Meu digital está solto',desc:'Site, WhatsApp, Google e conteúdo não trabalham na mesma direção.'}
    };
    document.querySelectorAll('.choice-tab[data-solution]').forEach(function(btn){
      var data=cards[btn.dataset.solution];if(!data)return;
      var strong=btn.querySelector('strong'),span=btn.querySelector('span');
      if(strong)strong.textContent=data.title;
      if(span)span.textContent=data.desc;
    });
    var projectChoice=document.querySelector('.choice-tab[data-scroll="projetos"]');
    if(projectChoice){
      var ps=projectChoice.querySelector('strong'),pd=projectChoice.querySelector('span');
      if(ps)ps.textContent='Quero ver prova real';
      if(pd)pd.textContent='Projetos publicados, decisões e estruturas que já saíram do papel.';
    }
  }

  var solutionCopy={
    presenca:{
      index:'01 · rota comercial',title:'Presença profissional',
      text:'Para negócios que entregam bem, mas ainda não transmitem o mesmo nível de confiança no digital.',
      bullets:['Apresentação clara e confiável','Contato fácil no celular','Estrutura para ser encontrado no Google','Domínio e publicação organizados','Base pronta para medir evolução'],
      cta:'Analisar esta rota',href:DIAG+'?rota=presenca'
    },
    oferta:{
      index:'02 · rota comercial',title:'Oferta que converte',
      text:'Para produto, serviço ou campanha que precisa explicar valor, responder objeções e encurtar o caminho até a ação.',
      bullets:['Oferta entendida rapidamente','Benefícios e objeções organizados','Caminho curto até a ação','Mensagem pronta para campanha','Medição de cliques e contatos'],
      cta:'Analisar esta rota',href:DIAG+'?rota=oferta'
    },
    digital:{
      index:'03 · rota comercial',title:'Ecossistema conectado',
      text:'Para negócios que já usam várias ferramentas, mas ainda operam com site, WhatsApp, Google e dados como peças soltas.',
      bullets:['Uma rota para site, WhatsApp e Google','Menos ferramentas desconectadas','Dados que mostram origem das visitas','Atendimento com mais contexto','Evolução organizada por prioridade'],
      cta:'Analisar esta rota',href:DIAG+'?rota=ecossistema'
    }
  };

  function renderCommercialSolution(key){
    var item=solutionCopy[key],content=document.getElementById('solutionContent');
    if(!item||!content)return;
    content.innerHTML='<span class="solution-index">'+item.index+'</span><h3>'+item.title+'</h3><p>'+item.text+'</p><ul class="solution-list">'+item.bullets.map(function(b){return '<li>'+b+'</li>';}).join('')+'</ul><a class="btn btn-primary" href="'+item.href+'">'+item.cta+' '+svgArrow()+'</a>';
    content.dataset.solution=key;
    var meta=document.querySelector('#solutionMedia .solution-meta');
    if(meta)meta.textContent='mobile · Google · WhatsApp · dados';
    var selection=document.getElementById('heroSelection');
    if(selection)selection.innerHTML='Rota selecionada · <b>'+item.title+'</b>';
  }

  function installSolutionLayer(){
    var active=document.querySelector('.choice-tab[data-solution].is-active');
    renderCommercialSolution(active?active.dataset.solution:'presenca');
    document.querySelectorAll('[data-solution]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var key=btn.dataset.solution;
        setTimeout(function(){renderCommercialSolution(key);},0);
      });
    });
  }

  var projectDecision={
    acai:{decision:'Organizamos marca, site, Google e mensuração como uma única presença para reduzir fragmentação e facilitar a descoberta e o contato com o negócio.',evidence:'Projeto publicado · estrutura real e verificável'},
    adega:{decision:'Priorizamos cardápio, oferta e WhatsApp porque a decisão do cliente acontece rápido e principalmente pelo celular.',evidence:'Projeto publicado · experiência mobile e contato direto'},
    advocacia:{decision:'A hierarquia prioriza autoridade e clareza antes do contato, porque serviços jurídicos exigem confiança antes de conversão.',evidence:'Projeto publicado · estrutura institucional real'},
    navalha:{decision:'A experiência visual aumenta percepção de valor e conduz ao agendamento sem transformar a página em um catálogo confuso.',evidence:'Projeto demonstrativo · aplicação por segmento'},
    mercado:{decision:'Produtos, localização e contato aparecem cedo porque conveniência é decisiva para negócios de bairro.',evidence:'Projeto conceito · aplicação por segmento'}
  };

  function enhanceCurrentProject(){
    var stage=document.getElementById('projectStage');if(!stage)return;
    var active=document.querySelector('.project-tab.is-active');
    var key=active&&active.dataset.project;
    var data=projectDecision[key];if(!data)return;
    var copy=stage.querySelector('.project-copy');if(!copy)return;
    var old=copy.querySelector('.otv3-decision');if(old)old.remove();
    var block=document.createElement('div');block.className='otv3-decision';
    block.innerHTML='<b>Decisão OT</b><p>'+data.decision+'</p><span class="otv3-evidence">'+data.evidence+'</span>';
    var actions=copy.querySelector('.project-actions');
    if(actions)copy.insertBefore(block,actions);else copy.appendChild(block);
    if(actions){
      var secondary=actions.querySelector('.btn-ghost');
      if(secondary)internalLink(secondary,DIAG+'?origem=case&projeto='+encodeURIComponent(key),'Analisar meu negócio');
    }
  }

  function installProjectLayer(){
    var section=document.getElementById('projetos');
    if(section){
      var label=section.querySelector('.projects-head .section-label');if(label)label.textContent='Projetos reais e decisões comerciais';
      var title=section.querySelector('.projects-head .section-title');if(title)title.innerHTML='Prova antes da <span class="accent">promessa.</span>';
      var headCta=section.querySelector('.projects-head .btn');if(headCta)internalLink(headCta,DIAG,'Analisar meu negócio');
    }
    var stage=document.getElementById('projectStage');
    if(stage){
      new MutationObserver(function(){enhanceCurrentProject();}).observe(stage,{childList:true,subtree:true});
      enhanceCurrentProject();
    }
    document.querySelectorAll('.project-tab').forEach(function(btn){btn.addEventListener('click',function(){setTimeout(enhanceCurrentProject,0);});});
  }

  function rewriteMethod(){
    var section=document.getElementById('metodo');if(!section)return;
    var label=section.querySelector(':scope > .inner > .section-label');if(label)label.textContent='Método OT';
    var title=section.querySelector('.section-title');if(title)title.innerHTML='Diagnosticar. Estruturar. <span class="accent">Evoluir.</span>';
    var copy=section.querySelector('.section-copy');if(copy)copy.textContent='O projeto começa no problema do negócio, não no layout. A tecnologia entra depois da direção comercial.';
    var steps=[
      ['01','Diagnosticar','Entender negócio, cliente, oferta, objeções e prioridade antes de recomendar a solução.'],
      ['02','Estruturar','Definir mensagem, jornada, conteúdo e o caminho mais curto até a ação certa.'],
      ['03','Construir','Transformar a estratégia em design, código, conteúdo e experiência responsiva.'],
      ['04','Conectar','Organizar WhatsApp, Google, mensuração e canais para trabalharem na mesma direção.'],
      ['05','Evoluir','Medir, ajustar e ampliar a estrutura conforme o negócio ganha maturidade e novas necessidades.']
    ];
    var grid=section.querySelector('.method-grid');
    if(grid)grid.innerHTML=steps.map(function(m){return '<article class="method-card"><b>'+m[0]+'</b><strong>'+m[1]+'</strong><p>'+m[2]+'</p></article>';}).join('');
    var acc=document.getElementById('methodAccordion');
    if(acc)acc.innerHTML=steps.map(function(m,i){return '<article class="method-item'+(i===0?' is-open':'')+'"><button class="method-toggle" type="button" aria-expanded="'+(i===0?'true':'false')+'"><span><b>'+m[0]+'</b>'+m[1]+'</span><i>+</i></button><div class="method-panel"><div><p>'+m[2]+'</p></div></div></article>';}).join('');
  }

  function rewriteAbout(){
    var section=document.getElementById('sobre');if(!section)return;
    var label=section.querySelector('.section-label');if(label)label.textContent='Por que a OT pensa diferente';
    var title=section.querySelector('h2');if(title)title.innerHTML='Tecnologia com <span class="gradient-text">chão de venda.</span>';
    var paragraphs=section.querySelectorAll('p');
    if(paragraphs[0])paragraphs[0].textContent='A OT nasceu de quem passou décadas lidando com metas, clientes, objeções, negociação e gestão antes de construir estruturas digitais.';
    if(paragraphs[1])paragraphs[1].innerHTML='<strong style="color:#f3f4ff">Não pensamos apenas na página.</strong> Pensamos na conversa que acontece depois do clique — e em como cada decisão digital pode reduzir atrito antes do contato comercial.';
    var stats=section.querySelector('.about-stats');
    if(stats)stats.innerHTML='<span>30+ anos de experiência comercial do fundador</span><span>Base em Valinhos/SP</span><span>Projetos para todo o Brasil</span>';
  }

  function insertDiagnosticSection(){
    if(document.getElementById('diagnostico-ot'))return;
    var solutions=document.getElementById('solucoes');if(!solutions)return;
    var section=document.createElement('section');section.className='otv3-section otv3-diagnostic';section.id='diagnostico-ot';
    section.innerHTML='<div class="otv3-inner"><div class="otv3-diagnostic-card"><div class="otv3-diagnostic-copy"><span class="otv3-kicker">Diagnóstico OT</span><h2>Antes de recomendar uma solução, <span class="otv3-gradient">entendemos o problema.</span></h2><p>Quatro perguntas rápidas transformam uma conversa genérica em uma análise com contexto. Você recebe uma leitura inicial clara — sem precisar saber qual serviço contratar.</p><a class="btn btn-primary" href="'+DIAG+'">Fazer meu Diagnóstico OT '+svgArrow()+'</a></div><div class="otv3-diagnostic-output" aria-label="O que você recebe"><article class="otv3-output"><b>01</b><strong>Até 3 gargalos</strong><span>Pontos que hoje reduzem confiança, clareza ou contato.</span></article><article class="otv3-output"><b>02</b><strong>Uma prioridade</strong><span>O que faz mais sentido atacar primeiro, sem complicar a operação.</span></article><article class="otv3-output"><b>03</b><strong>Uma rota</strong><span>Presença, conversão ou ecossistema — conforme o momento do negócio.</span></article></div></div></div>';
    solutions.after(section);
  }

  function insertTrustSection(){
    if(document.getElementById('seguranca'))return;
    var about=document.getElementById('sobre');if(!about)return;
    var section=document.createElement('section');section.className='otv3-section otv3-trust';section.id='seguranca';
    section.innerHTML='<div class="otv3-inner otv3-trust-grid"><div><span class="otv3-kicker">Segurança para contratar</span><h2 class="otv3-title">Seu projeto precisa trazer <span class="otv3-gradient">clareza — não dependência.</span></h2><p class="otv3-lead">Antes de começar, escopo, etapas e responsabilidades ficam definidos. A estrutura é organizada para o negócio saber o que recebe, como evolui e onde estão seus acessos.</p></div><div class="otv3-trust-points"><article class="otv3-trust-item"><b>Escopo claro</b><p>Entregas, responsabilidades e próximos passos definidos antes da implementação.</p></article><article class="otv3-trust-item"><b>Acessos organizados</b><p>Contas, ferramentas e dados não devem virar uma caixa-preta para o cliente.</p></article><article class="otv3-trust-item"><b>Etapas de aprovação</b><p>O projeto evolui por marcos claros, com validação antes de avançar para mudanças maiores.</p></article><article class="otv3-trust-item"><b>Pós-entrega</b><p>Manutenção e evolução podem continuar conforme a necessidade, sem transformar suporte em surpresa.</p></article></div></div>';
    about.after(section);
  }

  function insertInvestmentAndFaq(){
    if(document.getElementById('investimento-ot'))return;
    var trust=document.getElementById('seguranca'),products=document.getElementById('produtos');
    if(!trust||!products)return;
    var investment=document.createElement('section');investment.className='otv3-section';investment.id='investimento-ot';
    investment.innerHTML='<div class="otv3-inner"><div class="otv3-investment-card"><div><span class="otv3-kicker">Como funciona o investimento</span><h2>Proposta fechada depois do contexto.</h2><p>Cada projeto é dimensionado conforme objetivo, escopo, conteúdo e integrações. Antes de iniciar, você recebe uma proposta clara com entregas, etapas e condições — sem adivinhar o que está incluído.</p><div class="otv3-investment-steps"><span>Diagnóstico</span><span>Escopo</span><span>Proposta</span><span>Aprovação</span><span>Implementação</span></div></div><a class="btn btn-primary" href="'+DIAG+'">Entender minha rota</a></div></div>';
    trust.after(investment);

    var faq=document.createElement('section');faq.className='otv3-section otv3-faq';faq.id='faq';
    faq.innerHTML='<div class="otv3-inner otv3-faq-grid"><div><span class="otv3-kicker">Objeções reais</span><h2 class="otv3-title">Perguntas que você deveria fazer <span class="otv3-gradient">antes de contratar.</span></h2><p class="otv3-lead">Serviço digital não deveria exigir fé. Quanto mais claro o processo, menor o risco para os dois lados.</p></div><div class="otv3-faq-list"><details><summary>Quanto tempo um projeto leva?</summary><p>O prazo depende do escopo e da velocidade de aprovação de conteúdo e materiais. A referência é definida na proposta antes do início, com etapas claras para evitar promessa genérica.</p></details><details><summary>O domínio e os acessos ficam comigo?</summary><p>A estrutura deve ser organizada para o cliente ter clareza sobre domínio, contas, dados e acessos ligados ao seu negócio. A OT não usa dependência técnica como forma de retenção.</p></details><details><summary>Existe mensalidade obrigatória?</summary><p>Não como regra automática. Projeto e evolução contínua são decisões diferentes. Quando manutenção ou acompanhamento fizerem sentido, isso é apresentado de forma separada e transparente.</p></details><details><summary>Vou conseguir atualizar depois?</summary><p>Isso depende do tipo de projeto e da estrutura escolhida. O importante é definir antes o que será editável pelo cliente, o que exige suporte e quais mudanças alteram escopo.</p></details><details><summary>Um site garante vendas?</summary><p>Não. Um bom site melhora clareza, confiança, descoberta, contato e mensuração. Venda também depende de oferta, preço, tráfego, atendimento e capacidade comercial. A OT trabalha a estrutura que prepara melhor essa conversa.</p></details><details><summary>Vocês atendem fora de Valinhos e Campinas?</summary><p>Sim. A OT tem base em Valinhos/SP, mantém proximidade regional e pode desenvolver projetos on-line para negócios de outras cidades e estados.</p></details></div></div>';
    investment.after(faq);
  }

  function rewriteProducts(){
    var section=document.getElementById('produtos');if(!section)return;
    var label=section.querySelector('.section-label');if(label)label.textContent='Conteúdo & autoria';
    var title=section.querySelector('.section-title');if(title)title.innerHTML='Conhecimento que reforça <span class="accent">a prática.</span>';
    var copy=section.querySelector('.section-copy');if(copy)copy.textContent='Livros e materiais do fundador ficam como extensão de autoridade e repertório — sem competir com a contratação de projetos da OT.';
  }

  function rewriteFinalCta(){
    var cta=document.getElementById('contato');if(!cta)return;
    var h2=cta.querySelector('h2');if(h2)h2.innerHTML='Seu negócio merece uma presença <span class="gradient-text">à altura do que entrega.</span>';
    var p=cta.querySelector('p');if(p)p.textContent='Se você ainda não sabe qual estrutura precisa, comece pelo Diagnóstico OT. Se já tem um projeto definido, fale direto com a gente.';
    var actions=cta.querySelectorAll('.hero-actions .btn');
    if(actions[0]){actions[0].href=DIAG;actions[0].textContent='Quero meu Diagnóstico OT';}
    if(actions[1])actions[1].textContent='Falar direto com a OT';
  }

  function rewriteFooter(){
    var footer=document.querySelector('.footer');if(!footer)return;
    var tagline=footer.querySelector('.footer-brand p');if(tagline)tagline.textContent='Estruturas digitais com visão comercial.';
    var metas=footer.querySelectorAll('.footer-meta span');
    if(metas[0])metas[0].textContent='Base em Valinhos/SP · projetos para todo o Brasil';
    var diag=footer.querySelector('.footer-links a[href="/diagnostico-digital/"]');if(diag)diag.textContent='Diagnóstico OT';
  }

  function setupPlanetInteraction(){
    var hero=document.getElementById('inicio'),wrap=document.getElementById('earthOrbit');
    if(!hero||!wrap||matchMedia('(max-width:900px)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    hero.addEventListener('pointermove',function(e){
      var r=hero.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;
      wrap.style.setProperty('--ot-planet-x',(nx*5).toFixed(1)+'px');
      wrap.style.setProperty('--ot-planet-y',(ny*4).toFixed(1)+'px');
      wrap.style.setProperty('--ot-planet-rx',(-ny*2.5).toFixed(2)+'deg');
      wrap.style.setProperty('--ot-planet-ry',(nx*3.2).toFixed(2)+'deg');
    },{passive:true});
    hero.addEventListener('pointerleave',function(){['--ot-planet-x','--ot-planet-y','--ot-planet-rx','--ot-planet-ry'].forEach(function(v){wrap.style.removeProperty(v);});},{passive:true});
  }

  function setupReveal(){
    var nodes=[].slice.call(document.querySelectorAll('.otv3-section, #projetos .project-stage, #metodo .method-card, #sobre .about-grid'));
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){nodes.forEach(function(n){n.classList.add('is-visible');});return;}
    nodes.forEach(function(n){n.classList.add('otv3-reveal');});
    var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}});},{threshold:.1,rootMargin:'0px 0px -7% 0px'});
    nodes.forEach(function(n){io.observe(n);});
  }

  function initDiagnostic(){
    var card=document.querySelector('.diagnostic-card');if(!card)return;
    var eyebrow=card.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='Diagnóstico OT · gratuito e sem compromisso';
    var title=card.querySelector('.title');if(title)title.innerHTML='Descubra o que está travando sua <span class="hl">presença digital.</span>';
    var lead=card.querySelector('.lead');
    if(lead){
      lead.textContent='Responda 4 perguntas rápidas. Você recebe uma leitura inicial com até 3 pontos de atenção, uma prioridade e uma rota recomendada.';
      if(!card.querySelector('.otv3-diagnostic-outcomes')){
        var outcomes=document.createElement('div');outcomes.className='otv3-diagnostic-outcomes';
        outcomes.innerHTML='<span><b>Até 3 pontos</b>clareza, confiança e contato</span><span><b>1 prioridade</b>o que atacar primeiro</span><span><b>1 rota</b>presença, conversão ou ecossistema</span>';
        lead.after(outcomes);
      }
    }
    var proofs=card.querySelectorAll('.proof');
    if(proofs[0])proofs[0].innerHTML='<b>4 perguntas</b><span>Rápido e direto.</span>';
    if(proofs[1])proofs[1].innerHTML='<b>Gratuito</b><span>Sem obrigação de contratar.</span>';
    if(proofs[2])proofs[2].innerHTML='<b>Com contexto</b><span>A conversa já começa do ponto certo.</span>';
    var start=card.querySelector('[data-start-link]');if(start)start.textContent='Começar meu Diagnóstico OT →';
    var resultStep=card.querySelector('.step[data-step="4"]');
    if(resultStep){
      var rtitle=resultStep.querySelector('.question');if(rtitle)rtitle.textContent='Seu mapa inicial está pronto.';
      var rhint=resultStep.querySelector('.hint');if(rhint)rhint.textContent='Esta leitura usa suas respostas para apontar a primeira direção. A análise completa ganha contexto na conversa com a OT.';
      var wa=resultStep.querySelector('.wa-big');if(wa)wa.textContent='Levar este diagnóstico para a OT →';
      var small=resultStep.querySelector('.small');if(small)small.textContent='Leitura inicial, sem promessa de resultado. Vendas também dependem de oferta, tráfego, preço, atendimento e operação.';
    }
    var finish=card.querySelector('[data-finish]');
    if(finish)finish.addEventListener('click',function(){setTimeout(buildDiagnosticMap,30);});
  }

  function selectedValue(name){
    var el=document.querySelector('.opts[data-name="'+name+'"] .opt.selected');
    return el?(el.dataset.value||el.textContent.trim()):'';
  }

  function buildDiagnosticMap(){
    var estrutura=selectedValue('estrutura'),objetivo=selectedValue('objetivo'),negocio=selectedValue('negocio');
    var points=[];
    if(/Ainda não tenho/i.test(estrutura))points.push('Presença central ausente: sua marca ainda depende de canais que você não controla por completo.');
    else if(/antigo/i.test(estrutura))points.push('Estrutura envelhecida: a apresentação pode estar abaixo da qualidade real do negócio.');
    else if(/Instagram e WhatsApp/i.test(estrutura))points.push('Canais desconectados: o cliente depende de redes e mensagens para entender a empresa.');
    else points.push('Conversão fraca: existe uma página, mas o caminho entre interesse e contato merece revisão.');

    if(/mais contatos/i.test(objetivo))points.push('Caminho até o contato: clareza de oferta e chamada para ação precisam trabalhar juntas.');
    else if(/profissional/i.test(objetivo))points.push('Confiança percebida: identidade, mensagem e prova precisam sustentar uma primeira impressão mais forte.');
    else if(/Vender produto/i.test(objetivo))points.push('Oferta comercial: promessa, benefícios, objeções e CTA precisam aparecer na ordem certa.');
    else points.push('Campanha sem rota dedicada: uma ação específica pede página e mensuração próprias.');

    if(/Negócio local/i.test(negocio))points.push('Descoberta local: Google, localização e contato rápido devem fazer parte da mesma presença.');
    else if(/Serviço profissional/i.test(negocio))points.push('Autoridade antes do contato: serviços profissionais precisam reduzir insegurança antes do WhatsApp.');
    else if(/Produto digital/i.test(negocio))points.push('Decisão de compra: o visitante precisa entender valor e próxima ação sem depender de explicação manual.');
    else points.push('Experiência mobile: negócios de atendimento rápido precisam facilitar oferta, localização e conversa no celular.');

    var priority='Organizar uma presença profissional antes de adicionar novas ferramentas.';
    var route='Presença profissional';
    if(/Vender produto|campanha/i.test(objetivo)){priority='Estruturar uma oferta com mensagem, prova e chamada para ação claras.';route='Oferta que converte';}
    else if(/mais contatos/i.test(objetivo)){priority='Reduzir atrito entre interesse e contato, medindo de onde vêm as conversas.';route='Conversão e contato';}
    else if(/Instagram e WhatsApp/i.test(estrutura)){priority='Conectar os canais em uma estrutura central que dê contexto ao cliente.';route='Ecossistema conectado';}

    var summary=document.getElementById('summary');
    if(summary){
      summary.innerHTML='<strong>Mapa inicial OT</strong><div class="otv3-result-map">'+points.slice(0,3).map(function(p,i){return '<div class="otv3-result-point"><b>Ponto '+(i+1)+'</b><span>'+p+'</span></div>';}).join('')+'</div><div class="otv3-result-priority"><strong>Prioridade:</strong> '+priority+'<br><strong>Rota sugerida:</strong> '+route+'</div>';
    }
    var wa=document.getElementById('waLink');
    if(wa){
      var extra='\n\nLeitura inicial OT:\n- '+points.slice(0,3).join('\n- ')+'\nPrioridade: '+priority+'\nRota sugerida: '+route;
      if(wa.href.indexOf('Leitura%20inicial%20OT')===-1)wa.href+=encodeURIComponent(extra);
    }
  }

  ready(function(){
    initHome();
    initDiagnostic();
  });
})();
