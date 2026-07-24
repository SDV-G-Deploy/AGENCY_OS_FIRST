import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  backupArtifactType,
  backupSchemaVersion,
  createLedgerBackup,
  parseLedgerEventsStrict,
  restoreLedgerBackup,
  sha256Hex,
} from "../scripts/ledger-backup-lib.mjs";

async function makeTempLedger() {
  const tempDir = await mkdtemp(join(tmpdir(), "agency-os-ledger-backup-test-"));
  const eventsSource = await readFile(new URL("../data/events.jsonl", import.meta.url), "utf8");
  const eventsPath = join(tempDir, "events.jsonl");
  await writeFile(eventsPath, eventsSource, "utf8");

  return {
    tempDir,
    eventsPath,
    eventsSource,
  };
}

async function makeBackupFromSource(source) {
  const tempDir = await mkdtemp(join(tmpdir(), "agency-os-ledger-backup-bundle-test-"));
  const eventsPath = join(tempDir, "candidate.jsonl");
  await writeFile(eventsPath, source, "utf8");
  return createLedgerBackup({
    eventsPath,
    outputRoot: join(tempDir, "backups"),
    now: new Date("2026-07-25T10:00:00.000Z"),
  });
}

async function makeUncheckedBackupFromSource(source, eventCount) {
  const tempDir = await mkdtemp(join(tmpdir(), "agency-os-ledger-bad-backup-test-"));
  const artifactDir = join(tempDir, "backup");
  const eventsPath = join(artifactDir, "events.jsonl");
  const metadataPath = join(artifactDir, "metadata.json");
  const metadata = {
    schemaVersion: backupSchemaVersion,
    artifactType: backupArtifactType,
    createdAt: "2026-07-25T10:00:00.000Z",
    sourcePath: eventsPath,
    sourceSha256: sha256Hex(source),
    eventCount,
    eventLogFile: "events.jsonl",
  };

  await mkdir(artifactDir, { recursive: true });
  await writeFile(eventsPath, source, "utf8");
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  return { artifactDir, eventsPath, metadataPath, metadata };
}

test("ledger backup creates a timestamped bundle with metadata without mutating source", async () => {
  const { tempDir, eventsPath, eventsSource } = await makeTempLedger();
  const result = await createLedgerBackup({
    eventsPath,
    outputRoot: join(tempDir, "backups"),
    now: new Date("2026-07-25T09:00:00.000Z"),
  });
  const metadata = JSON.parse(await readFile(result.metadataPath, "utf8"));
  const backedUpSource = await readFile(result.eventsPath, "utf8");

  assert.match(result.artifactDir, /ledger-backup-2026-07-25T090000-000Z$/);
  assert.equal(metadata.artifactType, "agency-os-local-ledger-backup");
  assert.equal(metadata.sourcePath, eventsPath);
  assert.equal(metadata.sourceSha256, sha256Hex(eventsSource));
  assert.equal(metadata.eventCount, parseLedgerEventsStrict(eventsSource).length);
  assert.equal(backedUpSource, eventsSource);
  assert.equal(await readFile(eventsPath, "utf8"), eventsSource);
});

test("ledger restore dry-run validates backup and leaves target unchanged", async () => {
  const { tempDir, eventsPath, eventsSource } = await makeTempLedger();
  const backup = await createLedgerBackup({
    eventsPath,
    outputRoot: join(tempDir, "backups"),
    now: new Date("2026-07-25T09:10:00.000Z"),
  });
  const result = await restoreLedgerBackup({
    backupPath: backup.artifactDir,
    eventsPath,
    safetyRoot: join(tempDir, "safety"),
    dryRun: true,
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.restored, false);
  assert.equal(result.safetyBackup, null);
  assert.equal(await readFile(eventsPath, "utf8"), eventsSource);
});

test("ledger restore replaces target only after creating a safety backup", async () => {
  const { tempDir, eventsPath, eventsSource } = await makeTempLedger();
  const firstEventOnly = `${JSON.stringify(parseLedgerEventsStrict(eventsSource)[0])}\n`;
  const backup = await makeBackupFromSource(firstEventOnly);

  const result = await restoreLedgerBackup({
    backupPath: backup.artifactDir,
    eventsPath,
    safetyRoot: join(tempDir, "safety"),
    now: new Date("2026-07-25T09:20:00.000Z"),
  });

  assert.equal(result.restored, true);
  assert.equal(await readFile(eventsPath, "utf8"), firstEventOnly);
  assert.equal(await readFile(result.safetyBackup.eventsPath, "utf8"), eventsSource);
  assert.equal(result.safetyBackup.metadata.sourceSha256, sha256Hex(eventsSource));
});

test("ledger restore fails closed for invalid backup candidates", async (t) => {
  const { tempDir, eventsPath, eventsSource } = await makeTempLedger();

  await t.test("missing metadata", async () => {
    await assert.rejects(
      restoreLedgerBackup({
        backupPath: eventsPath,
        eventsPath,
        safetyRoot: join(tempDir, "safety-missing-metadata"),
      }),
      /backup metadata is missing or invalid/,
    );
    assert.equal(await readFile(eventsPath, "utf8"), eventsSource);
  });

  await t.test("invalid JSONL", async () => {
    const invalidBundle = await createLedgerBackup({
      eventsPath,
      outputRoot: join(tempDir, "backups-invalid-jsonl"),
      now: new Date("2026-07-25T09:30:00.000Z"),
    });
    await writeFile(invalidBundle.eventsPath, "{not-json}\n", "utf8");
    await assert.rejects(
      restoreLedgerBackup({
        backupPath: invalidBundle.artifactDir,
        eventsPath,
        safetyRoot: join(tempDir, "safety-invalid-jsonl"),
      }),
      /invalid JSONL/,
    );
    assert.equal(await readFile(eventsPath, "utf8"), eventsSource);
  });

  await t.test("broken hash chain", async () => {
    const events = parseLedgerEventsStrict(eventsSource);
    events[1] = { ...events[1], previousEventHash: "fnv1a32:broken" };
    const backupSource = `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
    const backup = await makeUncheckedBackupFromSource(backupSource, events.length);

    await assert.rejects(
      restoreLedgerBackup({
        backupPath: backup.artifactDir,
        eventsPath,
        safetyRoot: join(tempDir, "safety-broken-chain"),
      }),
      /broken previous hash|invalid event hash/,
    );
    assert.equal(await readFile(eventsPath, "utf8"), eventsSource);
  });

  await t.test("duplicate sequence", async () => {
    const events = parseLedgerEventsStrict(eventsSource);
    events[1] = { ...events[1], sequence: events[0].sequence };
    const backupSource = `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
    const backup = await makeUncheckedBackupFromSource(backupSource, events.length);

    await assert.rejects(
      restoreLedgerBackup({
        backupPath: backup.artifactDir,
        eventsPath,
        safetyRoot: join(tempDir, "safety-duplicate-sequence"),
      }),
      /duplicate event sequence/,
    );
    assert.equal(await readFile(eventsPath, "utf8"), eventsSource);
  });
});
