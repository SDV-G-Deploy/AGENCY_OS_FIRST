# Agency OS Architecture

Status: draft v0.4 planning baseline  
Last updated: 2026-07-23

## Product Spine

Agency OS is a state, evidence and coordination layer for a solo builder who
uses AI agents, coding tools, GitHub, phone sessions and occasional deep laptop
sessions.

It is not primarily:
- a chat app;
- a generic task manager;
- a replacement for GitHub;
- an autonomous CEO agent;
- a universal agent runtime.

It is primarily:
- a global portfolio state board;
- an evidence ledger;
- a blocker and decision memory;
- a phone-friendly review queue;
- a verification layer over agent claims;
- a planning and next-action engine.

## Core Promise

At any moment the system should answer:

1. What projects exist?
2. Which projects are active, paused, blocked or archived?
3. What is the one next action for each active project?
4. Which claims lack proof?
5. Which agent runs require human review?
6. Which decisions block progress?
7. What changed since the last review?
8. What should happen next?

The core loop is:

Intent -> Plan -> Action -> Evidence -> Verification -> State Update -> Review

If a step leaves no durable trace, Agency OS must not treat it as complete.

## Current Product Backbone

The product backbone is intentionally small:

1. Local global dashboard.
2. Local State Ledger records in JSON.
3. Append-only event log in JSONL.
4. Pure replay reducer for deriving current state.
5. Guarded writer and command layer for the first human-only state update.
6. Browser-local form/API for updating one project's next action.
7. Verification suite that proves build, render, ledger rules, replay, writer,
   command and API write path.

The current app is not yet a hosted production system. It is a local staging
environment that can show the product shape and safely prove one state mutation
path.

## System Of Record Ladder

Agency OS must separate what is canonical from what is merely convenient.

1. Source records:
   - `data/projects.json`;
   - `data/work-items.json`;
   - `data/evidence.json`;
   - `data/agent-runs.json`;
   - `data/blockers.json`;
   - `data/decisions.json`;
   - `data/approvals.json`;
   - `data/actors.json`;
   - `data/traces.json`.

2. Event record:
   - `data/events.jsonl`;
   - append-only;
   - sequenced;
   - idempotent;
   - hash-linked for local tamper-evidence;
   - never treated as cryptographic security by itself.

3. Derived state:
   - `getReplayDerivedLedger()`;
   - dashboard-facing exports in `app/ledger.ts`;
   - sanity checks, recommended steps and phone queue.

4. Presentation:
   - `app/page.tsx`;
   - `app/NextActionForm.tsx`;
   - CSS and rendered HTML tests.

Presentation must not become the source of truth. If the UI disagrees with the
ledger, the UI is wrong.

## Module Map

### Data Ingestion

Reads local JSON/JSONL, parses external imports, normalizes IDs and rejects
malformed records.

Current implementation:
- JSON imports in `app/ledger.ts`;
- JSONL raw import and `parseLedgerEvents()`.

Future implementation:
- GitHub importer;
- Codex task importer;
- OpenClaw agent-run importer;
- Telegram capture importer.

### Integrity And Replay

Validates event shape, reference links, sequence, idempotency and hash chain,
then derives current state through reducers.

Current implementation:
- `validateEventLog()`;
- `validateLedger()`;
- `calculateEventHash()`;
- `replayLedgerEvents()`.

Future implementation:
- reducer coverage for evidence, blockers, decisions, agent runs and approval
  rejection;
- stronger hash/signature boundary if hosted or shared.

### Command And Write Layer

Accepts bounded intent from a person or approved agent, validates it, writes an
event, then proves the derived state changed as expected.

Current implementation:
- `appendProjectNextActionEvent()`;
- `runProjectNextActionCommand()`;
- `POST /api/local/next-action`;
- browser form for one human-only next-action update.

Future implementation:
- evidence attach command;
- blocker resolution command;
- approve/reject command;
- capture note command;
- import command.

### Review Engine

