/**
 * Tests for the sentrul_research tool.
 * Covers Zod input validation and happy-path gateway proxying.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/transport/gateway-client.js", () => ({
  callGateway: vi.fn(),
}));

import { callGateway } from "../../src/transport/gateway-client.js";
import {
  ResearchInputSchema,
  handleResearch,
} from "../../src/tools/research.js";

const mockCallGateway = vi.mocked(callGateway);

const API_BASE = "https://api.example.com";
const API_KEY = "sk-test";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("ResearchInputSchema", () => {
  it("accepts a valid url with no depth", () => {
    const result = ResearchInputSchema.safeParse({ url: "https://example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depth).toBe("quick");
    }
  });

  it("accepts depth = full", () => {
    const result = ResearchInputSchema.safeParse({
      url: "https://example.com",
      depth: "full",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing url", () => {
    const result = ResearchInputSchema.safeParse({ depth: "quick" });
    expect(result.success).toBe(false);
  });

  it("rejects empty url", () => {
    const result = ResearchInputSchema.safeParse({ url: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid depth value", () => {
    const result = ResearchInputSchema.safeParse({
      url: "https://example.com",
      depth: "medium",
    });
    expect(result.success).toBe(false);
  });
});

describe("handleResearch", () => {
  it("proxies to gateway and maps response fields", async () => {
    const gatewayResponse = {
      summary: "Article about climate change",
      entities: ["NASA", "IPCC"],
      claims: [{ text: "Global temperatures rising", confidence: 0.9 }],
      trace_url: "https://langfuse.com/trace/abc123",
    };
    mockCallGateway.mockResolvedValue(gatewayResponse);

    const result = await handleResearch(
      { url: "https://example.com/article", depth: "quick" },
      API_BASE,
      API_KEY,
    );

    expect(result.summary).toBe(gatewayResponse.summary);
    expect(result.entities).toEqual(gatewayResponse.entities);
    expect(result.claims).toEqual(gatewayResponse.claims);
    expect(result.trace_url).toBe(gatewayResponse.trace_url);
    expect(mockCallGateway).toHaveBeenCalledWith(
      "sentrul_research",
      { url: "https://example.com/article", depth: "quick" },
      API_BASE,
      API_KEY,
    );
  });

  it("returns empty defaults when gateway response is missing fields", async () => {
    mockCallGateway.mockResolvedValue({});

    const result = await handleResearch(
      { url: "https://example.com", depth: "quick" },
      API_BASE,
      API_KEY,
    );

    expect(result.summary).toBe("");
    expect(result.entities).toEqual([]);
    expect(result.claims).toEqual([]);
    expect(result.trace_url).toBe("");
  });

  it("propagates GatewayError from the gateway client", async () => {
    const { GatewayError } = await import("../../src/errors.js");
    mockCallGateway.mockRejectedValue(
      new GatewayError(502, "Bad Gateway", "Sentrul gateway returned HTTP 502"),
    );

    await expect(
      handleResearch(
        { url: "https://example.com", depth: "quick" },
        API_BASE,
        API_KEY,
      ),
    ).rejects.toThrow("HTTP 502");
  });
});
