/**
 * Reads and writes the cached anonymous key at ~/.sentrul/mcp-key with mode 0600.
 * Only writes to ~/.sentrul/ — no other filesystem locations are touched.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const CACHE_DIR = join(homedir(), ".sentrul");
const CACHE_FILE = join(CACHE_DIR, "mcp-key");

/**
 * Returns the cached key, or undefined if the cache file does not exist.
 */
export async function readCachedKey(): Promise<string | undefined> {
  try {
    const raw = await readFile(CACHE_FILE, "utf-8");
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return undefined;
    throw err;
  }
}

/**
 * Persists the key to ~/.sentrul/mcp-key with mode 0600.
 * Creates the directory if it does not exist.
 */
export async function writeCachedKey(key: string): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true, mode: 0o700 });
  await writeFile(CACHE_FILE, key, { encoding: "utf-8", mode: 0o600 });
}
