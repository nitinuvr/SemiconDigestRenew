import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, dailyDigests, type Article } from "@/lib/db/schema";

/** All articles ingested on the given calendar day (UTC), newest published first. */
export async function getArticlesFetchedOn(dateKey: string): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(
      and(
        gte(articles.fetchedAt, sql`${dateKey}::date`),
        lt(articles.fetchedAt, sql`(${dateKey}::date + interval '1 day')`),
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
    .select({ day: sql<string>`to_char(${articles.fetchedAt}, 'YYYY-MM-DD')` })
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
