# Next Agent Handoff

Status: current handoff  
Last updated: 2026-07-24

## Handoff Freshness

Branch:
- `feature/docs-freshness-pass`

Commit:
- this handoff is included in the docs freshness slice commit; run
  `git log -1 --oneline` after checkout for the exact checkpoint hash.

Working tree state after this handoff checkpoint:
- expected clean.

Last verified command/result:
- `git diff --check`
- pass.
- `npm run verify` was attempted twice in this isolated worktree and did not
  reach project checks because worktree-local `node_modules` is absent
  (`eslint` / imported `eslint` package not found).

Conflict rule:
- if this handoff conflicts with current code/tests, trust code/tests, inspect
  relevant files and update this handoff.

## Current Position

Agency OS now has a canonical local repo and GitHub remote:
- local: `C:\Agency_os_first\AGENCY_OS_FIRST`;
- GitHub: `https://github.com/SDV-G-Deploy/AGENCY_OS_FIRST`.

Agency OS is on `main`. The capture triage contract, replay support,
command/API seam and capture candidate validation fix are merged and pushed to
GitHub.

The next branch or continuation should stay inside the v0.3 phone-first capture
path, starting from the contracts already written in:
- `docs/AGENT_START_BRIEF.md`;
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`;
- `docs/PRE_DEVELOPMENT_READINESS_AUDIT.md`;
- `docs/STACK_AND_TOOLING_DECISION.md`;
- `docs/DATA_MODEL_AND_INVARIANTS.md`;
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md`;
- `docs/EVENT_LOG_INTEGRITY.md`.

## Last Completed Work

Product planning checkpoint:
- Product DNA locked.
- v0.3 wedge narrowed to Local Solo Builder Kit.
- Phone-first capture slice defined.
- Capture contract documented.
- Unknown state-changing actions fail closed.
- Verify passed at that historical checkpoint; current verification is tracked
  in Handoff Freshness.
- Final combined critic score reached 96/100.

Current context-protocol checkpoint:
- Agent start brief added.
- Handoff protocol added.
- Next-agent handoff added.

Stack/tooling checkpoint:
- Current stack is kept for v0.3 local product development.
- Production deployment remains blocked by dependency audit.
- Storage/auth/deployment/desktop changes require reading
  `docs/STACK_AND_TOOLING_DECISION.md` first.
- Autonomous work is allowed only as one branch, one slice and one command or
  event type at a time, with human review before merge if files outside the
  planned slice change.

Pre-development readiness checkpoint:
- `docs/PRE_DEVELOPMENT_READINESS_AUDIT.md` clears only the first supervised
  v0.3 branch.
- The first `capture.note_created` data/reducer slice is now implemented.

Local capture write checkpoint:
- `buildCaptureNoteEvent()` and `appendCaptureNoteEvent()` create
  hash-chained `capture.note_created` events behind the existing event-log lock.
- `runCaptureNoteCommand()` is person-only, accepts project or Inbox, requires
  body/source/timestamps/idempotency key and defaults raw capture redaction to
  `pending_scan`.
- `/api/local/capture-note` fixes the local actor to `person-serj` and writes
  through `data/events.jsonl` relative to the running repo.
- Exact capture retries with the same idempotency payload are no-ops.
- Invalid existing logs, `redactionStatus: not_required` for raw capture and
  agent actors are blocked before durable append.

Changed files in the previous writer/API slice:
- `app/ledger-writer.ts`
- `app/local-command.ts`
- `app/api/local/capture-note/route.ts`
- `tests/ledger.test.mjs`
- `docs/NEXT_AGENT_HANDOFF.md`

Mobile capture form checkpoint:
- `app/CaptureNoteForm.tsx` adds a small local form for one note/fact.
- The form lets the user choose Inbox or an existing project.
- Source defaults to `phone` and can be changed to `laptop` or `manual`.
- Submit posts to `/api/local/capture-note` and shows success/error
  confirmation.
- The phone-mode panel shows the last three uncategorized captures from
  replay-derived state.
- No UI conversion to evidence, blockers, decisions or tasks was added.

Changed files in the previous mobile capture form slice:
- `app/CaptureNoteForm.tsx`
- `app/page.tsx`
- `app/globals.css`
- `tests/rendered-html.test.mjs`
- `docs/NEXT_AGENT_HANDOFF.md`

Mobile capture placement checkpoint:
- The phone-mode panel now says "Capture first, then review."
- The capture form renders before the phone review cards in source and visual
  order.
