import Link from "next/link";
import { RETENTION_DAYS } from "@/lib/dates";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          Nitin&apos;s Daily Semicon Digest — daily, AI-summarized
          semiconductor industry news.
        </p>
        <div className="flex items-center gap-4">
          <span>Articles retained for {RETENTION_DAYS} days</span>
          <Link href="/search" className="hover:text-brand">
            Search archive
          </Link>
        </div>
      </div>
    </footer>
  );
}
