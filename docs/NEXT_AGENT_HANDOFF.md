# Next Agent Handoff

Status: current handoff  
Last updated: 2026-07-23

## Handoff Freshness

Branch:
- `feature/local-event-reducer`

Commit:
- current context-protocol checkpoint; run `git log -1 --oneline` for the exact
  commit hash.

Working tree state after this handoff checkpoint:
- expected clean.

Last verified command/result:
- `npm run verify`
- pass: lint, typecheck, build and 42 tests.

Conflict rule:
- if this handoff conflicts with current code/tests, trust code/tests, inspect
  relevant files and update this handoff.

## Current Position

Agency OS is ready for one supervised bounded local coding branch, but not for
broad autonomous expansion. Agents should not reload all large product
documents by default.

The next branch should implement the v0.3 phone-first capture slice, starting
from the contracts already written in:
- `docs/AGENT_START_BRIEF.md`;
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`;
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

## Next Chewable Step

Implement the first data/reducer slice for `capture.note_created`.

Recommended scope:
- add capture record type or derived capture collection;
- support `capture.note_created` in replay;
- enforce person actor, project-or-Inbox, source, body and redaction status;
- display last 3 uncategorized captures in data adapter or planned UI state;
- add tests for valid capture, missing project/source/body, blocked sensitive,
  duplicate idempotency and replay output.

Out of scope:
- full phone UI;
- Telegram;
- GitHub/Codex/OpenClaw importers;
- hosted auth;
- production deploy;
- converting capture to evidence/blocker/decision.

## Minimum Files To Read Next

- `docs/AGENT_START_BRIEF.md`
- `docs/NEXT_AGENT_HANDOFF.md`
- `docs/PRODUCT_DEVELOPMENT_FLOW.md` sections:
  - `v0.3 Wedge Contract`
  - `Stage 2: First Phone Write`
- `docs/STACK_AND_TOOLING_DECISION.md`
- `docs/DATA_MODEL_AND_INVARIANTS.md` section:
  - `Capture`
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md` section:
  - `Raw Capture Quarantine`
- `app/ledger.ts`
- `tests/ledger.test.mjs`

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
