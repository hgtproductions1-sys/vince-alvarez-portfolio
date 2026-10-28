# Vince Alvarez portfolio

Approved direction: custom portfolio for freelance website clients, brutalism, cobalt/black/off-white, moving 3D background, portrait, two live personal projects and six clickable concepts. References: Design by Ency (service hierarchy, scale, portrait) and MK Vision Studio (motion and project emphasis). Original layout and copy.

## Visual system

- Cobalt #2448FF; charcoal #171717; warm paper #F2EFE7. Common Ground: parchment #F1E8D8, espresso #34271F, olive #59634A, restrained copper.
- Concept palette refinement: FORME uses concrete #DDE1DE, charcoal #202622, orange #E65B2E, and soft concrete #CDD3CF. Slow Tide uses ocean #123B42, cool white #F2F7F5, sea glass #C8DDD5, and deeper ocean #0B2B31. Small text on FORME orange retains #20201B for 4.60:1 contrast. Common Ground retains its existing palette.
- Anton: large condensed poster headings. Manrope: readable text and controls. Concept pages may use their own type systems.
- Asymmetric hero: headline on left, smaller monochrome print cutout on right with offset cobalt silhouette and simple name caption. Portrait is approximately 300px on desktop and 220px on phones. Full-width cobalt orbital forms and architectural outlines move behind the hero content. The standalone V above the portrait was removed at the user's request.
- Page flow: hero, moving black capabilities strip, selected work, 33-second introduction video, services, speed/process, about, FAQ, contact. The hero links to both work and the introduction; synchronized motion controls sit beside the hero action and in its footer.
- Wide project frames and strong rules, sharp buttons and offset shadows. No repeated generic dashboard cards. Navigation and text remain stationary and readable.
- Motion: slow Three.js rotation, pointer response on fine pointers, small project hover transforms, short intro. Native scrolling. Pause control; reduced motion disables continuous animation. Static CSS fallback on WebGL failure. Hidden tab and offscreen rendering stop.

UI UX Pro Max matched Brutalism and portfolio storytelling. Its generated pink palette and serif body were rejected in favor of the user's explicit cobalt palette and clear sans-serif body. The hotel search's Apple-specific liquid glass result was rejected as unsuitable; the concept instead uses an original editorial hospitality direction. These are deliberate design choices, not unverified database claims.

## Content and concepts

Public identity: Vince Elijah Alvarez, based in Naga City, Philippines. Contact: caalnr13@gmail.com and the LinkedIn URL from the resumes. Website building, WordPress care, and content support. Resume-supported figures only: 200+ WordPress sites maintained and 50+ sites set up, identified as experience at Clientverge. No invented client testimonials, business outcomes, turnaround guarantee, or availability claims.

Hero: “Bold websites. Fast turnaround.” Specific delivery timing is scoped per project.

Real projects: https://fitnessvault.online/ and https://www.thefacelessprompts.com/. Summaries explain visible site features; no claim that backend features were independently tested. These are personal projects, not presented as paid client engagements.

Concepts: FORME architecture (concrete/charcoal/orange, project filter); Slow Tide coastal stays (ocean/cool-white/sea-glass, room selector); Common Ground coffee (parchment/espresso/olive, photographic menu filters). Each is a fictional business with an always-visible concept banner, responsive homepage, useful sample interactions, and a link back. No real reservations, purchases, or lead submission.

## Implementation

Vite multi-page build, semantic HTML, authored CSS and JavaScript, code-split Three.js. Fully local assets. Contact uses a guided email composer and direct email/LinkedIn links; no email service, secrets, or backend. Published to https://vince-alvarez-portfolio.vercel.app/ on 22 October 2026 as a separate Vercel project.

Common Ground uses Cormorant Garamond headings, Manrope body text, warm wood/linen/ceramic photography, fine rules, and a photographic menu in three desktop, two tablet, and one phone columns. Headline: “Good coffee. Slow mornings.” Filters, recommendation picker, sample prices and fictional concept notice are retained.

The capabilities sequence repeats seamlessly at 28px per second with only one accessible copy. The shared motion button controls ticker and 3D independently, respects reduced motion, and remains functional without WebGL. The introduction video uses visitor-initiated playback with captions and transcript; its narration is labeled synthetic.

