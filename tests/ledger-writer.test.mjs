import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import test from "node:test";

import {
  appendTestEvent,
  loadLedgerWithWriter,
  makeApprovalApprovedEvent,
} from "./ledger-test-helpers.mjs";

test("writer appends a human project next-action event after preflight replay", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const beforeSource = await readFile(eventsPath, "utf8");
  const beforeEvents = ledger.parseLedgerEvents(beforeSource);

  const result = await writer.appendProjectNextActionEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    nextAction: "Use the writer output as local proof.",
    idempotencyKey: "test-writer-human-next-action",
    timestamp: "2026-07-23T10:00:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.appended, true);
  assert.deepEqual(result.errors, []);
  assert.equal(afterEvents.length, beforeEvents.length + 1);
  assert.equal(afterEvents.at(-1).sequence, beforeEvents.length + 1);
  assert.equal(afterEvents.at(-1).previousEventHash, beforeEvents.at(-1).eventHash);
  assert.equal(afterEvents.at(-1).eventHash, ledger.calculateEventHash(afterEvents.at(-1)));
});

test("writer rejects an existing idempotency key with different payload", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await writer.appendProjectNextActionEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    nextAction: "This should not append.",
    idempotencyKey: "2026-07-23-honesty-closure",
    timestamp: "2026-07-23T10:00:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.appended, false);
  assert.ok(result.errors.some((error) => error.includes("idempotency conflict")));
  assert.deepEqual(result.ignoredEventIds, []);
  assert.equal(afterEvents.length, beforeEvents.length);
});

test("writer treats an exact retry idempotency key as a no-op", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const input = {
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    nextAction: "Retry should not append twice.",
    idempotencyKey: "test-writer-exact-retry",
    timestamp: "2026-07-23T10:00:00Z",
  };

  const first = await writer.appendProjectNextActionEvent(input);
  const second = await writer.appendProjectNextActionEvent(input);
  const events = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(first.appended, true);
  assert.equal(second.appended, false);
  assert.deepEqual(second.errors, []);
  assert.deepEqual(second.ignoredEventIds, [first.event.id]);
  assert.equal(
    events.filter((event) => event.idempotencyKey === "test-writer-exact-retry").length,
    1,
  );
});

test("writer blocks an agent next-action event without scoped approval", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await writer.appendProjectNextActionEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "agent-codex",
    projectId: "project-agency-os",
    nextAction: "Agent write should be blocked.",
    idempotencyKey: "test-writer-agent-without-approval",
    timestamp: "2026-07-23T10:00:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.appended, false);
  assert.ok(result.errors.some((error) => error.includes("requires scoped approval")));
  assert.equal(afterEvents.length, beforeEvents.length);
});

test("writer appends an agent next-action event with scoped approval", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const approvalEvent = makeApprovalApprovedEvent(ledger.calculateEventHash, ledger.stateLedger);
  await appendTestEvent(eventsPath, approvalEvent);
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await writer.appendProjectNextActionEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "agent-codex",
    projectId: "project-agency-os",
    nextAction: "Agent write passes through scoped approval.",
    idempotencyKey: "test-writer-agent-with-approval",
    approvalIds: ["approval-first-scoped-write"],
    timestamp: "2026-07-23T10:00:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const projectEvent = afterEvents.find(
    (event) => event.idempotencyKey === "test-writer-agent-with-approval",
  );
  const approvalUsedEvent = afterEvents.find(
    (event) =>
      event.idempotencyKey ===
      "test-writer-agent-with-approval:approval-used:approval-first-scoped-write",
  );

  assert.equal(result.appended, true);
  assert.deepEqual(result.errors, []);
  assert.equal(afterEvents.length, beforeEvents.length + 2);
  assert.equal(projectEvent.approvalIds[0], "approval-first-scoped-write");
  assert.equal(approvalUsedEvent.action, "approval.used");
  assert.equal(approvalUsedEvent.after.usedByEventId, projectEvent.id);
  assert.equal(approvalUsedEvent.previousEventHash, projectEvent.eventHash);
});

test("writer blocks reuse of single-use approval across separate calls", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const approvalEvent = makeApprovalApprovedEvent(ledger.calculateEventHash, ledger.stateLedger);
  await appendTestEvent(eventsPath, approvalEvent);
  const first = await writer.appendProjectNextActionEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "agent-codex",
    projectId: "project-agency-os",
    nextAction: "First agent write uses approval.",
    idempotencyKey: "test-writer-agent-approval-reuse-one",
    approvalIds: ["approval-first-scoped-write"],
    timestamp: "2026-07-23T10:00:00Z",
  });
  const second = await writer.appendProjectNextActionEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "agent-codex",
    projectId: "project-agency-os",
    nextAction: "Second agent write tries to reuse approval.",
    idempotencyKey: "test-writer-agent-approval-reuse-two",
    approvalIds: ["approval-first-scoped-write"],
    timestamp: "2026-07-23T10:00:01Z",
  });
  const events = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(first.appended, true);
  assert.equal(second.appended, false);
  assert.ok(second.errors.some((error) => error.includes("requires scoped approval")));
  assert.equal(
    events.filter((event) => event.action === "approval.used").length,
    1,
  );
});

