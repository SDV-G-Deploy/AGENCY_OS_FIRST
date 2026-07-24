import assert from "node:assert/strict";
import test from "node:test";

import {
  loadLedger,
  makeApprovalApprovedEvent,
  makeCaptureNoteEvent,
  makeCaptureReviewMarkedEvent,
  makeProjectNextActionEvent,
} from "./ledger-test-helpers.mjs";

test("replay updates project next action without mutating the input snapshot", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const originalNextAction = stateLedger.projects.find((project) => project.id === "project-agency-os").nextAction;
  const event = makeProjectNextActionEvent(calculateEventHash, stateLedger);

  const result = replayLedgerEvents(stateLedger, [event]);
  const replayedProject = result.ledger.projects.find((project) => project.id === "project-agency-os");
  const originalProject = stateLedger.projects.find((project) => project.id === "project-agency-os");

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.appliedEventIds, ["event-test-next-action"]);
  assert.equal(replayedProject.nextAction, "Review event reducer output.");
  assert.equal(originalProject.nextAction, originalNextAction);
});

test("derived ledger reflects appended project next-action events over snapshots", async () => {
  const { calculateEventHash, getReplayDerivedLedger, stateLedger } = await loadLedger();
  const event = makeProjectNextActionEvent(calculateEventHash, stateLedger, {
    id: "event-test-derived-next-action",
    idempotencyKey: "test-derived-next-action",
    after: { nextAction: "Derived dashboard state comes from replay." },
  });

  const derived = getReplayDerivedLedger({
    ...stateLedger,
    events: [...stateLedger.events, event],
  });
  const project = derived.ledger.projects.find((item) => item.id === "project-agency-os");
  const snapshotProject = stateLedger.projects.find((item) => item.id === "project-agency-os");

  assert.deepEqual(derived.errors, []);
  assert.equal(project.nextAction, "Derived dashboard state comes from replay.");
  assert.notEqual(snapshotProject.nextAction, project.nextAction);
});

test("replay ignores exact duplicate idempotency payloads", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const event = makeProjectNextActionEvent(calculateEventHash, stateLedger);

  const result = replayLedgerEvents(stateLedger, [event, { ...event }]);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.appliedEventIds, ["event-test-next-action"]);
  assert.deepEqual(result.ignoredEventIds, ["event-test-next-action"]);
});

test("replay rejects changed duplicate idempotency payloads", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const event = makeProjectNextActionEvent(calculateEventHash, stateLedger);
  const changedDuplicate = makeProjectNextActionEvent(calculateEventHash, stateLedger, {
    id: "event-test-next-action-changed",
    after: { nextAction: "Different action with same idempotency key." },
  });

  const result = replayLedgerEvents(stateLedger, [event, changedDuplicate]);

  assert.ok(
    result.errors.some((error) =>
      error.includes("duplicate idempotency key test-next-action has different payload"),
    ),
  );
});

test("agent replay requires scoped approval", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const agentEvent = makeProjectNextActionEvent(calculateEventHash, stateLedger, {
    actorId: "agent-codex",
  });

  const result = replayLedgerEvents(stateLedger, [agentEvent]);

  assert.ok(result.errors.some((error) => error.includes("requires scoped approval")));
});

test("agent replay applies scoped single-use approval once", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const approvedLedger = {
    ...stateLedger,
    approvals: stateLedger.approvals.map((approval) =>
      approval.id === "approval-first-scoped-write"
        ? {
            ...approval,
            state: "approved",
            scope: "project-agency-os:project.next_action_updated",
            approverId: "person-serj",
            decidedAt: "2026-07-23T09:00:00Z",
          }
        : approval,
    ),
  };
  const firstEvent = makeProjectNextActionEvent(calculateEventHash, approvedLedger, {
    id: "event-test-agent-next-action-1",
    actorId: "agent-codex",
    approvalIds: ["approval-first-scoped-write"],
    idempotencyKey: "test-agent-next-action-1",
    after: { nextAction: "Agent writes through scoped approval." },
  });
  const secondEvent = makeProjectNextActionEvent(calculateEventHash, approvedLedger, {
    id: "event-test-agent-next-action-2",
    sequence: firstEvent.sequence + 1,
    previousEventHash: firstEvent.eventHash,
    actorId: "agent-codex",
    approvalIds: ["approval-first-scoped-write"],
    idempotencyKey: "test-agent-next-action-2",
    after: { nextAction: "Agent tries to reuse scoped approval." },
  });

  const result = replayLedgerEvents(
    approvedLedger,
    [firstEvent, secondEvent],
    new Date("2026-07-24T12:00:00Z"),
  );
  const usedApproval = result.ledger.approvals.find(
    (approval) => approval.id === "approval-first-scoped-write",
  );

  assert.deepEqual(result.appliedEventIds, ["event-test-agent-next-action-1"]);
  assert.ok(result.errors.some((error) => error.includes("requires scoped approval")));
  assert.equal(usedApproval.state, "used");
  assert.equal(usedApproval.usedByEventId, "event-test-agent-next-action-1");
});

