# Agency OS Product Development Flow

Status: draft v0.1 execution plan  
Last updated: 2026-07-23

## Purpose

This document turns the product DNA into a staged development path. It should
be read before choosing the next coding branch.

The goal is not to build every module now. The goal is to sequence work so each
step increases real product truth.

## Development Rule

Every stage must produce:

- visible product value;
- durable state or evidence;
- tests or verification;
- a plan update;
- known gaps;
- independent critique when the change affects product direction.

## Current Stage

Stage: v0.2 local honesty checkpoint.

Already true:

- local dashboard exists;
- local data model exists;
- append-only event log exists;
- first reducer path exists;
- first writer path exists;
- first browser-local command exists;
- first `capture.note_created` data/reducer slice exists;
- false UI actions are removed;
- claim/evidence required-type contract is enforced;
- `npm run verify` passes with 47 tests;
- independent critic reached 96/100 for the honesty checkpoint.

Not true yet:

- phone review cards do not write;
- evidence attach is not implemented;
- blockers cannot be resolved through UI;
- no GitHub/Codex/OpenClaw/Telegram importers;
- no export/backup/restore;
- no hosted auth;
- no production deployment.

## Stage 1: Product DNA Lock

Goal:
- make the product direction explicit before the next implementation branch.

Artifacts:
- `docs/PRODUCT_DNA.md`;
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`;
- updated research/comparison notes if needed;
- independent critic reviews.

Done criteria:
- the product can be explained in one sentence;
- target user and non-user are clear;
- modules and source-of-truth ladder are clear;
- next milestone candidates are ranked;
- critics score the plan at least 95/100.

## v0.3 Wedge Contract

This contract narrows the next coding stage. It should not be changed casually.

### Wedge

Agency OS v0.3 is a cross-tool personal truth ledger for solo builders, not a
shared workspace, not an audit-log backend and not an agent runtime.

It turns scattered AI work into one reviewable next action by capturing raw
state, linking proof and keeping decisions visible.

### First Package Path

Primary package path:
- local solo-builder kit.

Secondary commercial path:
- service-led setup for one or two similar builders after the kit proves useful.

Deferred path:
- hosted SaaS.

Reason:
- the product's first strength is local trust, inspectability and speed of
  iteration;
- hosted auth, production audit and multi-user collaboration would distract
  from proving the operating loop.

### First Non-Serj User

First external profile:
- independent AI-heavy builder with 2-6 active projects;
- uses ChatGPT/Codex/Claude/GitHub weekly;
- works alone or with one collaborator;
- already loses state across chats, branches, notes and agent runs;
- is comfortable running a local dev tool.

Not first:
- large company;
- nontechnical owner needing a polished SaaS;
- compliance buyer;
- team that only wants task tracking.

### First Repeated Workflow

Weekly ritual to replace:

```text
open many chats/repos/notes -> remember what happened -> guess what matters
next -> promise to clean it up later
```

Agency OS replacement:

```text
open Command Center -> capture one raw note or fact -> link it to project ->
see one next action or review queue -> leave an event trail
```

### Stage 2 Success Metric

Stage 2 succeeds if, for seven days:

- the builder captures at least one useful note/fact from phone or laptop on
  five days;
- each captured item has project link, source, timestamp and actor;
- at least three captures turn into a next action, evidence item, blocker or
  decision;
- no capture requires editing JSON by hand;
- the review queue shows uncategorized captures honestly.

### First Aha

The first aha is:

> "I no longer have to reopen five AI chats to remember what actually changed
> and what I should do next."

Not:
- "Agents can work in the same room."
- "The audit log is tamper-evident."
- "The dashboard is pretty."

### Anti-Scope For v0.3

Do not build in v0.3:

- shared workspace/chat;
- GitHub importer;
- Telegram bot;
- hosted auth;
- pricing page;
- multi-user permissions;
- autonomous agent manager;
- complex evidence verification;
- workflow builder.

### Evidence Priority

Evidence priority by pain:

1. Human capture with source and project link.
2. Manual URL/path/test output attach.
3. Codex task summary/import.
4. GitHub PR/check importer.
5. OpenClaw agent run endpoint.

### Daily Use Definition

A day counts as active Agency OS use when the user does at least one of:

- captures a note/fact;
- updates one next action;
- links evidence to a claim;
- resolves or creates one blocker/decision;
- reviews an agent claim.

Opening the dashboard alone does not count.

## Stage 2: First Phone Write

Goal:
- make phone mode do one real thing.

v0.3 vertical slice:
- first viewport on mobile lets the user capture one note or fact;
- user chooses a project or Inbox;
- save writes a local event;
- confirmation appears immediately;
- the same viewport shows the last three uncategorized captures;
- the same viewport shows one suggested next action or review item.

Default daily ritual:

```text
open on phone -> capture one fact -> choose project or Inbox -> save -> see
what is still uncategorized -> choose one next review/action
```

The default ritual is not:
- review the whole dashboard;
- manage the portfolio;
- inspect every evidence item;
- plan a full work session.

Recommended first command:
- `capture.note_created`

Why:
- lower risk than approval or blocker resolution;
- useful from phone immediately;
- creates raw material for decisions/evidence later;
- proves the capture surface without external integrations.

Alternative command:
- `evidence.verified`

Why not first by default:
- verification policy needs more care;
- evidence types and freshness rules are still young.

Scope:
- one phone-friendly form/card;
- append event;
- replay reducer;
- test route and reducer;
- no Telegram yet.

Data contract for `capture.note_created`:
- actor: person only for v0.3;
- required project link or explicit `inbox` project;
- source: phone, laptop or manual for v0.3;
- body: short text, treated as untrusted data;
- redaction: starts as `pending_scan` unless the command performs a local scan
  and records `no_secrets_detected` or `redacted`;
- idempotency key: actor + project + normalized body + source + local date;
- event action: `capture.note_created`;
- reducer output: uncategorized capture appears in phone review queue and
  recent events;
- conversion: separate later events turn capture into evidence, blocker,
  decision or next action.

Quarantine rule:
- raw capture payload may be written only with redaction status
  `pending_scan`, `redacted`, `no_secrets_detected` or `blocked_sensitive`;
- `blocked_sensitive` captures are hidden from normal dashboard summaries;
- imported chat/task text follows the same rule.

Done criteria:
- a short phone session can capture one note into the ledger;
- the note appears in recent events or review queue;
- invalid/empty input is rejected;
- tests prove write/replay.

UX acceptance states:
- empty capture queue;
- saving;
- saved confirmation;
- exact duplicate capture;
- validation error;
- local file/write failure;
- redaction pending;
- blocked-sensitive capture;
- last three uncategorized captures;
- one suggested next action/review item;
- mobile rendered or screenshot proof.

## Stage 3: Evidence Attach

Goal:
- make proof easy to attach.

Scope:
- attach URL/path/test output text to a claim or work item;
- create `evidence.submitted`;
- optionally create or update claim status;
- validate required evidence type;
- no file upload yet.

Done criteria:
- user can attach evidence without editing JSON;
- verified claims stay blocked until required types are satisfied;
- evidence appears in queue and project freshness.

## Stage 4: Blocker And Decision Flow

Goal:
- stop blocked projects from becoming passive graveyards.

Scope:
- create/update blocker;
- record decision;
- link decision to project;
- unblock project through event replay;
- preserve rationale.

Done criteria:
- a blocked project has a visible question;
- resolving it records a decision event;
- project state changes through reducer, not hand-edit.

## Stage 5: Export, Backup And Restore

Goal:
- make local-first safe enough to trust.

Scope:
- export bundle;
- restore check;
- event log validation;
- snapshot regeneration;
- corruption warning.

Done criteria:
- user can back up `data/` and docs;
- restore procedure is documented and tested;
- corrupted event log blocks writes.

## Stage 6: GitHub Evidence Importer

Goal:
- import the strongest code evidence first.

Scope:
- read-only GitHub fixtures first;
- commits, PRs, checks and deploy URLs;
- dedup by external ID;
- attach to project/claim/work item.

Done criteria:
- no write access required;
- imported evidence is untrusted until parsed/validated;
- duplicate imports are ignored;
- project proof freshness can use GitHub signals.

## Stage 7: Codex/OpenClaw Agent Run Import

Goal:
- turn agent work into first-class reviewable records.

Scope:
- agent run submitted;
- objective/scope/result claim;
- files changed;
- linked evidence;
- verification status.

Done criteria:
- agent work appears in Agent Run Ledger;
- unverified claims become sanity warnings;
- agent write proposals do not mutate state without approval.

## Stage 8: Telegram Surface

Goal:
- make short sessions possible away from the laptop.

Scope:
- read Command Center brief;
- capture note;
- approve/reject low-risk items;
- verify evidence by link;
- no destructive actions.

Done criteria:
- phone can complete one real review action;
- every Telegram action appends an event;
- permissions are explicit.

## Stage 9: Hosted Private Alpha

Goal:
- let one external user try Agency OS without breaking local-first discipline.

Prerequisites:
- production audit resolved or risk explicitly accepted;
- backup/export/restore;
- auth;
- basic privacy boundary;
- release gates passing.

Done criteria:
- one external user can create projects and evidence;
- no agent writes without approval;
- audit export exists.

## Packaging Path

### Package 1: Local Solo Builder Kit

What it is:
- local app;
- data folder;
- docs;
- command/replay tests;
- simple setup.

Buyer/user promise:
- "Stop reconstructing your AI work from chats and repos. Capture what changed,
  keep proof close, and see the next action."

### Package 2: AI Operations Service

What it is:
- guided setup for a founder or small team;
- map projects/workflows;
- install local ledger;
- configure evidence sources;
- run weekly review.

Buyer/user promise:
- "Turn your scattered AI workflows into a visible operating system."

### Package 3: Hosted Agency OS

What it is:
- hosted dashboard;
- auth;
- backups;
- integrations;
- shared workspaces;
- agent identity.

Buyer/user promise:
- "A global control plane for human-agent work."

## Review Loop

For each major product block:

1. Choose context tier from `docs/AGENT_CONTEXT_PROTOCOL.md`.
2. Read `docs/AGENT_START_BRIEF.md` and `docs/NEXT_AGENT_HANDOFF.md`.
3. PLAN FIRST.
4. Implement one bounded change.
5. Verify locally.
6. Update evidence/docs.
7. Update `docs/NEXT_AGENT_HANDOFF.md`.
8. Run independent critic when tier requires it.
9. Patch concrete factual gaps.
10. Repeat until critic score >= 95 or remaining issues require human choice.
11. Commit checkpoint.

## Next Branch Candidates

### Candidate A: Phone Capture

Recommended.

Why:
- highest fit with the user's real work pattern;
- low risk;
- turns phone review from read-only to useful;
- creates more data for future review engine.

### Candidate B: Evidence Attach

Strong second.

Why:
- makes the core evidence promise more real;
- improves project truth.

Risk:
- needs careful type/freshness design.

### Candidate C: Backup/Export

Responsible infrastructure.

Why:
- protects local-first trust.

Risk:
- less visible wow.

### Candidate D: GitHub Importer

Useful but should wait.

Why:
- strong evidence source.

Risk:
- integration complexity before manual evidence flow is ergonomic.

## Decisions Needed From Human Soon

1. Should the next branch optimize for phone usefulness or evidence discipline?
2. Is Agency OS first a private local tool, a productized solo-builder kit, or a
   service-led offering?
3. Should external users see it before GitHub import exists?
4. What is the first non-Serj user profile to interview?
5. How much production audit risk is acceptable for private staging?

## Default Recommendation

Build next:

```text
phone capture -> evidence attach -> blocker decision -> backup/export -> GitHub importer
```

This sequence keeps the product close to the real pain: short sessions,
scattered thought, evidence, blocked decisions and durable progress.
