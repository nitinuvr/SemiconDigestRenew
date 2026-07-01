CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dedupe_key" text NOT NULL,
	"source_name" text NOT NULL,
	"source_country" text,
	"category" text,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"image_url" text,
	"content_snippet" text,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ai_summary" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(ai_summary, '')), 'B') || setweight(to_tsvector('english', coalesce(content_snippet, '')), 'C')) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"digest_date" date NOT NULL,
	"bullets" text[] NOT NULL,
	"article_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"lead_article_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "articles_dedupe_key_idx" ON "articles" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "articles_tags_gin_idx" ON "articles" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "articles_search_vector_gin_idx" ON "articles" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "articles_fetched_at_idx" ON "articles" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_digests_date_idx" ON "daily_digests" USING btree ("digest_date");