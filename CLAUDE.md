# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Nitin's Daily Semicon Digest — a Next.js site that ingests semiconductor-industry news daily (NewsData.io), summarizes/tags/filters it with Claude, and displays it in an editorial layout (hero + digest sidebar, tag theme row, per-tag carousels, plus a full `/archive` for browsing beyond one day). Deployed on Vercel at https://nitin-semicon-digest.vercel.app, with a daily Vercel Cron job driving ingestion.

## Commands

```bash
npm run dev              # local dev server
npm run build             # production build (also runs typecheck)
npm run lint               # eslint

npm run db:generate        # generate a Drizzle migration from lib/db/schema.ts after editing it
npm run db:migrate         # apply pending migrations to DATABASE_URL
npm run db:studio          # browse the DB visually

npm run seed                # insert fake articles + a digest for "today", for offline UI work
npm run test-ingest         # run the real ingest pipeline (NewsData.io + Claude) end-to-end, no HTTP/cron auth needed
INGEST_DRY_RUN=true npm run test-ingest   # same, but no DB writes and no Claude calls — just validates NewsData.io queries
```

No test suite exists. `npx tsc --noEmit` and `npx eslint .` are the correctness gates before committing.

Local secrets live in `.env` (gitignored, and also `.vercelignore`d — see Deployment below). Copy from `.env.example`.

**⚠️ There is no dev/prod database split.** Local `.env`'s `DATABASE_URL` and Vercel's production `DATABASE_URL` point at the *same* Neon database (verified: identical host + `neondb` name). `npm run seed` and `npm run test-ingest` write directly to what the live site reads. Concretely this has already caused a real incident: seed data landed in production, and a schema migration applied locally (`npm run db:migrate`) went live against the shared DB while the *old* code was still deployed — the mismatch made production's ISR revalidation fail silently every 5 minutes, so it kept serving an increasingly stale cached page instead of erroring visibly. If you run a migration or seed script locally, get the corresponding code deployed promptly, and clean up any seed rows (`dedupeKey LIKE 'seed:%'`) when done experimenting.

## Architecture

### Ingestion pipeline

One flow, four stages, called in order from `app/api/cron/daily-ingest/route.ts` (also invokable directly via `scripts/test-ingest.ts` without going through HTTP):

1. **`lib/ingest/fetchArticles.ts`** — queries NewsData.io across `lib/newsdata/queries.ts`'s `QUERY_PLAN` (geographic batches × keyword groups), dedupes in-memory by a normalized-URL hash (`lib/hash.ts`), skips NewsData's own `duplicate`-flagged syndication copies, and inserts new rows (`ON CONFLICT DO NOTHING` on `dedupeKey`).
2. **`lib/ingest/summarizeAndTag.ts`** — for each newly-inserted article, calls Claude (structured output via Zod, see `lib/anthropic/schemas.ts` + `lib/anthropic/prompts.ts`) to get `{ isRelevant, summary, tags }`. **Articles judged not relevant are deleted, not stored.** This exists because NewsData.io's keyword search (`chip`, `fab`, `ARM`, `Intel`, ...) is a loose match against ordinary English words/ambiguous company names and returns a lot of false positives (agriculture, gambling, unrelated market roundups) — the AI relevance check is the real filter, not the search query. If you're debugging "why didn't article X show up", check whether it got dropped here before assuming an ingestion bug.
3. **`lib/ingest/generateDigest.ts`** — one Claude call over the day's summarized articles, producing exactly 5 digest bullets plus an AI-picked `leadArticleId` (the homepage hero story). Upserts into `daily_digests` keyed by `digestDate`.
4. **`lib/ingest/cleanupOldArticles.ts`** — deletes articles with `fetchedAt` older than `RETENTION_DAYS` (60, in `lib/dates.ts`). Retention is measured from **when we fetched it**, not `publishedAt`.

