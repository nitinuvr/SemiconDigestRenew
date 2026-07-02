"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { tagSlug } from "@/lib/taxonomy";

type OptionsMenuProps = {
  tags: readonly string[];
  sources: string[];
};

export function OptionsMenu({ tags, sources }: OptionsMenuProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-border"
            aria-label="Browse tags and sources"
          >
            <Menu className="h-4 w-4" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-80 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Browse</SheetTitle>
        </SheetHeader>

        <Accordion className="px-4 pb-6">
          <AccordionItem value="tags">
            <AccordionTrigger>Tags ({tags.length})</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <SheetClose
                    key={tag}
                    render={
                      <Link
                        href={`/#tag-${tagSlug(tag)}`}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-brand hover:text-brand"
                      >
                        {tag}
                      </Link>
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sources">
            <AccordionTrigger>
              Sources &amp; Publications ({sources.length})
            </AccordionTrigger>
            <AccordionContent>
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sources ingested yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5 text-sm text-foreground/80">
                  {sources.map((source) => (
                    <li key={source}>{source}</li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
