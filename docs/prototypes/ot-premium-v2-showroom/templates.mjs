// Pure markup shared by the static build and the isolated browser renderer.
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const order=['acai','kl','adega','advocacia','ripamonti','navalha'];
export function renderTab(key,p,initial,asset){
  const thumb=asset.thumbnail;
  return `<button type="button" class="case-tab" id="case-tab-${key}" role="tab" aria-controls="projectStage" aria-selected="${key===initial}" tabindex="${key===initial?0:-1}" data-project="${key}"><img src="${escapeHTML(thumb.src)}" alt="" width="${thumb.width}" height="${thumb.height}" loading="lazy" decoding="async"><span><strong>${escapeHTML(p.title)}</strong><small>${key==='navalha'?'Conceito / demonstração':escapeHTML(p.segment)}</small></span></button>`;
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
    <picture id="caseCapture">${view==='auto'?`<source media="(max-width: 600px)" srcset="${escapeHTML(mobile)}" width="${dimensions.mobileWidth}" height="${dimensions.mobileHeight}">`:''}<img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" width="${width}" height="${height}" decoding="async" fetchpriority="high"></picture>
  </div>`;
}
export function renderCase(key,p,asset){
  const concept=key==='navalha';
  const leadText=`Olá, OT! Vi o case ${p.title} no site e quero entender uma estrutura parecida para o meu negócio.`;
  const leadHref=`https://wa.me/5511912459144?text=${encodeURIComponent(leadText)}`;
  const testimonial=p.testimonial?`<figure class="case-testimonial"><div class="review-source"><span aria-label="Avaliação de cinco estrelas no Google">★★★★★</span><span>Avaliação no Google</span></div><blockquote>“${escapeHTML(p.testimonial.quote)}”</blockquote><figcaption><strong>${escapeHTML(p.testimonial.author)}</strong><a href="${escapeHTML(p.testimonial.source)}" target="_blank" rel="noopener noreferrer" aria-label="Ver avaliações da Olegario Tech no Google">Ver no Google ↗</a></figcaption></figure>`:'';
  return `<div class="case-copy">
    <span class="case-status"><i aria-hidden="true"></i>${concept?'CONCEITO / DEMONSTRAÇÃO OT':'PROJETO REAL · NO AR'}</span>
    <h3>${escapeHTML(p.title)}</h3>
    <p class="case-segment">${escapeHTML(p.segment)}</p>
    <span class="delivery-label meta">${concept?'Proposta do conceito':'Entrega OT'}</span>
    <p class="case-description">${escapeHTML(p.text)}</p>
    <div class="case-actions"><a class="button button-primary" data-project-link href="${escapeHTML(p.link)}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.cta)} <span aria-hidden="true">↗</span></a><a class="button button-secondary" data-generate-lead href="${escapeHTML(leadHref)}" target="_blank" rel="noopener noreferrer">Quero uma estrutura parecida <span aria-hidden="true">↗</span></a></div>
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