Turns state into a small set of decisions and checks.

Current implementation:
- `getSanityChecks()`;
- `getRecommendedSteps()`;
- `getPhoneReviewQueue()`.

Future implementation:
- daily brief;
- evening update;
- weekly review;
- stale project retirement suggestions;
- cost and agent-sprawl checks.

### Evidence Registry

Links claims to durable artifacts and makes verification status explicit.

Current implementation:
- evidence records;
- evidence freshness;
- claim-without-proof sanity checks.

Future implementation:
- file/screenshot/test-output attachments;
- GitHub PR/check/deploy evidence;
- Codex task evidence;
- exportable audit bundles.

### Identity, Permissions And Approvals

Treats humans, agents and external tools as separate actors with explicit
scope.

Current implementation:
- actors table;
- person-only local command;
- scoped single-use approval;
- durable `approval.approved` and `approval.used` events.

Future implementation:
- approval rejection;
- actor tokens;
- permission manifest per agent;
- external-action policies;
- agent retirement and token removal.

### Artifact Trail

Keeps the "what happened and why" record outside chat.

Current implementation:
- `AGENCY_OS_PLAN.md`;
- `docs/CURRENT_EVIDENCE.md`;
- `tasks/log/...`;
- git commits.

Future implementation:
- task/block artifact registry;
- report files per block;
- artifact hashes;
- searchable local index.

## Fact Confirmation Contract

A fact in Agency OS must say what proves it.

Project status is confirmed by:
- event replay;
- linked evidence freshness;
- blocker/decision state;
- last verified change.

Work completion is confirmed by:
- definition of done;
- verification method;
- linked evidence;
- passed check or human verification.

Agent work is confirmed by:
- agent run objective and scope;
- result claim;
- changed files or external actions;
- evidence;
- verifier distinct from the submitting agent for medium/high-risk work.

Approval is confirmed by:
- approval request record;
- durable approval event from a person actor;
- matching requested actor/action/scope/risk/entity;
- durable use event when the approval is consumed.

Recommended next steps are confirmed by:
- explicit rule output;
- source entity;
- reason;
- target evidence to produce.

Anything not backed by one of these paths remains a claim, not a confirmed
state.

## Product Skeleton

### 1. Command Center

Purpose: the first screen for morning, evening and phone checks.

Must show:
- today's focus;
- portfolio health;
- stale evidence count;
- blocked project count;
- agent claims awaiting verification;
- recommended next steps;
- phone review queue.

Design rule:
- no decorative analytics before operational truth;
- every visible number must be derived from state, not hand-written copy.

### 2. Portfolio Registry

Purpose: one canonical list of projects.

Project fields:
- id;
- name;
- purpose;
- success definition;
- priority lane: core, revenue, infrastructure, laboratory;
- stage: idea, validation, build, launch, growth, maintenance;
- state: active, blocked, paused, archived;
- current milestone;
- next action;
- main blocker;
- decision needed;
- owner;
- canonical repository;
- production URL;
- last verified change;
- evidence freshness;
- last updated.

Hard rule:
- an active project needs exactly one primary next action.

### 3. Work Queue

Purpose: actionable work, not infinite backlog.

Work item fields:
- id;
- project id;
- title;
- owner;
- status;
- definition of done;
- verification method;
- due/review date;
- linked evidence;
- linked agent runs.

Hard rule:
- no work item is "done" without a verification method and evidence.

### 4. Evidence Ledger

Purpose: distinguish claims from proof.

Evidence fields:
- id;
- type: commit, PR, check, URL, screenshot, file, note, user confirmation,
  deploy, test output, command output;
- source;
- URL or path;
- created at;
- submitted by;
- verified by;
- verification status: missing, pending, verified, rejected, stale;
- linked project/work item/agent run;
- expiry/freshness policy.

Hard rule:
- "claimed done" and "verified done" are different states.

### 5. Agent Run Ledger

Purpose: make AI work reviewable.

