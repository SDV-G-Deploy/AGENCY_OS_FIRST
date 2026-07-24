import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  loadLocalApiRoute,
  loadLocalCaptureApiRoute,
  loadLocalCaptureReviewApiRoute,
  loadLocalCommand,
} from "./ledger-test-helpers.mjs";

test("local command writes a human next action and confirms derived state", async () => {
  const { command, eventsPath, ledger } = await loadLocalCommand();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await command.runProjectNextActionCommand({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    nextAction: "Command layer confirmed replay-derived state.",
    idempotencyKey: "test-command-human-next-action",
    timestamp: "2026-07-23T11:00:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.ok, true);
  assert.equal(result.appended, true);
  assert.equal(result.projectNextAction, "Command layer confirmed replay-derived state.");
  assert.equal(afterEvents.length, beforeEvents.length + 1);
});

test("local command rejects agent actors before writer execution", async () => {
  const { command, eventsPath, ledger } = await loadLocalCommand();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await command.runProjectNextActionCommand({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "agent-codex",
    projectId: "project-agency-os",
    nextAction: "Agent should not use human-only command.",
    idempotencyKey: "test-command-agent-blocked",
    timestamp: "2026-07-23T11:00:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("human-only")));
  assert.equal(afterEvents.length, beforeEvents.length);
});

test("local command rejects invalid input before writer execution", async () => {
  const { command, eventsPath, ledger } = await loadLocalCommand();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await command.runProjectNextActionCommand({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    nextAction: " ",
    idempotencyKey: "test-command-invalid",
    timestamp: "not-a-date",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("nextAction is required")));
  assert.ok(result.errors.some((error) => error.includes("timestamp must be a valid date")));
  assert.equal(afterEvents.length, beforeEvents.length);
});

test("local command writes a human capture note and confirms derived state", async () => {
  const { command, eventsPath, ledger } = await loadLocalCommand();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await command.runCaptureNoteCommand({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "Command layer confirmed a quarantined capture.",
    source: "phone",
    idempotencyKey: "test-command-human-capture-note",
    createdAt: "2026-07-23T12:04:00Z",
    receivedAt: "2026-07-23T12:04:02Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const captureEvent = afterEvents.find(
    (event) => event.idempotencyKey === "test-command-human-capture-note",
  );

  assert.equal(result.ok, true);
  assert.equal(result.appended, true);
  assert.equal(result.captureId, captureEvent.entityId);
  assert.equal(result.reviewStatus, "uncategorized");
  assert.equal(captureEvent.source, "local_command");
  assert.equal(captureEvent.after.source, "phone");
  assert.equal(afterEvents.length, beforeEvents.length + 1);
});

test("local command rejects agent capture actors before writer execution", async () => {
  const { command, eventsPath, ledger } = await loadLocalCommand();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await command.runCaptureNoteCommand({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "agent-codex",
    projectId: "project-agency-os",
    body: "Agent should not use human-only capture command.",
    source: "phone",
    idempotencyKey: "test-command-agent-capture-blocked",
    createdAt: "2026-07-23T12:05:00Z",
    receivedAt: "2026-07-23T12:05:01Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("human-only")));
  assert.equal(afterEvents.length, beforeEvents.length);
});

test("local command writes a human capture review and confirms derived state", async () => {
  const { command, eventsPath, ledger, writer } = await loadLocalCommand();
  const note = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "Command layer can triage this quarantined capture.",
    source: "phone",
    idempotencyKey: "test-command-review-note",
    createdAt: "2026-07-23T12:11:00Z",
    receivedAt: "2026-07-23T12:11:01Z",
  });
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await command.runCaptureReviewMarkedCommand({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    captureId: note.event.entityId,
    candidateType: "blocker_candidate",
    idempotencyKey: "test-command-human-capture-review",
    reviewedAt: "2026-07-23T12:12:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const reviewEvent = afterEvents.find(
    (event) => event.idempotencyKey === "test-command-human-capture-review",
  );

  assert.equal(result.ok, true);
  assert.equal(result.appended, true);
  assert.equal(result.captureId, note.event.entityId);
  assert.equal(result.reviewStatus, "triaged");
  assert.equal(result.candidateType, "blocker_candidate");
  assert.equal(reviewEvent.source, "local_command");
  assert.equal(reviewEvent.redactionStatus, "not_required");
  assert.equal(afterEvents.length, beforeEvents.length + 1);
});

test("local command treats an exact capture review retry as a confirmed no-op", async () => {
  const { command, eventsPath, ledger, writer } = await loadLocalCommand();
  const note = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "Command retry should confirm this already triaged capture.",
    source: "phone",
    idempotencyKey: "test-command-review-retry-note",
    createdAt: "2026-07-23T12:12:10Z",
    receivedAt: "2026-07-23T12:12:11Z",
  });
  const input = {
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    captureId: note.event.entityId,
    candidateType: "evidence_candidate",
    idempotencyKey: "test-command-capture-review-exact-retry",
    reviewedAt: "2026-07-23T12:12:20Z",
  };

  const first = await command.runCaptureReviewMarkedCommand(input);
  const beforeRetryEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const second = await command.runCaptureReviewMarkedCommand(input);
  const afterRetryEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(first.ok, true);
  assert.equal(first.appended, true);
  assert.equal(second.ok, true);
  assert.equal(second.appended, false);
  assert.equal(second.eventId, first.eventId);
  assert.equal(second.reviewStatus, "triaged");
  assert.equal(second.candidateType, "evidence_candidate");
  assert.equal(afterRetryEvents.length, beforeRetryEvents.length);
});

test("local command rejects agent capture review actors before writer execution", async () => {
  const { command, eventsPath, ledger, writer } = await loadLocalCommand();
  const note = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "Agent should not be able to review this capture.",
    source: "phone",
    idempotencyKey: "test-command-review-agent-note",
    createdAt: "2026-07-23T12:13:00Z",
    receivedAt: "2026-07-23T12:13:01Z",
  });
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await command.runCaptureReviewMarkedCommand({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "agent-codex",
    captureId: note.event.entityId,
    candidateType: "evidence_candidate",
    idempotencyKey: "test-command-agent-capture-review-blocked",
    reviewedAt: "2026-07-23T12:14:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("human-only")));
  assert.equal(afterEvents.length, beforeEvents.length);
});

test("local command rejects blocked sensitive capture review before writer execution", async () => {
  const { command, eventsPath, ledger, writer } = await loadLocalCommand();
  const note = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "Sensitive raw text should be blocked from normal capture review.",
    source: "phone",
    idempotencyKey: "test-command-review-sensitive-note",
    createdAt: "2026-07-23T12:15:00Z",
    receivedAt: "2026-07-23T12:15:01Z",
    redactionStatus: "blocked_sensitive",
  });
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await command.runCaptureReviewMarkedCommand({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    captureId: note.event.entityId,
    candidateType: "decision_candidate",
    idempotencyKey: "test-command-sensitive-capture-review-blocked",
    reviewedAt: "2026-07-23T12:16:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("blocked sensitive")));
  assert.equal(afterEvents.length, beforeEvents.length);
});

test("local API route writes through the canonical temp event ledger", async () => {
  const { eventsPath, ledger, moduleDir, route } = await loadLocalApiRoute();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const previousCwd = process.cwd();

  try {
    process.chdir(moduleDir);
    const response = await route.POST(
      new Request("http://localhost/api/local/next-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: "project-agency-os",
          nextAction: "API route confirms the browser write surface.",
        }),
      }),
    );
    const body = await response.json();
    const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
    const derived = ledger.getReplayDerivedLedger({
      ...ledger.stateLedger,
      events: afterEvents,
    });
    const project = derived.ledger.projects.find((item) => item.id === "project-agency-os");

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.appended, true);
    assert.equal(afterEvents.length, beforeEvents.length + 1);
    assert.equal(afterEvents.at(-1).actorId, "person-serj");
    assert.equal(afterEvents.at(-1).source, "local_command");
    assert.equal(project.nextAction, "API route confirms the browser write surface.");
  } finally {
    process.chdir(previousCwd);
  }
});

