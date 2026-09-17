# Content and data contracts

## Content ownership

`src/content/manifest.json` is the only metadata registry. It owns stable post slugs, ISO publication dates, canonical paths, OG filenames, and body module paths. TypeScript routes use `src/content/manifest.ts`; the Node OG generator reads the JSON directly. A new post does not require a route switch or a second OG list.

Post bodies live beside their metadata boundary under `src/content/posts/<slug>/`. MDX is for prose; TSX is for interactive stories. `src/content/loadPost.ts` uses Vite's lazy module graph so the writing index does not import the sleep charts. The post route is SSR-tested through the production preview smoke test.

The history screenshots remain remote deliberately: they are archival screenshots from the site-history repository. `ContentImage` requires dimensions and alt text and sets lazy loading/async decoding. New post media should be local and post-owned unless remote hosting is a deliberate archival or attribution decision.

## Sleep-data publication policy

The raw AutoSleep export is personal input and is not a web asset. It belongs at `data/sleep/raw/sleep.csv`, which is ignored. The row-level cleaned/debug CSV belongs at `data/sleep/derived/sleep-clean.csv`, also ignored. There is intentionally no copy under `public/` and no root-level CSV workflow.

The only published sleep data is the aggregated chart artifact at `src/features/sleep/data/sleep.json`. It contains no row-level vitals export. Its root `schemaVersion`, source SHA-256, row count, cleaning provenance, summary statistics, and chart series are checked by `pnpm validate:data`. Regenerate it locally with `node scripts/data/sleep/preprocess.mjs` after changing the private raw input.

The cleaning policy is conservative: malformed required input fails preprocessing, invalid efficiency is recomputed from sleep/in-bed duration, and implausible vitals are nulled rather than invented. Pure statistics and CSV edge cases have fixture tests under `scripts/data/sleep/`.

## External services

- Song is a client-only integration. Its API client validates the response, uses React state, aborts stale requests, pauses while the document is hidden, and refreshes on visibility changes.
- Giscus is rendered at the post boundary. The existing `enocla/website-v6` repository/category identifiers are centralized in `src/integrations/comments/config.ts`. Comments map to the stable post slug, not the editable title.
- Umami is a root-document script, with its website ID centralized in `src/integrations/analytics/config.ts`.

These services are enhancements rather than content prerequisites: post metadata and bodies remain local and SSR-renderable when an external service is unavailable.

## Fonts

`public/fonts` contains runtime browser fonts. `assets/fonts` contains build-only font inputs used to render OG PNGs; those files are not browser assets. `scripts/generate-og.mjs` fails if an input font cannot be loaded.
