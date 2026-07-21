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

## Architecture

### Ingestion pipeline

One flow, four stages, called in order from `app/api/cron/daily-ingest/route.ts` (also invokable directly via `scripts/test-ingest.ts` without going through HTTP):

1. **`lib/ingest/fetchArticles.ts`** — queries NewsData.io across `lib/newsdata/queries.ts`'s `QUERY_PLAN` (geographic batches × keyword groups), dedupes in-memory by a normalized-URL hash (`lib/hash.ts`), skips NewsData's own `duplicate`-flagged syndication copies, and inserts new rows (`ON CONFLICT DO NOTHING` on `dedupeKey`).
2. **`lib/ingest/summarizeAndTag.ts`** — for each newly-inserted article, calls Claude (structured output via Zod, see `lib/anthropic/schemas.ts` + `lib/anthropic/prompts.ts`) to get `{ isRelevant, summary, tags }`. **Articles judged not relevant are deleted, not stored.** This exists because NewsData.io's keyword search (`chip`, `fab`, `ARM`, `Intel`, ...) is a loose match against ordinary English words/ambiguous company names and returns a lot of false positives (agriculture, gambling, unrelated market roundups) — the AI relevance check is the real filter, not the search query. If you're debugging "why didn't article X show up", check whether it got dropped here before assuming an ingestion bug.
3. **`lib/ingest/generateDigest.ts`** — one Claude call over the day's summarized articles, producing exactly 5 digest bullets plus an AI-picked `leadArticleId` (the homepage hero story). Upserts into `daily_digests` keyed by `digestDate`.
4. **`lib/ingest/cleanupOldArticles.ts`** — deletes articles with `fetchedAt` older than `RETENTION_DAYS` (60, in `lib/dates.ts`). Retention is measured from **when we fetched it**, not `publishedAt`.

NewsData.io's `q` param has a hard **100-character limit** (returns `UnsupportedQueryLength` past that, discovered empirically, not in their public docs) — that's why keywords are split into multiple short OR-groups (`CORE_KEYWORDS` / `COMPANY_KEYWORDS` in `lib/newsdata/queries.ts`) run as separate queries instead of one big list.

### Day bucketing

Everything buckets articles by **`fetchedAt`'s UTC calendar day**, not `publishedAt` — `lib/articles.ts`'s `getArticlesFetchedOn(dateKey)` is the core query, used by both the homepage and `/articles/[date]`. `lib/dayData.ts`'s `getDayData()` wraps it with a fallback: if "today" has no articles yet (cron hasn't run), it falls back to the most recent day that does, so the homepage is never empty by default. Date-specific pages (`/articles/[date]`) skip that fallback and 404 outside the retention window.

### Tag taxonomy

`lib/taxonomy.ts` is the single source of truth for the ~20 fixed tags — reused by the Claude structured-output schema (`ArticleAnalysisSchema`), the frontend theme row, and the options-menu tag list. The homepage's "top themes" row (`ThemeRow` + `lib/tagCounts.ts`) picks the top 15 tags by count **in-memory** from that day's already-fetched articles (not a separate SQL query) — see `lib/dayData.ts`. The row's pills no longer show a count, just the tag name (removed since it read as "today's count" but users expected it to mean the whole archive). Each tag in that row gets its own `TagCarousel` below, anchored at `#tag-<slug>` (`tagSlug()` in `lib/taxonomy.ts`); the options-menu tag links and theme-row pills both navigate to that anchor.

### Archive: browsing beyond one day

`getDayData()` (`lib/dayData.ts`) pads each tag's carousel past today's articles with up to `EXTRA_ARCHIVE_ARTICLES_PER_TAG` (10) older ones pulled from `getArchiveArticles()` (`lib/articles.ts`), offset by however many the tag already has today — since both queries sort `publishedAt desc`, this padding is exactly the *next* older articles for that tag, not a duplicate of what's already shown. `TagCarousel` receives the merged list plus `todayCount` (for the "N stories today" header, now distinct from the carousel's total item count) and `hasMoreInArchive`; when true, the carousel ends with a "View all {tag} articles" card linking to `/archive?tag=<tag>`.

