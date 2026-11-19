import {projects,media,initial} from './projects.generated.mjs';
import {renderCase,renderMedia} from './templates.mjs';
const stage=document.getElementById('projectStage');
const tabs=[...document.querySelectorAll('[role="tab"][data-project]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const compact=matchMedia('(max-width: 600px)');
let selected=initial;
let kind='website';
let view='auto';
let expanded=false;
let selectionRequest=0;
let mediaRequest=0;
let animation;
const cache=new Map();
const effectiveView=preference=>preference==='auto'?(compact.matches?'mobile':'desktop'):preference;
const sourceFor=(key,presentation,device)=>{
  const set=presentation==='brand'?media[key].brand:media[key];
  return device==='mobile'?set.mobile:set.desktop;
};
function imageReady(src){
  if(!cache.has(src)){
    const image=new Image();image.src=src;
    cache.set(src,image.decode().catch(()=>{}));
  }
  return cache.get(src);
}
function reveal(){
  animation?.cancel();
  if(!reduced.matches)animation=stage.animate([{opacity:.7,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});
}
function syncTabs(instant=false){
  tabs.forEach(tab=>{const active=tab.dataset.project===selected;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
  const tab=tabs.find(item=>item.dataset.project===selected);
  stage.setAttribute('aria-labelledby',tab.id);
  const rail=tab.parentElement,box=tab.getBoundingClientRect(),bounds=rail.getBoundingClientRect();
  if(box.left<bounds.left+4||box.right>bounds.right-4)rail.scrollTo({left:rail.scrollLeft+box.left-bounds.left-4,behavior:instant||reduced.matches?'instant':'smooth'});
}
function transferFocus(){
  const focused=document.activeElement;
  if((focused?.matches('button[data-view]')&&compact.matches)||(focused?.matches('button[data-expand]')&&(!compact.matches||kind!=='website'))){
    (stage.querySelector(`button[data-kind="${kind}"]`)||stage).focus({preventScroll:true});
  }
}
function syncPresentation(){
  const device=effectiveView(view),screen=stage.querySelector('.case-screen');
  const canExpand=compact.matches&&kind==='website'&&selected!=='navalha';
  // Static picture is a no-JS fallback; interactive media has one explicit device.
  // Its source cannot switch ahead of the controls while the next image decodes.
  if(screen.querySelector('source')){
    const set=kind==='brand'?media[selected].brand:media[selected],image=screen.querySelector('img');
    screen.querySelector('source').remove();image.src=sourceFor(selected,kind,device);
    image.width=device==='mobile'?set.mobileWidth:set.width;image.height=device==='mobile'?set.mobileHeight:set.height;
  }
  screen.dataset.view=device;screen.dataset.expanded=String(expanded);screen.dataset.preview=String(canExpand);
  stage.querySelectorAll('button[data-kind]').forEach(control=>control.setAttribute('aria-pressed',String(control.dataset.kind===kind)));
  stage.querySelectorAll('button[data-view]').forEach(control=>control.setAttribute('aria-pressed',String(control.dataset.view===device)));
  const devices=stage.querySelector('.device-switch'),toggle=stage.querySelector('[data-expand]');
  // Move focus before hiding a control at a breakpoint or when changing presentation.
  transferFocus();
  if(devices)devices.hidden=compact.matches;
  if(toggle){
    toggle.hidden=!canExpand;toggle.setAttribute('aria-expanded',String(expanded));
    toggle.innerHTML=expanded?'Recolher captura <span aria-hidden="true">↑</span>':'Ver captura completa <span aria-hidden="true">↓</span>';
  }
  stage.querySelector('.media-caption>span').textContent=selected==='navalha'?'Visual demonstrativo aprovado':kind==='brand'?'Capa de identidade aprovada':'Captura real · site publicado';
}
async function select(key){
  if(key===selected&&stage.getAttribute('aria-busy')!=='true')return;
  const token=++selectionRequest;++mediaRequest;
  stage.setAttribute('aria-busy','true');
  const nextKind=key==='navalha'?'brand':'website';
  // A resize during decoding must load the device that will actually be displayed.
  let device;
  do{
    device=effectiveView('auto');await imageReady(sourceFor(key,nextKind,device));
    if(token!==selectionRequest)return;
  }while(device!==effectiveView('auto'));
  selected=key;kind=nextKind;view='auto';expanded=false;++mediaRequest;
  stage.innerHTML=renderCase(key,projects[key],media[key]);
  stage.dataset.project=key;stage.removeAttribute('aria-busy');
  syncPresentation();syncTabs();reveal();
  document.getElementById('selectionStatus').textContent=`${projects[key].title}. ${key==='navalha'?'Conceito / demonstração OT.':'Projeto real, site publicado.'}`;
}
async function present(nextKind,nextView){
  const token=++mediaRequest,key=selected;
  let device;
  do{
    device=effectiveView(nextView);await imageReady(sourceFor(key,nextKind,device));
    if(token!==mediaRequest||key!==selected)return;
  }while(device!==effectiveView(nextView));
  kind=nextKind;view=nextView;expanded=false;
  stage.querySelector('.media-slot').innerHTML=renderMedia(key,projects[key],media[key],kind,device);
  syncPresentation();
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab.dataset.project));
  tab.addEventListener('keydown',event=>{
    const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;
    if(next<0)return;
    event.preventDefault();tabs[next].focus({preventScroll:true});select(tabs[next].dataset.project);
  });
});
// One delegated listener; changes preserve the single set of actions and disclosures.
stage.addEventListener('click',event=>{
  const button=event.target.closest('button[data-kind],button[data-view],button[data-expand]');
  if(!button||stage.getAttribute('aria-busy')==='true')return;
  if(button.hasAttribute('data-expand')){
    expanded=!expanded;syncPresentation();
    if(!expanded)button.scrollIntoView({block:'nearest',behavior:'instant'});
    return;
  }
  const nextKind=button.dataset.kind||kind,nextView=button.dataset.view||view;
  if(nextKind!==kind||nextView!==view)present(nextKind,nextView);
});
reduced.addEventListener('change',()=>{if(reduced.matches)animation?.cancel()});
compact.addEventListener('change',()=>{transferFocus();present(kind,'auto');syncTabs(true)});
// Hydrate the responsive picture and controls without rebuilding the initial story.
stage.dataset.interactive='true';syncPresentation();syncTabs(true);
