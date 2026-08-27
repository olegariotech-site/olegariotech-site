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
      cta.innerHTML='<svg class="mobile-cta-wa__icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.02 3C8.83 3 3 8.73 3 15.8c0 2.42.69 4.77 2 6.8L3.1 29l6.58-1.82a13.18 13.18 0 0 0 6.34 1.62C23.2 28.8 29 23.07 29 16S23.2 3 16.02 3Zm0 23.5a10.9 10.9 0 0 1-5.56-1.54l-.4-.23-3.9 1.08 1.04-3.78-.26-.39a10.42 10.42 0 0 1-1.64-5.84c0-5.8 4.8-10.5 10.72-10.5 5.9 0 10.68 4.7 10.68 10.7 0 5.8-4.78 10.5-10.68 10.5Zm5.87-7.87c-.32-.16-1.9-.92-2.2-1.03-.3-.1-.52-.16-.73.16-.21.31-.84 1.03-1.03 1.24-.19.2-.38.23-.7.08-.32-.16-1.35-.49-2.57-1.57-.95-.84-1.59-1.87-1.77-2.18-.2-.31-.02-.48.14-.64.14-.14.32-.36.48-.55.16-.18.22-.31.32-.52.11-.2.05-.39-.02-.55-.08-.16-.73-1.72-1-2.35-.26-.61-.53-.53-.73-.54h-.62c-.21 0-.56.08-.86.39-.29.31-1.11 1.08-1.11 2.63s1.14 3.05 1.3 3.26c.16.2 2.24 3.36 5.43 4.7.76.32 1.35.51 1.81.65.76.24 1.45.2 2 .12.61-.09 1.9-.77 2.17-1.51.27-.75.27-1.39.19-1.52-.08-.13-.3-.2-.62-.36Z"/></svg><span>WhatsApp</span>';
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