NewsData.io's `q` param has a hard **100-character limit** (returns `UnsupportedQueryLength` past that, discovered empirically, not in their public docs) — that's why keywords are split into multiple short OR-groups (`CORE_KEYWORDS` / `COMPANY_KEYWORDS` / `EMERGING_INFRA_KEYWORDS` / `EMERGING_CHIP_KEYWORDS` in `lib/newsdata/queries.ts`) run as separate queries instead of one big list. `QUERY_PLAN` is currently 12 requests/run (3 geo batches × 4 keyword groups), against a `NEWSDATA_MAX_REQUESTS_PER_RUN` budget of 15 (both locally and in prod) — `fetchArticles.ts` does exactly one request per `QUERY_PLAN` entry, no pagination, so that's the real per-run cost. Only 3 requests of headroom left; adding another keyword group means either raising the budget or trimming an existing one.

The `COMPANY_KEYWORDS` list only covers ~6 mega-caps by design — smaller-but-real companies (e.g. Lumentum, Nebius, Astera Labs) were missing from the site entirely not because NewsData.io's sources don't cover them (verified via live API testing: mainstream financial press covers most of them fine) but because nothing in `QUERY_PLAN` was ever asking for them by name. If a company still doesn't show up after being added to a keyword group, check whether NewsData.io actually returns *any* results for that exact name before assuming an ingestion bug — some very early-stage/private companies (e.g. Xscape Photonics) genuinely have zero coverage in NewsData's source pool.

### Day bucketing

Everything buckets articles by **`fetchedAt`'s UTC calendar day**, not `publishedAt` — `lib/articles.ts`'s `getArticlesFetchedOn(dateKey)` is the core query, used by both the homepage and `/articles/[date]`. `lib/dayData.ts`'s `getDayData()` wraps it with a fallback: if "today" has no articles yet (cron hasn't run), it falls back to the most recent day that does, so the homepage is never empty by default. Date-specific pages (`/articles/[date]`) skip that fallback and 404 outside the retention window.

`lib/dates.ts`'s `todayKey()` computes this via `new Date().toISOString().slice(0, 10)` — genuinely UTC, no ambient-timezone dependency, unlike `date-fns`'s `format()` which uses the local runtime timezone. (This used to be a real bug: `todayKey()` claimed UTC in its doc comment but used local-timezone `format()`, which only happened to agree with the DB on Vercel because its runtime defaults to UTC — it silently disagreed on any non-UTC dev machine, especially in the evening local time after UTC midnight had already ticked over.) The SQL day-range comparisons in `getArticlesFetchedOn()` and `generateDigest()` force UTC explicitly too (`(dateKey || 'T00:00:00Z')::timestamptz`) rather than relying on Postgres's session timezone happening to be UTC. `isWithinRetention()` does a plain string comparison between `yyyy-MM-dd` keys (valid since ISO date strings sort lexicographically the same as chronologically) but still validates real calendar correctness via `isValid(parseISO(key))` first — a pure string-range check alone would accept a non-existent date like `2026-06-31` and crash the SQL cast downstream instead of 404ing.

### Digest bullets link to their source article

`dailyDigests.bullets` is `jsonb` (`DigestBulletRecord[]` in `lib/db/schema.ts`, `{ text, articleId }`), not a plain `text[]` — Claude's structured digest output (`DigestResultSchema` in `lib/anthropic/schemas.ts`) pairs each bullet with the id of the article it's about, validated in `generateDigest.ts` against that day's candidate articles (falls back to `articleId: null` if the model returns something not in the candidate set, mirroring the existing `leadArticleId` validation). `getDayData()` resolves each bullet's `articleId` into a `url` using articles it's already loaded into memory (no extra query) — see `DigestBullet` type in `components/home/DigestSidebar.tsx`.

Clicking a bullet in `DigestSidebar` (a client component) looks for `[data-article-id="<id>"]` on the page (every `ArticleCard` carries this attribute) and, if found, scroll-jumps to and briefly rings-highlights it instead of navigating; if the article isn't rendered anywhere on the current page (the digest draws from up to 40 candidates, but only the day's top-15 tags get carousels), the bullet is a normal external link and just opens the article. Bullets with no resolved `articleId`/`url` (historical digests generated before this feature existed) render as plain unlinked text.

