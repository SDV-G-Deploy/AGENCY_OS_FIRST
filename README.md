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
- Product DNA and v0.3 phone-first capture plan.

## Next useful layer

1. Add a local writer/command/API for `capture.note_created`.
2. Add a minimal phone-first capture form.
3. Add approval rejection and expiry UI.
4. Add runtime schema validation and redaction/import fixtures.
5. Add export, backup and restore for the local ledger.
6. Add GitHub importer fixtures for commits, pull requests, checks and deploy
   URLs.
7. Add an OpenClaw event endpoint for `agent_run.created`.
8. Add a Telegram action surface for approve, block, verify and capture.
9. Add agent lifecycle and cost-spend warnings.

## Run

```bash
npm run dev
npm run build
npm test
npm run verify
npm run audit:prod
```

## Architecture And Evidence

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
`docs/AGENT_START_BRIEF.md` and `docs/NEXT_AGENT_HANDOFF.md`, then escalate
using `docs/AGENT_CONTEXT_PROTOCOL.md`.

The first local data skeleton lives in `data/` and uses stable IDs. Dashboard
event history now loads from append-only-oriented `data/events.jsonl`.

Current branch adds the first guarded local write path:
- `app/ledger-writer.ts` appends one `project.next_action_updated` event type;
- `app/local-command.ts` exposes a human-only command wrapper;
- dashboard-facing state is derived by replaying events over snapshots;
- `app/NextActionForm.tsx` and `app/api/local/next-action/route.ts` connect a
  browser-local form to the command layer.

`npm run verify` is the local quality gate. `npm run audit:prod` is kept
separate because current production dependency audit advisories remain visible
until the Next/Vinext dependency path has a safe patched release.
