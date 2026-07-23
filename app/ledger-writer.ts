import { appendFile, open, readFile, unlink } from "node:fs/promises";

import {
  calculateEventHash,
  parseLedgerEvents,
  replayLedgerEvents,
  stateLedger,
  validateEventLog,
  type CaptureRecord,
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

type CaptureNoteWriteInput = {
  ledger?: StateLedger;
  eventsPath: string;
  actorId: string;
  projectId: string;
  body: string;
  source: string;
  idempotencyKey: string;
  createdAt: string;
  receivedAt: string;
  traceId?: string | null;
  redactionStatus?: LedgerEvent["redactionStatus"];
  eventSource?: string;
};

type CaptureNoteWriteResult = ProjectNextActionWriteResult;

type CaptureReviewMarkedWriteInput = {
  ledger?: StateLedger;
  eventsPath: string;
  actorId: string;
  captureId: string;
  candidateType: Exclude<CaptureRecord["candidateType"], null>;
  idempotencyKey: string;
  reviewedAt: string;
  traceId?: string | null;
  eventSource?: string;
};

type CaptureReviewMarkedWriteResult = ProjectNextActionWriteResult;

type LockHandle = Awaited<ReturnType<typeof open>>;

function eventIdFromIdempotencyKey(idempotencyKey: string) {
  const safeKey = idempotencyKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `event-${safeKey || "generated"}`;
}

function captureIdFromIdempotencyKey(idempotencyKey: string) {
  const safeKey = idempotencyKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `capture-${safeKey || "generated"}`;
}

function getReferenceSets(ledger: StateLedger) {
  return {
    evidenceIds: new Set(ledger.evidence.map((evidence) => evidence.id)),
    approvalIds: new Set(ledger.approvals.map((approval) => approval.id)),
    traceIds: new Set(ledger.traces.map((trace) => trace.id)),
  };
}

function resetApprovalsForEventReplay(ledger: StateLedger): StateLedger {
  return {
    ...ledger,
    approvals: ledger.approvals.map((approval) => ({
      ...approval,
      state: "requested",
      approverId: null,
      decidedAt: null,
      usedAt: null,
      usedByEventId: null,
    })),
  };
}

function comparableIdempotencyPayload(event: LedgerEvent) {
  return JSON.stringify({
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    after: event.after,
    approvalIds: event.approvalIds,
    traceId: event.traceId,
    source: event.source,
    idempotencyKey: event.idempotencyKey,
    redactionStatus: event.redactionStatus,
    retentionClass: event.retentionClass,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function acquireLock(lockPath: string, attempts = 50): Promise<LockHandle> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await open(lockPath, "wx");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || attempt === attempts - 1) {
        throw error;
      }
      await sleep(20);
    }
  }

  throw new Error(`Unable to acquire lock ${lockPath}`);
}

