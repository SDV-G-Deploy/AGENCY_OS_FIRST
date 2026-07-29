# Agency OS FULL MVP Product And UX Contract

Status: proposed implementation contract
Prepared: 2026-07-29
Current-state authority: `../CURRENT_STATE.md`
Product DNA authority: `../PRODUCT_DNA.md`

## 1. Decision

The FULL MVP is:

```text
Agency OS v0.4 — Private Local Dogfood MVP
```

It is a private, local-first operating memory for one solo builder. It closes
one complete truth loop:

```text
capture
-> quarantine and review
-> convert into a typed fact
-> link evidence or record a decision
-> derive project state
-> select one next physical action
-> show what changed
-> back up and restore
```

It also observes one real source of scattered work:

```text
one allow-listed local Git repository
-> read-only observations
-> review Inbox
-> explicit human adoption into project truth
```

Physical-phone access is part of FULL MVP, but Agency OS does not open a public
listener. The supported execution profile is:

```text
Agency OS listens on loopback
-> Tailscale Serve proxies the loopback port over private tailnet HTTPS
-> Tailscale identity headers identify the user
-> Agency OS requires expected identity on every private read and write
-> Agency OS enforces expected Origin + CSRF on every write
-> Tailscale Funnel is forbidden
```

This is an explicit operational dependency, not hidden application magic.
Before an overnight implementation starts, the product owner must install and
sign in to the same tailnet on the laptop and phone. If this preflight is not
ready, the implementation may complete responsive UI but cannot claim the FULL
MVP physical-phone gate.

The FULL MVP is not the final hosted product. "Full" means the core promise is
usable end to end without editing JSON, not that every future integration is
present.

## 2. Target User And Situation

Primary user:

- one AI-heavy solo builder;
- 2–10 active or paused projects;
- short phone sessions plus deeper laptop sessions;
- work scattered across Git repositories, AI chats, notes and agent runs;
- needs continuity and proof more than another task backlog.

Primary situation:

> I return after hours or days away and need to know what is true, what changed,
> what needs review and what one action matters next.

## 3. Outcome Contract

Within three minutes the user must be able to answer:

1. Which projects are active, blocked, paused or stale?
2. What changed since the last completed review?
3. Which claims are supported, missing proof or stale?
4. Which captures still need human classification?
5. Which blockers need a decision?
6. Which agent claims need human review?
7. What is the one next physical action for each active project?
8. Which projects should be paused or archived?
9. What one action deserves attention now?

Within thirty seconds on a phone the user must be able to:

- capture one note into Inbox or a project;
- see a durable confirmation;
- see the next outstanding review item.

Within sixty seconds on a phone the user must be able to:

- classify one capture;
- dismiss or mark it sensitive;
- see the queue and affected project state update.

A typed conversion may take up to two minutes because evidence, decisions and
blockers need explicit fields. Speed does not justify silently inventing data.

## 4. Product DNA That Must Survive Implementation

### DNA-01 — Evidence before green

No work item, claim or agent run becomes verified merely because its author
says it is complete.

### DNA-02 — One active project, one next physical action

Every active project has exactly one current primary next action at release.
A missing-next-action warning is allowed only during migration or invalid-state
recovery and blocks the FULL MVP gate.

### DNA-03 — Agents are scoped actors

Every agent write has actor identity, action, scope, evidence, approval policy
and review status.

### DNA-04 — Phone is a decision surface

Physical phone UI over the approved private-tailnet profile prioritizes
Capture, Review and Today. It does not append the complete desktop dashboard
below a small form. Responsive emulation alone is not evidence of this gate.

### DNA-05 — State is derived, not narrated

Visible stage, health, counts, deltas and recommendations come from one loaded
ledger and explicit rules.

### DNA-06 — Claims, evidence and decisions remain distinct

A note is not evidence. Evidence is not verification. A recommendation is not
an approval. A capture classification is not a conversion.

### DNA-07 — Local-first means recoverable and private

Normal runtime data lives outside the public repository and has a tested
backup/restore path.

### DNA-08 — No false affordances

Every visible action executes a real command or is visibly labelled unavailable.

## 5. Core User Journeys

### J-01 — First local workspace

1. User starts Agency OS.
2. The app resolves a private data home.
3. If it is missing, the app offers an empty private workspace.
4. If legacy tracked data is detected, the app offers a dry-run migration.
5. No private data is written into the Git repository.
6. The UI shows workspace identity, storage mode and last successful backup.

Demo data is a separate explicitly named demo workspace. It is never copied
into the user's private workspace by default and always shows a persistent
`DEMO` badge plus reset action.

Success:

