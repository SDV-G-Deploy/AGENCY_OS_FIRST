# Agency OS v0.2 Night Build Plan

## Working Protocol

Every meaningful block starts with PLAN FIRST and ends with PLAN UPDATE.

PLAN FIRST must state:
- goal;
- in scope;
- out of scope;
- done criteria;
- evidence to leave behind.

PLAN UPDATE must state:
- what changed;
- what was verified;
- what failed or was skipped;
- the next safest step.

## Product Direction

Agency OS is a global state and verification layer for a solo builder using
ChatGPT, Codex, Claude, OpenClaw, GitHub and short phone sessions.

It is not another chat workspace. It should answer:
- what projects exist;
- what is active, blocked, paused or stale;
- what claim lacks proof;
- what agent run needs review;
- what the next useful action is.

Trailmark is an inspiration for the evidence ledger, not a product to copy.
Borrow the artifact-first principle: if work leaves no artifact, it is not
trusted as complete.

## v0.2 Scope

Block 1: Plan Contract
- Create or update this plan.
- Keep the build bounded.
- Evidence: this file plus passing local checks.

Block 2: State Ledger Model
- Move from display-only seed data toward a structured local domain model.
- Include projects, work items, evidence, agent runs, blockers, events and
  recommended next steps.
- Out of scope: server database, auth, GitHub API, Telegram API.

Block 3: Sanity Checks
- Add checks for stale evidence, missing next action, blocked project without a
  decision, agent claim without proof, and too many active lanes.
- Evidence: tests proving checks fire on sample data.

Block 4: Visible Product Upgrade
- Surface sanity warnings and recommended next steps in the UI.
- Keep the dashboard useful on phone and laptop.
- Every block should improve the visible product when reasonably possible.

Block 5: Phone Review Queue
- Improve the short-session review area so it shows approve, verify, unblock
  and capture actions derived from state.

Block 6: Docs and Tests
- Update README and rendered HTML tests.
- Stop when build and tests pass.

## Stop Condition

Stop the night build when:
- the local app opens;
- build passes;
- tests pass;
- the dashboard shows State Ledger, sanity checks and recommended next steps;
- the latest PLAN UPDATE is written.

Do not deploy, publish, delete user work, rewrite unrelated files or expand
scope beyond v0.2 during the night cycle.

## PLAN FIRST - 2026-07-22 22:35Z

Block: State Ledger visible layer.

Goal:
- Move from display-only seed data toward a computed State Ledger layer.

In scope:
- Local TypeScript ledger model.
- Sanity checks.
- Recommended next steps.
- Visible UI panels.
- Rendered HTML test updates.

Out of scope:
- Server database.
- GitHub API.
- Telegram API.
- OpenClaw endpoint.
- Deployment.

Done criteria:
- Dashboard renders State Ledger, sanity checks and recommended next steps.
- Local build/test passes.
- PLAN UPDATE is written.

Evidence expected:
- `app/ledger.ts`.
- `app/page.tsx`.
- `tests/rendered-html.test.mjs`.
- Passing `npm test`.

## PLAN UPDATE - 2026-07-22 22:35Z

Block completed: State Ledger visible layer.

Changed:
- Added `app/ledger.ts` with local State Ledger composition, sanity checks,
  recommended next steps, phone review queue and recent ledger events.
- Updated `app/page.tsx` to render State Ledger, sanity warnings, recommended
  next steps and artifact-style event history.
- Updated `app/globals.css` for the new ledger panels.
- Updated rendered HTML tests and README.

Verified:
- `npm test` passes, including build and rendered dashboard checks.

Skipped:
- No database, GitHub API, Telegram API, OpenClaw endpoint or deployment.

Next safest step:
- Add direct rule-level tests for `getSanityChecks`, `getRecommendedSteps` and
  `getPhoneReviewQueue`, then improve the phone review queue from counts into
  actionable approve/verify/unblock/capture cards.

## PLAN FIRST - 2026-07-22 22:55Z

Block: Actionable phone review queue.

Goal:
- Turn the phone review area from category counts into actionable cards.

In scope:
- Add targets and evidence hints to phone review actions.
- Update sidebar UI and CSS.
- Add direct rule-level ledger tests.

Out of scope:
- Real write actions.
- Forms.
- Persistence.
- Telegram/GitHub/OpenClaw integration.
- Deployment.

Done criteria:
- Sidebar shows verify, unblock, approve and capture cards with targets and
  evidence hints.
- Ledger rule tests cover sanity checks, recommended steps and phone review.
- Local build/test passes.

Evidence expected:
- `app/ledger.ts`.
- `app/page.tsx`.
- `app/globals.css`.
- `tests/ledger.test.mjs`.
- Passing `npm test`.

## PLAN UPDATE - 2026-07-22 22:55Z

Block completed: Actionable phone review queue.

Changed:
- Expanded `PhoneReviewAction` with `target` and `evidenceHint`.
- Replaced the sidebar count list with compact verify, unblock, approve and
  capture cards.
- Added direct rule-level tests for sanity checks, recommended steps and phone
  review queue behavior.
- Tightened the agent-claim sanity rule: an `awaiting verification` run now
  counts as an unproven claim even when its proof text is non-empty.
- Updated README and rendered HTML checks.

Verified:
- `npm test` passes, including build, rendered HTML checks and ledger rule
  checks.

Skipped:
- No interactive actions, persistence, Telegram, GitHub, OpenClaw endpoint or
  deployment.

Next safest step:
- Add a small local decision/evidence capture model so phone review cards can
  point to concrete pending items instead of only categories and counts.

