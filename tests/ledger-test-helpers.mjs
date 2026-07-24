import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    source = source.replace(
      'from "../../../local-events-path"',
      'from "./local-events-path.js"',
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

export async function loadLedger() {
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

export async function loadLedgerWithWriter() {
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

export async function loadLocalCommand() {
  const loaded = await loadLedgerWithWriter();
  const moduleDir = loaded.eventsPath.replace(/\\events\.jsonl$/, "").replace(/\/events\.jsonl$/, "");

  await transpileModule(
    new URL("../app/local-command.ts", import.meta.url),
    join(moduleDir, "local-command.js"),
    true,
  );
  await transpileModule(
    new URL("../app/local-events-path.ts", import.meta.url),
    join(moduleDir, "local-events-path.js"),
    true,
  );

  return {
    ...loaded,
    command: await import(pathToFileURL(join(moduleDir, "local-command.js")).href),
  };
}

export async function loadLocalApiRoute() {
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

export async function loadLocalCaptureApiRoute() {
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

export async function loadLocalCaptureReviewApiRoute() {
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
export function makeProjectNextActionEvent(calculateEventHash, ledger, overrides = {}) {
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

export function makeCaptureNoteEvent(calculateEventHash, ledger, overrides = {}) {
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

export function makeCaptureReviewMarkedEvent(calculateEventHash, ledger, overrides = {}) {
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

export function makeApprovalApprovedEvent(calculateEventHash, ledger, overrides = {}) {
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

export async function appendTestEvent(eventsPath, event) {
  const source = await readFile(eventsPath, "utf8");
  await writeFile(
    eventsPath,
    `${source.trimEnd()}\n${JSON.stringify(event)}\n`,
    "utf8",
  );
}