- initialization takes less than five minutes;
- the Git working tree stays clean;
- missing or invalid data home fails with a useful recovery path.

### J-02 — Phone capture

1. User opens the private Tailscale Serve HTTPS URL from an approved phone.
2. Agency OS verifies the proxy identity, expected user, Origin and CSRF state.
3. User opens Capture.
4. Chooses Inbox or an existing project.
5. Enters one short fact/note.
6. Intake validates size and scans/redacts before normal projection.
7. The event is appended to the private ledger.
8. UI confirms the durable event and shows the next review item.

Success:

- under thirty seconds;
- no raw body in logs or idempotency keys;
- exact retry is a no-op;
- sensitive content remains quarantined;
- direct LAN/public access and Tailscale Funnel fail closed.

### J-03 — Review and conversion

1. User opens Review.
2. Sees one safe item, its provenance and project.
3. Chooses a candidate type or dismiss/mark-sensitive.
4. `capture.review_marked` performs only:
   `uncategorized -> classified`, or atomically moves an owner-marked item to
   `quarantined` with `classification: sensitive` and no candidate type.
5. For a classified item the UI opens a typed draft with required fields:
   - claim: assertion, subject and required evidence types;
   - evidence: subject claim/work item, type, provenance and freshness;
   - blocker: question, impact and owner;
   - decision: question, complete option set, selected option and rationale;
   - next action: project and physical action;
   - work item: title, definition of done and verification method.
6. Human confirms the draft.
7. One atomic `capture.resolved` event records `outcome: converted` plus the
   complete typed target payload.
8. Replay creates the target entity and links it back to the capture.
9. The queue advances to the next item.

Alternative terminal outcomes use the same registered action:

```text
capture.resolved outcome=dismissed
capture.resolved outcome=sensitive_retained
capture.resolved outcome=redacted
```

A separate `capture.resolution_reverted` compensating event reopens a mistaken
resolution without deleting either the capture or target history.

Mark-sensitive first moves the capture to Quarantine. The owner then chooses
`sensitive_retained`, `redacted` or `dismissed`; only a redacted copy can return
to normal Review. A proposed redacted body passes the complete structural intake
and secret scanner again. Matched, uncertain or scanner-error results stay
quarantined and append no `capture.resolved` event. A safe redaction creates a
new provenance-linked uncategorized capture; the original remains in immutable
history with outcome `redacted`.

Success:

- conversion is explicit and reversible by a compensating event;
- conversion never verifies evidence automatically;
- classification alone never creates a typed entity;
- dismiss and mark-sensitive remain real durable actions;
- classification/dismiss/sensitive meets the sixty-second target;
- typed conversion meets the two-minute target.

### J-04 — Attach and verify evidence

Claim state machine:

```text
asserted
-> proof_missing
-> proof_submitted
-> verified | rejected
-> stale when freshness expires
```

1. User selects a claim or work item completion claim.
2. Adds URL, local path, commit, command output summary or human attestation.
3. `evidence.submitted` records applicability, type, provenance, accessibility,
   submitter and freshness.
4. Required evidence types come from the claim type/policy and are visible.
5. `evidence.reviewed` records verified or rejected as a distinct action.
6. Project/evidence status updates from the same request-scoped ledger.

Verifier policy is explicit per claim:

```text
owner_review_allowed
independent_person_required
attestation_only
```

- URL, commit, command/test output and accessible local-path evidence use
  `owner_review_allowed` by default in this single-owner MVP. The owner may
  submit and review the artifact, but UI labels the result `owner reviewed`,
  never independent.
- Agent-submitted evidence may be reviewed by the owner; the submitting agent
  can never verify its own evidence.
- `independent_person_required` cannot reach green in the single-owner profile
  until a distinct eligible person exists; UI explains the blocked policy.
- Human attestation is `attestation_only`. It satisfies only a claim that
  explicitly requires attestation and never masquerades as independently
  verified objective evidence.

Success:

- required evidence types are enforced;
- submitter cannot self-verify when policy forbids it;
- inaccessible local paths remain claims, not verified proof;
- human self-attestation is labelled attestation, not independent verification;
- green requires all required evidence types and non-stale verification;
- exact evidence retry is a no-op and a changed retry conflicts.

### J-05 — Blocker and decision

1. User reviews a capture and converts it with target kind
   `blocker_created`, including question, impact and owner.
2. Project becomes visibly blocked through replay.
3. User reviews a later capture and converts it with target kind
   `blocker_resolved_by_decision`, including `resolvesBlockerId`, complete
   option set, selected option, rationale and next action.
4. The atomic resolution creates the decision, links it, resolves the blocker
   and replaces the project next action.
