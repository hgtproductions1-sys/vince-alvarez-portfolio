# Portfolio review — 22 October 2026

Reviewed as a prospective small-business client browsing the live portfolio on a phone and desktop. Walked the hero, live-project filter, Fitness Vault story and return to the portfolio; inspected typography, section positions, metadata and contact implementation. The later 3D request was implemented and checked across all four affected pages. This is a focused design review, not an exhaustive accessibility or performance audit. Email delivery was not tested.

| Priority | Before | After | Why |
| --- | --- | --- | --- |
| Fixed | Standalone rotating V above the portrait; concepts had no WebGL scenes. | Full hero background and separate themed concept backgrounds, with pause controls. | Matches the user's requested visual direction while preserving readable content. |
| Medium | At 390px, service and About body copy is 13px; video description is 13px. | Raise mobile prose to 16px, with about 1.6–1.8 line height; retain compact captions. | Main service information should read comfortably on a phone (`type-readable-body-size`). |
| Medium | Work starts about 1741px down the original 390px page, after the full video introduction. Hero button correctly jumps to it. | Place selected work before the full video section, and link to the introduction from the hero. | Clients can inspect proof earlier while the requested video remains available (`hier-one-focal-point`). The portrait reduction in the motion refresh also trims hero space. |
| Medium | Project stories explain the idea and design, but lack a concise role/deliverables block. | Add a short verified role, scope, tools and key design decisions block to both live project stories. Use only confirmed facts; no invented results. | Helps clients understand what Vince contributed and what they can hire him to do. |
| Medium | Contact builds a mailto draft; visitors need a configured email handler. The form clearly describes this. | Add a Copy project brief action alongside the draft button, allowing a visitor to paste the prepared inquiry into webmail. A server form could be a separate future change. | Preserves inquiry text and offers a useful fallback without adding a backend. |
| Medium | The live page has an Open Graph title/description but no sharing image, canonical URL or og:url. | Add a locally created 1200×630 sharing image, absolute production URLs, canonical tags and a sitemap for all six pages. | Shared portfolio links get an intentional preview and search engines have explicit preferred URLs. |
| Low | Copy email address button measured 32px high on mobile. | Give it a minimum 44px touch target. | Easier to tap accurately (`resp-touch-target-size`). |

## Top 3 remaining fixes

1. Increase mobile body copy to 16px.
2. Bring selected work ahead of the full introduction video.
3. Add verified role and deliverables details to the live-project stories.

Runtime evidence from the 3D refresh: `preview/motion-review.json` and the four `preview/*-3d-desktop.png` screenshots. The shared motion preference, pause controls, WebGL availability fallback and ticker behavior pass `scripts/check-motion.mjs`. Desktop/mobile layout checks found no horizontal overflow in the affected pages. No performance score is claimed.

## Implemented — 23 October 2026

Completed the five recommendations from the dual-review critique: clearer role/scope and three design decisions on both live projects; readable phone metadata/body copy; selected work before the full introduction; immediately accessible synchronized hero motion controls; shorter fine-pointer hover effects and smoothed 3D pointer response. Added larger secondary targets, copy-project-brief with a selectable fallback, and complete canonical/social metadata, local sharing card, robots.txt and sitemap.

Browser evidence: preview/polish-2026-10-23/. Home checked at 320, 390, 768 and 1440px; case studies/concepts checked at 320 and 768px. No document overflow, missing eager images or captured console warnings/errors in those checks. Home service body computes 16px, project labels 12–13px; phone390 pause control begins 625px down (previous 928px), selected work begins 1165px (previous 1684px). Both motion controls synchronize. Copy-brief returned the selected service and entered test details with visible confirmation; no email was opened or sent. OS reduced-motion emulation and physical-device performance were not measured. Existing motion tests cover reduced-motion defaults, explicit play, unavailable WebGL, ticker looping and hidden/offscreen suspension.

Manual detector after refinements: 13 flags (previous 50). Retained narrow exceptions: cream/grid are the approved visual direction; 8px/10px labels are embedded project artwork, repeated in larger metadata outside it; wrapper-padding warnings ignore padded inner content; three unlocated white-on-paper contrast flags and the Faceless tracking measurement were not supported by the inspected live styles. No broad ignore configuration was added.

## Paper opening and image correction — 23 October 2026

Follow-up to user feedback: the original sphere-to-sheet morph looked too geometric and rushed. Replaced it with irregular connected folds, a readable 500ms stamp hold and a curled lift coordinated with the hero. Fixed timing avoids startup-driven speed changes. Simplified lighting reduces shader preparation; final live completion was 2,963ms including startup, with one ambient canvas afterward. Earlier cold checks skipped safely rather than speeding up. Four-size paper frames, responsive results, live images and keyboard/fallback evidence are in `preview/paper-refinement/`. The final 53-file ZIP matches the validated production inventory. Older release details below describe the superseded opening.

Added the approved procedural paper-ball unfold, cobalt stamp and lift-away reveal. Conditional early import and a slow-frame allowance complete the checked live sequence in 2,821ms, then dispose the paper renderer before ambient scene startup. First/repeat session behavior, keyboard dismissal, reduced motion, saved pause, Back/anchor navigation, denied storage, timeout and WebGL failure have behavior checks. Browser layout and sampled paper frames were checked at 320/390/768/1440px. The script-free page remains readable. Evidence is in `preview/paper-opening/`.

Corrected an earlier deployment omission: `images/vince.png` is used by the lazy About portrait and must not be excluded. It is visibly loaded on production and included in the 53-file ZIP. All 19 referenced image endpoints passed HTTP/content-type checks. The publication check now rejects empty inventories, requires all six routes, verifies file sizes and digests, and checks asset references against the actual upload list. An empty-list deployment attempt was automatically rejected before publication; the validated 53-file release succeeded. No current release is blocked.

