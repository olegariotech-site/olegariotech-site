# OT Design System — Documentation

Status: **v1.0-alpha**

This directory supports the root `DESIGN.md`.

The first goal is not to redesign the Olegario Tech website. It is to formalize the visual rules already present, reduce inconsistency and make future work faster for both humans and coding agents.

## Documents

- `foundations.md` — tokens, typography, surfaces, spacing, radius and elevation.
- `components.md` — component contracts and states.
- `patterns.md` — larger commercial/UX compositions.

## Method

For each component or pattern:

1. audit the current OT implementation;
2. identify what is already working;
3. compare useful principles from external references;
4. define the OT rule;
5. implement only after the rule is agreed;
6. test desktop/mobile/accessibility;
7. update documentation when the implementation changes.

## Reference philosophy

External systems are research material, not templates.

Useful lessons currently under study:

- **Framer** — presence, dark canvas, atmospheric showcase and disciplined accent.
- **Linear** — surface hierarchy, restrained color and product-focused density.
- **Apple** — whitespace, reduction and letting the primary subject dominate.
- **Adobe Spectrum** — component anatomy, variants, states, accessibility and usage guidance.

OT should combine principles, not visual identities.
