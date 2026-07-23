# Next Agent Handoff

Status: current handoff  
Last updated: 2026-07-23

## Handoff Freshness

Branch:
- `main`

Commit:
- current organizational checkpoint; run `git log -1 --oneline` for the exact
  commit hash after this handoff is committed.

Working tree state after this handoff checkpoint:
- expected clean.

Last verified command/result:
- `npm run verify`
- pass: lint, typecheck, build and 47 tests.

Conflict rule:
- if this handoff conflicts with current code/tests, trust code/tests, inspect
  relevant files and update this handoff.

## Current Position

Agency OS now has a canonical local repo and GitHub remote:
- local: `C:\Agency_os_first\AGENCY_OS_FIRST`;
- GitHub: `https://github.com/SDV-G-Deploy/AGENCY_OS_FIRST`.

Agency OS is ready for one supervised bounded local coding branch from `main`,
but not for broad autonomous expansion. Agents should not reload all large
product documents by default.

The next branch should implement the v0.3 phone-first capture slice, starting
from the contracts already written in:
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

Organizational checkpoint:
- canonical repo moved to `C:\Agency_os_first\AGENCY_OS_FIRST`;
- GitHub `main` was updated without force-push;
- public repo safety scan found no tracked env/key/large-artifact blockers, but
  product strategy docs are public by design.

## Next Chewable Step

Implement the local writer/command/API slice for `capture.note_created`.

Recommended scope:
- add `buildCaptureNoteEvent()` and `appendCaptureNoteEvent()`;
- add a local command wrapper that is person-only;
- add a local API route that fixes actor and canonical event path;
- preserve the existing capture replay contract;
- add tests for write success, duplicate idempotency, invalid existing log,
  invalid raw-capture redaction status and blocked agent actor.

Out of scope:
- full phone UI;
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
