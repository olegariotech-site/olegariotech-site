// Shared markup for the home build and runtime. Editorial content stays in index.html projects.
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const order=['acai','kl','adega','advocacia','ripamonti','navalha'];
export function renderTab(key,p,initial,asset){
  const thumb=asset.thumbnail;
  return `<button type="button" class="case-tab project-tab" id="project-tab-${key}" role="tab" aria-controls="projectStage" aria-selected="${key===initial}" tabindex="${key===initial?0:-1}" data-project="${key}"><img src="${escapeHTML(thumb.src)}" alt="" width="${thumb.width}" height="${thumb.height}" loading="lazy" decoding="async"><span><strong>${escapeHTML(p.title)}</strong><small>${key==='navalha'?'Conceito / demonstração':escapeHTML(p.segment)}</small></span></button>`;
}
export function renderMedia(key,p,asset,kind='website',view='auto'){
  const brand=kind==='brand'||key==='navalha';
  const desktop=brand?asset.brand.desktop:asset.desktop;
  const mobile=brand?asset.brand.mobile:asset.mobile;
  const dimensions=brand?asset.brand:asset;
  const useMobile=view==='mobile';
  const src=useMobile?mobile:desktop;
  const width=useMobile?dimensions.mobileWidth:dimensions.width;
  const height=useMobile?dimensions.mobileHeight:dimensions.height;
  const alt=brand?`${p.title} — ${key==='navalha'?'visual aprovado do conceito OT, não um cliente real':'capa de identidade aprovada'}`:`${p.title} — captura fiel do site publicado em ${view==='mobile'?'celular':'desktop ou celular conforme a tela'}`;
  const domain=new URL(p.link).hostname;
  return `<div class="case-screen ${brand?'case-screen--brand':''} ${useMobile?'case-screen--mobile':''}" data-kind="${brand?'brand':'website'}" data-view="${view}">
    ${brand?`<div class="screen-chrome"><span>${key==='navalha'?'CONCEITO / DEMONSTRAÇÃO OT':'IDENTIDADE DO PROJETO'}</span></div>`:`<div class="screen-chrome"><span class="chrome-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${escapeHTML(domain)}</span><span class="chrome-safe" aria-hidden="true">↗</span></div>`}
    <picture id="caseCapture">${view==='auto'?`<source media="(max-width: 600px)" srcset="${escapeHTML(mobile)}" width="${dimensions.mobileWidth}" height="${dimensions.mobileHeight}">`:''}<img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async" fetchpriority="low"></picture>
  </div>`;
}
export function renderCase(key,p,asset){
  const concept=key==='navalha';
  const leadText=`Olá, OT! Vi o case ${p.title} no site e quero entender uma estrutura parecida para o meu negócio.`;
  const leadHref=`https://wa.me/5511912459144?text=${encodeURIComponent(leadText)}`;
  const testimonial=p.testimonial?`<figure class="case-testimonial"><div class="review-source"><span aria-label="Avaliação de cinco estrelas no Google">★★★★★</span><span>Avaliação no Google</span></div><blockquote>“${escapeHTML(p.testimonial.quote)}”</blockquote><figcaption><strong>${escapeHTML(p.testimonial.author)}</strong><a href="${escapeHTML(p.testimonial.source)}" target="_blank" rel="noopener noreferrer" aria-label="Ver avaliações da Olegario Tech no Google">Ver no Google ↗</a></figcaption></figure>`:'';
  return `<div class="case-copy project-copy">
    <span class="case-status"><i aria-hidden="true"></i>${concept?'CONCEITO / DEMONSTRAÇÃO OT':'PROJETO REAL · NO AR'}</span>
    <h3>${escapeHTML(p.title)}</h3>
    <p class="case-segment">${escapeHTML(p.segment)}</p>
    <span class="delivery-label meta">${concept?'Proposta do conceito':'Entrega OT'}</span>
    <p class="case-description">${escapeHTML(p.text)}</p>
    <div class="case-actions"><a class="btn btn-primary" data-project-link href="${escapeHTML(p.link)}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.cta)} <span aria-hidden="true">↗</span></a><a class="btn btn-ghost" data-generate-lead href="${escapeHTML(leadHref)}" target="_blank" rel="noopener noreferrer">Quero uma estrutura parecida <span aria-hidden="true">↗</span></a></div>
  </div>
  <div class="case-media">
    <div class="media-tools"><span class="media-label">${concept?'Conceito OT':'O site como produto'}</span>${concept?'':`<div class="view-switch" role="group" aria-label="Apresentação do projeto"><button type="button" data-kind="website" aria-pressed="true">Website</button><button type="button" data-kind="brand" aria-pressed="false">Identidade</button></div>`}</div>
    <div class="media-slot">${renderMedia(key,p,asset,concept?'brand':'website')}</div>
    <div class="media-caption"><span>${concept?'Visual demonstrativo aprovado':'Captura real · site publicado'}</span>${concept?'':`<div class="device-switch" role="group" aria-label="Versão da captura"><button type="button" data-view="desktop" aria-pressed="true">Desktop</button><button type="button" data-view="mobile" aria-pressed="false">Mobile</button></div>`}</div>
    ${concept?'':`<button type="button" class="capture-toggle" hidden data-expand aria-expanded="false" aria-controls="caseCapture">Ver captura completa <span aria-hidden="true">↓</span></button>`}
  </div>
  <div class="case-followup">
${testimonial}
    <details class="case-story"><summary>Desafio e estratégia OT <span aria-hidden="true">+</span></summary><div class="story-content"><p class="canonical-label">${escapeHTML(p.label)}</p><dl><dt>Desafio</dt><dd>${escapeHTML(p.challenge)}</dd><dt>Estratégia OT</dt><dd>${escapeHTML(p.strategy)}</dd></dl></div></details>
  </div>
  <div class="case-deliverables"><span class="meta">${concept?'O que a demonstração apresenta':'Principais entregas'}</span><ul>${p.points.map(point=>`<li>${escapeHTML(point)}</li>`).join('')}</ul></div>`;
}