test("local capture API route writes through the canonical temp event ledger", async () => {
  const { eventsPath, ledger, moduleDir, route } = await loadLocalCaptureApiRoute();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const previousCwd = process.cwd();

  try {
    process.chdir(moduleDir);
    const response = await route.POST(
      new Request("http://localhost/api/local/capture-note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: "inbox",
          body: "API route confirms the local capture write surface.",
          source: "phone",
          createdAt: "2026-07-23T12:06:00Z",
          idempotencyKey: "test-api-capture-note",
        }),
      }),
    );
    const body = await response.json();
    const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
    const captureEvent = afterEvents.find(
      (event) => event.idempotencyKey === "test-api-capture-note",
    );
    const derived = ledger.getReplayDerivedLedger({
      ...ledger.stateLedger,
      events: afterEvents,
    });
    const capture = derived.ledger.captures.find((item) => item.id === body.captureId);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.appended, true);
    assert.equal(afterEvents.length, beforeEvents.length + 1);
    assert.equal(captureEvent.actorId, "person-serj");
    assert.equal(captureEvent.source, "local_command");
    assert.equal(captureEvent.after.source, "phone");
    assert.equal(captureEvent.redactionStatus, "pending_scan");
    assert.equal(capture.projectId, "inbox");
    assert.equal(capture.reviewStatus, "uncategorized");
  } finally {
    process.chdir(previousCwd);
  }
});

