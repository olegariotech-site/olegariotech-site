/* Diagnóstico Digital V2 — interactive self-assessment */
(() => {
  'use strict';
  const steps=[...document.querySelectorAll('.step')];
  const bar=document.getElementById('bar');
  const progress=document.querySelector('.progress');
  const stepLabel=document.getElementById('stepLabel');
  const liveState=document.querySelector('.live-state');
  const answers={};
  const scores={presenca:null,site:null,google:null,whatsapp:null,dados:null};
  const phone='5511912459144';
  let current=0;

  const scoreMap={
    estrutura:{
      'Só Instagram e WhatsApp':{presenca:2,site:1},
      'Tenho site, mas está antigo':{presenca:3,site:2},
      'Tenho site profissional atualizado':{presenca:4,site:4},
      'Tenho site + páginas para campanhas':{presenca:5,site:5}
    },
    google:{
      'Quase não apareço':{google:1},
      'Tenho perfil, mas pouco movimento':{google:2},
      'Apareço e recebo avaliações':{google:4},
      'Tenho perfil + SEO e Search Console':{google:5}
    },
    whatsapp:{
      'Uso número comum sem estrutura':{whatsapp:1},
      'Tenho WhatsApp Business básico':{whatsapp:2},
      'Uso mensagens, catálogo ou etiquetas':{whatsapp:4},
      'Está integrado ao site e às campanhas':{whatsapp:5}
    },
    dados:{
      'Não acompanho dados':{dados:1},
      'Olho só curtidas e seguidores':{dados:2},
      'Vejo Analytics ou relatórios às vezes':{dados:4},
      'Uso Analytics, Search Console e eventos':{dados:5}
    }
  };

  const routes={
    presenca:{title:'Fortalecer presença e confiança',text:'Sua prioridade inicial é fazer o negócio transmitir mais autoridade antes do primeiro contato.'},
    site:{title:'Estruturar site e caminho de conversão',text:'Sua base própria precisa organizar oferta, prova e chamada para ação antes de escalar divulgação.'},
    google:{title:'Ganhar presença e descoberta no Google',text:'Há espaço para estruturar busca local, perfil, páginas e sinais que ajudam o cliente a encontrar sua empresa.'},
    whatsapp:{title:'Organizar atendimento e conversão',text:'O WhatsApp pode trabalhar melhor com contexto, mensagens, origem do lead e chamadas para ação mais claras.'},
    dados:{title:'Implantar mensuração e aprendizado',text:'Sem dados, o digital vira achismo. O próximo passo é medir visitas, cliques, busca e geração de contatos.'},
    ecossistema:{title:'Integrar canais e evoluir o ecossistema',text:'Sua base já tem bons sinais. O próximo ganho está em conectar presença, atendimento, busca e mensuração.'}
  };

  function show(i){
    current=Math.max(0,Math.min(i,steps.length-1));
    steps.forEach((s,idx)=>s.classList.toggle('active',idx===current));
    const answered=Math.min(current,5);
    if(bar) bar.style.width=((answered/5)*100)+'%';
    if(progress){
      progress.setAttribute('aria-valuemax','5');
      progress.setAttribute('aria-valuenow',String(answered));
    }
    if(stepLabel) stepLabel.textContent=current<5?('sinal '+(current+1)+' de 5'):(current===5?'finalização':'resultado');
    if(matchMedia('(max-width:980px)').matches){
      document.getElementById('quiz')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }

  function renderSignals(changedKeys=[]){
    Object.entries(scores).forEach(([key,value])=>{
      const row=document.querySelector('[data-signal="'+key+'"]');
      if(!row)return;
      const numeric=Number(value||0);
      row.dataset.score=String(numeric);
      const valueEl=row.querySelector('.signal-value');
      if(valueEl)valueEl.textContent=numeric?numeric+'/5':'—';
      row.setAttribute('aria-label',row.dataset.label+': '+(numeric?numeric+' de 5':'aguardando resposta'));
      if(changedKeys.includes(key)){
        row.classList.remove('is-updated');
        void row.offsetWidth;
        row.classList.add('is-updated');
        setTimeout(()=>row.classList.remove('is-updated'),520);
      }
    });
  }

  function updateLiveState(){
    if(!liveState)return;
    const read=Object.values(scores).filter(v=>Number(v)>0).length;
    liveState.textContent=read?read+'/5 sinais lidos':(answers.objetivo?'objetivo definido':'aguardando respostas');
  }

  function applyScore(groupName,value){
    const update=scoreMap[groupName]?.[value];
    if(!update){updateLiveState();return;}
    const changed=[];
    Object.entries(update).forEach(([key,score])=>{scores[key]=score;changed.push(key);});
    renderSignals(changed);
    updateLiveState();
  }

  function routeForResult(){
    const known=Object.entries(scores).filter(([,value])=>Number(value)>0);
    if(!known.length)return routes.ecossistema;
    const weakest=[...known].sort((a,b)=>a[1]-b[1])[0];
    if(weakest[1]<=3)return routes[weakest[0]]||routes.ecossistema;
    const objective=answers.objetivo||'';
    if(objective==='Parecer mais profissional')return routes.presenca;
    if(objective==='Gerar mais contatos'||objective==='Vender produto ou serviço')return scores.site<4?routes.site:routes.whatsapp;
    return routes.ecossistema;
  }

  function overallScore(){
    const values=Object.values(scores).filter(v=>Number(v)>0).map(Number);
    if(!values.length)return null;
    return Math.round((values.reduce((a,b)=>a+b,0)/values.length)*10)/10;
  }

  function next(){show(current+1)}
  document.querySelectorAll('[data-start-link]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();show(0)}));
  document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>show(current-1)));

  document.querySelectorAll('[data-restart]').forEach(btn=>btn.addEventListener('click',()=>{
    Object.keys(answers).forEach(k=>delete answers[k]);
    Object.keys(scores).forEach(k=>scores[k]=null);
    document.querySelectorAll('.opt.selected').forEach(o=>o.classList.remove('selected'));
    const f=document.getElementById('nomeNegocio');if(f)f.value='';
    renderSignals();
    updateLiveState();
    show(0);
  }));

  document.querySelectorAll('.opts').forEach(group=>{
    group.addEventListener('click',e=>{
      const btn=e.target.closest('.opt');
      if(!btn)return;
      group.querySelectorAll('.opt').forEach(o=>o.classList.remove('selected'));
      btn.classList.add('selected');
      const value=btn.dataset.value||btn.textContent.trim();
      answers[group.dataset.name]=value;
      applyScore(group.dataset.name,value);
      setTimeout(next,180);
    });
  });

  function escapeHtml(value){
    return String(value).replace(/[&<>'"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));
  }

  function finish(){
    const name=(document.getElementById('nomeNegocio')?.value||'').trim();
    answers.nome=name||'Ainda não informado';
    const route=routeForResult();
    const avg=overallScore();
    const priority=document.getElementById('priorityTitle');
    const priorityText=document.getElementById('priorityText');
    const scoreEl=document.getElementById('overallScore');
    if(priority)priority.textContent=route.title;
    if(priorityText)priorityText.textContent=route.text;
    if(scoreEl)scoreEl.textContent=avg?avg.toFixed(1).replace('.',',')+'/5':'—';

    const summary=document.getElementById('summary');
    if(summary){
      summary.innerHTML='<strong>Seus sinais:</strong><br>'+
        'Presença '+(scores.presenca||'—')+'/5 · Site '+(scores.site||'—')+'/5 · Google '+(scores.google||'—')+'/5 · WhatsApp '+(scores.whatsapp||'—')+'/5 · Dados '+(scores.dados||'—')+'/5';
    }

    const message=[
      'Olá, OT! Concluí o Diagnóstico Digital no site.',
      '',
      'Negócio: '+(answers.nome||'Não informado'),
      'Objetivo: '+(answers.objetivo||'Não informado'),
      'Estrutura atual: '+(answers.estrutura||'Não informado'),
      'Google: '+(answers.google||'Não informado'),
      'WhatsApp: '+(answers.whatsapp||'Não informado'),
      'Dados: '+(answers.dados||'Não informado'),
      '',
      'Sinais: Presença '+(scores.presenca||'—')+'/5 | Site '+(scores.site||'—')+'/5 | Google '+(scores.google||'—')+'/5 | WhatsApp '+(scores.whatsapp||'—')+'/5 | Dados '+(scores.dados||'—')+'/5',
      'Prioridade inicial: '+route.title,
      '',
      'Quero entender os próximos passos.'
    ].join('\n');
    const link=document.getElementById('waLink');
    if(link)link.href='https://wa.me/'+phone+'?text='+encodeURIComponent(message);
    show(6);
  }

  document.querySelectorAll('[data-finish]').forEach(btn=>btn.addEventListener('click',finish));
  renderSignals();
  updateLiveState();
  show(0);
})();