## PLAN FIRST - 2026-07-23 Morning

Block: Honesty tails and architecture baseline.

Goal:
- Close the gap between product claims and durable evidence, then create the
  architecture baseline for Agency OS before the next feature branch.

In scope:
- Local verification gates.
- Evidence log.
- Work/evidence protocol.
- Architecture plan.
- Research comparison notes.
- Independent critique.

Out of scope:
- New product feature.
- Persistence implementation.
- External API integration.
- Deployment.

Done criteria:
- `npm run verify` passes.
- Production audit status is recorded honestly.
- Architecture and evidence docs exist.
- Independent subagents review the plan.
- PLAN UPDATE is written.

Evidence expected:
- `docs/AGENCY_OS_ARCHITECTURE.md`.
- `docs/WORK_AND_EVIDENCE_PROTOCOL.md`.
- `docs/RESEARCH_AND_COMPARISON.md`.
- `docs/CURRENT_EVIDENCE.md`.
- Passing `npm run verify`.

## PLAN UPDATE - 2026-07-23 Morning

Block completed: Honesty closure and architecture baseline, first revision.

Changed:
- Added durable architecture docs in `docs/`.
- Added `npm run verify`, `npm run typecheck` and `npm run audit:prod`.
- Fixed lint/typecheck gates by excluding generated/scratch folders and adding
  Cloudflare worker types.
- Updated Next to latest stable `16.2.11`.
- Recorded production audit blocker instead of hiding it.
- Added stable-ID local data skeleton in `data/`.
- Added append-only direction through `data/events.jsonl`.
- Added task artifact folder under `tasks/log/2026-07-23-agency-os-v0-2-honesty-closure/`.
- Added data invariants and security/approval model docs after critic feedback.

Verified:
- `npm run verify` passes.
- `npm run audit:prod` still fails and is recorded as a production deployment
  blocker.

Skipped:
- No UI write actions.
- No database migration.
- No external integrations.
- No deployment.

Next safest step:
- Add schema validation and a reducer around the `data/` skeleton, then make one
  local phone review action append an event and reload derived state.

## PLAN FIRST - 2026-07-23 Morning Follow-up

Block: Make the local JSON ledger the dashboard source of truth.

Goal:
- Close the half-finished transition from display seed data to the `data/`
  ledger skeleton.

In scope:
- Point the main dashboard at derived exports from `app/ledger.ts`.
- Teach ledger tests to load local JSON modules.
- Reject self-verification by the same agent in tests.
- Keep production audit status explicit.

Out of scope:
- UI write actions.
- Event reducer/writer.
- External integrations.
- Deployment.

Done criteria:
- `npm run verify` passes.
- `npm run audit:prod` is rechecked and recorded honestly.
- Evidence docs and this plan are updated.

Evidence:
- `app/page.tsx` imports portfolio/work/evidence/agent/blocker data from
  `app/ledger.ts`.
- `tests/ledger.test.mjs` has 9 passing tests, including validation and
  fail-closed approval coverage.
- `data/evidence.json` no longer marks agent-submitted evidence as verified by
  the same agent.

## PLAN UPDATE - 2026-07-23 Morning Follow-up

Changed:
- Switched the dashboard's project, work, evidence, blocker and agent-run data
  source from `app/seed.ts` to derived `app/ledger.ts` exports.
- Updated ledger tests to load `data/*.json` through temporary modules.
- Added validation tests for current data, duplicate idempotency keys,
  same-agent self-verification and fail-closed external approvals.
- Changed the local verification evidence verifier from `agent-codex` to
  `system-local-verifier`.
- Updated `docs/CURRENT_EVIDENCE.md`.

Verified:
- `npm run verify` passes: lint, typecheck, build, rendered HTML tests and 9
  ledger tests.

Still failing:
- `npm run audit:prod` fails on Next's transitive `postcss` and `sharp`
  advisories. This remains a production deployment blocker.

Next safest step:
- Preserve this baseline, then create a bounded branch/task for the event
  writer/reducer and one phone review action that appends a local event.

## PLAN FIRST - 2026-07-23 Baseline Preservation

Block: Preserve the v0.2 staging baseline.

Goal:
- Create a durable git checkpoint before starting the next branch/task.

In scope:
- Re-run the full local verification gate.
- Commit the non-ignored project files.
- Keep the production audit blocker explicit.

Out of scope:
- New product behavior.
- Branch creation.
- Dependency force fixes.
- Deployment.

Done criteria:
- Baseline commit exists.
- `npm run verify` is green immediately before the commit.
- Any production blocker remains documented.

Evidence:
- Commit `c0c1ebf` with message
  `baseline: agency os v0.2 staging evidence ledger`.
- `npm run verify` passed before commit: lint, typecheck, build and 9 tests.

## PLAN UPDATE - 2026-07-23 Baseline Preservation

Changed:
- Created the first repository checkpoint for the Agency OS v0.2 staging MVP.
- Configured repo-local git author identity as `Codex <codex@local>` because no
  local author identity was set.

Verified:
- `npm run verify` passed before the commit.
- Baseline commit hash: `c0c1ebf`.

Still failing:
- Production dependency audit remains blocked by Next's transitive
  `postcss`/`sharp` advisories.

Next safest step:
- Start a separate branch/task for the local append-only event reducer and one
  phone review action.

## PLAN FIRST - 2026-07-23 Event Source Alignment

Block: Make JSONL events the dashboard event source.

Goal:
- Close the critic-identified honesty gap where `data/events.jsonl` existed but
  `app/ledger.ts` used hardcoded event copies.

