---
version: "1.0-alpha"
name: "Olegario Tech Design System"
status: "documentation-first"
owner: "Olegario Tech"
---

# Olegario Tech Design System

This file is the visual source of truth for the Olegario Tech website.

Before creating, redesigning, or materially changing any interface, read this file and the supporting documents in `docs/design-system/`.

The current website remains the baseline. This design system formalizes what already works, removes inconsistency, and defines how new UI should be added. It is not permission to redesign approved areas.

## 1. Design philosophy

Olegario Tech should feel:

- premium;
- precise;
- technological;
- immersive;
- commercial;
- restrained;
- fast and intentional.

The interface may be atmospheric, but it must never become decorative noise.

Every visual effect must improve at least one of:

1. hierarchy;
2. comprehension;
3. interaction;
4. proof;
5. conversion.

If an effect does none of these, remove it.

## 2. External references

The system may study public design analyses such as Framer, Linear, Apple and Adobe Spectrum for principles including:

- dark-canvas hierarchy;
- disciplined surfaces;
- controlled accent color;
- whitespace;
- component anatomy;
- states;
- progressive disclosure;
- accessibility;
- responsive behavior.

Do not copy third-party brand identity, proprietary fonts, assets, layouts, or distinctive visual signatures.

Reference material is inspiration. Olegario Tech remains its own system.

## 3. Existing OT visual language

### Core colors

Current production values are the starting point:

```css
--ot-void: #050008;
--ot-deep: #090616;
--ot-text: #f3f4ff;
--ot-muted: #aeb5ca;
--ot-muted-2: #7e879e;

--ot-ice: #67e8f9;
--ot-cyan: #22d3ee;
--ot-violet: #8b5cf6;
--ot-purple: #a855f7;

--ot-success: #25d366;
--ot-warning: #f59e0b;

--ot-line: rgba(138, 92, 246, .22);
--ot-line-soft: rgba(255, 255, 255, .09);
```

### Accent discipline

Cyan/ice and violet/purple are the OT interactive/accent family.

Use them to indicate:

- primary actions;
- active states;
- focus;
- key proof;
- intentional atmospheric emphasis.

Do not apply gradients or glow to every component.

A page should always contain quiet surfaces that allow the emphasized elements to matter.

## 4. Typography

Current OT type families are canonical unless a redesign explicitly changes them.

### Display
`Space Grotesk`

Use for:

- hero headlines;
- section titles;
- card titles;
- strong commercial statements.

### Body
`Inter`

Use for:

- paragraphs;
- forms;
- descriptions;
- utility text;
- buttons unless a component specifies otherwise.

### Technical / system voice
`Share Tech Mono`

Use sparingly for:

- section labels;
- metadata;
- indexes;
- status text;
- technical microcopy.

Do not use the mono face for long-form reading.

### Type behavior

- Headlines: tight line-height and negative tracking are allowed.
- Body: prioritize legibility over visual density.
- Avoid using weight alone to create hierarchy.
- Prefer hierarchy through size, spacing, contrast and placement.

## 5. Surface hierarchy

Use a small, predictable surface ladder.

### Canvas
The darkest background. Default page environment.

### Surface 1
Subtle translucent lift for cards and utility blocks.

### Surface 2
Stronger panel used for important grouped content.

### Elevated
Reserved for elements that actually need separation from the page.

### Interactive
A surface whose hover/focus/active behavior is visibly different.

Avoid stacking multiple glass effects, borders, gradients and shadows on the same component unless the visual purpose is clear.

## 6. Spacing

Use a deliberate scale instead of one-off values:

```text
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 72 / 96
```

Recommended roles:

- 4–8: micro spacing;
- 12–20: component internal spacing;
- 24–40: cards and local groups;
- 56–72: large content blocks;
- 96: major section rhythm on desktop.

Responsive layouts may reduce these values, but should preserve proportional rhythm.

## 7. Radius

Preferred OT radius family:

```text
10px  — utility/focus
14px  — controls
18px  — standard interactive card
22px  — media/product card
26px  — major panel
999px — pill/capsule only
```

