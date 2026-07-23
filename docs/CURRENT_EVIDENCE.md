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
- 42 tests passed.

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

### Claim 10: Replay now gates append candidates before applying state

Evidence:
- `replayLedgerEvents()` validates appended events as
  `validateEventLog([...ledger.events, ...eventsToApply])`.
- Replay idempotency checks are seeded from existing `ledger.events`.
- `tests/ledger.test.mjs` verifies invalid event hash does not mutate state.
- `tests/ledger.test.mjs` verifies reuse of an existing idempotency key is
  rejected.
- `npm run verify` passes with 23 tests.

Strength: strong for replay preflight safety. It does not yet prove append-only
file writing.

### Claim 11: The first append-only writer path exists

Evidence:
- `app/ledger-writer.ts` exports `buildProjectNextActionEvent()` and
  `appendProjectNextActionEvent()`.
- Writer reads the current event log from disk before writing.
- Writer validates the existing event log precondition.
- Writer builds the next `sequence`, `previousEventHash` and `eventHash`.
- Writer preflights through `replayLedgerEvents()` before append.
- `tests/ledger.test.mjs` covers human append, duplicate idempotency no-op,
  blocked agent append, approved agent append and invalid existing log
  precondition.
- `npm run verify` passes with 28 tests.

Strength: strong for the first local file-backed write path. It does not yet
prove a UI/API action, current snapshot regeneration or durable approval-used
event.

### Claim 12: The first append writer is hardened against basic races and retry drift

Evidence:
- `app/ledger-writer.ts` uses a per-event-file lock during
  read/build/preflight/append.
- Existing idempotency keys compare payloads before returning no-op.
- Changed retry with the same idempotency key is rejected.
- Exact retry with the same payload is ignored without appending.
- Parallel append test verifies consecutive sequence/hash-chain events.
- `data/approvals.json` scope now matches
  `project-agency-os:project.next_action_updated`.
- `npm run verify` passes with 30 tests.

Strength: strong for local single-file writer hardening. It does not yet prove
multi-process crash recovery or durable approval lifecycle events.

### Claim 13: Single-use approval is durable across writer calls

Evidence:
- `app/ledger.ts` handles `approval.used` during replay.
- `app/ledger-writer.ts` appends a companion `approval.used` event after an
  approved agent project write.
- Writer replays existing events before building a new event, so previous
  approval-use events affect later writes.
- `tests/ledger.test.mjs` verifies that a second writer call using the same
  single-use approval is blocked.
- `npm run verify` passes with 31 tests.

Strength: strong for the first durable approval-use path. It does not yet prove
the full approval approval/request/reject lifecycle.

### Claim 14: Approved agent writes require durable approval events

Evidence:
- `app/ledger.ts` handles `approval.approved` during replay.
- `canUseApproval()` checks requested actor and approval entity.
- `app/ledger-writer.ts` resets approval snapshots before replaying the event
  log, so in-memory approved approvals are not trusted.
- `tests/ledger.test.mjs` verifies that snapshot-only approval is blocked.
- `tests/ledger.test.mjs` verifies durable `approval.approved` enables the
  approved agent write path.
- `npm run verify` passes with 32 tests.

Strength: strong for the first durable approve/use lifecycle. It does not yet
prove rejection, UI approval, or hosted persistence.

### Claim 15: Approval approval events reject basic forgery

Evidence:
- `approval.approved` replay requires a person actor.
- `event.actorId` must equal `after.approverId`.
- Approval event details must match the original `requestedBy`, `actionType`,
  `scope`, `riskLevel` and `entityId`.
- `tests/ledger.test.mjs` verifies agent-forged approval is rejected.
- `tests/ledger.test.mjs` verifies changed-scope approval is rejected.
- `npm run verify` passes with 34 tests.

Strength: strong for the first approval authorization guard. It does not yet
prove a UI approval form or full rejection lifecycle.

### Claim 16: Dashboard-facing state is replay-derived

Evidence:
- `app/ledger.ts` exports `getReplayDerivedLedger()` and
  `derivedStateLedger`.
