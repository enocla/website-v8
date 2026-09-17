# Architecture review

**Review date:** 2026-09-17  
**Scope:** current working tree of `website-v8`, including the uncommitted sleep-analysis/content work  
**Primary concern:** content ownership and the boundary between routes, post data, interactive features, and build-time data

## Executive summary

This is a small site, but it currently has no clear application boundaries. The route files are simultaneously route definitions, page components, page-copy storage, metadata definitions, and page-specific styling. The content system is more problematic: `src/posts.tsx` is a post registry, a post metadata model, a slug dispatcher, and the complete React implementation of every post. It also imports the sleep chart feature and its generated data. That makes adding or editing content a code change in a central switch statement and makes an apparently simple writing index depend on a large interactive-data module.

The code does not need a framework rewrite. The right fix is to establish a small set of explicit boundaries:

1. **Routes** should own URL parameters, loaders, and head composition, not long-form copy.
2. **Content** should own post metadata and authored bodies. Prose should be authored as Markdown/MDX; interactive pieces should remain typed React modules.
3. **Features** should own domain-specific UI and data, especially the sleep analysis.
4. **Layout/UI** should own the paper shell, navigation, typography, and reusable visual primitives.
5. **Integrations** should own Song, Giscus, Umami, and other external services.
6. **Build/data scripts** should own raw-input processing, generated artifacts, and validation; generated output should not be duplicated in `public` unless it is actually served.

The highest-value refactor is therefore not “move files into more folders.” It is to replace the implicit `slug -> switch -> JSX` system with a typed content manifest and per-post modules, then move the sleep implementation behind the `sleep` post boundary.

## Evidence and current validation

The repository contains five page routes and one dynamic content route:

- `/`
- `/about`
- `/projects`
- `/writing`
- `/content/$slug`

The current content/data surface is small but unusually concentrated:

- `src/posts.tsx`: 223 lines; metadata, registry, dispatcher, and both full post bodies.
- `src/components/SleepCharts.tsx`: 543 lines; all chart definitions, chart formatting, data access, and sleep-specific constants.
- `scripts/preprocess-sleep.mjs`: 444 lines; CSV parsing, cleaning rules, statistical functions, aggregation, and generated-file writing.
- `src/data/sleep.json`: approximately 192 kB of generated data.
- `sleep.csv`: approximately 288 kB of raw data in the repository root.
- `sleep-clean.csv` and `public/sleep-clean.csv`: approximately 144 kB each, duplicate derived exports.

Checks run during this review:

- `pnpm check`: passes; it reports only 19 files because the Biome include list excludes scripts, styles, generated data, and several project-root files.
- `pnpm exec tsc --noEmit`: passes; there is no package script for this check.
- `pnpm build`: passes. It generates six OG images and completes the client, SSR, and Nitro builds.
- The build reports a **656.95 kB minified client entry** (`index-*.js`) and a series of module-level `"use client"` warnings from the router dependency.
- Every pnpm command reports that `pnpm.onlyBuiltDependencies` in `package.json` is ignored by the installed pnpm version.
- The working tree already contains uncommitted application/data changes. This review added no changes to those files.

The large client entry is consistent with the current module graph: `src/posts.tsx` imports all `SleepCharts` exports at module scope, and the post/content graph is not deliberately separated from the main client graph.

## Current architecture map

