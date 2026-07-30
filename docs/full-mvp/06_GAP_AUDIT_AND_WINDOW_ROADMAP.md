# Agency OS FULL MVP Gap Audit And Multi-Window Roadmap

Status: corrective execution-readiness authority; independent re-acceptance pending
Prepared: 2026-07-29

## 1. Do Not Confuse Plan Readiness With Product Readiness

The proposed FULL MVP package is an implementation authority only after the
exact committed revision passes independent re-acceptance. It is not
evidence that the FULL MVP exists.

Current verified product stage remains:

```text
v0.3 supervised local staging
non-sensitive local evaluation only
```

Current code has a useful visual shell, JSONL replay/integrity, three local
write paths, capture/review UI and partial event-ledger recovery. It does not yet
have the private daily-use runtime described by v0.4.

Concrete missing implementation evidence:

- no `src/` private-workspace/domain/security/application modules yet;
- no `tests/full-mvp/` or `tests/e2e/` FULL MVP suites yet;
- no `tasks/full-mvp/` task/evidence/review tree yet;
- normal writes still target tracked `data/events.jsonl`;
- current page truth can still mix fixture/module state with request-time state;
- no private session/Origin/CSRF/no-store/rate guard;
- intake does not yet scan and quarantine raw text before durable publication;
- typed truth, evidence, blocker/decision, agent-run and observation loops are
  not complete;
- backup does not yet cover the full workspace generation, quarantine and
  source registry/cursors;
- physical phone/Tailscale, assistive-technology, clean-machine and real-Git
  acceptance remain unperformed.

## 2. Product Order That Must Not Be Reversed

The shortest honest route to owner value is:

```text
private workspace boundary
-> append store + locking + recovery
-> request-fresh truth
-> local session and scan-before-persist intake
-> early private shell
-> minimal typed truth/evidence/blocker/decision loop
-> full backup/recovery
-> observation continuity
-> first working phone/desktop/Today surfaces
-> H05 real-phone formative check
-> final phone/desktop composition
-> automated candidate verification
-> H01-H04 final owner gates
```

Do not build remote access, import automation or recommendation polish on top of
tracked runtime data or fixture-derived truth.

The selected v0.4 storage decision is the versioned file/event workspace in
`02_ARCHITECTURE_AND_MODULES.md`. Drizzle/D1 remains dormant. Reopening that
decision requires a separate owner-approved ADR; a worker may not silently
switch to SQLite, D1 or hosted storage mid-goal.

## 3. What The Goal Controller Can Now Prove

The authority-pinned tools provide:

- static plan/schema/DAG validation;
- external H00 authorization binding;
- durable `RUN_STATE` initialization and legal state transitions;
- safe pause/resume across authorization windows and run-level metadata updates;
- exclusive writer lock, revision compare-and-swap and checksum/sidecar/log
  recovery;
- exact `%LOCALAPPDATA%` authorization/state path binding and sanitized
  checkpoint generation;
- bounded repair task creation;
- rollover from an expired previous window into a valid new window;
- exact production-audit classification without pretending the known advisory
  is clear;
- resource-aware schedule lower-bound reporting;
- candidate/manual/release artifact validation.

They do not create worktrees, implement product tasks or pass owner gates by
themselves. The coordinator still performs declared Git/worktree commands,
dispatches bounded workers and records task artifacts.

## 4. Honest Resource Baseline

`scripts/analyze-full-mvp-schedule.mjs` currently proves:

```text
automated task minutes: 3395
automated dependency critical path: 1920 minutes
end-to-end path through H05: 1940 minutes
declared-parallelism lower bound: 3155 minutes
productive minutes per authorization window: 450
minimum productive windows: 8
independent automated review artifacts: 44
estimated reviewer minutes: 660
estimated coordinator minutes: 320
owner-gate minutes including H00: 390
post-automation manual/release minutes: 470
operational planning windows: 11
full integration verify invocations: 28
```

The eight-window figure is a mathematical lower bound. It excludes reviewer
latency, actual command runtime, repairs, dependency download and
context-switching. Eleven windows is the current operational budget after
serializing estimated review and coordination overhead. Plan for 11-13
authorized windows; owner scheduling or repairs can extend it.

## 5. Suggested Window Milestones

This is a planning projection, not permission to violate `TASK_GRAPH.json`.
Dependency readiness and the controller state remain authoritative.