- Project and source controls are grouped into a compact row so the first phone
  viewport reaches note entry and submit sooner.
- Rendered/static tests assert the capture-first order.
- Approval replay now evaluates scoped approval expiry at the event timestamp,
  not the current wall clock, so historical verified ledger events do not rot
  when the calendar advances. This fixed the July 24 verify failure without
  relaxing approval rules.

Changed files in this slice:
- `app/CaptureNoteForm.tsx`
- `app/page.tsx`
- `app/globals.css`
- `app/ledger.ts`
- `tests/rendered-html.test.mjs`
- `tests/ledger.test.mjs`
- `docs/NEXT_AGENT_HANDOFF.md`

Local capture smoke checkpoint:
- `npm run smoke:capture` exercises `runCaptureNoteCommand()` against a
  temporary copied event log.
- The smoke script appends one `capture.note_created` event to the temp log and
  asserts the real `data/events.jsonl` is byte-for-byte unchanged.
- `npm test` now includes `tests/capture-smoke.test.mjs`, which runs the smoke
  command and checks the same non-mutation invariant.
- `README.md` documents the smoke command.

Changed files in this slice:
- `scripts/smoke-capture-note.mjs`
- `tests/capture-smoke.test.mjs`
- `package.json`
- `README.md`
- `docs/NEXT_AGENT_HANDOFF.md`

Capture triage contract checkpoint:
- `capture.review_marked` is documented as the first normal review/triage event
  after `capture.note_created`.
- Actor is person-only for v0.3.
- Allowed transition is `reviewStatus: uncategorized` to
  `reviewStatus: triaged`.
- Required fields are `captureId`, `reviewStatus: "triaged"`, `candidateType`
  and `reviewedAt`.
- `candidateType` values are `evidence_candidate`, `blocker_candidate`,
  `decision_candidate` and `next_action_candidate`.
- The event marks a candidate only: it does not convert captures, create linked
  entities, verify claims or make raw text trusted.
- `blocked_sensitive` captures remain hidden from normal summaries and are not
  reviewed through the normal flow.

Changed files in this slice:
- `docs/DATA_MODEL_AND_INVARIANTS.md`
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md`
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`
- `docs/NEXT_AGENT_HANDOFF.md`

Capture review replay checkpoint:
- `CaptureRecord` now carries nullable `candidateType` and `reviewedAt` fields
  in derived state.
- Replay applies valid `capture.review_marked` events for existing captures.
- Replay validates person-only actor, capture entity target, matching
  `captureId`, `reviewStatus: "triaged"`, valid candidate type, valid
  `reviewedAt` and `uncategorized -> triaged` transition.
- Normal review of `blocked_sensitive` captures is rejected.
- Review marking preserves raw body quarantine, creates no linked entities and
  does not convert captures to evidence/blockers/decisions/tasks.
- Focused tests cover successful marking, invalid markings, repeat review and
  blocked-sensitive rejection.

Changed files in this slice:
- `app/ledger.ts`
- `tests/ledger.test.mjs`
- `docs/NEXT_AGENT_HANDOFF.md`

Capture review command/API checkpoint:
- `buildCaptureReviewMarkedEvent()` and `appendCaptureReviewMarkedEvent()`
  create hash-chained `capture.review_marked` events behind the existing
  event-log lock.
- `runCaptureReviewMarkedCommand()` is person-only, validates an existing
  replay-derived capture, rejects blocked-sensitive and already-reviewed
  captures, and confirms triaged candidate state after append.
- `/api/local/capture-review` fixes the local actor to `person-serj` and
  delegates to the local command against `data/events.jsonl` relative to the
  running repo.
- Exact capture-review retries with the same idempotency payload are no-ops.
- Focused tests cover writer append/retry, command success, agent rejection,
  command/API retry, blocked-sensitive rejection and the local POST route using
  temp event logs.
- No UI, importer, auth/storage/deployment or conversion behavior was changed.

Changed files in this slice:
- `app/ledger-writer.ts`
- `app/local-command.ts`
- `app/api/local/capture-review/route.ts`
- `tests/ledger.test.mjs`
- `docs/NEXT_AGENT_HANDOFF.md`

Capture candidate validation checkpoint:
- `validateLedger()` now uses the same candidate-only allow-list as replay and
  command validation.
- `candidateType: "inbox"` is rejected for reviewed captures.
- Focused tests cover the snapshot validation gap.

