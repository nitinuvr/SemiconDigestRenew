import { createHash } from "node:crypto";

/** Normalize a URL (strip tracking params, trailing slash, protocol) then hash it. */
export function dedupeKeyFor(url: string): string {
  let normalized = url.trim().toLowerCase();
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
    ].forEach((param) => parsed.searchParams.delete(param));
    normalized = `${parsed.hostname}${parsed.pathname}${parsed.search}`
      .replace(/\/$/, "")
      .toLowerCase();
  } catch {
    // Not a valid absolute URL — fall back to the raw trimmed string.
  }
  return createHash("sha256").update(normalized).digest("hex");
}
