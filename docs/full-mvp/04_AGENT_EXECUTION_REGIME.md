# Agency OS FULL MVP Agent Execution Regime

Status: proposed autonomous coordinator protocol
Prepared: 2026-07-29
Depends on:

- `01_PRODUCT_AND_UX_CONTRACT.md`;
- `02_ARCHITECTURE_AND_MODULES.md`;
- `03_IMPLEMENTATION_DAG.md`;
- `TASK_GRAPH.json`;
- `EXECUTION_SCHEMAS.json`.

## 1. Purpose

This regime lets one persistent `/goal` coordinator advance through the FULL
MVP DAG with bounded workers and independent reviewers.

It optimizes for:

```text
maximum verified product progress without false completion
```

It does not optimize for maximum commits, token use or reviewer score chasing.

## 2. Permitted Outcome

An unattended run may produce:

```text
Automated FULL MVP implementation candidate
```

It must leave:

```text
Private Local Dogfood MVP accepted: MANUAL_PENDING
```

until H01-H04 are actually performed by the owner/reviewer. No prompt wording,
reviewer score or elapsed time may override a manual gate.

## 3. Required Start State

The coordinator may implement only when:

- out-of-tree H00 authorization exists under
  `%LOCALAPPDATA%\AgencyOS\run-authorizations\` and explicitly authorizes the
  run;
- canonical repository path resolves exactly;
- accepted planning commit exists and is an ancestor of the externally
  authorized starting SHA;
- canonical worktree has no unexpected changes;
- `main` is not checked out in an agent-created worktree;
- `npm run verify` baseline result is recorded;
- disk/process/worktree limits are known;
- no real private workspace will be migrated;
- no push/deploy authority is assumed.
- a clean detached authority worktree is pinned to `planningCommit`; trusted
  validators are executed from it, never from candidate-modifiable scripts.

If any item is absent, status is:

```text
BLOCKED_PRECONDITION
```

The coordinator may report/audit but cannot implement.

## 4. Durable Controller State

Live controller state is outside every Git worktree:

```text
%LOCALAPPDATA%\AgencyOS\goal-runs\<goal-id>\RUN_STATE.json
%LOCALAPPDATA%\AgencyOS\goal-runs\<goal-id>\RUN_STATE.json.bak
%LOCALAPPDATA%\AgencyOS\goal-runs\<goal-id>\RUN_STATE.sha256
%LOCALAPPDATA%\AgencyOS\goal-runs\<goal-id>\RUN_LOG.md
```

`RUN_STATE.json` contains:

```text
schemaVersion
stateRevision
stateChecksum
goalId
activeAuthorizationId
activeWindowId
planningCommit
authorizedStartCommit
integrationBranch
integrationWorktree
startedAt
deadlineAt
stopDispatchAt
diskQuotaBytes
updatedAt
currentWave
activeTaskIds[]
taskStates{}:
  status
  contractTaskId
  satisfiedByTaskId
  branch
  worktree
  startingCommit
  implementationCommit
  mergeCommit
  revertCommit
  workerId
  reviewerIds[]
  ownedPaths[]
  repairCount
  processState
  evidencePaths[]
  invalidatedBy[]
reviewScores{}
aggregateGate{}
manualGates{}
stopReason | null
```

`goalId` is stable across all continuation windows. Every window has a unique
`windowId` and `authorizationId` in `authorizationHistory`; a new window may
extend the deadline but cannot replace the goal identity, planning authority or
accepted integration history.

Allowed task status:

```text
blocked
ready
dispatched
implemented
verified
review_rejected
repairing
accepted
merge_pending_verification
merged
reverted
invalidated
manual_pending
aborted
failed
```

Every controller cycle reloads this file, the accepted contracts, current Git
state and task artifacts. Conversation memory is not controller state.

State persistence:

- controller is the sole writer;
- `stateChecksum` is SHA-256 over canonical JSON with `stateChecksum` omitted;
  `RUN_STATE.sha256` repeats that value for recovery before parsing trust;
- write canonical JSON to `RUN_STATE.json.tmp`, fsync it, preserve the previous
  valid state as `RUN_STATE.json.bak`, replace, then write/fsync
  `RUN_STATE.sha256`;
- increment `stateRevision` on every write;
- startup validator reads the primary, sidecar, backup and run log. It returns a
  machine `RECOVERY_REQUIRED` receipt when only the backup is valid; the
  coordinator appends that exact receipt to `RUN_LOG.md`, atomically promotes
  the backup and revalidates before dispatch. `RECOVERY_REQUIRED` exits nonzero
  and therefore cannot be mistaken for a green gate. It stops if neither copy
  is valid;
- `RUN_LOG.md` is append-only and one single log line must contain the matching
  revision/goal/window tuple; three unrelated historical lines cannot satisfy
  the check.
- after every accepted integration merge, the coordinator commits a sanitized
  checkpoint receipt under
  `tasks/full-mvp/controller-checkpoints/<state-revision>.json`; it contains no
  live authorization secret or machine-private path.

The executable gate is:

```text
node scripts/validate-full-mvp-execution.mjs --run-state <RUN_STATE.json> \
  --active-authorization <current-window-authorization.json>
