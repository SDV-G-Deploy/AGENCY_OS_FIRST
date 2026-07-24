# Capture Review Success Browser QA

Date: 2026-07-25

Branch: `feature/capture-review-success-browser-qa`

Worktree: `C:\Agency_os_first\worktrees\capture-review-success-browser-qa`

Result: pass after one narrow refresh-read fix.

## Scope

- Verified the capture review success confirmation is visibly observable before the delayed reload.
- Verified the one-shot refreshed success confirmation is visibly observable after reload.
- Verified the reviewed capture disappears from the uncategorized review list after replay-derived refresh.
- Used a temporary ledger copy and kept canonical `data/events.jsonl` unchanged.

## Browser Setup

- Browser: Codex in-app browser.
- URL: `http://localhost:5181/`.
- Viewport: 390 x 844.
- Temporary event log:
  `C:\Users\SerjSerjSerj\AppData\Local\Temp\agency-os-capture-review-success-browser-qa-visible-bafd3e399ffb478f8d1765e468a38d70\events.jsonl`.

## Evidence

- Pre-review state:
  `tasks/log/2026-07-25-capture-review-success-browser-qa/pre-review-state-mobile-390w.png`.
- Success visible before delayed reload:
  `tasks/log/2026-07-25-capture-review-success-browser-qa/success-before-delayed-reload-mobile-390w.png`.
- Refreshed success visible after reload:
  `tasks/log/2026-07-25-capture-review-success-browser-qa/refreshed-success-after-reload-mobile-390w.png`.
- Reviewed item removed from uncategorized list:
  `tasks/log/2026-07-25-capture-review-success-browser-qa/reviewed-item-removed-after-refresh-mobile-390w.png`.
- Machine-readable report:
  `tasks/log/2026-07-25-capture-review-success-browser-qa/capture-review-success-browser-qa-report.json`.

## Assertions

- Pre-review state showed one uncategorized capture as `Inbox: Pending scan`.
- Before the delayed reload, the review form showed:
  `Marked for follow-up. Refreshing derived state soon.`
- After reload, the review form showed:
  `Marked for follow-up. Derived state refreshed.`
- After reload, the capture select showed `No captures`.
- After reload, the uncategorized list showed:
  `No uncategorized captures yet.`
- Canonical ledger SHA-256 before and after QA:
  `E4DB925895E9F085112439482882D8E32E1079A0D672B44422D884431F625D10`.

## Narrow Fix

Initial QA found that the review event was appended to the temp ledger, but the
page could still render stale replay input after reload because `app/ledger.ts`
held the event log through the raw import path. The fix keeps the change narrow:
the server-rendered phone review data now reads the current local event log
through the existing events path resolver during render, then derives the phone
review queue from that runtime ledger.