```text
TanStack route files
  ├─ __root.tsx
  │    ├─ global metadata, Umami script, CSS URL
  │    ├─ paper shell, Nav, footer, decorative SVG/filter components
  │    └─ renders child route
  ├─ index.tsx
  │    ├─ home copy and page-specific nav CSS
  │    └─ Song -> imperative external API/DOM widget
  ├─ about.tsx
  │    ├─ about copy and page-specific nav CSS
  │    └─ Badge instances / external badge images
  ├─ projects.tsx
  │    ├─ project copy and page-specific nav CSS
  │    └─ direct link to /content/$slug
  ├─ writing.tsx
  │    └─ imports posts from src/posts.tsx and renders the index
  └─ content/$slug.tsx
       ├─ finds the post in src/posts.tsx
       ├─ emits head metadata and Giscus markup
       └─ calls PostContent(slug)
            └─ src/posts.tsx switch
                 ├─ HistoryContent: long-form JSX and remote images
                 └─ SleepContent: narrative JSX + SleepCharts + sleepStats

Build/data side
  sleep.csv -> scripts/preprocess-sleep.mjs -> sleep-clean.csv
                                      └──────> src/data/sleep.json
  hardcoded PAGES in scripts/generate-og.mjs -> public/og/*.png
  assets/fonts + public/fonts -> site fonts and OG fonts
```

## Findings by boundary

### 1. Content is a central implementation switch, not a content system

**Evidence:** `src/posts.tsx` defines `Post`, the `posts` array, `PostContent`, `SleepContent`, and `HistoryContent`. `PostContent` selects a body with a string switch. `src/routes/writing.tsx` and `src/routes/content/$slug.tsx` both import this module.

**Why this is the main architectural failure:**

- A new post requires editing a central registry and a central switch.
- Metadata and body ownership are separated only by convention; the post cannot be moved or reviewed as one unit.
- `PostContent` accepts any `string` and returns `null` for unknown slugs, even though the registry is supposed to define the valid set.
- The content module imports sleep chart code for every consumer of the registry.
- The name `posts.tsx` hides the fact that it is also the sleep feature entry point and a large prose source.
- Plain prose is authored as JSX, which makes copy changes noisy and couples writing to the application compiler.

**Recommendation:** replace it with a typed content manifest and one module/directory per post. Keep a React/TSX implementation for interactive posts such as sleep, but author history as MDX or Markdown with an explicit component map. The route should resolve a `PostEntry`, not call a switch.

A practical transitional shape is:

```ts
export type PostEntry = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  kind: "mdx" | "react";
  component: React.ComponentType;
  ogImage: string;
};

export const posts = [historyPost, sleepPost] satisfies readonly PostEntry[];
export const postBySlug = new Map(posts.map((post) => [post.slug, post]));
```

The final version should preferably lazy-load post bodies so the writing index imports metadata only. Verify that the chosen lazy-loading approach preserves SSR for the post page.

### 2. The route name and content URL do not describe the public information architecture

The navigation calls the section “writing,” but the public URL is `/content/$slug`. The writing index and `projects.tsx` both link to that implementation-oriented path. This is a small site, so the public URL should express the domain: `/writing/$slug`.

**Recommendation:** use `/writing/$slug` as the canonical route, add a redirect or compatibility route from `/content/$slug`, and update all internal links. Do not break existing indexed links without a redirect. Keep slug lookup in the content layer, not in the route component.

### 3. The OG generator has a second, manually maintained content registry

**Evidence:** `src/posts.tsx` owns post titles, while `scripts/generate-og.mjs` has a separate hardcoded `PAGES` list containing page titles, filenames, and post entries. `src/lib/site.ts` constructs OG URLs from arbitrary strings.

This creates several drift paths:

- A new post can render but have no OG image.
- A title can change in the app while the generated image still has the old title.
- A slug/file naming mistake produces a valid page with a missing image.
- Static page metadata is repeated in each route and again in the generator.

**Recommendation:** make one metadata manifest the source of truth for routes, writing index, post heads, and OG generation. Either make it a plain JSON/JSON-compatible manifest that the Node build script can read, or add a build step that derives a JSON manifest from content frontmatter. Add a build validation that every published entry has an OG asset and every generated asset has an owning entry. Use a stable `ogImage` field rather than deriving arbitrary filenames from route input.

### 4. The sleep post is an application feature embedded inside the content registry

**Evidence:** `SleepContent` in `src/posts.tsx` imports eight chart components and `sleepStats`; `SleepCharts.tsx` imports `../data/sleep.json` directly. The chart module contains shared chart infrastructure, formatting functions, chart definitions, and all sleep-specific series access in one 543-line file.

