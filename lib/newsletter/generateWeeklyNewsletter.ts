import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { and, eq, gte, lte } from "drizzle-orm";
import { NEWSLETTER_MODEL, getAnthropicClient } from "@/lib/anthropic/client";
import { NEWSLETTER_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import { NewsletterResultSchema } from "@/lib/anthropic/schemas";
import { createDraftEmail, sendDraft } from "@/lib/buttondown/client";
import { todayKey, utcDateKey } from "@/lib/dates";
import { db } from "@/lib/db";
import { articles, dailyDigests } from "@/lib/db/schema";

const MIN_BULLETS_FOR_NEWSLETTER = 15;

type Pick = { headline: string; blurb: string; digestDate: string; articleId: string | null };

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function renderNewsletterMarkdown({
  intro,
  leadPick,
  leadImageUrl,
  otherPicks,
}: {
  intro: string;
  leadPick: Pick;
  leadImageUrl: string | null;
  otherPicks: Pick[];
}): string {
  const leadSection = [
    leadImageUrl ? `![](${leadImageUrl})` : null,
    `## ${leadPick.headline}`,
    leadPick.blurb,
    `[Read more](${siteUrl()}/articles/${leadPick.digestDate})`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const listItems = otherPicks
    .map(
      (p, i) =>
        `${i + 1}. **${p.headline}** — ${p.blurb} ([Read more](${siteUrl()}/articles/${p.digestDate}))`,
    )
    .join("\n");

  return [intro, leadSection, "---", "This week's other top stories:", listItems].join("\n\n");
}

export async function generateWeeklyNewsletter() {
  const dryRun = process.env.INGEST_DRY_RUN === "true";

  const end = todayKey();
  const start = utcDateKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  const days = await db
    .select()
    .from(dailyDigests)
    .where(and(gte(dailyDigests.digestDate, start), lte(dailyDigests.digestDate, end)));

  const totalBullets = days.reduce((sum, d) => sum + d.bullets.length, 0);

  if (totalBullets < MIN_BULLETS_FOR_NEWSLETTER) {
    console.log(
      `[generateWeeklyNewsletter] only ${totalBullets} bullets across ${days.length} days, skipping`,
    );
    return {
      skipped: true as const,
      reason: "insufficient_history" as const,
      totalBullets,
      days: days.length,
    };
  }

  const bulletsBlock = days
    .map(
      (d) =>
        `date: ${d.digestDate}\n${d.bullets
          .map((b) => `- [id: ${b.articleId ?? "none"}] ${b.text}`)
          .join("\n")}`,
    )
    .join("\n\n");

  if (dryRun) {
    console.log(
      `[generateWeeklyNewsletter] dry run — would generate newsletter from ${totalBullets} bullets across ${days.length} days`,
    );
    return { dryRun: true as const, totalBullets, days: days.length };
  }

  const validDates = new Set(days.map((d) => d.digestDate));
  const validArticleIds = new Set(
    days.flatMap((d) => d.bullets.map((b) => b.articleId).filter((id): id is string => id !== null)),
  );

  const response = await getAnthropicClient().messages.parse({
    model: NEWSLETTER_MODEL,
    max_tokens: 4096,
    system: NEWSLETTER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `This week's daily digest bullets:\n\n${bulletsBlock}`,
      },
    ],
    output_config: { format: zodOutputFormat(NewsletterResultSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("No structured newsletter output");
  }

  const { subject, intro, picks } = response.parsed_output;
  const validPicks: Pick[] = picks
    .filter((p) => validDates.has(p.digestDate))
    .map((p) => ({
      ...p,
      articleId: validArticleIds.has(p.articleId) ? p.articleId : null,
    }));

  if (validPicks.length < 3) {
    throw new Error(
      `Only ${validPicks.length} valid picks after date validation (needed >= 3) — aborting newsletter generation`,
    );
  }

  const [leadPick, ...otherPicks] = validPicks;

  let leadImageUrl: string | null = null;
  if (leadPick.articleId) {
    const [row] = await db
      .select({ imageUrl: articles.imageUrl })
      .from(articles)
      .where(eq(articles.id, leadPick.articleId))
      .limit(1);
    leadImageUrl = row?.imageUrl ?? null;
  }

  const body = renderNewsletterMarkdown({ intro, leadPick, leadImageUrl, otherPicks });
  const draft = await createDraftEmail({ subject, body });

  if (process.env.NEWSLETTER_AUTO_SEND !== "true") {
    console.log(
      `[generateWeeklyNewsletter] draft created (${draft.id}), auto-send disabled`,
    );
    return {
      drafted: true as const,
      sent: false as const,
      emailId: draft.id,
      pickCount: validPicks.length,
    };
  }

  try {
    await sendDraft(draft.id);
  } catch (err) {
    throw new Error(
      `Draft ${draft.id} was created but sendDraft failed — send it manually from the Buttondown dashboard. Original error: ${err}`,
    );
  }

  console.log(`[generateWeeklyNewsletter] draft ${draft.id} sent`);
  return {
    drafted: true as const,
    sent: true as const,
    emailId: draft.id,
    pickCount: validPicks.length,
  };
}
