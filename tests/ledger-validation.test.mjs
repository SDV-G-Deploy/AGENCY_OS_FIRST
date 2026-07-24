import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadLedger } from "./ledger-test-helpers.mjs";

test("sanity checks find stale evidence and unproven agent claims", async () => {
  const { getSanityChecks } = await loadLedger();
  const checks = getSanityChecks();
  const ids = checks.map((check) => check.id);

  assert.ok(ids.includes("stale-evidence-project-ai1geo"));
  assert.ok(ids.includes("stale-evidence-project-lab-slot"));
  assert.ok(ids.includes("agent-claim-without-proof-agent-run-codex-v0-2"));
});

test("recommended steps are bounded and evidence-oriented", async () => {
  const { getRecommendedSteps } = await loadLedger();
  const steps = getRecommendedSteps();

  assert.ok(steps.length > 0);
  assert.ok(steps.length <= 4);
  assert.ok(steps.every((step) => step.evidenceTarget));
  assert.ok(steps.some((step) => step.action.startsWith("Attach proof")));
});

test("phone review queue exposes short-session review cards", async () => {
  const { getPhoneReviewQueue } = await loadLedger();
  const queue = getPhoneReviewQueue();
  const types = queue.map((item) => item.type);

  assert.deepEqual(types, ["verify", "unblock", "approve", "capture"]);
  assert.ok(queue.every((item) => item.target));
  assert.ok(queue.every((item) => item.evidenceHint));
  assert.ok(queue.every((item) => typeof item.count === "number"));
});

test("ledger events are loaded from the jsonl source", async () => {
  const { parseLedgerEvents, stateLedger } = await loadLedger();
  const eventsSource = await readFile(new URL("../data/events.jsonl", import.meta.url), "utf8");
  const parsedEvents = parseLedgerEvents(eventsSource);

  assert.deepEqual(stateLedger.events, parsedEvents);
});

test("event log validator accepts the current jsonl envelope and hash chain", async () => {
  const { stateLedger, validateEventLog } = await loadLedger();

  assert.deepEqual(
    validateEventLog(stateLedger.events, {
      evidenceIds: new Set(stateLedger.evidence.map((item) => item.id)),
      approvalIds: new Set(stateLedger.approvals.map((item) => item.id)),
      traceIds: new Set(stateLedger.traces.map((item) => item.id)),
    }),
    [],
  );
});

test("event log validator rejects a broken hash chain", async () => {
  const { calculateEventHash, stateLedger, validateEventLog } = await loadLedger();
  const brokenEvent = {
    ...stateLedger.events[1],
    previousEventHash: "fnv1a32:broken",
  };
  brokenEvent.eventHash = calculateEventHash(brokenEvent);

  const errors = validateEventLog([stateLedger.events[0], brokenEvent]);

  assert.ok(errors.some((error) => error.includes("broken previous hash")));
});

test("event log validator rejects duplicate sequence numbers", async () => {
  const { stateLedger, validateEventLog } = await loadLedger();
  const duplicateSequence = {
    ...stateLedger.events[1],
    sequence: stateLedger.events[0].sequence,
  };

  const errors = validateEventLog([stateLedger.events[0], duplicateSequence]);

  assert.ok(errors.some((error) => error.includes("duplicate event sequence")));
});

test("event log validator rejects missing redaction status", async () => {
  const { stateLedger, validateEventLog } = await loadLedger();
  const { redactionStatus, ...missingRedaction } = stateLedger.events[0];
  assert.equal(redactionStatus, "not_required");

  const errors = validateEventLog([missingRedaction]);

  assert.ok(errors.some((error) => error.includes("missing redaction status")));
});

test("event log validator rejects unknown approval references", async () => {
  const { calculateEventHash, stateLedger, validateEventLog } = await loadLedger();
  const approvalLinkedEvent = {
    ...stateLedger.events[0],
    approvalIds: ["approval-does-not-exist"],
  };
  approvalLinkedEvent.eventHash = calculateEventHash(approvalLinkedEvent);

  const errors = validateEventLog([approvalLinkedEvent], {
    approvalIds: new Set(stateLedger.approvals.map((item) => item.id)),
  });

  assert.ok(errors.some((error) => error.includes("unknown approval")));
});

