/**
 * Tests for the anonymous key auto-provision + cache-hit logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- module mocks ---------------------------------------------------------

vi.mock("../../src/auth/key-store.js", () => ({
  readCachedKey: vi.fn(),
  writeCachedKey: vi.fn(),
}));

// We need to import AFTER vi.mock so the mock is in place.
import { readCachedKey, writeCachedKey } from "../../src/auth/key-store.js";
import { resolveApiKey } from "../../src/auth/anonymous-key.js";

const mockReadCachedKey = vi.mocked(readCachedKey);
const mockWriteCachedKey = vi.mocked(writeCachedKey);

// ---- fetch mock -----------------------------------------------------------

const globalFetch = global.fetch;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  global.fetch = globalFetch;
});

// ---------------------------------------------------------------------------

describe("resolveApiKey", () => {
  const API_BASE = "https://api.example.com";

  it("returns the explicit key immediately without touching cache or network", async () => {
    mockReadCachedKey.mockResolvedValue(undefined);

    const result = await resolveApiKey("sk-explicit-key", API_BASE);

    expect(result).toBe("sk-explicit-key");
    expect(mockReadCachedKey).not.toHaveBeenCalled();
    expect(mockWriteCachedKey).not.toHaveBeenCalled();
  });

  it("returns a cached key without hitting the network", async () => {
    mockReadCachedKey.mockResolvedValue("sk-cached-key");

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await resolveApiKey(undefined, API_BASE);

    expect(result).toBe("sk-cached-key");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockWriteCachedKey).not.toHaveBeenCalled();
  });

  it("provisions a new key when no cache and no explicit key", async () => {
    mockReadCachedKey.mockResolvedValue(undefined);
    mockWriteCachedKey.mockResolvedValue(undefined);

    const provisionedKey = "sk-provisioned-12345";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ key: provisionedKey })),
    }) as unknown as typeof fetch;

    const result = await resolveApiKey(undefined, API_BASE);

    expect(result).toBe(provisionedKey);
    expect(mockWriteCachedKey).toHaveBeenCalledWith(provisionedKey);
  });

  it("throws AuthError when provision endpoint returns non-ok status", async () => {
    mockReadCachedKey.mockResolvedValue(undefined);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve("Service Unavailable"),
    }) as unknown as typeof fetch;

    await expect(resolveApiKey(undefined, API_BASE)).rejects.toThrow(
      "Key provision failed with HTTP 503",
    );
  });

  it("throws AuthError when provision response is missing `key` field", async () => {
    mockReadCachedKey.mockResolvedValue(undefined);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ token: "wrong-field" })),
    }) as unknown as typeof fetch;

    await expect(resolveApiKey(undefined, API_BASE)).rejects.toThrow(
      "missing expected `key` field",
    );
  });

  it("throws AuthError on network failure during provision", async () => {
    mockReadCachedKey.mockResolvedValue(undefined);

    global.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch;

    await expect(resolveApiKey(undefined, API_BASE)).rejects.toThrow(
      "Failed to reach Sentrul key-provision endpoint",
    );
  });
});