test("replay rejects append events with invalid hash before applying state", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const badHashEvent = makeProjectNextActionEvent(calculateEventHash, stateLedger);
  badHashEvent.eventHash = "fnv1a32:badbad00";

  const result = replayLedgerEvents(stateLedger, [badHashEvent]);
  const replayedProject = result.ledger.projects.find((project) => project.id === "project-agency-os");
  const originalProject = stateLedger.projects.find((project) => project.id === "project-agency-os");

  assert.ok(result.errors.some((error) => error.includes("invalid event hash")));
  assert.equal(replayedProject.nextAction, originalProject.nextAction);
});

test("replay applies a valid capture note without mutating snapshots", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const event = makeCaptureNoteEvent(calculateEventHash, stateLedger);

  const result = replayLedgerEvents(stateLedger, [event]);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.appliedEventIds, ["event-test-capture-note"]);
  assert.equal(result.ledger.captures.length, stateLedger.captures.length + 1);
  assert.equal(stateLedger.captures.length, 0);
  assert.deepEqual(result.ledger.captures.at(-1), {
    id: "capture-test-note",
    projectId: "project-agency-os",
    actorId: "person-serj",
    source: "phone",
    body: "Captured from a short phone session.",
    createdAt: "2026-07-23T11:00:00Z",
    receivedAt: "2026-07-23T11:00:02Z",
    redactionStatus: "pending_scan",
    classification: "inbox",
    candidateType: null,
    reviewedAt: null,
    linkedEntityIds: [],
    reviewStatus: "uncategorized",
  });
});

test("replay accepts inbox capture notes", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const event = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-inbox-capture-note",
    entityId: "capture-test-inbox-note",
    idempotencyKey: "test-inbox-capture-note",
    after: {
      id: "capture-test-inbox-note",
      projectId: "inbox",
      body: "This does not have a project yet.",
    },
  });

  const result = replayLedgerEvents(stateLedger, [event]);

  assert.deepEqual(result.errors, []);
  assert.equal(result.ledger.captures.at(-1).projectId, "inbox");
});

test("replay marks an uncategorized capture as a triaged candidate", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const createEvent = makeCaptureNoteEvent(calculateEventHash, stateLedger);
  const reviewEvent = makeCaptureReviewMarkedEvent(
    calculateEventHash,
    { ...stateLedger, events: [...stateLedger.events, createEvent] },
  );

  const result = replayLedgerEvents(stateLedger, [createEvent, reviewEvent]);
  const capture = result.ledger.captures.find((item) => item.id === "capture-test-note");

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.appliedEventIds, [
    "event-test-capture-note",
    "event-test-capture-review-marked",
  ]);
  assert.equal(capture.classification, "evidence_candidate");
  assert.equal(capture.candidateType, "evidence_candidate");
  assert.equal(capture.reviewStatus, "triaged");
  assert.equal(capture.reviewedAt, "2026-07-23T11:10:00Z");
  assert.equal(capture.body, "Captured from a short phone session.");
  assert.deepEqual(capture.linkedEntityIds, []);
});

