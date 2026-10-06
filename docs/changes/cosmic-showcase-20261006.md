# Cosmic showcase — reference contract

Reference: visual approved by Alexandre and reaffirmed with `image(20261006-171426).png` on 2026-10-06.

## Composition

- Compact 64 px icon rail on desktop. Existing commercial route buttons remain native and retain their accessible names; labels are also visible on focus and hover. Official brand moves to the top bar, followed by Início, Soluções, Projetos and Método. Diagnosis and WhatsApp destinations remain available.
- Hero uses a compact three-line Inter display, cyan/violet emphasis, native cyan action, and the full approved supporting copy. Secondary route feedback stays available to assistive technology.
- Hero flows directly into projects, as in the reaffirmed reference. Solutions move after the case showcase, followed by the existing real-project proof strip. No section is removed; subsequent content remains intact.
- The photographic globe uses a NASA cloud-bearing Blue Marble map plus a thresholded NASA city-light layer, directional shading and a narrow cyan atmosphere. Orthographic projection preserves a circular globe and predictable framing. Desktop rotation and the existing sphere-to-particles-to-wave transition remain.
- A denser organic cyan/violet ribbon connects the hero to the case heading. Rendering pauses offscreen/when hidden; reduced motion and mobile remain static. No frontend dependencies are added.
- Cases use real approved client materials and full approved copy. Real/concept groups, ratings, reviews, links, deliverables and keyboard tabs remain. K.L is initially selected to match the reference.
- Sound retains the same MP3, loop, volume, click activation, synchronized control state, pause/resume logic and accessible controls on desktop/mobile.

## Responsive contract

Desktop uses the compact icon rail, wide editorial opening, luminous globe to the right and side-by-side case media/copy. The hero remains short enough to reveal the next section.

Mobile puts text/actions before the globe, uses stacked cases and keeps the 44 px sound button. Header and bottom navigation retain native controls.

Reduced motion and no-WebGL use an optimized transparent still rendered from the same NASA textures and lighting. The no-WebGL renderer keeps the particle transition; reduced motion does not animate.

## Fidelity ledger

| Reference evidence | Implementation evidence | Deliberate content accommodation |
| --- | --- | --- |
| Narrow icon rail and top section links | 64 px rail, official wordmark, native section anchors | Existing commercial routes, diagnosis and WhatsApp are retained |
| Strong three-line sentence-case display | Inter display with compact leading and cyan/violet business line | Every approved commercial word remains |
| Cloud-bearing luminous Earth | NASA cloud map, night lights, shading, narrow atmosphere | Real geography replaces the illustrative concept rendering |
| Cyan/violet particle sweep | Organic ribbon at the foot of the globe, joining the scroll renderer | Static atmospheric treatment on mobile/reduced motion |
| Projects immediately follow the opening | Hero → projects → solutions → proof strip | All original sections are retained |
| Large case media beside clear text | Framed client imagery with stable title and challenge/strategy rows | Original client materials, longer approved copy, reviews and deliverables determine panel height |
| Four real-project tabs | Real-project and concept groups remain distinct and keyboard accessible | Two approved concept projects remain available |
| Immersive experience | Native controls plus existing synchronized audio | User-required sound controls remain visible |

Validation and screenshots are recorded in PR #81. Temporary QA artifacts remain outside the repository.
