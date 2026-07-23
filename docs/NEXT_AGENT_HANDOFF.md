# Next Agent Handoff

Status: current handoff  
Last updated: 2026-07-24

## Handoff Freshness

Branch:
- `feature/mobile-capture-placement`

Commit:
- this handoff is included in the current slice commit; run
  `git log -1 --oneline` after checkout for the exact checkpoint hash.

Working tree state after this handoff checkpoint:
- expected clean.

Last verified command/result:
- `npm run verify`
- pass: lint, typecheck, build and 54 tests.

Conflict rule:
- if this handoff conflicts with current code/tests, trust code/tests, inspect
  relevant files and update this handoff.

## Current Position

Agency OS now has a canonical local repo and GitHub remote:
- local: `C:\Agency_os_first\AGENCY_OS_FIRST`;
- GitHub: `https://github.com/SDV-G-Deploy/AGENCY_OS_FIRST`.

Agency OS is on the supervised mobile capture placement branch. The prior
mobile capture form slice has been merged to `main`, and this branch makes the
phone-mode panel capture-first on mobile.

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
- Verify passed with 42 tests.
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

Organizational checkpoint:
- canonical repo moved to `C:\Agency_os_first\AGENCY_OS_FIRST`;
- GitHub `main` was updated without force-push;
- public repo safety scan found no tracked env/key/large-artifact blockers, but
  product strategy docs are public by design.
- root `AGENTS.md` exists for new Codex chats.
- GitHub Actions verify workflow exists as the simple manual build/verify
  button.

## Next Chewable Step

Add a safe manual local capture smoke test path or documented test command that
does not pollute real `data/events.jsonl`.

Recommended scope:
- use a temporary copied event log or existing test harness pattern;
- exercise `/api/local/capture-note` or `runCaptureNoteCommand()`;
- prove the real `data/events.jsonl` stays unchanged;
- document the command in a developer-facing place;
- keep conversion to evidence/blocker/decision/task out of scope.

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
- `app/CaptureNoteForm.tsx`
- `app/page.tsx`
- `app/ledger.ts`
- `tests/ledger.test.mjs`
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
