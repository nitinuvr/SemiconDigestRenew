import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
          isFeatured ? "aspect-[16/9]" : "aspect-[4/3]",
        )}
      >
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt=""
            fill
            sizes={isFeatured ? "(min-width: 1024px) 60vw, 100vw" : "320px"}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {article.sourceName}
          </div>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col gap-2", isFeatured ? "p-6" : "p-4")}>
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
            isFeatured ? "text-2xl sm:text-3xl" : "text-base",
          )}
        >
          {article.title}
        </h3>

        {article.aiSummary && (
          <p
            className={cn(
              "text-muted-foreground",
              isFeatured ? "text-base line-clamp-3" : "text-sm line-clamp-2",
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