In scope:
- Load ledger events from `data/events.jsonl`.
- Ensure custom-ledger validation builds indexes from the passed ledger.
- Add tests that would fail if either regression returns.

Out of scope:
- Event writer.
- Reducer replay over snapshots.
- Hash chain.
- UI write actions.
- External integrations.

Done criteria:
- `stateLedger.events` equals parsed `data/events.jsonl`.
- `validateLedger(customLedger)` does not consult default module maps.
- `npm run verify` passes.

Evidence:
- `app/ledger.ts` imports `data/events.jsonl?raw`.
- `tests/ledger.test.mjs` covers JSONL loading and validation isolation.

## PLAN UPDATE - 2026-07-23 Event Source Alignment

Changed:
- Removed hardcoded `rawEvents` from `app/ledger.ts`.
- Added `parseLedgerEvents()` and raw JSONL import support.
- Reworked ledger indexes so validation and derived functions can use the
  ledger instance passed to them.
- Added tests for JSONL event loading and custom-ledger validation isolation.

Verified:
- `npm run verify` passes: lint, typecheck, build and 11 tests.

Still missing:
- No event writer/reducer yet.
- No hash chain yet.
- No UI action appends events yet.

Next safest step:
- Document and then implement the minimal event integrity contract:
  schemaVersion, sequence, previous hash, current hash, reducer replay,
  approval linkage and redaction boundaries.

## PLAN FIRST - 2026-07-23 Integrity Contracts

Block: Convert critic feedback into explicit architecture contracts.

Goal:
- Make the next reducer/writer implementation bounded by written rules rather
  than chat memory.

In scope:
- Event log integrity contract.
- Approval policy matrix.
- Redaction and import boundaries.
- Release gates.
- Updates to core invariants and evidence protocol.

Out of scope:
- Implementing reducer/writer.
- Wiring UI buttons.
- External integrations.
- Deployment.

Done criteria:
- New docs cover what is stored, where, how work is proven, and what blocks
  release or agentic writes.
- README points to the new contracts.
- `npm run verify` passes.

