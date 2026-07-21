import { NextRequest, NextResponse } from "next/server";
import { ARCHIVE_PAGE_SIZE, getArchiveArticles } from "@/lib/articles";
import { isTag } from "@/lib/taxonomy";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tagParam = searchParams.get("tag");
  const source = searchParams.get("source") ?? undefined;
  const company = searchParams.get("company") ?? undefined;
  const offsetParam = Number(searchParams.get("offset") ?? 0);

  const tag = tagParam && isTag(tagParam) ? tagParam : undefined;
  const offset = Number.isFinite(offsetParam) ? offsetParam : 0;

  const result = await getArchiveArticles(
    { tag, source, company },
    { limit: ARCHIVE_PAGE_SIZE, offset },
  );

  return NextResponse.json(result);
}