```

When a previous revision is available, also pass
`--previous-run-state <previous.json>` so illegal status transitions and
revision gaps fail closed.

The controller checks out `integration/full-mvp-v0.4` only in:

```text
C:\Agency_os_first\worktrees\full-mvp-controller-<goal-id>
```

All controller artifacts and merges occur there. The canonical checkout is
read-only for the run. H00 explicitly authorizes creation/cleanup of the
controller worktree plus task worktrees; deletion remains limited to paths
created and recorded by this stable goal. Because live state is outside Git,
both the canonical and controller worktrees can be clean between explicit
checkpoint commits.

The separate authority worktree is:

```text
C:\Agency_os_first\worktrees\full-mvp-authority-<goal-id>
```

It stays detached and clean at `planningCommit` for the full goal. Validators
load graph/schemas from that path and inspect candidate artifacts through an
explicit `--root`.

## 5. Coordinator Cycle

One cycle:

1. Read `AGENTS.md`, current state/handoff, all FULL MVP contracts,
   `TASK_GRAPH.json` and `RUN_STATE.json`.
2. Inspect Git status, integration head, task worktrees and running workers.
3. Reconcile artifacts/commits with controller status; never trust a summary
   that conflicts with Git/tests.
4. If an accepted task is unmerged, review its diff and merge it before
   dispatching a dependent task.
5. Run aggregate verification after every merge.
6. Select only dependency-ready tasks whose owned paths do not overlap.
7. Dispatch at most two workers.
8. When a worker returns, verify task artifacts, diff and focused tests.
9. Dispatch an independent no-edit reviewer.
10. If score is below 92:
    - convert concrete in-scope findings into one repair turn on the same task;
    - allow at most two repair turns;
    - stop if repair needs product/security/scope expansion.
11. If score is 92+ and deterministic gates pass, merge locally, run the
    post-merge aggregate gate, then write `COORDINATOR_ACCEPTANCE.json`. On
    aggregate failure, revert and write `COORDINATOR_REJECTION.json`.
12. Atomically update external `RUN_STATE.json` and append one concise `RUN_LOG.md`
    entry.
13. Continue while a safe ready task exists; otherwise stop with exact reason.

No “continue” instruction may skip steps 1-5.

## 6. Worker Prompt Contract

Every worker receives:

```text
Role: worker
Task ID and title
Integration starting SHA
Dependencies
Goal
Owned files/modules
In scope
Out of scope
Acceptance commands
Required task artifacts
Stop conditions
No main/integration merge, no push, no deploy
```

Worker must use PLAN FIRST before edits and may not redefine acceptance.

Worker `RESULT.md` records starting commit and pre-commit tree hash, not its own
future commit SHA. After commit, coordinator records implementation SHA in
`IMPLEMENTATION_RECEIPT.json`; reviewer artifacts and
`COORDINATOR_ACCEPTANCE.json` are coordinator-owned integration artifacts.

If worktree lacks dependencies, the worker may use the approved shared package
cache/install protocol from T02. It may not silently skip full verification or
install unrelated packages.

## 7. Reviewer Prompt Contract

Reviewer receives:

- task contract and starting/ending SHA;
- exact diff;
- focused and aggregate test output;
- relevant product/architecture sections;
- no worker conversation except its durable artifacts.

Reviewer returns:

```text
score: 0..100
verdict: ACCEPT | REJECT
deterministic_blockers[]
findings[]:
  severity
  contract reference
  file/line
  failure scenario
  minimal in-scope fix
