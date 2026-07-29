# Agency OS FULL MVP Overnight Goal Prompt

Status: proposed launch packet
Prepared: 2026-07-29
Do not launch until the planning branch is reviewed, committed, and the
placeholder commit below is replaced.

## 1. Owner Preflight

Before launch, create outside Git:

```text
%LOCALAPPDATA%\AgencyOS\run-authorizations\<GOAL_ID>\<WINDOW_ID>.json
```

with this completed JSON:

```json
{
  "schemaVersion": 2,
  "authorizationId": "<AUTHORIZATION_ID>",
  "goalId": "<GOAL_ID>",
  "windowId": "<WINDOW_ID>",
  "planningCommit": "<ACCEPTED_PLANNING_COMMIT>",
  "authorizedStartCommit": "<AUTHORIZED_START_COMMIT>",
  "canonicalRepo": "C:\\Agency_os_first\\AGENCY_OS_FIRST",
  "startAt": "<START>",
  "deadlineAt": "<STOP>",
  "stopDispatchMinutesBeforeDeadline": 30,
  "diskQuotaBytes": 21474836480,
  "permissions": {
    "createControllerAndTaskWorktrees": true,
    "deleteOnlyWorktreesCreatedByThisGoal": true,
    "localMergeIntoIntegration": true,
    "moveOrPushMain": false,
    "pushAnyBranch": false,
    "deployOrExposePublicly": false,
    "migrateRealPrivateData": false,
    "installOnlyApprovedExactDependencies": true
  },
  "manualGatesRemainOwnerWork": true,
  "completionIsNotGuaranteed": true
}
```

`authorizedStartCommit` must equal the planning commit or be an explicitly
approved clean descendant. Because this file is outside Git, it does not create
a dirty/self-referential launch commit. Replace every placeholder with a real
value.

## 2. Prompt To Send

