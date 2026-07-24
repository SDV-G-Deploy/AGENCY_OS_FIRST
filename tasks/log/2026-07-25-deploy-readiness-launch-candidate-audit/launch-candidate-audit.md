# Deploy Readiness Launch Candidate Audit

Date: 2026-07-25
Branch: `feature/deploy-readiness-launch-candidate-audit`
Worktree: `C:\Agency_os_first\worktrees\deploy-readiness-launch-candidate-audit`
Base commit: `62a8954 docs: update handoff after capture review success browser qa`

## Recommendation

Launch Candidate: no.

Current `main` is healthy for the local-first MVP development loop, but it
should not be called a deploy-ready Launch Candidate. The required local checks
pass, including build and the supported local dev/API smoke check, but the
production dependency audit still fails and the documented deploy/runtime
choices remain unresolved.

## Evidence Summary

| Check | Result | Evidence |
|---|---:|---|
| `git diff --check` | pass | no whitespace errors |
| `npm run verify` | pass | lint, typecheck, build and 66 tests passed |
| `npm run audit:prod` | fail | 3 high severity advisories |
| `npm run smoke:local-dev-api` | pass | temp-ledger local dev/API write smoke passed |
| canonical `data/events.jsonl` hash | unchanged | `E4DB925895E9F085112439482882D8E32E1079A0D672B44422D884431F625D10` before and after |

Command logs:
- `git-diff-check.final.log`
- `npm-run-verify.log`
- `npm-run-audit-prod.log`
- `npm-run-smoke-local-dev-api.log`

## Exact Launch Blockers

1. Production dependency audit is not clean.
   - `npm run audit:prod` fails with 3 high severity vulnerabilities.
   - Reported advisories:
     - `postcss <=8.5.17`, via `next/node_modules/postcss`;
     - `sharp <0.35.0`;
     - npm reports the vulnerable `next` range as `9.3.4-canary.0 - 16.3.0-preview.7`.
   - `npm view next version` returned `16.2.11`, matching the repo's current
     direct dependency.
   - `npm audit fix --omit=dev --dry-run` still leaves the advisories.
   - `npm audit fix --omit=dev --force --dry-run` proposes `next@9.3.3`, a
     breaking downgrade with React peer conflicts. That is not a narrow safe
     fix for this slice.

2. Hosted runtime/storage path is unresolved.
   - Current local writes are file-backed through `data/events.jsonl`.
   - Existing stack docs state this is correct for the local kit but not
     compatible with edge/serverless production storage without an adapter.
   - This requires a deployment/storage decision, not an audit-slice fix.

3. Remote auth/identity is unresolved.
   - Current local browser write routes fix the actor to `person-serj`.
   - Existing stack docs state this is local safety, not authentication.
   - Remote access needs real auth and actor/session binding before deployment.

4. Backup/restore is unresolved for dependable local use.
   - Existing readiness docs state the local ledger is not yet trustworthy as
     the only memory of real work without export/restore and backup checks.

## Narrow Fix Decision

No narrow production blocker fix was applied.

The dependency blocker is directly proven, but the available npm-proposed fix
is a breaking framework downgrade and conflicts with the current React/Vinext
stack. The storage, auth and backup blockers require product/deploy choices.

## Local MVP Health

The current branch still has strong local readiness evidence:
- static and typed code checks pass;
- production build completes through the existing verify gate;
- all 66 tests pass;
- local dev/API smoke passes using a temporary ledger;
- canonical `data/events.jsonl` remains unchanged.

This supports continuing bounded local MVP work, but not declaring the current
state a deploy-ready Launch Candidate.
