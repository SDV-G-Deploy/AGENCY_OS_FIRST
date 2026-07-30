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

- `docs/CURRENT_STATE.md`
- `docs/AGENT_START_BRIEF.md`
- `docs/NEXT_AGENT_HANDOFF.md`
- files directly touched by the task

Then inspect:

```text
git status
git log -1 --oneline
```

If sources conflict, use:

```text
code/tests/Git
-> docs/CURRENT_STATE.md
-> docs/NEXT_AGENT_HANDOFF.md
-> plans/contracts
-> historical evidence
```

Do not choose a next slice from a historical test count or task artifact.

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

## Owner-Authorized FULL MVP Goal Mode

The normal one-slice rules above remain the default. A FULL MVP multi-window
goal is active only when all of these are true:

- the owner prompt explicitly names `docs/full-mvp/05_OVERNIGHT_GOAL_PROMPT.md`;
- it supplies an accepted `planningCommit`, stable `goalId`, current
  `windowId` and `authorizationId`;
- the external H00 authorization exists outside Git and passes the trusted
  execution validator;
- the coordinator uses the dedicated integration/controller and detached
  planning-authority worktrees;
- `main`, GitHub, deployment and real owner data remain outside authority.

In that mode, the accepted `docs/full-mvp/**` package and `TASK_GRAPH.json`
replace only these default workflow limits:

- “create one branch from `main`” becomes one task branch/worktree from the
  current authorized integration commit;
- “one bounded slice then stop” becomes the bounded multi-window DAG and its
  deadline/resume rules;
- the coordinator may dispatch at most the graph-authorized non-overlapping
  workers;
- storage, local-session, recovery and allow-listed local-Git work explicitly
  present in the graph is in scope;
- v0.3 remains the current product state while the integration branch builds
  the v0.4 Private Local Dogfood candidate.

This mode does not override safety boundaries. Workers still cannot move
`main`, push, deploy, inspect/migrate real private data, weaken security, invent
dependencies or expand beyond the accepted graph. If H00 or any identity/commit
binding is absent, fall back to the normal one-slice workflow and stop the FULL
MVP launch as `BLOCKED_PRECONDITION`.

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

Current stage:

```text
v0.3 Supervised Local Staging
```

Current milestone:

```text
State synchronization and private-runtime hardening
```

Current next bounded slice:

```text
private runtime data-home contract
```

Still out of scope:

- Telegram;
- GitHub/Codex/OpenClaw importers;
- hosted auth;
- production deploy;
- database migration.
- moving real data before an approved migration, backup and rollback plan.

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

Update `docs/CURRENT_STATE.md` in the same slice only when a current fact,
stage, gate or next milestone changed. Record recurring friction separately in
`docs/PAPERCLIPS.md`.
