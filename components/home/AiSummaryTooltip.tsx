"use client";

import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type AiSummaryTooltipProps = {
  summary: string;
  featured?: boolean;
};

export function AiSummaryTooltip({ summary, featured }: AiSummaryTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            aria-label={`AI-generated summary: ${summary}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="mt-0.5 inline-flex shrink-0 cursor-help text-brand/60 outline-none transition-colors hover:text-brand focus-visible:text-brand"
          >
            <Sparkles className={featured ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
          </span>
        }
      />
      <TooltipContent className="max-w-80 leading-relaxed">{summary}</TooltipContent>
    </Tooltip>
  );
}