test("replay rejects invalid capture review markings", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const createEvent = makeCaptureNoteEvent(calculateEventHash, stateLedger);
  const ledgerAfterCreate = { ...stateLedger, events: [...stateLedger.events, createEvent] };
  const unknownCapture = makeCaptureReviewMarkedEvent(calculateEventHash, ledgerAfterCreate, {
    id: "event-test-review-unknown-capture",
    entityId: "capture-does-not-exist",
    idempotencyKey: "test-review-unknown-capture",
    after: {
      captureId: "capture-does-not-exist",
    },
  });
  const agentActor = makeCaptureReviewMarkedEvent(calculateEventHash, ledgerAfterCreate, {
    id: "event-test-review-agent-actor",
    actorId: "agent-codex",
    idempotencyKey: "test-review-agent-actor",
  });
  const mismatchedCaptureId = makeCaptureReviewMarkedEvent(calculateEventHash, ledgerAfterCreate, {
    id: "event-test-review-mismatched-capture-id",
    idempotencyKey: "test-review-mismatched-capture-id",
    after: {
      captureId: "capture-other",
    },
  });
  const invalidReviewStatus = makeCaptureReviewMarkedEvent(calculateEventHash, ledgerAfterCreate, {
    id: "event-test-review-invalid-status",
    idempotencyKey: "test-review-invalid-status",
    after: {
      reviewStatus: "converted",
    },
  });
  const invalidCandidateType = makeCaptureReviewMarkedEvent(calculateEventHash, ledgerAfterCreate, {
    id: "event-test-review-invalid-candidate",
    idempotencyKey: "test-review-invalid-candidate",
    after: {
      candidateType: "inbox",
    },
  });
  const invalidReviewedAt = makeCaptureReviewMarkedEvent(calculateEventHash, ledgerAfterCreate, {
    id: "event-test-review-invalid-reviewed-at",
    idempotencyKey: "test-review-invalid-reviewed-at",
    after: {
      reviewedAt: "not-a-date",
    },
  });
  const invalidEntityType = makeCaptureReviewMarkedEvent(calculateEventHash, ledgerAfterCreate, {
    id: "event-test-review-invalid-entity-type",
    entityType: "project",
    idempotencyKey: "test-review-invalid-entity-type",
  });

  const unknownResult = replayLedgerEvents(stateLedger, [createEvent, unknownCapture]);
  const agentResult = replayLedgerEvents(stateLedger, [createEvent, agentActor]);
  const mismatchResult = replayLedgerEvents(stateLedger, [createEvent, mismatchedCaptureId]);
  const statusResult = replayLedgerEvents(stateLedger, [createEvent, invalidReviewStatus]);
  const candidateResult = replayLedgerEvents(stateLedger, [createEvent, invalidCandidateType]);
  const reviewedAtResult = replayLedgerEvents(stateLedger, [createEvent, invalidReviewedAt]);
  const entityTypeResult = replayLedgerEvents(stateLedger, [createEvent, invalidEntityType]);

  assert.ok(unknownResult.errors.some((error) => error.includes("references unknown capture")));
  assert.ok(agentResult.errors.some((error) => error.includes("requires person capture review actor")));
  assert.ok(mismatchResult.errors.some((error) => error.includes("captureId must match entity id")));
  assert.ok(statusResult.errors.some((error) => error.includes("capture review must mark triaged")));
  assert.ok(candidateResult.errors.some((error) => error.includes("invalid capture candidate type inbox")));
  assert.ok(reviewedAtResult.errors.some((error) => error.includes("invalid reviewedAt")));
  assert.ok(entityTypeResult.errors.some((error) => error.includes("must target a capture entity")));
  assert.deepEqual(unknownResult.appliedEventIds, ["event-test-capture-note"]);
  assert.deepEqual(agentResult.appliedEventIds, ["event-test-capture-note"]);
  assert.deepEqual(mismatchResult.appliedEventIds, ["event-test-capture-note"]);
  assert.deepEqual(statusResult.appliedEventIds, ["event-test-capture-note"]);
  assert.deepEqual(candidateResult.appliedEventIds, ["event-test-capture-note"]);
  assert.deepEqual(reviewedAtResult.appliedEventIds, ["event-test-capture-note"]);
  assert.deepEqual(entityTypeResult.appliedEventIds, ["event-test-capture-note"]);
});

