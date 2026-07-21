import {
  getArchiveArticles,
  getArticleById,
  getArticlesFetchedOn,
  getDigestForDate,
  getMostRecentIngestDate,
} from "@/lib/articles";
import { formatLong, todayKey } from "@/lib/dates";
import { groupArticlesByTag, topTagCounts } from "@/lib/tagCounts";
import { isTag } from "@/lib/taxonomy";

const EXTRA_ARCHIVE_ARTICLES_PER_TAG = 10;

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
  const todayGroups = groupArticlesByTag(dayArticles, tagCounts);

  // Pad each tag's carousel with older archive articles beyond today's, so
  // there's more to browse than just today's handful before pointing to the
  // full /archive?tag=<tag> page.
  const groupedByTag = await Promise.all(
    todayGroups.map(async ({ tag, articles: todayArticles }) => {
      if (!isTag(tag)) {
        return {
          tag,
          articles: todayArticles,
          todayCount: todayArticles.length,
          hasMoreInArchive: false,
        };
      }
      const { articles: extra, hasMore } = await getArchiveArticles(
        { tag },
        { limit: EXTRA_ARCHIVE_ARTICLES_PER_TAG, offset: todayArticles.length },
      );
      return {
        tag,
        articles: [...todayArticles, ...extra],
        todayCount: todayArticles.length,
        hasMoreInArchive: hasMore,
      };
    }),
  );

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