Agent run fields:
- id;
- agent identity;
- tool/harness: Codex, Claude Code, OpenClaw, GitHub Copilot, other;
- objective;
- permission scope;
- started at;
- completed at;
- result claim;
- files changed;
- external actions;
- evidence;
- verification status;
- human decision.

Hard rule:
- any write-capable agent must have scope, evidence and review status.

### 6. Blockers and Decisions

Purpose: prevent silent stagnation and lost reasoning.

Blocker fields:
- id;
- project id;
- question;
- impact;
- owner;
- state;
- created at;
- decision link.

Decision fields:
- id;
- question;
- context;
- options considered;
- selected option;
- rationale;
- decided by;
- decided at;
- review date;
- linked evidence.

Hard rule:
- a blocked project needs a visible decision question.

### 7. Review Engine

Purpose: produce daily and weekly truth.

Daily review:
- what changed;
- what was verified;
- what is claimed but unverified;
- what is stale;
- what requires a human decision;
- what should be paused.

Weekly review:
- confirmed progress;
- false progress;
- active lanes over limit;
- projects to pause/archive;
- reusable workflows discovered;
- next week focus.

### 8. Sanity Check Engine

Initial rules:
- active project missing next action;
- stale or missing evidence;
- blocked project without decision;
- agent claim without verified proof;
- too many active lanes;
- work item without verification method;
- repeated plan updates without shipped evidence;
- high-risk dependency/security issue;
- external action without approval policy.

UI honesty gate:
- visible active controls must have a backing command model;
- controls without backing commands render as status or planned-work labels;
- rendered/source tests guard this until UI metadata exists in the ledger.

### 9. Capture Surfaces

Phone:
- approve/reject agent claim;
- verify evidence;
- resolve blocker;
- capture drift;
- add quick note.

Laptop:
- edit project state;
- attach evidence;
- run sanity checks;
- review agent run detail;
- plan and close blocks.

Agent/API:
- submit proposed update;
- submit evidence;
- submit agent run;
- request scoped write permission;
- submit verification result.

## Technical Architecture

### Phase 0: Current

Stack:
- Vinext / Next / React / TypeScript;
- local JSON records;
- append-only JSONL event log;
- replay-derived dashboard state;
- computed ledger rules;
- one local browser write path for project next action;
- node tests;
- local browser.

Current gates:
- `npm run verify` passes: lint, typecheck, build and tests;
- `tests/ledger.test.mjs` covers the local API write path against a temporary
  event ledger;
- production dependency audit currently has an upstream Next/PostCSS advisory
  blocker and must remain visible before deployment.

### Phase 1: Local Ledger

Use local files as the first durable source:
- `data/projects.json`;
- `data/work-items.json`;
- `data/evidence.json`;
- `data/agent-runs.json`;
- `data/decisions.json`;
- `data/events.jsonl`.

Why files first:
- easy to inspect;
- easy to version;
- works offline;
- friendly to agents;
- no DB migration overhead before the schema stabilizes.

Write policy:
- UI may still be read-only at first;
- agent writes must go through append-only event files or proposed changes;
- destructive changes require explicit human approval.

Stable identity rule:
- all cross-entity links use stable IDs, never display names;
- display names are presentation only;
- imported external IDs are namespaced.

Derivation rule:
- evidence freshness is derived from linked evidence records;
- project health is derived from state, evidence, blockers and decisions;
- recommended steps are derived from explicit rules, not hand-authored copy.

Dormant infrastructure rule:
- D1, Drizzle, Vinext and Cloudflare scaffolding exist because the starter uses
  them and future hosting may need them;
- local JSON/JSONL is the active architecture for the next milestone;
- D1 must not become the source of truth until a migration plan exists.

### Phase 2: Local API

Add endpoints:
- `GET /api/state`;
- `POST /api/events`;
- `POST /api/evidence`;
- `POST /api/agent-runs`;
- `POST /api/decisions`;
- `POST /api/sanity-checks/run`.

