import { readFile } from "node:fs/promises";

import {
  getReplayDerivedLedger,
  parseLedgerEvents,
  stateLedger,
  type CaptureRecord,
  type LedgerEvent,
  type StateLedger,
} from "./ledger";
import {
  appendCaptureNoteEvent,
  appendCaptureReviewMarkedEvent,
  appendProjectNextActionEvent,
} from "./ledger-writer";

type ProjectNextActionCommandInput = {
  ledger?: StateLedger;
  eventsPath: string;
  actorId: string;
  projectId: string;
  nextAction: string;
  idempotencyKey: string;
  timestamp: string;
};

type ProjectNextActionCommandResult = {
  ok: boolean;
  errors: string[];
  appended: boolean;
  projectNextAction: string | null;
  eventId: string | null;
};

type CaptureNoteCommandInput = {
  ledger?: StateLedger;
  eventsPath: string;
  actorId: string;
  projectId: string;
  body: string;
  source: string;
  idempotencyKey: string;
  createdAt: string;
  receivedAt: string;
  redactionStatus?: LedgerEvent["redactionStatus"];
};

type CaptureNoteCommandResult = {
  ok: boolean;
  errors: string[];
  appended: boolean;
  captureId: string | null;
  eventId: string | null;
  reviewStatus: string | null;
};

type CaptureReviewMarkedCommandInput = {
  ledger?: StateLedger;
  eventsPath: string;
  actorId: string;
  captureId: string;
  candidateType: string;
  idempotencyKey: string;
  reviewedAt: string;
};

type CaptureReviewMarkedCommandResult = {
  ok: boolean;
  errors: string[];
  appended: boolean;
  captureId: string | null;
  eventId: string | null;
  reviewStatus: string | null;
  candidateType: CaptureRecord["candidateType"];
};

const inboxProjectId = "inbox";
const allowedCaptureSources = new Set([
  "phone",
  "laptop",
  "codex",
  "chatgpt",
  "claude",
  "github",
  "openc-law",
  "openclaw",
  "telegram",
  "manual",
]);
const allowedCaptureRedactionStatuses = new Set([
  "pending_scan",
  "redacted",
  "no_secrets_detected",
  "blocked_sensitive",
]);
const allowedCaptureCandidateTypes = new Set([
  "evidence_candidate",
  "blocker_candidate",
  "decision_candidate",
  "next_action_candidate",
]);

function validateProjectNextActionCommand(
  ledger: StateLedger,
  input: ProjectNextActionCommandInput,
) {
  const errors: string[] = [];
  const actor = ledger.actors.find((item) => item.id === input.actorId);
  const project = ledger.projects.find((item) => item.id === input.projectId);

  if (!actor) {
    errors.push(`unknown actor ${input.actorId}`);
  } else if (actor.actorType !== "person") {
    errors.push("project next-action command is human-only");
  }
  if (!project) {
    errors.push(`unknown project ${input.projectId}`);
  }
  if (!input.nextAction.trim()) {
    errors.push("nextAction is required");
  }
  if (!input.idempotencyKey.trim()) {
    errors.push("idempotencyKey is required");
  }
  if (Number.isNaN(new Date(input.timestamp).getTime())) {
    errors.push("timestamp must be a valid date");
  }

  return errors;
}

function validateCaptureNoteCommand(ledger: StateLedger, input: CaptureNoteCommandInput) {
  const errors: string[] = [];
  const actor = ledger.actors.find((item) => item.id === input.actorId);
  const project =
    input.projectId === inboxProjectId
      ? { id: inboxProjectId }
      : ledger.projects.find((item) => item.id === input.projectId);
  const redactionStatus = input.redactionStatus ?? "pending_scan";

  if (!actor) {
    errors.push(`unknown actor ${input.actorId}`);
  } else if (actor.actorType !== "person") {
    errors.push("capture note command is human-only");
  }
  if (!project) {
    errors.push(`unknown project ${input.projectId}`);
  }
  if (!input.body.trim()) {
    errors.push("body is required");
  }
  if (!allowedCaptureSources.has(input.source)) {
    errors.push(`invalid capture source ${input.source}`);
  }
  if (!input.idempotencyKey.trim()) {
    errors.push("idempotencyKey is required");
  }
  if (Number.isNaN(new Date(input.createdAt).getTime())) {
    errors.push("createdAt must be a valid date");
  }
  if (Number.isNaN(new Date(input.receivedAt).getTime())) {
    errors.push("receivedAt must be a valid date");
  }
  if (!allowedCaptureRedactionStatuses.has(redactionStatus)) {
    errors.push(`invalid capture redaction status ${redactionStatus}`);
  }

  return errors;
}

