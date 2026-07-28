# Stack And Tooling Decision

Status: v0.3 build decision  
Last updated: 2026-07-28

Current-state authority: `docs/CURRENT_STATE.md`.

## Decision

Keep the current stack for the next Agency OS development branch.

Verdict:
- good enough for v0.3 local product development;
- not cleared for production deployment;
- flexible enough if storage and write logic stay behind narrow modules;
- too complex to treat as a static dashboard now that writes exist.

Agency OS should continue as:

```text
local-first web kit -> phone-first local write loop -> backup/export ->
private runtime boundary -> request-fresh truth -> manual evidence ->
read-only self-observation import -> private hosted alpha
```

Do not replatform to solve a data-location problem. First isolate runtime data
behind the existing path/command seams.

## Current Stack

Runtime and UI:
- Next App Router through Vinext;
- React;
- TypeScript;
- Vite development/build layer;
- Cloudflare Worker scaffold and bindings;
- local JSON snapshots plus `data/events.jsonl`;
- Node test runner, ESLint and TypeScript checks.

Dormant or future-facing pieces:
- Drizzle is present but not part of the active local write path yet;
- Cloudflare D1/R2 bindings are scaffolded but not the source of truth;
- Worker deployment path exists but is blocked for production.

## Why This Is The Right Short-Term Choice

The current stack already gives:
- a working visual dashboard;
- local browser routes;
- server-side local file writes for the first narrow command;
- fast enough iteration for evening sessions;
- a future hosted path without committing to SaaS too early;
- tests around the ledger, reducer and rendered HTML.

Current caution:
- tracked `data/` is still a public staging dataset and must not be treated as
  the final private runtime home.

The next product risk is not framework choice. The next product risk is whether
the system becomes useful in short phone/laptop sessions.

Therefore the next work should improve the operating loop, not the platform.

## Easy-First Rules

For v0.3:
- keep JSON/JSONL as the active source of truth;
- add one reducer/action at a time;
- use local API routes only for human-owned commands;
- keep agent writes blocked unless the action, approval and reducer path exist;
- keep tests close to reducer, writer, route and rendered UI behavior;
- avoid Drizzle/D1 until persistence, backup or external users demand it;
- avoid desktop packaging until the web/mobile loop is proven useful.

## Future-Flexible Boundaries

The following modules are the architectural seams:

- `app/ledger.ts`: domain model, validation and replay.
- `app/ledger-writer.ts`: append-only event writing.
- `app/local-command.ts`: command validation and actor policy.
- `app/api/local/*`: browser-local command entry points.
- `data/events.jsonl`: append-only event source.
- `data/*.json`: early snapshots, eventually generated or migrated.

Future migrations should replace adapters around these seams, not rewrite the
product model.

## Current Blockers

### Production dependency audit

`npm run audit:prod` currently fails on Next transitive dependencies:
- `postcss <=8.5.11`;
- `sharp <0.35.0`.

Do not deploy to production until this is resolved by a safe dependency path or
the risk is explicitly accepted.

Do not run `npm audit fix --force` blindly. The current npm suggestion points
to a breaking path.

### Local-only writer

The current file-backed writer is correct for a local kit. It is not compatible
with edge/serverless production storage without an adapter.

Before hosted alpha, choose one:
- local-only distribution with backup/export;
- SQLite/Turso-style local or remote database;
- Cloudflare D1 for hosted private alpha;
- Postgres if a larger SaaS backend becomes real.

### Auth and identity

The first browser write route fixes the actor to `person-serj`. That is good
for local safety, but it is not authentication.

Before any remote access:
- add real auth;
- add actor/session binding;
- keep external actions behind explicit approvals.

### Backup and restore

Minimal local event-log backup and restore now exist.

Before using Agency OS as the only memory of real work:
- move runtime data outside the public Git worktree;
- expand backup to a self-contained workspace bundle;
- make restore atomic and coordinated with the writer lock;
- add stale-lock recovery;
- establish an off-machine copy.

## Alternatives Considered

### Plain Vite SPA plus local API

Simpler for a local-only tool, but would discard the already working Next/Vinext
route and render setup. Consider only if Vinext/Next keeps blocking local
development.

### Tauri or Electron now

Attractive for desktop local-first access, but it adds packaging, permissions
and mobile complexity before the core loop is proven. Reconsider after seven
days of useful capture/review behavior.

### SQLite from day one

More robust than JSON files, but premature while the event model is still being
shaped. Add storage adapter work before the second or third write command if
the JSON path starts to feel fragile.

### Hosted-first SaaS

Wrong first move. It would force auth, audit, privacy, tenancy and billing
before the product has proven its solo-builder operating loop.

## Migration Triggers

Reconsider the stack when any of these happens:

- production audit remains blocked when hosted private alpha becomes the next
  step;
- phone access must work away from localhost for more than one user;
- event log operations become slow or query-heavy;
- the app needs multi-device sync;
- a second external user needs their own private workspace;
- writes expand beyond two or three command types;
- the local data folder becomes too risky without automated backup.

## What Autonomous Agents May Do Now

Agents may work autonomously on bounded branches if they:
- start from `docs/AGENT_START_BRIEF.md` and `docs/NEXT_AGENT_HANDOFF.md`;
- implement exactly one planned slice;
- touch at most one new command or event type;
- keep changes behind reducer/writer/command seams;
- run `npm run verify`;
- update `docs/NEXT_AGENT_HANDOFF.md`;
- do not deploy, publish, add integrations, change stack, or broaden v0.3;
- require human review before merge if they change files outside the planned
  slice.

Good autonomous branches:
- private data-home contract;
- runtime path adapter with temporary-fixture tests;
- request-scoped projection refactor;
- literal queue-count fix;
- restore/lock hardening with focused tests.

Not good autonomous branches yet:
- hosted auth;
- GitHub importer with real credentials;
- Telegram bot;
- OpenClaw write endpoint;
- database migration;
- desktop app packaging;
- global redesign.

## Final Call

The current approach is:

```text
easy first: yes
future-flexible: yes, if seams stay narrow
production-ready: no
agent-ready: supervised bounded local branches only
```
