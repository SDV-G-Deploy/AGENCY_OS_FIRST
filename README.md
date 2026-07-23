# Agency OS / Project Portfolio Staging

A one-evening technical skeleton for a solo builder command center.

The first version is intentionally small: one visual dashboard over projects,
work items, evidence, agent runs, blockers and integration lanes. It is not a
chat workspace and not a full task manager. Its job is to keep state honest.

## Today scope

- Command Center with the main focus and portfolio health.
- Four active portfolio lanes: core, revenue, infrastructure and lab.
- Work queue where every task has a verification method.
- Evidence queue that separates claims from verified proof.
- Agent run ledger with objective, scope, claim and proof.
- Phone-friendly quick decision mode for short sessions.
- State Ledger layer with computed sanity checks.
- Recommended next steps derived from evidence gaps and blockers.
- Actionable phone review cards for verify, unblock, approve and capture.

## Next useful layer

1. Implement reducer replay over `data/events.jsonl`.
2. Add event schema validation, sequence/idempotency and hash-chain checks.
3. Add one local phone review action that appends an event.
4. Add approval linkage for scoped writes and external actions.
5. Add GitHub importer fixtures for commits, pull requests, checks and deploy
   URLs.
6. Add an OpenClaw event endpoint for `agent_run.created`.
7. Add a Telegram action surface for approve, block, verify and capture.

## Run

```bash
npm run dev
npm run build
npm test
npm run verify
npm run audit:prod
```

## Architecture And Evidence

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

The first local data skeleton lives in `data/` and uses stable IDs. Dashboard
event history now loads from append-only-oriented `data/events.jsonl`; reducer
replay and write enforcement are the next product layer.

`npm run verify` is the local quality gate. `npm run audit:prod` is kept
separate because current production dependency audit advisories remain visible
until the Next/Vinext dependency path has a safe patched release.
