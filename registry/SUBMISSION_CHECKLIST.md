# Registry Submission Checklist — sentrul-mcp-server@0.1.0

Published 2026-04-22 to npm: https://www.npmjs.com/package/sentrul-mcp-server

## Pre-submission verification (run once before any registry PR)

```bash
# 1. Fresh install smoke test
npx -y sentrul-mcp-server@0.1.0 < /dev/null | head -5   # should exit 0

# 2. tools/list over stdio returns all three tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | npx -y sentrul-mcp-server@0.1.0 \
  | jq '.result.tools[].name'
# expect: "sentrul_research", "sentrul_compliance_scan", "sentrul_trace_lookup"

# 3. anonymous key provisioning round-trip
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"sentrul_compliance_scan","arguments":{"text":"test 4111 1111 1111 1111"}}}' \
  | npx -y sentrul-mcp-server@0.1.0 | jq '.result.content[0].text' | head -3
```

## 1. smithery.ai

**Correction 2026-04-22:** `smithery-ai/registry` is an issue-tracker repo, NOT a PR-based submission surface. Smithery uses auto-discovery from npm + claim-via-web-UI.

- [ ] Visit https://smithery.ai/new and claim the package by pasting `sentrul-mcp-server`
- [ ] Verify ownership via the GitHub OAuth handshake (the repo is at `sentrul/sentrul-mcp-server`)
- [ ] Paste `registry/smithery.yaml` content into the metadata form (description, tools, config schema)
- [ ] Submit — listing appears at https://smithery.ai/server/sentrul-mcp-server

## 2. Cline

- [ ] Cline reads config from per-user `~/Library/Application Support/Cline/mcp-settings.json`; no registry PR required
- [ ] Add `registry/cline-mcp-settings.json` snippet to README.md "Install (Cline)" section
- [ ] Optional: submit to https://cline.bot/mcp-marketplace (Cline-curated list) via GitHub issue

## 3. Cursor

- [ ] Cursor reads from per-user `~/.cursor/mcp.json`; no registry PR required
- [ ] Add `registry/cursor-mcp.json` snippet to README.md "Install (Cursor)" section
- [ ] Optional: request feature on https://forum.cursor.com/c/feedback/mcp

## 4. Claude Desktop

- [ ] Claude Desktop reads from `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows); no registry PR required
- [ ] README already documents Claude Desktop install — verify snippet still matches `registry/claude-desktop-config.json`

## 5. awesome-mcp-servers

- [x] Fork https://github.com/punkpeye/awesome-mcp-servers ✅ `Ctt380/awesome-mcp-servers`
- [x] Insert entry into 🔬 Research section (alphabetical: between `pminervini/deep-research-mcp` and `sh-patterson/legiscan-mcp`)
- [x] Open PR titled `Add sentrul-mcp-server to Research section` → **punkpeye/awesome-mcp-servers#5246** (filed 2026-04-22)
- [ ] Monitor for merge; address maintainer feedback if requested

## Post-submission

- [ ] Track referral-install metric from each registry via the `registry` column in `mcp_anonymous_keys`
- [ ] When install count ≥ 50 across all registries, update `sagacontinues/STATUS.md` BW5.B gate to "G1 GREEN"
- [ ] 60-sec demo video (spec §10 anti-pattern) — record with OBS showing: install → restart client → ask agent to run research → trace URL opens → compliance scan shows PII/PCI/HIPAA/GDPR findings