scope_drift[]
manual_gate_claims[]
```

Acceptance:

```text
score >= 92
AND deterministic_blockers is empty
AND every required command passed
AND no manual gate is falsely claimed
```

A score is not averaged across reviewers. If any required reviewer rejects, the
task/wave remains rejected.

Each required reviewer role produces its own:

```text
tasks/full-mvp/<task-id>/reviews/<role>-round-<n>.json
```

The coordinator writes that durable artifact from the no-edit reviewer result.
Worker branches contain no self-authored `REVIEW.md`. The validator rejects a
review if reviewer identity equals the worker or coordinator, if two required
roles share one reviewer identity, or if reviewed commit differs from the
implementation commit.

## 8. File Ownership And Parallelism

Before dispatch, coordinator computes touched-path ownership.

Hard-conflict paths:

- `package.json`, lockfile;
- central action registry/schema/model;
- event store/lock/manifest;
- shared test helpers;
- external live `RUN_STATE.json` and its checksum/backup;
- current-state/handoff;
- integration branch.

Only coordinator edits controller/current-state files. Workers write their own
task folder.

Parallel work is allowed only when:

- DAG marks tasks parallel-safe;
- owned path sets do not overlap;
- neither task changes package/registry/shared model;
- aggregate tests can be run after deterministic merge order.

If an unexpected overlap appears, coordinator interrupts the later task and
reschedules from the new integration head.

## 9. Merge Policy

Coordinator:

1. confirms accepted task commit and clean worktree;
2. confirms starting SHA is an ancestor of integration head;
3. rebases/replays only by creating a new worker repair task when necessary;
4. confirms required independent JSON reviews are ACCEPT with distinct
   reviewer identities and score at least 92;
5. merges with a visible no-ff task merge and records
   `merge_pending_verification`;
6. runs aggregate gate on the resulting `aggregateCommit` (normally the merge
   commit; for V03 it may include the sanitized final RUN_STATE snapshot);
7. only after the aggregate passes, authors and commits
   `COORDINATOR_ACCEPTANCE.json`, then records the task as `merged`.

For V03, the coordinator first commits a sanitized `FINAL_RUN_STATE.json` with
V03 at `merge_pending_verification`, runs the candidate gate without
`--include-v03`, and commits V03 acceptance. It then advances external state to
`merged` and commits a refreshed sanitized snapshot. R00 repeats the candidate
gate with `--include-v03`. These coordinator-only certification commits may
change only `certificationOnlyPaths`.

If aggregate gate fails:

- do not rewrite worker history;
- revert the candidate merge commit on integration if safe;
- mark the task `reverted` and every dependent accepted/merged task whose
  evidence relied on it `invalidated`;
- create dynamic repair ID `RPR-<task-id>-<n>` from the post-revert
  integration head; every repair is bound to one static `contractTaskId`;
- `<n>` equals `repairCount`, may only be 1 or 2, and repair 2 is legal only
  when repair 1 exists in a terminal unsuccessful state;
- a repair inherits the original owned paths/contracts and cannot satisfy new
  graph dependencies;
- after a repair is merged, the coordinator sets the static contract task back
  to `merged`, copies the repair implementation/merge commits, and records the
  exact repair ID in `satisfiedByTaskId`; dependencies consult the static
  contract state, while candidate validation consults the linked repair
  artifacts;
- a merged repair not referenced by exactly one static contract is rejected;
- the final sanitized RUN_STATE snapshot lists every dynamic repair; candidate
  validation requires the same receipt, scope diff, focused commands,
  independent reviews, post-merge aggregate and coordinator acceptance as its
  static contract task;
- after repair acceptance, reopen and rerun invalidated dependent gates before
  restoring `merged` status;
- stop after two failed repairs.

`main` remains untouched until owner-approved final integration.

## 10. Verification Tiers

### Task-local

- focused unit/integration/browser tests;
- typecheck/lint for owned modules;
- `git diff --check`;
- secret/path/scope scan.

### Wave aggregate

- `npm run verify`;
- tests introduced by the wave;
- consistency/traceability check;
- reviewer 92+.

### Candidate aggregate

- `node scripts/validate-full-mvp-plan.mjs`;
- `node scripts/validate-full-mvp-execution.mjs --candidate-evidence ...`;
- complete `npm run verify`;
- production audit classified, not hidden;
- Vinext compatibility;
- Chromium and WebKit Playwright suite;
- axe suite;
- migration/backup/recovery fault suite;
- hostile Git fixtures;
- no-private-data-in-repo scan;
- three independent 92+ reviews;
- manual gates marked pending.

Candidate evidence is valid only when its JSON structure, task/fixture/commit
binding, evidence levels, engines, command timing/results and artifact paths all
pass the executable validator. File existence or prose is not acceptance.

## 11. Evidence Rules

### Tested commit versus artifact commit

Evidence cannot embed the SHA of the commit that contains that same evidence
file. The execution contract therefore uses two distinct commits:

- `testedCommit`: the already-existing integration commit on which the recorded
  command, browser run or manual check actually ran;
- `artifactCommit`: the clean checked-out HEAD that contains the resulting
  receipts, reports, hashes, reviews and manual/release artifacts.

The CLI receives `--artifact-commit`; evidence and manual/release schemas record
`testedCommit`. The validator requires `testedCommit` to be an ancestor of
`artifactCommit` and rejects the evidence if any path outside
`TASK_GRAPH.json.certificationOnlyPaths` changed between them. This permits
committing proofs after a run without allowing runtime code to change under
already-green evidence.

`CommandResult.testedCommit` must equal the commit actually tested:

- focused worker commands bind `implementationCommit`;
- post-merge aggregate commands bind `aggregateCommit`;
- canonical, manual and release commands bind their declared `testedCommit`.

Every evidence/report file and every referenced artifact must be committed in
the supplied `artifactCommit`; the artifact worktree must be clean at that
exact HEAD.

Accepted evidence:

- command plus exit/result summary;
- test report/artifact path;
- commit SHA and exact diff;
- browser screenshot/video/trace from deterministic fixture;
- state/hash/receipt comparison;
- reviewer artifact.

Not evidence:

- “looks good”;
- worker self-score;
- source commit alone;
- green UI without sequence/as-of state;
- model narration without a durable artifact;
- emulation presented as physical-phone evidence.

## 12. Repair Rules

Allowed repair:

- concrete reviewer finding;
- current task scope;
- owned files;
- no product choice;
- no security weakening;
- no new integration/dependency unless already approved.

Repair PLAN UPDATE records:

- finding;
- root cause;
- minimal patch;
- new/updated test;
- verification.

After two repair turns without acceptance, task becomes `failed`; coordinator
stops the dependent graph and reports the smallest owner decision required.

## 13. Context Compaction Recovery

After any compaction/restart:

1. read goal status;
2. read and validate the external `RUN_STATE.json`, checksum and backup;
3. read the last 30 lines of the external `RUN_LOG.md`;
4. inspect Git/worktrees/agents;
5. read current task artifacts;
6. reconcile, then continue.

Never restart the implementation from the original plan or repeat an accepted
task because chat context was compacted.

## 14. Time And Resource Policy

The coordinator receives a time window, not a promise of completion.

Recommended unattended window:

```text
up to 8 hours
```

Limits:

- maximum two workers plus one reviewer;
- maximum two repair turns per task;
- persist `deadlineAt` and set `stopDispatchAt` at least thirty minutes earlier;
- every task has an estimate in `TASK_GRAPH.json`; do not dispatch a task whose
  estimate plus safety reserve exceeds the remaining window;
- H00 records a worktree/browser disk quota; stop dispatch when the measured
  run footprint reaches 80%;
- no polling tighter than useful task state changes;
- no long blocking wait that prevents status updates;
- stop cleanly before the time window ends if a task cannot be left atomic.

If the window ends:

- finish/abort the current bounded operation safely;
- stop new dispatch;
- update controller artifacts;
- report merged tasks, unmerged branches and next dependency-ready task.

The full graph is expected to require multiple unattended windows. A later
window uses the same `goalId`, a new `windowId` and new external H00
authorization, then resumes the same integration branch and validated
RUN_STATE; it does not restart accepted work. The authorization validator
requires the planning commit to be an ancestor of every authorized start
commit.

## 15. External/Manual Gate Handling

Manual tasks H01-H04 are never dispatched to coding workers.

The coordinator prepares:

- exact checklist;
- synthetic fixtures;
- command/UI path;
- receipt template;
- expected/denied results.

Then status becomes `manual_pending`.

The run may end with every automated task accepted and manual gates pending.
That is a successful implementation-candidate run, not a FULL MVP acceptance.

## 16. Final Report Contract

Report:

- starting and ending integration SHA;
- task status table;
- accepted/rejected reviewer scores;
- aggregate commands/results;
- changed architecture/product behavior;
- current production-audit classification;
- manual gates pending;
- branches/worktrees remaining;
- whether canonical `main`/GitHub were untouched;
- exact next owner action.

Forbidden final phrasing when manual gates remain:

```text
FULL MVP complete
ready for private daily use
production ready
physical phone verified
```

Allowed:

```text
Automated FULL MVP implementation candidate completed;
manual acceptance gates remain.
```
