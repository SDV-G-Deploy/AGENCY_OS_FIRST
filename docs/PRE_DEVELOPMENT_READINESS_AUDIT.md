# Pre-Development Readiness Audit

Status: local daily-use candidate after backup/restore; deploy-ready Launch Candidate blocked
Last updated: 2026-07-25

## Question

Are the product direction, stack, tools and working method strong enough to
start building the next Agency OS slice?

## Short Answer

Yes, for supervised bounded local development and cautious local daily use on
`main` after the backup/restore branch was reviewed, merged and verified.

No, for broad autonomous parallel development, production deployment, real
external integrations, hosted users or a deploy-ready Launch Candidate label.

The next branch should now be:

```text
continue bounded local MVP slices only after coordinator review;
fix or explicitly accept deploy blockers before any production launch
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
| Write safety | Guarded writer paths exist for next action, capture note and capture review | Ready for narrow UI expansion |
| Agent autonomy | Start brief, handoff and branch guardrails | Conditional only |
| Production | `npm run audit:prod` fails on Next transitive `postcss` and `sharp` advisories | Not ready |
| Backup/restore | `npm run ledger:backup`, `npm run ledger:restore`, focused tests and command logs | Ready for cautious local daily use |
| Auth | Not implemented | Not ready for remote use |
| Redaction runtime | Capture redaction statuses are validated and blocked-sensitive captures are quarantined | Ready for local capture review |

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
- the next slice is one UI affordance over an implemented event type, not a
  platform rewrite;
- the implemented write paths are local and human-owned;
- the phone panel already exists and can absorb one more real action;
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

## What We Should Add During The Next Branch

The next branch should include:
- a mobile-friendly control near the existing phone review queue;
- one-capture review marking through `/api/local/capture-review`;
- candidate type selection for `evidence_candidate`, `blocker_candidate`,
  `decision_candidate` or `next_action_candidate`;
- success/error confirmation and replay-derived triaged state;
- focused rendered/static tests;
- handoff update with the next exact slice.

It should not include:
- full phone UI;
- capture conversion to evidence/blocker/decision/next action;
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

## Local Daily-Use Candidate Verdict

With the local ledger backup/restore branch reviewed and merged:

```text
Local Daily-Use Candidate: yes.
```

Limitations:
- local-only, single-user files remain the source of truth;
- restore is manual, not scheduled or synced;
- backup artifacts are local files and still need an external copy if the
  machine fails;
- event hashes remain deterministic local tamper-evidence checks, not
  cryptographic signatures;
- write coverage is still narrow and reducer coverage is not complete for all
  future event types.

## Final Pre-Start Verdict

Agency OS is not "fully understood" in the grand-product sense. That would be a
false claim.

Agency OS is understood enough to continue bounded local MVP work, but the
2026-07-25 launch-candidate audit says current `main` is not deploy-ready:
- `git diff --check` passed;
- `npm run verify` passed with lint, typecheck, build and 74 tests;
- `npm run ledger:backup` and `npm run ledger:restore -- --dry-run` passed;
- temp-copy restore passed and wrote a safety backup before replacement;
- `npm run smoke:local-dev-api` passed with a temporary ledger;
- `npm run audit:prod` failed with 3 high severity advisories through Next
  transitive `postcss` and `sharp` dependencies;
- canonical `data/events.jsonl` hash stayed unchanged.

Current launch verdict:

```text
Launch Candidate: no.
```

Starting production deployment is not rational until the dependency audit has a
safe path or the risk is explicitly accepted, and hosted storage/auth choices
are made.
