/**
 * Tests for the sentrul_trace_lookup tool.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/transport/gateway-client.js", () => ({
  callGateway: vi.fn(),
}));

import { callGateway } from "../../src/transport/gateway-client.js";
import {
  TraceLookupInputSchema,
  handleTraceLookup,
} from "../../src/tools/trace-lookup.js";

const mockCallGateway = vi.mocked(callGateway);

const API_BASE = "https://api.example.com";
const API_KEY = "sk-test";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("TraceLookupInputSchema", () => {
  it("accepts a valid trace_id", () => {
    const result = TraceLookupInputSchema.safeParse({
      trace_id: "clm8abc123xyz",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing trace_id", () => {
    const result = TraceLookupInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty trace_id", () => {
    const result = TraceLookupInputSchema.safeParse({ trace_id: "" });
    expect(result.success).toBe(false);
  });
});

describe("handleTraceLookup", () => {
  it("proxies to gateway and returns the trace object", async () => {
    const traceData = {
      id: "clm8abc123xyz",
      name: "research-agent-run",
      createdAt: "2026-04-22T10:00:00Z",
      observations: [{ type: "SPAN", name: "fetch-url" }],
    };
    mockCallGateway.mockResolvedValue({ trace: traceData });

    const result = await handleTraceLookup(
      { trace_id: "clm8abc123xyz" },
      API_BASE,
      API_KEY,
    );

    expect(result.trace).toEqual(traceData);
    expect(mockCallGateway).toHaveBeenCalledWith(
      "sentrul_trace_lookup",
      { trace_id: "clm8abc123xyz" },
      API_BASE,
      API_KEY,
    );
  });

  it("returns empty trace object when gateway response is missing trace field", async () => {
    mockCallGateway.mockResolvedValue({});

    const result = await handleTraceLookup(
      { trace_id: "clm8abc123xyz" },
      API_BASE,
      API_KEY,
    );

    expect(result.trace).toEqual({});
  });

  it("returns empty trace object when trace field is an array (unexpected)", async () => {
    mockCallGateway.mockResolvedValue({ trace: ["unexpected"] });

    const result = await handleTraceLookup(
      { trace_id: "clm8abc123xyz" },
      API_BASE,
      API_KEY,
    );

    expect(result.trace).toEqual({});
  });

  it("propagates GatewayError from the gateway client", async () => {
    const { GatewayError } = await import("../../src/errors.js");
    mockCallGateway.mockRejectedValue(
      new GatewayError(404, "Not Found", "Sentrul gateway returned HTTP 404"),
    );

    await expect(
      handleTraceLookup({ trace_id: "nonexistent" }, API_BASE, API_KEY),
    ).rejects.toThrow("HTTP 404");
  });
});
