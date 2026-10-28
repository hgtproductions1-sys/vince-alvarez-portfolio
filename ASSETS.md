# Asset provenance

## Three-concept expansion — 26 October 2026

- **Generated photographs:** nine original illustrative images were created with the built-in OpenAI Imagegen tool: `sora-still-life`, `sora-coast`, `sora-city`; `mara-courtyard`, `mara-residence`, `mara-garden`; and `foundry-foundation`, `foundry-frame`, `foundry-finish`. They illustrate fictional photographers, properties, and construction studies. They do not represent a real photographer's work, real listings, available homes, completed client projects, or business results. Sora's six studies use full-image and detail crops of the three Sora originals.
- **Local publication assets:** each original has 1280px and 640px-wide WebP variants in `public/images/` (18 responsive files, 1280×853 and 640×427). Prompts, original paths, variant sizes, and SHA-256 digests are recorded in `output/concept-expansion/asset-provenance.json`. Original PNGs remain private in `output/concept-expansion/originals/`; the manifest and originals are not website or ZIP assets.
- **Construction continuity:** `foundry-finish` was derived by editing `foundry-frame` as its reference, with instructions to preserve the camera, footprint, structural proportions, landscape, and light direction while completing the same imagined workshop. This is illustrative continuity, not documentation of an actual construction process. The foundation image was generated separately.
- **Procedural motion:** `src/concept-scene-themes.js` creates Sora's floating contact-sheet planes, Mara's neighborhood blocks, and Foundry's steel framework from local Three.js geometry and materials. They use the existing shared renderer lifecycle; no downloaded model, remote texture, animation dependency, or new audio is used.
- The supplied natural portrait, edited hero portrait, existing concept assets, blueprint frames, website introduction, music, effects, and completed Fiverr video remain unchanged by this expansion. Build, browser, packaging, and publication results are recorded separately in delivery notes.

## Palette refinement — 24 October 2026

No assets were generated, downloaded, replaced, or added. FORME's locally drawn plan uses the concrete palette; its procedural Three.js surfaces and lighting use cool mineral tones. Slow Tide's actual wave material uses sea glass #C8DDD5 with its prior opacity and movement. All photographs, the supplied portrait, blueprint frames, video, and audio are retained. Current local screenshot and package evidence: `preview/palette-separation/`. This release is not published.

## Concept hero and scroll refresh — 24 October 2026

- **Design reference:** the user supplied *5 Hero Styles: The Workflow*. A valid local copy is retained privately at `.qa/reference/hero-workflow.pdf`. Its composition principles inform FORME’s Wordmark, Slow Tide’s Full-Bleed, and Common Ground’s Split hero. The reference PDF, its page renders, and any source purchase/download URL are not website assets and must not appear in the production build or ZIP. The pages use original brand copy and existing local imagery rather than screenshots or copied assets from the guide.
- **Procedural 3D:** `src/scene.js` draws FORME’s horizontal courtyard plates, Slow Tide’s perspective wave contours, and Common Ground’s ceramic-white steam strokes using Three.js geometry and materials. No external model, texture, photograph, video, audio, or animation package was added.
- **Scroll stories:** existing local `architecture.jpg`, `interior.jpg`, `coast.jpg`, `suite.jpg`, `cafe.jpg`, `coffee.jpg`, and `flat-white.webp` are reused in distinct photo narratives. FORME’s spatial plan is locally drawn SVG markup for an explicitly fictional design study. All illustration and photography provenance remains as documented below; these are not built-project or real-premises claims.
- **Portfolio previews:** the three concept cards reuse `architecture.jpg`, `coast.jpg`, and `flat-white.webp`, with original HTML/CSS compositions matching the revised pages. No new raster media was generated or downloaded for the refresh.
- **Retained media:** the 48-frame desktop/mobile blueprint transformation and static finished poster remain unchanged in `public/animation/blueprint/`. The supplied MP4 remains private. Introduction video, portrait, café menu imagery, audio, and cat origins are unchanged.
- Screenshot and browser evidence for this local refresh belongs in `preview/hero-stories/`; source reference pages and fixtures remain private. The refresh is not yet published.

