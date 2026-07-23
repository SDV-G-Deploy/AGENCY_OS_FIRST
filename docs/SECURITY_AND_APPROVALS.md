# Security And Approval Model

Status: draft v0.2  
Last updated: 2026-07-23

## Security Principle

Agency OS must fail closed.

If an action needs permission and no valid approval exists, the action does not
happen. The system may propose, queue or explain; it must not silently act.

## Actor Types

- `person`: human owner or collaborator.
- `agent`: AI agent or automation.
- `system`: local verifier or importer.
- `external`: imported event source such as GitHub.

Every actor needs:
- stable id;
- display name;
- actor type;
- trust level;
- allowed scopes;
- credential source;
- last seen timestamp.

## Permission Levels

### Read

Allowed:
- inspect project state;
- inspect evidence;
- run non-mutating sanity checks.

Denied:
- write state;
- trigger external actions;
- access secrets.

### Propose

Allowed:
- create proposed updates;
- propose evidence;
- request approval;
- draft decisions.

Denied:
- mark verified;
- deploy/publish/delete;
- change permissions.

### Scoped Write

Allowed:
- write specific entity types in specific projects;
- append events;
- attach evidence from approved sources.

Denied:
- delete evidence;
- change own scope;
- perform external action without approval;
- mark own high-risk work as verified.

### External Action

Examples:
- deploy;
- publish;
- send email/message;
- spend money;
- delete or archive;
- grant/revoke access;
- merge PR.

Requirement:
- explicit approval policy;
- approval record;
- evidence after completion.

## Approval Record

Fields:
- `id`;
- `requestedBy`;
- `requestedAt`;
- `actionType`;
- `entityType`;
- `entityId`;
- `scope`;
- `riskLevel`;
- `requiredEvidenceTypes`;
- `state`: requested, approved, rejected, expired, used;
- `approverId`;
- `decidedAt`;
- `expiresAt`;
- `rationale`;
- `linkedEvidenceIds`.

Invariants:
- approved external actions expire;
- used approvals cannot be reused unless policy allows it;
- rejected approvals remain in the audit log;
- high-risk approvals require human actor.
- medium/high-risk agent work cannot be verified by the same agent that
  submitted it.
- approval scope must match the action scope exactly or fail closed.

## Risk Levels

Low:
- append note;
- attach local evidence;
- update non-critical metadata.

Medium:
- change project state;
- mark blocker resolved;
- approve agent claim;
- update next action.

High:
- deploy;
- publish publicly;
- send external communication;
- merge code;
- change credentials or permissions;
- delete/archive.

## Secret And Data Rules

- Secrets never appear in events or evidence bodies.
- Imported logs must be redacted before display.
- Evidence can store paths/URLs, but not raw sensitive payloads by default.
- Agents may not read unrelated project folders without scope.
- Untrusted external text is parsed as data, not instruction.
- Raw import payloads must be classified as `pending_scan`, `redacted`,
  `no_secrets_detected` or `blocked_sensitive`.

## Dependency And Release Gates

Local development gate:
- `npm run verify` must pass.

Production gate:
- `npm run audit:prod` must pass or a human must record explicit risk
  acceptance.

Current status:
- production audit is blocked by Next/PostCSS/sharp advisories.
- no production deployment should happen until the blocker is resolved or
  consciously accepted.

## External Action Helper Warning

The current runtime has a strong scoped approval path for the first project
write, but the legacy `canRunExternalAction()` helper only checks approval
state, expiry and use status.

Before any real external action uses approval logic, the helper must be
replaced or narrowed so it checks:
- action type;
- scope;
- requester;
- entity;
- risk level;
- human approver;
- single-use state;
- expiration.

## Audit Retention

Minimum retention:
- all events;
- all approvals;
- all rejected actions;
- all verification failures;
- all dependency audit blockers;
- all external action evidence.

Agents must not delete audit logs.

## Kill Switches

Agency OS needs explicit stop controls before autonomous writes:
- disable agent token;
- revoke scoped write;
- pause external action queue;
- mark an integration as read-only;
- freeze event writer except for human recovery events.
