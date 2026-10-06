# Components

This document defines the first OT component contracts. Exact CSS implementation may evolve while the behavioral contract remains stable.

## Button

### Variants
- primary;
- secondary/ghost;
- WhatsApp/contextual;
- icon-only when justified.

### Required states
- default;
- hover;
- focus-visible;
- active;
- disabled when applicable.

### Rules
- one clear primary action per decision area;
- avoid multiple equally loud CTAs;
- minimum practical touch height around 44–48px;
- primary action must remain legible without glow.

## Card

### Variants
- standard;
- interactive;
- proof/case;
- testimonial;
- media;
- elevated.

### Anatomy
- optional label;
- title;
- description;
- media;
- metadata/proof;
- optional action.

### Rules
- hover cannot hide the title;
- media crop must not damage logos/names;
- border, glow, scale and 3D tilt are not all required at once.

## Project Card

### States/types
- real project;
- concept/demo;
- featured.

### Must communicate
- project/client;
- category or context;
- proof/status;
- what action is available.

### Interaction
Subtle depth/movement is allowed. Readability wins over spectacle.

## Accordion

### Variants
- regular;
- quiet.

### Options
- single expansion;
- multiple expansion when the content benefits from comparison;
- compact/regular/spacious density only if a real use case exists.

### Anatomy
- trigger/title;
- optional trailing action;
- panel/content.

### Accessibility
Prefer native `<details>/<summary>` where it meets the UX requirement. If a custom accordion is needed, implement correct button/ARIA/keyboard behavior.

### Use for
- FAQ;
- secondary detail;
- policies/process details.

### Do not use for
- primary offer;
- decisive proof;
- essential pricing;
- main CTA.

## Badge

Use for short metadata only:

- REAL PROJECT;
- CONCEPT;
- FEATURED;
- status;
- category.

Do not turn paragraphs into badges.

## Tabs

Use when content groups are peers and switching context is useful.

Do not use tabs when all content should be read sequentially.

Keyboard interaction must remain usable.

## Section

### Anatomy
- optional eyebrow/label;
- title;
- lead;
- content;
- optional CTA.

A section should have one dominant communication goal.

## Hero

### Required
- clear commercial headline;
- supporting explanation;
- primary action;
- optional secondary action;
- proof when available.

Atmospheric visual elements must not reduce headline/CTA clarity.

## Form controls

Use native input semantics.

Required:
- visible label;
- clear focus;
- error text associated with the field;
- sufficient contrast;
- no placeholder-only labels.

## Navigation

Current desktop rail/top structure is part of the existing OT identity and should not be replaced casually.

Navigation changes require explicit scope because they affect the whole site.

## Floating WhatsApp

It is a contextual conversion utility, not a decorative element.

Must:
- avoid covering content;
- remain reachable on mobile;
- have an accessible name;
- preserve source tracking/message logic when present.