## Scroll transformation — 24 October 2026

- `public/animation/blueprint/{640,960}/000.webp` through `047.webp`: 48 evenly sampled frames per size from the user-supplied four-second H.264 animation, `Pencil_sketch_transforms_into_ph…_20261024011739.mp4` (1280×720, 24fps). Both original endpoints are retained. This is an illustrative generated website mockup; small text and decorative motion differ from the live website.
- Starting and ending reference PNGs were created with OpenAI image generation from this portfolio and the supplied portrait. The user supplied the resulting animated MP4; its animation provider is unspecified. No new image or video generation was used for this integration.
- `finished.webp` is the last video frame exported at 960×540 for static, reduced-motion, paused, no-JavaScript, and error states. All runtime assets are local. Both frame sizes combined are approximately 2.01 MB; visitors load only their applicable size as needed.
- Reproduce using `node scripts/prepare-scroll-frames.mjs <source.mp4>` with FFmpeg/FFprobe on PATH (or `FFMPEG_PATH`/`FFPROBE_PATH`). Source copy and SHA-256 manifest are archived under `output/portfolio-animation-v1/`; the original in Downloads remains unchanged and the MP4 is excluded from the website build.

## Existing website assets

- `vince.png`: unchanged user-supplied portrait, D:/Downloads/2x2.png.
- Opening paper: procedural Three.js geometry and a locally drawn canvas texture (paper fibres, creases and cobalt Vince Alvarez stamp), created in `src/paper-opening.js`. No downloaded texture, model, generated photograph or audio is used for this effect. The natural `vince.png` portrait remains a required About asset and is included in production and the website ZIP.
- `fitness.webp` and `fitness-dashboard.jpg`: user’s existing Fitness Vault source assets. Dashboard contains fictional sample data.
- `faceless.webp`: user’s public website, https://www.thefacelessprompts.com/story-cat.webp.
- Concept photography: Unsplash image CDN, exact source URLs recorded in scripts/assets.mjs. Illustrative photos, not photos of the fictional businesses or evidence of completed construction work.
- Fonts: Anton, Manrope, Cormorant Garamond distributed through Fontsource under their included open font licenses. Fonts are bundled locally.
- All concept names, layouts, sample menu/room data, copy, SVG marks and the Three.js monogram were created for this portfolio. Concept pages are marked as fictional design studies.

## October 2026 refresh

- `vince-print.webp`: AI edited from the supplied portrait into a transparent monochrome halftone cutout. Natural portrait remains in About. Generated with OpenAI image generation; original output `exec-f9068f0f-1bb2-41da-8bd0-ddb510c75acc.png`.
- `flat-white.webp`, `oat-latte.webp`, `cold-brew.webp`, `matcha.webp`, `citrus-soda.webp`, `cookie.webp`, `toast.webp`: matching AI generated illustrative food photographs created with OpenAI image generation on 22 October 2026. They depict sample menu items for a fictional café, not real products or premises. Flat white is reused in the hero and portfolio preview. Resized and converted locally by `scripts/prepare-refresh-images.mjs`.
- Generated originals retained in `C:/Users/Pastor Bhong/.codex/generated_images/01a1609e-70c6-7ba3-b8b3-9cf0315ae58e/`. Image-generation suffixes in menu order: `8048aa3e-6449-4712-9ecb-f41850c16951`, `4fc40597-d980-4380-9163-cea3b0e47273`, `c75926eb-6100-4393-8954-3b0cab31a752`, `481a9591-510e-4fde-aa7e-8643ec848f3c`, `1452fe10-4dee-4c0c-966b-a932bc7b66d2`, `d3b1b791-c94e-4dfc-8aa0-0ad44350ed53`, `8560fbb3-0bc7-40be-a1eb-1ef559ec95c8` (filenames use `exec-` prefix and `.png` suffix).

## Introduction video