test("ledger validation accepts the current local data skeleton", async () => {
  const { validateLedger } = await loadLedger();

  assert.deepEqual(validateLedger(), []);
});

test("ledger validation rejects duplicate event idempotency keys", async () => {
  const { stateLedger, validateLedger } = await loadLedger();
  const duplicatedEvent = {
    ...stateLedger.events[0],
    id: "event-duplicate-idempotency-test",
  };

  const errors = validateLedger({
    ...stateLedger,
    events: [...stateLedger.events, duplicatedEvent],
  });

  assert.ok(errors.some((error) => error.includes("duplicate idempotency key")));
});

test("ledger validation rejects inbox as a capture candidate type", async () => {
  const { stateLedger, validateLedger } = await loadLedger();
  const capture = {
    id: "capture-invalid-candidate-type",
    projectId: "inbox",
    actorId: "person-serj",
    source: "phone",
    body: "Candidate type must not accept inbox.",
    createdAt: "2026-07-24T09:00:00Z",
    receivedAt: "2026-07-24T09:00:01Z",
    redactionStatus: "no_secrets_detected",
    classification: "evidence_candidate",
    candidateType: "inbox",
    reviewedAt: "2026-07-24T09:01:00Z",
    linkedEntityIds: [],
    reviewStatus: "triaged",
  };

  const errors = validateLedger({
    ...stateLedger,
    captures: [...stateLedger.captures, capture],
  });

  assert.ok(
    errors.some((error) =>
      error.includes("capture capture-invalid-candidate-type has invalid candidate type inbox"),
    ),
  );
});

test("agent-submitted evidence cannot be self-verified by the same agent", async () => {
  const { stateLedger, validateLedger } = await loadLedger();
  const evidence = stateLedger.evidence.map((item) =>
    item.id === "evidence-local-v0-2-verify"
      ? { ...item, verifiedBy: "agent-codex" }
      : item,
  );

  const errors = validateLedger({ ...stateLedger, evidence });

  assert.ok(errors.some((error) => error.includes("self-verified by agent")));
});

test("custom ledger validation does not look at default module state", async () => {
  const { stateLedger, validateLedger } = await loadLedger();
  const evidence = stateLedger.evidence.map((item) =>
    item.id === "evidence-local-v0-2-verify"
      ? { ...item, id: "evidence-renamed-for-isolation-test" }
      : item,
  );

  const errors = validateLedger({
    ...stateLedger,
    evidence,
  });

  assert.ok(
    errors.some((error) =>
      error.includes("references unknown evidence evidence-local-v0-2-verify"),
    ),
  );
});

test("verified claims require every declared verified evidence type", async () => {
  const { stateLedger, validateLedger } = await loadLedger();
  const claims = stateLedger.claims.map((claim) =>
    claim.id === "claim-v0-2-local-verify"
      ? { ...claim, linkedEvidenceIds: ["evidence-local-v0-2-verify"] }
      : claim,
  );

  const errors = validateLedger({
    ...stateLedger,
    claims,
  });

  assert.ok(
    errors.some((error) =>
      error.includes("claim claim-v0-2-local-verify missing verified evidence type local_url"),
    ),
  );
});

test("external actions fail closed without a live approval", async () => {
  const { canRunExternalAction, stateLedger } = await loadLedger();

  assert.equal(canRunExternalAction(null), false);
  assert.equal(canRunExternalAction("approval-missing"), false);
  assert.equal(
    canRunExternalAction("approval-first-scoped-write", stateLedger.approvals),
    false,
  );
  assert.equal(
    canRunExternalAction(
      "approval-first-scoped-write",
      [
        {
          ...stateLedger.approvals[0],
          state: "approved",
          expiresAt: "2026-07-22T00:00:00Z",
        },
      ],
      new Date("2026-07-23T00:00:00Z"),
    ),
    false,
  );
  assert.equal(
    canRunExternalAction(
      "approval-first-scoped-write",
      [
        {
          ...stateLedger.approvals[0],
          state: "approved",
          expiresAt: "2026-07-24T00:00:00Z",
        },
      ],
      new Date("2026-07-23T00:00:00Z"),
    ),
    true,
  );
});