Do not invent a new radius for every component.

## 8. Motion

Motion must communicate structure.

### Micro
160–220ms

Use for:

- hover;
- focus;
- button feedback;
- icon transitions.

### Component
220–360ms

Use for:

- accordion;
- card reveal;
- tabs;
- modal/panel state changes.

### Editorial
500–800ms

Use for:

- section entrance;
- deliberate story transitions.

### Atmospheric
Slow and continuous only when it does not compete with reading.

Examples:

- planet/orbit;
- subtle particles;
- background pulse.

### Rules

- No motion without purpose.
- Avoid simultaneous competing animations.
- Hover motion should normally stay within 2–4px of translation.
- Respect `prefers-reduced-motion`.
- Mobile may simplify or disable atmospheric motion.

## 9. Core components

The first official OT component set is:

- Button;
- Card;
- Project Card;
- Section;
- Hero;
- Accordion;
- Badge;
- Tabs;
- Testimonial;
- Form controls;
- CTA;
- Navigation;
- Floating WhatsApp action.

Each component must document:

- anatomy;
- variants;
- size/density when applicable;
- states;
- responsive behavior;
- accessibility;
- when to use;
- when not to use.

See `docs/design-system/components.md`.

## 10. Component states

Interactive components must define, when applicable:

- default;
- hover;
- focus-visible;
- active/down;
- disabled;
- selected/expanded.

Keyboard focus must be visible.

Do not use hover as the only way to reveal essential information.

## 11. Responsive principles

Desktop and mobile are not separate visual identities.

Preserve:

- content priority;
- hierarchy;
- CTA prominence;
- proof;
- reading order.

On smaller screens:

- reduce density before shrinking text too far;
- stack rather than squeeze;
- remove non-essential atmospheric effects;
- preserve touch targets;
- avoid horizontal overflow;
- ensure interactive targets are at least approximately 44px high, preferably 48px where practical.

## 12. Accessibility

Minimum expectations:

- semantic HTML;
- keyboard support;
- visible `:focus-visible`;
- sufficient contrast;
- descriptive labels;
- correct ARIA only when native HTML is insufficient;
- motion reduction;
- no essential information encoded by color alone.

Prefer native interactive elements before custom ARIA widgets.

## 13. Progressive disclosure

Use Accordion when content is secondary, related and benefits from being hidden until requested.

Good uses:

- FAQ;
- secondary service details;
- process detail;
- policy or technical explanation.

Do not hide inside an accordion:

- core value proposition;
- primary CTA;
- essential pricing;
- decisive proof;
- information required to understand the offer.

## 14. Project cards

Project cards are a critical OT proof component.

They must distinguish clearly between:

- real client project;
- concept/demonstration;
- featured case.

The client name must never be visually cropped by decorative layers.

On hover:

- movement must be subtle;
- title remains readable;
- proof/status remains legible;
- visual treatment must not obscure the project.

## 15. Hero

The OT hero may be immersive, but commercial clarity comes first.

Within the first viewport the visitor should understand:

- who OT is;
- what OT does;
- why it matters;
- what to do next.

Atmosphere supports the message. It never becomes the message.

## 16. Do

- Reuse existing tokens and components.
- Prefer one strong visual idea per section.
- Use whitespace/dark space as part of the composition.
- Make interactions predictable.
- Preserve brand continuity across public pages.
- Test desktop and mobile before approval.

## 17. Don't

- Do not add effects just because they are technically possible.
- Do not mix multiple borrowed design languages.
- Do not introduce one-off colors, radii or motion values without a reason.
- Do not redesign approved commercial content during a component refactor.
- Do not use inaccessible custom controls when native HTML solves the problem.
- Do not copy proprietary fonts/assets from reference brands.

## 18. Source-of-truth order

When instructions conflict, use this order:

1. explicit task requirements;
2. approved commercial content and brand decisions;
3. `DESIGN.md`;
4. `docs/design-system/`;
5. existing implementation;
6. external inspiration.

If a proposed change conflicts with this hierarchy, stop and report the conflict before implementing it.