This is a valid interactive article concept, but the ownership is backwards. The post should depend on a sleep feature, not the global post registry becoming the sleep feature.

**Recommendation:** create an explicit feature boundary:

```text
src/features/sleep/
  content/SleepPost.tsx
  charts/
    ChartShell.tsx
    SleepDurationHistogram.tsx
    BedtimeTimeline.tsx
    BedtimeScatterplots.tsx
    WeeklyRhythmCharts.tsx
  data/
    sleep.json              # generated, browser-facing subset
    model.ts                # types and accessors
  format.ts
```

The post body can then compose `SleepDurationHistogram`, `BedtimeTimeline`, and narrative sections without knowing how the data was generated. Split `SleepCharts.tsx` by chart family only when it makes ownership clearer; do not split it mechanically into many tiny files.

The generated JSON should have a documented schema and version. Consider reducing duplicated series or splitting data by chart if bundle size remains high. Measure before and after; the current build warning is enough to prioritize measurement, not enough to justify a premature data format rewrite.

### 5. The data pipeline mixes raw data, analysis code, generated artifacts, and web assets

**Evidence:** `scripts/preprocess-sleep.mjs` is a 444-line script containing a custom CSV parser, cleaning policy, plausibility gates, statistics implementation, aggregation, and file output. It reads root-level `sleep.csv` and writes root-level `sleep-clean.csv` plus `src/data/sleep.json`. A duplicate `public/sleep-clean.csv` also exists in the current tree.

Problems:

- `public` is web-served; a derived personal sleep export should not be there unless public exposure is intentional.
- The two clean CSVs can diverge.
- There is no explicit schema/version/hash in the generated artifact.
- Statistical functions and cleaning rules are hard to test in a single script.
- The build does not regenerate or validate sleep data; it assumes the generated JSON exists.
- Raw and derived data are not explained in the README or a data-specific document.

**Recommendation:** choose and document one policy:

- If raw/clean data is not meant to be public, keep it outside the web root and consider keeping it outside version control; add an explicit ignore rule and retain only the minimum generated chart data needed by the site.
- If publication is intentional, document that decision, the transformation rules, and the privacy implications; still remove the duplicate `public` copy unless the browser explicitly downloads it.

A clearer layout would be:

```text
data/sleep/raw/sleep.csv              # optional, policy-controlled
 data/sleep/derived/sleep-clean.csv   # analysis/debug artifact, not public
src/features/sleep/data/sleep.json    # generated browser-facing artifact
scripts/data/sleep/preprocess.mjs
scripts/data/sleep/statistics.mjs
scripts/data/sleep/schema.mjs
```

The exact location is less important than a single output path, explicit ownership, and validation of row counts, required fields, finite numeric values, and the generated schema. Add fixtures for edge cases such as malformed times, DST boundaries, travel shifts, invalid efficiency, and missing vitals.

### 6. Route files are doing too much page work

**Evidence:** `src/routes/index.tsx`, `about.tsx`, `projects.tsx`, and `writing.tsx` contain their full page bodies. `__root.tsx` contains the entire shell and footer. This is not inherently wrong for five pages, but it makes route modules large, hard to preview independently, and inconsistent with the post architecture.

**Recommendation:** keep file-based route files thin:

```tsx
export const Route = createFileRoute("/about")({
  head: () => createPageHead(pageMeta.about),
  component: AboutPage,
});
```

Move page implementations to `src/pages/` or `src/features/site/pages/`. Store repeated structured content (projects, badges, navigation, page metadata) in typed data modules. Keep genuinely bespoke markup as components; do not turn every sentence into a database-shaped object.

Suggested page modules:

```text
src/pages/
  HomePage.tsx
  AboutPage.tsx
  ProjectsPage.tsx
  WritingIndexPage.tsx
  PostPage.tsx
```

### 7. Navigation state and page-specific CSS are duplicated in every route

