import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = process.cwd();
const realEventsPath = resolve(repoRoot, "data/events.jsonl");

async function transpileModule(sourcePath, targetPath, rewriteImports = false) {
  let source = await readFile(sourcePath, "utf8");

  if (rewriteImports) {
    for (const name of [
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
    ]) {
      source = source.replace(`from "../data/${name}.json"`, `from "./${name}.js"`);
    }

    source = source.replace(
      'from "../data/events.jsonl?raw"',
      'from "./events-jsonl.js"',
    );
    source = source.replace('from "./ledger"', 'from "./ledger.js"');
    source = source.replace('from "./ledger-writer"', 'from "./ledger-writer.js"');
    source = source.replace('from "./local-events-path"', 'from "./local-events-path.js"');
  }

  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(targetPath, output.outputText, "utf8");
}

async function prepareSmokeWorkspace() {
  const moduleDir = await mkdtemp(join(tmpdir(), "agency-os-capture-smoke-"));
  const eventsSource = await readFile(realEventsPath, "utf8");

  await Promise.all(
    [
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
    ].map(async (name) => {
      const source = await readFile(resolve(repoRoot, `data/${name}.json`), "utf8");
      await writeFile(join(moduleDir, `${name}.js`), `export default ${source};\n`, "utf8");
    }),
  );

  await writeFile(
    join(moduleDir, "events-jsonl.js"),
    `export default ${JSON.stringify(eventsSource)};\n`,
    "utf8",
  );
  await writeFile(join(moduleDir, "events.jsonl"), eventsSource, "utf8");
  await transpileModule(
    resolve(repoRoot, "app/local-events-path.ts"),
    join(moduleDir, "local-events-path.js"),
    true,
  );
  await transpileModule(resolve(repoRoot, "app/ledger.ts"), join(moduleDir, "ledger.js"), true);
  await transpileModule(
    resolve(repoRoot, "app/ledger-writer.ts"),
    join(moduleDir, "ledger-writer.js"),
    true,
  );
  await transpileModule(
    resolve(repoRoot, "app/local-command.ts"),
    join(moduleDir, "local-command.js"),
    true,
  );

  return {
    eventsPath: join(moduleDir, "events.jsonl"),
    moduleDir,
    realEventsBefore: eventsSource,
  };
}

const { eventsPath, moduleDir, realEventsBefore } = await prepareSmokeWorkspace();
const command = await import(pathToFileURL(join(moduleDir, "local-command.js")).href);
const ledger = await import(pathToFileURL(join(moduleDir, "ledger.js")).href);
const beforeTempEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
const result = await command.runCaptureNoteCommand({
  ledger: ledger.stateLedger,
  eventsPath,
  actorId: "person-serj",
  projectId: "inbox",
  body: "Smoke test capture note written to a temporary event log.",
  source: "phone",
  idempotencyKey: "smoke-capture-note-temp-only",
  createdAt: "2026-07-24T00:00:00Z",
  receivedAt: "2026-07-24T00:00:01Z",
});
const afterTempEvents = ledger.parseLedgerEvents(await readFile(eventsPath, "utf8"));
const realEventsAfter = await readFile(realEventsPath, "utf8");

assert.equal(result.ok, true);
assert.equal(result.appended, true);
assert.equal(afterTempEvents.length, beforeTempEvents.length + 1);
assert.equal(afterTempEvents.at(-1).action, "capture.note_created");
assert.equal(afterTempEvents.at(-1).entityType, "capture");
assert.equal(afterTempEvents.at(-1).entityId, result.captureId);
assert.equal(realEventsAfter, realEventsBefore);

console.log(`capture smoke passed using temp log: ${eventsPath}`);
