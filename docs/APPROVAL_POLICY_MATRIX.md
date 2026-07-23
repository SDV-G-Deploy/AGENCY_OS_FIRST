# Approval Policy Matrix

Status: draft v0.1  
Last updated: 2026-07-23

## Principle

Agency OS must separate three concepts:
- machine verification: a command or checker passed;
- evidence verification: proof exists and links to the claim;
- human acceptance: the owner accepts the result or risk.

An agent can produce work. It cannot silently grant itself broader authority.

## Risk Matrix

| Action | Risk | Allowed Actor | Approval Required | Evidence Required |
|---|---:|---|---|---|
| Add note or proposed update | Low | person, agent | No | event |
| Attach local evidence | Low | person, agent, system | No | source path or URL |
| Mark evidence verified | Medium | person, system verifier | Sometimes | verifier output |
| Resolve blocker | Medium | person, approved scoped agent | Yes for agent | decision event |
| Change project state | Medium | person, approved scoped agent | Yes for agent | before/after event |
| Approve agent claim | Medium | person | Yes | linked evidence |
| Grant scoped write | High | person | Always | approval record |
| Deploy or publish | High | person, approved automation | Always | deployment proof |
| Send external message | High | person, approved automation | Always | message copy or log |
| Merge code | High | person, approved automation | Always | PR/check evidence |
| Delete/archive project | High | person | Always | rationale and rollback note |
| Change permissions/secrets | High | person | Always | audit event |

## Approval Record Rules

Every approval must include:
- action type;
- entity scope;
- risk level;
- approver;
- expiration;
- whether it is single-use;
- required evidence;
- rationale.

Approvals are invalid when:
- state is not `approved`;
- expiration has passed;
- required human approval is missing;
- single-use approval was already used;
- action scope does not match;
- risk level changed after approval.

## Agent Run Linkage

Every write-capable `agentRun` should eventually include:
- `approvalIds`;
- `inputArtifactIds`;
- `outputArtifactIds`;
- `machineVerificationStatus`;
- `evidenceVerificationStatus`;
- `humanDecision`;
- `redactionStatus`.

The current v0.2 `agent-runs.json` is intentionally smaller. It is not enough
for external actions or autonomous writes.

## Human-Only Decisions

These require a person:
- granting permissions;
- accepting production security risk;
- publishing externally under the user's name;
- spending money;
- deleting data;
- lowering verification requirements.

