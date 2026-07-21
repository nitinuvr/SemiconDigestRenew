import { ArticleCard } from "@/components/home/ArticleCard";
import { DigestSidebar, type DigestBullet } from "@/components/home/DigestSidebar";
import type { Article } from "@/lib/db/schema";

type HeroSectionProps = {
  leadArticle: Article | null;
  bullets: DigestBullet[];
  dateLabel: string;
};

export function HeroSection({
  leadArticle,
  bullets,
  dateLabel,
}: HeroSectionProps) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:gap-8 lg:px-8 lg:py-12">
      <div className="lg:col-span-2">
        {leadArticle ? (
          <ArticleCard article={leadArticle} size="featured" />
        ) : (
          <div className="flex aspect-16/9 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            No lead article yet — check back after the next daily update.
          </div>
        )}
      </div>
      <div className="lg:col-span-1">
        <DigestSidebar bullets={bullets} dateLabel={dateLabel} />
      </div>
    </section>
  );
}