The original three concept heroes have themed procedural Three.js backgrounds: cool mineral courtyard plates for FORME, sea-glass wave contours for Slow Tide, and ceramic-white steam for Common Ground. Their Wordmark, Full-Bleed, and Split compositions each lead into a distinct reversible native-scroll story. Each has a keyboard-accessible motion toggle, shared remembered preference, reduced-motion support, static fallback, and offscreen/hidden-tab suspension. No external 3D models or textures are downloaded.

## Review refinements — 23 October 2026

- Meaningful project labels are 12–13px; body prose is approximately 16px. Phone projects use a single column with stacked metadata and 44px secondary targets.
- Both live personal projects include role, scope, design focus, current status and three specific design decisions. Copy uses existing project evidence and avoids unverified delivery durations or business results.
- Selected work precedes the full introduction video. Repeated section introductions were tightened while preserving the brutalist typography and imagery.
- The two home motion controls share one state. Project hover feedback is 220ms, enabled for hover-capable fine pointers; Three.js pointer motion interpolates toward its target.
- Contact offers native email drafting, copy-email and copy-project-brief. If clipboard access fails, a selectable brief appears locally. No backend or email delivery service was added.
- Every public route has canonical and sharing metadata. A local 1200×630 screenshot card, robots.txt and a six-route sitemap are published.

## Three-concept expansion — 26 October 2026

The work collection now contains eight cards: Fitness Vault and The Faceless Prompts remain personal live projects, followed by six fictional concepts. FORME, Slow Tide, and Common Ground retain their identities. Sora Reyes, Mara Solis, and Foundry Build add photography, property-agent, and construction examples, bringing the site to nine public pages. Their static portfolio previews reflect the corresponding page compositions.

- **Sora Reyes:** cool white `#F7FAFF`, blue-black `#111D2E`, crimson `#C3283D`, and mist blue `#D7E7F4`. Cormorant Garamond headings and Manrope text support an asymmetric photographic contact sheet. Floating 3D photo planes accompany a contact-sheet → selection → full-frame scroll story. Six full-image/detail studies have category filters and accessible image dialogs. The fictional photographer and illustrative AI-generated imagery are disclosed.
- **Mara Solis:** plum `#51374F`, pale pink `#F3E6EB`, cool white `#F8FAFC`, and deep teal `#235D62`, with Manrope typography. A featured home leads into three sample listings, property-type and maximum-price filters, detail dialogs, and a local viewing-request preview. A small 3D neighborhood supports the hero; the scroll story explores neighborhood, exterior, and interior. No real availability, agent credentials, inquiries, or bookings are implied.
- **Foundry Build:** dark steel `#17212B`, safety yellow `#F8CF3C`, light steel `#E9EEF3`, and white, with Anton headings and Manrope text. Job-site imagery and a practical scope panel distinguish it from FORME's architectural composition. Its procedural steel framework and foundation → framing → completion story lead to three filterable sample projects, detail dialogs, and a copyable local project brief. No company receives or stores that sample brief.

All six concepts link to the portfolio inquiry through an allowlisted concept reference. Visitors can change the optional reference selection; email drafts and copied briefs include its known display name alongside any CMS request. Concept pages remain silent. The new scenes share the existing single-renderer lifecycle, remembered motion preference, reduced-motion/static fallbacks, and hidden-tab/offscreen suspension. Each concept retains visible fictional notices and a link back to Vince's work.

Website prices remain private and projects are quoted by scope. Custom-domain registration and annual renewal are optional, separately quoted costs that vary. For eligible static sites, the service can include client-owned Cloudflare Pages setup, a free provider address, and 12 months of limited deployment assistance, subject to provider terms and limits. Content changes, new features, CMS work, and paid upgrades are separate. CMS remains an optional service; no editor, authentication, publishing backend, or new inquiry-delivery service is installed in the portfolio.

The main portfolio's portrait, 3D background, paper opening, ticker, blueprint scroll, sound, cat, and website introduction remain in place. The completed Fiverr video is unchanged. Verification and publication are documented separately; this design record does not establish live deployment. Material source changes can leave the Graphify index stale; it is refreshed only when requested.
