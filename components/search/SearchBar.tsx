"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the desktop search input, unless already typing somewhere.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      desktopInputRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (mobileExpanded) mobileInputRef.current?.focus();
  }, [mobileExpanded]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setMobileExpanded(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="relative hidden w-full max-w-xs sm:block"
        role="search"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={desktopInputRef}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search articles..."
          className="pl-8 pr-8"
          aria-label="Search articles"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
          /
        </kbd>
      </form>

      <div className="sm:hidden">
        {mobileExpanded ? (
          <form
            onSubmit={submit}
            role="search"
            className="fixed inset-x-0 top-0 z-50 flex items-center gap-2 border-b border-border bg-header-background px-4 py-3"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              ref={mobileInputRef}
              type="search"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Search articles..."
              aria-label="Search articles"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full border-border"
              aria-label="Close search"
              onClick={() => setMobileExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-border"
            aria-label="Search articles"
            onClick={() => setMobileExpanded(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );
}