Evidence:
- `docs/EVENT_LOG_INTEGRITY.md`.
- `docs/APPROVAL_POLICY_MATRIX.md`.
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md`.
- `docs/RELEASE_GATES.md`.
- `README.md` architecture links.

## PLAN UPDATE - 2026-07-23 Integrity Contracts

Changed:
- Added event integrity, approval matrix, redaction/import boundary and release
  gate docs.
- Updated data invariants, security model, evidence protocol and architecture
  milestones with critic-requested fields and stop rules.
- Updated README so the new contracts are discoverable.

Verified:
- `npm run verify` passes: lint, typecheck, build and 11 tests.

Still missing:
- Runtime schema validation.
- Hash-chain implementation.
- Reducer replay.
- Phone action event writer.

Next safest step:
- Ask independent critics to re-score the architecture after this contract pass;
  if they still score below 95, implement the highest-risk missing runtime rule
  first.

## PLAN FIRST - 2026-07-23 Event Log Validator

Block: Add minimal event log integrity validation.

Goal:
- Move from documented event integrity to runtime validation over
  `data/events.jsonl`.

In scope:
- Add minimal event envelope fields to existing events.
- Add deterministic event hash calculation.
- Validate sequence, hash chain, idempotency payloads, approval references,
  trace references and redaction status.
- Surface event validation failures through existing ledger validation.
- Add tests for the new failure modes.

Out of scope:
- Event writer.
- Reducer replay into current snapshots.
- UI actions.
- External integrations.
- Production dependency fixes.

Done criteria:
- Current `data/events.jsonl` validates.
- Broken hash, duplicate sequence, missing redaction and unknown approval are
  caught by tests.
- `npm run verify` passes without lint warnings.

Evidence:
- `app/ledger.ts` exports `calculateEventHash()` and `validateEventLog()`.
- `data/events.jsonl` contains `schemaVersion`, `sequence`,
  `previousEventHash`, `eventHash`, `approvalIds`, `traceId`,
  `redactionStatus` and `retentionClass`.
- `tests/ledger.test.mjs` includes event integrity tests.

## PLAN UPDATE - 2026-07-23 Event Log Validator

Changed:
- Added event envelope and hash-chain validation.
- Migrated the three existing JSONL events to the minimal envelope.
- Added event integrity tests.
- Connected event log validation into `validateLedger()`.

Verified:
- `npm run verify` passes: lint, typecheck, build and 16 tests.

Still missing:
- No append-only writer yet.
- No reducer replay from events into current state yet.
- No approval scope/single-use enforcement on event application yet.
- No redaction scanner fixtures yet.

Next safest step:
- Implement reducer replay for a small allowed action set, or enforce approval
  scope/single-use rules before any phone/UI write action.

## PLAN FIRST - 2026-07-23 Minimal Replay Reducer

Block: Add the first pure replay path for one state-changing action.

Goal:
- Prove that a project state change can be derived from events without mutating
  the input snapshot.

In scope:
- `replayLedgerEvents()` for `project.next_action_updated`.
- Exact duplicate idempotency payloads are ignored.
- Changed duplicate idempotency payloads are rejected.
- Agent writes require scoped approval.
- Single-use approvals are marked used after successful agent replay.
- Redaction `pending_scan` and `blocked_sensitive` fail closed for replay.

Out of scope:
- File append writer.
- UI or API action.
- Full reducer for every event type.
- Cryptographic SHA-256 migration.
- Production dependency fix.

Done criteria:
- Replay updates a cloned ledger and leaves the input snapshot unchanged.
- Agent write fails without approval and succeeds once with valid scoped
  single-use approval.
- `npm run verify` passes without lint warnings.

Evidence:
- `app/ledger.ts` exports `replayLedgerEvents()` and `canUseApproval()`.
- `data/approvals.json` includes single-use approval fields.
- `tests/ledger.test.mjs` includes replay/idempotency/approval tests.

## PLAN UPDATE - 2026-07-23 Minimal Replay Reducer

Changed:
- Added pure replay support for `project.next_action_updated`.
- Added scoped approval validation for agent writes.
- Added single-use approval consumption during replay.
- Added tests for no-mutation replay, exact duplicate idempotency, changed
  duplicate idempotency, missing approval and single-use approval consumption.

Verified:
- `npm run verify` passes: lint, typecheck, build and 21 tests.

Still missing:
- No append-to-file writer.
- No UI/API action creates events.
- Reducer supports only one state-changing action.
- Redaction scanner and importer fixtures are not implemented.

Next safest step:
- Add a local append-event writer function for one phone review action, or add
  redaction/import fixture tests before opening any external input.

## PLAN FIRST - 2026-07-23 Replay Gate Hardening

Block: Require append-chain validation before replay applies state.

Goal:
- Prevent replay from applying malformed or already-used event payloads when a
  caller forgets to validate first.

In scope:
- Seed replay idempotency from existing `ledger.events`.
- Validate appended events as a continuation of the existing event chain.
- Reject invalid event hashes before state mutation.
- Reject idempotency keys already present in the ledger.

Out of scope:
- File append writer.
- UI/API write path.
- Wider reducer action set.
- Redaction scanner.

Done criteria:
- Replay refuses bad hash before state changes.
- Replay refuses changed payload with an existing idempotency key.
- `npm run verify` passes.

Evidence:
- `replayLedgerEvents()` calls `validateEventLog([...ledger.events, ...eventsToApply])`.
- `tests/ledger.test.mjs` includes invalid-hash and existing-idempotency replay
  tests.

## PLAN UPDATE - 2026-07-23 Replay Gate Hardening

Changed:
- Hardened `replayLedgerEvents()` so append candidates pass event-log
  validation before reducer application.
- Seeded idempotency checks from already recorded ledger events.
- Added tests for invalid append hash and existing ledger idempotency reuse.

Verified:
- `npm run verify` passes: lint, typecheck, build and 23 tests.

Still missing:
- No file-backed append writer.
- No durable `approval.used` event is written.
- Redaction scanner/import fixture tests are not implemented.

Next safest step:
- Implement one append-only writer path for `project.next_action_updated`, with
  preflight validation and replay confirmation, or stop if a human product
  choice is needed before writes become visible.

## PLAN FIRST - 2026-07-23 Append Writer Path

Block: Add one file-backed append writer without UI.

Goal:
- Prove that Agency OS can create one durable state-changing event through a
  guarded runtime path.

In scope:
- Build a `project.next_action_updated` event from current ledger state.
- Read the current `events.jsonl` file before writing.
- Refuse writes when the existing event log is invalid.
- Refuse duplicate idempotency as a no-op.
- Preflight the event through replay before append.
- Append exactly one JSONL line after successful preflight.
- Test human write, agent write with approval, agent write without approval,
  duplicate idempotency and broken existing log.

Out of scope:
- UI/API surface.
- Updating current snapshot JSON files after append.
- Durable `approval.used` companion event.
- Redaction scanner.
- Wider reducer action set.

Done criteria:
- Writer appends a valid next sequence/hash-chain event in a temp event log.
- Writer blocks unsafe writes before disk append.
- `npm run verify` passes.

Evidence:
- `app/ledger-writer.ts`.
- `tests/ledger.test.mjs` writer tests.

## PLAN UPDATE - 2026-07-23 Append Writer Path

Changed:
- Added `app/ledger-writer.ts` with `buildProjectNextActionEvent()` and
  `appendProjectNextActionEvent()`.
- Writer reads the current event log, validates existing chain, builds the next
  envelope, preflights via `replayLedgerEvents()`, and appends after success.
- Added tests for successful human append, duplicate idempotency no-op, blocked
  agent append, approved agent append and invalid existing log precondition.

Verified:
- `npm run verify` passes: lint, typecheck, build and 28 tests.

Still missing:
- No visible UI/API action calls the writer.
- Current JSON snapshots are not regenerated after append.
- Approval consumption is not yet written as its own durable event.
- Redaction/import scanner fixtures remain missing.

Next safest step:
- Add a server/API or local command wrapper around the writer only after
  deciding whether the first visible write should be phone-mode capture or
  laptop command-center action.

## PLAN FIRST - 2026-07-23 Writer Hardening

Block: Harden the first append writer before exposing it.

Goal:
- Remove the two biggest writer honesty gaps found by independent critics:
  concurrent sequence races and hidden idempotency conflicts.

In scope:
- Per-file lock around read/build/preflight/append.
- Conflict detection when an existing idempotency key has a different payload.
- Exact retry no-op for identical idempotency payload.
- Approval scope data aligned with runtime policy.
- Tests for idempotency conflict, exact retry and parallel append.

Out of scope:
- Durable `approval.used` companion event.
- UI/API command surface.
- Snapshot regeneration.
- Redaction scanner.

Done criteria:
- Parallel appends serialize to consecutive sequence/hash-chain events.
- Changed retry is rejected as a conflict.
- Exact retry is a no-op.
- `npm run verify` passes.

Evidence:
- `app/ledger-writer.ts` lock and payload comparison.
- `tests/ledger.test.mjs` writer-hardening coverage.

## PLAN UPDATE - 2026-07-23 Writer Hardening

Changed:
- Added a lock-file guard around the first append writer.
- Added comparable idempotency payload checks.
- Changed duplicate idempotency behavior: exact retry is ignored, changed retry
  is rejected.
- Fixed `data/approvals.json` scope to match
  `project-agency-os:project.next_action_updated`.
- Updated writer tests.

Verified:
- `npm run verify` passes: lint, typecheck, build and 30 tests.

Still missing:
- No durable `approval.used` event is appended.
- No visible command/API/UI surface calls the writer.
- Current dashboard state is not yet derived from replayed appended events.
- Redaction scanner/import fixtures are not implemented.

Next safest step:
- Add durable `approval.used` event emission for approved agent writes, or add a
  local command wrapper that writes and then replays the updated event log into
  derived state.

## PLAN FIRST - 2026-07-23 Durable Approval Use

Block: Make single-use approval durable across writer calls.

Goal:
- Prevent an approved agent write from reusing the same single-use approval in a
  later writer invocation.

In scope:
- Add replay support for `approval.used`.
- Make agent writer append a companion `approval.used` event after successful
  approved project write.
- Replay current event log before building a new event, so writer state includes
  previous durable approval usage and current replayed `nextAction`.
- Test reuse of the same approval across two separate writer calls.

Out of scope:
- Full approval lifecycle events such as `approval.approved`.
- UI/API write surface.
- Redaction scanner.
- Cryptographic hash upgrade.

Done criteria:
- Approved agent write appends a project event and an `approval.used` event.
- Second writer call with the same single-use approval is blocked.
- `npm run verify` passes.

Evidence:
- `app/ledger.ts` handles `approval.used`.
- `app/ledger-writer.ts` emits companion approval-use events.
- `tests/ledger.test.mjs` verifies durable single-use behavior.

## PLAN UPDATE - 2026-07-23 Durable Approval Use

Changed:
- Added reducer support for `approval.used`.
- Writer now replays existing events before building the next write.
- Approved agent writes append a durable `approval.used` companion event.
- Added test coverage for blocking reuse of a single-use approval across
  separate writer calls.

Verified:
- `npm run verify` passes: lint, typecheck, build and 31 tests.

Still missing:
- No visible UI/API command surface.
- No full `approval.approved` event lifecycle.
- Redaction scanner/import fixtures are not implemented.
- Dashboard state is not yet visibly derived from replayed appended events.

Next safest step:
- Add a local command/API wrapper that invokes the writer and then displays
  replay-derived state, or implement `approval.approved` lifecycle before
  granting agent writes from the UI.

## PLAN FIRST - 2026-07-23 Durable Approval Approval

Block: Require durable approval before approved agent writes.

Goal:
- Stop writer calls from trusting an in-memory approved approval snapshot.

In scope:
- Add replay support for `approval.approved`.
- Make writer derive approval state by replaying existing JSONL events before
  building a new event.
- Require approval actor/entity/scope alignment for agent writes.
- Test that snapshot-only approval is ignored and durable approval event is
  required.

Out of scope:
- UI approval form.
- Full approval rejection/request lifecycle.
- Redaction scanner.
- Hosted persistence.

Done criteria:
- Agent write with only an approved snapshot is blocked.
- Agent write with durable `approval.approved` event succeeds and then emits
  `approval.used`.
- `npm run verify` passes.

Evidence:
- `app/ledger.ts` handles `approval.approved`.
- `app/ledger-writer.ts` resets approval snapshots before replaying events.
- `tests/ledger.test.mjs` includes snapshot-only approval rejection.

## PLAN UPDATE - 2026-07-23 Durable Approval Approval

Changed:
- Added reducer support for `approval.approved`.
- `canUseApproval()` now checks requested actor and approval entity.
- Writer resets approval state and derives approved/used status from the event
  log before building a new write.
- Added tests for durable approval and blocking snapshot-only approval.

Verified:
- `npm run verify` passes: lint, typecheck, build and 32 tests.

Still missing:
- No UI/API approval surface.
- No `approval.rejected` lifecycle.
- Redaction scanner/import fixtures are not implemented.
- Dashboard state is not yet visibly derived from replayed appended events.

Next safest step:
- Either add the first local command/API wrapper for the writer, or add a small
  replay-derived state adapter so the dashboard can show appended event effects.

## PLAN FIRST - 2026-07-23 Approval Event Authorization

Block: Protect durable approval events from forgery.

Goal:
- Ensure `approval.approved` cannot be forged by an agent or used to mutate the
  original approval request scope.

In scope:
- `approval.approved` replay validation requires a person actor.
- `event.actorId` must match `after.approverId`.
- `requestedBy`, `actionType`, `scope`, `riskLevel` and `entityId` must match
  the original approval request.
- Add negative tests for forged agent approval and scope mutation.

Out of scope:
- UI approval form.
- `approval.rejected` lifecycle.
- Redaction scanner.
- Hosted persistence.

Done criteria:
- Forged agent approval is rejected.
- Approval event that changes requested scope is rejected.
- Existing durable approval/write tests still pass.
- `npm run verify` passes.

Evidence:
- `app/ledger.ts` approval approval validation.
- `tests/ledger.test.mjs` forged approval tests.

## PLAN UPDATE - 2026-07-23 Approval Event Authorization

Changed:
- Hardened `approval.approved` replay validation.
- Approval approval events now require person actor, matching approver, and
  immutable request details.
- Added negative tests for agent-forged approval and changed-scope approval.

Verified:
- `npm run verify` passes: lint, typecheck, build and 34 tests.

Still missing:
- No UI/API approval surface.
- No redaction scanner/import fixtures.
- Dashboard state is not yet visibly derived from replayed appended events.
- Production audit remains blocked by Next/PostCSS/sharp advisories.

Next safest step:
- Stop implementation for this cycle unless we choose the next product-visible
  surface: command/API writer wrapper versus dashboard replay-derived state.

## PLAN FIRST - 2026-07-23 Replay-Derived Dashboard State

Block: Make dashboard state derive from event replay.

Goal:
- Ensure appended events can become visible state without hand-editing
  `data/projects.json`.

In scope:
- Add a replay-derived ledger adapter.
- Make dashboard-facing exports use the derived ledger.
- Surface replay errors through sanity checks.
- Add a test proving an appended `project.next_action_updated` changes derived
  project state while leaving the snapshot unchanged.

Out of scope:
- UI buttons.
- API endpoint.
- Writing to real `data/events.jsonl` during tests.
- Full reducer action coverage.
- Redaction scanner.

Done criteria:
- `projects` and other display exports are based on derived state.
- Synthetic appended event changes derived `nextAction`.
- `npm run verify` passes.

Evidence:
- `app/ledger.ts` exports `getReplayDerivedLedger()` and
  `derivedStateLedger`.
- `tests/ledger.test.mjs` covers derived state over snapshot.

## PLAN UPDATE - 2026-07-23 Replay-Derived Dashboard State

Changed:
- Added `getReplayDerivedLedger()` and `derivedStateLedger`.
- Dashboard-facing exports now use replay-derived state instead of raw snapshot
  state.
- Sanity checks include replay errors for the default derived ledger.
- Added derived-state test for appended next-action events.

Verified:
- `npm run verify` passes: lint, typecheck, build and 35 tests.

Still missing:
- No visible UI/API action calls the writer.
- Full reducer coverage is still limited.
- Redaction scanner/import fixtures are not implemented.
- Production audit remains blocked by Next/PostCSS/sharp advisories.

Next safest step:
- Add a narrow local command or API endpoint that calls the writer, then use the
  existing derived-state path to show its result.

## PLAN FIRST - 2026-07-23 Human-Only Local Command

Block: Add the first human-only write surface.

Goal:
- Prove a bounded user-facing workflow can validate input, append a safe event
  and confirm replay-derived state.

In scope:
- Local command wrapper for `project.next_action_updated`.
- Runtime input validation.
- Person-only actor gate.
- Writer invocation.
- Replay-derived confirmation after append.
- Tests for success, blocked agent actor and invalid input.

Out of scope:
- Browser UI.
- HTTP API.
- External integrations.
- Agent autonomy.
- Broad schema framework.

Done criteria:
- Human command writes a next-action event and confirms derived state.
- Agent actor cannot use the human-only command.
- Invalid input is rejected before writer execution.
- `npm run verify` passes.

Evidence:
- `app/local-command.ts`.
- `tests/ledger.test.mjs` command tests.

## PLAN UPDATE - 2026-07-23 Human-Only Local Command

Changed:
- Added `runProjectNextActionCommand()`.
- Command validates actor, project, next action, idempotency key and timestamp.
- Command calls the guarded writer and confirms the result through replay-derived
  state.
- Added tests for successful human command, blocked agent actor and invalid
  input.

Verified:
- `npm run verify` passes: lint, typecheck, build and 38 tests.

Still missing:
- No browser UI or HTTP API surface.
- No redaction scanner/import fixtures.
- Reducer coverage remains intentionally narrow.
- Production audit remains blocked by Next/PostCSS/sharp advisories.

Next safest step:
- Ask independent critic whether the remaining work is still useful without a
  human product choice. If yes, likely add minimal runtime schema validation or
  redaction fixtures; if no, stop and ask which visible surface should be first.

## PLAN FIRST - 2026-07-23 Browser-Local Write Honesty

Block: Close honesty tails on the first visible write path.

Goal:
- Make the browser-local next-action update checkpoint-grade instead of merely
  visible.

In scope:
- Derive the primary focus panel from ledger-facing project state.
- Add an integration-style test for `POST /api/local/next-action` using a
  temporary event ledger.
- Update evidence/protocol/architecture documents.
- Refresh comparison notes against current adjacent products and repositories.

Out of scope:
- Production deployment.
- Auth.
- GitHub/Telegram/OpenClaw integrations.
- New entity write commands beyond project next action.
- Cryptographic event signing.

Done criteria:
- Browser route writes to a temporary event log in tests.
- Replay confirms the route-updated next action.
- Hero/focus does not depend on the old static focus seed.
- `npm run verify` passes.
- Docs name what is proven and what remains unproven.

Evidence:
- `app/page.tsx`
- `app/NextActionForm.tsx`
- `app/api/local/next-action/route.ts`
- `tests/ledger.test.mjs`
- `docs/CURRENT_EVIDENCE.md`
- `docs/AGENCY_OS_ARCHITECTURE.md`
- `docs/RESEARCH_AND_COMPARISON.md`

## PLAN UPDATE - 2026-07-23 Browser-Local Write Honesty

Changed:
- Primary focus now derives from ledger-facing project state instead of
  `focusStack`.
- Added a route integration test that posts to `/api/local/next-action` against
  a temporary `data/events.jsonl`, verifies exactly one appended event, and
  confirms the new next action through replay-derived state.
- Updated the evidence log with Claim 18 for the browser-local write path.
- Expanded the architecture document with the product backbone, system-of-record
  ladder, module map, fact confirmation contract and artifact trail.
- Updated research/comparison notes with current Buzz, Trailmark, action-ledger,
  auditable-AI and 2026 governance implications.

Verified:
- `npm run verify` passes: lint, typecheck, build and 39 tests.
- `npm run audit:prod` still fails on Next transitive `postcss` and `sharp`
  advisories, so production remains blocked.

Still missing:
- Most UI buttons remain inert.
- Reducer coverage is still narrow.
- No approval rejection lifecycle.
- No export/backup/restore.
- No real GitHub/Telegram/OpenClaw importers.
- No cryptographic signing.

Next safest step:
- Run another independent critic against the updated architecture and code. If
  the critic still scores below target, patch documents or code only where the
  criticism is concrete and not a product choice that needs the human.

## PLAN FIRST - 2026-07-23 UI Honesty Sweep

Block: Remove false affordances from the visible dashboard.

Goal:
- Stop the UI from implying actions that do not have command models yet.

In scope:
- Convert inert dashboard buttons and filters into non-interactive status or
  planned-work labels.
- Rename "actionable phone review cards" where they are review cards, not
  write actions.
- Add a rendered/source test that blocks active controls in `app/page.tsx`.
- Clarify the UI honesty gate in architecture/docs.

Out of scope:
- Evidence attach command.
- Resolve blocker command.
- Verifier command.
- Portfolio filter behavior.
- Phone review write commands.

Done criteria:
- The only active browser write control is the next-action form.
- `app/page.tsx` has no `<button>` elements.
- Inert action text is replaced by planned/status text.
- `npm run verify` passes.

Evidence:
- `app/page.tsx`
- `app/globals.css`
- `tests/rendered-html.test.mjs`
- `README.md`
- `docs/CURRENT_EVIDENCE.md`
- `docs/WORK_AND_EVIDENCE_PROTOCOL.md`
- `docs/AGENCY_OS_ARCHITECTURE.md`

## PLAN UPDATE - 2026-07-23 UI Honesty Sweep

Changed:
- Removed inert `Attach evidence`, portfolio filter, `Resolve` and
  `Run verifier` buttons from the dashboard.
- Replaced them with status/planned labels.
- Added a rendered/source contract that `app/page.tsx` contains no buttons and
  no obsolete pseudo-control classes.
- Updated README and evidence/protocol docs to describe phone review cards as
  queues/status, not active write actions.
- Reclassified the "visible active control without command model" rule as a UI
  honesty gate backed by tests for v0.2.

Verified:
- `npm run verify` passes: lint, typecheck, build and 39 tests.

Next safest step:
- Run `npm run verify`, then run an independent critic again.

## PLAN FIRST - 2026-07-23 Evidence Contract Cleanup

Block: Make verified claims prove their declared evidence contract.

Goal:
- Close the mismatch where a verified claim required `local_url` evidence but
  only linked command output.

In scope:
- Add validation for required verified evidence types.
- Add missing structured local URL evidence for the v0.2 local claim.
- Add a regression test for missing required evidence type.
- Update stale event/data model docs called out by the critic.
- Make the project state overview look non-interactive.

Out of scope:
- Evidence upload UI.
- Automated URL probing.
- Freshness expiry engine.
- Hosted authentication.

Done criteria:
- A verified claim missing a required verified evidence type fails validation.
- The current v0.2 verified claim satisfies `command_output` and `local_url`.
- Docs no longer say the first write path is not wired to UI/API.
- `npm run verify` passes.

Evidence:
- `app/ledger.ts`
- `data/claims.json`
- `data/evidence.json`
- `tests/ledger.test.mjs`
- `docs/DATA_MODEL_AND_INVARIANTS.md`
- `docs/EVENT_LOG_INTEGRITY.md`

## PLAN UPDATE - 2026-07-23 Evidence Contract Cleanup

Changed:
- `validateLedger()` now requires verified claims to link verified evidence for
  every declared required evidence type.
- Added `evidence-local-v0-2-url` and linked it to the verified local v0.2
  claim.
- Added a regression test for missing required evidence type.
- Updated stale event/data model docs about the current browser-local write
  path.
- Restyled project state overview so Active/Paused/Archived reads as status,
  not as an inert segmented control.

Verified:
- `npm run verify` passes: lint, typecheck, build and 40 tests.

Still missing:
- Production audit remains blocked.
- No automatic evidence collection or freshness expiry enforcement.
- No visual screenshot artifact.
- No hosted auth or backup/export/restore.

Next safest step:
- Run independent critic cycle 3. If the score is at least 95, commit this
  checkpoint. If not, only patch concrete factual gaps; stop for human choice
  if the remaining concerns are product direction.

## PLAN UPDATE - 2026-07-23 Independent Critic Round 3

Result:
- Independent critic score: 96/100.
- The critic judged the v0.2 honesty-tail checkpoint coherent enough to commit.

Verified:
- `npm run verify` passes: lint, typecheck, build and 40 tests.
- Production audit remains a documented blocker through Next transitive
  `postcss` and `sharp` advisories.

Why the checkpoint clears:
- False UI actions are removed or rendered as planned/status labels.
- The first browser-local write path is real and tested against a temporary
  event ledger.
- Verified claims must satisfy required evidence types.
- Architecture docs now cover product backbone, module map, source-of-truth
  ladder, evidence contract, work trace policy and market comparison.

Residual risks for future milestones:
- Only `project.next_action_updated` has full write/replay coverage.
- Phone review cards are status queues, not write actions.
- No hosted auth, backup/export/restore, importer fixtures, screenshot artifact
  or cryptographic event signing.
- The local write path is fixed to `person-serj`; broader actor/session design
  remains a product decision.

Next safest step:
- Commit this checkpoint, then choose the next branch: phone review write,
  evidence attach, backup/export, or GitHub importer.

## PLAN FIRST - 2026-07-23 Product DNA Lock

Block: Clarify the product before the next coding stage.

Goal:
- Define Agency OS product DNA, wedge, first user, first repeated workflow,
  development flow and validation path before adding more features.

In scope:
- Product DNA document.
- Product development flow document.
- Current-market/best-practice web check.
- Independent product/architecture/UX critique cycles.
- Doc and UI wording fixes when critics identify concrete overclaims.

Out of scope:
- New runtime product features.
- Production deployment.
- New external integrations.

Done criteria:
- Product plan is explicit enough to guide the next coding branch.
- Independent critic score reaches at least 95/100 or remaining issues require
  human product choice.
- `npm run verify` remains green.

Evidence:
- `docs/PRODUCT_DNA.md`
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`
- `docs/RESEARCH_AND_COMPARISON.md`
- critic reports in this thread.

