# Agent Context Protocol

Status: draft v0.1  
Last updated: 2026-07-23

## Purpose

Agents need enough context to work safely without wasting tokens rereading the
entire product archive every time.

This protocol replaces "always read all big docs" with a tiered context model
and a required handoff artifact.

## Principle

Default to:

```text
compact brief + current handoff + relevant source files
```

Escalate to full docs only when the task changes product meaning,
architecture, safety, or public claims.

## Freshness And Conflict Rule

Every handoff must declare:
- branch;
- commit;
- working tree state;
- last verified command/result.

If sources disagree, trust in this order:

1. current code and tests;
2. current command output;
3. `docs/NEXT_AGENT_HANDOFF.md`;
4. `docs/AGENT_START_BRIEF.md`;
5. focused product/architecture docs;
6. older history in `AGENCY_OS_PLAN.md`.

If the handoff contradicts code/tests, do not reread the whole archive first.
Inspect the relevant files, update the handoff, and continue from the verified
state.

## Context Tiers

### Tier 0: Tiny Continuation

Use for:
- typo/doc cleanup;
- obvious local test fix;
- small CSS/wording fix with no product contract change.

Read:
- `docs/AGENT_START_BRIEF.md`;
- `docs/NEXT_AGENT_HANDOFF.md`;
- directly relevant files.

Do not read:
- full product DNA;
- full architecture;
- full historical plan.

Required exit:
- update handoff only if the next step, verification state or touched surface
  changes.
- no critic required.
- no broad evidence ceremony required.

### Tier 1: Bounded Product Slice

Use for:
- v0.3 capture reducer;
- one local command;
- one UI surface;
- one evidence or blocker command.

Read:
- `docs/AGENT_START_BRIEF.md`;
- `docs/NEXT_AGENT_HANDOFF.md`;
- current slice section in `docs/PRODUCT_DEVELOPMENT_FLOW.md`;
- relevant invariant/security doc section;
- relevant code/tests.

Usually do not read:
- full `AGENCY_OS_PLAN.md`;
- full research notes;
- full product DNA.

Required exit:
- update tests;
- update evidence/docs if contract changed;
- update `docs/NEXT_AGENT_HANDOFF.md`.

### Tier 2: Architecture Or Safety Change

Use for:
- event envelope changes;
- approval/permission changes;
- redaction/import changes;
- data model changes;
- release gate changes.

Read:
- Tier 1 files;
- `docs/AGENCY_OS_ARCHITECTURE.md`;
- `docs/DATA_MODEL_AND_INVARIANTS.md`;
- `docs/EVENT_LOG_INTEGRITY.md`;
- `docs/SECURITY_AND_APPROVALS.md`;
- `docs/RELEASE_GATES.md`;
- relevant sections of `docs/CURRENT_EVIDENCE.md`.

Required exit:
- independent critic if risk is medium/high;
- update handoff and evidence.

### Tier 3: Product Direction Or Market Change

Use for:
- changing wedge;
- changing first user;
- changing package path;
- choosing new integration priority;
- making claims about market/best practice.

Read:
- Tier 2 files;
- `docs/PRODUCT_DNA.md`;
- `docs/PRODUCT_DEVELOPMENT_FLOW.md`;
- `docs/RESEARCH_AND_COMPARISON.md`;
- current web sources as needed;
- `AGENCY_OS_PLAN.md` only for recent decision history.

Required exit:
- independent product critic;
- updated product docs;
- updated handoff.

## Handoff Contract

Every non-trivial agent run must leave `docs/NEXT_AGENT_HANDOFF.md` in a useful
state.

A handoff is useful when the next agent can answer:

1. What just changed?
2. What was verified?
3. What failed or was skipped?
4. What is the next chewable step?
5. What files must I read?
6. What files can I skip?
7. What must I not do?

The handoff must start with freshness metadata:

```text
branch:
commit:
working tree state:
last verified command/result:
conflict rule:
```

## Cadence

Borrowed from Trailmark's right-sized block idea:

- Tier 0: no critic, no broad docs.
- Tier 1: local verification; critic optional unless product contract changes.
- Tier 2: local verification plus independent critic.
- Tier 3: local verification, web/current-source check and independent critic.

## Why Not Always Full Context

Full context every time causes:

- token waste;
- slower starts;
- stale historical details competing with current handoff;
- agents optimizing for documentation ritual instead of the next bounded step.

The full archive remains available, but it is not the default working set.

## Why Not Only Handoff

Handoff can drift or omit constraints.

The compact start brief and tier rules keep handoff grounded in:
- product wedge;
- current safety gates;
- current next slice;
- minimum verification.

## Source Inspirations

Trailmark:
- artifact-first tasks;
- block reports;
- registry over chat memory;
- right-sized cadence instead of mandatory heavy subagents.

GitHub Copilot cloud agent:
- plan and branch work should be reviewable before PR/merge.

OpenAI Agents SDK:
- sessions, tracing, guardrails and human-in-the-loop approvals should be
  visible runtime concepts, not hidden chat claims.