// Media descriptors only; no parallel editorial catalog.
export const media={
  "acai": {
    "desktop": "/assets/img/projetos/showroom-v2/acai-desktop.webp",
    "mobile": "/assets/img/projetos/showroom-v2/acai-mobile.webp",
    "width": 1440,
    "height": 1000,
    "mobileWidth": 390,
    "mobileHeight": 1258,
    "brand": {
      "desktop": "/assets/img/projetos/acai/acai-do-dudu-link-preview-v2.jpg",
      "mobile": "/assets/img/projetos/acai/acai-do-dudu-link-preview-v2.jpg",
      "width": 1200,
      "height": 630,
      "mobileWidth": 1200,
      "mobileHeight": 630
    },
    "thumbnail": {
      "src": "/assets/img/projetos/showroom-v2/acai-thumb.webp",
      "width": 192,
      "height": 101,
      "original": "/assets/img/projetos/acai/acai-do-dudu-link-preview-v2.jpg"
    }
  },
  "kl": {
    "desktop": "/assets/img/projetos/showroom-v2/kl-desktop.webp",
    "mobile": "/assets/img/projetos/showroom-v2/kl-mobile.webp",
    "width": 1440,
    "height": 1000,
    "mobileWidth": 390,
    "mobileHeight": 1145,
    "brand": {
      "desktop": "/assets/img/projetos/showroom-v2/kl-identity.webp",
      "mobile": "/assets/img/projetos/showroom-v2/kl-identity.webp",
      "width": 695,
      "height": 436,
      "mobileWidth": 695,
      "mobileHeight": 436
    },
    "thumbnail": {
      "src": "/assets/img/projetos/showroom-v2/kl-thumb.webp",
      "width": 192,
      "height": 144,
      "original": "/assets/img/projetos/kl/caminhao-estrada.webp"
    }
  },
  "adega": {
    "desktop": "/assets/img/projetos/showroom-v2/adega-desktop.webp",
    "mobile": "/assets/img/projetos/showroom-v2/adega-mobile.webp",
    "width": 1440,
    "height": 1000,
    "mobileWidth": 390,
    "mobileHeight": 844,
    "brand": {
      "desktop": "/assets/img/projetos/adega/adega-sao-marcos-card-desktop-brand-v2.webp",
      "mobile": "/assets/img/projetos/adega/adega-sao-marcos-card-mobile-brand-v2.webp",
      "width": 1586,
      "height": 992,
      "mobileWidth": 1122,
      "mobileHeight": 1402
    },
    "thumbnail": {
      "src": "/assets/img/projetos/showroom-v2/adega-thumb.webp",
      "width": 192,
      "height": 120,
      "original": "/assets/img/projetos/adega/adega-sao-marcos-card-desktop-brand-v2.webp"
    }
  },
  "advocacia": {
    "desktop": "/assets/img/projetos/showroom-v2/advocacia-desktop.webp",
    "mobile": "/assets/img/projetos/showroom-v2/advocacia-mobile.webp",
    "width": 1440,
    "height": 1000,
    "mobileWidth": 390,
    "mobileHeight": 844,
    "brand": {
      "desktop": "/assets/img/projetos/advocacia/cintia-almeida-gomes-advocacia-card-desktop-brand-v2.webp",
      "mobile": "/assets/img/projetos/advocacia/cintia-almeida-gomes-advocacia-card-mobile-brand-v2.webp",
      "width": 1586,
      "height": 992,
      "mobileWidth": 1122,
      "mobileHeight": 1402
    },
    "thumbnail": {
      "src": "/assets/img/projetos/showroom-v2/advocacia-thumb.webp",
      "width": 192,
      "height": 120,
      "original": "/assets/img/projetos/advocacia/cintia-almeida-gomes-advocacia-card-desktop-brand-v2.webp"
    }
  },
  "ripamonti": {
    "desktop": "/assets/img/projetos/ripamonti/armazem-ripamonti-site-desktop-v1.webp",
    "mobile": "/assets/img/projetos/ripamonti/armazem-ripamonti-site-mobile-v1.webp",
    "width": 1440,
    "height": 1000,
    "mobileWidth": 390,
    "mobileHeight": 844,
    "brand": {
      "desktop": "/assets/img/projetos/ripamonti/armazem-ripamonti-case-cover-v1.webp",
      "mobile": "/assets/img/projetos/ripamonti/armazem-ripamonti-case-cover-v1.webp",
      "width": 1200,
      "height": 630,
      "mobileWidth": 1200,
      "mobileHeight": 630
    },
    "thumbnail": {
      "src": "/assets/img/projetos/showroom-v2/ripamonti-thumb.webp",
      "width": 192,
      "height": 101,
      "original": "/assets/img/projetos/ripamonti/armazem-ripamonti-case-cover-v1.webp"
    }
  },
  "navalha": {
    "brand": {
      "desktop": "/assets/img/projetos/navalha/navalha-prime-experience-card-desktop-brand-v2.webp",
      "mobile": "/assets/img/projetos/navalha/navalha-prime-experience-card-mobile-brand-v2.webp",
      "width": 1586,
      "height": 992,
      "mobileWidth": 1122,
      "mobileHeight": 1402
    },
    "thumbnail": {
      "src": "/assets/img/projetos/showroom-v2/navalha-thumb.webp",
      "width": 192,
      "height": 120,
      "original": "/assets/img/projetos/navalha/navalha-prime-experience-card-desktop-brand-v2.webp"
    }
  }
};

