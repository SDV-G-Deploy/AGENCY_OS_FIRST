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

1. Replace `app/seed.ts` with the real current portfolio.
2. Add local persistence for projects, evidence and agent runs.
3. Add local persistence for phone review actions and captured decisions.
4. Add a GitHub importer for commits, pull requests, checks and deploy URLs.
5. Add an OpenClaw event endpoint for `agent_run.created`.
6. Add a Telegram action surface for approve, block, verify and capture.

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

Durable planning artifacts start in
`tasks/log/2026-07-23-agency-os-v0-2-honesty-closure/`.

The first local data skeleton lives in `data/` and uses stable IDs plus
append-only `events.jsonl` as the direction for the future reducer.

`npm run verify` is the local quality gate. `npm run audit:prod` is kept
separate because current production dependency audit advisories remain visible
until the Next/Vinext dependency path has a safe patched release.
