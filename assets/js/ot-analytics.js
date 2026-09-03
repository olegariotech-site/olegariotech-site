(function(){
  'use strict';

  var css=document.createElement('link');
  css.rel='stylesheet';css.href='/assets/css/ot-v2.css?v=2';css.id='ot-v2-css';
  document.head.appendChild(css);

  var mobileCss=document.createElement('link');
  mobileCss.rel='stylesheet';mobileCss.href='/assets/css/ot-mobile-v3.css?v=1';mobileCss.id='ot-mobile-v3-css';
  document.head.appendChild(mobileCss);

  var footerCss=document.createElement('link');
  footerCss.rel='stylesheet';footerCss.href='/assets/css/ot-footer-v4.css?v=1';footerCss.id='ot-footer-v4-css';
  document.head.appendChild(footerCss);

  var commercialCss=document.createElement('link');
  commercialCss.rel='stylesheet';commercialCss.href='/assets/css/ot-commercial-v3.css?v=1';commercialCss.id='ot-commercial-v3-css';
  document.head.appendChild(commercialCss);

  function loadRuntime(){
    var runtime=document.createElement('script');
    runtime.src='/assets/js/ot-commercial-v3-runtime.js?v=1';runtime.async=false;
    document.head.appendChild(runtime);
  }

  function loadCommercial(){
    var commercial=document.createElement('script');
    commercial.src='/assets/js/ot-commercial-v3.js?v=1';commercial.async=false;
    commercial.onload=loadRuntime;
    commercial.onerror=loadRuntime;
    document.head.appendChild(commercial);
  }

  var core=document.createElement('script');
  core.src='/assets/js/ot-analytics-core.js?v=2';core.async=false;
  core.onload=function(){
    var v2=document.createElement('script');
    v2.src='/assets/js/ot-v2.js?v=2';v2.async=false;
    v2.onload=function(){
      var mobile=document.createElement('script');
      mobile.src='/assets/js/ot-mobile-v3.js?v=1';mobile.async=false;
      mobile.onload=function(){
        var footer=document.createElement('script');
        footer.src='/assets/js/ot-footer-v4.js?v=1';footer.async=false;
        footer.onload=loadCommercial;
        footer.onerror=loadCommercial;
        document.head.appendChild(footer);
      };
      document.head.appendChild(mobile);
    };
    document.head.appendChild(v2);
  };
  core.onerror=loadCommercial;
  document.head.appendChild(core);
})();
