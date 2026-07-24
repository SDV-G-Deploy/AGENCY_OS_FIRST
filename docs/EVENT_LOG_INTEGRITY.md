# Event Log Integrity

Status: current local integrity contract
Last updated: 2026-07-24

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

Current implementation status:
- local file-backed writers exist for `project.next_action_updated`,
  `capture.note_created` and `capture.review_marked`;
- local backup/export and restore tooling exists for `data/events.jsonl`;
- the writer uses a lock file and idempotency payload comparison;
- approved agent writes require durable `approval.approved` and append a durable
  `approval.used` companion event;
- `approval.approved` rejects non-person approvers and changed request details;
- the first browser-local UI/API path is wired for human
  `project.next_action_updated`;
- the phone-first capture form/API is wired for human `capture.note_created`;
- the local command/API path is wired for human `capture.review_marked`, but
  the mobile review UI affordance is not built yet;
- dashboard-facing state derives from replayed events over snapshots;
- human-only local commands can append `project.next_action_updated`,
  `capture.note_created` and `capture.review_marked` events and confirm
  replay-derived state;
- it does not regenerate current snapshot files after append.

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

Current local events have this minimal envelope. The implemented
`project.next_action_updated`, `capture.note_created` and
`capture.review_marked` write paths are forced through this envelope; other
state-changing actions still need command models and reducer coverage.

## Hash Chain

Current v0.2 rule:
- `eventHash` uses the deterministic `fnv1a32:*` checksum implemented in
  `app/ledger.ts`;
- this catches accidental drift in local development.

Target production rule:
- `eventHash` is computed from a canonical JSON form of the event without
  `eventHash`;
- `previousEventHash` equals the prior event's `eventHash`;
- the first event uses `previousEventHash: null`;
- a broken chain blocks writes and marks the ledger as unsafe.

The current hash is not a cryptographic security boundary by itself. It is a
tamper-evidence signal that makes accidental or silent edits visible. Before
hosted/multi-user use, replace or supplement it with cryptographic SHA-256 or
signed events.

## Reducer Contract

The reducer must:
- parse events in sequence order;
- reject malformed events;
- reject unknown actors, entities, evidence and approvals;
- ignore exact duplicate idempotency keys;
- reject duplicate idempotency keys with different payloads;
- apply only known action types;
- fail closed on unknown state-changing actions;
- emit validation errors as sanity checks;
- never mutate input records in place.

Implemented reducer actions:
- `project.next_action_updated`;
- `capture.note_created`;
- `capture.review_marked`;
- `approval.approved`;
- `approval.used`;

Minimum future reducer actions:
- `evidence.submitted`;
- `evidence.verified`;
- `agent_run.submitted`;
- `agent_run.human_decision_recorded`;
- `blocker.resolved`;
- `decision.recorded`;
- `approval.requested`;

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

## Backup And Restore Path

The local ledger can be exported with:

```text
npm run ledger:backup
```

The command creates a timestamped local bundle under `backups/ledger/` by
default. Each bundle contains:
- `events.jsonl`: a byte-for-byte copy of the source event log;
- `metadata.json`: schema version, artifact type, creation time, source path,
  SHA-256 hash, event count and event log filename.

Restore uses:

```text
npm run ledger:restore -- <backup-dir-or-metadata.json>
```

Restore fails closed unless metadata exists and matches the event file, JSONL
parsing succeeds, event count matches, SHA-256 matches and the hash-chain /
sequence validation passes. A restore dry-run is available:

```text
npm run ledger:restore -- <backup-dir-or-metadata.json> --dry-run
```

Before a real restore replaces the target event log, it writes a safety backup
of the current target ledger to the backup output root. This path is local-only
and validates the event log envelope/hash chain; it is not a hosted sync,
cryptographic signing or multi-device conflict resolution system.

## Failure Modes To Test

- duplicate idempotency key;
- duplicate sequence;
- broken hash chain;
- missing backup metadata;
- invalid backup JSONL;
- event references missing evidence;
- external action lacks approval;
- approval already used;
- stale evidence tries to verify a claim;
- agent tries to verify its own medium/high-risk work;
- raw secret appears in event payload;
- clock skew creates out-of-order timestamp.
