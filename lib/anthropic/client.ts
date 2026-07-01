import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Lazily constructs the Anthropic client so importing this module (e.g. for
 * an unrelated request path) never throws just because ANTHROPIC_API_KEY
 * isn't set — the error only surfaces when an AI call is actually made. */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const ARTICLE_MODEL =
  process.env.ANTHROPIC_ARTICLE_MODEL ?? "claude-opus-4-8";
export const DIGEST_MODEL =
  process.env.ANTHROPIC_DIGEST_MODEL ?? "claude-opus-4-8";
