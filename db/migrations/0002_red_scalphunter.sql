ALTER TABLE "articles" ADD COLUMN "companies" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
CREATE INDEX "articles_companies_gin_idx" ON "articles" USING gin ("companies");