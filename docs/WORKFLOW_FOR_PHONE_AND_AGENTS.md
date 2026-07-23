# Workflow For Phone And Agents

Status: canonical workflow  
Last updated: 2026-07-23

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
main -> feature/<one-bounded-slice> -> verify -> docs/handoff -> commit -> review -> main
```

Rules:
- one branch;
- one slice;
- one command or event type when possible;
- no deploy unless explicitly planned;
- no credentials in repo;
- no broad framework/storage/auth changes inside feature slices.

## Agent Startup

Every agent should read:
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
capture.note_created writer/command/API
```

Still out of scope:
- full phone UI;
- Telegram;
- GitHub/Codex/OpenClaw importers;
- hosted auth;
- production deploy;
- database migration.
