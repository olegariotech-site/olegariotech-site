(function () {
  'use strict';

  const GA_ID = window.OT_GA_ID || 'G-0YXCH58MXD';
  const STORAGE_KEY = 'ot_analytics_consent_v1';
  const SCRIPT_ID = 'ot-ga4-script';
  const MAX_LABEL = 100;
  let configured = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  function consentState(value) {
    return value === 'granted' || value === 'denied' ? value : null;
  }

  function readConsent() {
    try {
      return consentState(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function saveConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      // The choice still applies to the current page even when storage is unavailable.
    }
  }

  function updateGoogleConsent(analyticsValue) {
    window.gtag('consent', 'update', {
      analytics_storage: analyticsValue,
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function clearAnalyticsCookies() {
    const cookieNames = document.cookie
      .split(';')
      .map(function (part) { return part.trim().split('=')[0]; })
      .filter(function (name) { return name === '_ga' || name.indexOf('_ga_') === 0; });

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

  function loadGoogleTag() {
    updateGoogleConsent('granted');

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
      document.head.appendChild(script);
    }

    if (!configured) {
      configured = true;
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        send_page_view: true,
        debug_mode: new URLSearchParams(location.search).get('debug_analytics') === '1'
      });
      window.gtag('event', 'consent_granted', {
        consent_type: 'analytics',
        page_path: location.pathname
      });
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
    if (readConsent() !== 'granted' || !configured) return;
    const payload = Object.assign({
      page_path: location.pathname,
      page_title: document.title
    }, params || {});
    window.gtag('event', eventName, payload);
  }

  window.OTAnalytics = {
    track: track,
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
      if (link.id === 'waLink' || link.classList.contains('wa-big')) {
        track('generate_lead', Object.assign({}, params, {
          lead_source: 'diagnostico_digital',
          method: 'whatsapp'
        }));
      }
      return;
    }

    if (href.indexOf('/diagnostico-digital/') !== -1) {
      track('click_diagnostico', params);
      return;
    }

    if (href === '#portfolio' || link.closest('#portfolio')) {
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

    const project = link.closest('.showcase-card');
    if (project) {
      track('click_projeto', Object.assign({}, params, {
        project_name: safeText(project.querySelector('.sc-result strong')?.textContent || project.querySelector('.sc-tag')?.textContent)
      }));
      return;
    }

    const product = link.closest('.prod');
    if (product) {
      track('click_produto', Object.assign({}, params, {
        product_name: safeText(product.querySelector('h3')?.textContent)
      }));
    }
  }

  function installClickTracking() {
    document.addEventListener('click', function (event) {
      const link = event.target.closest('a[href]');
      if (link) classifyClick(link);

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
      '    <span class="ot-consent__eyebrow">Privacidade e métricas</span>',
      '    <h2 id="otConsentTitle">Você escolhe como a OT mede o site.</h2>',
      '    <p id="otConsentText">Usamos o Google Analytics somente com sua autorização para entender visitas e cliques. Cookies de publicidade permanecem desativados.</p>',
      '    <a href="/privacidade/">Ler a política de privacidade</a>',
      '  </div>',
      '  <div class="ot-consent__actions">',
      '    <button type="button" class="ot-consent__reject" data-consent-reject>Recusar análise</button>',
      '    <button type="button" class="ot-consent__accept" data-consent-accept>Aceitar análise</button>',
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

  function openBanner() {
    let banner = document.getElementById('otConsent');
    if (!banner) {
      document.body.insertAdjacentHTML('beforeend', bannerTemplate());
      banner = document.getElementById('otConsent');

      banner.querySelector('[data-consent-accept]')?.addEventListener('click', function () {
        saveConsent('granted');
        loadGoogleTag();
        closeBanner();
      });

      banner.querySelector('[data-consent-reject]')?.addEventListener('click', function () {
        saveConsent('denied');
        updateGoogleConsent('denied');
        clearAnalyticsCookies();
        closeBanner();
      });
    }

    const settings = document.getElementById('otConsentSettings');
    if (settings) settings.hidden = true;
    banner.removeAttribute('aria-hidden');
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
      banner.querySelector('[data-consent-accept]')?.focus();
    });
    document.body.classList.add('ot-consent-open');
  }

  function init() {
    installClickTracking();
    const choice = readConsent();

    if (choice === 'granted') {
      loadGoogleTag();
      ensureSettingsButton();
    } else if (choice === 'denied') {
      updateGoogleConsent('denied');
      ensureSettingsButton();
    } else {
      openBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