Each page emits an inline `<style>` that fades non-current navigation links. The selectors are not even fully consistent: the post route uses `nav :not(...)`, while the index/list pages use `nav a:not(...)`. Sleep content and Song also inject style tags from component bodies.

**Recommendation:** use TanStack Router’s active-link behavior or a single `NavLink` wrapper with `activeProps`/`inactive` styling. The root layout should render navigation once; the page should not need to know how active state is styled. Move component-specific CSS into the component stylesheet or stable utility classes. Keep `src/styles.css` for design tokens, document typography, and genuinely global rules.

### 8. The external integrations are not isolated

- `src/components/Song.tsx` fetches the external API, queries global DOM IDs, and mutates styles/text/classes directly. It has no response validation, state model, loading state, or visibility listener; the interval can continue to race with an in-flight request.
- `src/routes/content/$slug.tsx` embeds Giscus directly and uses the post title as the comment identity. A title change can separate a post from its existing comments. The configured repository is `enocla/website-v6`, which should be verified against the current site.
- `src/routes/__root.tsx` embeds Umami configuration directly in the root shell.

**Recommendation:** create `src/integrations/music/`, `src/integrations/comments/`, and `src/integrations/analytics/`. Give each integration a small client/config boundary. Use React state for Song and a stable post slug for Giscus. Keep external identifiers in one config module and add an explicit decision about whether these services are required for SSR or may be client-only.

### 9. Content assets are remote and unowned

`HistoryContent` uses raw GitHub URLs for six screenshots. The page can fail or change when another repository changes, and the content source does not own its media. The images do have dimensions and alt text in the current implementation, which is good, but there is no local asset policy.

**Recommendation:** store post-owned media beside the post (or in a clearly documented `public/content/<slug>/` directory), use a small content-image component for consistent dimensions/loading/alt behavior, and retain remote URLs only when the external hosting is an intentional part of the post.

### 10. SEO/head metadata is repetitive and partially inconsistent

Every route repeats title, `property="title"`, `og:title`, Twitter title/image, and description construction. The root uses `property="description"` while child routes use `name="description"`. There is no obvious canonical URL per page, and the post route can construct an OG filename from an arbitrary slug before the not-found path is rendered.

**Recommendation:** add `src/lib/seo.ts` with a typed `createPageHead` helper and a single metadata model. Normalize description tags, add canonical URLs, use stable OG image fields, and provide a not-found head/UI. Keep route-specific content in the page/content manifest rather than duplicating strings in route files.

### 11. Styling and dependency choices are currently mixed

`src/styles.css` implements a custom `.prose` system, while `@tailwindcss/typography` is declared but has no source import or configuration usage. The stylesheet also contains site tokens, layout rules, paper effects, prose rules, and badge behavior in one global file. `public/fonts` and `assets/fonts` are both correct-looking use cases—runtime fonts versus OG-build fonts—but the distinction is undocumented.

**Recommendation:** choose one typography approach: retain the custom `.prose` rules and remove the unused typography package, or configure/use the plugin intentionally. Separate global tokens/base typography from feature/layout styles. Document why the font files exist in two places and add a build check for generated font inputs.

### 12. Tooling gives a false sense of coverage

`biome.json` includes selected `src` files but explicitly excludes styles and generated data and does not include `scripts`. There is no test runner, no `typecheck` script, no data validation script, and no route/OG consistency check. `README.md` is still the generated TanStack starter README and describes demo pages and “two routes,” so it does not document the actual project or content workflow.

The package also uses several `latest` ranges and a Nitro beta. The lockfile provides an installed resolution today, but `latest` makes intended upgrades implicit and makes the architecture harder to reproduce. The pnpm build-approval setting is in `package.json`, but the installed pnpm explicitly says that field is ignored.

**Recommendation:**

