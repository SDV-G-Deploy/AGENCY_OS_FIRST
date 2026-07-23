# AGENTS.md

This is the root instruction file for Codex and agentic work on Agency OS.

## Canonical Repo

```text
C:\Agency_os_first\AGENCY_OS_FIRST
```

GitHub:

```text
https://github.com/SDV-G-Deploy/AGENCY_OS_FIRST
```

Use this repo as the source of truth. ChatGPT/Codex chats are working rooms,
not durable project memory.

## Before Coding

Always start by reading:

- `docs/AGENT_START_BRIEF.md`
- `docs/NEXT_AGENT_HANDOFF.md`
- files directly touched by the task

Then inspect:

```text
git status
git log -1 --oneline
```

If docs conflict with code/tests, trust code/tests first, then update the docs.

## Work Protocol

Use this loop:

```text
PLAN FIRST -> one bounded slice -> verify -> update handoff/docs -> commit -> stop
```

Rules:

- Create one new branch from `main` for product work.
- Do one bounded slice.
- Prefer one command or event type per slice.
- Keep changes behind existing reducer/writer/command/API seams.
- Run `npm run verify` before committing.
- Update `docs/NEXT_AGENT_HANDOFF.md` before finishing.
- Commit only when verification passes and scope is clean.

## Do Not Do Unless Explicitly Asked

- Do not deploy.
- Do not add real integrations.
- Do not add credentials or secrets.
- Do not change framework, storage, auth or hosting strategy.
- Do not broaden the v0.3 scope.
- Do not rewrite unrelated files.
- Do not create several feature branches in parallel from one task.

## Current Product Direction

Agency OS is a local-first personal truth ledger for a solo builder working
across AI chats, coding agents, repositories and short phone sessions.

Current package path:

```text
Local Solo Builder Kit
```

Current next slice:

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

## Exit Handoff

At the end of non-trivial work, update `docs/NEXT_AGENT_HANDOFF.md` with:

- branch;
- commit;
- working tree state;
- last verified command/result;
- completed work;
- changed files;
- known gaps;
- exact next chewable step;
- files the next agent should read;
- files the next agent can skip.
