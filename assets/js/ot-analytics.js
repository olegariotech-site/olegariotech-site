(function(){
  'use strict';

  var css=document.createElement('link');
  css.rel='stylesheet';css.href='/assets/css/ot-v2.css?v=2';css.id='ot-v2-css';
  document.head.appendChild(css);

  var mobileCss=document.createElement('link');
  mobileCss.rel='stylesheet';mobileCss.href='/assets/css/ot-mobile-v3.css?v=1';mobileCss.id='ot-mobile-v3-css';
  document.head.appendChild(mobileCss);

  var core=document.createElement('script');
  core.src='/assets/js/ot-analytics-core.js?v=2';core.async=false;
  core.onload=function(){
    var v2=document.createElement('script');
    v2.src='/assets/js/ot-v2.js?v=2';v2.async=false;
    v2.onload=function(){
      var mobile=document.createElement('script');
      mobile.src='/assets/js/ot-mobile-v3.js?v=1';mobile.async=false;
      document.head.appendChild(mobile);
    };
    document.head.appendChild(v2);
  };
  document.head.appendChild(core);
})();