5. Project receives a concrete decision/unblock next action before it can
   return to active state.

Success:

- no blocked project without a visible question;
- resolution does not erase history;
- state changes only through registered actions;
- release data contains zero active projects without a physical next action.

### J-06 — Agent run review

1. Git importer creates a commit/branch observation with provenance.
2. In Review the human chooses
   `observation.reviewed reviewAction=adopted_as_agent_run`.
3. Human supplies fields Git cannot know: agent/tool identity, objective,
   permission scope, result claim and declared external actions.
4. `observation.reviewed` atomically creates the proposed agent-run record,
   linked Git observation and evidence references.
5. Agency OS shows the run in Review.
6. `agent_run.reviewed` records `accepted`, `rejected` or
   `evidence_requested` against an expected run version.
7. Acceptance never silently verifies missing evidence.

Success:

- unverified agent claims create a warning;
- Agency-OS-originated future high-risk/external actions require a matching
  prior approval;
- the reviewer is distinct when policy requires it;
- v0.4 agents do not receive a general durable-write API;
- imported agent identities are records in the source registry with stable
  source ID, display name, owner, active/retired status and last observed time;
- `observation.reviewed` may register/update that external actor and propose
  the run, while human review remains authoritative;
- imported historical runs derive
  `authorizationStatus: approved | unapproved_historical | not_applicable`;
- accepting a historical run means accepting the record into the ledger, not
  retroactively approving its execution; missing approval remains visibly
  `unapproved_historical` and Agency OS cannot claim it prevented an action that
  already happened.

### J-07 — Today and return after absence

1. User opens Today.
2. Sees:
   - total changes since last completed review, with verification badges;
   - the top three changes across all verification states;
   - one recommended physical action;
   - blockers needing decisions;
   - evidence/agent items needing review;
   - stale active projects.
3. User marks the review complete.
4. `review.checkpoint_recorded` submits `expectedSequence: N`. It conflicts if
   durable state advanced after the rendered view.
5. The appended checkpoint at sequence N+1 stores `reviewedThrough: N`; its own
   sequence N+1 becomes the baseline for the next visit.
6. The next visit derives its delta from that sequence, not wall-clock time.
   Checkpoint events, legacy approval-consumption events and operational receipt
   bookkeeping are not user-change items; observations and source-health changes
   are user-visible and are eligible.

Success:

- all numbers are literal;
- every recommendation names its rule and source entity;
- no static "today/tonight" demo content appears as live truth;
- deterministic ordering is risk, age, entity ID;
- exact filtered drill-down includes every delta item.

### J-08 — Backup and recovery

1. User creates a workspace backup.
2. Bundle includes manifest, events, baseline records/rebuildable indexes,
   external evidence reference inventory, quarantine, schema/app versions and
   checksums. It does not claim to copy referenced external files/repositories.
3. Restore dry-run validates compatibility and integrity.
4. Restore takes the writer lock, creates a safety backup and atomically swaps.
5. Replay after restore produces the expected state.

Success:

- interrupted restore leaves the original workspace usable;
- backup can be copied off-machine;
- a reproducible recovery drill passes.

Backup and restore are operational commands, not events inside the bundle they
describe. After a successful operation, Agency OS writes a separate operation
receipt outside the restored bundle and shows it in workspace health. This
avoids a backup containing a claim about itself.

### J-09 — Desktop return and orientation

1. User opens Command Center.
2. Sees workspace mode, exact `as of` time and any partial-load warning.
3. Identifies the primary recommendation and all changed-item counts.
4. Opens a count and reaches the exact filtered set.
5. Inspects reason, provenance and evidence for one item.
6. Returns without losing filter/scroll context.
7. Updates one project next action.

Success:

- complete in under three minutes;
- update is visible across every affected projection after reload;
- a failed required projection blocks normal green/Today presentation.

### J-10 — Weekly portfolio pruning

1. User opens the weekly review.
2. Agency OS identifies active-lane overload, stale projects and projects with
   repeated plans but no verified evidence.
3. User keeps active, pauses or archives each proposed project.
4. Pause/archive records reason, review date and consequence for queued work.
5. Archived projects remain searchable but leave active recommendations.

Workspace setting `activeProjectLimit` defaults to five. The owner may change it
through `workspace.settings_changed`. Activating/creating a project above the
limit fails with a validation result; the user must pause/archive another
project or explicitly change the limit. Reaching the limit creates the
deterministic pruning recommendation before the next activation attempt.

Success:

- the user can enforce an explicit active-project limit;
- a paused/archived project cannot silently retain an active next action;
- the weekly review records what was intentionally stopped.