export function initShowroom(catalog){
const projects=catalog;
const stage=document.getElementById('projectStage');
if(!stage)return;
const initial=stage.dataset.selectedProject;
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
function syncTabs(){
  tabs.forEach(tab=>{const active=tab.dataset.project===selected;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
  const tab=tabs.find(item=>item.dataset.project===selected);
  stage.setAttribute('aria-labelledby',tab.id);
  const rail=tab.parentElement,box=tab.getBoundingClientRect(),bounds=rail.getBoundingClientRect();
  // Keep the active item visible immediately; manual touch scrolling retains native snap.
  if(box.left<bounds.left+4||box.right>bounds.right-4)rail.scrollTo({left:rail.scrollLeft+box.left-bounds.left-4,behavior:'instant'});
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
  if(!projects[key]||!media[key])return;
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
  stage.dataset.selectedProject=key;stage.removeAttribute('aria-busy');
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
compact.addEventListener('change',()=>{transferFocus();present(kind,'auto');syncTabs()});
// Thumbnail widths also change inside the mobile breakpoint, without matchMedia firing.
let resizeFrame;
addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(syncTabs)},{passive:true});
// Hydrate the responsive picture and controls without rebuilding the initial story.
stage.dataset.interactive='true';syncPresentation();syncTabs();

window.OTProjectShowroom={select};
}
if(typeof document!=="undefined")initShowroom(projects);
