/* OT Experience 2.0 — motion orchestration.
   One observer controls chapter rhythm and pauses decorative motion offscreen. */
(() => {
  'use strict';
  if (document.body?.dataset.page !== 'home') return;

  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const saveData=!!navigator.connection?.saveData;
  const memory=Number(navigator.deviceMemory||8);
  const cores=Number(navigator.hardwareConcurrency||8);
  const lite=saveData||(memory<=4&&cores<=4);

  root.classList.add('ot-experience-ready');
  root.classList.toggle('ot-motion-lite',lite);
  document.body.dataset.motionBudget=lite?'lite':'full';

  const ids=['inicio','solucoes','projetos','metodo','sobre','produtos','faq','ecossistema','contato'];
  let observed=new WeakSet();
  let sections=[];
  let observer;
  let activeFrame=0;

  function refreshActive(){
    activeFrame=0;
    const h=innerHeight||1;
    sections=sections.filter(section=>section?.isConnected);
    for(const section of sections){
      const r=section.getBoundingClientRect();
      const active=r.top<h*.92&&r.bottom>h*.08;
      section.classList.toggle('is-experience-active',active);
      if(active)section.classList.add('is-experience-seen');
    }
  }

  function scheduleActive(){
    if(!activeFrame)activeFrame=requestAnimationFrame(refreshActive);
  }

  function register(section){
    if(!section||observed.has(section))return;
    observed.add(section);
    sections.push(section);
    section.dataset.experienceSection='true';
    observer?.observe(section);
    scheduleActive();
  }

  function setupObserver(){
    observer?.disconnect();
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          const section=entry.target;
          if(entry.isIntersecting&&entry.intersectionRatio>.04)section.classList.add('is-experience-seen');
          section.style.setProperty('--experience-ratio',entry.intersectionRatio.toFixed(3));
        }
      },{
        root:null,
        rootMargin:'-8% 0px -10% 0px',
        threshold:[0,.04,.16,.32,.55]
      });
    }
    ids.map(id=>document.getElementById(id)).forEach(register);
    refreshActive();
  }

  function registerDynamic(){
    const ecosystem=document.getElementById('ecossistema');
    if(ecosystem)register(ecosystem);
  }

  setupObserver();
  addEventListener('scroll',scheduleActive,{passive:true});
  addEventListener('resize',scheduleActive,{passive:true});

  if(!document.getElementById('ecossistema')){
    const mutation=new MutationObserver(()=>{
      registerDynamic();
      if(document.getElementById('ecossistema'))mutation.disconnect();
    });
    mutation.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>mutation.disconnect(),8000);
  }

  reduced.addEventListener('change',()=>{
    if(reduced.matches){
      sections.forEach(section=>section.classList.add('is-experience-seen'));
    }
    scheduleActive();
  });

  const syncVisibility=()=>root.classList.toggle('ot-page-hidden',document.hidden);
  document.addEventListener('visibilitychange',syncVisibility);
  syncVisibility();
})();
