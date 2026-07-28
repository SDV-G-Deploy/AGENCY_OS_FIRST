# Agency OS Paperclips

Status: current friction and failure-risk register
Last updated: 2026-07-28

## Purpose

A paperclip is a small piece of friction, ambiguity or unfinished infrastructure
that may not block one bounded slice but repeatedly wastes attention or can
become a larger product failure.

This file has two sections:

- paperclips observed while building and reviewing Agency OS;
- paperclips that can obstruct the future product or its users.

Paperclips are not a feature backlog. Each note must say what it obstructs and
when it should be addressed.

## Current Work Paperclips

### PC-W01 — No single current-state authority

Observed:

- start brief, handoff, development flow, README and dashboard data described
  different stages;
- test counts ranged from 66 to 74;
- several files proposed already completed work.

Impact:

- new agents choose different next slices from the same repository;
- coordinator time is spent reconstructing truth;
- documentation updates can make the contradiction worse.

Response:

- `CURRENT_STATE.md` is now the canonical current-state authority;
- current docs must link to it instead of duplicating stage facts.

Status: addressed by the current synchronization; requires ongoing enforcement.

### PC-W02 — Handoff became an archive

Observed:

- `NEXT_AGENT_HANDOFF.md` reached more than 700 lines;
- current state, old slices, old test counts and evidence history lived in one
  file.

Impact:

- high reading cost;
- current facts are difficult to distinguish from history;
- agents may stop reading before the actual next step.

Response:

- keep handoff compact;
- keep historical evidence in `CURRENT_EVIDENCE.md`, `tasks/log/` and Git.

Status: addressed by the current synchronization.

### PC-W03 — Tracked product records stopped evolving

Observed:

- `data/projects.json`, work items, evidence and event fixtures largely stopped
  at the v0.2 honesty closure;
- dashboard still proposed building capture ledger after capture, review and
  backup/restore were complete.

Impact:

- the product itself reports a false stage;
- UI review is misleading even when docs are correct;
- stale fixtures hide runtime freshness bugs.

Response:

- synchronize current staging records now;
- later add a read-only self-observation importer and explicit state-update
  workflow.

Status: being addressed in the current synchronization.

### PC-W04 — The strategic hardening plan was untracked

Observed:

- `STRATEGIC_HARDENING_AND_PRODUCT_PLAN.md` existed only as an untracked file;
- agents working from GitHub could not see it.

Impact:

- local and remote planning contexts diverge;
- the project can revert to the older UI-first sequence.

Response:

- include the plan in this synchronization branch;
- mark its adoption status explicitly.

Status: being addressed.

### PC-W05 — Too many retained worktrees

Observed:

- many completed feature worktrees remain registered;
- old branches still look active.

Impact:

- harder branch discovery;
- accidental work in an obsolete tree;
- unnecessary disk usage;
- ambiguous “current branch” reports.

Response:

- coordinator should audit and prune only after verifying every branch is
  merged and every worktree is clean;
- do not delete them inside this synchronization slice.

Status: open, coordinator maintenance.

### PC-W06 — Worktree dependencies are not standardized

Observed:

- worker worktrees often do not contain `node_modules`;
- worker summaries alternate between full verify and `git diff --check`.

Impact:

- a failed verify may mean missing environment rather than failed code;
- evidence quality depends on which folder the agent happened to use.

Response:

- worker records focused checks;
- canonical coordinator runs full `npm run verify`;
- later add a documented worktree bootstrap command if autonomy needs it.

Status: partially addressed by workflow, still operational friction.

### PC-W07 — Verification count is manually copied

Observed:

- multiple docs hard-code 66 or 74 tests;
- the count becomes stale whenever tests change.

Impact:

- harmless test additions create documentation contradictions;
- agents treat counts as stage evidence even when they are historical.

Response:

- only `CURRENT_STATE.md` and current handoff may state the latest count;
- evidence history may retain historical counts with dates;
- avoid copying the count into long-lived architecture docs.