**Migration gotcha**: converting `bullets` from `text[]` to `jsonb` couldn't use a plain `ALTER COLUMN ... TYPE jsonb USING (...)` — Postgres rejects a subquery (needed for the `unnest`/`jsonb_agg` transform) inside a column `USING` transform expression. The working pattern (see `db/migrations/0001_even_lake.sql`) is add a new nullable column → `UPDATE` it via a correlated subquery (subqueries *are* allowed in `UPDATE ... SET`) → `SET NOT NULL` → drop the old column → rename. Worth remembering for any future column type change that needs a non-trivial per-row transform.

### AI-provenance tooltip

Each `ArticleCard`'s summary has a small sparkle icon (`components/home/AiSummaryTooltip.tsx`) that shows the full, untruncated AI summary in a tooltip on hover/focus — the visible `<p>` is `line-clamp`ed, so this is the only way to read a long summary without leaving the page. Built on a new `components/ui/tooltip.tsx` (Base UI wrapper, same pattern as `popover.tsx`), with a `TooltipProvider` in `app/layout.tsx` for shared open/close delay grouping across the whole page.

**RSC gotcha**: `ArticleCard` is a Server Component. `AiSummaryTooltip` has to be its own separate `"use client"` component — an inline `onClick` handler constructed directly inside `ArticleCard`'s JSX (even just to `preventDefault()` the trigger span from bubbling into the card's outer `<Link>`) throws "Event handlers cannot be passed to Client Component props" at render time. This isn't a one-off render error either: it took the whole dev server down, stuck retrying the same failing render in a tight loop (visible in `.next/dev/logs/next-development.log`) until the code was fixed — a good reminder to check that log file directly (rather than assuming a hung `next dev` is a slow recompile) when a page or the whole server goes unresponsive.

### Tag taxonomy

`lib/taxonomy.ts` is the single source of truth for the ~20 fixed tags — reused by the Claude structured-output schema (`ArticleAnalysisSchema`), the frontend theme row, and the options-menu tag list. The homepage's "top themes" row (`ThemeRow` + `lib/tagCounts.ts`) picks the top 15 tags by count **in-memory** from that day's already-fetched articles (not a separate SQL query) — see `lib/dayData.ts`. The row's pills no longer show a count, just the tag name (removed since it read as "today's count" but users expected it to mean the whole archive). Each tag in that row gets its own `TagCarousel` below, anchored at `#tag-<slug>` (`tagSlug()` in `lib/taxonomy.ts`); the options-menu tag links and theme-row pills both navigate to that anchor.

### Company/entity tracking

Unlike tags, `articles.companies` (`text[]`, GIN-indexed) is **not** a fixed taxonomy — Claude extracts company/organization names per article during `summarizeAndTag.ts` (same call as tags/summary, see `ArticleAnalysisSchema.companies` + the suggested-names list in `ARTICLE_SYSTEM_PROMPT`), free-form but nudged toward consistent short names ("TSMC" not "Taiwan Semiconductor Manufacturing Company"). `getDistinctCompanies()` (`lib/articles.ts`) powers the `/archive` company filter by `unnest`-ing the array — **the raw `sql` template needs `.as("company")` explicitly**, since Drizzle doesn't auto-alias raw SQL select columns the way it does plain column references; without it, `ORDER BY company` 500s with "column does not exist" (an easy mistake to repeat if adding another `unnest`-based distinct-values query later). No backfill on existing rows when this shipped — it only populates going forward as articles get (re-)ingested.

**Gotcha**: the prompt asks for "0-5" companies, but `ArticleAnalysisSchema.companies`'s Zod `.max()` is intentionally set to a generous 15, not 5 — a broad market-roundup article can legitimately name more than 5 companies, and a hard `.max(5)` there previously caused a *complete structured-output parse failure* (the whole article silently lost, not just the extra names) whenever Claude went over. The real 5-item cap is enforced defensively after the fact in `summarizeAndTag.ts` (`analysis.companies.slice(0, 5)`). Don't tighten the schema max back down to match the prompt's guidance number — that reintroduces the failure mode. This same pattern (schema ceiling ≠ enforced cap, truncate in code instead of validating strictly) is worth reusing for any other array field an LLM is asked to bound.

