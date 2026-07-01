import { SearchResults } from "@/components/search/SearchResults";
import { searchArticles } from "@/lib/search";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchArticles(query) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-heading text-3xl font-semibold tracking-tight">
        Search
      </h1>
      <p className="mb-8 text-muted-foreground">
        {query
          ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`
          : "Search the last 60 days of aggregated semiconductor news."}
      </p>
      <SearchResults query={query} results={results} />
    </div>
  );
}
