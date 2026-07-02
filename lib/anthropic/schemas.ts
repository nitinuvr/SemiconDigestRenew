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
});

export type ArticleAnalysis = z.infer<typeof ArticleAnalysisSchema>;

export const DigestResultSchema = z.object({
  bullets: z
    .array(z.string())
    .length(5)
    .describe(
      "Exactly 5 bullet points summarizing the most important semiconductor news of the day, each a single self-contained sentence.",
    ),
  leadArticleId: z
    .string()
    .describe(
      "The id of the single most important/newsworthy article today, to feature as the homepage lead story.",
    ),
});

export type DigestResult = z.infer<typeof DigestResultSchema>;
