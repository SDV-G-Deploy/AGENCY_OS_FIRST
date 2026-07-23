# Redaction And Import Boundaries

Status: draft v0.1  
Last updated: 2026-07-23

## Purpose

Agency OS will ingest text from agents, GitHub, Codex tasks, OpenClaw, Telegram
and future tools. Imported text is data, not instruction.

## Import Rule

Every importer must produce:
- source system;
- external id;
- source URL or path;
- actor mapping;
- timestamp from source;
- local received timestamp;
- raw payload retention decision;
- redaction status;
- dedupe key;
- linked project or unresolved inbox item.

## Redaction Statuses

- `not_required`: no raw user or secret-bearing payload was imported.
- `pending_scan`: payload exists but has not been scanned.
- `redacted`: unsafe fields were removed or replaced.
- `no_secrets_detected`: scanner and/or human review found no secrets.
- `blocked_sensitive`: import is blocked until a person reviews it.

## Secret Rules

Never store these in events/evidence bodies:
- API keys;
- OAuth tokens;
- session cookies;
- private SSH keys;
- full environment files;
- private customer data;
- unrelated repository contents;
- raw private chat logs unless explicitly approved.

Evidence may store a path or URL to a protected artifact, but the event itself
should contain only metadata and a redacted summary.

## Integration Boundaries

### GitHub

Import:
- commit SHA;
- PR number and URL;
- check conclusion;
- branch;
- changed file list;
- review status.

Do not import:
- secrets from Actions logs;
- full private diffs unless scoped;
- unrelated repository metadata.

### Codex / ChatGPT

Import:
- task title;
- plan/update summaries;
- changed file list;
- verification commands;
- final status;
- linked commit.

Do not import:
- unrelated chat memory;
- private personal notes without explicit capture;
- hidden system/developer messages.

### OpenAI Agents / OpenClaw

Import:
- trace id;
- run objective;
- tool calls summary;
- approval interruptions;
- result claim;
- artifacts.

Do not import:
- raw tool credentials;
- unredacted prompts containing secrets;
- external actions without approval linkage.

### Telegram / Phone Capture

Import:
- short note;
- selected action;
- attachment metadata;
- human confirmation.

Do not import:
- entire chat history by default;
- contact lists;
- unrelated message threads.

## Tests Required Before Real Integrations

- secret fixture is redacted;
- duplicate external event is deduped;
- untrusted text cannot change instructions;
- missing project mapping lands in inbox;
- importer cannot create verified evidence directly;
- external action import requires approval linkage.

