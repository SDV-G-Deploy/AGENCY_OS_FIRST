# Agency OS Agent Start Brief

Status: compact start context  
Last updated: 2026-07-28

Read this first. Do not infer current stage from historical test counts or task
artifacts.

## Required Read Order

1. `docs/CURRENT_STATE.md`
2. `docs/NEXT_AGENT_HANDOFF.md`
3. files directly touched by the task

If sources conflict:

```text
code/tests/Git
-> CURRENT_STATE.md
-> NEXT_AGENT_HANDOFF.md
-> plans and contracts
-> historical evidence
```

## Product In One Sentence

Agency OS is a local-first personal truth ledger that turns scattered AI work
across chats, coding agents, repositories and short phone sessions into one
reviewable project state and one trusted next action.

## Current Package and Stage

Package:

```text
Local Solo Builder Kit
```

Stage:

```text
v0.3 Supervised Local Staging
```

Current verdict:

- supervised local development: yes;
- synthetic/non-sensitive local evaluation: yes;
- real personal-memory daily use: no;
- remote access: no;
- production deploy: no.

The exact current facts and blockers live in `docs/CURRENT_STATE.md`.

## Verified Baseline

Baseline code commit:

```text
2c9139d
```

Verified on 2026-07-28:

- `main` matched `origin/main`;
- `npm run verify` passed;
- lint, typecheck and build passed;
- 74 tests passed;
- GitHub Verify passed for the baseline;
- `npm run audit:prod` failed with three high-severity findings through the
  current Next dependency chain.

Do not run `npm audit fix --force`.

## Implemented

- portfolio/evidence/blocker/agent dashboard;
- append-only JSONL event source;
- replay-derived state;
- guarded writes for `project.next_action_updated`;
- capture create and capture review;
- browser forms and local API routes;
- scoped and single-use approval checks;
- temp-ledger smoke tests;
- capture/review browser QA;
- local event-ledger backup, restore dry-run and safety backup.

## Current Milestone

```text
State synchronization and private-runtime hardening
```

Next bounded slice:

```text
private runtime data-home contract
```

The contract must define:

- public fixture versus private runtime data;
- `AGENCY_OS_DATA_DIR`;
- Windows default workspace location;
- migration and rollback;
- fail-closed behavior;
- public task-artifact sanitation.

Do not implement migration before the contract is reviewed.

## Still Out of Scope

- production deploy;
- hosted auth;
- Telegram;
- GitHub/Codex/OpenClaw importers;
- database replatforming;
- automatic capture conversion;
- multi-user collaboration;
- broad redesign.

## Read More Only When Needed

Product/strategy:

- `docs/PRODUCT_DNA.md`;
- `docs/STRATEGIC_HARDENING_AND_PRODUCT_PLAN.md`;
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`.

Data/security:

- `docs/DATA_MODEL_AND_INVARIANTS.md`;
- `docs/EVENT_LOG_INTEGRITY.md`;
- `docs/REDACTION_AND_IMPORT_BOUNDARIES.md`;
- `docs/SECURITY_AND_APPROVALS.md`;
- `docs/RELEASE_GATES.md`.

Process:

- `docs/WORKFLOW_FOR_PHONE_AND_AGENTS.md`;
- `docs/AGENT_CONTEXT_PROTOCOL.md`;
- `docs/WORK_AND_EVIDENCE_PROTOCOL.md`.

Friction and future risks:

- `docs/PAPERCLIPS.md`.

History only:

- `docs/CURRENT_EVIDENCE.md`;
- `docs/PRE_DEVELOPMENT_READINESS_AUDIT.md`;
- `tasks/log/`;
- Git history.

## Work Rules

1. PLAN FIRST.
2. One bounded branch/worktree slice.
3. Worker does not move or push `main`.
4. Do not deploy or add integrations.
5. Do not move real data without approved backup and rollback.
6. Run focused checks in the worktree.
7. Coordinator runs full `npm run verify` in the canonical repo.
8. Update `CURRENT_STATE.md` only when current facts changed.
9. Keep `NEXT_AGENT_HANDOFF.md` compact.
10. Record recurring friction in `PAPERCLIPS.md`.
11. Commit only after scope and evidence are clean.
