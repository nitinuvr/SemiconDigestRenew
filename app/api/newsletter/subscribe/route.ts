import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeEmail } from "@/lib/buttondown/client";

const SubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = SubscribeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const result = await subscribeEmail(parsed.data.email);

  if (result.ok) {
    return NextResponse.json({ status: "subscribed" });
  }

  if (result.reason === "already_subscribed") {
    return NextResponse.json({ status: "already_subscribed" });
  }

  if (result.reason === "rate_limited") {
    return NextResponse.json({ error: "rate_limited" }, { status: 503 });
  }

  return NextResponse.json({ error: "unknown" }, { status: 502 });
}
