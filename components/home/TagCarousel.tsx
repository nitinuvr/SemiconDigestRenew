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
};

export function TagCarousel({ tag, articles }: TagCarouselProps) {
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
          {articles.length} {articles.length === 1 ? "story" : "stories"}
        </span>
      </div>

      <Carousel opts={{ align: "start" }} className="w-full">
        <CarouselContent className="-ml-4">
          {articles.map((article) => (
            <CarouselItem
              key={article.id}
              className="basis-[70%] pl-4 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <ArticleCard article={article} className="h-full" />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 -translate-x-1/2 border-border" />
        <CarouselNext className="right-0 translate-x-1/2 border-border" />
      </Carousel>
    </section>
  );
}
