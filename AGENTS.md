# AGENTS.md — Olegario Tech

These instructions apply to coding agents and AI-assisted changes in this repository.

## Mandatory reading

Before any visual, UX, component, responsive, motion or layout change:

1. read `DESIGN.md`;
2. read the relevant file in `docs/design-system/`;
3. inspect the existing implementation before changing it.

## Production safety

- `main` is the production branch.
- Do not merge to `main` without explicit approval.
- Do not publish or change GitHub Pages configuration unless explicitly requested.
- Design-system work should be developed on a dedicated branch/PR.
- Preserve `CNAME`, analytics, privacy/cookie behavior, SEO metadata and public routes unless the task explicitly targets them.

## Scope discipline

Do not turn a component task into a site redesign.

When asked to change one section or component:

- change only that scope;
- preserve approved commercial copy;
- preserve approved project links;
- preserve testimonials and factual claims;
- avoid unrelated cleanup unless necessary for correctness.

## Design authority

`DESIGN.md` is the visual source of truth.

New UI should reuse existing:

- colors/tokens;
- typography;
- spacing;
- radius;
- motion;
- components.

If a genuinely new pattern is needed, document it before or in the same change.

## Third-party references

Reference systems such as Adobe Spectrum, Framer, Linear, Apple or other entries in awesome-design-md may be studied for principles.

Do not:

- copy brand identity;
- import proprietary fonts;
- copy trademarked assets;
- reproduce a third-party page;
- paste external design tokens as OT tokens without adaptation.

## Accessibility

For interactive UI:

- prefer semantic native HTML;
- preserve keyboard operation;
- provide visible focus;
- support reduced motion;
- avoid hover-only essential interactions;
- keep touch targets usable on mobile;
- use ARIA only when necessary and correctly.

## Motion

Motion must improve hierarchy, feedback, comprehension or storytelling.

Avoid:

- excessive parallax;
- stacked glow effects;
- multiple competing looping animations;
- heavy mobile animation;
- animation that blocks reading or interaction.

## Performance

Keep the site lightweight.

Before adding a framework/library:

- verify that the existing HTML/CSS/JS stack cannot solve the problem cleanly;
- justify the dependency;
- avoid shipping a large runtime for a small component.

## Validation

For UI changes, verify at minimum:

- desktop layout;
- mobile layout;
- keyboard focus;
- no horizontal overflow;
- no clipped headings/client names;
- primary CTAs still work;
- reduced-motion behavior when motion is changed.

## Reporting

After a change, report:

- files changed;
- component/pattern affected;
- visual behavior changed;
- responsive behavior;
- accessibility impact;
- validation performed;
- anything intentionally left unchanged.