### J-11 — Read-only continuity observation

1. From an empty source registry, the owner uses `source.configure` to
   allow-list one local Git repository.
2. Importer reads metadata only and never executes imported instructions.
3. It proposes observations for commit metadata, branch/HEAD and dirty/clean
   state since the last source cursor.
4. Every imported author/branch/message/error string passes through the same
   bounded intake and quarantine policy before normal Review or logs.
5. Re-import is idempotent.
6. Renamed or missing sources create a source-health item, not silent deletion.
7. Unmatched observations enter Inbox for human project linking.
8. Human dismisses, links, or adopts the observation as an unverified claim,
   submitted evidence or proposed agent run through Review.

Success:

- the real Git source is observed without duplicate manual entry;
- source text remains untrusted and quarantined where needed;
- changed-since-checkpoint can be checked against source truth;
- importer performs no source write operation; production compares HEAD, ref
  snapshot, index hash and porcelain status, while test harnesses may
  independently content-hash hostile fixtures. This is a behavioral guarantee,
  not an OS-enforced permission boundary.

### J-12 — Sensitive quarantine review

1. Normal Review shows only a masked placeholder and provenance.
2. Local owner deliberately opens Quarantine.
3. A five-minute, single-use owner-confirmation token bound to session,
   identity, Host, CSRF, capture and intended action is required.
4. Reveal/retain/redact/dismiss consumes that token, creates a sanitized audit
   receipt and uses no-store/no-log handling.
5. User keeps original private, creates a redacted copy, or permanently
   dismisses it through a durable resolution.

Success:

- normal projections never receive raw sensitive text;
- original-retention and redacted-copy choices are explicit;
- no sensitive fixture appears in test output or screenshots.

## 6. Required Product Surfaces

### Phone shell

First-level destinations:

```text
Capture | Review | Today
```

Phone rules:

- first useful action visible without long scroll;
- one review item at a time;
- minimum 44×44 px interactive targets;
- no horizontal overflow at 390 px;
- keyboard, focus-visible, reduced-motion and error summary support;
- sensitive raw text never appears in normal Review/Today;
- physical-phone QA uses the approved Tailscale Serve URL, not only emulation;
- direct public/LAN listener mode is not a supported shortcut.

### Desktop shell

First-level destinations:

```text
Today | Projects | Review | History | Settings
```

Desktop rules:

- Today is the desktop Command Center and remains an operational summary, not
  an editing wall;
- drill-down pages own detailed editing;
- Evidence and Agent runs are typed filters/details inside Review, Projects and
  History rather than extra top-level navigation;
- 1280 px viewport must not overflow;
- state badges expose reason/evidence on demand;
- every count navigates to the exact filtered set.

Truth-time rules for every shell:

- show workspace mode: `PRIVATE`, `DEMO` or `UNAVAILABLE`;
- show the replayed ledger sequence and `as of` timestamp in workspace timezone;
- define stale thresholds by entity/policy, not by UI guess;
- a verified change is an event whose resulting claim/evidence policy is
  satisfied, not merely a recently appended event;
- if any required projection fails, show a partial-state banner and suppress
  normal green/Today recommendations;
- private path is masked by default and has deliberate reveal/copy controls.

### Workspace/settings

Must expose:

- workspace ID and private path;
- runtime mode: private, demo or unavailable;
- app/schema version;
- last backup and restore drill;
- write freeze switch;
- registered integrations/importers and their health;
- production/remote gates remain visibly closed.

### Accessibility baseline

FULL MVP targets WCAG 2.2 AA:

- text and UI component contrast meet AA;
- interface works at 200% zoom and 400% reflow;
- DOM/focus order follows visual order;
- focus moves to the error summary after validation failure;
- focus moves to the next review heading after queue advance;
- submitting controls use disabled plus `aria-busy`;
- success, duplicate, conflict and failure are announced through an
  appropriate live region;
- reduced-motion preference removes nonessential transitions;
- automated axe-style checks are supplemented by named manual keyboard,
  screen-reader, zoom/reflow and contrast checks.

Named assistive-technology checks:

- desktop Windows: current NVDA + Chrome, keyboard-only;
- approved phone: platform screen reader (TalkBack/VoiceOver as applicable) +
  supported browser;
- 200% desktop zoom and 400% narrow reflow;
- reduced-motion and high-contrast/forced-colors smoke checks.

## 7. Domain Actions Required For FULL MVP

Already implemented and retained:

- `project.next_action_updated`;
- `capture.note_created`;
- `capture.review_marked`;
- `approval.approved`;
- `approval.used` for legacy replay/migration only.

