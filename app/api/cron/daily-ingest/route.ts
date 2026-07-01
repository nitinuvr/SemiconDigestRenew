import { NextResponse } from "next/server";
import { todayKey } from "@/lib/dates";
import { cleanupOldArticles } from "@/lib/ingest/cleanupOldArticles";
import { fetchArticles } from "@/lib/ingest/fetchArticles";
import { generateDigest } from "@/lib/ingest/generateDigest";
import { summarizeAndTag } from "@/lib/ingest/summarizeAndTag";

export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const result: Record<string, unknown> = { dateKey: todayKey() };

  try {
    const newArticles = await fetchArticles();
    result.newArticles = newArticles.length;

    try {
      await summarizeAndTag(newArticles);
      result.summarized = true;
    } catch (err) {
      result.summarizeError = String(err);
      console.error("[daily-ingest] summarizeAndTag failed:", err);
    }

    try {
      await generateDigest(result.dateKey as string);
      result.digestGenerated = true;
    } catch (err) {
      result.digestError = String(err);
      console.error("[daily-ingest] generateDigest failed:", err);
    }
  } catch (err) {
    result.fetchError = String(err);
    console.error("[daily-ingest] fetchArticles failed:", err);
  }

  try {
    await cleanupOldArticles();
    result.cleanupRan = true;
  } catch (err) {
    result.cleanupError = String(err);
    console.error("[daily-ingest] cleanupOldArticles failed:", err);
  }

  result.durationMs = Date.now() - startedAt;
  return NextResponse.json(result);
}
