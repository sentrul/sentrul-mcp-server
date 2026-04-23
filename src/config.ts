/**
 * Runtime configuration derived from environment variables.
 */

const DEFAULT_API_BASE = "https://app.sentrul.com/api";

export interface Config {
  readonly apiBase: string;
  readonly apiKey: string | undefined;
}

/**
 * Reads SENTRUL_API_BASE and SENTRUL_API_KEY from the environment.
 * Does NOT log the key value — per spec §5 no-secret-logging rule.
 */
export function readConfig(): Config {
  const apiBase = process.env["SENTRUL_API_BASE"] ?? DEFAULT_API_BASE;
  const apiKey = process.env["SENTRUL_API_KEY"];
  return { apiBase, apiKey };
}
