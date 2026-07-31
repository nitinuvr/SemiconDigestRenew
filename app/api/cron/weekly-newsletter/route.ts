import { NextResponse } from "next/server";
import { generateWeeklyNewsletter } from "@/lib/newsletter/generateWeeklyNewsletter";

export const maxDuration = 120;

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
  const result: Record<string, unknown> = {};

  try {
    result.newsletter = await generateWeeklyNewsletter();
  } catch (err) {
    result.error = String(err);
    console.error("[weekly-newsletter] generateWeeklyNewsletter failed:", err);
  }

  result.durationMs = Date.now() - startedAt;
  return NextResponse.json(result);
}
