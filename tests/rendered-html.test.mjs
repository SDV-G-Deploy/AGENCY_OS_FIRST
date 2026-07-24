import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Agency OS dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Agency OS - Local Solo Builder Kit<\/title>/i);
  assert.match(html, /Local Solo Builder Kit/);
  assert.match(html, /Capture first, then review/);
  assert.match(html, /Evidence queue/);
  assert.match(html, /Agent run ledger/);
  assert.match(html, /Blockers/);
  assert.match(html, /State Ledger/);
  assert.match(html, /Sanity checks/);
  assert.match(html, /Recommended next steps/);
  assert.match(html, /New next action/);
  assert.match(html, /Local-only write through the event ledger/);
  assert.match(html, /Quick capture/);
  assert.match(html, /One note or fact/);
  assert.match(html, /Note or fact/);
  assert.match(html, /Last uncategorized/);
  assert.match(html, /Local-only capture through the event ledger/);
  assert.match(html, /Review capture/);
  assert.match(html, /Mark one candidate/);
  assert.match(html, /Candidate type/);
  assert.match(html, /Mark candidate/);
  assert.match(html, /Local-only review through the event ledger/);
  assert.match(html, /Evidence attachment is planned/);
  assert.doesNotMatch(html, />Attach evidence</);
  assert.doesNotMatch(html, />Run verifier</);
  assert.match(html, /Attach URL, commit, screenshot, file path or test result/);
  assert.match(html, /Review agent claims/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("keeps the first MVP focused on state, proof and agent runs", async () => {
  const [
    page,
    route,
    captureRoute,
    captureReviewRoute,
    localEventsPath,
    captureForm,
    projectsData,
    evidenceData,
    ledger,
    layout,
    packageJson,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/local/next-action/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/local/capture-note/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/local/capture-review/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/local-events-path.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/CaptureNoteForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/projects.json", import.meta.url), "utf8"),
    readFile(new URL("../data/evidence.json", import.meta.url), "utf8"),
    readFile(new URL("../app/ledger.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(projectsData, /project-agency-os/);
  assert.match(evidenceData, /evidence-local-v0-2-verify/);
  assert.match(ledger, /export const stateLedger/);
  assert.match(ledger, /export const derivedStateLedger/);
  assert.match(ledger, /export function getReplayDerivedLedger/);
  assert.match(ledger, /export function getRuntimeStateLedger/);
  assert.match(ledger, /readFileSync\(resolveLocalEventsPath\(\), "utf8"\)/);
  assert.match(ledger, /eventsJsonl/);
  assert.doesNotMatch(ledger, /const rawEvents/);
  assert.match(ledger, /export const projects/);
  assert.match(ledger, /export const evidenceQueue/);
  assert.match(ledger, /export const agentRuns/);
  assert.match(ledger, /export const blockerQueue/);
  assert.match(ledger, /export function validateLedger/);
  assert.match(ledger, /export function getSanityChecks/);
  assert.match(ledger, /export function getRecommendedSteps/);
  assert.match(ledger, /export function getPhoneReviewQueue/);
  assert.match(ledger, /agent-claim-without-proof/);
  assert.match(ledger, /evidenceHint/);
  assert.match(page, /verificationLoad/);
  assert.match(page, /7 minute phone mode/);
  assert.match(page, /ledgerEvents/);
  assert.match(page, /phone-action-list/);
  assert.match(page, /NextActionForm/);
  assert.match(page, /CaptureNoteForm/);
  assert.match(page, /<CaptureNoteForm[\s\S]*<div className="phone-action-list">/);
  assert.match(page, /getUncategorizedCaptures/);
  assert.match(page, /getRuntimeStateLedger/);
  assert.match(page, /getReplayDerivedLedger\(getRuntimeStateLedger\(\)\)/);
  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /recentCaptures=\{uncategorizedCaptures\}/);
  assert.doesNotMatch(page, /<button/);
  assert.doesNotMatch(page, /segmented-control|secondary-action|action-row/);
  assert.match(page, /from "\.\/ledger"/);
  assert.match(route, /actorId: "person-serj"/);
  assert.match(route, /resolveLocalEventsPath\(\)/);
  assert.doesNotMatch(route, /payload\.actorId|payload\.eventsPath/);
  assert.match(captureRoute, /actorId: "person-serj"/);
  assert.match(captureRoute, /resolveLocalEventsPath\(\)/);
  assert.doesNotMatch(captureRoute, /payload\.actorId|payload\.eventsPath/);
  assert.match(captureReviewRoute, /actorId: "person-serj"/);
  assert.match(captureReviewRoute, /resolveLocalEventsPath\(\)/);
  assert.doesNotMatch(captureReviewRoute, /payload\.actorId|payload\.eventsPath/);
  assert.match(localEventsPath, /AGENCY_OS_EVENTS_PATH/);
  assert.match(localEventsPath, /resolve\(process\.cwd\(\), "data\/events\.jsonl"\)/);
  assert.match(captureForm, /fetch\("\/api\/local\/capture-note"/);
  assert.match(captureForm, /fetch\("\/api\/local\/capture-review"/);
  assert.match(captureForm, /try \{/);
  assert.match(captureForm, /catch \{/);
  assert.match(captureForm, /useState\("phone"\)/);
  assert.match(captureForm, /<option value="inbox">Inbox<\/option>/);
  assert.match(captureForm, /candidateOptions/);
  assert.match(captureForm, /evidence_candidate/);
  assert.match(captureForm, /blocker_candidate/);
  assert.match(captureForm, /decision_candidate/);
  assert.match(captureForm, /next_action_candidate/);
  assert.match(captureForm, /reviewedCaptureIds/);
  assert.match(captureForm, /reviewSuccessStorageKey/);
  assert.match(captureForm, /window\.sessionStorage\.setItem\(reviewSuccessStorageKey/);
  assert.match(captureForm, /window\.sessionStorage\.getItem\(reviewSuccessStorageKey\)/);
  assert.match(captureForm, /reviewRefreshDelayMs = 2000/);
  assert.match(captureForm, /Derived state refreshed/);
  assert.match(captureForm, /window\.location\.reload/);
  assert.match(captureForm, /className="capture-note-fields"/);
  assert.match(captureForm, /className="capture-review-form"/);
  assert.match(captureForm, /recentCaptures\.filter/);
  assert.match(captureForm, /visibleCaptures\.map/);
  assert.doesNotMatch(captureForm, /telegram|github|openc-law|openclaw/i);
  assert.match(layout, /Agency OS - Local Solo Builder Kit/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
