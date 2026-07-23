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
