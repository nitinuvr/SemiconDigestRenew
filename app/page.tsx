import { HeroSection } from "@/components/home/HeroSection";
import { ThemeRow } from "@/components/home/ThemeRow";
import { TagCarousel } from "@/components/home/TagCarousel";
import { getDayData } from "@/lib/dayData";

export const revalidate = 300;

export default async function HomePage() {
  const { leadArticle, bullets, dateLabel, tagCounts, groupedByTag } =
    await getDayData();

  return (
    <div>
      <HeroSection
        leadArticle={leadArticle}
        bullets={bullets}
        dateLabel={dateLabel}
      />
      <ThemeRow tagCounts={tagCounts} />
      <div className="divide-y divide-border">
        {groupedByTag.map(({ tag, articles, todayCount, hasMoreInArchive }) => (
          <TagCarousel
            key={tag}
            tag={tag}
            articles={articles}
            todayCount={todayCount}
            hasMoreInArchive={hasMoreInArchive}
          />
        ))}
      </div>
      {groupedByTag.every((group) => group.articles.length === 0) && (
        <p className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground sm:px-6 lg:px-8">
          No articles ingested yet. Run the daily ingest job or the seed
          script to populate the site.
        </p>
      )}
    </div>
  );
}
