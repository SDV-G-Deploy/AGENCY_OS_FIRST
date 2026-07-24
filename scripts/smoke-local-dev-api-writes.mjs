import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repoRoot = process.cwd();
const realEventsPath = resolve(repoRoot, "data/events.jsonl");

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function getOpenPort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolvePort(address.port);
          return;
        }
        reject(new Error("unable to allocate local dev smoke port"));
      });
    });
  });
}

function parseEvents(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

function formatServerLog(output) {
  return output.join("").split(/\r?\n/).slice(-80).join("\n");
}

async function waitForServer(baseUrl, output) {
  const deadline = Date.now() + 90_000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.status === 200) {
        return;
      }
      lastError = new Error(`GET / returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(500);
  }

  throw new Error(
    `local dev server did not become ready: ${lastError?.message ?? "unknown error"}\n${formatServerLog(
      output,
    )}`,
  );
}

async function postJson(url, payload, output) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`POST ${url} returned ${response.status}: ${text}\n${formatServerLog(output)}`);
  }

  return JSON.parse(text);
}

async function stopServer(server) {
  if (!server.pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolveStop) => {
      const killer = spawn(
        "cmd.exe",
        ["/d", "/s", "/c", `taskkill /pid ${server.pid} /t /f`],
        { stdio: "ignore" },
      );
      killer.once("close", resolveStop);
      killer.once("error", resolveStop);
    });
    return;
  }

  server.kill("SIGTERM");
  await sleep(1000);
  if (server.exitCode === null) {
    server.kill("SIGKILL");
  }
}

const tempDir = await mkdtemp(join(tmpdir(), "agency-os-local-dev-api-"));
const tempEventsPath = join(tempDir, "events.jsonl");
const realEventsBefore = await readFile(realEventsPath, "utf8");
await writeFile(tempEventsPath, realEventsBefore, "utf8");

const port = await getOpenPort();
const baseUrl = `http://localhost:${port}`;
const command = process.platform === "win32" ? "cmd.exe" : "npm";
const commandArgs =
  process.platform === "win32"
    ? [
        "/d",
        "/s",
        "/c",
        `npm run dev -- --host localhost --port ${port}`,
      ]
    : ["run", "dev", "--", "--host", "localhost", "--port", String(port)];
const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key, value]) => value !== undefined && !key.startsWith("=")),
);
const output = [];
const server = spawn(
  command,
  commandArgs,
  {
    cwd: repoRoot,
    env: {
      ...childEnv,
      AGENCY_OS_EVENTS_PATH: tempEventsPath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

server.stdout.on("data", (chunk) => output.push(chunk.toString()));
server.stderr.on("data", (chunk) => output.push(chunk.toString()));

try {
  await waitForServer(baseUrl, output);

  const beforeEvents = parseEvents(await readFile(tempEventsPath, "utf8"));
  const noteResult = await postJson(
    `${baseUrl}/api/local/capture-note`,
    {
      projectId: "inbox",
      body: "Standard local dev API smoke note written to a temporary ledger.",
      source: "phone",
      createdAt: "2026-07-24T19:15:00.000Z",
      idempotencyKey: "smoke-local-dev-api-capture-note",
    },
    output,
  );
  const reviewResult = await postJson(
    `${baseUrl}/api/local/capture-review`,
    {
      captureId: noteResult.captureId,
      candidateType: "evidence_candidate",
      reviewedAt: "2026-07-24T19:16:00.000Z",
      idempotencyKey: "smoke-local-dev-api-capture-review",
    },
    output,
  );
  const afterEvents = parseEvents(await readFile(tempEventsPath, "utf8"));
  const realEventsAfter = await readFile(realEventsPath, "utf8");
  const noteEvent = afterEvents.find(
    (event) => event.idempotencyKey === "smoke-local-dev-api-capture-note",
  );
  const reviewEvent = afterEvents.find(
    (event) => event.idempotencyKey === "smoke-local-dev-api-capture-review",
  );

  assert.equal(noteResult.ok, true);
  assert.equal(noteResult.appended, true);
  assert.equal(reviewResult.ok, true);
  assert.equal(reviewResult.appended, true);
  assert.equal(afterEvents.length, beforeEvents.length + 2);
  assert.equal(noteEvent.action, "capture.note_created");
  assert.equal(noteEvent.entityId, noteResult.captureId);
  assert.equal(reviewEvent.action, "capture.review_marked");
  assert.equal(reviewEvent.entityId, noteResult.captureId);
  assert.equal(reviewEvent.after.candidateType, "evidence_candidate");
  assert.equal(realEventsAfter, realEventsBefore);

  console.log(`local dev api smoke passed using temp log: ${tempEventsPath}`);
  console.log(`capture note event: ${noteResult.eventId}`);
  console.log(`capture review event: ${reviewResult.eventId}`);
} finally {
  await stopServer(server);
}
