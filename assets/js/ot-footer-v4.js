(function(){
  'use strict';

  function ready(fn){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }

  function safeExternalHref(value){
    try{
      var url=new URL(value,location.href);
      return /^https?:$/.test(url.protocol)?url.href:'';
    }catch(e){return '';}
  }

  function findExistingHref(footer,selectors,fallback){
    for(var i=0;i<selectors.length;i++){
      var el=footer.querySelector(selectors[i]);
      if(el){
        var href=safeExternalHref(el.getAttribute('href')||el.href||'');
        if(href)return href;
      }
    }
    return fallback||'';
  }

  function socialIcon(type){
    if(type==='instagram')return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.7" r="1" class="fill-dot"/></svg>';
    if(type==='facebook')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4.5c-.7-.1-1.8-.3-3.2-.3-3.1 0-5.2 1.9-5.2 5.4V12H5v4h3.6v8h4.3v-8h3.5l.6-4h-4.1V10c0-1.2.3-2 1.1-2Z" class="fill-shape"/></svg>';
    return '';
  }

  function installFooter(){
    if(document.body.dataset.page!=='home')return;
    var footer=document.querySelector('footer.footer');
    if(!footer||footer.dataset.otFooterV4==='1')return;

    var instagram=findExistingHref(footer,['a[data-social-network="instagram"]','a[href*="instagram.com"]'],'https://www.instagram.com/alexandre.olegario.oficial/');
    var facebook=findExistingHref(footer,['a[data-social-network="facebook"]','a[href*="facebook.com"]'],'https://www.facebook.com/alexandre.olegario.oficial/');
    var googleReview=findExistingHref(footer,['a[data-google-review]','a[href*="g.page"]','a[href*="google.com/maps"]','a[href*="search.google.com"]'],'');
    var whatsapp='https://wa.me/5511912459144?text='+encodeURIComponent('Olá, OT! Conheci a Olegario Tech pelo site e quero conversar sobre o meu negócio.');

    var reviewMarkup=googleReview?'<a class="ot-footer-review" data-google-review href="'+googleReview+'" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">★</span>Avalie a OT no Google</a>':'';

    footer.dataset.otFooterV4='1';
    footer.innerHTML=''+
      '<div class="ot-footer-v4">'+
        '<div class="ot-footer-v4__main">'+
          '<section class="ot-footer-v4__brand" aria-label="Olegario Tech">'+
            '<a class="brand ot-footer-v4__logo" href="#inicio" aria-label="Olegario Tech, voltar ao início">'+
              '<img src="/assets/img/brand/olegario-tech-logo-oficial.webp" alt="">'+
              '<span class="brand-text">Olegario <b>Tech</b></span>'+
            '</a>'+
            '<strong>Consultoria digital com cabeça de vendas.</strong>'+
            '<p>Marca, site, WhatsApp, Google e dados trabalhando para gerar oportunidades.</p>'+
            '<div class="ot-footer-v4__social">'+
              '<a data-social-network="instagram" href="'+instagram+'" target="_blank" rel="noopener noreferrer">'+socialIcon('instagram')+'<span>Instagram</span></a>'+
              '<a data-social-network="facebook" href="'+facebook+'" target="_blank" rel="noopener noreferrer">'+socialIcon('facebook')+'<span>Facebook</span></a>'+
            '</div>'+reviewMarkup+
          '</section>'+

          '<nav class="ot-footer-v4__nav" aria-label="Navegação do rodapé">'+
            '<span class="ot-footer-v4__eyebrow">Navegação</span>'+
            '<a href="/diagnostico-digital/">Diagnóstico digital</a>'+
            '<a href="#projetos">Projetos reais</a>'+
            '<a href="#metodo">Como trabalhamos</a>'+
            '<a href="#sobre">Conhecer a OT</a>'+
          '</nav>'+

          '<section class="ot-footer-v4__contact" aria-label="Contato Olegario Tech">'+
            '<span class="ot-footer-v4__eyebrow">Fale com a OT</span>'+
            '<a class="ot-footer-v4__wa" data-generate-lead href="'+whatsapp+'" target="_blank" rel="noopener noreferrer"><span class="ot-footer-v4__wa-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.5a8.3 8.3 0 0 0-7.1 12.6L4 20.5l4.5-1.2A8.3 8.3 0 1 0 12 3.5Z"/><path d="M9.2 8.7c.2-.3.4-.4.7-.2l1 .6c.2.1.3.4.2.6l-.3.6c.5 1 1.2 1.7 2.2 2.2l.6-.3c.2-.1.5 0 .6.2l.6 1c.2.3.1.5-.2.7-.6.4-1.3.5-2 .2-2.1-.8-3.8-2.5-4.6-4.6-.3-.7-.2-1.4.2-2Z"/></svg></span><span>Falar com a OT</span></a>'+
            '<a href="tel:+5511912459144">(11) 91245-9144</a>'+
            '<a href="mailto:olegariotech.oficial@gmail.com">olegariotech.oficial@gmail.com</a>'+
            '<div class="ot-footer-v4__location"><strong>Valinhos · Campinas · Região</strong><span>Atendimento digital para todo o Brasil.</span></div>'+
          '</section>'+
        '</div>'+

        '<div class="ot-footer-v4__bottom">'+
          '<div class="ot-footer-v4__signature"><span>© 2026 Olegario Tech.</span><strong>Seguimos lúcidos e potentes.</strong></div>'+
          '<nav class="ot-footer-v4__legal" aria-label="Privacidade e cookies">'+
            '<a href="/privacidade/">Privacidade</a>'+
            '<a href="/cookies/">Cookies</a>'+
            '<button type="button" data-footer-cookie-settings>Gerenciar cookies</button>'+
          '</nav>'+
        '</div>'+
      '</div>';

    var cookieButton=footer.querySelector('[data-footer-cookie-settings]');
    if(cookieButton)cookieButton.addEventListener('click',function(){
      if(window.OTAnalytics&&typeof window.OTAnalytics.openPreferences==='function')window.OTAnalytics.openPreferences();
      else location.href='/cookies/';
    });
  }

  ready(installFooter);
})();
