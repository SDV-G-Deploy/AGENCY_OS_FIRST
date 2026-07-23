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
    source = source.replace('from "./ledger"', 'from "./ledger.js"');
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

async function loadLedgerWithWriter() {
  const moduleDir = await mkdtemp(join(tmpdir(), "agency-os-ledger-writer-"));
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
  await writeFile(join(moduleDir, "events.jsonl"), eventsSource, "utf8");

  await transpileModule(
    new URL("../app/ledger.ts", import.meta.url),
    join(moduleDir, "ledger.js"),
    true,
  );
  await transpileModule(
    new URL("../app/ledger-writer.ts", import.meta.url),
    join(moduleDir, "ledger-writer.js"),
    true,
  );

  const ledger = await import(pathToFileURL(join(moduleDir, "ledger.js")).href);
  const writer = await import(pathToFileURL(join(moduleDir, "ledger-writer.js")).href);

  return {
    eventsPath: join(moduleDir, "events.jsonl"),
    ledger,
    writer,
  };
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

function makeApprovalApprovedEvent(calculateEventHash, ledger, overrides = {}) {
  const previousEvent = ledger.events.at(-1);
  const event = {
    schemaVersion: 1,
    sequence: ledger.events.length + 1,
    id: "event-test-approval-approved",
    timestamp: "2026-07-23T09:59:00Z",
    actorId: "person-serj",
    action: "approval.approved",
    entityType: "approval",
    entityId: "approval-first-scoped-write",
    before: { state: "requested" },
    after: {
      approverId: "person-serj",
      decidedAt: "2026-07-23T09:59:00Z",
      requestedBy: "agent-codex",
      actionType: "scoped_write",
      scope: "project-agency-os:project.next_action_updated",
      riskLevel: "medium",
      entityId: "agent-codex",
    },
    evidenceIds: [],
    approvalIds: [],
    traceId: null,
    source: "test",
    idempotencyKey: "test-approval-approved",
    redactionStatus: "not_required",
    retentionClass: "audit",
    previousEventHash: previousEvent?.eventHash ?? null,
    eventHash: "",
    ...overrides,
  };
  event.eventHash = calculateEventHash(event);
  return event;
}

async function appendTestEvent(eventsPath, event) {
  const source = await readFile(eventsPath, "utf8");
  await writeFile(
    eventsPath,
    `${source.trimEnd()}\n${JSON.stringify(event)}\n`,
    "utf8",
  );
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
