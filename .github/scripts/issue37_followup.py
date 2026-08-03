from pathlib import Path

path = Path('preview/ot-commercial-navigation.html')
text = path.read_text(encoding='utf-8')

bad = '</a></header></div></header>'
if bad not in text:
    raise SystemExit('mobile header pattern not found')
text = text.replace(bad, '</a></div></header>', 1)

old_label = '<div class="rail-contact"><small>Fale com a OT</small><div class="rail-meta">'
new_label = '<div class="rail-contact"><small>Atendimento regional</small><div class="rail-meta">'
if old_label not in text:
    raise SystemExit('rail label pattern not found')
text = text.replace(old_label, new_label, 1)

old_css = '.rail-wa{display:flex;align-items:center;justify-content:center;gap:9px;min-height:46px;border-radius:14px;border:1px solid rgba(37,211,102,.25);background:rgba(37,211,102,.08);font-size:.78rem;font-weight:800}'
if old_css not in text:
    raise SystemExit('rail-wa CSS pattern not found')
text = text.replace(old_css, '', 1)
text = text.replace('.rail-contact small{margin-bottom:7px}.rail-wa{min-height:40px;font-size:.7rem}.rail-meta{gap:3px', '.rail-contact small{margin-bottom:7px}.rail-meta{gap:3px', 1)
text = text.replace('.rail-contact small{margin-bottom:5px;font-size:.58rem}.rail-wa{min-height:38px;font-size:.68rem}.rail-meta{gap:2px', '.rail-contact small{margin-bottom:5px;font-size:.58rem}.rail-meta{gap:2px', 1)

if bad in text or text.count('<header class="mobile-header">') != 1:
    raise SystemExit('mobile header validation failed')
if '<div class="mobile-actions">' not in text or 'class="rail-wa"' in text:
    raise SystemExit('final cleanup validation failed')

path.write_text(text, encoding='utf-8')