New approval-gated commands consume their scoped approval atomically inside the
primary domain event. They do not append a second `approval.used` event.

Required new actions:

- `capture.resolved` with a discriminated outcome:
  `converted | dismissed | sensitive_retained | redacted`;
- `capture.resolution_reverted`;
- `evidence.submitted`;
- `evidence.reviewed` with `verified | rejected`;
- `review.checkpoint_recorded`;
- `project.created`;
- `project.state_changed`;
- `observation.imported`;
- `observation.reviewed`;
- `agent_run.reviewed`;
- `workspace.settings_changed`.

This is eleven new actions, not a general CRUD API. Typed claims, evidence,
blockers, decisions, work items and agent-run proposals are created atomically
as target payloads of `capture.resolved` or `observation.reviewed`.

Cross-entity atomicity rule:

- one resolution event contains the full target payload;
- reducer creates/updates the target and links the capture/observation in one
  pure transition;
- writer appends exactly one event after full preflight validation;
- exact retry is a no-op;
- a changed retry is an idempotency conflict;
- reversal never deletes the target; it marks the target superseded and reopens
  the source for review.

Allowed `capture.resolved` target kinds:

```text
claim_created
evidence_submitted
blocker_created
blocker_resolved_by_decision
decision_recorded
project_next_action_set
work_item_created
work_item_completion_claimed
agent_run_proposed
correction_recorded
```

Every target schema declares `expectedSourceVersion`, a map of every
`expectedEntityVersions`, and exact resulting entities. Baseline version is
zero; each mutating event sets every affected entity version to its sequence.
`blocker_resolved_by_decision` requires `resolvesBlockerId`, complete decision
option set and replacement next action.

Reversal precondition:

- target current version still derives from the original resolution event;
- otherwise return a conflict and require a new explicit correcting capture.

`correction_recorded` supersedes a currently referenced target version without
deleting history. `work_item_completion_claimed` creates a proof-missing
completion claim; it never sets verified completion. `decision_recorded`
records a standalone decision that does not resolve a blocker.

Workspace initialization, migration, backup, restore, write freeze,
`source.configure` and `source.scan` are operational commands with SHA-256
checksummed receipts. They are not events inside the bundle or source operation
they describe. The receipts may be imported into History after the operation
succeeds.

An action is not part of FULL MVP until it has:

- registry entry;
- input schema;
- actor and approval policy;
- reducer;
- writer/command boundary;
- focused tests;
- projection impact;
- UI/API consumer or explicit system-only designation.

Project-state policy:

- workspace settings contain `activeProjectLimit`, default five;
- `workspace.settings_changed` is owner-only, versioned and records the reason;
- creating/activating above the limit is rejected rather than silently
  overloading the active portfolio;
- active `project.created` requires purpose, success definition, lane,
  state and one next physical action;
- paused/archived creation requires reason, review date and no active next
  action;
- `project.state_changed` supports active, blocked, paused and archived;
- direct creation/transition to `blocked` is forbidden; `blocker_created`
  atomically links the required blocker question and blocked next action;
- active requires exactly one next action;
- blocked requires one decision/unblock next action;
- pause/archive records reason and next review date;
- archive removes the project from active recommendations but not history.

Evidence policy:

- a claim declares required evidence types;
- `evidence` target payload records applicability, type, source, accessibility,
  submitter and freshness;
- `evidence.reviewed` never changes the underlying artifact;
- human self-attestation remains labelled as attestation;
- agent-originated evidence may be human-verified;
- expired evidence makes the claim stale;
- `rejected | stale -> proof_submitted` only when qualifying new evidence is
  submitted;
- every claim state transition has a policy guard and derived reason.

Agent-run review policy:

- `agent_run.reviewed` requires expected run version and eligible human actor;
- outcomes are `accepted | rejected | evidence_requested`;
- accepted means the declared run is adopted into the ledger, not that its
  result claim is verified;
- historical acceptance never changes `authorizationStatus`; only provenance
  plus a matching prior approval can derive `approved`;
- `evidence_requested` leaves the run proposed and creates the visible request;
- stale version conflicts and exact retry/changed retry semantics follow the
  common command contract.

## 8. Review Item Abstraction

The user sees one review queue. The domain keeps typed sources.

```text
ReviewItem
  id
  kind: capture | evidence | agent_claim | blocker | approval | stale_project |
        observation | source_health | evidence_request
  sourceEntityId
  projectId
  safeSummary
  provenance
  risk
  allowedActions[]
  createdAt
  reason
```

Rules:

