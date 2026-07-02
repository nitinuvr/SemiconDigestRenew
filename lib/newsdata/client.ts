import { z } from "zod";
import type { NewsdataQuery } from "./queries";

/**
 * NOTE: field/param names below reflect NewsData.io's long-stable public API
 * shape (GET /api/1/latest). Verify against your NewsData.io dashboard docs
 * once you have a key signed up, in case your plan tier exposes a different
 * shape (e.g. `ai_tag`/`sentiment` are paid-plan-only fields we don't rely on).
 */

const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/latest";

const NewsdataArticleSchema = z.object({
  article_id: z.string(),
  title: z.string(),
  link: z.string(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  pubDate: z.string(),
  image_url: z.string().nullable().optional(),
  source_id: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  country: z.array(z.string()).nullable().optional(),
  category: z.array(z.string()).nullable().optional(),
  duplicate: z.boolean().optional(),
});

const NewsdataResponseSchema = z.object({
  status: z.string(),
  totalResults: z.number().optional(),
  results: z.array(NewsdataArticleSchema).nullable().optional(),
  nextPage: z.string().nullable().optional(),
});

export type NewsdataArticle = z.infer<typeof NewsdataArticleSchema>;

export class NewsdataQuotaExceededError extends Error {}

/** Simple guard so one run can't blow through an unknown daily quota. */
export class NewsdataRequestBudget {
  private used = 0;
  constructor(private readonly max: number) {}

  tryConsume(): boolean {
    if (this.used >= this.max) return false;
    this.used += 1;
    return true;
  }

  get remaining() {
    return Math.max(0, this.max - this.used);
  }
}

export async function fetchNewsdataPage(
  query: NewsdataQuery,
  apiKey: string,
  page?: string,
): Promise<{ articles: NewsdataArticle[]; nextPage: string | null }> {
  const params = new URLSearchParams({ apikey: apiKey, language: "en" });
  params.set("q", query.q);
  if (query.country) params.set("country", query.country);
  if (query.category) params.set("category", query.category);
  if (page) params.set("page", page);

  const response = await fetch(`${NEWSDATA_BASE_URL}?${params.toString()}`, {
    cache: "no-store",
  });

  if (response.status === 429 || response.status === 402) {
    throw new NewsdataQuotaExceededError(
      `NewsData.io quota/rate limit hit (HTTP ${response.status})`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `NewsData.io request failed for query "${query.label}": HTTP ${response.status}`,
    );
  }

  const json = await response.json();
  const parsed = NewsdataResponseSchema.safeParse(json);

  if (!parsed.success || parsed.data.status !== "success") {
    throw new Error(
      `NewsData.io returned an unexpected response for query "${query.label}": ${JSON.stringify(json).slice(0, 300)}`,
    );
  }

  return {
    articles: parsed.data.results ?? [],
    nextPage: parsed.data.nextPage ?? null,
  };
}
