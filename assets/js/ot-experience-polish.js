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
  const observed=new WeakSet();
  let observer;

  function register(section){
    if(!section||observed.has(section))return;
    observed.add(section);
    section.dataset.experienceSection='true';

    if(reduced.matches){
      section.classList.add('is-experience-seen','is-experience-active');
      return;
    }
    observer?.observe(section);
  }

  function setupObserver(){
    observer?.disconnect();
    observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        const section=entry.target;
        const active=entry.isIntersecting&&entry.intersectionRatio>.06;
        section.classList.toggle('is-experience-active',active);
        if(active)section.classList.add('is-experience-seen');
        section.style.setProperty('--experience-ratio',entry.intersectionRatio.toFixed(3));
      }
    },{
      root:null,
      rootMargin:'-8% 0px -10% 0px',
      threshold:[0,.06,.16,.32,.55]
    });
    ids.map(id=>document.getElementById(id)).forEach(register);
  }

  function registerDynamic(){
    const ecosystem=document.getElementById('ecossistema');
    if(ecosystem)register(ecosystem);
  }

  if('IntersectionObserver' in window)setupObserver();
  else ids.map(id=>document.getElementById(id)).forEach(section=>{
    if(section){
      section.dataset.experienceSection='true';
      section.classList.add('is-experience-seen','is-experience-active');
    }
  });

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
      observer?.disconnect();
      ids.map(id=>document.getElementById(id)).forEach(section=>{
        if(section)section.classList.add('is-experience-seen','is-experience-active');
      });
      registerDynamic();
    }else{
      observed=new WeakSet();
      setupObserver();
      registerDynamic();
    }
  });

  const syncVisibility=()=>root.classList.toggle('ot-page-hidden',document.hidden);
  document.addEventListener('visibilitychange',syncVisibility);
  syncVisibility();
})();