## PLAN UPDATE - 2026-07-23 Product Critic Round 1

Result:
- Independent product strategy critic score: 84/100.

Main criticism:
- The product spine is real, but the wedge was still too broad and
  self-referential.
- First market, first non-Serj user, first repeated workflow, first aha and
  package path were under-specified.
- UI wording overclaimed cross-tool coverage before importers exist.

Changed:
- Added `docs/PRODUCT_DNA.md`.
- Added `docs/PRODUCT_DEVELOPMENT_FLOW.md`.
- Added `v0.3 Wedge Contract`.
- Chose the next wedge as a local cross-tool personal truth ledger for solo
  builders.
- Chose the first package path: local solo-builder kit.
- Chose first external profile: independent AI-heavy builder with 2-6 active
  projects.
- Chose first repeated workflow: capture raw state, link it to a project, and
  turn it into next action/review.
- Changed dashboard wording from "global state layer over" to "local truth
  ledger staging for" cross-tool sources.

Verified:
- `npm run verify` passes: lint, typecheck, build and 40 tests.

Next safest step:
- Run architecture/security critic against the narrowed wedge, then patch
  concrete gaps.

## PLAN UPDATE - 2026-07-23 Architecture Critic Round 1

Result:
- Independent architecture/security critic score: 92/100.