- `safeSummary` must not expose quarantined raw content;
- allowed actions come from the action registry and actor policy;
- queue order is deterministic and explainable;
- no item disappears without a durable action or source-state change.

Observation actions:

```text
adopted_as_claim
adopted_as_evidence
adopted_as_agent_run
linked
dismissed
evidence_requested
retry_source
```

`observation.reviewed` accepts only actions valid for the item kind. A
source-health item can retry/dismiss but cannot create verified project truth.
Observation and source-health summaries follow the same quarantine and
safe-summary rules as captures.

Adoption requirements:

- `adopted_as_claim` requires human assertion, subject and required evidence
  policy; the claim begins proof-missing;
- `adopted_as_evidence` requires an existing claim/work-item subject and creates
  submitted, unverified evidence with source provenance;
- `adopted_as_agent_run` requires the human-enriched fields from J-06;
- imported text never supplies trusted identity, scope or automatic
  verification.

## 9. Today Recommendation Contract

Today returns no more than:

- one primary recommended action;
- three urgent review/decision items;
- literal total change count since the last checkpoint;
- top three changes across all verification states, each with a badge;
- separate verified-change subset count;
- three stale or at-risk projects.

Every recommendation contains:

```text
ruleId
sourceEntityId
reason
expectedOutcome
evidenceToProduce
risk
```

Priority order:

1. safety/data integrity;
2. blocking human decision;
3. missing proof for claimed completion;
4. active project without next action;
5. stale active project;
6. routine capture review.

## 10. Explicit MVP Boundary

### Included

- one private local workspace;
- safe initialization and legacy migration;
- physical-phone access through the approved private-tailnet profile;
- project portfolio and work items;
- capture, review, conversion and dismissal;
- manual evidence submission and verification;
- blocker/decision loop;
- read-only local Git observation;
- human review of proposed agent runs and source changes;
- owner-only registration of one read-only Git source;
- request-fresh Command Center, Review and Today;
- explicit action registry;
- local-only route guard;
- backup, restore and recovery drill;
- phone and desktop navigation shells;
- accessible empty/loading/success/error/conflict states;
- sanitized synthetic demo mode.

### Stretch only after every core gate passes

- read-only Codex task-artifact importer after exact artifact versions and
  allowed fields are specified;
- installable PWA shell;
- off-machine backup helper that writes to a user-selected directory.

### Excluded

- hosted deployment;
- public internet exposure or Tailscale Funnel;
- Telegram;
- GitHub OAuth/API integration;
- Claude/OpenClaw live integrations;
- multi-user collaboration;
- autonomous background agent manager;
- payments/pricing;
- D1/database migration;
- automatic evidence verification;
- automatic capture conversion;
- destructive event deletion;
- production risk acceptance.

## 11. Surface State Matrix

| State | Required presentation | Allowed action | Focus/retry | Sensitive-data rule |
|---|---|---|---|---|
| workspace unavailable | blocking recovery page; no normal dashboard | choose/create valid data home | focus recovery heading; retry after path validation | never echo unmasked absolute path in error telemetry |
| demo | persistent `DEMO` badge and reset control | explore/reset only | focus badge on first entry | synthetic data only |
| empty private workspace | onboarding plus first project/capture | create project or capture Inbox | focus primary setup action | no fixture copy by default |
| replaying | honest skeleton with `aria-busy` | none | retain trigger focus | render no stale projection as current |
| ready | mode, sequence and `as of` visible | policy-allowed actions | normal navigation | safe summaries only |
| empty Review | honest zero state plus Capture/Import path | capture or run source observation | focus zero-state heading | no synthetic queue filler |
| empty filtered result | filter summary and clear-filter action | clear/change filter | focus result heading | no fallback to unfiltered private data |
| submitting | disabled duplicate submit, progress announcement | cancel only when safe | retain control focus | no raw value in progress copy |
| success | durable event/result ID and changed projection | continue/review next | focus success heading then next action | safe summary |
| exact duplicate | explicit no-op confirmation | continue | focus status | no raw idempotency material |
| validation error | field errors plus summary | correct/resubmit | focus error summary | mask sensitive field content |
| idempotency conflict | conflict explanation; no append | reload or create new intent | focus conflict heading | never print both raw payloads |
| quarantined | masked placeholder and provenance | open Quarantine or dismiss | focus quarantine action | no raw text in normal DOM |
| write frozen | global banner and disabled writes | unfreeze through local-owner confirmation | focus freeze banner | reads remain safe |
| partial/request-stale projection | blocking partial-state banner; no green Today | retry/recover | focus banner | do not fall back to cached truth |
| migration/restore | blocking operation status and receipt | cancel only before commit point | focus operation heading | no normal writes |
| tailnet unavailable | private-phone connection guidance; no cached-green claim | retry connection or use laptop | focus connection heading | browser cache must not reveal private response |
| phone identity rejected | generic access denied; no workspace detail | sign in to expected tailnet identity | focus denial heading | GET and POST return no private content |
| Origin/CSRF rejected | safe request-rejected message | reload trusted origin/session | focus error heading | do not echo token/header values |
| phone offline before submit | offline status and retained local form draft | retry when online or discard | focus offline status | draft stays browser-local and is never logged |
| connection lost after submit | unknown-outcome message with safe retry | retry same idempotency key | focus outcome heading | retry resolves append/no-op without body disclosure |

