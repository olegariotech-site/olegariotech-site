# OT Design Intelligence

Status: **v0.1 — operational library**

This layer turns external design research into reusable decisions for Olegario Tech projects.

It does **not** replace `DESIGN.md`.

- `DESIGN.md` = OT visual constitution and constraints.
- `docs/design-system/` = OT component/system contracts.
- `docs/design-intelligence/` = decision library for choosing useful patterns by problem, client and context.

## Goal

When a new client project begins, the agent should not start with:

> "What layout looks nice?"

It should start with:

> "What does this business need the visitor to understand, trust and do?"

Then it should select the smallest useful set of patterns from this library.

## Operating workflow

1. Define the commercial job of the page/section.
2. Identify audience, content type and proof available.
3. Use `selection-matrix.md` to shortlist pattern families.
4. Consult `pattern-library.md` for implementation guidance.
5. Check `source-catalog.md` for provenance and what each reference teaches.
6. Adapt to the client's identity and content.
7. Apply OT accessibility, performance and responsiveness rules.
8. Validate desktop/mobile and the real conversion path.
9. Record a new reusable pattern only when it proved useful.

## Non-negotiable rule

Never combine references by visual imitation.

Combine **principles by function**.

Example:

- Framer may inform atmosphere/showcase.
- Linear may inform hierarchy/states.
- Apple may inform whitespace/product focus.
- Stripe may inform commercial explanation.
- Shopify may inform product/catalog flow.

The final interface must still look like the client — or like OT when the project is OT.

## Files

- `source-catalog.md` — curated reference systems and what to learn from each.
- `pattern-library.md` — reusable patterns organized by design problem.
- `selection-matrix.md` — problem/client → recommended pattern families.
- `recipes.md` — proven combinations for common OT project types.
- `SOURCES.md` — provenance, source commit and license notes.

## Current scope

The seed library focuses on the type of work OT actually sells:

- service-business websites;
- local commerce;
- menus/catalogs;
- professional services;
- transportation/logistics;
- food/retail;
- portfolio/showcase;
- landing pages;
- lead generation;
- WhatsApp-first conversion.

This library should grow from real project use, not from collecting references for its own sake.
