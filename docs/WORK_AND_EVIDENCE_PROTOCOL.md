# Work And Evidence Protocol

Status: draft v0.1  
Last updated: 2026-07-23

## Purpose

Agency OS must demand the same discipline from its builders that it will later
demand from agents.

No work is fully trusted until it leaves:
- a plan;
- a change;
- evidence;
- verification;
- a plan update.

## Required Block Cycle

### 1. PLAN FIRST

Save or state before a meaningful block:
- block id;
- goal;
- in scope;
- out of scope;
- done criteria;
- evidence expected;
- risk level;
- rollback/stop condition.

For durable work, PLAN FIRST belongs in:
- `AGENCY_OS_PLAN.md` for current-session planning;
- `docs/` for stable architecture/protocol decisions;
- future `tasks/log/<task>/plan-first-N.md` for block-level artifacts.

### 2. Work

Make one bounded change.

Rules:
- do not expand scope silently;
- do not hide failed checks;
- do not rewrite unrelated files;
- do not treat generated output as correct without inspection;
- prefer visible product value when safe.

### 3. Evidence

Evidence can be:
- command output;
- test result;
- typecheck/lint result;
- local URL response;
- screenshot;
- file path;
- commit hash;
- PR/check/deploy URL;
- decision note;
- user confirmation.

Evidence must include:
- command or source;
- timestamp or run context;
- result;
- location where the proof can be inspected;
- known gaps.

### 4. Verification

Verification asks:
- did the check cover the claim?
- did it run against current files?
- was the output inspected?
- are failures recorded?
- are skipped checks justified?

### 5. PLAN UPDATE

Save after each block:
- what changed;
- what was verified;
- what failed;
- what was skipped;
- what remains;
- next safest step.

## Evidence Strength

Strong evidence:
- passing automated test that covers the claim;
- successful build;
- successful typecheck;
- inspected rendered output;
- commit/PR/check URL;
- durable plan/evidence file.

Medium evidence:
- static source inspection;
- smoke test;
- local HTTP 200;
- screenshot;
- subagent read-only audit.

Weak evidence:
- chat memory;
- "looks good";
- unchecked model claim;
- stale command output;
- unlinked note.

## Current Local Gates

Primary local gate:

```bash
npm run verify
```

This runs:
- lint;
- TypeScript check;
- build;
- rendered HTML tests;
- ledger rule tests.

Separate security visibility gate:

```bash
npm run audit:prod
```

This is currently not part of `verify` because the latest stable Next version
still leaves npm audit advisories in the dependency tree. Production deployment
must remain blocked until this is resolved or explicitly accepted.

## Known Current Gaps

- Buttons are visible but inert.
- State is still seed/file-code based, not durable user-editable data.
- PLAN FIRST entries from the first night were stated in chat but not preserved
  as durable artifacts.
- External research was originally captured in thread context; stable research
  notes now need a file artifact.

## Future Artifact Layout

Recommended task layout:

```text
tasks/log/YYYY-MM-DD-slug/
  task.md
  plan-first-1.md
  evidence-1.md
  report-1.md
  plan-update-1.md
  critic-review-1.md
```

Recommended append-only event file:

```text
data/events.jsonl
```

Each event should include:
- id;
- timestamp;
- actor;
- action;
- entity type;
- entity id;
- before/after or patch summary;
- evidence ids;
- source;
- idempotency key.

## Stop Rules

Stop or ask the human when:
- the next step requires a product choice;
- a dependency/security issue cannot be resolved safely;
- an external integration needs credentials;
- more cycles only reshuffle prose;
- independent critics converge below target due to a real unresolved decision.
