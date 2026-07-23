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
  assert.match(html, /<title>Agency OS - Project Portfolio Staging<\/title>/i);
  assert.match(html, /Project Portfolio Staging/);
  assert.match(html, /Evidence queue/);
  assert.match(html, /Agent run ledger/);
  assert.match(html, /Blockers/);
  assert.match(html, /State Ledger/);
  assert.match(html, /Sanity checks/);
  assert.match(html, /Recommended next steps/);
  assert.match(html, /Attach URL, commit, screenshot, file path or test result/);
  assert.match(html, /Review agent claims/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("keeps the first MVP focused on state, proof and agent runs", async () => {
  const [page, projectsData, evidenceData, ledger, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
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
  assert.match(page, /from "\.\/ledger"/);
  assert.match(layout, /Agency OS - Project Portfolio Staging/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
