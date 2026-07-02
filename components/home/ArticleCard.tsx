import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArticleImage } from "@/components/home/ArticleImage";
import type { Article } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type ArticleCardProps = {
  article: Article;
  size?: "default" | "featured";
  className?: string;
};

export function ArticleCard({
  article,
  size = "default",
  className,
}: ArticleCardProps) {
  const isFeatured = size === "featured";

  return (
    <Link
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-secondary",
          isFeatured ? "aspect-[16/9]" : "aspect-[16/10]",
        )}
      >
        <ArticleImage
          src={article.imageUrl}
          alt=""
          sourceName={article.sourceName}
          featured={isFeatured}
        />
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-1.5",
          isFeatured ? "p-6" : "p-3",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {article.sourceName}
          </span>
          {article.sourceCountry && (
            <span className="uppercase">{article.sourceCountry}</span>
          )}
          <span aria-hidden>&middot;</span>
          <time dateTime={article.publishedAt.toISOString()}>
            {format(article.publishedAt, "MMM d")}
          </time>
        </div>

        <h3
          className={cn(
            "font-heading leading-snug font-semibold tracking-tight text-foreground",
            isFeatured ? "text-2xl sm:text-3xl" : "text-sm",
          )}
        >
          {article.title}
        </h3>

        {article.aiSummary && (
          <p
            className={cn(
              "text-muted-foreground",
              isFeatured ? "text-base line-clamp-3" : "text-xs line-clamp-2",
            )}
          >
            {article.aiSummary}
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {article.tags.slice(0, isFeatured ? 4 : 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-foreground/70"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
