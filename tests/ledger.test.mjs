import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
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
    source = source.replace('from "./ledger-writer"', 'from "./ledger-writer.js"');
    source = source.replace('from "../../../local-command"', 'from "./local-command.js"');
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

async function loadLocalCommand() {
  const loaded = await loadLedgerWithWriter();
  const moduleDir = loaded.eventsPath.replace(/\\events\.jsonl$/, "").replace(/\/events\.jsonl$/, "");

  await transpileModule(
    new URL("../app/local-command.ts", import.meta.url),
    join(moduleDir, "local-command.js"),
    true,
  );

  return {
    ...loaded,
    command: await import(pathToFileURL(join(moduleDir, "local-command.js")).href),
  };
}

async function loadLocalApiRoute() {
  const loaded = await loadLocalCommand();
  const moduleDir = loaded.eventsPath.replace(/\\events\.jsonl$/, "").replace(/\/events\.jsonl$/, "");
  const dataDir = join(moduleDir, "data");
  const eventsSource = await readFile(new URL("../data/events.jsonl", import.meta.url), "utf8");

  await mkdir(dataDir);
  await writeFile(join(dataDir, "events.jsonl"), eventsSource, "utf8");
  await transpileModule(
    new URL("../app/api/local/next-action/route.ts", import.meta.url),
    join(moduleDir, "next-action-route.js"),
    true,
  );

  return {
    ...loaded,
    eventsPath: join(dataDir, "events.jsonl"),
    moduleDir,
    route: await import(pathToFileURL(join(moduleDir, "next-action-route.js")).href),
  };
}

async function loadLocalCaptureApiRoute() {
  const loaded = await loadLocalCommand();
  const moduleDir = loaded.eventsPath.replace(/\\events\.jsonl$/, "").replace(/\/events\.jsonl$/, "");
  const dataDir = join(moduleDir, "data");
  const eventsSource = await readFile(new URL("../data/events.jsonl", import.meta.url), "utf8");

  await mkdir(dataDir);
  await writeFile(join(dataDir, "events.jsonl"), eventsSource, "utf8");
  await transpileModule(
    new URL("../app/api/local/capture-note/route.ts", import.meta.url),
    join(moduleDir, "capture-note-route.js"),
    true,
  );

  return {
    ...loaded,
    eventsPath: join(dataDir, "events.jsonl"),
    moduleDir,
    route: await import(pathToFileURL(join(moduleDir, "capture-note-route.js")).href),
  };
}

async function loadLocalCaptureReviewApiRoute() {
  const loaded = await loadLocalCommand();
  const moduleDir = loaded.eventsPath.replace(/\\events\.jsonl$/, "").replace(/\/events\.jsonl$/, "");
  const dataDir = join(moduleDir, "data");
  const eventsSource = await readFile(new URL("../data/events.jsonl", import.meta.url), "utf8");

  await mkdir(dataDir);
  await writeFile(join(dataDir, "events.jsonl"), eventsSource, "utf8");
  await transpileModule(
    new URL("../app/api/local/capture-review/route.ts", import.meta.url),
    join(moduleDir, "capture-review-route.js"),
    true,
  );

  return {
    ...loaded,
    eventsPath: join(dataDir, "events.jsonl"),
    moduleDir,
    route: await import(pathToFileURL(join(moduleDir, "capture-review-route.js")).href),
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

test("phone review queue exposes short-session review cards", async () => {
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

test("verified claims require every declared verified evidence type", async () => {
  const { stateLedger, validateLedger } = await loadLedger();
  const claims = stateLedger.claims.map((claim) =>
    claim.id === "claim-v0-2-local-verify"
      ? { ...claim, linkedEvidenceIds: ["evidence-local-v0-2-verify"] }
      : claim,
  );

  const errors = validateLedger({
    ...stateLedger,
    claims,
  });

  assert.ok(
    errors.some((error) =>
      error.includes("claim claim-v0-2-local-verify missing verified evidence type local_url"),
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

function makeCaptureNoteEvent(calculateEventHash, ledger, overrides = {}) {
  const previousEvent = ledger.events.at(-1);
  const { after: afterOverrides, ...eventOverrides } = overrides;
  const baseAfter = {
    id: "capture-test-note",
    projectId: "project-agency-os",
    actorId: "person-serj",
    source: "phone",
    body: "Captured from a short phone session.",
    createdAt: "2026-07-23T11:00:00Z",
    receivedAt: "2026-07-23T11:00:02Z",
    redactionStatus: "pending_scan",
    classification: "inbox",
    linkedEntityIds: [],
    reviewStatus: "uncategorized",
  };
  const event = {
    schemaVersion: 1,
    sequence: ledger.events.length + 1,
    id: "event-test-capture-note",
    timestamp: "2026-07-23T11:00:02Z",
    actorId: "person-serj",
    action: "capture.note_created",
    entityType: "capture",
    entityId: "capture-test-note",
    before: null,
    after: { ...baseAfter, ...(afterOverrides ?? {}) },
    evidenceIds: [],
    approvalIds: [],
    traceId: null,
    source: "test",
    idempotencyKey: "test-capture-note",
    redactionStatus: "pending_scan",
    retentionClass: "operational",
    previousEventHash: previousEvent?.eventHash ?? null,
    eventHash: "",
    ...eventOverrides,
  };
  event.eventHash = calculateEventHash(event);
  return event;
}

function makeCaptureReviewMarkedEvent(calculateEventHash, ledger, overrides = {}) {
  const previousEvent = ledger.events.at(-1);
  const { after: afterOverrides, ...eventOverrides } = overrides;
  const baseAfter = {
    captureId: "capture-test-note",
    reviewStatus: "triaged",
    candidateType: "evidence_candidate",
    reviewedAt: "2026-07-23T11:10:00Z",
  };
  const event = {
    schemaVersion: 1,
    sequence: ledger.events.length + 1,
    id: "event-test-capture-review-marked",
    timestamp: "2026-07-23T11:10:00Z",
    actorId: "person-serj",
    action: "capture.review_marked",
    entityType: "capture",
    entityId: "capture-test-note",
    before: null,
    after: { ...baseAfter, ...(afterOverrides ?? {}) },
    evidenceIds: [],
    approvalIds: [],
    traceId: null,
    source: "test",
    idempotencyKey: "test-capture-review-marked",
    redactionStatus: "not_required",
    retentionClass: "operational",
    previousEventHash: previousEvent?.eventHash ?? null,
    eventHash: "",
    ...eventOverrides,
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