test("replay only reviews uncategorized non-sensitive captures", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const createEvent = makeCaptureNoteEvent(calculateEventHash, stateLedger);
  const firstReview = makeCaptureReviewMarkedEvent(
    calculateEventHash,
    { ...stateLedger, events: [...stateLedger.events, createEvent] },
  );
  const secondReview = makeCaptureReviewMarkedEvent(
    calculateEventHash,
    { ...stateLedger, events: [...stateLedger.events, createEvent, firstReview] },
    {
      id: "event-test-capture-review-again",
      idempotencyKey: "test-capture-review-again",
      sequence: firstReview.sequence + 1,
      previousEventHash: firstReview.eventHash,
      after: {
        candidateType: "blocker_candidate",
        reviewedAt: "2026-07-23T11:11:00Z",
      },
    },
  );
  const sensitiveCreate = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-sensitive-create-for-review",
    entityId: "capture-test-sensitive-review",
    idempotencyKey: "test-sensitive-create-for-review",
    redactionStatus: "blocked_sensitive",
    after: {
      id: "capture-test-sensitive-review",
      body: "SECRET_SHOULD_STAY_HIDDEN",
      redactionStatus: "blocked_sensitive",
    },
  });
  const sensitiveReview = makeCaptureReviewMarkedEvent(
    calculateEventHash,
    { ...stateLedger, events: [...stateLedger.events, sensitiveCreate] },
    {
      id: "event-test-sensitive-review",
      entityId: "capture-test-sensitive-review",
      idempotencyKey: "test-sensitive-review",
      after: {
        captureId: "capture-test-sensitive-review",
      },
    },
  );

  const secondResult = replayLedgerEvents(stateLedger, [createEvent, firstReview, secondReview]);
  const sensitiveResult = replayLedgerEvents(stateLedger, [sensitiveCreate, sensitiveReview]);
  const reviewedCapture = secondResult.ledger.captures.find((item) => item.id === "capture-test-note");
  const sensitiveCapture = sensitiveResult.ledger.captures.find(
    (item) => item.id === "capture-test-sensitive-review",
  );

  assert.ok(
    secondResult.errors.some((error) =>
      error.includes("capture review requires uncategorized capture"),
    ),
  );
  assert.deepEqual(secondResult.appliedEventIds, [
    "event-test-capture-note",
    "event-test-capture-review-marked",
  ]);
  assert.equal(reviewedCapture.classification, "evidence_candidate");
  assert.equal(reviewedCapture.reviewStatus, "triaged");
  assert.ok(
    sensitiveResult.errors.some((error) =>
      error.includes("cannot review blocked sensitive capture in normal flow"),
    ),
  );
  assert.deepEqual(sensitiveResult.appliedEventIds, ["event-test-sensitive-create-for-review"]);
  assert.equal(sensitiveCapture.body, "Blocked sensitive capture");
  assert.equal(sensitiveCapture.reviewStatus, "uncategorized");
  assert.equal(sensitiveCapture.classification, "inbox");
});