- Add `typecheck`, `test`, `validate:data`, `validate:content`, and a composite `ci` script.
- Extend Biome coverage to scripts and tests; keep generated files excluded but validate their schema separately.
- Add unit tests for content lookup, date/slug/OG invariants, data transforms, and at least one chart data contract.
- Pin direct dependencies or use deliberate bounded versions and update them intentionally.
- Move the build-approval setting to the configuration location supported by the project’s pnpm version and make CI use a frozen lockfile.
- Replace the starter README with setup, architecture, content-authoring, data-generation, asset, validation, and deployment instructions.

## Target structure

This is a target direction, not a requirement to perform every move in one commit:

```text
.
├── data/
│   └── sleep/
│       ├── raw/                         # policy-controlled, not public
│       └── derived/                     # optional analysis/debug output
├── docs/
│   ├── architecture-review.md
│   └── content-and-data.md
├── scripts/
│   ├── data/sleep/
│   │   ├── preprocess.mjs
│   │   ├── statistics.mjs
│   │   └── validate.mjs
│   ├── generate-og.mjs
│   └── fetch-fonts.mjs
├── src/
│   ├── content/
│   │   ├── manifest.ts
│   │   ├── types.ts
│   │   ├── posts/
│   │   │   ├── history/
│   │   │   │   ├── index.mdx
│   │   │   │   └── assets/
│   │   │   └── sleep.tsx
│   │   └── pages/
│   │       ├── home.tsx
│   │       ├── about.tsx
│   │       └── projects.tsx
│   ├── features/
│   │   └── sleep/
│   │       ├── charts/
│   │       ├── data/sleep.json
│   │       ├── format.ts
│   │       └── model.ts
│   ├── integrations/
│   │   ├── analytics/
│   │   ├── comments/
│   │   └── music/
│   ├── layout/
│   │   ├── SiteShell.tsx
│   │   ├── Nav.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── WritingIndexPage.tsx
│   │   └── PostPage.tsx
│   ├── components/ui/
│   │   ├── Badge.tsx
│   │   ├── Paperclip.tsx
│   │   ├── PaperFilters.tsx
│   │   └── PaperTexture.tsx
│   ├── lib/
│   │   ├── seo.ts
│   │   └── site.ts
│   └── routes/
│       ├── __root.tsx
│       ├── index.tsx
│       ├── about.tsx
│       ├── projects.tsx
│       ├── writing/index.tsx or writing.tsx
│       └── writing/$slug.tsx
└── public/
    ├── fonts/
    └── site assets only
```

Two cautions:

- Do not put route files, generated `routeTree.gen.ts`, or every small visual component into a complicated feature architecture just for symmetry.
- Do not move prose into a database/CMS. A local Markdown/MDX/TSX source is simpler and fits this site’s scale.

## Prioritized migration plan

### P0 — establish the contract before adding more content

1. **Define the content model and manifest.** Add `PostEntry`, ISO dates, stable slugs, summary/description, canonical path, and OG asset fields. Add `getPost(slug)`/`getPosts()` and a duplicate-slug validation. Keep the existing `/content/$slug` URL working during the transition.
2. **Split the registry from the bodies.** Move history and sleep into separate post modules. Replace the slug switch with a manifest lookup. Preserve the current rendered output while changing ownership.
3. **Make metadata and OG generation share one source.** Remove the hardcoded post entries from `generate-og.mjs`; add a validation for missing/stale OG entries. Centralize page head construction.
4. **Decide the sleep-data publication policy.** Remove or relocate the duplicate `public/sleep-clean.csv` if it is not intentionally downloadable. Document raw/derived/generated data and avoid adding additional personal data to a web-served directory.
5. **Add minimum validation scripts.** Add TypeScript to `package.json` scripts, a content-manifest test, generated-data schema checks, and a production build check in CI.

**P0 exit criteria:** adding a post requires adding one content entry/module and no central switch edit; writing index, post page, and OG generation consume the same metadata; no accidental CSV is web-served; `pnpm ci` catches invalid slugs/metadata/data.

### P1 — move responsibilities without changing the visual design

