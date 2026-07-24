# Capture Review UI QA Evidence

Date: 2026-07-24

Branch:
- `feature/capture-review-ui-qa`

Server:
- `http://localhost:5176/`
- Served from the QA worktree using a temporary ignored `node_modules`
  junction to the canonical local install.

Scope:
- Phone-mode panel only.
- Quick capture form.
- Capture review form for `capture.review_marked`.
- Last uncategorized captures list.

Artifacts:
- `tasks/log/2026-07-24-capture-review-ui-qa/capture-review-ui-mobile-panel-390w.png`
- `tasks/log/2026-07-24-capture-review-ui-qa/capture-review-ui-desktop-panel-1280w.png`
- `tasks/log/2026-07-24-capture-review-ui-qa/capture-review-ui-qa-report.json`

Observed Result:
- Mobile width `390px`: quick capture form, capture review form and
  uncategorized list render in order without overlap or horizontal overflow.
- Desktop width `1280px`: quick capture form, capture review form and
  uncategorized list render in the narrow sidebar without overlap or horizontal
  overflow.
- Current replay-derived state has no uncategorized capture summaries, so the
  capture review select renders the empty state `No captures`.

Fix Made During QA:
- The desktop sidebar exposed a visual clipping bug in the quick-capture field
  row.
- `app/globals.css` now stacks the project/source controls by default and uses
  the compact two-column row only after the dashboard collapses to the wider
  responsive sidebar layout.
- `app/CaptureNoteForm.tsx` shortens the empty review select label from
  `No uncategorized captures` to `No captures` so it fits the narrow desktop
  sidebar.

Verification:
- Browser geometry report passed:
  - required text present;
  - no pairwise overlap between quick capture, review form and list;
  - no horizontal panel overflow.