function validateCaptureReviewMarkedCommand(
  ledger: StateLedger,
  capture: CaptureRecord | undefined,
  input: CaptureReviewMarkedCommandInput,
  hasExistingIdempotencyKey: boolean,
) {
  const errors: string[] = [];
  const actor = ledger.actors.find((item) => item.id === input.actorId);

  if (!actor) {
    errors.push(`unknown actor ${input.actorId}`);
  } else if (actor.actorType !== "person") {
    errors.push("capture review command is human-only");
  }
  if (!input.captureId.trim()) {
    errors.push("captureId is required");
  } else if (!capture) {
    errors.push(`unknown capture ${input.captureId}`);
  } else {
    if (capture.redactionStatus === "blocked_sensitive") {
      errors.push("blocked sensitive captures cannot be reviewed in normal flow");
    }
    if (capture.reviewStatus !== "uncategorized" && !hasExistingIdempotencyKey) {
      errors.push("capture review requires uncategorized capture");
    }
  }
  if (!allowedCaptureCandidateTypes.has(input.candidateType)) {
    errors.push(`invalid capture candidate type ${input.candidateType}`);
  }
  if (!input.idempotencyKey.trim()) {
    errors.push("idempotencyKey is required");
  }
  if (Number.isNaN(new Date(input.reviewedAt).getTime())) {
    errors.push("reviewedAt must be a valid date");
  }

  return errors;
}

export async function runProjectNextActionCommand(
  input: ProjectNextActionCommandInput,
): Promise<ProjectNextActionCommandResult> {
  const ledger = input.ledger ?? stateLedger;
  const inputErrors = validateProjectNextActionCommand(ledger, input);

  if (inputErrors.length > 0) {
    return {
      ok: false,
      errors: inputErrors,
      appended: false,
      projectNextAction: null,
      eventId: null,
    };
  }

  const writeResult = await appendProjectNextActionEvent({
    ledger,
    eventsPath: input.eventsPath,
    actorId: input.actorId,
    projectId: input.projectId,
    nextAction: input.nextAction,
    idempotencyKey: input.idempotencyKey,
    timestamp: input.timestamp,
    source: "local_command",
    redactionStatus: "not_required",
  });

  if (writeResult.errors.length > 0) {
    return {
      ok: false,
      errors: writeResult.errors,
      appended: writeResult.appended,
      projectNextAction: null,
      eventId: writeResult.event?.id ?? null,
    };
  }

  const currentEvents = parseLedgerEvents(await readFile(input.eventsPath, "utf8"));
  const derived = getReplayDerivedLedger({
    ...ledger,
    events: currentEvents,
  });

  if (derived.errors.length > 0) {
    return {
      ok: false,
      errors: derived.errors,
      appended: writeResult.appended,
      projectNextAction: null,
      eventId: writeResult.event?.id ?? null,
    };
  }

  const project = derived.ledger.projects.find((item) => item.id === input.projectId);

  return {
    ok: project?.nextAction === input.nextAction,
    errors: project?.nextAction === input.nextAction ? [] : ["derived state did not confirm nextAction"],
    appended: writeResult.appended,
    projectNextAction: project?.nextAction ?? null,
    eventId: writeResult.event?.id ?? null,
  };
}

