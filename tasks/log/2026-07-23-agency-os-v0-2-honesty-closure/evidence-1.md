# Evidence 1

## Local Gate

Command:

```bash
npm run verify
```

Result:
- pass.

Covered:
- lint;
- typecheck;
- build;
- rendered HTML tests;
- ledger rule tests.

## Production Audit Gate

Command:

```bash
npm run audit:prod
```

Result:
- fail.

Reason:
- npm audit reports advisories through Next's dependency tree, including
  PostCSS and sharp.
- Latest stable Next checked through npm registry: `16.2.11`.
- Current dependency: `next@16.2.11`.

Decision:
- keep production deployment blocked.
- do not run `npm audit fix --force` blindly.

## Local App

URL:

```text
http://localhost:5173/
```

Result:
- HTTP 200.

Expected text found:
- State Ledger;
- Recommended next steps;
- Attach URL, commit, screenshot, file path or test result;
- Review agent claims.
