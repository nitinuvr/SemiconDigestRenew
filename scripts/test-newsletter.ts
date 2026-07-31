/**
 * Runs the weekly newsletter generator directly (no HTTP, no CRON_SECRET)
 * for fast iteration on the prompt/rendering without waiting for Monday.
 *
 * Usage:
 *   npm run test-newsletter                # full run (creates a real Buttondown draft)
 *   INGEST_DRY_RUN=true npm run test-newsletter   # no Anthropic/Buttondown calls
 */
import "dotenv/config";
import { generateWeeklyNewsletter } from "../lib/newsletter/generateWeeklyNewsletter";

async function main() {
  console.log("=== generateWeeklyNewsletter ===");
  console.log(await generateWeeklyNewsletter());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