| Likely windows | Intended milestone | Honest stop/result |
|---|---|---|
| 1 | H00, T00-T02 | reproducible baseline, controller and browser/dependency preflight |
| 2-3 | W01, W02, W05, S01, U05 | private workspace, append/lock/session foundations and an early private shell |
| 4-5 | D01-D04, S02-S03, D03 | typed policies, reducers, request-fresh truth and quarantine/security |
| 6-7 | A01-A04, W03-W04 | minimal owner action loop plus migration/recovery |
| 8-9 | I01-I02, U00-U03 | observation continuity and first useful phone/desktop/Today surfaces |
| 10 | H05, U04, U06 | real-phone formative correction before final responsive composition |
| 11-12 | V01-V04, V03 | automated candidate evidence and integrated release review |
| 12-13+ | repairs and owner H01-H04/R00 | manual private-dogfood acceptance; owner work is serial |

If H05 fails, the next window is a bounded U01-U03/composition repair, not
automatic progress into U06.

## 6. Bottlenecks Already Corrected In This Revision

- root `AGENTS.md` now has an explicit owner-authorized FULL MVP exception
  without weakening main/push/deploy/real-data boundaries;
- raw red `npm audit` is replaced by a fail-closed classifier that preserves the
  production blocker;
- controller lifecycle is executable and self-tested, including expired-window
  pause/resume rollover, exclusive lock/CAS, stale-lock contention, exact path
  binding and Windows fsync behavior;
- worktree dependency bootstrap occurs from T00, not after T01 has already
  needed dependencies;
- R00 uses an existing `integrationProductCommit` and a later summary
  `testedCommit`, removing future-SHA self-reference;
- practical duration is reported from declared parallelism, not only critical
  path;
- duplicate full worker/integration verifies were reduced: focused+typecheck
  before merge, graph-declared post-merge gates, and full verify at every wave
  boundary and candidate/release gate;
- W02/W05, D02/D04, A03/A04 and V02/V04 reduce single-task blast radius;
- U06 owns final cross-surface composition;
- U01 depends on U00/U02/U03 and owns the provisional integrated
  laptop/phone/desktop/Today seam that H05 physically tests; U06 owns only the
  final composition pass;
- H05 moves real-phone formative feedback before the expensive UI finish;
- review roles are risk-based and V03 still re-reviews the integrated candidate
  across three independent release perspectives.

## 7. Remaining Launch Preconditions

Before the first implementation window:

1. pass independent product, UX and execution re-acceptance on this exact revision;
2. commit the complete authority revision atomically;
3. run all planning/controller/schedule self-tests and `npm run verify`;
4. record the resulting commit as external `planningCommit`;
5. create a fresh external H00 authorization with stable goal/window IDs;
6. create clean detached authority and controller worktrees;
7. prove at least 10 GiB disk quota and the T00 worktree bootstrap;
8. keep `main`, GitHub, deploy and real private data outside authority.

Without those items the correct result is:

```text
BLOCKED_PRECONDITION
```

With them, the correct result is:

```text
GO for bounded multi-window implementation on integration/full-mvp-v0.4
```

It is not:

```text
FULL MVP already built
```

## 8. Post-Acceptance Dogfood Proof

R00 may classify a Private Local Dogfood MVP, but one successful acceptance
session does not prove that the product improves daily work. Before expanding
conversion targets or adding more importers, run a seven-day owner trial.
Store entries append-only in
`tasks/full-mvp/dogfood/SEVEN_DAY_DAILY.jsonl`; each line has:

```text
date
sessionsStarted
capturesCreated
reviewItemsResolved
typedConversions
evidenceAttachments
blockersResolvedThroughDecision
reviewCheckpointsCompleted
realGitObservationsAdopted
todayRecommendationFollowed: yes | no
timeToFirstUsefulActionSeconds
returnToOrientationSeconds
activeWorkRepresented
activeWorkTotal
projectLimitDecision: keep | pause | archive | null
sourceTruthRecallChecked: yes | no
sourceTruthRecallMatched: yes | no | not_checked
backupCreated: yes | no
restoreDryRunPassed: yes | no
privateDataLeakDetected: yes | no
missedNextActionFound: yes | no
staleOrWrongTruthCount
manualWorkaroundCount
trustBreak
mostUsefulMoment
oneChangeForTomorrow
```

Day 7 produces
`tasks/full-mvp/dogfood/SEVEN_DAY_SUMMARY.json`. It evaluates every threshold in
`01_PRODUCT_AND_UX_CONTRACT.md` section 14: days used, captures, reviews, typed
conversions, evidence, blocker-through-decision, checkpoints, real Git
observation, median orientation time, active-work coverage, project-limit
decision, source-truth recall, leak status, backup/restore and missed next
action. It also records a keep/change/remove decision for every major surface.
The product may be called `product-successful` only when every threshold is
PASS; otherwise the summary is a bounded learning backlog. This is
product-learning evidence, not a deterministic R00 gate, and it cannot be
fabricated during an unattended `/goal`.
