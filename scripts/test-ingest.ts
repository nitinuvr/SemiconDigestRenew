/**
 * Runs the ingest pipeline stages directly (no HTTP, no CRON_SECRET) for
 * fast iteration on NewsData.io queries / Claude prompts.
 *
 * Usage:
 *   npm run test-ingest                # full run
 *   INGEST_DRY_RUN=true npm run test-ingest   # no DB writes, no summarize/digest calls
 */
import "dotenv/config";
import { todayKey } from "../lib/dates";
import { cleanupOldArticles } from "../lib/ingest/cleanupOldArticles";
import { fetchArticles } from "../lib/ingest/fetchArticles";
import { generateDigest } from "../lib/ingest/generateDigest";
import { summarizeAndTag } from "../lib/ingest/summarizeAndTag";

async function main() {
  console.log("=== fetchArticles ===");
  const newArticles = await fetchArticles();
  console.log(`Fetched ${newArticles.length} new articles.`);

  console.log("=== summarizeAndTag ===");
  await summarizeAndTag(newArticles);

  console.log("=== generateDigest ===");
  await generateDigest(todayKey());

  console.log("=== cleanupOldArticles ===");
  await cleanupOldArticles();

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
