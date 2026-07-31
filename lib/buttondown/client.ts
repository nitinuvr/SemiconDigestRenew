const BASE_URL = "https://api.buttondown.com/v1";

function getApiKey(): string {
  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) {
    throw new Error("BUTTONDOWN_API_KEY is not set");
  }
  return key;
}

async function buttondownFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${getApiKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export type SubscribeResult =
  | { ok: true }
  | {
      ok: false;
      reason: "already_subscribed" | "rate_limited" | "invalid" | "unknown";
      status: number;
    };

/**
 * Leaves `type` unset so Buttondown's default double opt-in behavior
 * applies. Never throws — a missing API key or network failure is reported
 * the same way as any other "unknown" failure, so the subscribe API route
 * can always return a clean JSON error instead of a raw 500.
 */
export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  let res: Response;
  try {
    res = await buttondownFetch("/subscribers", {
      method: "POST",
      body: JSON.stringify({ email_address: email }),
    });
  } catch (err) {
    console.error("[buttondown] subscribeEmail request failed:", err);
    return { ok: false, reason: "unknown", status: 0 };
  }

  if (res.ok) return { ok: true };

  if (res.status === 429) {
    return { ok: false, reason: "rate_limited", status: res.status };
  }

  const bodyText = await res.text().catch(() => "");

  // Heuristic, not a confirmed field name — Buttondown's exact duplicate-
  // subscriber response shape isn't documented; verify against a real
  // duplicate submission and adjust this check if needed.
  if (res.status === 400 && /already|exists|duplicate/i.test(bodyText)) {
    return { ok: false, reason: "already_subscribed", status: res.status };
  }
  if (res.status === 400) {
    return { ok: false, reason: "invalid", status: res.status };
  }

  console.error(`[buttondown] subscribeEmail failed: ${res.status} ${bodyText}`);
  return { ok: false, reason: "unknown", status: res.status };
}

export async function createDraftEmail({
  subject,
  body,
}: {
  subject: string;
  body: string;
}): Promise<{ id: string }> {
  const res = await buttondownFetch("/emails", {
    method: "POST",
    body: JSON.stringify({ subject, body, status: "draft" }),
  });
  if (!res.ok) {
    throw new Error(
      `Buttondown createDraftEmail failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
  const data = await res.json();
  return { id: data.id };
}

export async function sendDraft(id: string): Promise<void> {
  const res = await buttondownFetch(`/emails/${id}/send-draft`, { method: "POST" });
  if (!res.ok) {
    throw new Error(
      `Buttondown sendDraft failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
}
