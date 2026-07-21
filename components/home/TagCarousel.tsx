import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArticleCard } from "@/components/home/ArticleCard";
import type { Article } from "@/lib/db/schema";
import { tagSlug } from "@/lib/taxonomy";

type TagCarouselProps = {
  tag: string;
  articles: Article[];
  todayCount: number;
  hasMoreInArchive: boolean;
};

export function TagCarousel({
  tag,
  articles,
  todayCount,
  hasMoreInArchive,
}: TagCarouselProps) {
  if (articles.length === 0) return null;

  return (
    <section
      id={`tag-${tagSlug(tag)}`}
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {tag}
        </h2>
        <span className="text-sm text-muted-foreground">
          {todayCount} {todayCount === 1 ? "story" : "stories"} today
        </span>
      </div>

      <Carousel
        opts={{
          align: "start",
          // Mobile: continuous free-form drag instead of snapping one card
          // at a time. sm/lg/xl: jump by however many cards are visible at
          // that breakpoint (matches the basis-1/3, 1/4, 1/5 widths below).
          dragFree: true,
          breakpoints: {
            "(min-width: 640px)": { dragFree: false, slidesToScroll: 3 },
            "(min-width: 1024px)": { dragFree: false, slidesToScroll: 4 },
            "(min-width: 1280px)": { dragFree: false, slidesToScroll: 5 },
          },
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {articles.map((article) => (
            <CarouselItem
              key={article.id}
              className="basis-[70%] pl-4 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <ArticleCard article={article} className="h-full" />
            </CarouselItem>
          ))}
          {hasMoreInArchive && (
            <CarouselItem className="basis-[70%] pl-4 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
              <Link
                href={`/archive?tag=${encodeURIComponent(tag)}`}
                className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-6 text-center transition-colors hover:border-brand hover:text-brand"
              >
                <span className="font-heading text-base font-semibold">
                  View all {tag} articles
                </span>
                <span className="text-sm text-muted-foreground">
                  Browse the full archive →
                </span>
              </Link>
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious className="left-2 translate-x-0 border-border sm:left-0 sm:-translate-x-1/2" />
        <CarouselNext className="right-2 translate-x-0 border-border sm:right-0 sm:translate-x-1/2" />
      </Carousel>
    </section>
  );
}
