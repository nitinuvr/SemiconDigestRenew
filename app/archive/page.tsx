import { ArchiveFilters } from "@/components/archive/ArchiveFilters";
import { ArchiveGrid } from "@/components/archive/ArchiveGrid";
import {
  ARCHIVE_PAGE_SIZE,
  getArchiveArticles,
  getDistinctSources,
} from "@/lib/articles";
import { RETENTION_DAYS } from "@/lib/dates";
import { isTag, TAXONOMY } from "@/lib/taxonomy";

type PageProps = {
  searchParams: Promise<{ tag?: string; source?: string }>;
};

export default async function ArchivePage({ searchParams }: PageProps) {
  const { tag: tagParam, source } = await searchParams;
  const tag = tagParam && isTag(tagParam) ? tagParam : undefined;

  const [{ articles: initialArticles, hasMore }, sources] = await Promise.all([
    getArchiveArticles({ tag, source }, { limit: ARCHIVE_PAGE_SIZE, offset: 0 }),
    getDistinctSources(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-heading text-3xl font-semibold tracking-tight">
        Archive
      </h1>
      <p className="mb-6 text-muted-foreground">
        Every article from the last {RETENTION_DAYS} days.
      </p>

      <ArchiveFilters
        tags={TAXONOMY}
        sources={sources}
        activeTag={tag}
        activeSource={source}
      />

      <ArchiveGrid
        key={`${tag ?? ""}:${source ?? ""}`}
        initialArticles={initialArticles}
        initialHasMore={hasMore}
        tag={tag}
        source={source}
      />
    </div>
  );
}
