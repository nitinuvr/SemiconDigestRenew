"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/home/ArticleCard";
import { Button } from "@/components/ui/button";
import type { Article } from "@/lib/db/schema";

type ArchiveGridProps = {
  initialArticles: Article[];
  initialHasMore: boolean;
  tag?: string;
  source?: string;
};

type ArchiveApiResponse = {
  articles: Array<
    Omit<Article, "publishedAt" | "fetchedAt" | "createdAt" | "updatedAt"> & {
      publishedAt: string;
      fetchedAt: string;
      createdAt: string;
      updatedAt: string;
    }
  >;
  hasMore: boolean;
};

function reviveArticleDates(article: ArchiveApiResponse["articles"][number]): Article {
  return {
    ...article,
    publishedAt: new Date(article.publishedAt),
    fetchedAt: new Date(article.fetchedAt),
    createdAt: new Date(article.createdAt),
    updatedAt: new Date(article.updatedAt),
  };
}

export function ArchiveGrid({
  initialArticles,
  initialHasMore,
  tag,
  source,
}: ArchiveGridProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  async function loadMore() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (tag) params.set("tag", tag);
      if (source) params.set("source", source);
      params.set("offset", String(articles.length));

      const res = await fetch(`/api/archive?${params}`);
      const data: ArchiveApiResponse = await res.json();

      setArticles((prev) => [...prev, ...data.articles.map(reviveArticleDates)]);
      setHasMore(data.hasMore);
    } finally {
      setIsLoading(false);
    }
  }

  if (articles.length === 0) {
    return (
      <p className="text-muted-foreground">No articles match these filters.</p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={isLoading}>
            {isLoading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
