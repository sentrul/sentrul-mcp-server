/**
 * Thin fetch wrapper for the Sentrul gateway.
 *
 * Sends POST requests to ${apiBase}/v1/mcp/tools/<name> with a Bearer token,
 * enforces a 30 s timeout, and surfaces typed errors.
 *
 * The actual gateway endpoints do not exist yet — the client-side wiring and
 * error handling are complete; callers get a GatewayError on non-2xx responses.
 */

import { GatewayError } from "../errors.js";

const TIMEOUT_MS = 30_000;

/**
 * Calls the Sentrul gateway for the given tool name.
 * Returns the parsed JSON response body.
 * Throws GatewayError on non-2xx status or network failure.
 * Never logs the apiKey value.
 */
export async function callGateway(
  toolName: string,
  input: Readonly<Record<string, unknown>>,
  apiBase: string,
  apiKey: string,
): Promise<unknown> {
  const url = `${apiBase}/v1/mcp/tools/${toolName}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err: unknown) {
    throw new GatewayError(
      0,
      "",
      `Network error calling Sentrul gateway for tool "${toolName}": ${String(err)}`,
    );
  }

  const responseBody = await response.text().catch(() => "");

  if (!response.ok) {
    throw new GatewayError(
      response.status,
      responseBody,
      `Sentrul gateway returned HTTP ${response.status} for tool "${toolName}"`,
    );
  }

  try {
    return JSON.parse(responseBody) as unknown;
  } catch {
    throw new GatewayError(
      response.status,
      responseBody,
      `Sentrul gateway response for tool "${toolName}" was not valid JSON`,
    );
  }
}
