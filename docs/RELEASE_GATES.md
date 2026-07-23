# Release Gates

Status: draft v0.1  
Last updated: 2026-07-23

## Local Gate

Required before committing feature work:

```bash
npm run verify
```

This must pass:
- lint;
- TypeScript check;
- build;
- rendered HTML tests;
- ledger rule tests.

## Evidence Gate

Every meaningful block must leave:
- PLAN FIRST;
- changed files;
- verification output;
- PLAN UPDATE;
- known gaps.

For work that changes state/evidence semantics, tests must cover the new rule.

## Production Gate

Production deployment is blocked unless:
- `npm run audit:prod` passes; or
- a person records explicit risk acceptance with rationale, scope and expiry.

Current status:
- blocked by Next transitive `postcss` and `sharp` advisories;
- do not run `npm audit fix --force` blindly because it suggests a breaking
  dependency path.

## Agentic Write Gate

Before any agent can write durable state:
- events must be loaded from `data/events.jsonl`;
- event schema validation must exist;
- idempotency must be enforced;
- approval policy must be enforced;
- self-verification must be rejected;
- redaction boundary must exist;
- replay/reducer tests must pass.

Current status:
- events load from `data/events.jsonl`;
- schema validation is partial;
- reducer/writer is not implemented;
- approval linkage is partial;
- redaction is documented but not enforced.

## Integration Gate

Before connecting an external system:
- define importer contract;
- define actor mapping;
- define dedupe key;
- define redaction policy;
- define failure behavior;
- add at least one fixture test.

## Backup Gate

Before relying on the dashboard as daily operational memory:
- local git baseline exists;
- remote backup or export exists;
- restore procedure is documented;
- event log can be replayed after restore.

Current status:
- local git baseline exists;
- remote backup is not configured.

