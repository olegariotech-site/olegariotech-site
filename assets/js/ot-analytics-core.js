(function () {
  'use strict';

  const GA_ID = window.OT_GA_ID || 'G-0YXCH58MXD';
  const META_PIXEL_ID = window.OT_META_PIXEL_ID || '1822005305910193';
  const STORAGE_KEY = 'ot_consent_preferences_v2';
  const LEGACY_STORAGE_KEY = 'ot_analytics_consent_v1';
  const GA_SCRIPT_ID = 'ot-ga4-script';
  const META_SCRIPT_ID = 'ot-meta-pixel-script';
  const MAX_LABEL = 100;
  let googleConfigured = false;
  let metaConfigured = false;
  let metaPageViewSent = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  function consentState(value) {
    return value === 'granted' || value === 'denied' ? value : null;
  }

  function normalizePreferences(value) {
    if (!value || typeof value !== 'object') return null;
    const analytics = consentState(value.analytics);
    const marketing = consentState(value.marketing);
    return analytics && marketing ? { analytics: analytics, marketing: marketing } : null;
  }

  function readConsent() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (!current) return null;
      return normalizePreferences(JSON.parse(current));
    } catch (error) {
      return null;
    }
  }

  function readLegacyConsent() {
    try {
      return consentState(localStorage.getItem(LEGACY_STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function saveConsent(preferences) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      // The choice still applies to the current page when storage is unavailable.
    }
  }

  function hasConsent(type) {
    const choice = readConsent();
    return Boolean(choice && choice[type] === 'granted');
  }

  function updateGoogleConsent(analyticsValue) {
    window.gtag('consent', 'update', {
      analytics_storage: analyticsValue,
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function clearCookies(cookieNames) {
    const hostParts = location.hostname.split('.');
    const domains = [location.hostname];
    if (hostParts.length > 2) domains.push('.' + hostParts.slice(-2).join('.'));

    cookieNames.forEach(function (name) {
      domains.forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + domain + '; SameSite=Lax';
      });
      document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
    });
  }

  function clearAnalyticsCookies() {
    const cookieNames = document.cookie
      .split(';')
      .map(function (part) { return part.trim().split('=')[0]; })
      .filter(function (name) { return name === '_ga' || name.indexOf('_ga_') === 0; });

    clearCookies(cookieNames);
  }

  function clearMetaCookies() {
    clearCookies(['_fbp', '_fbc']);
    metaPageViewSent = false;
  }

  function loadGoogleTag() {
    if (!hasConsent('analytics')) return;

    updateGoogleConsent('granted');

    if (!document.getElementById(GA_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = GA_SCRIPT_ID;
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
      document.head.appendChild(script);
    }

    if (!googleConfigured) {
      googleConfigured = true;
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        send_page_view: true,
        debug_mode: new URLSearchParams(location.search).get('debug_analytics') === '1'
      });
    }
  }

  function ensureMetaQueue() {
    if (window.fbq) return;

    const fbq = function () {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, arguments);
      } else {
        fbq.queue.push(arguments);
      }
    };

    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
  }

  function loadMetaPixel() {
    if (!META_PIXEL_ID || !hasConsent('marketing')) return;

    ensureMetaQueue();

    if (!document.getElementById(META_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = META_SCRIPT_ID;
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }

    if (!metaConfigured) {
      window.fbq('init', META_PIXEL_ID);
      metaConfigured = true;
    }

    if (!metaPageViewSent) {
      window.fbq('track', 'PageView');
      metaPageViewSent = true;
    }
  }

  function safeText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_LABEL);
  }

  function sectionName(element) {
    const section = element.closest('section[id], header, footer, main[id], .diagnostic-card');
    if (!section) return 'pagina';
    if (section.id) return section.id;
    if (section.tagName === 'HEADER') return 'header';
    if (section.tagName === 'FOOTER') return 'footer';
    if (section.classList.contains('diagnostic-card')) return 'diagnostico';
    return section.tagName.toLowerCase();
  }

  function track(eventName, params) {
    if (!hasConsent('analytics') || !googleConfigured) return;
    const payload = Object.assign({
      page_path: location.pathname,
      page_title: document.title
    }, params || {});
    window.gtag('event', eventName, payload);
  }

  function metaTrack(eventName, params) {
    if (!hasConsent('marketing')) return;
    loadMetaPixel();
    if (!metaConfigured || typeof window.fbq !== 'function') return;
    window.fbq('track', eventName, params || {});
  }

  window.OTAnalytics = {
    track: track,
    trackMeta: metaTrack,
    getConsent: readConsent,
    openPreferences: openBanner
  };

  function linkParams(link) {
    return {
      cta_text: safeText(link.getAttribute('aria-label') || link.textContent),
      cta_location: sectionName(link),
      destination_url: (link.href || '').slice(0, 500)
    };
  }

  function classifyClick(link) {
    const href = link.getAttribute('href') || '';
    const absoluteHref = link.href || href;
    const params = linkParams(link);

    if (/wa\.me\/5511912459144/i.test(absoluteHref)) {
      track('click_whatsapp', params);
      metaTrack('Contact', {
        content_name: params.cta_text,
        content_category: 'whatsapp',
        content_location: params.cta_location
      });

      const diagnosticLead = link.id === 'waLink' || link.classList.contains('wa-big');
      const commercialLead = link.hasAttribute('data-generate-lead');
      if (diagnosticLead || commercialLead) {
        track('generate_lead', Object.assign({}, params, {
          lead_source: diagnosticLead ? 'diagnostico_digital' : 'site_olegario_tech',
          method: 'whatsapp'
        }));
        metaTrack('Lead', {
          content_name: diagnosticLead ? 'Diagnóstico digital' : params.cta_text,
          content_category: 'whatsapp',
          content_location: params.cta_location
        });
      }
      return;
    }

    if (href.indexOf('/diagnostico-digital/') !== -1) {
      track('click_diagnostico', params);
      metaTrack('ViewContent', {
        content_name: 'Diagnóstico digital',
        content_category: 'lead_generation'
      });
      return;
    }

    if (href === '#portfolio' || href === '#projetos' || link.closest('#portfolio')) {
      track('click_portfolio', params);
      return;
    }

    const plan = link.closest('.plan');
    if (plan) {
      track('click_plano', Object.assign({}, params, {
        plan_name: safeText(plan.querySelector('.pname')?.textContent),
        plan_tier: safeText(plan.querySelector('.ptier')?.textContent)
      }));
      return;
    }

    const project = link.closest('.showcase-card, .project-stage');
    if (project) {
      const projectName = safeText(
        project.querySelector('.project-copy h3')?.textContent ||
        project.querySelector('.sc-result strong')?.textContent ||
        project.querySelector('.sc-tag')?.textContent
      );
      track('click_projeto', Object.assign({}, params, {
        project_name: projectName
      }));
      metaTrack('ViewContent', {
        content_name: projectName || 'Projeto Olegario Tech',
        content_category: 'portfolio'
      });
      return;
    }

    const product = link.closest('.prod, .product');
    if (product) {
      const productName = safeText(product.querySelector('h3')?.textContent);
      track('click_produto', Object.assign({}, params, {
        product_name: productName
      }));
      metaTrack('InitiateCheckout', {
        content_name: productName || 'Produto digital Olegario Tech',
        content_category: 'produto_digital',
        currency: 'BRL'
      });
    }
  }

  function installClickTracking() {
    document.addEventListener('click', function (event) {
      const link = event.target.closest('a[href]');
      if (link) {
        classifyClick(link);
        if (link.dataset.socialNetwork) {
          track('click_rede_social', {
            social_network: safeText(link.dataset.socialNetwork),
            cta_text: safeText(link.textContent),
            cta_location: sectionName(link),
            destination_url: (link.href || '').slice(0, 500)
          });
        }
        if (link.hasAttribute('data-google-review')) {
          track('click_google_review', {
            cta_text: safeText(link.textContent),
            cta_location: sectionName(link),
            destination_url: (link.href || '').slice(0, 500)
          });
        }
      }

      const solution = event.target.closest('[data-solution]');
      if (solution) {
        track('click_solucao', {
          solution_name: safeText(solution.dataset.solution || solution.textContent),
          cta_location: sectionName(solution)
        });
      }

      const projectTab = event.target.closest('[data-project]');
      if (projectTab) {
        track('select_project', {
          project_name: safeText(projectTab.textContent),
          cta_location: sectionName(projectTab)
        });
      }

      const audioToggle = event.target.closest('.audio-toggle');
      if (audioToggle) {
        setTimeout(function () {
          track('audio_toggle', {
            audio_state: audioToggle.getAttribute('aria-pressed') === 'true' ? 'on' : 'off',
            cta_location: sectionName(audioToggle)
          });
        }, 0);
      }

      const start = event.target.closest('[data-start-link]');
      if (start) {
        track('diagnostico_inicio', { cta_location: sectionName(start) });
      }

      const option = event.target.closest('.opt[data-value]');
      if (option) {
        const group = option.closest('.opts');
        const step = option.closest('.step');
        track('diagnostico_resposta', {
          question_name: safeText(group?.dataset.name),
          answer_category: safeText(option.dataset.value),
          step_number: Number(step?.dataset.step || 0) + 1
        });
      }

      const finish = event.target.closest('[data-finish]');
      if (finish) {
        track('diagnostico_concluido', {
          completed_steps: 4,
          cta_location: 'diagnostico'
        });
      }

      const restart = event.target.closest('[data-restart]');
      if (restart) {
        track('diagnostico_reiniciado', { cta_location: 'resultado_diagnostico' });
      }
    }, true);
  }

  function bannerTemplate() {
    return [
      '<section class="ot-consent" id="otConsent" role="dialog" aria-labelledby="otConsentTitle" aria-describedby="otConsentText">',
      '  <div class="ot-consent__copy">',
      '    <span class="ot-consent__eyebrow">Privacidade e preferências</span>',
      '    <h2 id="otConsentTitle">Você escolhe como a OT mede e anuncia.</h2>',
      '    <p id="otConsentText">Análise e marketing são opcionais. O Google Analytics e o Pixel da Meta só carregam nas categorias autorizadas.</p>',
      '    <div class="ot-consent__preferences" aria-label="Categorias de cookies">',
      '      <label class="ot-consent__option is-required">',
      '        <span><strong>Necessários</strong><small>Funcionamento e sua escolha de privacidade.</small></span>',
      '        <input type="checkbox" checked disabled aria-label="Cookies necessários sempre ativos">',
      '      </label>',
      '      <label class="ot-consent__option">',
      '        <span><strong>Análise</strong><small>Google Analytics para visitas e cliques gerais.</small></span>',
      '        <input type="checkbox" data-consent-analytics aria-label="Autorizar cookies de análise">',
      '      </label>',
      '      <label class="ot-consent__option">',
      '        <span><strong>Marketing</strong><small>Meta Pixel para anúncios, contatos e leads.</small></span>',
      '        <input type="checkbox" data-consent-marketing aria-label="Autorizar cookies de marketing">',
      '      </label>',
      '    </div>',
      '    <a href="/privacidade/">Ler a política de privacidade</a>',
      '  </div>',
      '  <div class="ot-consent__actions">',
      '    <button type="button" class="ot-consent__reject" data-consent-reject>Recusar opcionais</button>',
      '    <button type="button" class="ot-consent__save" data-consent-save>Salvar escolhas</button>',
      '    <button type="button" class="ot-consent__accept" data-consent-accept>Aceitar tudo</button>',
      '  </div>',
      '</section>'
    ].join('');
  }

  function ensureSettingsButton() {
    let button = document.getElementById('otConsentSettings');
    if (!button) {
      button = document.createElement('button');
      button.id = 'otConsentSettings';
      button.type = 'button';
      button.className = 'ot-consent-settings';
      button.textContent = 'Privacidade e cookies';
      button.setAttribute('aria-label', 'Reabrir preferências de privacidade e cookies');
      button.addEventListener('click', openBanner);
      document.body.appendChild(button);
    }
    button.hidden = false;
  }

  function closeBanner() {
    const banner = document.getElementById('otConsent');
    if (banner) {
      banner.classList.remove('is-visible');
      banner.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('ot-consent-open');
    ensureSettingsButton();
  }

  function applyConsent(preferences) {
    const normalized = normalizePreferences(preferences) || {
      analytics: 'denied',
      marketing: 'denied'
    };

    saveConsent(normalized);

    if (normalized.analytics === 'granted') {
      loadGoogleTag();
    } else {
      updateGoogleConsent('denied');
      clearAnalyticsCookies();
    }

    if (normalized.marketing === 'granted') {
      loadMetaPixel();
    } else {
      clearMetaCookies();
    }

    closeBanner();
  }

  function syncBannerChoices(banner) {
    const current = readConsent();
    const legacyAnalytics = readLegacyConsent();
    const analytics = banner.querySelector('[data-consent-analytics]');
    const marketing = banner.querySelector('[data-consent-marketing]');
    if (analytics) analytics.checked = current ? current.analytics === 'granted' : legacyAnalytics === 'granted';
    if (marketing) marketing.checked = current ? current.marketing === 'granted' : false;
  }

  function openBanner() {
    let banner = document.getElementById('otConsent');
    if (!banner) {
      document.body.insertAdjacentHTML('beforeend', bannerTemplate());
      banner = document.getElementById('otConsent');

      banner.querySelector('[data-consent-accept]')?.addEventListener('click', function () {
        applyConsent({ analytics: 'granted', marketing: 'granted' });
      });

      banner.querySelector('[data-consent-reject]')?.addEventListener('click', function () {
        applyConsent({ analytics: 'denied', marketing: 'denied' });
      });

      banner.querySelector('[data-consent-save]')?.addEventListener('click', function () {
        const analytics = banner.querySelector('[data-consent-analytics]')?.checked;
        const marketing = banner.querySelector('[data-consent-marketing]')?.checked;
        applyConsent({
          analytics: analytics ? 'granted' : 'denied',
          marketing: marketing ? 'granted' : 'denied'
        });
      });
    }

    syncBannerChoices(banner);
    const settings = document.getElementById('otConsentSettings');
    if (settings) settings.hidden = true;
    banner.removeAttribute('aria-hidden');
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
      banner.querySelector('[data-consent-save]')?.focus();
    });
    document.body.classList.add('ot-consent-open');
  }

  function installEcosystemSection() {
    if (document.body.dataset.page !== 'home' || document.getElementById('ecossistema')) return;

    const contact = document.getElementById('contato');
    if (!contact) return;

    if (!document.getElementById('ot-ecosystem-style')) {
      const style = document.createElement('style');
      style.id = 'ot-ecosystem-style';
      style.textContent = [
        '.ot-ecosystem{padding-top:44px;padding-bottom:44px}',
        '.ot-ecosystem__shell{position:relative;display:grid;grid-template-columns:minmax(300px,.78fr) minmax(0,1.22fr);gap:30px;padding:38px;border:1px solid rgba(103,232,249,.18);border-radius:var(--radius);background:radial-gradient(circle at 12% 8%,rgba(37,99,235,.18),transparent 38%),radial-gradient(circle at 92% 90%,rgba(168,85,247,.13),transparent 36%),rgba(8,7,22,.84);box-shadow:var(--shadow);overflow:hidden}',
        '.ot-ecosystem__shell::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:38px 38px;mask-image:linear-gradient(90deg,transparent,#000 45%,#000)}',
        '.ot-ecosystem__copy,.ot-ecosystem__grid{position:relative;z-index:1}',
        '.ot-ecosystem__title{margin:10px 0 15px;font-family:"Space Grotesk",sans-serif;font-size:clamp(2.15rem,3.5vw,3.65rem);line-height:.98;letter-spacing:-.045em}',
        '.ot-ecosystem__copy p{margin:0;color:var(--muted);font-size:.98rem;line-height:1.75}',
        '.ot-ecosystem__status{display:inline-flex;align-items:center;gap:8px;margin-top:20px;padding:8px 11px;border:1px solid rgba(37,211,102,.2);border-radius:999px;background:rgba(37,211,102,.065);color:#86efac;font-family:"Share Tech Mono",monospace;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase}',
        '.ot-ecosystem__status::before{content:"";width:7px;height:7px;border-radius:50%;background:#25d366;box-shadow:0 0 14px rgba(37,211,102,.78)}',
        '.ot-ecosystem__cta{width:max-content;margin-top:22px}',
        '.ot-ecosystem__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
        '.ot-ecosystem__card{position:relative;min-width:0;padding:18px;border:1px solid rgba(255,255,255,.09);border-radius:17px;background:rgba(255,255,255,.035);transition:transform .24s ease,border-color .24s ease,background .24s ease}',
        '.ot-ecosystem__card:hover{transform:translateY(-3px);border-color:rgba(103,232,249,.25);background:rgba(103,232,249,.055)}',
        '.ot-ecosystem__card small{display:block;margin-bottom:12px;color:var(--ice);font-family:"Share Tech Mono",monospace;font-size:.62rem;letter-spacing:.11em;text-transform:uppercase}',
        '.ot-ecosystem__card strong{display:block;color:var(--text);font-family:"Space Grotesk",sans-serif;font-size:.9rem;line-height:1.25}',
        '.ot-ecosystem__card p{margin:7px 0 0;color:var(--muted-2);font-size:.73rem;line-height:1.5}',
        '@media(max-width:1100px){.ot-ecosystem__shell{grid-template-columns:1fr}.ot-ecosystem__copy{max-width:760px}.ot-ecosystem__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}',
        '@media(max-width:760px){.ot-ecosystem{padding-top:24px;padding-bottom:24px}.ot-ecosystem__shell{padding:24px 18px}.ot-ecosystem__grid{grid-template-columns:1fr}.ot-ecosystem__cta{width:100%}.ot-ecosystem__card{padding:16px}}',
        '@media(prefers-reduced-motion:reduce){.ot-ecosystem__card{transition:none}.ot-ecosystem__card:hover{transform:none}}'
      ].join('');
      document.head.appendChild(style);
    }

    const section = document.createElement('section');
    section.className = 'section ot-ecosystem';
    section.id = 'ecossistema';
    section.setAttribute('aria-labelledby', 'ecossistemaTitle');
    section.innerHTML = [
      '<div class="inner ot-ecosystem__shell">',
      '  <div class="ot-ecosystem__copy">',
      '    <span class="section-label">Estrutura em operação</span>',
      '    <h2 class="ot-ecosystem__title" id="ecossistemaTitle">O que você vê na OT também pode trabalhar pelo <span class="gradient-text">seu negócio.</span></h2>',
      '    <p>Este site é uma demonstração prática: presença profissional, atendimento, dados e canais conectados para transformar visita em oportunidade comercial.</p>',
      '    <span class="ot-ecosystem__status">Ecossistema OT ativo</span>',
      '    <a data-generate-lead class="btn btn-ghost ot-ecosystem__cta" href="https://wa.me/5511912459144?text=Ol%C3%A1%2C%20OT!%20Vi%20o%20ecossistema%20digital%20do%20site%20e%20quero%20entender%20o%20que%20pode%20ser%20feito%20para%20o%20meu%20neg%C3%B3cio." target="_blank" rel="noopener noreferrer">Quero uma estrutura assim</a>',
      '  </div>',
      '  <div class="ot-ecosystem__grid" aria-label="Recursos digitais em operação na Olegario Tech">',
      '    <article class="ot-ecosystem__card"><small>01 · presença</small><strong>Site responsivo e comercial</strong><p>Experiência premium no computador e no celular, com oferta e chamadas para ação claras.</p></article>',
      '    <article class="ot-ecosystem__card"><small>02 · atendimento</small><strong>WhatsApp integrado</strong><p>Botões contextuais, mensagens prontas e medição das conversas iniciadas pelo site.</p></article>',
      '    <article class="ot-ecosystem__card"><small>03 · dados</small><strong>Google Analytics 4</strong><p>Visitas, cliques, diagnóstico, produtos e geração de leads acompanhados com consentimento.</p></article>',
      '    <article class="ot-ecosystem__card"><small>04 · busca</small><strong>SEO e Search Console</strong><p>Estrutura técnica para indexação, presença regional e evolução orgânica no Google.</p></article>',
      '    <article class="ot-ecosystem__card"><small>05 · campanhas</small><strong>Meta Pixel</strong><p>Eventos de contato e intenção comercial preparados para campanhas de Facebook e Instagram.</p></article>',
      '    <article class="ot-ecosystem__card"><small>06 · confiança</small><strong>Redes e avaliações</strong><p>Instagram, Facebook e avaliações do Google conectados à presença oficial da marca.</p></article>',
      '  </div>',
      '</div>'
    ].join('');

    contact.parentNode.insertBefore(section, contact);
  }

  function installSocialFooter() {
    if (document.body.dataset.page !== 'home') return;

    const footerBrand = document.querySelector('.footer-brand');
    if (!footerBrand || footerBrand.querySelector('.footer-social')) return;

    if (!document.getElementById('ot-social-footer-style')) {
      const style = document.createElement('style');
      style.id = 'ot-social-footer-style';
      style.textContent = [
        '.footer-social{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}',
        '.footer-social__link{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 12px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(255,255,255,.035);color:var(--muted);font-size:.7rem;font-weight:800;letter-spacing:.01em;transition:transform .22s ease,border-color .22s ease,color .22s ease,background .22s ease}',
        '.footer-social__link svg{width:17px;height:17px;flex:0 0 17px}',
        '.footer-social__link:hover,.footer-social__link:focus-visible{transform:translateY(-2px);color:var(--text);border-color:rgba(103,232,249,.34);background:rgba(103,232,249,.065)}',
        '.footer-social__link--instagram svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
        '.footer-social__link--facebook svg,.footer-social__link--google svg{fill:currentColor}',
        '.footer-social__link--google{border-color:rgba(245,158,11,.22);color:#f7d774}',
        '.footer-social__link--google:hover,.footer-social__link--google:focus-visible{border-color:rgba(245,158,11,.48);background:rgba(245,158,11,.08);color:#fde68a}',
        '@media(max-width:900px){.footer-social{justify-content:center}.footer-social__link{min-height:42px;padding-inline:14px}}',
        '@media(prefers-reduced-motion:reduce){.footer-social__link{transition:none}.footer-social__link:hover,.footer-social__link:focus-visible{transform:none}}'
      ].join('');
      document.head.appendChild(style);
    }

    const social = document.createElement('nav');
    social.className = 'footer-social';
    social.setAttribute('aria-label', 'Canais e avaliações da Olegario Tech');
    social.innerHTML = [
      '<a class="footer-social__link footer-social__link--instagram" data-social-network="instagram" href="https://www.instagram.com/olegariotech/" target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram da Olegario Tech">',
      '  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
      '  <span>Instagram</span>',
      '</a>',
      '<a class="footer-social__link footer-social__link--facebook" data-social-network="facebook" href="https://www.facebook.com/profile.php?id=61583326394905" target="_blank" rel="noopener noreferrer" aria-label="Abrir Facebook da Olegario Tech">',
      '  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5H17V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5V13h2.8v8h3.4Z"/></svg>',
      '  <span>Facebook</span>',
      '</a>',
      '<a class="footer-social__link footer-social__link--google" data-google-review href="https://g.page/r/CXo5WLSa7H2oEBM/review" target="_blank" rel="noopener noreferrer" aria-label="Avaliar a Olegario Tech no Google">',
      '  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.7 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 16.72l-5.5 2.9 1.05-6.12L3.1 9.17l6.15-.9L12 2.7Z"/></svg>',
      '  <span>Avalie no Google</span>',
      '</a>'
    ].join('');
    footerBrand.appendChild(social);

    const schema = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).find(function (node) {
      return node.textContent.indexOf('LocalBusiness') !== -1;
    });
    if (schema) {
      try {
        const data = JSON.parse(schema.textContent);
        data.sameAs = [
          'https://www.instagram.com/olegariotech/',
          'https://www.facebook.com/profile.php?id=61583326394905'
        ];
        schema.textContent = JSON.stringify(data);
      } catch (error) {
        // Structured data remains unchanged if it cannot be parsed safely.
      }
    }
  }

  function init() {
    installEcosystemSection();
    installSocialFooter();
    installClickTracking();
    const choice = readConsent();

    if (!choice) {
      openBanner();
      return;
    }

    if (choice.analytics === 'granted') {
      loadGoogleTag();
    } else {
      updateGoogleConsent('denied');
      clearAnalyticsCookies();
    }

    if (choice.marketing === 'granted') {
      loadMetaPixel();
    } else {
      clearMetaCookies();
    }

    ensureSettingsButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();