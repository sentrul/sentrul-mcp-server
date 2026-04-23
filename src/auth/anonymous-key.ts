/**
 * Auto-provisions an anonymous API key on first run and caches it at
 * ~/.sentrul/mcp-key.  If a key is already cached it is returned directly
 * (cache-hit path).  The actual provision endpoint is
 *   POST ${apiBase}/v1/mcp/keys/anonymous
 * which does not exist yet — error handling covers the 404/network case.
 */

import { AuthError } from "../errors.js";
import { readCachedKey, writeCachedKey } from "./key-store.js";

interface ProvisionResponse {
  readonly key: string;
}

/**
 * Returns a resolved API key:
 *  1. If provided directly (user set SENTRUL_API_KEY), return it as-is.
 *  2. If a cached key exists at ~/.sentrul/mcp-key, return it.
 *  3. Provision a new anonymous key via the Sentrul gateway and cache it.
 *
 * Never logs the key value.
 */
export async function resolveApiKey(
  explicitKey: string | undefined,
  apiBase: string,
): Promise<string> {
  if (explicitKey !== undefined && explicitKey.length > 0) {
    return explicitKey;
  }

  const cached = await readCachedKey();
  if (cached !== undefined) {
    return cached;
  }

  return provisionAnonymousKey(apiBase);
}

async function provisionAnonymousKey(apiBase: string): Promise<string> {
  const url = `${apiBase}/v1/mcp/keys/anonymous`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err: unknown) {
    throw new AuthError(
      `Failed to reach Sentrul key-provision endpoint: ${String(err)}`,
    );
  }

  const responseBody = await response.text().catch(() => "");

  if (!response.ok) {
    throw new AuthError(
      `Key provision failed with HTTP ${response.status}: ${responseBody}`,
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(responseBody);
  } catch {
    throw new AuthError("Key provision response was not valid JSON.");
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("key" in data) ||
    typeof (data as Record<string, unknown>)["key"] !== "string"
  ) {
    throw new AuthError(
      "Key provision response missing expected `key` field.",
    );
  }

  const provisioned: ProvisionResponse = {
    key: (data as Record<string, unknown>)["key"] as string,
  };

  await writeCachedKey(provisioned.key);
  return provisioned.key;
}
