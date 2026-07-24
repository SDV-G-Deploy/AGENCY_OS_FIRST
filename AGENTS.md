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

## Worker And Coordinator Boundary

Default worker behavior:

- Do not checkout, merge, fast-forward or push `main`.
- Do not push to GitHub.
- Leave `main` clean and let the coordinator review, merge and push.
- If a task asks for more than one slice, stop after the first verified commit
  unless the prompt explicitly authorizes a multi-slice supervised cycle.

Multi-slice supervised cycles:

- Use one branch per slice.
- Prefer separate git worktrees for parallel workers or any cycle with
  overlapping touched files.
- The coordinator owns merge order, conflict resolution and pushing `main`.
- If the prompt explicitly authorizes local checkpointing between sequential
  slices, state that in PLAN FIRST and record it in `docs/NEXT_AGENT_HANDOFF.md`.

Stop immediately when:

- `npm run verify` fails and the fix is outside the current slice;
- scope requires auth, storage, deploy, dependency or integration changes;
- files outside the declared slice change unexpectedly;
- the next step requires a product decision.

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
mobile capture review UI affordance for capture.review_marked
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
