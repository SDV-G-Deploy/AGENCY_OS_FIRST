# Agency OS Product DNA

Status: draft v0.1 product foundation  
Last updated: 2026-07-23

## One-Sentence Product

Agency OS is a local-first personal truth ledger that turns scattered AI work
across chats, coding agents, repositories and phone sessions into one
reviewable project state and one next action.

## Origin

The product starts from a personal operating problem:

- too many possible projects;
- too many AI work sessions scattered across ChatGPT, Codex, Claude, OpenClaw,
  GitHub and phone notes;
- too much "looks done" without proof;
- too little durable memory of what changed, why it changed and what should
  happen next.

The original strategic insight was:

> The next scarce thing is not raw intelligence. It is continuity, direction,
> trust, responsibility, taste, coordination and the ability to turn intention
> into real change.

Agency OS exists to make that scarce layer visible and executable.

## Target User

### Primary user now

A solo builder or very small AI-first team that:

- has several digital projects;
- works in short phone sessions and occasional deep laptop sessions;
- uses AI coding agents and chat tools;
- needs a global view over scattered work;
- wants fewer false starts and more verified progress.

The first real user is the builder of Agency OS.

### First adjacent users later

- independent developers running several micro-products;
- founders using AI agents without a large team;
- small agencies turning repeated client workflows into agent-assisted systems;
- technical operators who need state, evidence and approvals more than chat.

### Not the first user

- large enterprise compliance departments;
- generic Slack/Jira/Confluence replacement buyers;
- teams that only need a task board;
- users who want fully autonomous agents without review.

## Core Job To Be Done

When I am using AI agents across many projects and sessions, help me know what
is true, what changed, what needs proof, what is blocked and what one action
matters next, so I can keep building instead of drowning in possible futures.

## Product Promise

In three minutes, Agency OS should answer:

1. What exists?
2. What is active, blocked, paused or stale?
3. What changed since the last review?
4. Which claims lack proof?
5. Which agent runs require human judgment?
6. Which decision is blocking motion?
7. What is the next physical action?
8. What should be stopped, paused or archived?

## Product Anti-Promise

Agency OS should not promise:

- a perfect autonomous company;
- a universal AI agent runtime;
- a second Slack;
- a decorative dashboard;
- a generic task manager;
- truth without evidence;
- safety without permissions and logs.

## Core Loop

```text
Intent
  -> Plan
  -> Action
  -> Evidence
  -> Verification
  -> State Update
  -> Review
  -> Next Action
```

Every completed step should leave a trace. A step without a trace stays a
claim.

## Product Principles

### 1. The System Does Not Believe Words

"Done" is not enough. A claim needs evidence:

- commit;
- test output;
- URL;
- screenshot;
- file path;
- PR/check;
- human confirmation;
- agent trace;
- decision record.

### 2. One Active Project Needs One Next Physical Action

Backlogs can be large. Daily attention cannot.

Every active project should expose exactly one next action that a human or
agent can actually do.

### 3. Agents Are Actors, Not Magic

Each agent needs:

- identity;
- owner;
- scope;
- permission level;
- current objective;
- linked evidence;
- review status;
- retirement path.

### 4. Phone Mode Is Not A Smaller Dashboard

Phone mode exists for short sessions:

- verify;
- approve/reject;
- unblock;
- capture;
- choose next.

It should avoid editing-heavy screens and instead present crisp review queues.

For v0.3, the first mobile viewport is:

```text
capture one note/fact -> choose project or Inbox -> save -> see last three
uncategorized captures -> see one suggested next action/review item
```

Anything beyond that is secondary on phone.

### 5. Evidence Is A Product Surface

Evidence is not backend bookkeeping. It is part of the product experience.

Users should see:

- why state is green/yellow/red;
- what proof exists;
- what proof is missing;
- when evidence expires;
- who verified it.

### 6. Local-First Before Hosted

Local-first gives:

- inspectability;
- low ceremony;
- agent-friendly files;
- offline use;
- versionable state;
- fast schema evolution.

Hosted comes later, after local value is proven.

### 7. No False Affordances

Visible controls must either:

- perform a real command;
- navigate to a real surface;
- be clearly marked as status/planned.

The product cannot fight false progress while showing fake actions.

## Differentiation

