import pLimit from "p-limit";
import { eq } from "drizzle-orm";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ARTICLE_MODEL, getAnthropicClient } from "@/lib/anthropic/client";
import { ARTICLE_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import { ArticleAnalysisSchema } from "@/lib/anthropic/schemas";
import { db } from "@/lib/db";
import { articles, type Article } from "@/lib/db/schema";

const CONCURRENCY = 5;

async function analyzeOne(article: Article) {
  const userContent = [
    `Title: ${article.title}`,
    `Source: ${article.sourceName}`,
    article.contentSnippet ? `Excerpt: ${article.contentSnippet}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await getAnthropicClient().messages.parse({
    model: ARTICLE_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: ARTICLE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(ArticleAnalysisSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`No structured output for article ${article.id}`);
  }

  return response.parsed_output;
}

/**
 * Summarizes + tags every newly-fetched article. Articles the model judges
 * not actually relevant to semiconductors (keyword-search false positives —
 * see ARTICLE_SYSTEM_PROMPT) are deleted rather than stored, since NewsData.io's
 * keyword search alone is too loose to trust as a relevance filter.
 */
export async function summarizeAndTag(newArticles: Article[]) {
  if (newArticles.length === 0) return;

  const limit = pLimit(CONCURRENCY);
  const dryRun = process.env.INGEST_DRY_RUN === "true";

  let kept = 0;
  let dropped = 0;
  let failed = 0;

  await Promise.all(
    newArticles.map((article) =>
      limit(async () => {
        try {
          const analysis = await analyzeOne(article);
          if (dryRun) {
            if (analysis.isRelevant) kept += 1;
            else dropped += 1;
            return;
          }

          if (!analysis.isRelevant) {
            await db.delete(articles).where(eq(articles.id, article.id));
            dropped += 1;
            return;
          }

          await db
            .update(articles)
            .set({
              aiSummary: analysis.summary,
              tags: analysis.tags,
              updatedAt: new Date(),
            })
            .where(eq(articles.id, article.id));
          kept += 1;
        } catch (err) {
          failed += 1;
          console.error(
            `[summarizeAndTag] failed for article ${article.id} (${article.title}):`,
            err,
          );
        }
      }),
    ),
  );

  console.log(
    `[summarizeAndTag] ${kept} kept, ${dropped} dropped as irrelevant, ${failed} failed out of ${newArticles.length}`,
  );
}
