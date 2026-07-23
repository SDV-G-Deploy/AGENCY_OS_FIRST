# Agency OS Agent Start Brief

Status: compact start context  
Last updated: 2026-07-23

Read this first. Do not read every product document by default.

## Product In One Sentence

Agency OS is a local-first personal truth ledger that turns scattered AI work
across chats, coding agents, repositories and phone sessions into one
reviewable project state and one next action.

## Current Wedge

Build the Local Solo Builder Kit.

Do not build:
- shared workspace/chat;
- hosted SaaS;
- generic task manager;
- autonomous agent CEO;
- GitHub/Telegram/OpenClaw integrations before the planned slice.

## Current Checkpoint

Branch:
- `feature/local-event-reducer`

Latest product DNA checkpoint:
- `72c0293 docs: lock Agency OS product DNA and v0.3 phone capture path`

Current local gate:
- `npm run verify`
- Expected result: lint, typecheck, build and 47 tests pass.

Production gate:
- `npm run audit:prod` is still blocked by Next transitive
  `postcss`/`sharp` advisories.
- Do not deploy.

## Implemented

- Local dashboard.
- JSON records in `data/*.json`.
- Append-oriented event log in `data/events.jsonl`.
- Replay-derived dashboard state.
- Guarded writer for `project.next_action_updated`.
- Human-only local command.
- Browser-local next-action form/API.
- `capture.note_created` data/reducer replay slice.
- Claim required evidence type validation.
- Unknown state-changing event actions fail closed.

## Planned Next Slice

v0.3 phone-first capture:

```text
first mobile viewport:
capture one note/fact -> choose project or Inbox -> save -> see confirmation
-> see last 3 uncategorized captures -> see one suggested next action/review
```

Action contract:
- `capture.note_created`
- person actor only for v0.3;
- project or Inbox required;
- source required;
- raw text treated as untrusted;
- redaction status cannot default to `not_required`;
- create starts as `classification: inbox`, `reviewStatus: uncategorized` and
  empty `linkedEntityIds`;
- unsupported capture state changes still fail closed unless a reducer supports
  them.

## Read More Only When Needed

Always read:
- this file;
- `docs/NEXT_AGENT_HANDOFF.md`;
- files directly touched by your task.

Read selectively:
- `docs/PRODUCT_DEVELOPMENT_FLOW.md` for the current stage/slice;
- `docs/STACK_AND_TOOLING_DECISION.md` before changing framework, storage,
  deployment, packaging or autonomous-agent branch scope;
- `docs/DATA_MODEL_AND_INVARIANTS.md` for entity contracts;
- `docs/EVENT_LOG_INTEGRITY.md` for reducer/write work;
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md` for raw text/import work;
- `docs/CURRENT_EVIDENCE.md` when updating claims or known gaps.

Read full product context only for product/architecture changes:
- `docs/PRODUCT_DNA.md`;
- `docs/AGENCY_OS_ARCHITECTURE.md`;
- `docs/RESEARCH_AND_COMPARISON.md`;
- `AGENCY_OS_PLAN.md`.

## Work Rules

1. Start with PLAN FIRST.
2. Do one bounded step.
3. Prefer visible product value when safe.
4. Do not deploy, publish, or expand the wedge.
5. Do not add fake UI actions.
6. Run local verification.
7. Update evidence/docs only when the product contract changes.
8. End with a handoff for the next agent.

## Handoff Required

At the end, update `docs/NEXT_AGENT_HANDOFF.md` with:
- what changed;
- what was verified;
- what failed/skipped;
- exact next chewable step;
- files the next agent should read;
- files the next agent does not need to read.