- Dashboard-facing exports use `derivedStateLedger`.
- `getSanityChecks()` surfaces replay errors for the default derived ledger.
- `tests/ledger.test.mjs` proves an appended `project.next_action_updated`
  event changes derived project `nextAction` without changing the snapshot.
- `npm run verify` passes with 35 tests.

Strength: strong for local replay-derived display state. By itself, this claim
does not prove a visible UI/API write action; Claim 18 covers the first narrow
browser-local path.

### Claim 17: The first human-only local write command exists

Evidence:
- `app/local-command.ts` exports `runProjectNextActionCommand()`.
- The command validates actor, project, next action, idempotency key and
  timestamp.
- The command is person-only and rejects agent actors before writer execution.
- The command appends via `appendProjectNextActionEvent()` and confirms the
  result through replay-derived state.
- `tests/ledger.test.mjs` covers success, blocked agent actor and invalid
  input.
- `npm run verify` passes with 42 tests.

Strength: strong for a local command surface. It does not yet prove browser UI,
HTTP API or external integrations.

### Claim 18: The first browser-local next-action write surface exists

Evidence:
- `app/NextActionForm.tsx` renders a local form for selecting a project and
  submitting a new next action.
- `app/api/local/next-action/route.ts` accepts POST input, fixes the actor to
  `person-serj`, fixes the event path to `data/events.jsonl`, and calls the
  command layer.
- `app/page.tsx` now derives the primary focus project from ledger-facing
  project state instead of the old static seed.
- `tests/rendered-html.test.mjs` verifies that the form appears in rendered
  HTML and that the route does not accept caller-provided actor or event path.
- `tests/ledger.test.mjs` verifies the route against a temporary event ledger:
  POST succeeds, appends exactly one event, uses the human actor, and replay
  confirms the new next action.
- `npm run verify` passes with 42 tests.

Strength: strong for the first local browser-to-ledger write path. It does not
yet prove hosted persistence, real mobile QA, authentication, or general write
coverage beyond project next action.

### Claim 19: Verified claims must satisfy their required evidence types

Evidence:
- `data/claims.json` links the local v0.2 verified claim to both
  `command_output` and `local_url` evidence.
- `data/evidence.json` includes a separate verified `local_url` evidence record
  for the local app URL.
- `validateLedger()` now checks that a verified claim has linked verified
  evidence for every declared `requiredEvidenceTypes` entry.
- `tests/ledger.test.mjs` verifies that removing the `local_url` evidence link
  from the verified claim creates a validation error.
- `npm run verify` passes with 42 tests.

Strength: strong for the first claim/evidence-type contract. It does not yet
prove automated evidence collection or freshness expiry enforcement.

### Claim 20: Unknown state-changing event actions fail closed

Evidence:
- `replayLedgerEvents()` now treats unsupported state-changing actions for
  known state entities as errors instead of silently ignoring them.
- `tests/ledger.test.mjs` verifies that unsupported `capture.note_created`
  fails replay until a reducer explicitly supports it.
- `tests/ledger.test.mjs` verifies that non-state informational events can
  still be ignored.
- `npm run verify` passes with 42 tests.

Strength: strong for reducer safety before adding the capture write surface. It
does not yet implement the `capture.note_created` reducer itself.

### Claim 21: Current stack is accepted for v0.3 local work, not production

Evidence:
- `docs/STACK_AND_TOOLING_DECISION.md` records the stack decision.
- README links the decision with the architecture/evidence docs.
- `docs/AGENT_START_BRIEF.md` tells agents to read the decision before changing
  framework, storage, deployment, packaging or autonomous-agent branch scope.
- `docs/NEXT_AGENT_HANDOFF.md` includes the stack/tooling checkpoint.
- Command: `npm run verify`
- Result: pass with lint, typecheck, build and 42 tests.
- Command: `npm run audit:prod`
- Result: fail on the known Next transitive `postcss`/`sharp` advisories.

Strength: strong for local v0.3 readiness boundaries. It does not clear hosted
production deployment, real auth, backup/restore, multi-user use or broad
parallel autonomous expansion.

