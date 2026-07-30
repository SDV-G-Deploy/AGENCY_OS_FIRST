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
- on initial goal initialization, the clean controller/integration worktree
  HEAD equals `authorizedStartCommit`;
- canonical worktree has no unexpected changes;
- `main` is not checked out in an agent-created worktree;
- `npm run verify` baseline result is recorded;
- disk/process/worktree limits are known;
- no real private workspace will be migrated;
- no push/deploy authority is assumed.
- a clean detached authority worktree is pinned to `planningCommit`; trusted
  validators are executed from it, never from candidate-modifiable scripts.

The initial goal window establishes this two-SHA contract. A later window does
not reset the evolved integration branch to either SHA: it reuses the
controller/integration worktree recorded in validated `RUN_STATE`, proves its
clean HEAD descends from `authorizedStartCommit`, and proves it contains every
task merge commit recorded as `merged`. The detached authority worktree remains
clean and exactly pinned to `planningCommit` in every window.

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
paused
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
- every mutation takes an exclusive `RUN_STATE.json.lock` and verifies the
  on-disk predecessor revision before replacement; a concurrent coordinator
  fails closed and must reload rather than overwrite. A lock whose recorded PID
  no longer exists is first atomically hard-linked to a token-specific
  quarantine receipt; only one reclaimer can win. A malformed or already
  claimed lock is preserved for manual inspection rather than guessed away;
- `stateChecksum` is SHA-256 over canonical JSON with `stateChecksum` omitted;
  `RUN_STATE.sha256` repeats that value as an independent consistency sidecar;
- write canonical JSON to `RUN_STATE.json.tmp`, fsync it, preserve the previous
  valid state as `RUN_STATE.json.bak`, replace, then write/fsync
  `RUN_STATE.sha256`;
- increment `stateRevision` on every write;
- startup validator reads the primary, sidecar, backup and run log. It returns a
  machine `RECOVERY_REQUIRED` receipt when primary/sidecar/log consistency is
  incomplete or only the backup is valid. The coordinator uses the trusted
  recovery command, which preserves the last valid backup, advances the
  revision, rewrites the sidecar/log and revalidates before dispatch.
  `RECOVERY_REQUIRED` exits nonzero and therefore cannot be mistaken for a
  green gate. It stops if neither primary nor backup has a valid embedded
  checksum;
- `RUN_LOG.md` is append-only and one single log line must contain the matching
  revision/goal/window tuple; three unrelated historical lines cannot satisfy
  the check.
- after every accepted integration merge, the coordinator commits a sanitized
  checkpoint receipt under
  `tasks/full-mvp/controller-checkpoints/<state-revision>.json`; it contains no
  live authorization secret or machine-private path. The controller generates
  it, `ControllerCheckpoint` defines it, and candidate validation requires the
  latest receipt to match the final RUN_STATE revision and checksum. An exact
  retry is a no-op; the controller refuses to overwrite the same revision with
  a different state checksum or integration commit. Generation requires
  `integrationCommit` to equal candidate-root HEAD and to contain every task
  recorded as merged; candidate validation rechecks merged-task ancestry.

The executable gate is:

```text
node scripts/validate-full-mvp-execution.mjs --run-state <RUN_STATE.json> \
  --active-authorization <current-window-authorization.json>
```

When a previous revision is available, also pass
`--previous-run-state <previous.json>` so illegal status transitions and
revision gaps fail closed.

The sole supported mutation interface is the authority-pinned controller.
These are the exact command shapes; paths must resolve under `%LOCALAPPDATA%`:

```text
node scripts/full-mvp-controller.mjs init --authorization <current-auth.json> --run-state <RUN_STATE.json> --coordinator-id <id> --authority-root <authority-root> --integration-root <integration-root>
node scripts/full-mvp-controller.mjs inspect --authorization <current-auth.json> --run-state <RUN_STATE.json>
node scripts/full-mvp-controller.mjs transition --authorization <current-auth.json> --run-state <RUN_STATE.json> --task-id <task-id> --to <status> --patch <patch.json> [--run-footprint-bytes <bytes> when status=dispatched]
node scripts/full-mvp-controller.mjs update-run --authorization <current-auth.json> --run-state <RUN_STATE.json> --patch <run-patch.json>
node scripts/full-mvp-controller.mjs checkpoint --authorization <current-auth.json> --run-state <RUN_STATE.json> --integration-commit <sha> --candidate-root <candidate-root> --output <candidate-root>\tasks\full-mvp\controller-checkpoints\<revision>.json
node scripts/full-mvp-controller.mjs create-repair --authorization <current-auth.json> --run-state <RUN_STATE.json> --contract-task-id <task-id> --branch <branch> --worktree <path> --starting-commit <sha> --worker-id <id>
node scripts/full-mvp-controller.mjs recover --authorization <current-auth.json> --run-state <RUN_STATE.json>
node scripts/full-mvp-controller.mjs open-window --previous-authorization <expired-auth.json> --authorization <new-auth.json> --run-state <RUN_STATE.json> --authority-root <authority-root> --integration-root <integration-root>
```

H05 may transition to `accepted` only with the normal transition arguments plus
`--root <candidate-root> --authority-root <authority-root> --manual-artifact
<candidate-root>\tasks\full-mvp\manual\H05-formative-phone.json
--artifact-commit <sha> --coordinator-id <id>`. The controller validates the
committed owner/UX artifact before setting `manualGates.H05` to `PASS`.

