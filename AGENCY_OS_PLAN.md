# Agency OS v0.2 Night Build Plan

## Working Protocol

Every meaningful block starts with PLAN FIRST and ends with PLAN UPDATE.

PLAN FIRST must state:
- goal;
- in scope;
- out of scope;
- done criteria;
- evidence to leave behind.

PLAN UPDATE must state:
- what changed;
- what was verified;
- what failed or was skipped;
- the next safest step.

## Product Direction

Agency OS is a global state and verification layer for a solo builder using
ChatGPT, Codex, Claude, OpenClaw, GitHub and short phone sessions.

It is not another chat workspace. It should answer:
- what projects exist;
- what is active, blocked, paused or stale;
- what claim lacks proof;
- what agent run needs review;
- what the next useful action is.

Trailmark is an inspiration for the evidence ledger, not a product to copy.
Borrow the artifact-first principle: if work leaves no artifact, it is not
trusted as complete.

## v0.2 Scope

Block 1: Plan Contract
- Create or update this plan.
- Keep the build bounded.
- Evidence: this file plus passing local checks.

Block 2: State Ledger Model
- Move from display-only seed data toward a structured local domain model.
- Include projects, work items, evidence, agent runs, blockers, events and
  recommended next steps.
- Out of scope: server database, auth, GitHub API, Telegram API.

Block 3: Sanity Checks
- Add checks for stale evidence, missing next action, blocked project without a
  decision, agent claim without proof, and too many active lanes.
- Evidence: tests proving checks fire on sample data.

Block 4: Visible Product Upgrade
- Surface sanity warnings and recommended next steps in the UI.
- Keep the dashboard useful on phone and laptop.
- Every block should improve the visible product when reasonably possible.

Block 5: Phone Review Queue
- Improve the short-session review area so it shows approve, verify, unblock
  and capture actions derived from state.

Block 6: Docs and Tests
- Update README and rendered HTML tests.
- Stop when build and tests pass.

## Stop Condition

Stop the night build when:
- the local app opens;
- build passes;
- tests pass;
- the dashboard shows State Ledger, sanity checks and recommended next steps;
- the latest PLAN UPDATE is written.

Do not deploy, publish, delete user work, rewrite unrelated files or expand
scope beyond v0.2 during the night cycle.

## PLAN FIRST - 2026-07-22 22:35Z

Block: State Ledger visible layer.

Goal:
- Move from display-only seed data toward a computed State Ledger layer.

In scope:
- Local TypeScript ledger model.
- Sanity checks.
- Recommended next steps.
- Visible UI panels.
- Rendered HTML test updates.

Out of scope:
- Server database.
- GitHub API.
- Telegram API.
- OpenClaw endpoint.
- Deployment.

Done criteria:
- Dashboard renders State Ledger, sanity checks and recommended next steps.
- Local build/test passes.
- PLAN UPDATE is written.

Evidence expected:
- `app/ledger.ts`.
- `app/page.tsx`.
- `tests/rendered-html.test.mjs`.
- Passing `npm test`.

## PLAN UPDATE - 2026-07-22 22:35Z

Block completed: State Ledger visible layer.

Changed:
- Added `app/ledger.ts` with local State Ledger composition, sanity checks,
  recommended next steps, phone review queue and recent ledger events.
- Updated `app/page.tsx` to render State Ledger, sanity warnings, recommended
  next steps and artifact-style event history.
- Updated `app/globals.css` for the new ledger panels.
- Updated rendered HTML tests and README.

Verified:
- `npm test` passes, including build and rendered dashboard checks.

Skipped:
- No database, GitHub API, Telegram API, OpenClaw endpoint or deployment.

Next safest step:
- Add direct rule-level tests for `getSanityChecks`, `getRecommendedSteps` and
  `getPhoneReviewQueue`, then improve the phone review queue from counts into
  actionable approve/verify/unblock/capture cards.

## PLAN FIRST - 2026-07-22 22:55Z

Block: Actionable phone review queue.

Goal:
- Turn the phone review area from category counts into actionable cards.

In scope:
- Add targets and evidence hints to phone review actions.
- Update sidebar UI and CSS.
- Add direct rule-level ledger tests.

Out of scope:
- Real write actions.
- Forms.
- Persistence.
- Telegram/GitHub/OpenClaw integration.
- Deployment.

Done criteria:
- Sidebar shows verify, unblock, approve and capture cards with targets and
  evidence hints.
- Ledger rule tests cover sanity checks, recommended steps and phone review.
- Local build/test passes.

Evidence expected:
- `app/ledger.ts`.
- `app/page.tsx`.
- `app/globals.css`.
- `tests/ledger.test.mjs`.
- Passing `npm test`.

## PLAN UPDATE - 2026-07-22 22:55Z

Block completed: Actionable phone review queue.

Changed:
- Expanded `PhoneReviewAction` with `target` and `evidenceHint`.
- Replaced the sidebar count list with compact verify, unblock, approve and
  capture cards.
- Added direct rule-level tests for sanity checks, recommended steps and phone
  review queue behavior.
- Tightened the agent-claim sanity rule: an `awaiting verification` run now
  counts as an unproven claim even when its proof text is non-empty.
- Updated README and rendered HTML checks.

Verified:
- `npm test` passes, including build, rendered HTML checks and ledger rule
  checks.

Skipped:
- No interactive actions, persistence, Telegram, GitHub, OpenClaw endpoint or
  deployment.