test("writer does not trust approved snapshot without durable approval event", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const approvedSnapshotOnly = {
    ...ledger.stateLedger,
    approvals: ledger.stateLedger.approvals.map((approval) =>
      approval.id === "approval-first-scoped-write"
        ? {
            ...approval,
            state: "approved",
            approverId: "person-serj",
            decidedAt: "2026-07-23T10:00:00Z",
          }
        : approval,
    ),
  };

  const result = await writer.appendProjectNextActionEvent({
    ledger: approvedSnapshotOnly,
    eventsPath,
    actorId: "agent-codex",
    projectId: "project-agency-os",
    nextAction: "Snapshot-only approval should be ignored.",
    idempotencyKey: "test-writer-snapshot-only-approval",
    approvalIds: ["approval-first-scoped-write"],
    timestamp: "2026-07-23T10:00:00Z",
  });

  assert.equal(result.appended, false);
  assert.ok(result.errors.some((error) => error.includes("requires scoped approval")));
});

test("writer refuses to append when the existing event log is invalid", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const events = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  events[0].eventHash = "fnv1a32:badbad00";
  await writeFile(eventsPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");

  const result = await writer.appendProjectNextActionEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    nextAction: "This should not append after broken precondition.",
    idempotencyKey: "test-writer-broken-precondition",
    timestamp: "2026-07-23T10:00:00Z",
  });

  assert.equal(result.appended, false);
  assert.ok(result.errors.some((error) => error.includes("invalid event hash")));
});

test("writer appends a human capture note event after preflight replay", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "Capture writer records one quarantined note.",
    source: "phone",
    idempotencyKey: "test-writer-capture-note",
    createdAt: "2026-07-23T12:00:00Z",
    receivedAt: "2026-07-23T12:00:02Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const derived = ledger.getReplayDerivedLedger({
    ...ledger.stateLedger,
    events: afterEvents,
  });
  const capture = derived.ledger.captures.find((item) => item.id === result.event.entityId);

  assert.equal(result.appended, true);
  assert.deepEqual(result.errors, []);
  assert.equal(afterEvents.length, beforeEvents.length + 1);
  assert.equal(afterEvents.at(-1).action, "capture.note_created");
  assert.equal(afterEvents.at(-1).entityType, "capture");
  assert.equal(afterEvents.at(-1).actorId, "person-serj");
  assert.equal(afterEvents.at(-1).redactionStatus, "pending_scan");
  assert.equal(afterEvents.at(-1).retentionClass, "operational");
  assert.equal(afterEvents.at(-1).previousEventHash, beforeEvents.at(-1).eventHash);
  assert.equal(afterEvents.at(-1).eventHash, ledger.calculateEventHash(afterEvents.at(-1)));
  assert.equal(capture.projectId, "project-agency-os");
  assert.equal(capture.source, "phone");
  assert.equal(capture.classification, "inbox");
  assert.equal(capture.reviewStatus, "uncategorized");
  assert.deepEqual(capture.linkedEntityIds, []);
});

test("writer treats an exact capture retry idempotency key as a no-op", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const input = {
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "inbox",
    body: "Retrying this capture should not append twice.",
    source: "phone",
    idempotencyKey: "test-writer-capture-exact-retry",
    createdAt: "2026-07-23T12:01:00Z",
    receivedAt: "2026-07-23T12:01:01Z",
    redactionStatus: "no_secrets_detected",
  };

  const first = await writer.appendCaptureNoteEvent(input);
  const second = await writer.appendCaptureNoteEvent(input);
  const events = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(first.appended, true);
  assert.equal(second.appended, false);
  assert.deepEqual(second.errors, []);
  assert.deepEqual(second.ignoredEventIds, [first.event.id]);
  assert.equal(
    events.filter((event) => event.idempotencyKey === "test-writer-capture-exact-retry").length,
    1,
  );
});

