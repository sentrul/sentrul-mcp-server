/**
 * sentrul_research tool
 *
 * Fetches a URL and runs Sentrul's research-agent on the content.
 * Returns summary, entities, claims, and a public Langfuse trace URL.
 *
 * TODO(instrumentation): add mcp.tool.call.start / success / error events here
 * when the §6 telemetry layer is wired in (BW6+).
 */

import { z } from "zod/v4";
import { callGateway } from "../transport/gateway-client.js";

export const ResearchInputSchema = z.object({
  url: z.string().min(1, "url is required"),
  depth: z.enum(["quick", "full"]).optional().default("quick"),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;

export interface ResearchOutput {
  readonly summary: string;
  readonly entities: readonly string[];
  readonly claims: readonly Record<string, unknown>[];
  readonly trace_url: string;
}

export async function handleResearch(
  input: Readonly<ResearchInput>,
  apiBase: string,
  apiKey: string,
): Promise<ResearchOutput> {
  const raw = await callGateway(
    "sentrul_research",
    { url: input.url, depth: input.depth },
    apiBase,
    apiKey,
  );

  // The gateway is not yet live; cast the response defensively.
  const data = raw as Record<string, unknown>;

  return {
    summary: typeof data["summary"] === "string" ? data["summary"] : "",
    entities: Array.isArray(data["entities"])
      ? (data["entities"] as string[])
      : [],
    claims: Array.isArray(data["claims"])
      ? (data["claims"] as Record<string, unknown>[])
      : [],
    trace_url:
      typeof data["trace_url"] === "string" ? data["trace_url"] : "",
  };
}