`transition ... --to paused` is the safe window boundary for active work. The
controller records `paused_from:<prior-status>` and permits resume only to that
same lifecycle phase. Dispatch is refused after `stopDispatchAt`, when the
static task estimate no longer fits before that cutoff, or when the measured
goal footprint exceeds 80% of the authorized disk quota. `update-run` is the bounded interface for `currentWave`,
`reviewScores`, `aggregateGate` and `stopReason`; manual-gate values are derived
from manual task transitions and cannot be patched independently.

Every command binds the authorization path exactly to
`%LOCALAPPDATA%\AgencyOS\run-authorizations\<goalId>\<windowId>.json` and the
state path exactly to
`%LOCALAPPDATA%\AgencyOS\goal-runs\<goalId>\RUN_STATE.json`. A same-suffix path
under a repository or another root fails. `open-window` accepts an expired
previous authorization only for validating immutable history; it requires a
currently valid new authorization with the same goal, planning commit and
authorized start commit, refuses rollover while any task is active, keeps the
authority worktree pinned exactly to the planning commit, and accepts the
evolved integration HEAD only when it is clean, descends from the stable
authorized start commit and contains every merge recorded in `RUN_STATE`.
`validate-full-mvp-controller.mjs` proves init, legal transitions, an
authorized clean descendant start, wrong-start rejection, exact authority
pinning, evolved-integration pause/resume rollover, run-level metadata updates,
sanitized checkpoint
generation, primary/sidecar recovery and expired-window rollover in an
isolated temporary tree. It also proves that a second controller cannot remove
or bypass an already-held state lock and that exactly one of two concurrent
dead-PID reclaimers can proceed.

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
5. Run the graph-declared post-merge aggregate commands after every merge.
   `npm run verify` is the default and remains mandatory at every wave boundary
   and candidate/release gate; explicitly split first-half tasks may use
   typecheck plus diff-check until their paired completion task.
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

Every task worktree is bootstrapped before dispatch with the T00 baseline
command `npm ci --prefer-offline --no-audit` against the committed lockfile and
shared npm cache. T02 may extend that protocol only for its exact accepted
dependency/browser additions. A worker may not silently skip verification,
reuse another worktree's `node_modules` or install unrelated packages.

## 7. Reviewer Prompt Contract

Reviewer receives:

- task contract and starting/ending SHA;
- exact diff;
- focused and aggregate test output;
- relevant product/architecture sections;
- no worker conversation except its durable artifacts.

Review depth is risk-based and comes only from `TASK_GRAPH.reviewRoles`:

- one independent role for a bounded local contract;
- two roles where the task crosses product/security, UX/security or
  recovery/security boundaries;
- three distinct roles for V03 and release classification.

The coordinator may not add ceremonial role reviews merely to chase a score,
and may not remove a graph-required role. V03 re-reviews the integrated
candidate across product DNA, architecture/security and UX/release, so
task-local review specialization does not become a release blind spot.

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
V03 at `merge_pending_verification` plus the controller checkpoint for that
exact revision/checksum, runs the candidate gate without `--include-v03`, and
commits V03 acceptance. It then advances external state to `merged`, generates
a new matching checkpoint and commits the refreshed sanitized snapshot. R00
repeats the candidate gate with `--include-v03`. These coordinator-only
certification commits may change only `certificationOnlyPaths`.

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

Task branches do not repeat the full build gate merely for ceremony. They run
their graph-declared focused tests plus typecheck. After merge, the coordinator
runs that task's graph-declared post-merge gate. The default is full
`npm run verify`; W02, D02, A03 and V02 are explicit first halves whose paired
completion tasks restore the full gate. Every wave boundary and the
candidate/release gates run full `npm run verify`.

### Wave aggregate

- `npm run verify`;
- tests introduced by the wave;
- consistency/traceability check;
- reviewer 92+.

### Candidate aggregate

- `node scripts/validate-full-mvp-plan.mjs`;
- `node scripts/validate-full-mvp-execution.mjs --candidate-evidence ...`;
- complete `npm run verify`;
- production audit classified by
  `scripts/classify-production-audit.mjs`, not hidden; only
  `PRODUCTION_AUDIT_CLEAR` or the exact fail-closed
  `BLOCKED_KNOWN_UPSTREAM` set may pass candidate classification, and the
  blocked classification still prohibits production release;
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
  run footprint exceeds 80%;
- no polling tighter than useful task state changes;
- no long blocking wait that prevents status updates;
- stop cleanly before the time window ends if a task cannot be left atomic.

If the window ends:

- finish the current atomic operation or transition active work to `paused`
  after a durable worktree/commit checkpoint; do not use terminal `aborted` for
  ordinary continuation;
- stop new dispatch;
- update run-level metadata, persist controller artifacts and generate the
  sanitized checkpoint receipt;
- report merged tasks, unmerged branches and next dependency-ready task.

The full graph is expected to require multiple unattended windows. A later
window uses the same `goalId`, a new `windowId` and new external H00
authorization, then resumes the same integration branch and validated
RUN_STATE; it does not restart accepted work. The later authorization repeats
the goal's immutable `planningCommit` and initial `authorizedStartCommit`; it
does not replace either field with the evolved integration HEAD. Resume
validation instead proves that HEAD descends from `authorizedStartCommit` and
contains every task merge recorded as `merged`.

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