Next safest step:
- Add a small local decision/evidence capture model so phone review cards can
  point to concrete pending items instead of only categories and counts.

## PLAN FIRST - 2026-07-23 Morning

Block: Honesty tails and architecture baseline.

Goal:
- Close the gap between product claims and durable evidence, then create the
  architecture baseline for Agency OS before the next feature branch.

In scope:
- Local verification gates.
- Evidence log.
- Work/evidence protocol.
- Architecture plan.
- Research comparison notes.
- Independent critique.

Out of scope:
- New product feature.
- Persistence implementation.
- External API integration.
- Deployment.

Done criteria:
- `npm run verify` passes.
- Production audit status is recorded honestly.
- Architecture and evidence docs exist.
- Independent subagents review the plan.
- PLAN UPDATE is written.

Evidence expected:
- `docs/AGENCY_OS_ARCHITECTURE.md`.
- `docs/WORK_AND_EVIDENCE_PROTOCOL.md`.
- `docs/RESEARCH_AND_COMPARISON.md`.
- `docs/CURRENT_EVIDENCE.md`.
- Passing `npm run verify`.

## PLAN UPDATE - 2026-07-23 Morning

Block completed: Honesty closure and architecture baseline, first revision.

Changed:
- Added durable architecture docs in `docs/`.
- Added `npm run verify`, `npm run typecheck` and `npm run audit:prod`.
- Fixed lint/typecheck gates by excluding generated/scratch folders and adding
  Cloudflare worker types.
- Updated Next to latest stable `16.2.11`.
- Recorded production audit blocker instead of hiding it.
- Added stable-ID local data skeleton in `data/`.
- Added append-only direction through `data/events.jsonl`.
- Added task artifact folder under `tasks/log/2026-07-23-agency-os-v0-2-honesty-closure/`.
- Added data invariants and security/approval model docs after critic feedback.

Verified:
- `npm run verify` passes.
- `npm run audit:prod` still fails and is recorded as a production deployment
  blocker.

Skipped:
- No UI write actions.
- No database migration.
- No external integrations.
- No deployment.

Next safest step:
- Add schema validation and a reducer around the `data/` skeleton, then make one
  local phone review action append an event and reload derived state.

## PLAN FIRST - 2026-07-23 Morning Follow-up

Block: Make the local JSON ledger the dashboard source of truth.

Goal:
- Close the half-finished transition from display seed data to the `data/`
  ledger skeleton.

In scope:
- Point the main dashboard at derived exports from `app/ledger.ts`.
- Teach ledger tests to load local JSON modules.
- Reject self-verification by the same agent in tests.
- Keep production audit status explicit.

Out of scope:
- UI write actions.
- Event reducer/writer.
- External integrations.
- Deployment.

Done criteria:
- `npm run verify` passes.
- `npm run audit:prod` is rechecked and recorded honestly.
- Evidence docs and this plan are updated.

Evidence:
- `app/page.tsx` imports portfolio/work/evidence/agent/blocker data from
  `app/ledger.ts`.
- `tests/ledger.test.mjs` has 9 passing tests, including validation and
  fail-closed approval coverage.
- `data/evidence.json` no longer marks agent-submitted evidence as verified by
  the same agent.

## PLAN UPDATE - 2026-07-23 Morning Follow-up

Changed:
- Switched the dashboard's project, work, evidence, blocker and agent-run data
  source from `app/seed.ts` to derived `app/ledger.ts` exports.
- Updated ledger tests to load `data/*.json` through temporary modules.
- Added validation tests for current data, duplicate idempotency keys,
  same-agent self-verification and fail-closed external approvals.
- Changed the local verification evidence verifier from `agent-codex` to
  `system-local-verifier`.
- Updated `docs/CURRENT_EVIDENCE.md`.

Verified:
- `npm run verify` passes: lint, typecheck, build, rendered HTML tests and 9
  ledger tests.

Still failing:
- `npm run audit:prod` fails on Next's transitive `postcss` and `sharp`
  advisories. This remains a production deployment blocker.

Next safest step:
- Preserve this baseline, then create a bounded branch/task for the event
  writer/reducer and one phone review action that appends a local event.

## PLAN FIRST - 2026-07-23 Baseline Preservation

Block: Preserve the v0.2 staging baseline.

Goal:
- Create a durable git checkpoint before starting the next branch/task.

In scope:
- Re-run the full local verification gate.
- Commit the non-ignored project files.
- Keep the production audit blocker explicit.

Out of scope:
- New product behavior.
- Branch creation.
- Dependency force fixes.
- Deployment.

Done criteria:
- Baseline commit exists.
- `npm run verify` is green immediately before the commit.
- Any production blocker remains documented.

Evidence:
- Commit `c0c1ebf` with message
  `baseline: agency os v0.2 staging evidence ledger`.
- `npm run verify` passed before commit: lint, typecheck, build and 9 tests.

## PLAN UPDATE - 2026-07-23 Baseline Preservation

Changed:
- Created the first repository checkpoint for the Agency OS v0.2 staging MVP.
- Configured repo-local git author identity as `Codex <codex@local>` because no
  local author identity was set.

Verified:
- `npm run verify` passed before the commit.
- Baseline commit hash: `c0c1ebf`.

Still failing:
- Production dependency audit remains blocked by Next's transitive
  `postcss`/`sharp` advisories.

Next safest step:
- Start a separate branch/task for the local append-only event reducer and one
  phone review action.
