import { notFound } from "next/navigation";
import { HeroSection } from "@/components/home/HeroSection";
import { ThemeRow } from "@/components/home/ThemeRow";
import { TagCarousel } from "@/components/home/TagCarousel";
import { isWithinRetention } from "@/lib/dates";
import { getDayData } from "@/lib/dayData";

type PageProps = {
  params: Promise<{ date: string }>;
};

export default async function ArticlesByDatePage({ params }: PageProps) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isWithinRetention(date)) {
    notFound();
  }

  const { leadArticle, bullets, dateLabel, tagCounts, groupedByTag, articles } =
    await getDayData(date);

  return (
    <div>
      <HeroSection
        leadArticle={leadArticle}
        bullets={bullets}
        dateLabel={dateLabel}
      />
      <ThemeRow tagCounts={tagCounts} />
      <div className="divide-y divide-border">
        {groupedByTag.map(({ tag, articles }) => (
          <TagCarousel key={tag} tag={tag} articles={articles} />
        ))}
      </div>
      {articles.length === 0 && (
        <p className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground sm:px-6 lg:px-8">
          No articles were ingested on {dateLabel}.
        </p>
      )}
    </div>
  );
}
