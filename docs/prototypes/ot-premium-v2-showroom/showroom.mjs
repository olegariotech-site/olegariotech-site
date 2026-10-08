import {projects,media,initial} from './projects.generated.mjs';
import {renderCase,renderMedia} from './templates.mjs';
const stage=document.getElementById('projectStage');
const tabs=[...document.querySelectorAll('[role="tab"][data-project]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const compact=matchMedia('(max-width: 600px)');
let selected=initial;
let kind='website';
let view='auto';
let pending=0;
let animation;
const cache=new Map();
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
async function select(key){
  if(key===selected&&stage.getAttribute('aria-busy')!=='true')return;
  const token=++pending;
  const asset=media[key];
  stage.setAttribute('aria-busy','true');
  const mobile=compact.matches;
  await imageReady(key==='navalha'?(mobile?asset.brand.mobile:asset.brand.desktop):(mobile?asset.mobile:asset.desktop));
  if(token!==pending)return;
  selected=key;kind=key==='navalha'?'brand':'website';view='auto';
  stage.innerHTML=renderCase(key,projects[key],media[key]);
  stage.dataset.project=key;stage.removeAttribute('aria-busy');
  syncTabs();reveal();
  document.getElementById('selectionStatus').textContent=`${projects[key].title}. ${key==='navalha'?'Conceito / demonstração OT.':'Projeto real, site publicado.'}`;
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab.dataset.project));
  tab.addEventListener('keydown',event=>{
    const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;
    if(next<0)return;
    event.preventDefault();tabs[next].focus({preventScroll:true});select(tabs[next].dataset.project);
  });
});
// One delegated listener; view changes never register analytics or rebuild the copy.
stage.addEventListener('click',async event=>{
  const button=event.target.closest('button[data-kind],button[data-view]');
  if(!button)return;
  if(stage.getAttribute('aria-busy')==='true')return;
  const nextKind=button.dataset.kind||kind;
  const nextView=button.dataset.view||view;
  if(nextKind===kind&&nextView===view)return;
  const token=++pending;
  const asset=media[selected];
  const set=nextKind==='brand'?asset.brand:asset;
  const useMobile=nextView==='mobile'||nextView==='auto'&&compact.matches;
  await imageReady(useMobile?set.mobile:set.desktop);
  if(token!==pending)return;
  kind=nextKind;view=nextView;
  stage.querySelector('.media-slot').innerHTML=renderMedia(selected,projects[selected],asset,kind,view);
  stage.querySelectorAll('[data-kind]').forEach(control=>{if(control.matches('button'))control.setAttribute('aria-pressed',String(control.dataset.kind===kind))});
  stage.querySelectorAll('button[data-view]').forEach(control=>control.setAttribute('aria-pressed',String(control.dataset.view===(view==='auto'?'desktop':view))));
  stage.querySelector('.media-caption>span').textContent=kind==='brand'?'Capa de identidade aprovada':'Captura real · site publicado';
});
reduced.addEventListener('change',()=>{if(reduced.matches)animation?.cancel()});
compact.addEventListener('change',()=>{
  view='auto';
  stage.querySelector('.media-slot').innerHTML=renderMedia(selected,projects[selected],media[selected],kind,view);
  stage.querySelectorAll('button[data-view]').forEach(control=>control.setAttribute('aria-pressed',String(control.dataset.view==='desktop')));
});
// The effective production initial case is K.L; expose its tab in the narrow rail too.
syncTabs(true);
