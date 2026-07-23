import { readFile } from "node:fs/promises";

import {
  getReplayDerivedLedger,
  parseLedgerEvents,
  stateLedger,
  type LedgerEvent,
  type StateLedger,
} from "./ledger";
import { appendCaptureNoteEvent, appendProjectNextActionEvent } from "./ledger-writer";

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
