import { readFile } from "node:fs/promises";

import {
  getReplayDerivedLedger,
  parseLedgerEvents,
  stateLedger,
  type StateLedger,
} from "./ledger";
import { appendProjectNextActionEvent } from "./ledger-writer";

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