Main criticism:
- `capture.note_created` was the recommended next command but had no concrete
  data contract.
- Raw capture/import redaction and quarantine were not explicit enough for the
  next write surface.
- Unknown state-changing reducer actions were silently ignored.
- External-action approval helper was weaker than scoped approval logic.

Changed:
- Added capture data model and invariants.
- Added `capture.note_created` contract to the product development flow.
- Added raw capture quarantine rules.
- Updated event integrity contract to fail closed on unknown state-changing
  actions.
- Updated replay behavior and tests so unsupported state-changing actions are
  errors while non-state informational events can still be ignored.
- Documented that `canRunExternalAction()` must not be used for real external
  actions before being narrowed or replaced.

Verified:
- `npm run verify` passes: lint, typecheck, build and 42 tests.

Next safest step:
- Run `npm run verify`, then run UX/solo-builder critic.

## PLAN UPDATE - 2026-07-23 UX Critic Round 1

Result:
- Independent UX / solo-builder workflow critic score: 89/100.

Main criticism:
- The plan said phone-first, but the next slice was not yet defined as a
  concrete first mobile viewport.
- Raw capture alone could become another inbox unless it immediately shows what
  changed and what remains to review.
- Daily use definition was too broad for a tired solo builder.
- Packaging still sounded like project staging more than a local kit.

