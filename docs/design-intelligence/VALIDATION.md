# OT Design Intelligence — Selection Acceptance Tests

**Version:** V1 seed library  
**Date:** 2026-10-19  
**Scope:** validate pattern selection logic, not final visual implementation.

## Test 1 — Armazém Ripamonti

Business:
local neighborhood market / retail.

Primary job:
help nearby customers recognize the store, understand what it offers and act through WhatsApp/maps/offers.

Expected selection:

- P01 Commercial Hero
- P06 Photo-First Catalog
- P11 Local Discovery
- P07 WhatsApp Conversion
- P03 Proof Before Promise

Reference lenses:

- Shopify — catalog/category hierarchy
- Airbnb — photo-led local discovery
- Stripe — CTA clarity

Rejected:

- dominant cinematic atmosphere;
- SaaS-like dense product UI;
- generic abstract 3D hero.

**Result: PASS**

The library favors real products, local context and action instead of forcing OT's own cosmic identity onto the client.

---

## Test 2 — Cíntia Almeida Gomes Advocacia

Business:
professional legal service.

Primary job:
create authority, clarity, trust and a safe path to contact.

Expected selection:

- P10 Editorial Trust Page
- P01 Commercial Hero
- P03 Proof Before Promise
- P08 Process / Method
- P05 Progressive Disclosure / FAQ

Reference lenses:

- Linear — quiet precision and hierarchy
- Stripe — explain complex service clearly
- Resend — premium editorial restraint

Rejected:

- aggressive product catalog;
- decorative motion-heavy layout;
- loud gradient cards as default.

**Result: PASS**

The library selects reading comfort and authority rather than retail or entertainment patterns.

---

## Test 3 — K.L Transporte Express

Business:
transport/logistics/service operation.

Primary job:
make service categories, coverage, trust and contact route immediately clear.

Expected selection:

- P01 Commercial Hero
- P04 Service Family Grid
- P09 Feature / Benefit Split
- P03 Proof Before Promise
- P08 Process / Method
- P11 Local Discovery

Reference lenses:

- Stripe — service explanation
- Linear — technical clarity
- Webflow — show capability while explaining

Rejected:

- product-commerce catalog;
- lifestyle discovery interface;
- decorative editorial treatment without operational proof.

**Result: PASS**

The library translates operational capability into scannable services and proof.

---

## Test 4 — Olegario Tech

Business:
digital services / sites / positioning.

Primary job:
demonstrate quality while explaining commercial value and showing real work.

Expected selection:

- P01 Commercial Hero
- P02 Cinematic Showcase
- P03 Proof Before Promise
- P09 Feature / Benefit Split
- P08 Process / Method
- P15 Browser / Device Proof
- P14 Atmospheric Background
- P13 Contextual CTA

Reference lenses:

- Framer — atmosphere/showcase
- Linear — precision/states
- Stripe — commercial explanation
- Webflow — demonstrate actual work
- Apple — subject/spacing
- Resend — dark editorial restraint

Guardrail:

OT atmosphere is allowed here because it is part of OT's own identity. It must not automatically migrate to client projects.

**Result: PASS**

---

## Test 5 — All In Club Valinhos

Business:
food / burger / local ordering.

Primary job:
make food visually desirable, support browsing and drive ordering.

Expected selection:

- P01 Commercial Hero
- P06 Photo-First Catalog
- P02 Cinematic Showcase, used selectively
- P07 WhatsApp/order conversion
- P11 Local Discovery
- P03 Proof when real evidence exists

Reference lenses:

- Airbnb — image-led browsing
- Shopify — catalog hierarchy
- Apple — product/image spacing
- Framer only for controlled cinematic transitions

Rejected:

- technical SaaS surface language;
- text-heavy editorial layout;
- atmosphere that competes with food imagery.

**Result: PASS**

---

## Acceptance decision

**5/5 selection tests: PASS**

What this proves:

- pattern choice changes with the client's commercial job;
- OT visual identity is not imposed on every client;
- reference brands are used as functional lenses, not templates;
- atmosphere is subordinate to clarity and proof;
- commerce, professional service, logistics and portfolio use materially different compositions.

What this does **not** prove yet:

- final visual quality;
- browser rendering;
- accessibility implementation;
- performance;
- conversion impact.

Those must be validated in actual project implementations.
