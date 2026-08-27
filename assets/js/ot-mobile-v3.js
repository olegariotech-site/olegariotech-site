(function(){
  'use strict';

  function ready(fn){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }

  function isMobile(){return window.matchMedia('(max-width:900px)').matches;}

  function tuneMobileHeader(){
    if(!isMobile())return;
    var cta=document.querySelector('.mobile-cta');
    if(cta){
      cta.textContent='Falar com a OT';
      cta.href='https://wa.me/5511912459144?text='+encodeURIComponent('Olá, OT! Conheci a Olegario Tech pelo site e quero conversar sobre o meu negócio.');
      cta.target='_blank';
      cta.rel='noopener noreferrer';
      cta.setAttribute('data-generate-lead','');
      cta.setAttribute('aria-label','Falar com a Olegario Tech pelo WhatsApp');
      cta.classList.add('mobile-cta-wa');
    }

    var audio=document.querySelector('.mobile-audio-toggle');
    if(audio){
      audio.title='Ativar ou desativar a experiência sonora';
      audio.removeAttribute('aria-describedby');
    }
  }

  function configurePrivacyButton(button){
    if(!button||button.dataset.mobileV3Ready==='1')return;
    button.dataset.mobileV3Ready='1';
    if(isMobile())button.textContent='Privacidade';

    var hero=document.getElementById('inicio');
    if(!hero||!isMobile()){
      button.classList.remove('is-mobile-hidden');
      return;
    }

    function setVisible(heroVisible){
      button.classList.toggle('is-mobile-hidden',heroVisible);
    }

    if('IntersectionObserver'in window){
      var observer=new IntersectionObserver(function(entries){
        if(entries[0])setVisible(entries[0].isIntersecting);
      },{threshold:.08});
      observer.observe(hero);
    }else{
      var update=function(){setVisible(hero.getBoundingClientRect().bottom>0);};
      addEventListener('scroll',update,{passive:true});
      update();
    }
  }

  function tunePrivacyButton(){
    var button=document.getElementById('otConsentSettings');
    if(button){configurePrivacyButton(button);return;}
    var observer=new MutationObserver(function(){
      var created=document.getElementById('otConsentSettings');
      if(created){configurePrivacyButton(created);observer.disconnect();}
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  ready(function(){
    tuneMobileHeader();
    tunePrivacyButton();
  });
})();
