ALTER TABLE "daily_digests" ADD COLUMN "bullets_new" jsonb;
--> statement-breakpoint
UPDATE "daily_digests" SET "bullets_new" = COALESCE(
  (SELECT jsonb_agg(jsonb_build_object('text', b, 'articleId', NULL)) FROM unnest("bullets") AS b),
  '[]'::jsonb
);
--> statement-breakpoint
ALTER TABLE "daily_digests" ALTER COLUMN "bullets_new" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "daily_digests" DROP COLUMN "bullets";
--> statement-breakpoint
ALTER TABLE "daily_digests" RENAME COLUMN "bullets_new" TO "bullets";
