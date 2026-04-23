/**
 * Assembles the McpServer instance and registers all three tool handlers.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readConfig } from "./config.js";
import { resolveApiKey } from "./auth/anonymous-key.js";
import {
  ResearchInputSchema,
  handleResearch,
} from "./tools/research.js";
import {
  ComplianceScanInputSchema,
  handleComplianceScan,
} from "./tools/compliance-scan.js";
import {
  TraceLookupInputSchema,
  handleTraceLookup,
} from "./tools/trace-lookup.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "sentrul",
    version: "0.1.0",
  });

  const config = readConfig();

  // Lazily resolved key — memoised after first call.
  let resolvedKeyPromise: Promise<string> | undefined;
  const getKey = (): Promise<string> => {
    if (resolvedKeyPromise === undefined) {
      resolvedKeyPromise = resolveApiKey(config.apiKey, config.apiBase);
    }
    return resolvedKeyPromise;
  };

  // TODO(instrumentation): hook mcp.tool.call.start/success/error events here
  // once the §6 telemetry layer is implemented (BW6+).

  server.registerTool(
    "sentrul_research",
    {
      description:
        "Fetch a URL and run Sentrul's research-agent on the content. " +
        "Returns summary, entities, claims, and a public Langfuse trace URL.",
      inputSchema: ResearchInputSchema,
    },
    async (input) => {
      const apiKey = await getKey();
      const result = await handleResearch(input, config.apiBase, apiKey);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "sentrul_compliance_scan",
    {
      description:
        "Scan text for common compliance patterns (PII, PCI, HIPAA, GDPR data). " +
        "Returns findings + severity. Not legal advice.",
      inputSchema: ComplianceScanInputSchema,
    },
    async (input) => {
      const apiKey = await getKey();
      const result = await handleComplianceScan(input, config.apiBase, apiKey);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "sentrul_trace_lookup",
    {
      description:
        "Retrieve a public Langfuse trace by ID. " +
        "Returns the structured trace payload for inspection in the client.",
      inputSchema: TraceLookupInputSchema,
    },
    async (input) => {
      const apiKey = await getKey();
      const result = await handleTraceLookup(input, config.apiBase, apiKey);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  return server;
}
