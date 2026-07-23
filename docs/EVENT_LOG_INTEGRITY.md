# Event Log Integrity

Status: draft v0.1  
Last updated: 2026-07-23

## Purpose

`data/events.jsonl` is the durable memory of Agency OS.

Current state files are convenient snapshots. Events are the audit trail that
explains how the state changed.

## Source-Of-Truth Rule

For v0.2:
- dashboard event history must load from `data/events.jsonl`;
- no hardcoded duplicate event list is allowed in application code;
- current JSON records may still be hand-edited while the reducer is being
  built.

For v0.3:
- all state-changing actions must append an event first;
- current JSON records become reducer output or explicitly marked snapshots;
- direct mutation of current state files is forbidden outside migrations.

## Event Envelope

Every event must eventually include:
- `schemaVersion`;
- `sequence`;
- `id`;
- `timestamp`;
- `actorId`;
- `action`;
- `entityType`;
- `entityId`;
- `before`;
- `after`;
- `evidenceIds`;
- `approvalIds`;
- `traceId`;
- `source`;
- `idempotencyKey`;
- `redactionStatus`;
- `retentionClass`;
- `previousEventHash`;
- `eventHash`.

Current v0.2 events do not yet have the full envelope. This is a known
architecture gap, not a hidden implementation detail.

## Hash Chain

Target rule:
- `eventHash` is computed from a canonical JSON form of the event without
  `eventHash`;
- `previousEventHash` equals the prior event's `eventHash`;
- the first event uses `previousEventHash: null`;
- a broken chain blocks writes and marks the ledger as unsafe.

The hash is not a security boundary by itself. It is a tamper-evidence signal
that makes accidental or silent edits visible.

## Reducer Contract

The reducer must:
- parse events in sequence order;
- reject malformed events;
- reject unknown actors, entities, evidence and approvals;
- ignore exact duplicate idempotency keys;
- reject duplicate idempotency keys with different payloads;
- apply only known action types;
- emit validation errors as sanity checks;
- never mutate input records in place.

Minimum reducer actions:
- `project.next_action_updated`;
- `evidence.submitted`;
- `evidence.verified`;
- `agent_run.submitted`;
- `agent_run.human_decision_recorded`;
- `blocker.resolved`;
- `decision.recorded`;
- `approval.requested`;
- `approval.used`;

## Write Path

The only safe write path is:

1. Build a proposed event.
2. Validate actor, permission, approval and schema.
3. Redact unsafe payloads.
4. Compute idempotency and hash fields.
5. Append to `data/events.jsonl`.
6. Replay reducer.
7. Run sanity checks.
8. Record verification evidence.

If any step fails, the event is not appended.

## Failure Modes To Test

- duplicate idempotency key;
- duplicate sequence;
- broken hash chain;
- event references missing evidence;
- external action lacks approval;
- approval already used;
- stale evidence tries to verify a claim;
- agent tries to verify its own medium/high-risk work;
- raw secret appears in event payload;
- clock skew creates out-of-order timestamp.

