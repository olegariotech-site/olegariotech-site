# Patterns

Patterns combine components into repeatable commercial experiences.

## Hero commercial

Goal: explain the business and produce the first meaningful action.

Order:

1. identity/context;
2. strong value proposition;
3. supporting copy;
4. primary CTA;
5. secondary CTA if needed;
6. proof;
7. visual atmosphere.

Never let step 7 overpower steps 1–6.

## Proof / project showcase

Goal: replace generic claims with evidence.

Each case should answer:

- who;
- what was done;
- what kind of project it is;
- why it matters;
- where to see it.

Real projects and concepts must be visually distinguishable.

## Services

Prefer scannable service families before long explanations.

Use progressive disclosure for detail, not for the service names themselves.

## Process / method

Show the minimum number of steps necessary to make the engagement feel predictable.

A process visualization should reduce anxiety and uncertainty, not exist only as decoration.

## Social proof

Testimonials require:

- identifiable context where approved;
- readable quote;
- restrained visual treatment;
- no animation that makes the quote harder to read.

## FAQ

FAQ is the default Accordion use case.

Questions should reflect real objections, not SEO filler.

## CTA final

The final CTA should resolve the page's commercial promise.

Prefer one primary next step.

For OT, current language may center on diagnosis/contact, but copy changes require explicit commercial approval.

## Immersive section

An immersive section is allowed when it provides:

- storytelling;
- a meaningful demonstration;
- transition between major ideas;
- stronger product/project comprehension.

It should not simply add particles, parallax and glow to an otherwise ordinary block.

## Mobile reduction pattern

On mobile, simplify in this order:

1. decorative motion;
2. layered depth;
3. secondary metadata;
4. non-essential side-by-side layout.

Do not simplify away:

- offer clarity;
- proof;
- primary CTA;
- readable hierarchy.

## Safe Header Zone

The approved thin header stays fixed, with an 88–94% dark surface and 14px blur to separate moving content. Measure its rendered height, including the safe area, instead of relying on a historical token. Root `scroll-padding-top` reserves that height; section `scroll-margin-top` adds only 16px. Programmatic scrolling uses the same measured boundary and 16px breathing room. Do not add the full header offset twice.

## DOM-order Scrollspy

Read the current section elements in document order, including dynamically inserted areas. Compare viewport rectangles with a probe 32px below the visible header. Update both `.is-active` and `aria-current` on scroll, resize, font readiness and content resizing. CSS decorates the active class; it must never permanently decorate a particular destination. A menu without a destination for the current section has no falsely active item.

## Mobile Vertical Rhythm

Reduce empty space between large areas, keeping internal title, paragraph, media and CTA spacing. Projects → Solutions changes from 126px to 78px; delivery → Method from 140px to 88px. Preserve the approved mobile Earth block and its position after the CTA. Already compact sections such as the ecosystem and product teaser retain their spacing.

## Fixed Navigation Clearance

Fixed mobile navigation has a 66px content area plus the bottom safe inset. Reserve that height in root scroll padding and a further 24px below the footer's last content. Focusable elements reserve both fixed boundaries. Do not stack separate body and footer reservations into a large empty tail.

## Consistent Carousel Peek

Each mobile scrollport uses a 12px gap, 4px edge padding and a card width of `100% - 44px`: one full card plus a 32px glimpse of the next. Use proximity snap and contained horizontal overscroll. Project categories remain above separate rails; they never disappear with the swiped tabs. Keep hidden accessible labels positioned relative to their own tabs: an absolute label anchored outside its scrollport can enlarge a mobile layout viewport even when visually clipped.

## Safe-area Mobile

Use shared top and bottom inset tokens derived from `env(safe-area-inset-*)`. The expanded header is 72px plus top inset; the compact header is 60px plus inset, retaining 44px controls. Page padding keeps the expanded height to prevent a layout jump. Compact at scroll >96px, expand at <24px, and remove transitions under reduced motion. QA may override the inset tokens to exercise clearance; this does not emulate an actual notch or browser chrome.

## Cross-device QA

Verify 1920×1080, 1440×900; notebooks 1366×768/720/612; tablet 1024×768; mobile 360×780, 390×844, 412 and 430px; and WebKit at 375/390/430px. Exercise scroll in both directions, anchors, menu clicks, content resizing, keyboard, every case, review text, audio opt-in/mute/resume, visibility handling, safe areas, rotation and reduced motion. Compare document scroll width with the CSS viewport's `clientWidth`, not just `innerWidth`: mobile engines can expand the layout viewport around overflow.

Record engine simulation separately from physical hardware. WebKit on Linux is useful engine coverage, but cannot certify iPhone hardware, Safari UI chrome or actual speaker output.

## Reference Fidelity

Cross-device refinements preserve the accepted cosmic composition, Earth assets and geometry, commercial copy, proof, project categories and destinations. Keep the Method in one canonical four-card DOM representation at every breakpoint, with optional decorative SVG beside or above it. Do not maintain another renderer solely to hide it later. Any visual deviation must solve a demonstrated reading or interaction problem and be recorded with evidence.
