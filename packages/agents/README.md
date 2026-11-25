# Agent development

The fixed workflow supports analysis and draft preparation. Draft preparation
always runs evidence checks and model verification before returning. Outputs are
**human-review-required drafts**, never ready-to-send application kits.

## Checks

```powershell
pnpm.cmd --filter @kerja-woy/agents test
pnpm.cmd --filter @kerja-woy/agents typecheck
```

Mock tests are deterministic plumbing tests, not a completed adversarial or model
quality evaluation. The injection fixture checks control flow against mocked
responses; it does not prove a real model resists prompt injection.

## Local real-model smoke (may incur API charges)

Only run after explicitly approving paid API usage. The runner uses fictional
in-memory fixture data and real Anvia extraction, agent, review, and optional
rewrite calls. It does not read .env automatically. Set values explicitly in the
current PowerShell session; avoid placing real secrets in shared terminal history.

```powershell
$env:MODEL_API_KEY = '<your-secret-from-secure-storage>'
$env:MODEL_BASE_URL = '<your-OpenAI-compatible-HTTP(S)-endpoint>'
$env:MODEL_ID = '<your-provider-model-id>'
$env:KERJA_WOY_APPROVE_PAID_SMOKE = 'yes' # explicit paid-call opt-in
pnpm.cmd --filter @kerja-woy/agents smoke
Remove-Item Env:KERJA_WOY_APPROVE_PAID_SMOKE
Remove-Item Env:MODEL_API_KEY
```

Without the opt-in, the runner refuses before making a network call. Only status,
review status, and bullet count are printed, not prompts, model outputs, or keys.
The existing 60-second workflow deadline, model limits, and six-tool budget apply.

## Verifier rules and limitations

- Only uniquely identified, confirmed retrieved facts owned by the bound user
  can support bullets. Unknown, cross-user, unconfirmed, or missing citations are
  dropped without identity repair.
- Normalize with Unicode NFKC, lowercase, and Unicode letter/number tokens.
  Preserve internal punctuation in numbers and identifiers (such as decimal
  points, %, C++, C#, and node.js). Require every generated token to occur in the
  union of cited evidence tokens. No stemming, synonym expansion, unit conversion,
  numeric rounding, or job-title equivalence is assumed. This intentionally strict
  rule checks numbers, named skills/tools, titles, and all other tokens alike.
- Lexical matching is a rejection filter, **not semantic truth**. A separate
  structured model call checks attribution, unsupported claims, and seniority
  inflation, including reordered or negated claims using the same tokens.
- One rewrite per eligible failed bullet receives verifier feedback. It must pass
  the same checks again; remaining failures are dropped. Reports preserve kept,
  rewritten, and dropped decisions with reasons. Maximum 20 bullets per draft.
- A model/verification outage or malformed review fails the whole draft closed.
  Model judgments remain fallible; human review is always required. Outreach is
  still restricted to the fixed safe template, not free-form recipient claims.

## Outstanding (not implemented)

- Persistence, production RAG/vector retrieval, and embeddings.
- PDF generation, Telegram integration, and MCP.
- Anvia Lens observability (including redaction/privacy decisions).
- The PRD's 40-case eval suite, including real-model adversarial/quality evaluation.

None of these are supplied by fixture keyword retrieval or the unit tests.
