# Current Evidence Log

Status: v0.2 closure evidence  
Last updated: 2026-07-23

## Current Claims

### Claim 0: The v0.2 staging baseline is preserved

Evidence:
- Commit: `c0c1ebf`
- Message: `baseline: agency os v0.2 staging evidence ledger`
- Scope: 52 project files, including app, data, docs, tests and config.
- Git identity used locally for this repository: `Codex <codex@local>`.

Strength: strong for rollback/diffability inside this local repository.

### Claim 1: The local app opens

Evidence:
- Local URL checked: `http://localhost:5173/`
- Result: HTTP 200
- Required text found:
  - `State Ledger`
  - `Recommended next steps`
  - `Attach URL, commit, screenshot, file path or test result`
  - `Review agent claims`

Strength: medium. It proves local rendering and key UI text, not full visual QA.

### Claim 2: The main local verification gate passes

Evidence:
- Command: `npm run verify`
- Result: pass
- Covered checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - build via `vinext build`
  - rendered HTML tests
  - ledger rule tests

Observed test result:
- 21 tests passed.

Strength: strong for current static/local code quality.

### Claim 3: Lint no longer depends on scratch research files

Evidence:
- `eslint.config.mjs` ignores `work/**` and `dist/**`.
- Command: `npm run lint`
- Result: pass with no warnings.

Strength: strong for current lint signal.

### Claim 4: TypeScript check now passes

Evidence:
- `tsconfig.json` includes Cloudflare worker types and excludes generated/scratch
  folders.
- `db/index.ts` explicitly types the expected optional D1 binding.
- Command: `npx tsc --noEmit`
- Result: pass.

Strength: strong for current type surface.

### Claim 5: Production dependency audit is not clean

Evidence:
- Command: `npm run audit:prod`
- Result: fail.
- Current npm registry latest for `next`: `16.2.11`.
- Current dependency: `next@16.2.11`.
- Remaining advisories reported through Next's bundled/transitive dependencies:
  - `postcss <8.5.10`;
  - `sharp <0.35.0`;
  - Next advisory range reported by npm audit.

Decision:
- Do not deploy to production until a safe Next/vinext-compatible dependency
  path is available or the risk is explicitly accepted.
- Do not use `npm audit fix --force` blindly because npm suggests a breaking
  path and the app depends on the Vinext/Next stack.

Strength: strong evidence of an unresolved blocker.

### Claim 6: Ledger events are now loaded from JSONL

Evidence:
- `app/ledger.ts` imports `data/events.jsonl?raw`.
- `parseLedgerEvents()` builds `stateLedger.events` from that source.
- `tests/ledger.test.mjs` asserts that `stateLedger.events` equals parsed
  `data/events.jsonl`.
- `tests/rendered-html.test.mjs` asserts the old `const rawEvents` source does
  not exist.

Strength: strong for event source alignment. It does not yet prove append-only
write integrity or reducer replay.

### Claim 7: Event, approval, import and release contracts are documented

Evidence:
- `docs/EVENT_LOG_INTEGRITY.md`
- `docs/APPROVAL_POLICY_MATRIX.md`
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md`
- `docs/RELEASE_GATES.md`
- README architecture links include these documents.

Strength: medium. These documents constrain future work, but runtime
enforcement is still incomplete.

### Claim 8: Event log integrity has first runtime validation

Evidence:
- `data/events.jsonl` has minimal envelope fields:
  `schemaVersion`, `sequence`, `approvalIds`, `traceId`, `redactionStatus`,
  `retentionClass`, `previousEventHash` and `eventHash`.
- `app/ledger.ts` exports `calculateEventHash()` and `validateEventLog()`.
- `validateLedger()` includes event log validation errors.
- `tests/ledger.test.mjs` covers valid event log, broken hash chain, duplicate
  sequence, missing redaction and unknown approval reference.
- `npm run verify` passes with 16 tests.

Strength: strong for local event integrity validation. It does not yet prove
append-only write enforcement or reducer replay.

### Claim 9: The first pure replay reducer path exists

Evidence:
- `app/ledger.ts` exports `replayLedgerEvents()`.
- Supported state-changing action: `project.next_action_updated`.
- Replay clones the input ledger and does not mutate the original snapshot.
- Agent writes require a scoped approval for
  `project-id:project.next_action_updated`.
- Single-use approval is marked `used` during successful agent replay.
- `tests/ledger.test.mjs` covers no-mutation replay, exact duplicate
  idempotency ignore, changed duplicate rejection, missing approval and
  single-use approval consumption.
- `npm run verify` passes with 21 tests.

Strength: strong for the first pure reducer path. It does not yet prove a file
append writer, UI action, or full event replay coverage.

## Files Changed For Honesty Closure

- `package.json`: added `typecheck`, `audit:prod`, `verify`; moved Next to
  runtime dependencies.
- `package-lock.json`: updated dependency graph.
- `tsconfig.json`: added Cloudflare worker types and excludes.
- `eslint.config.mjs`: ignored generated/scratch folders.
- `db/index.ts`: typed Cloudflare D1 binding access.
- `docs/AGENCY_OS_ARCHITECTURE.md`: architecture baseline.
- `docs/WORK_AND_EVIDENCE_PROTOCOL.md`: work/evidence protocol.
- `docs/RESEARCH_AND_COMPARISON.md`: external comparison notes.
- `docs/CURRENT_EVIDENCE.md`: this evidence log.
- `data/*.json`: local stable-ID ledger records for actors, projects, claims,
  evidence, blockers, decisions, approvals, traces, work items and agent runs.
- `app/ledger.ts`: derived State Ledger, validation checks and dashboard
  adapters now read from `data/*.json`.
- `tests/ledger.test.mjs`: tests validation, duplicate idempotency keys,
  self-verification rejection and fail-closed external approvals.
- `types/raw-imports.d.ts`: declares raw JSONL imports for the app bundle.
- `docs/EVENT_LOG_INTEGRITY.md`: event envelope, hash-chain target, reducer and
  write-path contract.
- `docs/APPROVAL_POLICY_MATRIX.md`: action risk levels and approval rules.
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md`: importer and secret-handling
  boundaries.
- `docs/RELEASE_GATES.md`: local, evidence, production, agentic write,
  integration and backup gates.
- `data/events.jsonl`: migrated to the minimal event integrity envelope.
- `data/approvals.json`: added single-use approval fields.

## Known Gaps

- The app is still mostly read-only.
- Buttons are not wired to write actions.
- State now comes from local JSON ledger files and events load from JSONL. A
  first pure replay path exists for one action, but no append writer or full
  reducer coverage exists yet.
- Dependency audit blocks production deployment.
- No visual screenshot artifact is saved in the repo yet.
- The baseline has one local commit, but no remote backup has been created.
- Event integrity is validated, but the hash function is a deterministic local
  tamper-evidence checksum, not a cryptographic security boundary.

## Next Evidence To Create

Before the next product feature:
- commit the current baseline or otherwise preserve it;
- make one phone review action create an append-only event;
- implement append writer and broader reducer replay;
- capture a screenshot or browser QA artifact after the next visible UI change.