`/archive` (`app/archive/page.tsx`) is the standalone full-archive page: a flat, reverse-chronological grid (not day-grouped) over every retained article, filterable by tag and/or source via `ArchiveFilters` (plain `<select>`s — no shadcn `Select` primitive exists in this repo, so don't reach for one for a single page), with client-side "Load more" pagination (`ArchiveGrid`) backed by `GET /api/archive`. `getArchiveArticles()` avoids a separate `COUNT(*)` query by over-fetching `limit + 1` rows and slicing — `hasMore` is just `rows.length > limit`. Linked from the Options/Browse menu (`OptionsMenu.tsx`).

**Gotcha:** `ArchiveGrid` fetches JSON from `/api/archive`, so `publishedAt`/`fetchedAt`/`createdAt`/`updatedAt` arrive as ISO strings, not `Date` objects — `ArticleCard` calls `.toISOString()` directly on `publishedAt`, so the fetched rows must be revived into real `Date`s before being appended to state (see `reviveArticleDates` in `ArchiveGrid.tsx`) or it throws at render time.

### Lazy client initialization

`lib/db/index.ts` and `lib/anthropic/client.ts` construct their clients lazily (a `Proxy` for `db`, a memoized getter `getAnthropicClient()` for Claude) instead of throwing at module import time when an env var is missing. This matters because Next.js route modules import the whole dependency graph eagerly — a top-level throw in `lib/anthropic/client.ts` used to crash the cron route's auth check itself (returning 500 instead of 401) whenever `ANTHROPIC_API_KEY` was unset, even though that route path never touches Claude. Keep new server-only clients lazy for the same reason.

### Search

Postgres full-text search, not an external service — `articles.searchVector` is a **generated `tsvector` column** (see the `GENERATED ALWAYS AS ... STORED` in the Drizzle schema / migration), weighted title > summary > snippet, with a GIN index. `lib/search.ts` queries it via `ts_rank` + `plainto_tsquery`.

### Design system

Tokens live in `app/globals.css` (`--brand`, `--brand-orange`, `--header-background`, `--surface`, etc.), registered into Tailwind v4 via `@theme inline`. Dark mode is `next-themes` class-based (`.dark` overrides in the same file) — toggle in `components/layout/ThemeToggle.tsx`. Headings use `font-heading` (Space Grotesk), body uses `font-body` (Inter), both wired via `next/font` in `app/layout.tsx`.

`TagCarousel`'s Embla `opts` use responsive `breakpoints` so the next/prev arrows page by however many cards are actually visible at that width (`slidesToScroll: 3/4/5` matching the `basis-1/3`/`1/4`/`1/5` breakpoints), with `dragFree: true` below `sm` for continuous touch-scroll instead of snapping one card at a time. Keep `slidesToScroll` in sync with the `CarouselItem` basis classes if either changes.

## Environment variables

See `.env.example`. Required for anything beyond `npm run seed` + browsing seeded data: `DATABASE_URL` (Neon), `ANTHROPIC_API_KEY`, `NEWSDATA_API_KEY`, `CRON_SECRET`. Models default to `claude-opus-4-8` via `ANTHROPIC_ARTICLE_MODEL` / `ANTHROPIC_DIGEST_MODEL`.

## Deployment

Deployed via the **Vercel CLI directly** (`vercel --prod --yes`), not just git push — though the project *is* also git-connected (pushing to `master` triggers a build too). A few non-obvious things learned the hard way:

- **`.vercelignore` excludes `.env`** — without it, `vercel --prod` uploads the whole working directory (not just git-tracked files) and bundles your local `.env` into the build source. Vercel's own env vars still take precedence at runtime, but don't remove that ignore file.
- The production domain (`nitin-semicon-digest.vercel.app`) is registered as a real **Project Domain** (Settings → Domains in the dashboard), not a CLI-set alias. That distinction matters twice: (1) only real Domains auto-follow every new production deployment — a bare `vercel alias set` has to be re-run manually after each deploy; (2) only real Domains are exempt from the project's `ssoProtection: all_except_custom_domains` setting — a CLI-only alias redirects visitors to a Vercel login page.
- `vercel.json` schedules the cron at `0 11 * * *` (11:00 UTC daily) hitting `/api/cron/daily-ingest`, authenticated via `Authorization: Bearer $CRON_SECRET`.