test("replay rejects invalid capture note fields", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const missingBody = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-missing-body",
    entityId: "capture-test-missing-body",
    idempotencyKey: "test-capture-missing-body",
    after: {
      id: "capture-test-missing-body",
      body: "",
    },
  });
  const missingProject = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-missing-project",
    entityId: "capture-test-missing-project",
    idempotencyKey: "test-capture-missing-project",
    after: {
      id: "capture-test-missing-project",
      projectId: "",
    },
  });
  const invalidSource = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-invalid-source",
    entityId: "capture-test-invalid-source",
    idempotencyKey: "test-capture-invalid-source",
    after: {
      id: "capture-test-invalid-source",
      source: "unknown-tool",
    },
  });
  const invalidClassification = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-invalid-classification",
    entityId: "capture-test-invalid-classification",
    idempotencyKey: "test-capture-invalid-classification",
    after: {
      id: "capture-test-invalid-classification",
      classification: "evidence_candidate",
    },
  });
  const invalidReviewStatus = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-invalid-review-status",
    entityId: "capture-test-invalid-review-status",
    idempotencyKey: "test-capture-invalid-review-status",
    after: {
      id: "capture-test-invalid-review-status",
      reviewStatus: "converted",
    },
  });
  const linkedEntities = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-linked-entities",
    entityId: "capture-test-linked-entities",
    idempotencyKey: "test-capture-linked-entities",
    after: {
      id: "capture-test-linked-entities",
      linkedEntityIds: ["evidence-local-v0-2-verify"],
    },
  });
  const malformedLinkedEntities = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-malformed-links",
    entityId: "capture-test-malformed-links",
    idempotencyKey: "test-capture-malformed-links",
    after: {
      id: "capture-test-malformed-links",
      linkedEntityIds: ["ok", 42],
    },
  });
  const invalidEntityType = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-invalid-entity-type",
    entityType: "project",
    entityId: "capture-test-invalid-entity-type",
    idempotencyKey: "test-capture-invalid-entity-type",
    after: {
      id: "capture-test-invalid-entity-type",
    },
  });
  const mismatchedActor = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-mismatched-actor",
    entityId: "capture-test-mismatched-actor",
    idempotencyKey: "test-capture-mismatched-actor",
    after: {
      id: "capture-test-mismatched-actor",
      actorId: "agent-codex",
    },
  });
  const mismatchedId = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-mismatched-id",
    entityId: "capture-test-mismatched-id",
    idempotencyKey: "test-capture-mismatched-id",
    after: {
      id: "capture-test-different-id",
    },
  });
  const notCreateBefore = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-before-state",
    entityId: "capture-test-before-state",
    idempotencyKey: "test-capture-before-state",
    before: { reviewStatus: "uncategorized" },
    after: {
      id: "capture-test-before-state",
    },
  });
  const badTimestamp = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-bad-timestamp",
    entityId: "capture-test-bad-timestamp",
    idempotencyKey: "test-capture-bad-timestamp",
    after: {
      id: "capture-test-bad-timestamp",
      createdAt: "not-a-date",
    },
  });
  const envelopeMismatch = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-envelope-mismatch",
    entityId: "capture-test-envelope-mismatch",
    idempotencyKey: "test-capture-envelope-mismatch",
    redactionStatus: "redacted",
    after: {
      id: "capture-test-envelope-mismatch",
      redactionStatus: "pending_scan",
    },
  });
  const notRequired = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-not-required",
    entityId: "capture-test-not-required",
    idempotencyKey: "test-capture-not-required",
    redactionStatus: "not_required",
    after: {
      id: "capture-test-not-required",
      redactionStatus: "not_required",
    },
  });
  const agentCapture = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-agent-capture",
    actorId: "agent-codex",
    entityId: "capture-test-agent",
    idempotencyKey: "test-agent-capture",
    after: {
      id: "capture-test-agent",
      actorId: "agent-codex",
    },
  });

  const missingBodyResult = replayLedgerEvents(stateLedger, [missingBody]);
  const missingProjectResult = replayLedgerEvents(stateLedger, [missingProject]);
  const invalidSourceResult = replayLedgerEvents(stateLedger, [invalidSource]);
  const invalidClassificationResult = replayLedgerEvents(stateLedger, [invalidClassification]);
  const invalidReviewStatusResult = replayLedgerEvents(stateLedger, [invalidReviewStatus]);
  const linkedEntitiesResult = replayLedgerEvents(stateLedger, [linkedEntities]);
  const malformedLinkedEntitiesResult = replayLedgerEvents(stateLedger, [malformedLinkedEntities]);
  const invalidEntityTypeResult = replayLedgerEvents(stateLedger, [invalidEntityType]);
  const mismatchedActorResult = replayLedgerEvents(stateLedger, [mismatchedActor]);
  const mismatchedIdResult = replayLedgerEvents(stateLedger, [mismatchedId]);
  const notCreateBeforeResult = replayLedgerEvents(stateLedger, [notCreateBefore]);
  const badTimestampResult = replayLedgerEvents(stateLedger, [badTimestamp]);
  const envelopeMismatchResult = replayLedgerEvents(stateLedger, [envelopeMismatch]);
  const notRequiredResult = replayLedgerEvents(stateLedger, [notRequired]);
  const agentResult = replayLedgerEvents(stateLedger, [agentCapture]);

  assert.ok(missingBodyResult.errors.some((error) => error.includes("missing body")));
  assert.ok(missingProjectResult.errors.some((error) => error.includes("missing projectId")));
  assert.ok(
    invalidSourceResult.errors.some((error) =>
      error.includes("invalid capture source unknown-tool"),
    ),
  );
  assert.ok(
    invalidClassificationResult.errors.some((error) =>
      error.includes("capture create must start as inbox"),
    ),
  );
  assert.ok(
    invalidReviewStatusResult.errors.some((error) =>
      error.includes("capture create must start uncategorized"),
    ),
  );
  assert.ok(
    linkedEntitiesResult.errors.some((error) =>
      error.includes("capture create cannot link entities"),
    ),
  );
  assert.ok(
    malformedLinkedEntitiesResult.errors.some((error) =>
      error.includes("linkedEntityIds must be a string array"),
    ),
  );
  assert.ok(
    invalidEntityTypeResult.errors.some((error) =>
      error.includes("must target a capture entity"),
    ),
  );
  assert.ok(
    mismatchedActorResult.errors.some((error) =>
      error.includes("actorId must match capture actor"),
    ),
  );
  assert.ok(
    mismatchedIdResult.errors.some((error) =>
      error.includes("capture id must match entity id"),
    ),
  );
  assert.ok(
    notCreateBeforeResult.errors.some((error) =>
      error.includes("capture create must have null before state"),
    ),
  );
  assert.ok(badTimestampResult.errors.some((error) => error.includes("invalid createdAt")));
  assert.ok(
    envelopeMismatchResult.errors.some((error) =>
      error.includes("capture redaction status must match event envelope"),
    ),
  );
  assert.ok(
    notRequiredResult.errors.some((error) =>
      error.includes("invalid capture redaction status not_required"),
    ),
  );
  assert.ok(agentResult.errors.some((error) => error.includes("requires person capture actor")));
  assert.deepEqual(missingBodyResult.appliedEventIds, []);
  assert.deepEqual(missingProjectResult.appliedEventIds, []);
  assert.deepEqual(invalidSourceResult.appliedEventIds, []);
  assert.deepEqual(invalidClassificationResult.appliedEventIds, []);
  assert.deepEqual(invalidReviewStatusResult.appliedEventIds, []);
  assert.deepEqual(linkedEntitiesResult.appliedEventIds, []);
  assert.deepEqual(malformedLinkedEntitiesResult.appliedEventIds, []);
  assert.deepEqual(invalidEntityTypeResult.appliedEventIds, []);
  assert.deepEqual(mismatchedActorResult.appliedEventIds, []);
  assert.deepEqual(mismatchedIdResult.appliedEventIds, []);
  assert.deepEqual(notCreateBeforeResult.appliedEventIds, []);
  assert.deepEqual(badTimestampResult.appliedEventIds, []);
  assert.deepEqual(envelopeMismatchResult.appliedEventIds, []);
  assert.deepEqual(notRequiredResult.appliedEventIds, []);
  assert.deepEqual(agentResult.appliedEventIds, []);
});