- `public/video/vince-introduction.mp4`: 33 seconds, 1920×1080, 30fps H.264/AAC. Authored and rendered locally with Hyperframes 0.8.185; editable scenes and review notes in `videos/vince-introduction/`.
- Live website screenshots were captured from Fitness Vault and The Faceless Prompts on 22 October 2026. Concept screenshots came from the local portfolio. They are illustrative project footage, not evidence of client results.
- VoiceLab original synthetic voice **Theo — Upbeat explainer**, `voice_ba626fc6-18c5-408f-8376-d49b95047bd7`; generation `gen_oM8Bg7Lc8AR8Rpy17sE7gFyd`. Not a clone or recording of Vince. Narration slowed to 0.9x and normalized to a -16 LUFS target. Final encoded file measured mean -17.7 dB and peak -1.5 dB; machine transcribed and measured, not reviewed by a human listener.
- English captions in `vince-introduction.vtt`; the website includes the same spoken transcript. Poster is a frame extracted at 6.7 seconds.
- No background music: provider account setup was incomplete. All narration and website assets are stored locally. Source resumes are private and excluded from the published build.

## Sharing card — 23 October 2026

- public/social-preview.jpg: 1200×630 browser capture of the finished local portfolio hero. It reuses the portfolio typography, existing supplied/edited portrait and procedural Three.js background; no third-party image was added.

## Refined paper opening — 23 October 2026

- Paper texture, fibres, creases and cobalt name stamp are generated locally in `src/paper-opening.js`; geometry uses procedural connected folds and a small lighting shader. No downloaded model, media generation, audio or new animation dependency is used. Review frames are browser captures of the actual geometry, retained in `preview/paper-refinement/`; local sampling fixtures are excluded from publication.

## Optional music and effects — 23 October 2026

- `public/audio/portfolio-ambient.mp3`: original 32-second instrumental composition synthesized locally from softened oscillator chords, sparse upper notes and cyclic stereo reverberation. No third-party track, sampled instrument, vocals or artist imitation. MP3, 24kHz stereo, 96kbps, 385,100 bytes; played quietly at gain 0.14 and looped through Web Audio.
- `public/audio/paper-unfold.mp3` (0.85s, 9,404 bytes) and `paper-lift.mp3` (0.4s, 4,844 bytes): original procedural noise-based paper textures, not recordings. Soft control taps are synthesized at interaction time. All are silent until explicit opt-in.
- Reproducible source: `scripts/prepare-audio.mjs`; deterministic noise seed 20261023. FFmpeg encodes local WAV masters into MP3. Masters live in `.qa/audio-masters/` and are not published. No remote generation service, API key or new dependency is required at runtime.
- Find Skills workflow checked skills.sh and searched website audio skills. Existing ElevenLabs music/sound-effects guidance was consulted. The connected generation provider required account setup during cost preflight; no generation was submitted or billed. Original local synthesis was used to complete the requested feature.

## Origami cat and hover tick — 23 October 2026

- The cobalt origami cat is original inline SVG geometry in `src/cursor-cat.js`, with locally defined fold shading. No downloaded model, external image or additional renderer is used.
- Hover feedback is a deterministic 35ms tapered noise buffer synthesized in the existing Web Audio engine. It is quieter than the control tap, gated by explicit sound opt-in and rate-limited to one tick per 120ms.

## Sound refinement — 23 October 2026

- Replaced the previous hover noise with an original 75ms rounded pop, synthesized in `src/hover-sound.js`, combining a downward tone with a trace of deterministic paper noise. Post-gain peak -27.2 dB, event RMS -39.2 dB; the old tick measured peak -60.4 dB and RMS -73.1 dB. No sample or generation service is used.
- `public/audio/portfolio-chill.mp3`: original 32-second composition, 60 BPM, warm ninth-chord electric piano, soft bass and sparse upper notes. Rendered locally from procedural instruments with wrapped note/reverb tails. MP3 24kHz stereo, 96kbps, 385,100 bytes. Encoded mean -25.5 dB, peak -8.0 dB; played at gain 0.2. No third-party music or artist imitation. The earlier ambient file remains locally as an archive and is excluded from this publication.
- Music and sound-effects skill guidance was consulted; the available connector exposes no direct music composition endpoint, and prior generator account setup was incomplete. The existing local composition workflow was reused without adding dependencies or requiring account setup.


