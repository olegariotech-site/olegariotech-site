(function(){
  'use strict';
  function updateClock(){
    var clock=document.getElementById('orbitClock');
    if(!clock)return;
    try{
      clock.textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())+' BRT';
    }catch(error){clock.textContent='BRT';}
  }
  updateClock();
  setInterval(updateClock,1000);
})();
