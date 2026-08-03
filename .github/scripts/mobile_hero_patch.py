from pathlib import Path

index_path = Path('index.html')
index = index_path.read_text(encoding='utf-8')

old_hero_start = ".hero{min-height:auto;padding-top:34px;padding-bottom:52px}.hero-grid{display:block}.hero-copy{text-align:left}"
new_hero_start = ".hero{position:relative;isolation:isolate;min-height:auto;padding-top:34px;padding-bottom:58px}.hero-grid{position:relative;z-index:1;display:block}.hero-copy{text-align:left}"
if old_hero_start not in index:
    raise SystemExit('mobile hero start pattern not found')
index = index.replace(old_hero_start, new_hero_start, 1)

old_visual = ".hero-visual{min-height:330px;margin-top:-10px;pointer-events:none}.planet-wrap{width:520px;right:-210px;top:46%;transform:translateY(-50%)}.orbit-status{display:none}.hero-dots{justify-content:center}"
new_visual = ".hero-visual{position:absolute;z-index:0;inset:0;min-height:0;margin:0;display:block;pointer-events:none;overflow:hidden;opacity:.34}.hero-visual::after{content:\"\";position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,rgba(5,0,8,.98) 0%,rgba(5,0,8,.92) 34%,rgba(5,0,8,.58) 62%,rgba(5,0,8,.18) 100%)}.planet-wrap{z-index:1;width:min(500px,128vw);right:-56%;top:58%;transform:translateY(-50%);filter:drop-shadow(0 0 38px rgba(103,232,249,.12))}.orbit-status{display:none}.hero-dots{justify-content:flex-start}"
if old_visual not in index:
    raise SystemExit('mobile hero visual pattern not found')
index = index.replace(old_visual, new_visual, 1)

old_small = "@media(max-width:420px){.hero h1{font-size:clamp(2.85rem,15.3vw,4rem)}.section-title{font-size:2.2rem}.solution-content h3{font-size:1.82rem}.choice-tab{flex-basis:128px}}"
new_small = "@media(max-width:420px){.hero h1{font-size:clamp(2.85rem,15.3vw,4rem)}.hero-visual{opacity:.3}.planet-wrap{width:min(470px,132vw);right:-62%;top:60%}.section-title{font-size:2.2rem}.solution-content h3{font-size:1.82rem}.choice-tab{flex-basis:128px}}"
if old_small not in index:
    raise SystemExit('small mobile media pattern not found')
index = index.replace(old_small, new_small, 1)

index_path.write_text(index, encoding='utf-8')

consent_path = Path('assets/css/ot-consent.css')
consent = consent_path.read_text(encoding='utf-8')
old_banner = "  .ot-consent{grid-template-columns:1fr;gap:16px;padding:19px;bottom:12px}"
new_banner = "  .ot-consent{grid-template-columns:1fr;gap:16px;padding:19px;bottom:calc(82px + env(safe-area-inset-bottom))}"
if old_banner not in consent:
    raise SystemExit('mobile consent banner pattern not found')
consent = consent.replace(old_banner, new_banner, 1)

old_settings = "  .ot-consent-settings{left:10px;bottom:10px;max-width:44vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
new_settings = "  .ot-consent-settings{left:10px;bottom:calc(78px + env(safe-area-inset-bottom));max-width:min(52vw,230px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
if old_settings not in consent:
    raise SystemExit('mobile consent settings pattern not found')
consent = consent.replace(old_settings, new_settings, 1)
consent_path.write_text(consent, encoding='utf-8')
