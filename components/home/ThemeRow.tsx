import Link from "next/link";
import { tagSlug } from "@/lib/taxonomy";

export type TagCount = { tag: string; count: number };

type ThemeRowProps = {
  tagCounts: TagCount[];
};

export function ThemeRow({ tagCounts }: ThemeRowProps) {
  if (tagCounts.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <h2 className="mb-3 font-heading text-sm font-semibold tracking-tight text-foreground/80">
          Today&apos;s top themes
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tagCounts.map(({ tag }) => (
            <Link
              key={tag}
              href={`#tag-${tagSlug(tag)}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium whitespace-nowrap text-foreground/80 transition-colors hover:border-brand hover:text-brand"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
