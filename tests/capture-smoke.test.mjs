import assert from "node:assert/strict";
import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execAsync = promisify(exec);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

test("capture smoke command writes only to a temporary event log", async () => {
  const beforeEvents = await readFile(new URL("../data/events.jsonl", import.meta.url), "utf8");
  const { stdout } = await execAsync("npm run smoke:capture", {
    cwd: repoRoot,
  });
  const afterEvents = await readFile(new URL("../data/events.jsonl", import.meta.url), "utf8");

  assert.match(stdout, /capture smoke passed using temp log:/);
  assert.equal(afterEvents, beforeEvents);
});
