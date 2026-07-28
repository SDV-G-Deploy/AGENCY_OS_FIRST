# Agency OS Current State

Status: canonical current-state authority
As of: 2026-07-28
Verified code baseline: `2c9139d`
Current synchronization branch: `docs/current-state-synchronization`

## Authority Rule

When project sources disagree, use this order:

1. current code, tests, Git state and reproducible command output;
2. this file;
3. `NEXT_AGENT_HANDOFF.md`;
4. current strategic and staged plans;
5. evidence logs, task artifacts and historical audits.

Historical test counts and former next steps remain valid as history. They are
not current state.

Every agent must read this file before selecting work. If facts change, update
this file and the handoff in the same verified slice.

## Current Stage

```text
Stage ID: v0.3-supervised-local-staging
Stage label: Supervised Local Staging
Product package: Local Solo Builder Kit
Local Daily-Use Candidate: conditional, non-sensitive evaluation only
Personal-memory Daily-Use Candidate: no
Remote-Access Candidate: no
Production Launch Candidate: no
```

Why this is not yet a personal-memory Daily-Use Candidate:

- runtime records and `data/events.jsonl` are inside the public Git working
  tree;
- a real capture can therefore become a tracked or pushed artifact;
- raw capture redaction is a status label, not yet a scan-before-persist
  boundary;
- several dashboard projections are module-level and can become stale after a
  write;
- backup/restore is local and manual;
- production dependency audit is red.

The product is ready for supervised local development and synthetic or
non-sensitive evaluation.

## Verified Baseline

Authoritative checks run on 2026-07-28:

```text
git HEAD: 2c9139d1cd385d41ec17a04432f794838d8a0068
origin/main: 2c9139d1cd385d41ec17a04432f794838d8a0068
npm run verify: pass
lint: pass
typecheck: pass
build: pass
tests: 74 passed, 0 failed
GitHub Verify workflow for 2c9139d: pass
npm run audit:prod: fail, 3 high-severity findings
```

The npm force-fix suggestion is not accepted because it proposes a breaking
Next downgrade.

Synchronization branch verification on 2026-07-28:

```text
branch: docs/current-state-synchronization
npm run verify: pass
lint: pass
typecheck: pass
build: pass
tests: 77 passed, 0 failed
git diff --check: pass
```

## Implemented and Verified

### Product surfaces

- local dashboard;
- portfolio, work, evidence, blocker and agent-run views;
- phone-first capture form;
- phone capture review form with success confirmation;
- browser-local next-action form;
- sanity checks and recommended steps;
- browser QA artifacts for capture review.

### Durable actions

- `project.next_action_updated`;
- `capture.note_created`;
- `capture.review_marked`;
- `approval.approved`;
- `approval.used`.

### Integrity and commands

- JSONL event loading;
- replay-derived state;
- event sequence, idempotency and hash-chain validation;
- person-only capture and review command/API paths;
- scoped approval enforcement for the first agent write path;
- single-use approval consumption;
- event-log lock for appends;
- temp-ledger smoke tests.

### Recovery

- local event-ledger backup bundle;
- backup metadata and SHA-256 check;
- restore dry-run;
- safety backup before restore;
- focused backup/restore tests.

## Current Product Data Truth

The previously tracked Agency OS fixture still described:

```text
milestone: v0.2 honesty closure
next action: Create a local capture ledger with append-only events.
work item: Local capture ledger -> queued
event history: only three events through 2026-07-23
```

Those statements became false after capture, review, QA and backup/restore were
implemented. This synchronization slice updates the tracked project/work/
evidence fixtures to match the verified stage while preserving the earlier
events as history.

Tracked records are still an early public staging dataset, not an approved
private runtime home.

## Current Critical Gaps

### P0 — private runtime boundary

Public source and private runtime data are not separated. Normal use must not
begin with sensitive or private notes until runtime data moves outside the
public Git worktree.

### P0 — request-fresh truth

Not all visible dashboard projections are derived from one request-scoped
runtime snapshot. A write and reload can show mixed-age state.

### P0 — false capture count

The phone queue can substitute sanity-check count when capture count is zero.
Counts must be literal.

### P1 — local route exposure

Local POST routes have no hosted auth/session boundary, Origin policy, body
limit or rate limit. They are only approved for loopback-local use.

### P1 — recovery hardening

Restore does not yet share the writer lock or use an atomic replacement path.
Stale lock recovery and a self-contained workspace backup manifest are absent.

### P1 — action registry

Unknown state-changing actions are partly classified by naming convention.
An explicit allow-list registry is still required.

### P1 — production dependencies

`npm run audit:prod` fails through the current stable Next dependency chain.
Production deploy remains blocked.

### P2 — phone and desktop UX

Phone mode is still followed by the complete desktop dashboard. At common
desktop widths, the next-action form can overflow its panel.

## Current Milestone

```text
Milestone: State synchronization and private-runtime hardening
Next bounded slice: private runtime data-home contract
```

The contract must decide:

- Windows default private data location;
- `AGENCY_OS_DATA_DIR` behavior;
- workspace directory layout;
- demo fixture versus runtime data boundary;
- migration, backup and rollback;
- public task-artifact sanitation;
- fail-closed behavior when the data home is unavailable.

Default recommendation:

```text
%LOCALAPPDATA%\AgencyOS\workspaces\default\
```

## Explicitly Deferred

- Telegram;
- GitHub/Codex/OpenClaw importers;
- hosted auth;
- production deploy;
- database replatforming;
- automatic conversion of captures into trusted entities;
- broad visual redesign;
- multi-user collaboration.

## Documents by Role

Current truth:

- `CURRENT_STATE.md`;
- `NEXT_AGENT_HANDOFF.md`.

Strategy and execution:

- `STRATEGIC_HARDENING_AND_PRODUCT_PLAN.md`;
- `PRODUCT_DEVELOPMENT_FLOW.md`;
- `PRODUCT_DNA.md`.

Contracts:

- `DATA_MODEL_AND_INVARIANTS.md`;
- `EVENT_LOG_INTEGRITY.md`;
- `SECURITY_AND_APPROVALS.md`;
- `REDACTION_AND_IMPORT_BOUNDARIES.md`;
- `RELEASE_GATES.md`.

History and evidence:

- `CURRENT_EVIDENCE.md`;
- `PRE_DEVELOPMENT_READINESS_AUDIT.md`;
- `tasks/log/`;
- Git history.

Friction and future failure risks:

- `PAPERCLIPS.md`.

## Update Protocol

A current-state update is complete only when:

1. code/tests/Git evidence is inspected;
2. `CURRENT_STATE.md` is updated;
3. tracked project/work/evidence fixtures are updated when the visible product
   claim changed;
4. `NEXT_AGENT_HANDOFF.md` is updated;
5. stale “next step” claims are removed or marked historical;
6. `npm run verify` passes;
7. a contradiction scan is run;
8. coordinator reviews before merge/push.
