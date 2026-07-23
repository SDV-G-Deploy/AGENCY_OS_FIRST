# Next Agent Handoff

Status: current handoff  
Last updated: 2026-07-23

## Handoff Freshness

Branch:
- `feature/capture-note-writer-api`

Commit:
- pending until this handoff update is committed; run `git log -1 --oneline`
  after checkout for the exact checkpoint commit.

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

Agency OS is on the supervised local capture branch. The
`capture.note_created` writer/command/API slice is implemented, but the branch
has not been merged to `main` in this handoff.

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

Changed files in this slice:
- `app/ledger-writer.ts`
- `app/local-command.ts`
- `app/api/local/capture-note/route.ts`
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

Implement the first local mobile viewport capture form that calls the existing
`/api/local/capture-note` route.

Recommended scope:
- first viewport on mobile can enter one note/fact;
- choose an existing project or Inbox;
- choose source, defaulting to phone for the phone path;
- save through the local capture API and show confirmation;
- show the last three uncategorized captures from replay-derived state;
- keep raw capture text quarantined and do not convert it to evidence/blocker/
  decision/next action in this slice.

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
- `app/page.tsx`
- `tests/ledger.test.mjs`
- `tests/rendered-html.test.mjs`

## Usually Skip Unless Needed

- Full `AGENCY_OS_PLAN.md`
- Full `docs/PRODUCT_DNA.md`
- Full `docs/AGENCY_OS_ARCHITECTURE.md`
- Full `docs/RESEARCH_AND_COMPARISON.md`
- UI files, unless implementing the mobile viewport

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
