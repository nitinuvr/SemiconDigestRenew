import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DateNav } from "@/components/home/DateNav";
import { SearchBar } from "@/components/search/SearchBar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
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
          <Suspense fallback={<div className="hidden w-full max-w-xs sm:block" />}>
            <SearchBar />
          </Suspense>
          <DateNav />
        </div>
      </div>
    </header>
  );
}