Docs freshness checkpoint:
- Secondary docs now reflect current `main` at `fdffa3d`.
- Current verification references use the 66-test gate.
- Capture note writer/command/API/form/smoke work is documented as
  implemented.
- Capture review contract/replay/writer/command/API work is documented as
  implemented, with only the mobile review UI affordance remaining next.
- `docs/EVENT_LOG_INTEGRITY.md` lists implemented event write/replay paths for
  `project.next_action_updated`, `capture.note_created` and
  `capture.review_marked`.
- Verified with `git diff --check`; full `npm run verify` was blocked by the
  missing dependency install in this separate worktree.

Changed files in this fix:
- `app/ledger.ts`
- `tests/ledger.test.mjs`

Changed files in the docs freshness slice:
- `docs/CURRENT_EVIDENCE.md`
- `docs/PRE_DEVELOPMENT_READINESS_AUDIT.md`
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`
- `docs/EVENT_LOG_INTEGRITY.md`
- `docs/NEXT_AGENT_HANDOFF.md`

Organizational checkpoint:
- canonical repo moved to `C:\Agency_os_first\AGENCY_OS_FIRST`;
- GitHub `main` was updated without force-push;
- public repo safety scan found no tracked env/key/large-artifact blockers, but
  product strategy docs are public by design.
- root `AGENTS.md` exists for new Codex chats.
- GitHub Actions verify workflow exists as the simple manual build/verify
  button.

Process checkpoint:
- worker agents must not checkout, merge, fast-forward or push `main` unless
  explicitly acting as coordinator.
- coordinator agents own merge order, conflict resolution and pushing `main`.
- larger goals should be milestone trains made of separate branches/worktrees,
  not one large commit.
- independent review is a gate; it is not permission to expand scope.

## Next Chewable Step

Add the first tiny review UI affordance for marking uncategorized captures as
candidates through `/api/local/capture-review`.

Recommended scope:
- keep it mobile-friendly and close to the existing phone review queue;
- choose one candidate type for one existing capture and submit locally;
- show success/error confirmation and replay-derived updated state;
- add focused rendered/static tests;
- do not create linked entities or conversion events.

Out of scope:
- Telegram;
- GitHub/Codex/OpenClaw importers;
- hosted auth;
- production deploy;
- converting capture to evidence/blocker/decision.
- broad storage, framework or auth changes.

## Minimum Files To Read Next

- `docs/AGENT_START_BRIEF.md`
- `docs/NEXT_AGENT_HANDOFF.md`
- `docs/PRODUCT_DEVELOPMENT_FLOW.md` sections:
  - `v0.3 Wedge Contract`
  - `Stage 2: First Phone Write`
- `docs/PRE_DEVELOPMENT_READINESS_AUDIT.md`
- `docs/WORKFLOW_FOR_PHONE_AND_AGENTS.md`
- `docs/STACK_AND_TOOLING_DECISION.md`
- `docs/DATA_MODEL_AND_INVARIANTS.md` section:
  - `Capture`
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md` section:
  - `Raw Capture Quarantine`
- `app/ledger.ts`
- `app/ledger-writer.ts`
- `app/local-command.ts`
- `app/api/local/capture-note/route.ts`
- `app/api/local/capture-review/route.ts`
- `app/CaptureNoteForm.tsx`
- `app/page.tsx`
- `app/ledger.ts`
- `app/ledger-writer.ts`
- `app/local-command.ts`
- `app/api/local/capture-note/route.ts`
- `scripts/smoke-capture-note.mjs`
- `tests/ledger.test.mjs`
- `tests/capture-smoke.test.mjs`
- `tests/rendered-html.test.mjs`

## Usually Skip Unless Needed

- Full `AGENCY_OS_PLAN.md`
- Full `docs/PRODUCT_DNA.md`
- Full `docs/AGENCY_OS_ARCHITECTURE.md`
- Full `docs/RESEARCH_AND_COMPARISON.md`
- Full UI files unrelated to the phone-mode panel

## Required Exit Handoff

The next agent must update this file with:

```text
Handoff freshness:
- branch:
- commit:
- working tree state:
- last verified command/result:
- conflict rule:

Completed:
- ...

Verified:
- command:
- result:

Changed files:
- ...

Known gaps:
- ...

Next chewable step:
- ...

Next agent should read:
- ...

Next agent can skip:
- ...
```