6. **Create the page/layout boundaries.** Extract page components from route files and extract `SiteShell`, `Footer`, and navigation active-state behavior from `__root.tsx`/inline route styles.
7. **Create the sleep feature boundary.** Move chart code/data under `src/features/sleep`, split chart families where useful, and make `SleepPost` the only content module that depends on it.
8. **Refactor integrations.** Replace Song’s DOM mutation with a stateful widget and isolate Giscus/Umami configuration. Use stable post slugs for comments.
9. **Choose the prose format.** Convert history to MDX/Markdown after the content manifest works. Keep sleep as TSX because it is an interactive data story. Add a documented component map for charts and content images.
10. **Consolidate styles and dependencies.** Remove unused typography dependency or configure it, move repeated styles out of JSX, and clarify runtime/build-only font assets.

**P1 exit criteria:** routes are mostly declarations; content and features have independent ownership; navigation styles are not copied into every page; external services can be changed without editing route markup.

### P2 — optimize and harden

11. Measure route-level bundles after the split and lazy-load the interactive sleep body if appropriate. Set a bundle budget or at least fail CI on an unexpected large regression.
12. Add local content media or an explicit remote-media policy; verify image dimensions, alt text, loading behavior, and availability.
13. Add a not-found UI, canonical links, sitemap/robots policy if required, and stable redirects for the old content URL.
14. Finish the data pipeline split: reusable/tested statistics modules, versioned generated schema, source hash/provenance, and fixture-based tests.
15. Rewrite the README and add `docs/content-and-data.md` so the next content change follows the intended architecture.

## File-level move map

| Current location | Proposed owner | Action |
|---|---|---|
| `src/posts.tsx` metadata | `src/content/manifest.ts` | Keep only typed metadata/lookup; remove JSX bodies |
| `src/posts.tsx` `HistoryContent` | `src/content/posts/history/index.mdx` | Move prose and owned media |
| `src/posts.tsx` `SleepContent` | `src/content/posts/sleep.tsx` | Keep narrative composition here |
| `src/components/SleepCharts.tsx` | `src/features/sleep/charts/` | Split by chart family and keep chart UI domain-local |
| `src/data/sleep.json` | `src/features/sleep/data/sleep.json` | Generated browser-facing artifact with schema |
| `scripts/preprocess-sleep.mjs` | `scripts/data/sleep/` | Separate parsing, transformations, statistics, output, validation |
| `sleep.csv` / clean CSVs | `data/sleep/` or external/private storage | Establish privacy and web-serving policy first |
| `src/routes/content/$slug.tsx` | `src/routes/writing/$slug.tsx` | Thin route; retain redirect compatibility |
| page JSX in route files | `src/pages/` and/or `src/content/pages/` | Route modules should orchestrate only |
| `src/components/Nav.tsx` | `src/layout/Nav.tsx` | Centralize active-link behavior |
| Paper components | `src/components/ui/` | Reusable visual primitives, not feature catch-all |
| `src/components/Song.tsx` | `src/integrations/music/` | Separate API client/state widget from layout placement |
| Giscus markup | `src/integrations/comments/` | Stable slug mapping and centralized config |
| `scripts/generate-og.mjs` `PAGES` | manifest-driven build input | Remove duplicate registry |
| `src/lib/site.ts` | `src/lib/site.ts` + `src/lib/seo.ts` | Keep site constants; add typed head/canonical helpers |

## Definition of a healthy content change

After this reorganization, the workflow for a new post should be:

1. Create `src/content/posts/<slug>/` or a single post module.
2. Add frontmatter/metadata with an ISO publication date and stable slug.
3. Choose Markdown/MDX for prose or TSX for an interactive story.
4. Add post-owned media beside the post, or explicitly reference an approved remote asset.
5. Run `pnpm validate:content`, which checks duplicate slugs, required metadata, OG ownership, and route compatibility.
6. Run `pnpm check`, `pnpm typecheck`, tests, and `pnpm build`.

No route switch, unrelated component file, second OG registry, or public CSV copy should need manual editing.
