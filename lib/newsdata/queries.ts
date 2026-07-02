/**
 * Query plan for NewsData.io ingestion. Splits the semiconductor-relevant
 * geographic hubs into <=5-country batches, and splits keywords into
 * multiple short groups because NewsData.io caps the `q` parameter at
 * 100 characters (confirmed against the live API — a single combined
 * OR-list of all keywords returns `UnsupportedQueryLength`).
 */

const CORE_KEYWORDS = [
  "semiconductor",
  "chip",
  "chipmaker",
  "foundry",
  "wafer",
  "fab",
  "TSMC",
  "Nvidia",
  "ASML",
  "SMIC",
];

const COMPANY_KEYWORDS = [
  "Samsung Electronics",
  "SK Hynix",
  "Intel",
  "Micron",
  "Qualcomm",
  "Arm Holdings",
];

function toOrQuery(keywords: string[]): string {
  return keywords.map((k) => (k.includes(" ") ? `"${k}"` : k)).join(" OR ");
}

export const CORE_QUERY = toOrQuery(CORE_KEYWORDS);
export const COMPANY_QUERY = toOrQuery(COMPANY_KEYWORDS);

export const CATEGORIES = "business,technology";

export type NewsdataQuery = {
  label: string;
  q: string;
  country?: string;
  category?: string;
};

const GEO_BATCHES: { label: string; country?: string }[] = [
  { label: "us-tw-kr", country: "us,tw,kr" },
  { label: "jp-cn-nl-in", country: "jp,cn,nl,in" },
  // No country filter — catches specialist trade press (EE Times,
  // DigiTimes, SemiAnalysis, etc.) that NewsData.io may not geo-tag
  // to one of the hubs above.
  { label: "keyword-only" },
];

export const QUERY_PLAN: NewsdataQuery[] = GEO_BATCHES.flatMap((geo) => [
  {
    label: `${geo.label}:core`,
    q: CORE_QUERY,
    country: geo.country,
    category: CATEGORIES,
  },
  {
    label: `${geo.label}:companies`,
    q: COMPANY_QUERY,
    country: geo.country,
    category: CATEGORIES,
  },
]);
