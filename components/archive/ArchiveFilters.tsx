"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ArchiveFiltersProps = {
  tags: readonly string[];
  sources: string[];
  activeTag?: string;
  activeSource?: string;
};

const selectClassName =
  "h-8 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function ArchiveFilters({
  tags,
  sources,
  activeTag,
  activeSource,
}: ArchiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: "tag" | "source", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/archive?${params}`);
  }

  const hasActiveFilters = Boolean(activeTag || activeSource);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        aria-label="Filter by tag"
        className={selectClassName}
        value={activeTag ?? ""}
        onChange={(e) => setParam("tag", e.target.value)}
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by source"
        className={selectClassName}
        value={activeSource ?? ""}
        onChange={(e) => setParam("source", e.target.value)}
      >
        <option value="">All sources</option>
        {sources.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => router.push("/archive")}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