test("writer appends a capture review marking and confirms derived state", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const note = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "Capture review writer should only triage this note.",
    source: "phone",
    idempotencyKey: "test-writer-review-note",
    createdAt: "2026-07-23T12:07:00Z",
    receivedAt: "2026-07-23T12:07:01Z",
  });

  const result = await writer.appendCaptureReviewMarkedEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    captureId: note.event.entityId,
    candidateType: "decision_candidate",
    idempotencyKey: "test-writer-capture-review-marked",
    reviewedAt: "2026-07-23T12:08:00Z",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  const derived = ledger.getReplayDerivedLedger({
    ...ledger.stateLedger,
    events: afterEvents,
  });
  const capture = derived.ledger.captures.find((item) => item.id === note.event.entityId);

  assert.equal(result.appended, true);
  assert.deepEqual(result.errors, []);
  assert.equal(afterEvents.length, beforeEvents.length + 2);
  assert.equal(afterEvents.at(-1).action, "capture.review_marked");
  assert.equal(afterEvents.at(-1).entityType, "capture");
  assert.equal(afterEvents.at(-1).entityId, note.event.entityId);
  assert.equal(afterEvents.at(-1).actorId, "person-serj");
  assert.equal(afterEvents.at(-1).source, "local_writer");
  assert.equal(afterEvents.at(-1).redactionStatus, "not_required");
  assert.equal(afterEvents.at(-1).retentionClass, "operational");
  assert.equal(afterEvents.at(-1).previousEventHash, afterEvents.at(-2).eventHash);
  assert.equal(afterEvents.at(-1).eventHash, ledger.calculateEventHash(afterEvents.at(-1)));
  assert.equal(capture.classification, "decision_candidate");
  assert.equal(capture.candidateType, "decision_candidate");
  assert.equal(capture.reviewStatus, "triaged");
  assert.equal(capture.reviewedAt, "2026-07-23T12:08:00Z");
  assert.deepEqual(capture.linkedEntityIds, []);
});

test("writer treats an exact capture review retry idempotency key as a no-op", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const note = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "inbox",
    body: "Retrying this capture review should not append twice.",
    source: "phone",
    idempotencyKey: "test-writer-review-retry-note",
    createdAt: "2026-07-23T12:09:00Z",
    receivedAt: "2026-07-23T12:09:01Z",
  });
  const input = {
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    captureId: note.event.entityId,
    candidateType: "evidence_candidate",
    idempotencyKey: "test-writer-capture-review-exact-retry",
    reviewedAt: "2026-07-23T12:10:00Z",
  };

  const first = await writer.appendCaptureReviewMarkedEvent(input);
  const second = await writer.appendCaptureReviewMarkedEvent(input);
  const events = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(first.appended, true);
  assert.equal(second.appended, false);
  assert.deepEqual(second.errors, []);
  assert.deepEqual(second.ignoredEventIds, [first.event.id]);
  assert.equal(
    events.filter((event) => event.idempotencyKey === "test-writer-capture-review-exact-retry").length,
    1,
  );
});

test("writer blocks capture notes with invalid raw redaction status", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const result = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "Raw capture cannot be not_required.",
    source: "phone",
    idempotencyKey: "test-writer-capture-not-required",
    createdAt: "2026-07-23T12:02:00Z",
    receivedAt: "2026-07-23T12:02:01Z",
    redactionStatus: "not_required",
  });
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(result.appended, false);
  assert.ok(
    result.errors.some((error) =>
      error.includes("invalid capture redaction status not_required"),
    ),
  );
  assert.equal(afterEvents.length, beforeEvents.length);
});

test("writer refuses capture append when the existing event log is invalid", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const events = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
  events[0].eventHash = "fnv1a32:badbad00";
  await writeFile(eventsPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");

  const result = await writer.appendCaptureNoteEvent({
    ledger: ledger.stateLedger,
    eventsPath,
    actorId: "person-serj",
    projectId: "project-agency-os",
    body: "This should not append after broken precondition.",
    source: "phone",
    idempotencyKey: "test-writer-capture-broken-precondition",
    createdAt: "2026-07-23T12:03:00Z",
    receivedAt: "2026-07-23T12:03:01Z",
  });

  assert.equal(result.appended, false);
  assert.ok(result.errors.some((error) => error.includes("invalid event hash")));
});

test("writer serializes parallel appends through the event log lock", async () => {
  const { eventsPath, ledger, writer } = await loadLedgerWithWriter();
  const beforeEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  const [first, second] = await Promise.all([
    writer.appendProjectNextActionEvent({
      ledger: ledger.stateLedger,
      eventsPath,
      actorId: "person-serj",
      projectId: "project-agency-os",
      nextAction: "Parallel write one.",
      idempotencyKey: "test-writer-parallel-one",
      timestamp: "2026-07-23T10:00:00Z",
    }),
    writer.appendProjectNextActionEvent({
      ledger: ledger.stateLedger,
      eventsPath,
      actorId: "person-serj",
      projectId: "project-agency-os",
      nextAction: "Parallel write two.",
      idempotencyKey: "test-writer-parallel-two",
      timestamp: "2026-07-23T10:00:01Z",
    }),
  ]);
  const afterEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));

  assert.equal(first.appended, true);
  assert.equal(second.appended, true);
  assert.equal(afterEvents.length, beforeEvents.length + 2);
  assert.deepEqual(
    afterEvents.slice(-2).map((event) => event.sequence),
    [beforeEvents.length + 1, beforeEvents.length + 2],
  );
  assert.equal(afterEvents.at(-1).previousEventHash, afterEvents.at(-2).eventHash);
});
