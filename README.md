# Agency OS / Local Solo Builder Kit

A local-first truth ledger for a solo builder working with AI agents, chats,
repos and short phone sessions.

The first version is intentionally small: one visual dashboard over projects,
work items, evidence, agent runs, blockers and integration lanes. It is not a
chat workspace and not a full task manager. Its job is to keep state honest.

## Canonical Repo

Local:

```text
C:\Agency_os_first\AGENCY_OS_FIRST
```

GitHub:

```text
https://github.com/SDV-G-Deploy/AGENCY_OS_FIRST
```

Future Codex work should start from this canonical local repo.

## Current local kit scope

Current stage:

```text
v0.3 Supervised Local Staging
```

Use [Current State](docs/CURRENT_STATE.md) for the authoritative stage, gates
and next milestone. The kit is approved for supervised local development and
non-sensitive evaluation. It is not approved for real private-memory use,
remote access or production deployment.

- Command Center with the main focus and portfolio health.
- Four active portfolio lanes: core, revenue, infrastructure and lab.
- Work queue where every task has a verification method.
- Evidence queue that separates claims from verified proof.
- Agent run ledger with objective, scope, claim and proof.
- Phone-friendly quick decision mode for short sessions.
- State Ledger layer with computed sanity checks.
- Recommended next steps derived from evidence gaps and blockers.
- Phone review cards for verify, unblock, approve and capture queues.
- Replay-derived dashboard state over the append-only event log.
- First local browser form/API for updating one project's next action.
- First `capture.note_created` data/reducer slice with quarantine-safe capture
  summaries.
- Local writer/command/API for `capture.note_created`.
- Minimal phone-first capture form that writes through the local capture API.
- Safe local capture smoke command that uses a temporary event log.
- Phone capture review UI through `capture.review_marked`.
- Browser QA evidence for capture review and success confirmation.
- Local ledger backup and restore commands for `data/events.jsonl`.
- Product DNA and strategic hardening roadmap.

## Next useful layer

1. Define the private runtime data-home contract.
2. Move runtime reads/writes/backup/restore behind one path adapter.
3. Make every dashboard projection request-fresh and fix literal queue counts.
4. Add real redaction/quarantine and loopback route boundaries.
5. Harden restore, stale-lock recovery and the backup manifest.
6. Converge phone mode around Capture, Review and Today.
7. Only then add the first read-only self-observation importer.

## Run

```bash
npm run dev
npm run build
npm test
npm run verify
npm run ledger:backup
npm run ledger:restore -- <backup-dir-or-metadata.json> --dry-run
npm run smoke:capture
npm run audit:prod
```

`npm run ledger:backup` creates a timestamped local bundle under
`backups/ledger/` by default. The bundle contains `events.jsonl` and
`metadata.json` with source path, SHA-256, event count and creation time.

`npm run ledger:restore -- <backup-dir-or-metadata.json>` validates metadata,
JSONL parsing and the event hash chain before replacing `data/events.jsonl`.
It preserves the current ledger as a safety backup first. Use `--dry-run` to
validate a backup without writing.

`npm run smoke:capture` writes a sample `capture.note_created` event to a
temporary copied event log and checks that the real `data/events.jsonl` file is
unchanged.

## Architecture And Evidence

- [Current State](docs/CURRENT_STATE.md)
- [Paperclips](docs/PAPERCLIPS.md)
- [Strategic Hardening And Product Plan](docs/STRATEGIC_HARDENING_AND_PRODUCT_PLAN.md)
- [Agent Start Brief](docs/AGENT_START_BRIEF.md)
- [Next Agent Handoff](docs/NEXT_AGENT_HANDOFF.md)
- [Agent Context Protocol](docs/AGENT_CONTEXT_PROTOCOL.md)
- [Product DNA](docs/PRODUCT_DNA.md)
- [Product Development Flow](docs/PRODUCT_DEVELOPMENT_FLOW.md)
- [Pre-Development Readiness Audit](docs/PRE_DEVELOPMENT_READINESS_AUDIT.md)
- [Stack And Tooling Decision](docs/STACK_AND_TOOLING_DECISION.md)
- [Workflow For Phone And Agents](docs/WORKFLOW_FOR_PHONE_AND_AGENTS.md)
- [Agency OS Architecture](docs/AGENCY_OS_ARCHITECTURE.md)
- [Work And Evidence Protocol](docs/WORK_AND_EVIDENCE_PROTOCOL.md)
- [Research And Comparison Notes](docs/RESEARCH_AND_COMPARISON.md)
- [Current Evidence Log](docs/CURRENT_EVIDENCE.md)
- [Data Model And Invariants](docs/DATA_MODEL_AND_INVARIANTS.md)
- [Security And Approval Model](docs/SECURITY_AND_APPROVALS.md)
- [Event Log Integrity](docs/EVENT_LOG_INTEGRITY.md)
- [Approval Policy Matrix](docs/APPROVAL_POLICY_MATRIX.md)
- [Redaction And Import Boundaries](docs/REDACTION_AND_IMPORT_BOUNDARIES.md)
- [Release Gates](docs/RELEASE_GATES.md)

Durable planning artifacts start in
`tasks/log/2026-07-23-agency-os-v0-2-honesty-closure/`.

Agents should not read every large document by default. Start from
`docs/CURRENT_STATE.md`, `docs/AGENT_START_BRIEF.md` and
`docs/NEXT_AGENT_HANDOFF.md`, then escalate using
`docs/AGENT_CONTEXT_PROTOCOL.md`.

The first local data skeleton lives in `data/` and uses stable IDs. Dashboard
event history now loads from append-only-oriented `data/events.jsonl`.

Current guarded local write coverage includes:
- `project.next_action_updated`;
- `capture.note_created`;
- `capture.review_marked`;
- durable `approval.approved` and `approval.used` lifecycle events.

The current tracked `data/` tree remains a public staging dataset. Do not put
sensitive or private notes into it. The next milestone separates private
runtime data from public source and fixtures.

`npm run verify` is the local quality gate. `npm run audit:prod` is kept
separate because current production dependency audit advisories remain visible
until the Next/Vinext dependency path has a safe patched release.
