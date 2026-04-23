/**
 * Tests for the sentrul_compliance_scan tool.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/transport/gateway-client.js", () => ({
  callGateway: vi.fn(),
}));

import { callGateway } from "../../src/transport/gateway-client.js";
import {
  ComplianceScanInputSchema,
  handleComplianceScan,
} from "../../src/tools/compliance-scan.js";

const mockCallGateway = vi.mocked(callGateway);

const API_BASE = "https://api.example.com";
const API_KEY = "sk-test";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("ComplianceScanInputSchema", () => {
  it("accepts text with no frameworks — uses defaults", () => {
    const result = ComplianceScanInputSchema.safeParse({
      text: "Patient SSN: 123-45-6789",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.frameworks).toEqual(["pii", "pci"]);
    }
  });

  it("accepts custom frameworks array", () => {
    const result = ComplianceScanInputSchema.safeParse({
      text: "Some document",
      frameworks: ["hipaa", "gdpr"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.frameworks).toEqual(["hipaa", "gdpr"]);
    }
  });

  it("rejects missing text", () => {
    const result = ComplianceScanInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty text", () => {
    const result = ComplianceScanInputSchema.safeParse({ text: "" });
    expect(result.success).toBe(false);
  });
});

describe("handleComplianceScan", () => {
  it("proxies to gateway and maps findings", async () => {
    const gatewayResponse = {
      findings: [
        { rule: "SSN_DETECTED", severity: "HIGH", offset: 12 },
      ],
      trace_url: "https://langfuse.com/trace/def456",
    };
    mockCallGateway.mockResolvedValue(gatewayResponse);

    const result = await handleComplianceScan(
      { text: "Patient SSN: 123-45-6789", frameworks: ["pii"] },
      API_BASE,
      API_KEY,
    );

    expect(result.findings).toEqual(gatewayResponse.findings);
    expect(result.trace_url).toBe(gatewayResponse.trace_url);
    expect(mockCallGateway).toHaveBeenCalledWith(
      "sentrul_compliance_scan",
      { text: "Patient SSN: 123-45-6789", frameworks: ["pii"] },
      API_BASE,
      API_KEY,
    );
  });

  it("returns empty findings when gateway response is missing fields", async () => {
    mockCallGateway.mockResolvedValue({});

    const result = await handleComplianceScan(
      { text: "clean text", frameworks: ["pii"] },
      API_BASE,
      API_KEY,
    );

    expect(result.findings).toEqual([]);
    expect(result.trace_url).toBe("");
  });

  it("propagates GatewayError from the gateway client", async () => {
    const { GatewayError } = await import("../../src/errors.js");
    mockCallGateway.mockRejectedValue(
      new GatewayError(401, "Unauthorized", "Sentrul gateway returned HTTP 401"),
    );

    await expect(
      handleComplianceScan(
        { text: "some text", frameworks: ["pii"] },
        API_BASE,
        API_KEY,
      ),
    ).rejects.toThrow("HTTP 401");
  });
});
