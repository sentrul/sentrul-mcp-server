/**
 * sentrul_compliance_scan tool
 *
 * Scans text for common compliance patterns (PII, PCI, HIPAA, GDPR data).
 * Returns findings + severity. Not legal advice.
 *
 * TODO(instrumentation): add mcp.tool.call.start / success / error events here
 * when the §6 telemetry layer is wired in (BW6+).
 */

import { z } from "zod/v4";
import { callGateway } from "../transport/gateway-client.js";

const DEFAULT_FRAMEWORKS = ["pii", "pci"] as const;

export const ComplianceScanInputSchema = z.object({
  text: z.string().min(1, "text is required"),
  frameworks: z
    .array(z.string())
    .optional()
    .default(() => [...DEFAULT_FRAMEWORKS]),
});

export type ComplianceScanInput = z.infer<typeof ComplianceScanInputSchema>;

export interface ComplianceScanOutput {
  readonly findings: readonly Record<string, unknown>[];
  readonly trace_url: string;
}

export async function handleComplianceScan(
  input: Readonly<ComplianceScanInput>,
  apiBase: string,
  apiKey: string,
): Promise<ComplianceScanOutput> {
  const raw = await callGateway(
    "sentrul_compliance_scan",
    { text: input.text, frameworks: input.frameworks },
    apiBase,
    apiKey,
  );

  const data = raw as Record<string, unknown>;

  return {
    findings: Array.isArray(data["findings"])
      ? (data["findings"] as Record<string, unknown>[])
      : [],
    trace_url:
      typeof data["trace_url"] === "string" ? data["trace_url"] : "",
  };
}
