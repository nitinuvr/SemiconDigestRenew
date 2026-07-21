import { and, gte, isNotNull, lt, sql } from "drizzle-orm";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DIGEST_MODEL, getAnthropicClient } from "@/lib/anthropic/client";
import { DIGEST_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import { DigestResultSchema } from "@/lib/anthropic/schemas";
import { db } from "@/lib/db";
import { articles, dailyDigests } from "@/lib/db/schema";

const MAX_ARTICLES_FOR_DIGEST = 40;

export async function generateDigest(dateKey: string) {
  const dryRun = process.env.INGEST_DRY_RUN === "true";

  const dayArticles = await db
    .select()
    .from(articles)
    .where(
      and(
        gte(articles.fetchedAt, sql`(${dateKey} || 'T00:00:00Z')::timestamptz`),
        lt(
          articles.fetchedAt,
          sql`(${dateKey} || 'T00:00:00Z')::timestamptz + interval '1 day'`,
        ),
        isNotNull(articles.aiSummary),
      ),
    )
    .limit(MAX_ARTICLES_FOR_DIGEST);

  if (dayArticles.length === 0) {
    console.log(`[generateDigest] no summarized articles for ${dateKey}, skipping`);
    return;
  }

  const articlesBlock = dayArticles
    .map((a) => `id: ${a.id}\ntitle: ${a.title}\nsummary: ${a.aiSummary}`)
    .join("\n\n");

  if (dryRun) {
    console.log(
      `[generateDigest] dry run — would generate digest from ${dayArticles.length} articles`,
    );
    return;
  }

  const response = await getAnthropicClient().messages.parse({
    model: DIGEST_MODEL,
    max_tokens: 2048,
    system: DIGEST_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Today's articles:\n\n${articlesBlock}`,
      },
    ],
    output_config: { format: zodOutputFormat(DigestResultSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`No structured digest output for ${dateKey}`);
  }

  const { bullets, leadArticleId } = response.parsed_output;
  const validLeadId = dayArticles.some((a) => a.id === leadArticleId)
    ? leadArticleId
    : dayArticles[0].id;
  const validatedBullets = bullets.map((b) => ({
    text: b.text,
    articleId: dayArticles.some((a) => a.id === b.articleId) ? b.articleId : null,
  }));

  await db
    .insert(dailyDigests)
    .values({
      digestDate: dateKey,
      bullets: validatedBullets,
      articleIds: dayArticles.map((a) => a.id),
      leadArticleId: validLeadId,
    })
    .onConflictDoUpdate({
      target: dailyDigests.digestDate,
      set: {
        bullets: sql`excluded.bullets`,
        articleIds: sql`excluded.article_ids`,
        leadArticleId: sql`excluded.lead_article_id`,
      },
    });

  console.log(`[generateDigest] digest saved for ${dateKey}`);
}