### Archive: browsing beyond one day

`getDayData()` (`lib/dayData.ts`) pads each tag's carousel past today's articles with up to `EXTRA_ARCHIVE_ARTICLES_PER_TAG` (10) older ones pulled from `getArchiveArticles()` (`lib/articles.ts`), offset by however many the tag already has today — since both queries sort `publishedAt desc`, this padding is exactly the *next* older articles for that tag, not a duplicate of what's already shown. `TagCarousel` receives the merged list plus `todayCount` (for the "N stories today" header, now distinct from the carousel's total item count) and `hasMoreInArchive`; when true, the carousel ends with a "View all {tag} articles" card linking to `/archive?tag=<tag>`.

`/archive` (`app/archive/page.tsx`) is the standalone full-archive page: a flat, reverse-chronological grid (not day-grouped) over every retained article, filterable by tag, source, and/or company via `ArchiveFilters`, with client-side "Load more" pagination (`ArchiveGrid`) backed by `GET /api/archive`. `getArchiveArticles()` avoids a separate `COUNT(*)` query by over-fetching `limit + 1` rows and slicing — `hasMore` is just `rows.length > limit`. Linked from the Options/Browse menu (`OptionsMenu.tsx`).

**Gotcha:** `ArchiveGrid` fetches JSON from `/api/archive`, so `publishedAt`/`fetchedAt`/`createdAt`/`updatedAt` arrive as ISO strings, not `Date` objects — `ArticleCard` calls `.toISOString()` directly on `publishedAt`, so the fetched rows must be revived into real `Date`s before being appended to state (see `reviveArticleDates` in `ArchiveGrid.tsx`) or it throws at render time.

### Lazy client initialization

`lib/db/index.ts` and `lib/anthropic/client.ts` construct their clients lazily (a `Proxy` for `db`, a memoized getter `getAnthropicClient()` for Claude) instead of throwing at module import time when an env var is missing. This matters because Next.js route modules import the whole dependency graph eagerly — a top-level throw in `lib/anthropic/client.ts` used to crash the cron route's auth check itself (returning 500 instead of 401) whenever `ANTHROPIC_API_KEY` was unset, even though that route path never touches Claude. Keep new server-only clients lazy for the same reason.

### Search

Postgres full-text search, not an external service — `articles.searchVector` is a **generated `tsvector` column** (see the `GENERATED ALWAYS AS ... STORED` in the Drizzle schema / migration), weighted title > summary > snippet, with a GIN index. `lib/search.ts` queries it via `ts_rank` + `plainto_tsquery`.