Status: addressed by policy, not automated.

### PC-W08 — Audit commands produce broad noisy output

Observed:

- contradiction scans across all documentation return hundreds of historical
  matches;
- history and current claims are not structurally separated.

Impact:

- real contradictions are easy to miss;
- audits consume unnecessary context.

Response:

- current docs stay short;
- historical artifacts are explicitly labelled;
- future state checker should scan current sources only.

Status: open.

## Future Product Paperclips

### PC-P01 — Public Git worktree doubles as private data home

Risk:

- raw notes, identifiers and task evidence can enter public Git history.

Required response:

- private runtime data directory outside the repo;
- migration and rollback;
- safe public fixtures.

Priority: P0.

### PC-P02 — `pending_scan` is a label, not a scanner

Risk:

- raw sensitive text is persisted before classification;
- normal capture and backup paths can retain secrets.

Required response:

- scan/redact before normal projection;
- private quarantine;
- no raw body in idempotency keys or logs.

Priority: P0.

### PC-P03 — Mixed-age dashboard projections

Risk:

- after a write, some UI blocks can show new state while others show
  module-cached state.

Required response:

- one request, one loaded ledger, one replay, one set of projections.

Priority: P0.

### PC-P04 — False queue count

Risk:

- zero captures can be displayed as four captures because sanity-check count is
  used as fallback.

Required response:

- literal counts only;
- zero-state tests.

Priority: P0.

### PC-P05 — Local routes can be mistaken for remotely safe routes

Risk:

- fixed actor ID is not authentication;
- no explicit Origin, request-size or rate boundary exists.

Required response:

- loopback-only guard now;
- session-bound actor and full request protections before remote access.

Priority: P1.

### PC-P06 — Restore can race with writes

Risk:

- direct target replacement does not share the writer lock;
- interrupted restore can leave ambiguous state;
- stale lock can survive a crash.

Required response:

- shared lock;
- temporary file, flush and atomic replace;
- stale-lock recovery;
- compatibility manifest.

Priority: P1.

### PC-P07 — Unknown actions can be silently informational

Risk:

- state-changing intent is partly inferred from action naming convention.

Required response:

- explicit action registry;
- unknown action rejection by default;
- informational allow-list.

Priority: P1.

### PC-P08 — Backup is not a complete workspace backup

Risk:

- event log is backed up but snapshots, attachments and compatibility context
  are not one self-contained restore bundle.

Required response:

- workspace manifest;
- snapshot and attachment inventory;
- repository/schema version;
- off-machine copy drill.

Priority: P1.

### PC-P09 — Static demo content looks current

Risk:

- “today”, “tonight” and seed portfolio wording can be read as live truth.

Required response:

- derive from current data, label as demo, or remove.

Priority: P1.

### PC-P10 — Phone mode is not a bounded phone workflow

Risk:

- users scroll through the entire desktop dashboard;
- short review intent is lost.

Required response:

- Capture, Review and Today first-level phone surfaces;
- desktop drill-down remains separate.

Priority: P2.

### PC-P11 — Production dependencies are red

Risk:

- current stable Next chain includes high-severity PostCSS/sharp advisories.

Required response:

- no force downgrade;
- no production deploy;
- track stable patched dependency path.

Priority: production blocker.

### PC-P12 — Public project governance is incomplete

Risk:

- public repository has no clear license/security/contribution surface;
- branch protection and dependency-update workflow are limited.

Required response:

- address during public/hosted readiness, not before core local truth.

Priority: P2/P3.

## Paperclip Update Rule

Add or update a paperclip when:

- the same friction appears twice;
- an agent must reconstruct missing context;
- a green test hides a contradictory visible state;
- an operational workaround becomes normal procedure;
- a future feature would magnify the issue.

Close a paperclip only with evidence. “Documented” is not the same as
“resolved”.
