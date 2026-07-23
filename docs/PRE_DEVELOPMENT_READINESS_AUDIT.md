# Pre-Development Readiness Audit

Status: ready for first supervised v0.3 branch  
Last updated: 2026-07-23

## Question

Are the product direction, stack, tools and working method strong enough to
start building the next Agency OS slice?

## Short Answer

Yes, for one supervised bounded local development branch.

No, for broad autonomous parallel development, production deployment, real
external integrations or hosted users.

The next branch should be:

```text
capture.note_created data/reducer slice
```

## Readiness Matrix

| Area | Evidence | Verdict |
|---|---|---|
| Product purpose | `docs/PRODUCT_DNA.md`, `docs/PRODUCT_DEVELOPMENT_FLOW.md` | Ready enough |
| Current wedge | Local Solo Builder Kit, phone-first capture path | Ready enough |
| Stack choice | `docs/STACK_AND_TOOLING_DECISION.md` | Keep current stack |
| Local UI | Dashboard renders and build passes | Ready enough |
| Local state model | JSON snapshots plus event log | Ready for v0.3 |
| Event integrity | JSONL envelope, hash chain and validation tests | Ready for local use |
| Write safety | One guarded writer path exists | Ready for one-command expansion |
| Agent autonomy | Start brief, handoff and branch guardrails | Conditional only |
| Production | `npm run audit:prod` fails | Not ready |
| Backup/restore | Not implemented | Not ready for daily dependence |
| Auth | Not implemented | Not ready for remote use |
| Redaction runtime | Policy exists, capture enforcement not implemented | Must be part of capture work |

## Stack Fitness

The chosen stack is adequate for the current mission:
- web dashboard first;
- local browser command surface;
- short laptop sessions;
- future phone access through web or Telegram;
- future hosted path if the product earns it.

It is intentionally not optimized yet for:
- packaged desktop distribution;
- multi-device sync;
- multi-user SaaS;
- compliance-grade audit;
- heavy database querying.

That is acceptable because those are not v0.3 problems.

## Easy First

The current plan satisfies "easy first" because:
- the source of truth is still inspectable local files;
- the next slice is one event type, not a platform rewrite;
- the first write path is local and human-owned;
- the UI already exists and can absorb one more real action;
- tests are close to the state and command behavior.

The risk is not technical inability. The risk is accidental scope expansion.

## Flexible Later

The current plan stays flexible if agents preserve these seams:
- reducer and validation stay in `app/ledger.ts`;
- append behavior stays in writer modules;
- command validation stays separate from UI;
- API routes call commands instead of mutating state directly;
- raw captures stay quarantined until classified.

If those seams hold, later changes to SQLite, D1, Postgres, hosted auth,
Telegram or GitHub importers should be migrations around the model, not a full
rewrite.

## What We Should Not Add Before Starting

Do not add now:
- database migration;
- hosted auth;
- Telegram bot;
- GitHub importer;
- OpenClaw endpoint;
- desktop packaging;
- multi-agent orchestration UI;
- pricing or SaaS packaging.

Each of these can become useful later, but all of them would delay the first
real operating loop.

## What We Should Add During The First Branch

The first branch should include:
- `CaptureRecord` or equivalent derived capture collection;
- replay support for `capture.note_created`;
- validation for actor, project or Inbox, source, body and redaction status;
- blocked-sensitive quarantine behavior;
- tests for valid capture, invalid capture and duplicate/idempotent capture;
- handoff update with the next exact slice.

It should not include:
- full phone UI;
- capture conversion to evidence/blocker/decision;
- importers;
- auth;
- deployment.

## Guardrails For Autonomous Agents

Allowed:
- one branch;
- one slice;
- one new command or event type;
- local files only;
- no credentials;
- no deployment;
- no framework/storage changes;
- `npm run verify` before handoff.

Required if scope drifts:
- stop and update the plan;
- ask for review before merge;
- record skipped or blocked work in `docs/NEXT_AGENT_HANDOFF.md`.

## Final Pre-Start Verdict

Agency OS is not "fully understood" in the grand-product sense. That would be a
false claim.

Agency OS is understood enough for the next correct engineering move:

```text
Implement capture.note_created as the first phone-first local truth event.
```

Starting that branch now is rational.
