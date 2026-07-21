import { z } from "zod";
import { TAXONOMY } from "@/lib/taxonomy";

export const ArticleAnalysisSchema = z.object({
  isRelevant: z
    .boolean()
    .describe(
      "Whether this article is actually about the semiconductor industry (or directly adjacent AI/compute infrastructure) as defined in the system prompt, as opposed to only incidentally matching a search keyword.",
    ),
  summary: z
    .string()
    .describe(
      "A neutral, information-dense 2-3 sentence summary of the article, suitable for a news digest reader who won't click through. If isRelevant is false, a one-sentence note on why it doesn't belong is fine.",
    ),
  tags: z
    .array(z.enum(TAXONOMY))
    .max(4)
    .describe(
      "1-4 tags from the fixed taxonomy that best characterize this article's subject matter. Leave empty if isRelevant is false.",
    ),
  companies: z
    .array(z.string())
    // Generous ceiling, not the real cap — a broad market-roundup article
    // can legitimately name more than 5 companies. The model is asked for
    // 0-5, but a hard .max(5) here would throw and drop the whole article
    // on any overshoot instead of gracefully truncating; the real 5-item
    // cap is enforced defensively in summarizeAndTag.ts via .slice(0, 5).
    .max(15)
    .describe(
      "Company/organization names explicitly and substantively discussed in the article (not incidental mentions), most important first — aim for 0-5. Prefer common short names (\"TSMC\", \"Samsung\", \"Nvidia\") over full legal names. Empty if isRelevant is false or no specific company is central to the story.",
    ),
});

export type ArticleAnalysis = z.infer<typeof ArticleAnalysisSchema>;

export const DigestResultSchema = z.object({
  bullets: z
    .array(
      z.object({
        text: z
          .string()
          .describe("A single self-contained sentence summarizing the story."),
        articleId: z
          .string()
          .describe(
            "The id (from the ids given) of the article this bullet is primarily about.",
          ),
      }),
    )
    .length(5)
    .describe(
      "Exactly 5 bullet points summarizing the most important semiconductor news of the day, each paired with the id of the article it's about.",
    ),
  leadArticleId: z
    .string()
    .describe(
      "The id of the single most important/newsworthy article today, to feature as the homepage lead story.",
    ),
});

export type DigestResult = z.infer<typeof DigestResultSchema>;
