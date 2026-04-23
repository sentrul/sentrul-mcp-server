#!/usr/bin/env node
/**
 * Entry point — bootstraps the stdio MCP server.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  // Use stderr so it doesn't pollute the MCP JSON-RPC stream on stdout.
  process.stderr.write(`Fatal: ${String(err)}\n`);
  process.exit(1);
});
