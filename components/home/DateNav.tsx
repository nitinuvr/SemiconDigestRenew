"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dateKey, earliestRetainedDate, todayKey } from "@/lib/dates";

export function DateNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-border"
            aria-label="Browse by date"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Browse by date</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="single"
          disabled={{ after: new Date(), before: earliestRetainedDate() }}
          onSelect={(date) => {
            if (!date) return;
            const key = dateKey(date);
            setOpen(false);
            router.push(key === todayKey() ? "/" : `/articles/${key}`);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
