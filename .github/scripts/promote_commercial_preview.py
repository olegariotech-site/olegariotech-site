from pathlib import Path
import re

PREVIEW = Path('preview/ot-commercial-navigation.html')
INDEX = Path('index.html')
ANALYTICS = Path('assets/js/ot-analytics.js')

html = PREVIEW.read_text(encoding='utf-8')

html, count = re.subn(
    r'<title>.*?</title>',
    '<title>Olegario Tech | Sites e páginas de venda que geram negócios</title>',
    html,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit('title replacement failed')

html, count = re.subn(
    r'<meta name="description" content="[^"]*">',
    '<meta name="description" content="Sites profissionais, landing pages e páginas de venda com design premium, WhatsApp integrado e visão comercial para negócios de Valinhos, Campinas e região.">',
    html,
    count=1,
)
if count != 1:
    raise SystemExit('description replacement failed')

html, count = re.subn(
    r'<meta name="robots" content="[^"]*">',
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    html,
    count=1,
)
if count != 1:
    raise SystemExit('robots replacement failed')

production_head = '''
  <link rel="canonical" href="https://olegariotech.com.br/">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/img/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/img/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:title" content="Olegario Tech | Sites e páginas de venda que geram negócios">
  <meta property="og:description" content="Design premium, WhatsApp integrado e visão comercial para transformar presença digital em novas conversas de negócio.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://olegariotech.com.br/">
  <meta property="og:image" content="https://olegariotech.com.br/assets/img/og-image-v3.jpg?v=8">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Olegario Tech — sites e páginas de venda com visão comercial">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Olegario Tech">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Olegario Tech | Sites e páginas de venda que geram negócios">
  <meta name="twitter:description" content="Design premium, WhatsApp integrado e visão comercial para transformar presença digital em novas conversas de negócio.">
  <meta name="twitter:image" content="https://olegariotech.com.br/assets/img/og-image-v3.jpg?v=8">
  <meta name="twitter:image:alt" content="Olegario Tech — sites e páginas de venda com visão comercial">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","@id":"https://olegariotech.com.br/#business","name":"Olegario Tech","url":"https://olegariotech.com.br/","image":"https://olegariotech.com.br/assets/img/og-image-v3.jpg?v=8","telephone":"+5511912459144","address":{"@type":"PostalAddress","addressLocality":"Valinhos","addressRegion":"SP","addressCountry":"BR"},"areaServed":["Valinhos","Campinas","Vinhedo","Região Metropolitana de Campinas"],"description":"Sites profissionais, landing pages, páginas de venda, WhatsApp comercial e presença digital com visão comercial para negócios locais.","sameAs":["https://www.instagram.com/alexandre.olegario.oficial/","https://www.facebook.com/alexandre.olegario.oficial/"]}</script>
  <link rel="stylesheet" href="/assets/css/ot-consent.css?v=1">
  <script>
    window.OT_GA_ID='G-0YXCH58MXD';
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){dataLayer.push(arguments)};
    gtag('consent','default',{
      analytics_storage:'denied',
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied',
      wait_for_update:500
    });
  </script>
  <script src="/assets/js/ot-analytics.js?v=2" defer></script>'''

favicon_marker = '  <link rel="icon" href="/favicon.ico" sizes="any">'
if favicon_marker not in html:
    raise SystemExit('favicon marker not found')
html = html.replace(favicon_marker, favicon_marker + production_head, 1)

html = html.replace('<body>', '<body data-page="home">', 1)
html = re.sub(
    r'<a(?=\s)(?![^>]*\bdata-generate-lead\b)([^>]*href="https://wa\.me/5511912459144[^"]*"[^>]*)>',
    r'<a data-generate-lead\1>',
    html,
)

if '<meta name="robots" content="noindex,nofollow">' in html:
    raise SystemExit('production index still contains noindex')
if html.count('rel="canonical"') != 1:
    raise SystemExit('canonical count invalid')
if html.count('G-0YXCH58MXD') != 1:
    raise SystemExit('GA identifier count invalid')
if '/assets/js/ot-analytics.js?v=2' not in html:
    raise SystemExit('analytics script missing')

INDEX.write_text(html, encoding='utf-8')

js = ANALYTICS.read_text(encoding='utf-8')

old_lead = '''      if (link.id === 'waLink' || link.classList.contains('wa-big')) {
        track('generate_lead', Object.assign({}, params, {
          lead_source: 'diagnostico_digital',
          method: 'whatsapp'
        }));
      }'''
new_lead = '''      const diagnosticLead = link.id === 'waLink' || link.classList.contains('wa-big');
      const commercialLead = link.hasAttribute('data-generate-lead');
      if (diagnosticLead || commercialLead) {
        track('generate_lead', Object.assign({}, params, {
          lead_source: diagnosticLead ? 'diagnostico_digital' : 'site_olegario_tech',
          method: 'whatsapp'
        }));
      }'''
if old_lead not in js:
    raise SystemExit('lead tracking marker not found')
js = js.replace(old_lead, new_lead, 1)

js = js.replace(
    "if (href === '#portfolio' || link.closest('#portfolio')) {",
    "if (href === '#portfolio' || href === '#projetos' || link.closest('#portfolio, #projetos')) {",
    1,
)
js = js.replace("const project = link.closest('.showcase-card');", "const project = link.closest('.showcase-card, .project-stage');", 1)
js = js.replace(
    "project_name: safeText(project.querySelector('.sc-result strong')?.textContent || project.querySelector('.sc-tag')?.textContent)",
    "project_name: safeText(project.querySelector('.project-copy h3')?.textContent || project.querySelector('.sc-result strong')?.textContent || project.querySelector('.sc-tag')?.textContent)",
    1,
)
js = js.replace("const product = link.closest('.prod');", "const product = link.closest('.prod, .product');", 1)

tracking_marker = '''      const start = event.target.closest('[data-start-link]');'''
tracking_insert = '''      const solution = event.target.closest('[data-solution]');
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

'''
if tracking_marker not in js:
    raise SystemExit('click tracking marker not found')
js = js.replace(tracking_marker, tracking_insert + tracking_marker, 1)

required_tokens = [
    "'.prod, .product'",
    "'.showcase-card, .project-stage'",
    "click_solucao",
    "select_project",
    "audio_toggle",
    "site_olegario_tech",
]
for token in required_tokens:
    if token not in js:
        raise SystemExit(f'analytics token missing: {token}')

ANALYTICS.write_text(js, encoding='utf-8')
