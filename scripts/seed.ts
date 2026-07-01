/**
 * Inserts hand-crafted fake articles + a digest for "today" so the full UI
 * (hero, digest sidebar, theme row, tag carousels, search) can be built and
 * tested without NewsData.io/Claude API keys.
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { articles, dailyDigests } from "../lib/db/schema";
import { todayKey } from "../lib/dates";

type SeedArticle = {
  title: string;
  sourceName: string;
  sourceCountry: string;
  category: string;
  url: string;
  imageUrl: string | null;
  contentSnippet: string;
  aiSummary: string;
  tags: string[];
  hoursAgo: number;
};

const seedArticles: SeedArticle[] = [
  {
    title: "TSMC Raises 2026 Capex Guidance on AI Chip Demand",
    sourceName: "Nikkei Asia",
    sourceCountry: "jp",
    category: "business",
    url: "https://example.com/tsmc-capex-2026",
    imageUrl: null,
    contentSnippet:
      "TSMC lifted its capital expenditure guidance for 2026, citing sustained demand for advanced AI accelerators from Nvidia and other customers.",
    aiSummary:
      "TSMC raised its 2026 capex guidance, pointing to continued strong demand for AI accelerator chips from Nvidia and other major customers.",
    tags: ["Business", "Earnings", "AI Chips", "Foundry", "Markets & Investment"],
    hoursAgo: 2,
  },
  {
    title: "US Tightens Export Controls on Advanced Lithography Equipment",
    sourceName: "Reuters",
    sourceCountry: "us",
    category: "politics",
    url: "https://example.com/export-controls-lithography",
    imageUrl: null,
    contentSnippet:
      "The US Commerce Department announced new restrictions on the export of advanced lithography equipment to certain countries, escalating tensions.",
    aiSummary:
      "New US export restrictions target advanced lithography equipment, a move likely to further strain semiconductor supply chains with China.",
    tags: ["Geopolitics", "Export Controls", "Policy & Regulation", "Manufacturing & Supply Chain"],
    hoursAgo: 4,
  },
  {
    title: "Samsung Foundry Wins Major Order for 2nm Automotive Chips",
    sourceName: "Korea Herald",
    sourceCountry: "kr",
    category: "business",
    url: "https://example.com/samsung-2nm-automotive",
    imageUrl: null,
    contentSnippet:
      "Samsung's foundry business secured a large order to produce 2nm chips for a major automaker's next-generation ADAS platform.",
    aiSummary:
      "Samsung Foundry landed a significant 2nm chip order for automotive ADAS applications, boosting its competitive position against TSMC.",
    tags: ["Manufacturing & Supply Chain", "Foundry", "Automotive & EV", "Business"],
    hoursAgo: 6,
  },
  {
    title: "ASML Reports Record Bookings, Cites Robust EUV Demand",
    sourceName: "Bloomberg",
    sourceCountry: "nl",
    category: "business",
    url: "https://example.com/asml-record-bookings",
    imageUrl: null,
    contentSnippet:
      "ASML posted record quarterly bookings driven by strong demand for its extreme ultraviolet lithography systems from leading foundries.",
    aiSummary:
      "ASML posted record bookings on strong EUV lithography demand from major foundries investing in leading-edge capacity.",
    tags: ["Earnings", "Markets & Investment", "Manufacturing & Supply Chain", "Technology"],
    hoursAgo: 8,
  },
  {
    title: "China's SMIC Accelerates Domestic 7nm Ramp Amid Sanctions",
    sourceName: "South China Morning Post",
    sourceCountry: "cn",
    category: "technology",
    url: "https://example.com/smic-7nm-ramp",
    imageUrl: null,
    contentSnippet:
      "SMIC is accelerating production of domestically developed 7nm chips as China seeks self-sufficiency amid ongoing US sanctions.",
    aiSummary:
      "SMIC is ramping domestic 7nm chip production as China pushes for semiconductor self-sufficiency under continued US sanctions pressure.",
    tags: ["Geopolitics", "Manufacturing & Supply Chain", "Foundry", "Technology"],
    hoursAgo: 10,
  },
  {
    title: "Startup Raises $200M to Build Custom AI Inference Chips",
    sourceName: "TechCrunch",
    sourceCountry: "us",
    category: "technology",
    url: "https://example.com/ai-inference-startup-funding",
    imageUrl: null,
    contentSnippet:
      "A Silicon Valley startup closed a $200 million Series C to develop custom silicon optimized for AI inference workloads.",
    aiSummary:
      "An AI chip startup raised $200M in Series C funding to scale production of custom inference silicon aimed at data center customers.",
    tags: ["Startups", "Markets & Investment", "AI Chips", "Technology"],
    hoursAgo: 12,
  },
  {
    title: "India Unveils Incentives to Attract Semiconductor Fabs",
    sourceName: "Economic Times",
    sourceCountry: "in",
    category: "business",
    url: "https://example.com/india-semiconductor-incentives",
    imageUrl: null,
    contentSnippet:
      "India's government announced expanded fiscal incentives aimed at attracting global semiconductor manufacturers to build local fabs.",
    aiSummary:
      "India expanded fiscal incentives to lure global chipmakers into building domestic fabs as part of its semiconductor self-reliance push.",
    tags: ["Policy & Regulation", "Manufacturing & Supply Chain", "Business", "Geopolitics"],
    hoursAgo: 14,
  },
  {
    title: "Memory Prices Rebound as AI Server Demand Absorbs Supply",
    sourceName: "DigiTimes",
    sourceCountry: "tw",
    category: "business",
    url: "https://example.com/memory-price-rebound",
    imageUrl: null,
    contentSnippet:
      "DRAM and NAND prices are climbing as AI server buildouts consume available memory supply faster than manufacturers can expand capacity.",
    aiSummary:
      "Memory chip prices are rebounding as AI server demand outpaces supply, tightening the DRAM and NAND markets industry-wide.",
    tags: ["Markets & Investment", "Memory", "Business", "AI Chips"],
    hoursAgo: 16,
  },
];

async function main() {
  const now = new Date();
  const dateKey = todayKey();

  console.log(`Seeding ${seedArticles.length} articles for ${dateKey}...`);

  const inserted = await db
    .insert(articles)
    .values(
      seedArticles.map((a) => ({
        dedupeKey: `seed:${a.url}`,
        sourceName: a.sourceName,
        sourceCountry: a.sourceCountry,
        category: a.category,
        title: a.title,
        url: a.url,
        imageUrl: a.imageUrl,
        contentSnippet: a.contentSnippet,
        publishedAt: new Date(now.getTime() - a.hoursAgo * 60 * 60 * 1000),
        fetchedAt: now,
        aiSummary: a.aiSummary,
        tags: a.tags,
      })),
    )
    .onConflictDoNothing({ target: articles.dedupeKey })
    .returning({ id: articles.id, title: articles.title });

  console.log(`Inserted ${inserted.length} articles.`);

  const leadArticle = inserted[0];

  await db
    .insert(dailyDigests)
    .values({
      digestDate: dateKey,
      bullets: [
        "TSMC raised 2026 capex guidance again, underscoring how AI accelerator demand keeps rewriting foundry investment plans.",
        "Washington tightened export controls on advanced lithography gear, the latest escalation in the US-China chip standoff.",
        "Samsung Foundry landed a major 2nm automotive order, signaling real traction against TSMC in leading-edge nodes.",
        "ASML posted record bookings on EUV demand, confirming foundries are still committing heavily to next-gen capacity.",
        "Memory prices are climbing again as AI servers soak up DRAM and NAND supply faster than fabs can expand.",
      ],
      articleIds: inserted.map((a) => a.id),
      leadArticleId: leadArticle?.id ?? null,
    })
    .onConflictDoUpdate({
      target: dailyDigests.digestDate,
      set: {
        bullets: sql`excluded.bullets`,
        articleIds: sql`excluded.article_ids`,
        leadArticleId: sql`excluded.lead_article_id`,
      },
    });

  console.log("Seeded today's digest.");
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