`components/search/SearchBar.tsx` renders two responsive branches internally (no changes needed in `SiteHeader.tsx`, same pattern as `DateNav`/`OptionsMenu`'s icon-vs-label swap): the always-visible desktop form (focusable via a `/` keyboard shortcut, ignored while already typing in an input/textarea), and below `sm` a magnifying-glass icon that expands into a `fixed` full-width overlay instead of being hidden entirely. Desktop and mobile use separate refs — they're different DOM nodes that can both be mounted depending on viewport.

**Testing gotcha**: the Chrome automation tooling (`claude-in-chrome`) has repeatedly shown false negatives on this specific Suspense-wrapped component and on the custom `Select` dropdowns below — simulated clicks/keypresses sometimes don't register or the popup won't stay open for a screenshot, even though a manual `.click()` via `javascript_tool` or the real user confirms it works fine. If browser automation says search or a dropdown is broken, verify with the user directly before concluding it's a real bug.

### Design system

Tokens live in `app/globals.css` (`--brand`, `--brand-orange`/`--brand-orange-foreground`, `--header-background`, `--surface`, etc.), registered into Tailwind v4 via `@theme inline`. Dark mode is `next-themes` class-based (`.dark` overrides in the same file) — toggle in `components/layout/ThemeToggle.tsx`. Headings use `font-heading` (Space Grotesk), body uses `font-body` (Inter), both wired via `next/font` in `app/layout.tsx`.

`--brand-orange` (paired with `--brand-orange-foreground` for accessible contrast — plain white text on it fails AA) is used exactly once: the "Top Story" badge on the homepage hero's `ArticleCard` (`size="featured"`). Keep it that single-purpose/restrained; an `/impeccable` critique flagged generic uppercase-tracked "eyebrow" labels as an AI-slop tell, so section labels (`DigestSidebar`, `ThemeRow`) intentionally use normal-case text instead of that convention — don't reintroduce it.

`TagCarousel`'s Embla `opts` use responsive `breakpoints` so the next/prev arrows page by however many cards are actually visible at that width (`slidesToScroll: 3/4/5` matching the `basis-1/3`/`1/4`/`1/5` breakpoints), with `dragFree: true` below `sm` for continuous touch-scroll instead of snapping one card at a time. Keep `slidesToScroll` in sync with the `CarouselItem` basis classes if either changes.

**Dropdowns are a custom `components/ui/select.tsx` (Base UI `Select`), not native `<select>`.** `:root`/`.dark` in `globals.css` do set `color-scheme: light`/`dark` (lets the browser render other native form-control chrome — scrollbars etc. — in the right theme), but that alone was **not sufficient** for native `<select>` dropdown *popups* specifically — cross-browser support for `color-scheme` affecting the open option-list background is inconsistent, and it shipped still unreadable in dark mode. `ArchiveFilters.tsx`'s three filters were rewritten onto the custom `Select` for full style control, following the same Portal/Positioner/Popup pattern as `popover.tsx`/`tooltip.tsx`. If a future native `<select>`/`<option>` gets added anywhere, don't assume `color-scheme` alone fixes its dark-mode popup — it may not.

## Environment variables

See `.env.example` (itself gitignored via the repo's `.env*` pattern — it's a local reference only, not committed, so don't expect `git diff` to show edits to it). Required for anything beyond `npm run seed` + browsing seeded data: `DATABASE_URL` (Neon), `ANTHROPIC_API_KEY`, `NEWSDATA_API_KEY`, `CRON_SECRET`. Models default to `claude-sonnet-5` via `ANTHROPIC_ARTICLE_MODEL` / `ANTHROPIC_DIGEST_MODEL` (switched down from `claude-opus-4-8` to cut ingestion cost — validated via a real `test-ingest` run that summary/tag/company-extraction quality holds up fine on Sonnet).

## Deployment

Deployed via the **Vercel CLI directly** (`vercel --prod --yes`), not just git push — though the project *is* also git-connected (pushing to `master` triggers a build too). A few non-obvious things learned the hard way:

- **`.vercelignore` excludes `.env`** — without it, `vercel --prod` uploads the whole working directory (not just git-tracked files) and bundles your local `.env` into the build source. Vercel's own env vars still take precedence at runtime, but don't remove that ignore file.
- The production domain (`nitin-semicon-digest.vercel.app`) is registered as a real **Project Domain** (Settings → Domains in the dashboard), not a CLI-set alias. That distinction matters twice: (1) only real Domains auto-follow every new production deployment — a bare `vercel alias set` has to be re-run manually after each deploy; (2) only real Domains are exempt from the project's `ssoProtection: all_except_custom_domains` setting — a CLI-only alias redirects visitors to a Vercel login page.
- `vercel.json` schedules the cron at `0 11 * * *` (11:00 UTC daily) hitting `/api/cron/daily-ingest`, authenticated via `Authorization: Bearer $CRON_SECRET`.
- If production looks stuck serving stale content (check response headers for `X-Vercel-Cache: STALE` with a large `Age`), suspect a DB schema change applied ahead of deployed code — see the shared-database warning above. Deploying the matching code is usually the fix.
- **Vercel's production environment variables explicitly pin `ANTHROPIC_ARTICLE_MODEL`/`ANTHROPIC_DIGEST_MODEL`** (and likely others) rather than relying on the code defaults in `lib/anthropic/client.ts` — changing a default there does *nothing* in production until the matching Vercel env var is also updated (`vercel env rm <NAME> production` then `vercel env add <NAME> production`). Check `vercel env pull` before assuming a code-level default change took effect live.
