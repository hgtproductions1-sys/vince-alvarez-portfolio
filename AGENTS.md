# Agent handoff notes

## Project

This is Vince Alvarez's static portfolio, built with Vite and Three.js. It contains the main portfolio and six standalone concept sites under `concepts/`.

## Setup

- Requires Node.js `>=24.20.0` (see `package.json`).
- Install dependencies with `npm ci`.
- Start local development with `npm run dev`.
- Run the existing source checks with `npm run check` and build with `npm run build`.

## Important boundaries

- Keep this repository private. It contains the owner's portrait and personal contact information.
- Never commit credentials, `.env` files, resumes, source video authoring projects, generated delivery archives, or local review/build artifacts.
- The site is a static frontend. The optional CMS offer is descriptive; no client editor or backend is installed.
- Read `README.md`, `DESIGN.md`, `ASSETS.md`, and `DEPLOYMENT.md` before changing site structure, assets, or deployment.
- Existing public deployment: https://vince-alvarez-portfolio.vercel.app/ . Publishing changes requires the owner's explicit request.

## Architecture

- `index.html`: homepage markup and entry point.
- `src/`: shared portfolio behavior, animation, audio, navigation, and styles.
- `concepts/`: standalone Vite entries and source for concept sites.
- `public/`: local fonts, images, audio, video, and scroll frames shipped with the site.
- `work/`: personal project case-study sources/assets.
- `scripts/`: source, build-reference, and publication checks.
- `vite.config.js`: multi-page route/build configuration.

The project handoff may describe dated verification. Recheck current source and deployment state before relying on those claims.
