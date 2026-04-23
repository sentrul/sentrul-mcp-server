# sentrul-mcp-server

Run Sentrul research, compliance, and trace-lookup agents from any MCP-aware client.
257 production agents behind one gateway.

**Version**: 0.1.0 | **SDK**: `@modelcontextprotocol/sdk@1.29.0` | **License**: MIT

---

## Install (Claude Desktop)

Add this snippet to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sentrul": {
      "command": "npx",
      "args": ["-y", "sentrul-mcp-server"],
      "env": { "SENTRUL_API_KEY": "optional — free tier auto-provisions" }
    }
  }
}
```

Restart Claude Desktop. The server auto-provisions a free-tier key on first use — no signup required.

---

## Tools

### `sentrul_research`
Fetch a URL and run Sentrul's research-agent on the content.
Returns summary, entities, claims, and a public Langfuse trace URL.

**Example prompts**
- "Research https://example.com/report and summarise the key claims"
- "Do a full-depth research pass on https://arxiv.org/abs/2401.00001"

---

### `sentrul_compliance_scan`
Scan text for common compliance patterns (PII, PCI, HIPAA, GDPR data).
Returns findings + severity. **Not legal advice.**

**Example prompts**
- "Scan this document for PII and PCI violations: [paste text]"
- "Check the following privacy policy for GDPR data patterns"

---

### `sentrul_trace_lookup`
Retrieve a public Langfuse trace by ID.
Returns the structured trace payload for inspection.

**Example prompts**
- "Fetch trace clm8abc123xyz from Sentrul"
- "Show me the observation tree for trace ID abc-def-456"

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SENTRUL_API_KEY` | No | auto-provisioned | Your Sentrul API key. Leave unset to use the free tier. |
| `SENTRUL_API_BASE` | No | `https://app.sentrul.com/api` | Override the Sentrul gateway base URL (staging / local dev). |

### Anonymous free tier

If `SENTRUL_API_KEY` is not set, the server:
1. Checks for a cached key at `~/.sentrul/mcp-key`.
2. If no cache exists, calls `POST /v1/mcp/keys/anonymous` to auto-provision a rate-limited free key.
3. Writes the key to `~/.sentrul/mcp-key` (mode 0600) for future runs.

You can upgrade at any time by setting `SENTRUL_API_KEY` in your MCP client config.

---

## Security notes

- **No shell execution** — the server never runs shell commands or spawns subprocesses.
- **No PII logging** — environment variables and API keys are never written to logs or stdout.
- **Read-only** — all three tools are read-only at launch; no writes to user files or external state.
- **Filesystem writes** — the only writes are to `~/.sentrul/mcp-key` (the key cache). Nothing else is written outside that directory.
- **Supply-chain** — publish uses 2FA-enforced npm account + sigstore attestation (see `SECURITY.md` when available).

---

## Development

```bash
pnpm install
pnpm run build   # tsc → dist/
pnpm test        # vitest run

# Smoke test — should print 3 tools in the tools/list response:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

---

## Links

- Homepage: https://sentrul.com
- Repository: https://github.com/sentrul/sentrul-mcp-server
- Issues: https://github.com/sentrul/sentrul-mcp-server/issues

---

MIT License — Copyright (c) 2026 Sentrul
