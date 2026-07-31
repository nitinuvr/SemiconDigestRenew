import { History } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ArchiveLink() {
  return (
    <Link
      href="/archive"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "gap-2 rounded-full border-border",
      )}
      aria-label="Browse past articles"
    >
      <History className="h-4 w-4" />
      <span className="hidden sm:inline">Browse past articles</span>
    </Link>
  );
}