test("replay ignores exact duplicate capture note idempotency", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const event = makeCaptureNoteEvent(calculateEventHash, stateLedger);

  const result = replayLedgerEvents(stateLedger, [event, { ...event }]);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.appliedEventIds, ["event-test-capture-note"]);
  assert.deepEqual(result.ignoredEventIds, ["event-test-capture-note"]);
  assert.equal(result.ledger.captures.length, 1);
});

test("capture review summaries hide blocked-sensitive body text", async () => {
  const { calculateEventHash, getPhoneReviewQueue, getUncategorizedCaptures, replayLedgerEvents, stateLedger } =
    await loadLedger();
  const pending = makeCaptureNoteEvent(calculateEventHash, stateLedger, {
    id: "event-test-capture-pending",
    entityId: "capture-test-pending",
    idempotencyKey: "test-capture-pending",
    after: {
      id: "capture-test-pending",
      body: "Pending raw note should be masked.",
      receivedAt: "2026-07-23T11:01:00Z",
    },
  });
  const clean = makeCaptureNoteEvent(
    calculateEventHash,
    { ...stateLedger, events: [...stateLedger.events, pending] },
    {
      id: "event-test-capture-clean",
      entityId: "capture-test-clean",
      idempotencyKey: "test-capture-clean",
      redactionStatus: "no_secrets_detected",
      after: {
        id: "capture-test-clean",
        body: "Clean note can appear in capture review.",
        receivedAt: "2026-07-23T11:02:00Z",
        redactionStatus: "no_secrets_detected",
      },
    },
  );
  const sensitive = makeCaptureNoteEvent(
    calculateEventHash,
    { ...stateLedger, events: [...stateLedger.events, pending, clean] },
    {
      id: "event-test-capture-sensitive",
      entityId: "capture-test-sensitive",
      idempotencyKey: "test-capture-sensitive",
      redactionStatus: "blocked_sensitive",
      after: {
        id: "capture-test-sensitive",
        body: "SECRET_SHOULD_NOT_RENDER",
        receivedAt: "2026-07-23T11:03:00Z",
        redactionStatus: "blocked_sensitive",
      },
    },
  );

  const result = replayLedgerEvents(stateLedger, [pending, clean, sensitive]);
  const summaries = getUncategorizedCaptures(result.ledger);
  const phoneCapture = getPhoneReviewQueue(result.ledger).find((item) => item.id === "phone-capture");

  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    summaries.map((capture) => capture.id),
    ["capture-test-clean", "capture-test-pending"],
  );
  assert.equal(summaries[0].summary, "Clean note can appear in capture review.");
  assert.equal(summaries[1].summary, "Pending scan");
  assert.equal(JSON.stringify(summaries).includes("SECRET_SHOULD_NOT_RENDER"), false);
  assert.equal(JSON.stringify(result.ledger.captures).includes("SECRET_SHOULD_NOT_RENDER"), false);
  assert.equal(JSON.stringify(getPhoneReviewQueue(result.ledger)).includes("SECRET_SHOULD_NOT_RENDER"), false);
  assert.equal(phoneCapture.count, 3);
  assert.equal(phoneCapture.evidenceHint, "Clean note can appear in capture review.");
});

