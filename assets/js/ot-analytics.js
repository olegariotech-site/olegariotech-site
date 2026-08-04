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
      if (link) classifyClick(link);

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

  function init() {
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