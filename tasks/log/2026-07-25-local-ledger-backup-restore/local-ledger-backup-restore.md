# Local Ledger Backup/Restore

Date: 2026-07-25

Branch:
- `feature/local-ledger-backup-restore`

Commit:
- current branch commit; run `git log -1 --oneline` for the exact hash.

Worktree:
- `C:\Agency_os_first\worktrees\local-ledger-backup-restore`

## Summary

This branch adds a minimal local backup/export/restore path for
`data/events.jsonl`.

The implementation is intentionally script-level and local-first:
- `npm run ledger:backup` creates a timestamped backup bundle;
- `npm run ledger:restore -- <backup-dir-or-metadata.json>` validates and
  restores a bundle;
- `--dry-run` validates a restore candidate without writing;
- real restore writes a safety backup of the current target ledger before
  replacing anything.

No UI, hosted storage, auth, deployment or product scope expansion was added.

## Backup Artifact Format

Each backup bundle contains:
- `events.jsonl`: byte-for-byte copy of the source event log;
- `metadata.json`: schema version, artifact type, creation time, source path,
  source SHA-256 hash, event count and event log filename.

Default output root:
- `backups/ledger/`

Evidence backup output for this branch:
- `tasks/log/2026-07-25-local-ledger-backup-restore/cli-backups/`

## Restore Safety

Restore fails closed when:
- metadata is missing or malformed;
- JSONL parsing fails;
- source SHA-256 does not match metadata;
- event count does not match metadata;
- event sequence is duplicated or out of order;
- event hash or previous-event hash chain is broken.

Before a real restore, the current target ledger is copied to a timestamped
safety bundle.

## Evidence

Focused test:
- `node-test-ledger-backup-restore.log`: 8 tests passed.

Final verification:
- `git diff --check`: pass, with Windows line-ending warnings only.
- `npm run verify`: pass, including lint, typecheck, build and 74 tests.
- `npm run smoke:local-dev-api`: pass against a temporary event log.
- `npm run audit:prod`: fail on the known Next transitive `postcss`/`sharp`
  advisories; production Launch Candidate remains blocked.

CLI checks:
- `npm-run-ledger-backup.log`: backup created with 3 events.
- `npm-run-ledger-restore-dry-run.log`: dry-run restore passed against the
  canonical target path without writing.
- `npm-run-ledger-restore-temp-copy.log`: real restore succeeded against a
  temporary event log only.
- `restore-temp-copy-hash-check.log`: restored temp log hash matched canonical
  backup source hash.

Canonical ledger hash before and after backup/restore command checks:

```text
E4DB925895E9F085112439482882D8E32E1079A0D672B44422D884431F625D10
```

## Verdict

Local Daily-Use Candidate:
- yes after coordinator review and merge of this branch.

Limitations:
- manual local backup/restore only;
- no scheduled backup;
- no off-machine copy automation;
- no hosted storage or multi-device sync;
- no auth;
- event hashes are deterministic local tamper-evidence checks, not
  cryptographic signatures.

Production Launch Candidate:
- no.

Reason:
- `npm run audit:prod` remains blocked by known Next transitive advisories;
- hosted storage and auth choices remain unresolved;
- this branch does not deploy or attempt production dependency fixes.
