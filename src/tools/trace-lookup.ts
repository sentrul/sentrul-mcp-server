/**
 * sentrul_trace_lookup tool
 *
 * Retrieves a public Langfuse trace by ID and returns the structured payload.
 *
 * TODO(instrumentation): add mcp.tool.call.start / success / error events here
 * when the §6 telemetry layer is wired in (BW6+).
 */

import { z } from "zod/v4";
import { callGateway } from "../transport/gateway-client.js";

export const TraceLookupInputSchema = z.object({
  trace_id: z.string().min(1, "trace_id is required"),
});

export type TraceLookupInput = z.infer<typeof TraceLookupInputSchema>;

export interface TraceLookupOutput {
  readonly trace: Record<string, unknown>;
}

export async function handleTraceLookup(
  input: Readonly<TraceLookupInput>,
  apiBase: string,
  apiKey: string,
): Promise<TraceLookupOutput> {
  const raw = await callGateway(
    "sentrul_trace_lookup",
    { trace_id: input.trace_id },
    apiBase,
    apiKey,
  );

  const data = raw as Record<string, unknown>;

  return {
    trace:
      typeof data["trace"] === "object" &&
      data["trace"] !== null &&
      !Array.isArray(data["trace"])
        ? (data["trace"] as Record<string, unknown>)
        : {},
  };
}