```text
/goal

You are the implementation coordinator for Agency OS FULL MVP.

Canonical repository:
C:\Agency_os_first\AGENCY_OS_FIRST

Accepted planning commit:
<ACCEPTED_PLANNING_COMMIT>

Authorized start commit:
<AUTHORIZED_START_COMMIT>

Stable goal ID:
<GOAL_ID>

Current window ID:
<WINDOW_ID>

Current authorization ID:
<AUTHORIZATION_ID>

Objective:
Build the Automated FULL MVP implementation candidate defined by the accepted
contracts. Do not claim FULL MVP acceptance while manual gates remain.

Read completely before any edit:
- AGENTS.md
- docs/CURRENT_STATE.md
- docs/NEXT_AGENT_HANDOFF.md
- docs/full-mvp/00_README.md
- docs/full-mvp/01_PRODUCT_AND_UX_CONTRACT.md
- docs/full-mvp/02_ARCHITECTURE_AND_MODULES.md
- docs/full-mvp/03_IMPLEMENTATION_DAG.md
- docs/full-mvp/04_AGENT_EXECUTION_REGIME.md
- docs/full-mvp/TASK_GRAPH.json
- docs/full-mvp/EXECUTION_SCHEMAS.json
- scripts/validate-full-mvp-plan.mjs
- scripts/validate-full-mvp-execution.mjs
- %LOCALAPPDATA%\AgencyOS\run-authorizations\<GOAL_ID>\<WINDOW_ID>.json

Authority:
code/tests/Git
-> docs/CURRENT_STATE.md
-> accepted docs/full-mvp package
-> NEXT_AGENT_HANDOFF.md
-> historical docs/chat

Before implementation:
1. Validate external H00 with
   `node scripts/validate-full-mvp-execution.mjs --authorization <path>`, then
   confirm goal/window/authorization IDs, planning/start commits, permissions,
   deadline and disk quota; write only a
   sanitized authorization hash receipt into the integration task tree. This is
   explicit local owner authorization, not a cryptographic-signature claim.
2. Confirm planning commit is an ancestor of authorized start commit and
   canonical Git state is clean.
3. Run baseline verify/audit/Vinext checks.
4. Validate TASK_GRAPH.json and DAG dependencies.
5. Create a detached, clean authority worktree at the exact planning commit in
   C:\Agency_os_first\worktrees\full-mvp-authority-<GOAL_ID>. Never edit it.
   Invoke validators from this authority worktree with `--root` and
   `--authority-root`.
6. Create integration/full-mvp-v0.4 from the authorized start commit in
   C:\Agency_os_first\worktrees\full-mvp-controller-<GOAL_ID>. Reuse that exact
   controller worktree for later windows of the same goal.
7. Create or validate checksum-protected RUN_STATE.json against the current
   external authorization using `validate-full-mvp-execution.mjs --run-state
   ... --active-authorization ...`; keep its backup, checksum and
   RUN_LOG.md under
   %LOCALAPPDATA%\AgencyOS\goal-runs\<GOAL_ID>\, outside every Git worktree.
   Commit only sanitized controller checkpoint receipts under
   tasks/full-mvp/controller-checkpoints/.
8. Write PLAN FIRST for the run.
9. If any precondition differs, stop as BLOCKED_PRECONDITION.

Execution:
- Follow 04_AGENT_EXECUTION_REGIME.md exactly.
- Execute TASK_GRAPH.json dependency order.
- One task branch/worktree per task.
- Maximum two non-overlapping workers plus one independent reviewer.
- Workers never move main/integration, push, deploy, or touch real private data.
- Coordinator alone may locally merge accepted tasks into integration.
- Before every task: PLAN FIRST with goal, dependencies, scope, exclusions,
  owned files, done criteria, evidence.
- Every worker writes PLAN_FIRST.md and RESULT.md. Coordinator records the
  implementation SHA; each independent reviewer gets its own role/round file.
- Run focused tests, git diff --check, scope/secret checks.
- Independent no-edit reviewer must score each task/wave.
- Accept only score >=92, zero deterministic blockers, and every required test
  green.
- If rejected, fix only concrete in-scope findings; maximum two repair turns.
- Run aggregate verification after every merge.
- Validate and persist controller state every cycle; chat memory is not state.
- Reviewers, worker and coordinator must have distinct identities; one reviewer
  identity cannot satisfy multiple required roles.
- Merge only after independent task review, then run the aggregate gate, then
  author coordinator acceptance. Revert and author rejection on aggregate
  failure.
- Keep `testedCommit` distinct from the later `artifactCommit` that commits
  receipts/reviews/evidence. After a tested commit, allow only
  `TASK_GRAPH.json.certificationOnlyPaths`; rerun evidence if runtime code or
  configuration changes.
- For V03, commit the sanitized merge-pending RUN_STATE snapshot, run the
  candidate gate without `--include-v03`, commit acceptance, advance V03 to
  merged, and commit the refreshed snapshot. R00 reruns with `--include-v03`.
- Prefer visible product value once foundations/security dependencies are green.

Hard boundaries:
- Do not checkout, merge, fast-forward, reset, or push main.
- Do not push any branch.
- Do not deploy.
- Do not expose Agency OS publicly or enable Tailscale Funnel.
- Do not migrate or inspect real owner/private data.
- Do not add packages except exact approved versions after T02 review.
- Do not force-fix the Next/PostCSS/sharp audit.
- Do not replace framework/storage/auth strategy.
- Do not activate Codex/Telegram/GitHub API/OpenClaw integrations.
- Do not weaken identity, CSRF, quarantine, evidence, approval, recovery, or
  claim/verification rules.
- Do not relabel a partial result as FULL MVP.

Manual gates:
- H01 physical phone/Tailscale
- H02 manual accessibility
- H03 clean-machine recovery
- H04 real allow-listed Git source

Prepare their checklists/fixtures, but mark them MANUAL_PENDING. Emulation,
synthetic headers and automated axe tests are not evidence that those gates
passed.

Stop immediately when:
- H00/start SHA/Git state is invalid;
- a product/security choice needs the owner;
- work would touch real private data;
- dependency work requires broad/framework change;
- replay/migration cannot preserve legacy truth;
- security would need weakening;
- undeclared files change unexpectedly;
- aggregate verification fails after two bounded repairs;
- cleanup/deletion target is ambiguous;
- the owner time window ends.

At time-window end:
- finish or safely abort the current atomic task;
- dispatch nothing new;
- persist external RUN_STATE/RUN_LOG and a sanitized checkpoint receipt;
- leave task/integration worktrees recoverable;
- report exact next ready task.

The graph is expected to require multiple authorized windows. Resume the same
`goalId`, validated integration state and external RUN_STATE in the next
window, using a new `windowId` and authorization; do not restart completed
tasks.

Final report:
- starting/ending integration SHA;
- task table and branch/commit status;
- reviewer scores and blockers;
- aggregate verification results;
- production audit classification;
- manual gates pending;
- remaining worktrees/branches;
- proof main/GitHub were untouched;
- exact next owner action.

For R00, write and commit `tasks/full-mvp/R00/RELEASE_REVIEW.md` with those
sections before dispatching the three release reviewers. Their
`reviewedCommit`, the final aggregate commands and
`RELEASE_ACCEPTANCE.testedCommit` must bind that same summary commit. Do not
edit the summary after review.

Allowed completion phrase:
"Automated FULL MVP implementation candidate completed; manual acceptance gates remain."

Forbidden while any manual/deterministic gate is pending:
"FULL MVP complete", "ready for private daily use", "production ready",
"physical phone verified".
```

## 3. Expected Honest Outcomes

### Best case

```text
All automated tasks through V03 accepted.
Integration branch contains a reviewable implementation candidate.
H01-H04 are MANUAL_PENDING.
```

### Useful partial case

```text
Some waves accepted and merged to integration.
Controller state identifies one dependency-ready next task.
No false completion or unsafe partial migration.
```

### Blocked case

```text
Exact gate, evidence, attempted bounded repairs, and owner decision required.
No scope expansion.
```

## 4. Non-Negotiable Feasibility Note

The phrase "implement FULL MVP overnight" is achievable only in the narrow
sense of producing an automated implementation candidate if the code volume,
dependencies and host cooperate. It is not a credible promise.

The current task graph estimates roughly 55 automated task-hours and a
27.5-hour dependency critical path before repair/review variance. Two workers
can shorten independent work, not the dependency chain. An eight-hour run is a
progress window; later authorized windows resume durable controller state.

FULL acceptance cannot occur unattended because the contract deliberately
requires physical phone/Tailscale, manual assistive-technology, clean-machine
recovery and a non-mutating real allow-listed Git scan. The goal prompt
preserves that truth instead of optimizing for a dramatic but misleading
completion message.
