# Claude Opus 5 sequential asset batch: preflight

The requested batch contains three independent assets, to run strictly one at a time:
mechanical peacock, folding botanical field station and kinetic marble machine.

Local Claude Code version: `2.1.259`. The first-party Anthropic model catalog returned
HTTP 200 and explicitly listed `claude-opus-5` / Claude Opus 5. The batch invokes that
exact ID rather than the configured `opus[1m]` alias.

The batch uses the existing configured API-key authentication route. No credential
values are printed or copied, no credits are purchased, and global configuration is
unchanged. There is no fallback model or provider.

Mechanical Peacock started in a fresh workspace with installed candidate `0d457e8f`
and its three core skills. Claude's initialization reported exact model
`claude-opus-5` and a connected `kiln_workspace` MCP server. The provider then rejected
the first request with `billing_error: Credit balance is too low` (HTTP 400).

Claude exited with code 1. The serial launcher stopped automatically; the botanical
field station and marble machine sessions were **not started**. There were no retries,
fallbacks or purchases. No assets were authored: the observer recorded zero MCP calls
and zero images, and Claude reported zero input/output tokens and total cost of $0.
This is a failed provider attempt, not a completed model evaluation.

The unused per-session limits were ten minutes, 32 MCP calls and 48 image cells.
The first session's setup, package/skill hashes, launch arguments, raw transcript,
observer budget and exit result remain under the machine-local evidence directory
`kiln-cleanrooms/fresh-claude-mechanical-peacock-0d457e8f-20260905/evidence/`.