Every write endpoint must:
- validate schema;
- append an event;
- update derived state only through a reducer;
- return evidence of the write.

### Phase 3: Integrations

Priority order:

1. GitHub evidence importer:
   - commits;
   - PRs;
   - checks;
   - releases;
   - deploy URLs.

2. Codex task importer:
   - task title;
   - plan updates;
   - changed files;
   - test/build output;
   - final summary.

3. OpenClaw agent run endpoint:
   - objective;
   - scope;
   - claim;
   - evidence;
   - required approval.

4. Telegram phone surface:
   - approve;
   - verify;
   - unblock;
   - capture.

### Phase 4: Hosted/Shared

Only after local value is proven:
- auth;
- hosted persistence;
- backups;
- access control;
- multi-user support;
- audit export;
- mobile PWA.

## Permission Model

Permission levels:

1. Read:
   - inspect state and files;
   - no writes.

2. Propose:
   - suggest updates;
   - attach draft evidence;
   - request a decision.

3. Scoped Write:
   - write specific entity types;
   - project-bound;
   - no delete;
   - event log required.

4. External Action:
   - send message;
   - publish;
   - deploy;
   - buy;
   - delete;
   - change permissions.

External actions require approval policy before implementation.

## Evidence Policy

Evidence must be:
- durable;
- linkable;
- timestamped;
- attributable;
- scoped to a claim;
- reviewable by a human or verifier;
- revocable/rejectable if wrong.

Evidence is not:
- a chat promise;
- a vague "done";
- a hidden tool output;
- a private mental note.

## What We Borrow

From Trailmark:
- artifact-first discipline;
- tasks/blocks/artifacts vocabulary;
- local-first inspectable records;
- read-only browser over work history;
- regression archaeology through artifacts and commits.

From Buzz:
- people and agents as first-class participants;
- shared context;
- identity and permission as core primitives;
- signed/open event-log direction as a future design influence.

From OpenAI Agents SDK:
- sessions, tracing, handoffs, guardrails and human-in-the-loop approvals as
  concepts to mirror, not immediately implement.

From GitHub Copilot coding agent:
- background agent work should end in reviewable artifacts such as PRs,
  checks and security scan signals.

From OWASP Agentic AI guidance:
- least privilege;
- explicit permission manifests;
- audit trails;
- safe parsing;
- dependency pinning;
- no invisible agent authority escalation.

## Things The Human May Forget

The product must remember to handle:
- backups and restore;
- data export;
- schema migrations;
- stale data and evidence expiry;
- timezone correctness;
- identity of agents vs humans;
- secrets redaction;
- permissions before integrations;
- immutable event history;
- explicit rejection paths;
- "undo" for state changes;
- offline/local-first behavior;
- dependency/security gates;
- test artifacts as evidence;
- mobile ergonomics;
- accessible status labels, not color alone;
- import deduplication;
- idempotency for agent writes;
- clock skew and duplicate events;
- audit log retention;
- privacy boundaries between projects;
- boring documentation before automation.

## Non-Goals For The Next Block

Do not build:
- universal workflow builder;
- complex marketplace;
- multi-tenant roles;
- autonomous project manager;
- chat clone;
- full Git hosting;
- arbitrary plugin runtime.

## Next Architecture Milestones

M1: Honest v0.2 closure
- evidence log;
- final plan update;
- verify gate;
- known blocker list.

M2: Local capture ledger
- file-backed data model;
- append-only events;
- UI reads from data files.
- stable IDs replace display-name relationships;
- reducer derives current state from events and records;
- schema validation rejects malformed or duplicate writes.
- event integrity contract covers schema version, idempotency, trace linkage,
  approval linkage, redaction status and hash-chain direction.

M3: Actionable phone review
- approve/reject/verify/capture writes local events;
- no external actions.

M4: GitHub evidence importer
- read-only;
- attach commits/checks/PRs as evidence.

M5: Agent submission endpoint
- agent-run created;
- evidence submitted;
- proposed state update;
- approval required for writes.
