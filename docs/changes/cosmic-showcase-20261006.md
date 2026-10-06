# Cosmic showcase — approved implementation scope

Reference: concept approved by Alexandre on 2026-10-06. Source image in the conversation: `exec-9d4772a1-8d83-4f82-a7c5-c7540b7ade36.png`.

## Design decisions

- Keep the current navigation and section order. The reference is a composition guide, not permission to replace the commercial rail or remove the solutions journey.
- Keep every approved headline, project description, challenge, strategy, deliverable, testimonial and destination. Hero casing follows the concept; literal text does not change.
- Use the existing Space Grotesk/Inter/Share Tech Mono families and dark/cyan/violet tokens. Primary buttons in the hero and cases use cyan; the rest of the site keeps its established controls.
- Enlarge the existing rotating NASA sphere and refine atmosphere, orbit geometry and scroll position. The real NASA texture is deliberately retained rather than substituting the illustrative concept globe.
- Add an 81 KB generated stardust background and a restrained procedural ribbon. The existing sphere-to-wave renderer remains the scroll narrative. No extra frontend dependencies.
- Case panels put full images beside stable copy, with challenge/strategy rows and existing deliverables across the lower panel. Approved reviews remain visible. Existing tabs retain click and keyboard operation, with labelled tabpanel semantics.
- Reuse the approved Açaí cover locally to remove its external image dependency. No visual edits to the source cover.
- Keep the MP3, loop, volume rules, click-to-enable, pause/resume and synchronized states. Restore the mobile sound control and retain desktop access within projects.

## Responsive and motion contract

Desktop: large editorial typography, framed cases, subtle pointer depth and one sphere-to-wave scroll timeline. Short desktop viewports scale the hero title to preserve CTA visibility.

Mobile: text and CTA first, globe in a dedicated block, vertically stacked case panels, 44 px sound control, static atmospheric motion. No hover-only content.

Reduced motion: static globe fallback, no perspective effects, stationary decorative ribbon. Hidden/offscreen pages stop continuous atmospheric rendering.

## Fidelity ledger

| Reference point | Implementation | Intentional adaptation |
| --- | --- | --- |
| Dark canvas and cyan/violet emphasis | Scope-specific palette, cyan primary actions, violet proof heading | Existing global navigation colors preserved |
| Three-line commercial headline | Same three lines and approved wording, sentence case, fluid display scale | Scales with viewport height on short screens |
| Planet at the right with luminous edge | Existing NASA sphere enlarged, atmospheric rim and orbits | Existing real texture retained instead of the illustrative concept's clouds/lights |
| Particle continuity | Initial ribbon joins the existing morph to the perspective wave | Solutions remain between hero and projects |
| Large case image beside text | Framed media, stable title, challenge/strategy rows, visible actions | Real client assets and approved longer copy replace illustrative content |
| Labels and proof | Existing real/concept groups and reviews preserved | Deliverables remain as a lower row instead of being omitted |
| Controls | Native links/buttons and labelled tabpanel | Existing sound controls and navigation stay in the experience |

Validation evidence is recorded in the pull request. Screenshots and temporary QA outputs are kept outside the repository.
