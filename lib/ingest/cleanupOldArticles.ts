import { lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { RETENTION_DAYS } from "@/lib/dates";

/**
 * Deletes articles fetched more than RETENTION_DAYS ago. Cutoff is on
 * fetchedAt (when we ingested it), not publishedAt, per the retention
 * requirement ("older than 2 months from when they were fetched").
 */
export async function cleanupOldArticles() {
  const dryRun = process.env.INGEST_DRY_RUN === "true";

  if (dryRun) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(lt(articles.fetchedAt, sql`now() - interval '${sql.raw(String(RETENTION_DAYS))} days'`));
    console.log(`[cleanupOldArticles] dry run — would delete ${count} articles`);
    return;
  }

  const deleted = await db
    .delete(articles)
    .where(lt(articles.fetchedAt, sql`now() - interval '${sql.raw(String(RETENTION_DAYS))} days'`))
    .returning({ id: articles.id });

  console.log(`[cleanupOldArticles] deleted ${deleted.length} articles older than ${RETENTION_DAYS} days`);
}
