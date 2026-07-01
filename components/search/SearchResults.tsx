import { ArticleCard } from "@/components/home/ArticleCard";
import type { Article } from "@/lib/db/schema";

type SearchResultsProps = {
  query: string;
  results: Article[];
};

export function SearchResults({ query, results }: SearchResultsProps) {
  if (!query) {
    return (
      <p className="text-muted-foreground">
        Enter a search term above to look through the archive.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-muted-foreground">
        No articles found for &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
