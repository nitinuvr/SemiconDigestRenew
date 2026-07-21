import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DateNav } from "@/components/home/DateNav";
import { OptionsMenu } from "@/components/layout/OptionsMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SearchBar } from "@/components/search/SearchBar";
import { getDistinctSources } from "@/lib/articles";
import { TAXONOMY } from "@/lib/taxonomy";

export async function SiteHeader() {
  const sources = await getDistinctSources();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-header-background/95 backdrop-blur supports-[backdrop-filter]:bg-header-background/85">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <OptionsMenu tags={TAXONOMY} sources={sources} />

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Nitin's Daily Semicon Digest — home"
        >
          <Image
            src="/logo-compact.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain sm:hidden"
            priority
          />
          <Image
            src="/logo-full.png"
            alt="Nitin's Daily Semicon Digest"
            width={220}
            height={44}
            className="hidden h-9 w-auto object-contain sm:block"
            priority
          />
        </Link>

        <div className="ml-auto flex flex-1 items-center justify-end gap-3">
          <Suspense
            fallback={
              <>
                <div className="hidden w-full max-w-xs sm:block" />
                <div className="h-8 w-8 rounded-full border border-border sm:hidden" />
              </>
            }
          >
            <SearchBar />
          </Suspense>
          <DateNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
