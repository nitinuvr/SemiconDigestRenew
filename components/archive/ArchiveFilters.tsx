"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ArchiveFiltersProps = {
  tags: readonly string[];
  sources: string[];
  companies: string[];
  activeTag?: string;
  activeSource?: string;
  activeCompany?: string;
};

export function ArchiveFilters({
  tags,
  sources,
  companies,
  activeTag,
  activeSource,
  activeCompany,
}: ArchiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: "tag" | "source" | "company", value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/archive?${params}`);
  }

  const hasActiveFilters = Boolean(activeTag || activeSource || activeCompany);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Select
        value={activeTag ?? null}
        onValueChange={(value) => setParam("tag", value)}
      >
        <SelectTrigger aria-label="Filter by tag">
          <SelectValue placeholder="All tags" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All tags</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={activeSource ?? null}
        onValueChange={(value) => setParam("source", value)}
      >
        <SelectTrigger aria-label="Filter by source">
          <SelectValue placeholder="All sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All sources</SelectItem>
          {sources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={activeCompany ?? null}
        onValueChange={(value) => setParam("company", value)}
      >
        <SelectTrigger aria-label="Filter by company">
          <SelectValue placeholder="All companies" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All companies</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company} value={company}>
              {company}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
