(function(){
  'use strict';
  var css=document.createElement('link');
  css.rel='stylesheet';css.href='/assets/css/ot-v2.css?v=1';css.id='ot-v2-css';
  document.head.appendChild(css);
  var core=document.createElement('script');
  core.src='/assets/js/ot-analytics-core.js?v=2';core.async=false;
  core.onload=function(){
    var v2=document.createElement('script');
    v2.src='/assets/js/ot-v2.js?v=1';v2.async=false;
    document.head.appendChild(v2);
  };
  document.head.appendChild(core);
})();
