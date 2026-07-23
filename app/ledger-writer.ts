import { appendFile, readFile } from "node:fs/promises";

import {
  calculateEventHash,
  parseLedgerEvents,
  replayLedgerEvents,
  stateLedger,
  validateEventLog,
  type LedgerEvent,
  type StateLedger,
} from "./ledger";

type ProjectNextActionWriteInput = {
  ledger?: StateLedger;
  eventsPath: string;
  actorId: string;
  projectId: string;
  nextAction: string;
  idempotencyKey: string;
  approvalIds?: string[];
  traceId?: string | null;
  timestamp: string;
  source?: string;
  redactionStatus?: LedgerEvent["redactionStatus"];
};

type ProjectNextActionWriteResult = {
  appended: boolean;
  event: LedgerEvent | null;
  errors: string[];
  ignoredEventIds: string[];
};

function eventIdFromIdempotencyKey(idempotencyKey: string) {
  const safeKey = idempotencyKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `event-${safeKey || "generated"}`;
}

function getReferenceSets(ledger: StateLedger) {
  return {
    evidenceIds: new Set(ledger.evidence.map((evidence) => evidence.id)),
    approvalIds: new Set(ledger.approvals.map((approval) => approval.id)),
    traceIds: new Set(ledger.traces.map((trace) => trace.id)),
  };
}

export function buildProjectNextActionEvent({
  ledger = stateLedger,
  actorId,
  projectId,
  nextAction,
  idempotencyKey,
  approvalIds = [],
  traceId = null,
  timestamp,
  source = "local_writer",
  redactionStatus = "not_required",
}: Omit<ProjectNextActionWriteInput, "eventsPath">) {
  const previousEvent = ledger.events.at(-1);
  const project = ledger.projects.find((item) => item.id === projectId);
  const event: LedgerEvent = {
    schemaVersion: 1,
    sequence: ledger.events.length + 1,
    id: eventIdFromIdempotencyKey(idempotencyKey),
    timestamp,
    actorId,
    action: "project.next_action_updated",
    entityType: "project",
    entityId: projectId,
    before: {
      nextAction: project?.nextAction ?? null,
    },
    after: {
      nextAction,
    },
    evidenceIds: [],
    approvalIds,
    traceId,
    source,
    idempotencyKey,
    redactionStatus,
    retentionClass: "audit",
    previousEventHash: previousEvent?.eventHash ?? null,
    eventHash: "",
  };

  event.eventHash = calculateEventHash(event);
  return event;
}

export async function appendProjectNextActionEvent({
  ledger = stateLedger,
  eventsPath,
  actorId,
  projectId,
  nextAction,
  idempotencyKey,
  approvalIds = [],
  traceId = null,
  timestamp,
  source = "local_writer",
  redactionStatus = "not_required",
}: ProjectNextActionWriteInput): Promise<ProjectNextActionWriteResult> {
  const currentEventsSource = await readFile(eventsPath, "utf8");
  const currentEvents = parseLedgerEvents(currentEventsSource);
  const ledgerForWrite: StateLedger = {
    ...ledger,
    events: currentEvents,
  };

  const existingEvent = currentEvents.find((event) => event.idempotencyKey === idempotencyKey);
  if (existingEvent) {
    return {
      appended: false,
      event: existingEvent,
      errors: [],
      ignoredEventIds: [existingEvent.id],
    };
  }

  const existingErrors = validateEventLog(currentEvents, getReferenceSets(ledgerForWrite));
  if (existingErrors.length > 0) {
    return {
      appended: false,
      event: null,
      errors: existingErrors,
      ignoredEventIds: [],
    };
  }

  const event = buildProjectNextActionEvent({
    ledger: ledgerForWrite,
    actorId,
    projectId,
    nextAction,
    idempotencyKey,
    approvalIds,
    traceId,
    timestamp,
    source,
    redactionStatus,
  });
  const replayResult = replayLedgerEvents(ledgerForWrite, [event]);

  if (replayResult.errors.length > 0) {
    return {
      appended: false,
      event,
      errors: replayResult.errors,
      ignoredEventIds: replayResult.ignoredEventIds,
    };
  }

  const needsLeadingNewline = currentEventsSource.trim().length > 0 && !currentEventsSource.endsWith("\n");
  await appendFile(
    eventsPath,
    `${needsLeadingNewline ? "\n" : ""}${JSON.stringify(event)}\n`,
    "utf8",
  );

  return {
    appended: true,
    event,
    errors: [],
    ignoredEventIds: [],
  };
}