export async function runCaptureNoteCommand(
  input: CaptureNoteCommandInput,
): Promise<CaptureNoteCommandResult> {
  const ledger = input.ledger ?? stateLedger;
  const inputErrors = validateCaptureNoteCommand(ledger, input);

  if (inputErrors.length > 0) {
    return {
      ok: false,
      errors: inputErrors,
      appended: false,
      captureId: null,
      eventId: null,
      reviewStatus: null,
    };
  }

  const writeResult = await appendCaptureNoteEvent({
    ledger,
    eventsPath: input.eventsPath,
    actorId: input.actorId,
    projectId: input.projectId,
    body: input.body,
    source: input.source,
    idempotencyKey: input.idempotencyKey,
    createdAt: input.createdAt,
    receivedAt: input.receivedAt,
    redactionStatus: input.redactionStatus ?? "pending_scan",
    eventSource: "local_command",
  });

  if (writeResult.errors.length > 0) {
    return {
      ok: false,
      errors: writeResult.errors,
      appended: writeResult.appended,
      captureId: writeResult.event?.entityId ?? null,
      eventId: writeResult.event?.id ?? null,
      reviewStatus: null,
    };
  }

  const currentEvents = parseLedgerEvents(await readFile(input.eventsPath, "utf8"));
  const derived = getReplayDerivedLedger({
    ...ledger,
    events: currentEvents,
  });

  if (derived.errors.length > 0) {
    return {
      ok: false,
      errors: derived.errors,
      appended: writeResult.appended,
      captureId: writeResult.event?.entityId ?? null,
      eventId: writeResult.event?.id ?? null,
      reviewStatus: null,
    };
  }

  const capture = derived.ledger.captures.find(
    (item) => item.id === writeResult.event?.entityId,
  );

  return {
    ok: Boolean(capture),
    errors: capture ? [] : ["derived state did not confirm capture"],
    appended: writeResult.appended,
    captureId: capture?.id ?? writeResult.event?.entityId ?? null,
    eventId: writeResult.event?.id ?? null,
    reviewStatus: capture?.reviewStatus ?? null,
  };
}

export async function runCaptureReviewMarkedCommand(
  input: CaptureReviewMarkedCommandInput,
): Promise<CaptureReviewMarkedCommandResult> {
  const ledger = input.ledger ?? stateLedger;
  const currentEvents = parseLedgerEvents(await readFile(input.eventsPath, "utf8"));
  const currentDerived = getReplayDerivedLedger({
    ...ledger,
    events: currentEvents,
  });

  if (currentDerived.errors.length > 0) {
    return {
      ok: false,
      errors: currentDerived.errors,
      appended: false,
      captureId: null,
      eventId: null,
      reviewStatus: null,
      candidateType: null,
    };
  }

  const currentCapture = currentDerived.ledger.captures.find(
    (item) => item.id === input.captureId,
  );
  const hasExistingIdempotencyKey = currentEvents.some(
    (event) => event.idempotencyKey === input.idempotencyKey,
  );
  const inputErrors = validateCaptureReviewMarkedCommand(
    ledger,
    currentCapture,
    input,
    hasExistingIdempotencyKey,
  );

  if (inputErrors.length > 0) {
    return {
      ok: false,
      errors: inputErrors,
      appended: false,
      captureId: currentCapture?.id ?? null,
      eventId: null,
      reviewStatus: currentCapture?.reviewStatus ?? null,
      candidateType: currentCapture?.candidateType ?? null,
    };
  }

  const writeResult = await appendCaptureReviewMarkedEvent({
    ledger,
    eventsPath: input.eventsPath,
    actorId: input.actorId,
    captureId: input.captureId,
    candidateType: input.candidateType as Exclude<CaptureRecord["candidateType"], null>,
    idempotencyKey: input.idempotencyKey,
    reviewedAt: input.reviewedAt,
    eventSource: "local_command",
  });

  if (writeResult.errors.length > 0) {
    return {
      ok: false,
      errors: writeResult.errors,
      appended: writeResult.appended,
      captureId: writeResult.event?.entityId ?? input.captureId,
      eventId: writeResult.event?.id ?? null,
      reviewStatus: null,
      candidateType: null,
    };
  }

  const updatedEvents = parseLedgerEvents(await readFile(input.eventsPath, "utf8"));
  const updatedDerived = getReplayDerivedLedger({
    ...ledger,
    events: updatedEvents,
  });

  if (updatedDerived.errors.length > 0) {
    return {
      ok: false,
      errors: updatedDerived.errors,
      appended: writeResult.appended,
      captureId: writeResult.event?.entityId ?? input.captureId,
      eventId: writeResult.event?.id ?? null,
      reviewStatus: null,
      candidateType: null,
    };
  }

  const capture = updatedDerived.ledger.captures.find(
    (item) => item.id === writeResult.event?.entityId,
  );
  const confirmed =
    capture?.reviewStatus === "triaged" && capture.candidateType === input.candidateType;

  return {
    ok: confirmed,
    errors: confirmed ? [] : ["derived state did not confirm capture review"],
    appended: writeResult.appended,
    captureId: capture?.id ?? writeResult.event?.entityId ?? input.captureId,
    eventId: writeResult.event?.id ?? null,
    reviewStatus: capture?.reviewStatus ?? null,
    candidateType: capture?.candidateType ?? null,
  };
}
