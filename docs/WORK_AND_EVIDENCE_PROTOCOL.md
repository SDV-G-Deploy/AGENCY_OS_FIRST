# Work And Evidence Protocol

Status: draft v0.3  
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

Before the block, choose context tier from
`docs/AGENT_CONTEXT_PROTOCOL.md`. Do not load the whole product archive unless
the tier requires it.

For Tier 0 work, keep evidence lightweight: command/result and handoff update
only when the next step or touched surface changes. Full verifier identity,
freshness, hashes and independent review are for medium/high-risk work.

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
- known gaps;
- verifier identity;
- whether the verifier is independent from the submitter;
- freshness or expiry policy;
- artifact hash when practical;
- reproduction command or procedure when practical.

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
- independent verifier for medium/high-risk agent work.

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

- The local next-action form is the first browser-backed write path. Other
  review queues are status-only until backed by command models.
- State is local-file based. One user-editable path exists, but most entities
  still require direct file edits or future commands.
- PLAN FIRST entries from the first night were stated in chat but not preserved
  as durable artifacts.
- Event hash-chain validation is implemented for the local JSONL ledger.
- A guarded local append writer exists for `project.next_action_updated`.
- Durable `approval.approved` and `approval.used` events exist for the first
  approved agent write path.
- Full reducer coverage, phone review writes and approval rejection lifecycle
  are not implemented yet.
- Agent registry lifecycle, export/backup/restore and cost visibility are
  documented needs, not implemented controls.

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

Current cross-agent handoff lives in:

```text
docs/NEXT_AGENT_HANDOFF.md
```

It should be updated after any non-trivial block so the next agent can start
from compact current state instead of rereading the full archive.

Recommended product architecture layout:

```text
docs/
  AGENCY_OS_ARCHITECTURE.md
  DATA_MODEL_AND_INVARIANTS.md
  EVENT_LOG_INTEGRITY.md
  SECURITY_AND_APPROVALS.md
  APPROVAL_POLICY_MATRIX.md
  REDACTION_AND_IMPORT_BOUNDARIES.md
  RELEASE_GATES.md
  RESEARCH_AND_COMPARISON.md
  CURRENT_EVIDENCE.md
```

Recommended work trace after a block:
- plan-first artifact;
- changed files;
- verification command and result;
- evidence log update;
- known gaps;
- independent critic review for medium/high-risk architecture changes;
- git commit hash once checkpoint-worthy.

Recommended append-only event file:

```text
data/events.jsonl
```

Each event should include:
- id;
- schema version;
- sequence;
- timestamp;
- actor;
- action;
- entity type;
- entity id;
- before/after or patch summary;
- evidence ids;
- source;
- idempotency key.
- approval ids;
- trace id;
- redaction status;
- retention class;
- previous event hash;
- event hash.

## Stop Rules

Stop or ask the human when:
- the next step requires a product choice;
- a dependency/security issue cannot be resolved safely;
- an external integration needs credentials;
- more cycles only reshuffle prose;
- independent critics converge below target due to a real unresolved decision.