### Versus Buzz-like shared workspaces

Buzz validates the shared human-agent workspace direction. Agency OS should not
compete first as another chat room. Its wedge is:

- global state;
- evidence;
- decisions;
- next action;
- review;
- cross-tool memory.

Buzz is where humans and agents can work together. Agency OS is the state and
truth layer that says what that work means.

### Versus Jira/Linear/Asana

Traditional task systems track assigned work. Agency OS tracks:

- claims vs proof;
- agent runs;
- approvals;
- evidence freshness;
- project lifecycle;
- state derived from events.

### Versus GitHub

GitHub is strong evidence for code. Agency OS aggregates GitHub with:

- ChatGPT/Codex/Claude sessions;
- OpenClaw runs;
- phone decisions;
- business/product blockers;
- non-code evidence.

### Versus Agent Frameworks

Agent frameworks orchestrate execution. Agency OS orchestrates accountability:

- what was attempted;
- under which scope;
- what changed;
- what proof exists;
- what should happen next.

## Core Modules

### Command Center

The first screen. It shows focus, health, stale evidence, blockers, agent
review load, recommended next steps and phone review queues.

### Project Portfolio

The canonical list of active, paused, blocked and archived projects.

### State Ledger

The source-of-truth layer built from records and append-only events.

### Evidence Registry

The proof layer connecting claims to artifacts.

### Agent Run Ledger

The record of AI work: objective, scope, files changed, claim, evidence,
review status.

### Decision And Blocker Memory

The place where open questions and decisions stop disappearing.

### Review Engine

Daily, evening and weekly review output.

### Permission And Approval Layer

Human and agent authority, scoped writes and external action approvals.

### Integration Layer

Read-only first:

- GitHub;
- Codex task artifacts;
- OpenClaw runs;
- Telegram captures.

### Artifact Trail

Plans, reports, reviews, evidence logs, screenshots and commits.

## What Confirms Facts

| Fact | Confirmation |
|---|---|
| Project state | replay-derived ledger, last event, blocker/decision state |
| Work done | definition of done plus verified evidence |
| Agent claim | run record plus evidence plus review |
| Approval | durable person approval event and matching scope |
| Next action | current project state derived from records/events |
| Product quality | local verify, critic score, visual QA, known gaps |
| Production readiness | release gates, dependency audit, backup/restore |

## Success Metrics

### Personal product fit

- opened at least 20 days in a month;
- covers at least 80% of active work;
- reduces active projects or makes project pausing easier;
- creates at least one useful next action per active lane;
- catches false progress before it becomes a week of drift.

### Product signal

- another solo builder voluntarily keeps using it;
- user adds evidence because the system makes it easier, not because it is
  bureaucratic;
- user asks for importers because the ledger already feels valuable;
- user notices when Agency OS is missing.

## v0.3 Validation Target

The first external validation target is one independent AI-heavy builder with
2-6 active projects who already uses AI coding/chat tools weekly and is willing
to run a local tool.

The validation question is not:

> Would this become a big platform?

The validation question is:

> Does this reduce the weekly pain of reconstructing what happened across
> chats, repos and notes?

Minimum external proof:
- one non-Serj user imports or enters at least three project facts;
- they use the system twice in one week;
- they can name one next action they would otherwise have missed or delayed;
- they identify at least one missing workflow that would make it worth using
  again.

### System quality

- no green state without evidence;
- no agent write without actor/scope/event;
- no active button without command;
- no production deploy with blocked release gate.

## Failure Modes

Agency OS fails if it becomes:

- a pretty dashboard over stale data;
- a task manager with AI labels;
- a chat archive;
- a surveillance log with no next action;
- a complex architecture that is too heavy for phone sessions;
- a system that records everything but helps decide nothing.

## Things Easy To Forget

- backup/export/restore;
- schema migrations;
- visual QA artifacts;
- secrets redaction;
- timezone and clock skew;
- idempotency;
- duplicate imports;
- agent retirement;
- cost and token spend;
- undo/rollback;
- evidence expiry;
- privacy boundaries;
- accessibility;
- local data corruption recovery;
- "what changed since last visit";
- emergency freeze for agent writes.

## Product North Star

Agency OS should help one person stop being a generator of possible worlds and
become a durable builder of one real world at a time.