async function withEventsLock<T>(eventsPath: string, work: () => Promise<T>) {
  const lockPath = `${eventsPath}.lock`;
  const lock = await acquireLock(lockPath);

  try {
    await lock.writeFile(`${process.pid}:${Date.now()}`);
    return await work();
  } finally {
    await lock.close();
    await unlink(lockPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
  }
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

export function buildCaptureNoteEvent({
  ledger = stateLedger,
  actorId,
  projectId,
  body,
  source,
  idempotencyKey,
  createdAt,
  receivedAt,
  traceId = null,
  redactionStatus = "pending_scan",
  eventSource = "local_writer",
}: Omit<CaptureNoteWriteInput, "eventsPath">) {
  const previousEvent = ledger.events.at(-1);
  const captureId = captureIdFromIdempotencyKey(idempotencyKey);
  const event: LedgerEvent = {
    schemaVersion: 1,
    sequence: ledger.events.length + 1,
    id: eventIdFromIdempotencyKey(idempotencyKey),
    timestamp: receivedAt,
    actorId,
    action: "capture.note_created",
    entityType: "capture",
    entityId: captureId,
    before: null,
    after: {
      id: captureId,
      projectId,
      actorId,
      source,
      body,
      createdAt,
      receivedAt,
      redactionStatus,
      classification: "inbox",
      linkedEntityIds: [],
      reviewStatus: "uncategorized",
    },
    evidenceIds: [],
    approvalIds: [],
    traceId,
    source: eventSource,
    idempotencyKey,
    redactionStatus,
    retentionClass: "operational",
    previousEventHash: previousEvent?.eventHash ?? null,
    eventHash: "",
  };

  event.eventHash = calculateEventHash(event);
  return event;
}

export function buildCaptureReviewMarkedEvent({
  ledger = stateLedger,
  actorId,
  captureId,
  candidateType,
  idempotencyKey,
  reviewedAt,
  traceId = null,
  eventSource = "local_writer",
}: Omit<CaptureReviewMarkedWriteInput, "eventsPath">) {
  const previousEvent = ledger.events.at(-1);
  const capture = ledger.captures.find((item) => item.id === captureId);
  const event: LedgerEvent = {
    schemaVersion: 1,
    sequence: ledger.events.length + 1,
    id: eventIdFromIdempotencyKey(idempotencyKey),
    timestamp: reviewedAt,
    actorId,
    action: "capture.review_marked",
    entityType: "capture",
    entityId: captureId,
    before: {
      classification: capture?.classification ?? null,
      candidateType: capture?.candidateType ?? null,
      reviewStatus: capture?.reviewStatus ?? null,
      reviewedAt: capture?.reviewedAt ?? null,
    },
    after: {
      captureId,
      reviewStatus: "triaged",
      candidateType,
      reviewedAt,
    },
    evidenceIds: [],
    approvalIds: [],
    traceId,
    source: eventSource,
    idempotencyKey,
    redactionStatus: "not_required",
    retentionClass: "operational",
    previousEventHash: previousEvent?.eventHash ?? null,
    eventHash: "",
  };

  event.eventHash = calculateEventHash(event);
  return event;
}

function buildApprovalUsedEvent({
  ledger,
  approvalId,
  usedByEventId,
  timestamp,
  idempotencyKey,
}: {
  ledger: StateLedger;
  approvalId: string;
  usedByEventId: string;
  timestamp: string;
  idempotencyKey: string;
}) {
  const previousEvent = ledger.events.at(-1);
  const event: LedgerEvent = {
    schemaVersion: 1,
    sequence: ledger.events.length + 1,
    id: eventIdFromIdempotencyKey(idempotencyKey),
    timestamp,
    actorId: "system-local-verifier",
    action: "approval.used",
    entityType: "approval",
    entityId: approvalId,
    before: null,
    after: {
      usedAt: timestamp,
      usedByEventId,
    },
    evidenceIds: [],
    approvalIds: [],
    traceId: null,
    source: "local_writer",
    idempotencyKey,
    redactionStatus: "not_required",
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
  return withEventsLock(eventsPath, async () => {
  const currentEventsSource = await readFile(eventsPath, "utf8");
  const currentEvents = parseLedgerEvents(currentEventsSource);
  const replayedCurrent = replayLedgerEvents(
    { ...resetApprovalsForEventReplay(ledger), events: [] },
    currentEvents,
  );
  if (replayedCurrent.errors.length > 0) {
    return {
      appended: false,
      event: null,
      errors: replayedCurrent.errors,
      ignoredEventIds: [],
    };
  }

  const ledgerForWrite: StateLedger = {
    ...replayedCurrent.ledger,
    events: currentEvents,
  };

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

  const existingEvent = currentEvents.find((item) => item.idempotencyKey === idempotencyKey);
  if (existingEvent) {
    if (comparableIdempotencyPayload(existingEvent) !== comparableIdempotencyPayload(event)) {
      return {
        appended: false,
        event: existingEvent,
        errors: [`idempotency conflict for ${idempotencyKey}`],
        ignoredEventIds: [],
      };
    }

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

  const replayResult = replayLedgerEvents(ledgerForWrite, [event]);

  if (replayResult.errors.length > 0) {
    return {
      appended: false,
      event,
      errors: replayResult.errors,
      ignoredEventIds: replayResult.ignoredEventIds,
    };
  }

  const eventsToAppend = [event];
  const approvalsUsedByEvent = replayResult.ledger.approvals.filter(
    (approval) => approval.usedByEventId === event.id,
  );

  for (const approval of approvalsUsedByEvent) {
    eventsToAppend.push(
      buildApprovalUsedEvent({
        ledger: {
          ...ledgerForWrite,
          events: [...currentEvents, ...eventsToAppend],
        },
        approvalId: approval.id,
        usedByEventId: event.id,
        timestamp,
        idempotencyKey: `${idempotencyKey}:approval-used:${approval.id}`,
      }),
    );
  }

  const fullReplayResult = replayLedgerEvents(ledgerForWrite, eventsToAppend);

  if (fullReplayResult.errors.length > 0) {
    return {
      appended: false,
      event,
      errors: fullReplayResult.errors,
      ignoredEventIds: fullReplayResult.ignoredEventIds,
    };
  }

  const needsLeadingNewline = currentEventsSource.trim().length > 0 && !currentEventsSource.endsWith("\n");
  await appendFile(
    eventsPath,
    `${needsLeadingNewline ? "\n" : ""}${eventsToAppend
      .map((item) => JSON.stringify(item))
      .join("\n")}\n`,
    "utf8",
  );

  return {
    appended: true,
    event,
    errors: [],
    ignoredEventIds: [],
  };
  });
}

export async function appendCaptureNoteEvent({
  ledger = stateLedger,
  eventsPath,
  actorId,
  projectId,
  body,
  source,
  idempotencyKey,
  createdAt,
  receivedAt,
  traceId = null,
  redactionStatus = "pending_scan",
  eventSource = "local_writer",
}: CaptureNoteWriteInput): Promise<CaptureNoteWriteResult> {
  return withEventsLock(eventsPath, async () => {
    const currentEventsSource = await readFile(eventsPath, "utf8");
    const currentEvents = parseLedgerEvents(currentEventsSource);
    const replayedCurrent = replayLedgerEvents(
      { ...resetApprovalsForEventReplay(ledger), events: [] },
      currentEvents,
    );

    if (replayedCurrent.errors.length > 0) {
      return {
        appended: false,
        event: null,
        errors: replayedCurrent.errors,
        ignoredEventIds: [],
      };
    }

    const ledgerForWrite: StateLedger = {
      ...replayedCurrent.ledger,
      events: currentEvents,
    };

    const event = buildCaptureNoteEvent({
      ledger: ledgerForWrite,
      actorId,
      projectId,
      body,
      source,
      idempotencyKey,
      createdAt,
      receivedAt,
      traceId,
      redactionStatus,
      eventSource,
    });

    const existingEvent = currentEvents.find((item) => item.idempotencyKey === idempotencyKey);
    if (existingEvent) {
      if (comparableIdempotencyPayload(existingEvent) !== comparableIdempotencyPayload(event)) {
        return {
          appended: false,
          event: existingEvent,
          errors: [`idempotency conflict for ${idempotencyKey}`],
          ignoredEventIds: [],
        };
      }

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

    const replayResult = replayLedgerEvents(ledgerForWrite, [event]);

    if (replayResult.errors.length > 0) {
      return {
        appended: false,
        event,
        errors: replayResult.errors,
        ignoredEventIds: replayResult.ignoredEventIds,
      };
    }

    const needsLeadingNewline =
      currentEventsSource.trim().length > 0 && !currentEventsSource.endsWith("\n");
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
  });
}

export async function appendCaptureReviewMarkedEvent({
  ledger = stateLedger,
  eventsPath,
  actorId,
  captureId,
  candidateType,
  idempotencyKey,
  reviewedAt,
  traceId = null,
  eventSource = "local_writer",
}: CaptureReviewMarkedWriteInput): Promise<CaptureReviewMarkedWriteResult> {
  return withEventsLock(eventsPath, async () => {
    const currentEventsSource = await readFile(eventsPath, "utf8");
    const currentEvents = parseLedgerEvents(currentEventsSource);
    const replayedCurrent = replayLedgerEvents(
      { ...resetApprovalsForEventReplay(ledger), events: [] },
      currentEvents,
    );

    if (replayedCurrent.errors.length > 0) {
      return {
        appended: false,
        event: null,
        errors: replayedCurrent.errors,
        ignoredEventIds: [],
      };
    }

    const ledgerForWrite: StateLedger = {
      ...replayedCurrent.ledger,
      events: currentEvents,
    };

    const event = buildCaptureReviewMarkedEvent({
      ledger: ledgerForWrite,
      actorId,
      captureId,
      candidateType,
      idempotencyKey,
      reviewedAt,
      traceId,
      eventSource,
    });

    const existingEvent = currentEvents.find((item) => item.idempotencyKey === idempotencyKey);
    if (existingEvent) {
      if (comparableIdempotencyPayload(existingEvent) !== comparableIdempotencyPayload(event)) {
        return {
          appended: false,
          event: existingEvent,
          errors: [`idempotency conflict for ${idempotencyKey}`],
          ignoredEventIds: [],
        };
      }

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

    const replayResult = replayLedgerEvents(ledgerForWrite, [event]);

    if (replayResult.errors.length > 0) {
      return {
        appended: false,
        event,
        errors: replayResult.errors,
        ignoredEventIds: replayResult.ignoredEventIds,
      };
    }

    const needsLeadingNewline =
      currentEventsSource.trim().length > 0 && !currentEventsSource.endsWith("\n");
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
  });
}
