"use client";

import { Sparkles } from "lucide-react";

export type DigestBullet = {
  text: string;
  articleId: string | null;
  url: string | null;
};

type DigestSidebarProps = {
  bullets: DigestBullet[];
  dateLabel: string;
};

const HIGHLIGHT_CLASSES = ["ring-2", "ring-brand", "ring-offset-2"];
const HIGHLIGHT_DURATION_MS = 1600;

function handleBulletClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  articleId: string | null,
) {
  if (!articleId) return;

  const target = document.querySelector<HTMLElement>(
    `[data-article-id="${articleId}"]`,
  );
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add(...HIGHLIGHT_CLASSES);
  window.setTimeout(() => {
    target.classList.remove(...HIGHLIGHT_CLASSES);
  }, HIGHLIGHT_DURATION_MS);
}

export function DigestSidebar({ bullets, dateLabel }: DigestSidebarProps) {
  return (
    <aside className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm lg:sticky lg:top-24">
      <div className="mb-4 flex items-center gap-2 text-brand">
        <Sparkles className="h-4 w-4" aria-hidden />
        <span className="text-sm font-semibold">Today&apos;s Digest</span>
      </div>
      <h2 className="mb-1 font-heading text-xl font-semibold tracking-tight">
        Top 5, in brief
      </h2>
      <p className="mb-5 text-xs text-muted-foreground">{dateLabel}</p>

      {bullets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No digest generated yet for this day.
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                {index + 1}
              </span>
              {bullet.url ? (
                <a
                  href={bullet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleBulletClick(e, bullet.articleId)}
                  className="text-foreground/90 transition-colors hover:text-brand"
                >
                  {bullet.text}
                </a>
              ) : (
                <span className="text-foreground/90">{bullet.text}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