### Claim 22: Pre-development readiness audit clears the next bounded branch

Evidence:
- `docs/PRE_DEVELOPMENT_READINESS_AUDIT.md` records the requirement-to-evidence
  readiness matrix.
- README links the readiness audit.
- `docs/NEXT_AGENT_HANDOFF.md` points the next agent to the readiness audit.
- Command: `npm run verify`
- Result: pass with lint, typecheck, build and 42 tests.

Decision:
- Start only the first supervised v0.3 branch:
  `capture.note_created` data/reducer slice.
- Do not start broad parallel autonomous development.

Strength: strong for next-branch readiness. It does not prove the future branch
implementation itself.

### Claim 23: The first capture note replay slice exists

Evidence:
- Branch: `feature/capture-note-created`.
- `app/ledger.ts` defines `CaptureRecord` and keeps captures as derived ledger
  state.
- `replayLedgerEvents()` applies `capture.note_created`.
- Capture replay requires a person actor, project or Inbox, source, body,
  timestamps, classification, review status, linked entity IDs and explicit
  raw-capture redaction status.
- Capture create starts only as `inbox`, `uncategorized` and without linked
  entities. Conversion/classification requires a later event.
- `redactionStatus: not_required` is rejected for capture notes.
- `blocked_sensitive` capture body text is replaced in public derived capture
  records, hidden from `getUncategorizedCaptures()` and absent from phone review
  queue JSON.
- `tests/ledger.test.mjs` covers valid capture replay, Inbox capture, invalid
  capture fields, capture-specific duplicate idempotency, stricter create
  invariants, blocked-sensitive summary/body hiding and unsupported
  `capture.note_updated` fail-closed behavior.
- Command: `npm run verify`
- Result: pass with lint, typecheck, build and 47 tests.

Strength: strong for data/reducer replay. It does not prove a writer, command,
API route, phone form, Telegram action or capture-to-evidence conversion.

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
- `app/ledger-writer.ts`: first guarded append-only writer path.
- `data/approvals.json`: aligned scoped-write permission with runtime action
  scope.
- `app/ledger.ts`: dashboard-facing exports now derive state through replay.
- `app/local-command.ts`: first human-only local command surface.
- `app/NextActionForm.tsx`: first browser-local write form.
- `app/api/local/next-action/route.ts`: local API route into the command layer.
- `app/page.tsx`: primary focus now derives from ledger-facing project state.
- `tests/ledger.test.mjs`: route integration test against a temporary event
  ledger, required evidence type validation and unsupported state-changing
  action rejection.
- `data/claims.json`: local verified claim now links all required evidence
  types.
- `data/evidence.json`: added local URL evidence for the current MVP claim.
- `docs/DATA_MODEL_AND_INVARIANTS.md`: documented claim evidence-type
  invariant.
- `docs/EVENT_LOG_INTEGRITY.md`: updated current write-path status.
- `docs/PRODUCT_DNA.md`: product wedge and validation target.
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`: v0.3 wedge contract and capture contract.
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md`: raw capture quarantine path.
- `docs/SECURITY_AND_APPROVALS.md`: warning for external-action helper.

## Known Gaps

- The app is still mostly read-only.
- The next-action update form is the only active browser write control. Other
  visible queues are intentionally rendered as status/review cards until their
  command models exist.
- State now comes from local JSON ledger files and events load from JSONL. A
  first pure replay path and append writer exist for one action. A local
  human-only command plus browser/API path uses that action, but full reducer
  coverage does not exist yet.
- Writer has lock and idempotency conflict checks, but no durable
  `approval.rejected` lifecycle event yet.
- Dependency audit blocks production deployment.
- No visual screenshot artifact is saved in the repo yet.
- The baseline has one local commit, but no remote backup has been created.
- Event integrity is validated, but the hash function is a deterministic local
  tamper-evidence checksum, not a cryptographic security boundary.

## Next Evidence To Create

Before the next product feature:
- commit the current browser-local write checkpoint;
- make one phone review action create an append-only event;
- broaden reducer replay beyond project next action;
- capture a screenshot or browser QA artifact after the next visible UI change.
