# Current Evidence Log

Status: v0.2 closure evidence  
Last updated: 2026-07-23

## Current Claims

### Claim 0: The v0.2 staging baseline is preserved

Evidence:
- Commit: `c0c1ebf`
- Message: `baseline: agency os v0.2 staging evidence ledger`
- Scope: 52 project files, including app, data, docs, tests and config.
- Git identity used locally for this repository: `Codex <codex@local>`.

Strength: strong for rollback/diffability inside this local repository.

### Claim 1: The local app opens

Evidence:
- Local URL checked: `http://localhost:5173/`
- Result: HTTP 200
- Required text found:
  - `State Ledger`
  - `Recommended next steps`
  - `Attach URL, commit, screenshot, file path or test result`
  - `Review agent claims`

Strength: medium. It proves local rendering and key UI text, not full visual QA.

### Claim 2: The main local verification gate passes

Evidence:
- Command: `npm run verify`
- Result: pass
- Covered checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - build via `vinext build`
  - rendered HTML tests
  - ledger rule tests

Observed test result:
- 9 tests passed.

Strength: strong for current static/local code quality.

### Claim 3: Lint no longer depends on scratch research files

Evidence:
- `eslint.config.mjs` ignores `work/**` and `dist/**`.
- Command: `npm run lint`
- Result: pass with no warnings.

Strength: strong for current lint signal.

### Claim 4: TypeScript check now passes

Evidence:
- `tsconfig.json` includes Cloudflare worker types and excludes generated/scratch
  folders.
- `db/index.ts` explicitly types the expected optional D1 binding.
- Command: `npx tsc --noEmit`
- Result: pass.

Strength: strong for current type surface.

### Claim 5: Production dependency audit is not clean

Evidence:
- Command: `npm run audit:prod`
- Result: fail.
- Current npm registry latest for `next`: `16.2.11`.
- Current dependency: `next@16.2.11`.
- Remaining advisories reported through Next's bundled/transitive dependencies:
  - `postcss <8.5.10`;
  - `sharp <0.35.0`;
  - Next advisory range reported by npm audit.

Decision:
- Do not deploy to production until a safe Next/vinext-compatible dependency
  path is available or the risk is explicitly accepted.
- Do not use `npm audit fix --force` blindly because npm suggests a breaking
  path and the app depends on the Vinext/Next stack.

Strength: strong evidence of an unresolved blocker.

## Files Changed For Honesty Closure

- `package.json`: added `typecheck`, `audit:prod`, `verify`; moved Next to
  runtime dependencies.
- `package-lock.json`: updated dependency graph.
- `tsconfig.json`: added Cloudflare worker types and excludes.
- `eslint.config.mjs`: ignored generated/scratch folders.
- `db/index.ts`: typed Cloudflare D1 binding access.
- `docs/AGENCY_OS_ARCHITECTURE.md`: architecture baseline.
- `docs/WORK_AND_EVIDENCE_PROTOCOL.md`: work/evidence protocol.
- `docs/RESEARCH_AND_COMPARISON.md`: external comparison notes.
- `docs/CURRENT_EVIDENCE.md`: this evidence log.
- `data/*.json`: local stable-ID ledger records for actors, projects, claims,
  evidence, blockers, decisions, approvals, traces, work items and agent runs.
- `app/ledger.ts`: derived State Ledger, validation checks and dashboard
  adapters now read from `data/*.json`.
- `tests/ledger.test.mjs`: tests validation, duplicate idempotency keys,
  self-verification rejection and fail-closed external approvals.

## Known Gaps

- The app is still mostly read-only.
- Buttons are not wired to write actions.
- State now comes from local JSON ledger files, but there is no reducer/writer
  for append-only events yet.
- Dependency audit blocks production deployment.
- No visual screenshot artifact is saved in the repo yet.
- The baseline has one local commit, but no remote backup has been created.

## Next Evidence To Create

Before the next product feature:
- commit the current baseline or otherwise preserve it;
- make one phone review action create an append-only event;
- capture a screenshot or browser QA artifact after the next visible UI change.
