# Data Model And Invariants

Status: draft v0.2  
Last updated: 2026-07-23

## Source Of Truth

Agency OS uses two layers:

1. Append-only events:
   - `data/events.jsonl`
   - records what happened;
   - never edited by agents except through append operations.

2. Current state records:
   - `data/projects.json`
   - `data/evidence.json`
   - `data/decisions.json`
   - `data/agent-runs.json`
   - eventually generated from events by a reducer.

During early local development, current state files may be hand-edited, but the
architecture target is event-derived state.

Current implementation status:
- dashboard event history loads from `data/events.jsonl`;
- event envelope and hash-chain validation are active;
- pure replay exists for `project.next_action_updated`;
- file-backed append writer exists for `project.next_action_updated`;
- dashboard-facing state is derived from `data/*.json` snapshots plus replayed
  events;
- the first browser-local write surface exists for human next-action updates;
- current entity snapshots still live in `data/*.json`;
- full reducer replay across all entity types is not implemented yet.

## Identity

Every durable entity must have a stable ID.

Rules:
- relationships use IDs, not display names;
- display names can change without breaking links;
- imported external IDs are namespaced by source;
- agent and human actors are separate identity types.

ID examples:
- `project-agency-os`
- `evidence-local-v0-2-verify`
- `decision-first-scoped-write`
- `agent-run-codex-v0-2`
- `event-v0-2-honesty-closure`

## Entity Schemas

### Project

Required fields:
- `id`;
- `name`;
- `purpose`;
- `successDefinition`;
- `priorityLane`;
- `stage`;
- `state`;
- `currentMilestone`;
- `nextAction`;
- `ownerId`;
- `lastUpdated`.

Derived fields:
- evidence freshness;
- blocker count;
- pending decisions;
- recommended next action.

Invariant:
- active projects must have one non-empty `nextAction`.
- blocked projects must link to an open blocker or decision.

### Evidence

Required fields:
- `id`;
- `claimId`;
- `projectId`;
- `type`;
- `source`;
- `createdAt`;
- `submittedBy`;
- `verificationStatus`;
- `knownGaps`.

Invariant:
- verified evidence must have `verifiedBy`.
- missing evidence cannot verify a claim.
- stale evidence cannot keep a project green.

### Claim

Required fields:
- `id`;
- `projectId`;
- `subjectType`;
- `subjectId`;
- `claim`;
- `status`;
- `requiredEvidenceTypes`;
- `linkedEvidenceIds`.

Invariant:
- a verified claim must link verified evidence for every required evidence
  type.
- linked evidence IDs must exist.

### Capture

Purpose:
- raw human or imported observation that is not yet evidence, blocker or
  decision.

Required fields for `capture.note_created`:
- `id`;
- `projectId`;
- `actorId`;
- `source`: phone, laptop, codex, chatgpt, claude, github, openc-law,
  telegram, manual;
- `body`;
- `createdAt`;
- `receivedAt`;
- `redactionStatus`;
- `classification`: inbox, evidence_candidate, blocker_candidate,
  decision_candidate, next_action_candidate;
- `linkedEntityIds`;
- `reviewStatus`: uncategorized, triaged, converted, dismissed.

Invariant:
- raw capture text starts as `pending_scan`, `no_secrets_detected`,
  `redacted` or `blocked_sensitive`; it must not default to `not_required`.
- blocked sensitive captures do not appear in normal dashboard text.
- a capture does not verify a claim by itself.
- converting a capture to evidence, blocker, decision or next action requires a
  separate event.
- `capture.note_created` must fail replay until a reducer explicitly supports
  it.

### Decision

Required fields:
- `id`;
- `projectId`;
- `question`;
- `context`;
- `state`;
- `reviewDate`;
- `linkedEvidenceIds`.

Invariant:
- selected decisions require `selectedOption`, `rationale`, `decidedBy` and
  `decidedAt`.
- open decisions must remain visible in blockers or phone review.

### Agent Run

Required fields:
- `id`;
- `agentId`;
- `traceId`;
- `toolHarness`;
- `objective`;
- `permissionScope`;
- `resultClaim`;
- `filesChanged`;
- `externalActions`;
- `linkedEvidenceIds`;
- `verificationStatus`.

Invariant:
- an agent run cannot be verified without linked verified evidence.
- external actions require an approval record.
- write-capable runs must record permission scope.

### Event

Required fields:
- `schemaVersion` (target);
- `sequence` (target);
- `id`;
- `timestamp`;
- `actorId`;
- `action`;
- `entityType`;
- `entityId`;
- `before`;
- `after`;
- `evidenceIds`;
- `approvalIds` (target);
- `traceId` (target);
- `source`;
- `idempotencyKey`.
- `redactionStatus` (target);
- `retentionClass` (target);
- `previousEventHash` (target);
- `eventHash` (target).

Invariant:
- duplicate `idempotencyKey` is ignored or treated as the same event;
- events are append-only;
- every state-changing event must name an actor and entity;
- deletion is represented as an event, not filesystem erasure.
- once reducer migration lands, direct current-state mutation is forbidden
  outside explicit migrations.

## Reducer Rules

The reducer should:
- load initial snapshot;
- apply events in timestamp/id order;
- ignore duplicate idempotency keys;
- validate every event before applying it;
- reject unknown entity references;
- produce derived dashboard state.
- build indexes from the ledger being validated, never from module-global
  default state.

Minimum reducer tests:
- duplicate event does not double-apply;
- missing project reference fails validation;
- work cannot become verified without verified evidence;
- blocked project without decision is flagged;
- stale evidence expires;
- external action fails closed without approval.
- unsupported state-changing actions fail closed instead of being silently
  ignored.

## Freshness

Evidence freshness is derived, not hand-authored.

Inputs:
- evidence type;
- verification status;
- timestamp;
- project stage;
- expiry policy.

Example defaults:
- local build/test output: fresh for 7 days;
- GitHub check: fresh until next commit on branch;
- deploy URL: fresh until next deploy;
- user interview note: fresh for 30 days;
- missing evidence: never fresh.

## Migration Policy

Any schema change must include:
- old shape;
- new shape;
- migration script or manual migration note;
- verification command;
- rollback note.

For early local files, migration notes may live in `docs/` until a proper
migration runner exists.
