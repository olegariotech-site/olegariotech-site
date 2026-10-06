# Foundations

## Status

Alpha. These foundations document the current OT visual language and define a normalization target. They do not yet imply a CSS refactor.

## Color roles

### Canvas
- `#050008` — primary void/background.
- `#090616` — deep secondary environment.

### Text
- `#f3f4ff` — primary text.
- `#aeb5ca` — secondary text.
- `#7e879e` — tertiary/meta text.

### Accent family
- `#67e8f9` — ice/cyan emphasis.
- `#22d3ee` — cyan support.
- `#8b5cf6` — violet.
- `#a855f7` — purple.

### Semantic
- `#25d366` — positive/WhatsApp context.
- `#f59e0b` — warning/attention.

## Typography roles

### Space Grotesk
Display and commercial hierarchy.

### Inter
Default reading/UI family.

### Share Tech Mono
Technical metadata and small labels only.

## Spacing target

Use this scale for new work:

| Token | Value | Typical use |
|---|---:|---|
| xs-1 | 4px | micro |
| xs-2 | 8px | icon/text |
| sm-1 | 12px | compact controls |
| sm-2 | 16px | standard internal |
| md-1 | 20px | card internal |
| md-2 | 24px | standard card |
| lg-1 | 32px | groups |
| lg-2 | 40px | large groups |
| xl-1 | 56px | block spacing |
| xl-2 | 72px | section transition |
| section | 96px | desktop major section |

Use `clamp()` where fluid spacing improves responsive rhythm.

## Radius target

| Token | Value | Use |
|---|---:|---|
| utility | 10px | focus/compact utility |
| control | 14px | buttons and controls |
| card | 18px | standard cards |
| media | 22px | rich cards/media |
| panel | 26px | large panels |
| pill | 999px | pills only |

## Elevation

OT should rely more on surface contrast and restrained borders than on large shadows.

Recommended hierarchy:

- Level 0 — canvas, no shadow.
- Level 1 — translucent surface + soft hairline.
- Level 2 — stronger surface + intentional border.
- Level 3 — elevated/floating object, shadow permitted.
- Selected/focus — use accent ring rather than simply increasing shadow.

## Gradients

Gradients are part of OT but are a scarce resource.

Good:
- hero accent text;
- one dominant CTA;
- active navigation indicator;
- atmospheric background;
- deliberate feature emphasis.

Avoid:
- gradient on every heading;
- every card glowing;
- multiple unrelated gradients in one viewport.

## Grid and container

Current main content target is approximately `1240px`.

New components should align to the existing page container instead of introducing arbitrary independent widths.

## Responsive baseline

Breakpoints should be driven by content rather than device names.

Expected modes:

- wide desktop;
- compact desktop/tablet;
- mobile.

A component may reduce complexity on mobile rather than merely shrink.
