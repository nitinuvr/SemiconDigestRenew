import { CircleQuestionMark, History, Mail, Menu, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

const TIPS = [
  { icon: Menu, text: "Tap the menu to browse by tag or source." },
  { icon: History, text: "Browse past articles anytime via the archive button." },
  { icon: Sparkles, text: "Hover or tap the sparkle on any article for its full AI summary." },
  { icon: Search, text: "Press / or tap the search icon to find articles." },
  { icon: Mail, text: "Subscribe to the weekly email recap via the mail icon." },
];

export function HelpButton() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-border"
            aria-label="How to use this site"
          >
            <CircleQuestionMark className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverTitle>How this site works</PopoverTitle>
        <ul className="flex flex-col gap-2.5 pt-1">
          {TIPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2 text-sm text-foreground/90">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
