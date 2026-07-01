import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, type Article } from "@/lib/db/schema";

/**
 * Full-text search over retained (<=60 day) articles, ranked by
 * ts_rank against the generated search_vector column.
 */
export async function searchArticles(query: string, limit = 30): Promise<Article[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const rows = await db
    .select()
    .from(articles)
    .where(
      sql`${articles.searchVector} @@ plainto_tsquery('english', ${trimmed})`,
    )
    .orderBy(
      sql`ts_rank(${articles.searchVector}, plainto_tsquery('english', ${trimmed})) desc`,
    )
    .limit(limit);

  return rows;
}
