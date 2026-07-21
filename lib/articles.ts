import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, dailyDigests, type Article } from "@/lib/db/schema";
import type { Tag } from "@/lib/taxonomy";

/** All articles ingested on the given calendar day (UTC), newest published first. */
export async function getArticlesFetchedOn(dateKey: string): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(
      and(
        gte(articles.fetchedAt, sql`(${dateKey} || 'T00:00:00Z')::timestamptz`),
        lt(
          articles.fetchedAt,
          sql`(${dateKey} || 'T00:00:00Z')::timestamptz + interval '1 day'`,
        ),
      ),
    )
    .orderBy(desc(articles.publishedAt));
}

export async function getDigestForDate(dateKey: string) {
  const [digest] = await db
    .select()
    .from(dailyDigests)
    .where(eq(dailyDigests.digestDate, dateKey))
    .limit(1);
  return digest ?? null;
}

export async function getArticleById(id: string): Promise<Article | null> {
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return article ?? null;
}

/** Most recent day (within retention) that actually has ingested articles. */
export async function getMostRecentIngestDate(): Promise<string | null> {
  const [row] = await db
    .select({
      day: sql<string>`to_char(${articles.fetchedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
    })
    .from(articles)
    .orderBy(desc(articles.fetchedAt))
    .limit(1);
  return row?.day ?? null;
}

/** Distinct source/publication names across all currently-retained articles. */
export async function getDistinctSources(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ sourceName: articles.sourceName })
    .from(articles)
    .orderBy(articles.sourceName);
  return rows.map((r) => r.sourceName);
}

/** Distinct company/organization names across all currently-retained articles. */
export async function getDistinctCompanies(): Promise<string[]> {
  const rows = await db
    .selectDistinct({
      company: sql<string>`unnest(${articles.companies})`.as("company"),
    })
    .from(articles)
    .orderBy(sql`company`);
  return rows.map((r) => r.company);
}

export const ARCHIVE_PAGE_SIZE = 24;

export type ArchiveFilters = { tag?: Tag; source?: string; company?: string };

/** All currently-retained articles, newest published first, optionally filtered by tag, source, and/or company. */
export async function getArchiveArticles(
  { tag, source, company }: ArchiveFilters,
  { limit = ARCHIVE_PAGE_SIZE, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<{ articles: Article[]; hasMore: boolean }> {
  const conditions = [];
  if (tag) conditions.push(sql`${articles.tags} @> ARRAY[${tag}]::text[]`);
  if (source) conditions.push(eq(articles.sourceName, source));
  if (company) conditions.push(sql`${articles.companies} @> ARRAY[${company}]::text[]`);

  const rows = await db
    .select()
    .from(articles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(limit + 1)
    .offset(offset);

  return { articles: rows.slice(0, limit), hasMore: rows.length > limit };
}
