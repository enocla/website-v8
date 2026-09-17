# enochlau.com

This is the source for [enochlau.com](https://enochlau.com), a small TanStack Start site with a paper-like shell, local content, and one interactive sleep-data article.

## Development

Requirements: Node 24 and pnpm 11.

```bash
pnpm install
pnpm dev
```

The production checks are also available as individual commands:

```bash
pnpm check          # Biome formatting/lint checks
pnpm typecheck      # TypeScript, no emit
pnpm test           # Node tests for content and sleep contracts
pnpm validate:data  # versioned generated sleep-data schema
pnpm validate:content
pnpm build          # generate OG images, validate, and build Nitro output
pnpm run ci        # all of the above
```

## Architecture

- `src/routes/` contains file-based URL declarations, loaders, and head composition only.
- `src/pages/` contains page implementations.
- `src/layout/` owns the paper shell, footer, and the reusable `NavLink` active-state component.
- `src/content/manifest.json` is the metadata source of truth for pages and posts. `src/content/manifest.ts` provides typed lookups.
- `src/content/posts/` owns each body. Prose uses MDX; interactive stories use TSX. Bodies are lazy-loaded from the post route, while the writing index loads metadata only.
- `src/features/sleep/` owns sleep charts, the browser-facing generated artifact, and its typed data model.
- `src/integrations/` owns music, Giscus, and Umami boundaries and identifiers.
- `src/lib/seo.ts` creates canonical, description, Open Graph, and Twitter head metadata.

The public writing URL is `/writing/<slug>`. `/content/<slug>` remains as a compatibility redirect for old indexed links.

## Adding a post

1. Add metadata to `src/content/manifest.json` with a lowercase stable slug, an ISO `publishedAt` date, canonical path, stable OG filename, and body module path.
2. Add the matching `src/content/posts/<slug>/index.mdx` or `index.tsx` body.
3. Use `ContentImage` for media so dimensions, alt text, lazy loading, and decoding behavior are explicit.
4. Run `pnpm validate:content`, `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

The OG generator reads the same manifest; it has no second page/post registry. It removes stale generated PNGs before rendering and `validate:content` checks ownership in both directions.

## Math in MDX

Use `$$...$$` for inline LaTeX, for example `The energy is $$E = mc^2$$.`
For a centered display equation, put the delimiters on separate lines:

```md
$$
\frac{1}{n} \sum_{i=1}^{n} x_i
$$
```

Math is rendered at build time with KaTeX, with locally bundled styles and fonts.
Single dollar signs stay literal (for example, `$5`), and math inside code spans
or fenced code blocks is not rendered. Wide display equations scroll horizontally.

## Sleep data

The raw AutoSleep export is personal input and belongs at `data/sleep/raw/sleep.csv`. That directory is ignored and never served. The preprocessing command is:

```bash
node scripts/data/sleep/preprocess.mjs
```

The command writes the private/debug CSV to `data/sleep/derived/sleep-clean.csv` and only the compact chart-facing artifact to `src/features/sleep/data/sleep.json`. The generated artifact includes schema version, source SHA-256, row count, cleaning provenance, and chart series. Its schema is checked by `pnpm validate:data`; pure statistical functions have fixture tests. The sleep article intentionally publishes the aggregated chart data, not the row-level export.

## Assets and external services

- Runtime fonts live in `public/fonts` (New Spirit static 400/500/600/700 for serif/sans/headings, Maple Mono for mono); legacy Newsreader, Departure Mono, Yrsa, Archivo, Work Sans, Supreme, Sentient and Libertinus Serif files are retained in `public/fonts` and `assets/fonts` but no longer referenced. The OG generator reads its New Spirit and Maple Mono inputs from `public/fonts`.
- The history article currently uses remote GitHub-hosted screenshots intentionally because those images are part of the site-history archive. Each image has dimensions, alt text, lazy loading, and an explicit `ContentImage` boundary. New posts should prefer post-owned local media unless remote hosting is deliberate.
- Giscus uses the existing `enocla/website-v6` discussion repository, but maps comments to stable post slugs rather than mutable titles. Umami and music API identifiers/configuration live under `src/integrations/`.

## Deployment

```bash
pnpm build
pnpm preview
```

Vercel can deploy the generated TanStack Start/Nitro output using the included `vercel.json`. Keep server-only secrets unprefixed; only variables prefixed `VITE_` are included in the browser bundle.
