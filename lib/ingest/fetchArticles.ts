import { db } from "@/lib/db";
import { articles, type NewArticle } from "@/lib/db/schema";
import { dedupeKeyFor } from "@/lib/hash";
import { normalizeCountry } from "@/lib/newsdata/countries";
import {
  NewsdataRequestBudget,
  NewsdataQuotaExceededError,
  fetchNewsdataPage,
  type NewsdataArticle,
} from "@/lib/newsdata/client";
import { QUERY_PLAN } from "@/lib/newsdata/queries";

function toNewArticle(a: NewsdataArticle, now: Date): NewArticle {
  return {
    dedupeKey: dedupeKeyFor(a.link),
    sourceName: a.source_name ?? a.source_id ?? "Unknown source",
    sourceCountry: normalizeCountry(a.country?.[0]),
    category: a.category?.[0] ?? null,
    title: a.title,
    url: a.link,
    imageUrl: a.image_url ?? null,
    contentSnippet: a.description ?? a.content ?? null,
    publishedAt: new Date(a.pubDate.replace(" ", "T") + "Z"),
    fetchedAt: now,
    aiSummary: null,
    tags: [],
  };
}

/**
 * Queries NewsData.io across the configured geographic/keyword batches,
 * dedupes in-memory and at the DB level, and inserts new articles.
 * Returns only the articles that were newly inserted (need AI processing).
 */
export async function fetchArticles() {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) throw new Error("NEWSDATA_API_KEY is not set");

  const dryRun = process.env.INGEST_DRY_RUN === "true";
  const budget = new NewsdataRequestBudget(
    Number(process.env.NEWSDATA_MAX_REQUESTS_PER_RUN ?? 15),
  );

  const now = new Date();
  const byDedupeKey = new Map<string, NewArticle>();

  for (const query of QUERY_PLAN) {
    if (!budget.tryConsume()) {
      console.warn(
        `[fetchArticles] request budget exhausted before query "${query.label}"`,
      );
      break;
    }
    try {
      const { articles: results } = await fetchNewsdataPage(query, apiKey);
      for (const raw of results) {
        if (raw.duplicate) continue;
        const candidate = toNewArticle(raw, now);
        if (!byDedupeKey.has(candidate.dedupeKey)) {
          byDedupeKey.set(candidate.dedupeKey, candidate);
        }
      }
      console.log(
        `[fetchArticles] query "${query.label}" returned ${results.length} articles`,
      );
    } catch (err) {
      if (err instanceof NewsdataQuotaExceededError) {
        console.warn(`[fetchArticles] ${err.message} — stopping further queries`);
        break;
      }
      // A single failed query shouldn't fail the whole run.
      console.error(`[fetchArticles] query "${query.label}" failed:`, err);
    }
  }

  const candidates = Array.from(byDedupeKey.values());
  if (candidates.length === 0) return [];

  if (dryRun) {
    console.log(
      `[fetchArticles] dry run — would insert ${candidates.length} candidate articles`,
    );
    return [];
  }

  const inserted = await db
    .insert(articles)
    .values(candidates)
    .onConflictDoNothing({ target: articles.dedupeKey })
    .returning();

  console.log(
    `[fetchArticles] inserted ${inserted.length} new articles (${candidates.length} candidates after dedupe)`,
  );

  return inserted;
}
