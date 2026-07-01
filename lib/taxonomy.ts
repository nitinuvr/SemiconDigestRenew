/**
 * Single source of truth for article tags. Shared by the AI structured-output
 * schema (lib/anthropic/schemas.ts) and every frontend component that renders
 * or filters by tag.
 */
export const TAXONOMY = [
  "Technology",
  "Business",
  "Geopolitics",
  "Markets & Investment",
  "Manufacturing & Supply Chain",
  "Policy & Regulation",
  "M&A",
  "AI Chips",
  "Foundry",
  "Memory",
  "Automotive & EV",
  "Consumer Electronics",
  "Earnings",
  "Export Controls",
  "Talent & Labor",
  "R&D",
  "Startups",
  "Legal",
  "Partnerships",
  "Sustainability",
] as const;

export type Tag = (typeof TAXONOMY)[number];

export function isTag(value: string): value is Tag {
  return (TAXONOMY as readonly string[]).includes(value);
}

/** URL/anchor-safe slug for a tag, e.g. "Markets & Investment" -> "markets-investment" */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
