"use client";

import { Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

type Status = "idle" | "loading" | "success" | "already" | "error";

const STATUS_MESSAGE: Record<"success" | "already" | "error", string> = {
  success: "Check your inbox to confirm.",
  already: "You're already subscribed.",
  error: "Something went wrong — please try again later.",
};

export function NewsletterSignup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.status === "subscribed") {
        setStatus("success");
        setEmail("");
      } else if (res.ok && data.status === "already_subscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setStatus("idle");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-border"
            aria-label="Subscribe to the weekly newsletter"
          >
            <Mail className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent align="end">
        <PopoverTitle>Weekly newsletter</PopoverTitle>
        <PopoverDescription>
          The week&apos;s top semiconductor stories, every Monday.
        </PopoverDescription>

        {status === "success" || status === "already" ? (
          <p className="text-sm text-muted-foreground">{STATUS_MESSAGE[status]}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-1.5">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
            />
            <Button
              type="submit"
              disabled={status === "loading"}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {status === "loading" ? "…" : "Subscribe"}
            </Button>
          </form>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive">{STATUS_MESSAGE.error}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