Changed:
- Defined v0.3 as one phone-first vertical slice:
  capture one note/fact, choose project or Inbox, save, see confirmation, last
  three uncategorized captures and one suggested next action/review item.
- Added default daily ritual.
- Added UX acceptance states: empty queue, saving, saved, duplicate, error,
  local write failure, redaction pending, blocked-sensitive, mobile proof.
- Updated README packaging from "Project Portfolio Staging" to "Local Solo
  Builder Kit".

Verified:
- `npm run verify` passes: lint, typecheck, build and 42 tests.

Next safest step:
- Run `npm run verify`, then rerun independent critics against the tightened
  product plan.

## PLAN UPDATE - 2026-07-23 Final Product DNA Critic

Result:
- Final independent combined critic score: 96/100.

Verified:
- `npm run verify` passes: lint, typecheck, build and 42 tests.

Why this clears:
- Product DNA is explicit.
- Wedge is narrowed to a local cross-tool personal truth ledger.
- First package path is the local solo-builder kit.
- First external user is an independent AI-heavy builder with 2-6 projects.
- v0.3 is a phone-first vertical slice: capture note/fact, choose project or
  Inbox, save, see confirmation, last three uncategorized captures and one
  suggested next action/review item.
- Capture contract, quarantine/redaction policy and unsupported
  state-changing-event fail-closed behavior are documented and partially
  enforced before coding the write surface.

Residual future risks:
- Production deployment remains blocked by dependency audit.
- Redaction is designed but not yet runtime-enforced for capture.
- Backup/export/restore is still required before daily reliance.
- v0.3 capture reducer/write UI is intentionally next, not present now.
- External validation needs a non-Serj user after the phone capture slice.

Next safest step:
- Commit this product DNA checkpoint.
