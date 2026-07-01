/**
 * NewsData.io returns full country names (e.g. "united states of america"),
 * not ISO codes. Normalize the ones we actually query for to short display
 * labels; fall back to title-casing anything else.
 */
const KNOWN_COUNTRIES: Record<string, string> = {
  "united states of america": "US",
  taiwan: "TW",
  "south korea": "KR",
  japan: "JP",
  china: "CN",
  netherlands: "NL",
  india: "IN",
};

export function normalizeCountry(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (KNOWN_COUNTRIES[lower]) return KNOWN_COUNTRIES[lower];
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}