test("local capture review API route writes through the canonical temp event ledger", async () => {
  const { eventsPath, ledger, moduleDir, route, writer } = await loadLocalCaptureReviewApiRoute();
  const note = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "inbox",
    body: "API route can triage this local capture without conversion.",
    source: "phone",
    idempotencyKey: "test-api-capture-review-note",
    createdAt: "2026-07-23T12:17:00Z",
    receivedAt: "2026-07-23T12:17:01Z",
  });
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const previousCwd = process.cwd();

  try {
    process.chdir(moduleDir);
    const response = await route.POST(
      new Request("http://localhost/api/local/capture-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          captureId: note.event.entityId,
          candidateType: "next_action_candidate",
          reviewedAt: "2026-07-23T12:18:00Z",
          idempotencyKey: "test-api-capture-review",
        }),
      }),
    );
    const body = await response.json();
    const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
    const reviewEvent = afterEvents.find(
      (event) => event.idempotencyKey === "test-api-capture-review",
    );
    const derived = ledger.getReplayDerivedLedger({
      ...ledger.stateLedger,
      events: afterEvents,
    });
    const capture = derived.ledger.captures.find((item) => item.id === body.captureId);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.appended, true);
    assert.equal(afterEvents.length, beforeEvents.length + 1);
    assert.equal(reviewEvent.actorId, "person-serj");
    assert.equal(reviewEvent.source, "local_command");
    assert.equal(reviewEvent.action, "capture.review_marked");
    assert.equal(reviewEvent.after.candidateType, "next_action_candidate");
    assert.equal(capture.classification, "next_action_candidate");
    assert.equal(capture.reviewStatus, "triaged");
    assert.deepEqual(capture.linkedEntityIds, []);

    const retryResponse = await route.POST(
      new Request("http://localhost/api/local/capture-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          captureId: note.event.entityId,
          candidateType: "next_action_candidate",
          reviewedAt: "2026-07-23T12:18:00Z",
          idempotencyKey: "test-api-capture-review",
        }),
      }),
    );
    const retryBody = await retryResponse.json();
    const afterRetryEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

    assert.equal(retryResponse.status, 200);
    assert.equal(retryBody.ok, true);
    assert.equal(retryBody.appended, false);
    assert.equal(retryBody.eventId, body.eventId);
    assert.equal(afterRetryEvents.length, afterEvents.length);
  } finally {
    process.chdir(previousCwd);
  }
});
