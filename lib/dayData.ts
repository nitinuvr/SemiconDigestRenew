import {
  getArticleById,
  getArticlesFetchedOn,
  getDigestForDate,
  getMostRecentIngestDate,
} from "@/lib/articles";
import { formatLong, todayKey } from "@/lib/dates";
import { groupArticlesByTag, topTagCounts } from "@/lib/tagCounts";

export async function getDayData(requestedDateKey?: string) {
  let dateKey = requestedDateKey ?? todayKey();
  let dayArticles = await getArticlesFetchedOn(dateKey);

  // If nobody has requested a specific day and today has no ingested
  // articles yet (e.g. the daily cron hasn't run), fall back to the most
  // recent day that does — so the homepage is never empty by default.
  if (!requestedDateKey && dayArticles.length === 0) {
    const fallback = await getMostRecentIngestDate();
    if (fallback) {
      dateKey = fallback;
      dayArticles = await getArticlesFetchedOn(dateKey);
    }
  }

  const digest = await getDigestForDate(dateKey);
  const leadArticle = digest?.leadArticleId
    ? await getArticleById(digest.leadArticleId)
    : (dayArticles[0] ?? null);

  const tagCounts = topTagCounts(dayArticles);
  const groupedByTag = groupArticlesByTag(dayArticles, tagCounts);

  return {
    dateKey,
    dateLabel: formatLong(dateKey),
    articles: dayArticles,
    bullets: digest?.bullets ?? [],
    leadArticle,
    tagCounts,
    groupedByTag,
  };
}
