import { Sparkles } from "lucide-react";

type DigestSidebarProps = {
  bullets: string[];
  dateLabel: string;
};

export function DigestSidebar({ bullets, dateLabel }: DigestSidebarProps) {
  return (
    <aside className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm lg:sticky lg:top-24">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" aria-hidden />
        <span className="text-xs font-semibold tracking-wide text-brand uppercase">
          Today&apos;s Digest
        </span>
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
              <span className="text-foreground/90">{bullet}</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
