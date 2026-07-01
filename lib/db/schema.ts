import { sql } from "drizzle-orm";
import {
  customType,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dedupeKey: text("dedupe_key").notNull(),
    sourceName: text("source_name").notNull(),
    sourceCountry: text("source_country"),
    category: text("category"),
    title: text("title").notNull(),
    url: text("url").notNull(),
    imageUrl: text("image_url"),
    contentSnippet: text("content_snippet"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    // Retention cutoff is measured from fetchedAt, not publishedAt.
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    aiSummary: text("ai_summary"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(ai_summary, '')), 'B') || setweight(to_tsvector('english', coalesce(content_snippet, '')), 'C')`,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("articles_dedupe_key_idx").on(table.dedupeKey),
    index("articles_tags_gin_idx").using("gin", table.tags),
    index("articles_search_vector_gin_idx").using("gin", table.searchVector),
    index("articles_fetched_at_idx").on(table.fetchedAt),
    index("articles_published_at_idx").on(table.publishedAt),
  ],
);

export const dailyDigests = pgTable(
  "daily_digests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    digestDate: date("digest_date", { mode: "string" }).notNull(),
    bullets: text("bullets").array().notNull(),
    articleIds: uuid("article_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    leadArticleId: uuid("lead_article_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("daily_digests_date_idx").on(table.digestDate)],
);

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type DailyDigest = typeof dailyDigests.$inferSelect;
export type NewDailyDigest = typeof dailyDigests.$inferInsert;
