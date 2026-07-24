#!/usr/bin/env node
import {
  createLedgerBackup,
  defaultBackupRoot,
  defaultEventsPath,
  restoreLedgerBackup,
} from "./ledger-backup-lib.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/ledger-backup-restore.mjs backup [--events <path>] [--out <dir>] [--json]",
    "  node scripts/ledger-backup-restore.mjs restore <backup-dir-or-metadata.json> [--events <path>] [--out <dir>] [--dry-run] [--json]",
  ].join("\n");
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  args.splice(index, 2);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift();

  if (!command || command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }

  const json = args.includes("--json");
  if (json) {
    args.splice(args.indexOf("--json"), 1);
  }
  const dryRun = args.includes("--dry-run");
  if (dryRun) {
    args.splice(args.indexOf("--dry-run"), 1);
  }
  const eventsPath = readOption(args, "--events") ?? defaultEventsPath();
  const outputRoot = readOption(args, "--out") ?? defaultBackupRoot();

  if (command === "backup") {
    if (args.length > 0) {
      throw new Error(`unexpected argument: ${args.join(" ")}`);
    }
    const result = await createLedgerBackup({ eventsPath, outputRoot });
    if (json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(`ledger backup created: ${result.artifactDir}`);
    console.log(`events: ${result.metadata.eventCount}`);
    console.log(`sha256: ${result.metadata.sourceSha256}`);
    return;
  }

  if (command === "restore") {
    const backupPath = args.shift();
    if (!backupPath) {
      throw new Error("restore requires a backup directory or metadata.json path");
    }
    if (args.length > 0) {
      throw new Error(`unexpected argument: ${args.join(" ")}`);
    }
    const result = await restoreLedgerBackup({
      backupPath,
      eventsPath,
      safetyRoot: outputRoot,
      dryRun,
    });
    if (json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(
      dryRun
        ? `ledger restore dry-run passed: ${backupPath}`
        : `ledger restored from backup: ${backupPath}`,
    );
    console.log(`target: ${result.targetPath}`);
    console.log(`events: ${result.backup.metadata.eventCount}`);
    console.log(`sha256: ${result.backup.sha256}`);
    if (result.safetyBackup) {
      console.log(`safety backup: ${result.safetyBackup.artifactDir}`);
    }
    return;
  }

  throw new Error(`unknown command: ${command}\n${usage()}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
