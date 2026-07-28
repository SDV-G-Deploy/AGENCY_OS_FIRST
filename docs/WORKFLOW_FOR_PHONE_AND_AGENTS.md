# Workflow For Phone And Agents

Status: canonical workflow  
Last updated: 2026-07-24

## Canonical Project Locations

Local canonical repo:

```text
C:\Agency_os_first\AGENCY_OS_FIRST
```

GitHub remote:

```text
https://github.com/SDV-G-Deploy/AGENCY_OS_FIRST
```

The generated Codex workspace is now historical working context. Future
development should use the canonical local repo above.

## Source Of Truth

The source of truth is:

```text
repo -> commits -> docs -> tests -> handoff
```

ChatGPT/Codex chats are working rooms, not the source of truth.

## Public Build Note

The repository is currently public.

Technical secret scan found no tracked `.env`, key files, large artifacts or
obvious real credentials before the first push. The public repository still
contains product strategy, architecture notes and planning history. Keep it
public only if public building and visible strategy are intentional.

## Human Phone Workflow

When starting from phone, use a short instruction like:

```text
Use C:\Agency_os_first\AGENCY_OS_FIRST. Read docs/AGENT_START_BRIEF.md and
docs/NEXT_AGENT_HANDOFF.md. Create one new branch from main for the next
chewable step. Use PLAN FIRST. Do one bounded slice. Verify, update handoff,
commit, and stop.
```

Do not ask agents to build several features at once.

## Branch Workflow

Use:

```text
main -> feature/<one-bounded-slice> -> verify -> docs/handoff -> commit -> review -> coordinator merge -> main
```

Rules:
- one branch;
- one slice;
- one command or event type when possible;
- no deploy unless explicitly planned;
- no credentials in repo;
- no broad framework/storage/auth changes inside feature slices.
- worker agents do not checkout, merge, fast-forward or push `main`;
- coordinator agents review, merge and push `main`.

## Larger Goal Workflow

Use larger goals as a sequence of small branches, not as one large commit.

Allowed shape:

```text
milestone goal
-> branch 1: contract/docs
-> verify/review/commit
-> branch 2: model/replay
-> verify/review/commit
-> branch 3: writer/API
-> verify/review/commit
-> branch 4: UI/smoke only if previous gates are green
-> coordinator merge/push
```

Rules:
- use separate git worktrees for parallel workers or overlapping files;
- keep local `main` clean unless the prompt explicitly authorizes coordinator
  checkpointing;
- each branch must declare PLAN FIRST with goal, in scope, out of scope, done
  criteria and evidence;
- independent review is a gate, not permission to expand scope;
- if a score is below threshold, fix only concrete findings inside the current
  scope; otherwise stop and report.

## Agent Startup

Every agent should read:
- `docs/CURRENT_STATE.md`;
- `docs/AGENT_START_BRIEF.md`;
- `docs/NEXT_AGENT_HANDOFF.md`;
- files directly touched by the task.

Agents should read broader docs only when the task asks for product,
architecture, security, storage, deployment or integration changes.

## Agent Exit

Every non-trivial agent run should leave:
- passing or failed verification result;
- changed files summary;
- known gaps;
- exact next chewable step;
- updated `docs/NEXT_AGENT_HANDOFF.md`;
- commit, if verification passes and scope is clean.

## Current Recommended Next Slice

Next slice:

```text
private runtime data-home contract
```

Still out of scope:
- Telegram;
- GitHub/Codex/OpenClaw importers;
- hosted auth;
- production deploy;
- database migration.
- migration of real data before the contract, backup and rollback are approved.
