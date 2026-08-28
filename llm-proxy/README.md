# LLM proxy: deterministic scanner + tool-call gate

Two components with different jobs. The distinction is the point.

| | `scanner.py` | `gate.py` |
|---|---|---|
| Question | "Does this input carry a known-bad signature?" | "Is this action permitted for this role?" |
| Decidable | Partially | Yes |
| Role | Detection, depth | **The security boundary** |
| Fails on | Novel natural-language payloads | Nothing, if the allowlist is right |

## Why the scanner is not the boundary

`scanner.py` blocks on *structural* facts — invisible characters, bidi controls,
homoglyphs, base64-encoded text, fence violations, credentials, leaked canaries.
Near-zero false positives, because these have signatures.

It **flags but never blocks** on semantic heuristics (imperative phrasing). Those
fire constantly on legitimate source: a `SYSTEM_PROMPT` constant, a test asserting
that injection is rejected, a `# TODO: ignore the check above`. Blocking on them
stops the build, not the attacker. `TestFalsePositives` demonstrates this.

`TestScannerMisses` carries four payloads the scanner cannot detect, because they
are ordinary English making a false claim. There is no rule that catches those and
does not also catch your documentation.

For each one, the paired test asserts the gate denies the resulting
`execute_python` call anyway. **That is the design: assume the model gets fooled,
and make it not matter.**

## Running

    pip install pytest && python3 -m pytest test_proxy.py -q

## Wiring it in

Three things make the gate real rather than advisory:

1. **The proxy holds the model API key.** The agent gets a proxy credential
   scoped to its role, so it cannot reach the model without passing policy.
2. **Network egress from the agent subnet denies everything except the proxy.**
   Otherwise a compromised agent calls the API directly.
3. **Tool-use blocks buffer; text deltas stream.** You cannot forward a
   `tool_use` block token-by-token and then decide to deny it — the client may
   already have acted. Outbound DLP uses `scan_stream_window`, because a
   credential can straddle a chunk boundary (see the test).

## Not covered here

Sandbox isolation, credential custody, the merge gate, and the guidance-pinning
controls. This module is one layer; it does not make an agent safe on its own.