Every PRIVATE HTML/API response uses `Cache-Control: private, no-store`; no
service worker may cache private content. Phone session is bound to exact
identity and Host, expires/rotates, and is revoked on logout or Serve disable.
After revocation, browser back/reload/offline must not reveal cached workspace
content and stale CSRF returns reload-required without mutation.

## 12. Deterministic Acceptance Fixtures

All automated journey tests use:

```text
timezone: Europe/Istanbul
frozen time: 2026-07-29T09:00:00+03:00
workspace: fixture-private-full-mvp
demo workspace: fixture-demo
owner actor: person-serj
phone viewport: 390x844
desktop viewport: 1280x800
```

Required oracles:

| ID | Given / When | Then |
|---|---|---|
| AT-J01 | absent default data home; initialize private | empty workspace manifest exists outside repo; Git tree hash unchanged |
| AT-J01-M | valid legacy fixture; migration dry-run then confirm | backup receipt, matching hashes, private target, source unchanged |
| AT-J02 | paired Tailscale identity; submit capture twice | first append succeeds; retry is no-op; post-reload capture count is one |
| AT-J02-X | missing/malformed/unexpected/shared/tagged identity on GET or POST; wrong Origin/CSRF | 403; no private response body; zero appended events |
| AT-J02-N | connection lost after capture submit | same-key retry returns original event/no-op and one projected capture |
| AT-J03 | uncategorized capture; classify then confirm typed blocker | review event then one atomic resolution event; blocker linked; capture resolved |
| AT-J03-R | resolved capture; revert | target superseded; capture reopens; history retained |
| AT-J04 | owner submits and owner-reviews commit + test output under `owner_review_allowed`; agent tries to review its own evidence; independent-person claim has no second reviewer | owner-reviewed badge is explicit; claim remains proof-missing until both required types pass; agent self-review denied; independent-person claim cannot become green; exact retry no-op, changed retry conflict |
| AT-J05 | two captures become blocker then resolving decision | first `blocker_created`; second `blocker_resolved_by_decision`; decision linked; blocker resolved; project has replacement next action |
| AT-J06 | high-risk Git observations with/without matching prior approval become proposed runs; review accepted/rejected/evidence-requested plus stale-version attempt | every disposition is durable; accepted records derive approved vs unapproved_historical correctly; acceptance leaves missing-evidence warning; stale version conflicts |
| AT-J07 | checkpoint rendered at N; normal confirm, immediate revisit, mixed-status E1-E4 and concurrent event before confirm | checkpoint appends N+1 with reviewedThrough N; immediate delta zero; E1-E4 total exactly four; concurrent confirm conflicts and skips nothing |
| AT-J08 | valid bundle and concurrent writer | restore owns shared lock; writer waits/fails safely; replay hash matches |
| AT-J09 | desktop return with one stale project and one blocker | exact counts drill to exact IDs; state context survives back navigation |
| AT-J10 | default limit five; fifth active project then sixth activation; owner changes limit | fifth produces pruning recommendation; sixth activation rejected; explicit settings change permits later activation; archived project leaves active queue |
| AT-J10-B | direct blocked project creation and generic active-to-blocked state change | both reject; only blocker_created can establish blocked state |
| AT-J11 | empty source registry; owner configures Git fixture, imports twice, then adopts observations as claim and evidence | canonical repository validates without source mutation; duplicate import no-op; claim is proof-missing; evidence is submitted/unverified with provenance |
| AT-J11-D | source renamed or missing | source-health review item; prior observations retained |
| AT-J11-X | path escape/junction, oversized output, malicious config/helper or timed-out Git | source rejected/health item; no shell/helper execution; cursor unchanged |
| AT-J12 | scanner-secret and benign owner-marked-sensitive captures; invalid/valid owner tokens; still-secret and safe redactions | manual mark leaves normal Review; invalid tokens append nothing; unsafe redaction stays quarantined; safe redaction returns as provenance-linked uncategorized copy; no raw secret enters normal DOM/logs |
| AT-ZERO | zero captures and four sanity checks | capture count renders zero, not four |
| AT-PARTIAL | one required projection throws | no normal green/Today; partial-state recovery surface appears |

