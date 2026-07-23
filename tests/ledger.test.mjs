import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import ts from "typescript";

async function transpileModule(sourcePath, targetPath, rewriteImports = false) {
  let source = await readFile(sourcePath, "utf8");
  if (rewriteImports) {
    const jsonModules = [
      "actors",
      "agent-runs",
      "approvals",
      "blockers",
      "claims",
      "decisions",
      "evidence",
      "projects",
      "traces",
      "work-items",
    ];

    for (const name of jsonModules) {
      source = source.replace(
        `from "../data/${name}.json"`,
        `from "./${name}.js"`,
      );
    }

    source = source.replace(
      'from "../data/events.jsonl?raw"',
      'from "./events-jsonl.js"',
    );
  }
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(targetPath, output.outputText, "utf8");
}

async function loadLedger() {
  const moduleDir = await mkdtemp(join(tmpdir(), "agency-os-ledger-"));
  const jsonModules = [
    "actors",
    "agent-runs",
    "approvals",
    "blockers",
    "claims",
    "decisions",
    "evidence",
    "projects",
    "traces",
    "work-items",
  ];

  await Promise.all(
    jsonModules.map(async (name) => {
      const source = await readFile(new URL(`../data/${name}.json`, import.meta.url), "utf8");
      await writeFile(join(moduleDir, `${name}.js`), `export default ${source};\n`, "utf8");
    }),
  );

  const eventsSource = await readFile(new URL("../data/events.jsonl", import.meta.url), "utf8");
  await writeFile(
    join(moduleDir, "events-jsonl.js"),
    `export default ${JSON.stringify(eventsSource)};\n`,
    "utf8",
  );

  await transpileModule(
    new URL("../app/ledger.ts", import.meta.url),
    join(moduleDir, "ledger.js"),
    true,
  );
  return import(pathToFileURL(join(moduleDir, "ledger.js")).href);
}

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

test("phone review queue exposes actionable short-session cards", async () => {
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

function makeProjectNextActionEvent(calculateEventHash, ledger, overrides = {}) {
  const previousEvent = ledger.events.at(-1);
  const event = {
    schemaVersion: 1,
    sequence: ledger.events.length + 1,
    id: "event-test-next-action",
    timestamp: "2026-07-23T09:00:00Z",
    actorId: "person-serj",
    action: "project.next_action_updated",
    entityType: "project",
    entityId: "project-agency-os",
    before: { nextAction: "old action" },
    after: { nextAction: "Review event reducer output." },
    evidenceIds: [],
    approvalIds: [],
    traceId: null,
    source: "test",
    idempotencyKey: "test-next-action",
    redactionStatus: "not_required",
    retentionClass: "audit",
    previousEventHash: previousEvent?.eventHash ?? null,
    eventHash: "",
    ...overrides,
  };
  event.eventHash = calculateEventHash(event);
  return event;
}

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

  const result = replayLedgerEvents(approvedLedger, [firstEvent, secondEvent]);
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
