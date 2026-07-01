import type { Article } from "@/lib/db/schema";
import { TAXONOMY } from "@/lib/taxonomy";
import type { TagCount } from "@/components/home/ThemeRow";

const TAXONOMY_ORDER = new Map<string, number>(
  TAXONOMY.map((tag, index) => [tag, index]),
);

/** Top-15 tags by article count, ties broken by taxonomy order for stability. */
export function topTagCounts(articles: Article[], limit = 15): TagCount[] {
  const counts = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (
        (TAXONOMY_ORDER.get(a.tag) ?? 999) - (TAXONOMY_ORDER.get(b.tag) ?? 999)
      );
    })
    .slice(0, limit);
}

/** Articles grouped by tag, preserving the order of `tagCounts`. */
export function groupArticlesByTag(
  articles: Article[],
  tagCounts: TagCount[],
): { tag: string; articles: Article[] }[] {
  return tagCounts.map(({ tag }) => ({
    tag,
    articles: articles.filter((article) => article.tags.includes(tag)),
  }));
}
