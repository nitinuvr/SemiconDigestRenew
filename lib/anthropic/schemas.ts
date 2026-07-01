import { z } from "zod";
import { TAXONOMY } from "@/lib/taxonomy";

export const ArticleAnalysisSchema = z.object({
  summary: z
    .string()
    .describe(
      "A neutral, information-dense 2-3 sentence summary of the article, suitable for a news digest reader who won't click through.",
    ),
  tags: z
    .array(z.enum(TAXONOMY))
    .min(1)
    .max(4)
    .describe(
      "1-4 tags from the fixed taxonomy that best characterize this article's subject matter.",
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