test("replay rejects unsupported state-changing event actions", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const event = makeProjectNextActionEvent(calculateEventHash, stateLedger, {
    id: "event-test-unsupported-capture-note-update",
    action: "capture.note_updated",
    entityType: "capture",
    entityId: "capture-test-note",
    after: {
      projectId: "project-agency-os",
      source: "phone",
      body: "Only create is supported in this slice.",
    },
    idempotencyKey: "test-unsupported-capture-note-update",
  });

  const result = replayLedgerEvents(stateLedger, [event]);

  assert.ok(
    result.errors.some((error) =>
      error.includes("unsupported state-changing action capture.note_updated"),
    ),
  );
  assert.deepEqual(result.appliedEventIds, []);
});

test("replay can ignore unsupported non-state informational events", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const event = makeProjectNextActionEvent(calculateEventHash, stateLedger, {
    id: "event-test-informational",
    action: "system.observed",
    entityType: "system",
    entityId: "system-local",
    after: { note: "Informational event does not claim state mutation." },
    idempotencyKey: "test-informational",
  });

  const result = replayLedgerEvents(stateLedger, [event]);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.appliedEventIds, []);
  assert.deepEqual(result.ignoredEventIds, ["event-test-informational"]);
});

test("replay rejects idempotency keys that already exist in the ledger", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const event = makeProjectNextActionEvent(calculateEventHash, stateLedger, {
    idempotencyKey: "2026-07-23-honesty-closure",
  });

  const result = replayLedgerEvents(stateLedger, [event]);

  assert.ok(
    result.errors.some((error) =>
      error.includes("duplicate idempotency key 2026-07-23-honesty-closure has different payload"),
    ),
  );
});

test("replay rejects forged approval from an agent actor", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const approvalEvent = makeApprovalApprovedEvent(calculateEventHash, stateLedger, {
    actorId: "agent-codex",
    after: {
      approverId: "agent-codex",
      decidedAt: "2026-07-23T09:59:00Z",
      requestedBy: "agent-codex",
      actionType: "scoped_write",
      scope: "project-agency-os:project.next_action_updated",
      riskLevel: "medium",
      entityId: "agent-codex",
    },
  });

  const result = replayLedgerEvents({ ...stateLedger, events: [] }, [
    ...stateLedger.events,
    approvalEvent,
  ]);

  assert.ok(result.errors.some((error) => error.includes("requires person approver actor")));
});

test("replay rejects approval event that changes requested scope", async () => {
  const { calculateEventHash, replayLedgerEvents, stateLedger } = await loadLedger();
  const approvalEvent = makeApprovalApprovedEvent(calculateEventHash, stateLedger, {
    after: {
      approverId: "person-serj",
      decidedAt: "2026-07-23T09:59:00Z",
      requestedBy: "agent-codex",
      actionType: "scoped_write",
      scope: "project-agency-os:wrong-scope",
      riskLevel: "medium",
      entityId: "agent-codex",
    },
  });

  const result = replayLedgerEvents({ ...stateLedger, events: [] }, [
    ...stateLedger.events,
    approvalEvent,
  ]);

  assert.ok(result.errors.some((error) => error.includes("approval details do not match request")));
});