Browser evidence must name viewport, input mode, start/stop timing points,
result class, focused element after completion and the post-reload projection.

Traceability:

| Outcome | Journeys | Acceptance evidence |
|---|---|---|
| know current project truth | J-07, J-09 | AT-J07, AT-J09, AT-PARTIAL |
| know what changed | J-07, J-11 | AT-J07, AT-J11, AT-J11-D |
| keep claims separate from proof | J-04, J-06 | AT-J04, AT-J06 |
| capture and resolve short-session input | J-02, J-03, J-12 | AT-J02, AT-J03, AT-J03-R, AT-J12 |
| keep blockers and decisions visible | J-05 | AT-J05 |
| choose one next physical action | J-05, J-07, J-09 | AT-J05, AT-J07, AT-J09 |
| intentionally pause/archive work | J-10 | AT-J10 |
| recover private operational memory | J-01, J-08 | AT-J01, AT-J01-M, AT-J08 |

## 13. MVP Release Gates

### G-01 — Private runtime

- normal writes never touch tracked fixtures;
- configured data home is absolute and outside the repo;
- unavailable/invalid path fails closed;
- migration has dry-run, backup, hash check and rollback instructions.

### G-02 — One request, one truth

- each rendered request loads/replays once;
- all projections use that runtime view;
- write + reload is consistent everywhere;
- literal zero remains zero.

### G-03 — Safe intake

- size/time/encoding constraints enforced;
- idempotency uses digest, not raw body;
- scan/redact happens before normal projection;
- sensitive payloads absent from logs, errors and rendered summaries.

### G-04 — Complete core loop

- J-02 through J-07 and J-09 through J-12 pass without JSON editing;
- every visible action maps to a registered command;
- conversion keeps provenance;
- evidence and verification remain separate;
- zero active projects lack a physical next action;
- at least one real allow-listed source produces idempotent observations.

### G-05 — Recovery

- complete workspace bundle;
- atomic locked restore;
- corrupted/incompatible bundle rejected;
- clean-machine recovery drill documented and passed.

### G-06 — UX

- browser QA at 390, 760, 1024, 1280 and 1440 widths;
- physical-phone QA over private tailnet HTTPS;
- no horizontal overflow;
- keyboard and focus path works;
- WCAG 2.2 AA automated and named manual checks complete;
- core phone timings meet J-02/J-03;
- no demo copy presented as live state.

### G-07 — Verification

- lint, typecheck, build and all focused tests pass;
- event/reducer/writer/command/API/UI boundaries are covered;
- security-negative tests pass;
- state/docs consistency gate passes;
- independent reviewers score product, architecture and release readiness 92+.

Reviewer scores are planning/release evidence, not a substitute for objective
tests. A reviewer cannot waive an unmet deterministic gate.

### G-08 — Release classification

Passing FULL MVP gates grants:

```text
Private Local Dogfood MVP: yes
Personal private daily-use candidate: yes, owner devices in the approved
private-tailnet profile only
Public/Internet remote-access candidate: no
Production launch candidate: no
```

## 14. Success Measurement

Technical acceptance proves the MVP exists. Product success requires a
seven-day dogfood trial:

- use on at least five of seven days;
- at least ten captures;
- at least five reviewed captures;
- at least three typed conversions;
- at least three pieces of evidence attached;
- at least one blocker resolved through a decision;
- at least two completed review checkpoints;
- at least one real Git source observed without duplicate manual entry;
- median return-to-orientation time under three minutes;
- at least 80% of active work represented;
- active-project limit reviewed and at least one keep/pause/archive decision;
- changed-since-checkpoint recall matches source truth for the observed source;
- no private-data Git leak;
- successful backup plus one restore dry-run;
- user identifies at least one next action they would otherwise have missed.

The MVP is not declared product-successful merely because tests pass.

## 15. Failure And Stop Conditions

Stop the overnight implementation goal when:

- a required private-data migration choice is ambiguous;
- real user data would be deleted or overwritten;
- a security gate would need to be weakened;
- dependency changes require a framework migration;
- current event history cannot be replayed losslessly;
- independent review finds a blocker requiring product-owner choice;
- the physical-phone Tailscale preflight is not completed;
- core verification fails after two bounded repair attempts;
- the agent would need to expand into an excluded integration.

Partial implementation must report the exact unmet gate. It must not relabel a
smaller result as FULL MVP.
