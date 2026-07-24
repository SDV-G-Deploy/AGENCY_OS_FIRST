import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

export const backupArtifactType = "agency-os-local-ledger-backup";
export const backupSchemaVersion = 1;

const allowedRedactionStatuses = new Set([
  "not_required",
  "pending_scan",
  "redacted",
  "no_secrets_detected",
  "blocked_sensitive",
]);
const allowedRetentionClasses = new Set(["audit", "operational", "temporary"]);

export function defaultEventsPath(cwd = process.cwd()) {
  return resolve(cwd, "data/events.jsonl");
}

export function defaultBackupRoot(cwd = process.cwd()) {
  return resolve(cwd, "backups/ledger");
}

export function sha256Hex(source) {
  return createHash("sha256").update(source, "utf8").digest("hex").toUpperCase();
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export function calculateEventHash(event) {
  const hashableEvent = Object.fromEntries(
    Object.entries(event).filter(([key]) => key !== "eventHash"),
  );
  const canonical = stableStringify(hashableEvent);
  let hash = 0x811c9dc5;

  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return `fnv1a32:${hash.toString(16).padStart(8, "0")}`;
}

export function parseLedgerEventsStrict(source) {
  const events = [];
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line.trim()) {
      return;
    }

    try {
      events.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`invalid JSONL at line ${index + 1}: ${error.message}`);
    }
  });

  return events;
}

export function validateEventLogIntegrity(events) {
  const errors = [];
  const sequences = new Set();
  const eventIds = new Set();
  const idempotencyKeys = new Map();
  let previousHash = null;

  events.forEach((event, index) => {
    const eventLabel = typeof event?.id === "string" ? event.id : `line ${index + 1}`;

    if (!event || typeof event !== "object" || Array.isArray(event)) {
      errors.push(`event ${index + 1} must be an object`);
      return;
    }
    if (event.schemaVersion !== 1) {
      errors.push(`event ${eventLabel} has unsupported schema version`);
    }
    if (typeof event.sequence !== "number" || event.sequence < 1) {
      errors.push(`event ${eventLabel} has invalid sequence`);
    }
    if (sequences.has(event.sequence)) {
      errors.push(`duplicate event sequence ${event.sequence}`);
    }
    sequences.add(event.sequence);
    if (event.sequence !== index + 1) {
      errors.push(`event ${eventLabel} sequence must be ${index + 1}`);
    }
    if (typeof event.id !== "string" || !event.id.trim()) {
      errors.push(`event ${index + 1} is missing id`);
    } else if (eventIds.has(event.id)) {
      errors.push(`duplicate event id ${event.id}`);
    }
    eventIds.add(event.id);

    if (!Array.isArray(event.evidenceIds)) {
      errors.push(`event ${eventLabel} evidenceIds must be an array`);
    }
    if (!Array.isArray(event.approvalIds)) {
      errors.push(`event ${eventLabel} approvalIds must be an array`);
    }
    if (typeof event.idempotencyKey !== "string" || !event.idempotencyKey.trim()) {
      errors.push(`event ${eventLabel} is missing idempotency key`);
    }
    if (!allowedRedactionStatuses.has(event.redactionStatus)) {
      errors.push(`event ${eventLabel} has invalid redaction status`);
    }
    if (!allowedRetentionClasses.has(event.retentionClass)) {
      errors.push(`event ${eventLabel} has invalid retention class`);
    }
    if (event.previousEventHash !== previousHash) {
      errors.push(`event ${eventLabel} has broken previous hash`);
    }

    const expectedHash = calculateEventHash(event);
    if (event.eventHash !== expectedHash) {
      errors.push(`event ${eventLabel} has invalid event hash`);
    }

    const priorIdempotencyHash = idempotencyKeys.get(event.idempotencyKey);
    if (priorIdempotencyHash && priorIdempotencyHash !== expectedHash) {
      errors.push(`duplicate idempotency key ${event.idempotencyKey} has different payload`);
    } else if (priorIdempotencyHash) {
      errors.push(`duplicate idempotency key ${event.idempotencyKey}`);
    }
    idempotencyKeys.set(event.idempotencyKey, expectedHash);

    previousHash = event.eventHash;
  });

  return errors;
}

export async function readAndValidateEventLog(eventsPath) {
  const absoluteEventsPath = resolve(eventsPath);
  const source = await readFile(absoluteEventsPath, "utf8");
  const events = parseLedgerEventsStrict(source);
  const validationErrors = validateEventLogIntegrity(events);

  if (validationErrors.length > 0) {
    throw new Error(`event log validation failed: ${validationErrors.join("; ")}`);
  }

  return {
    events,
    eventCount: events.length,
    eventsPath: absoluteEventsPath,
    sha256: sha256Hex(source),
    source,
  };
}

function timestampForPath(now = new Date()) {
  return now.toISOString().replaceAll(":", "").replaceAll(".", "-");
}

function requireMetadataValue(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

export async function createLedgerBackup({
  eventsPath = defaultEventsPath(),
  outputRoot = defaultBackupRoot(),
  now = new Date(),
} = {}) {
  const validated = await readAndValidateEventLog(eventsPath);
  const createdAt = now.toISOString();
  const artifactDir = resolve(outputRoot, `ledger-backup-${timestampForPath(now)}`);
  const eventLogFile = "events.jsonl";
  const metadata = {
    schemaVersion: backupSchemaVersion,
    artifactType: backupArtifactType,
    createdAt,
    sourcePath: validated.eventsPath,
    sourceSha256: validated.sha256,
    eventCount: validated.eventCount,
    eventLogFile,
  };

  await mkdir(artifactDir, { recursive: true });
  await writeFile(join(artifactDir, eventLogFile), validated.source, "utf8");
  await writeFile(join(artifactDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  return {
    artifactDir,
    metadataPath: join(artifactDir, "metadata.json"),
    eventsPath: join(artifactDir, eventLogFile),
    metadata,
  };
}

async function createSafetyBackup({ eventsPath, safetyRoot, now }) {
  const sourcePath = resolve(eventsPath);
  const source = await readFile(sourcePath, "utf8");
  let eventCount = source.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
  let validationErrors = [];

  try {
    const events = parseLedgerEventsStrict(source);
    eventCount = events.length;
    validationErrors = validateEventLogIntegrity(events);
  } catch (error) {
    validationErrors = [error.message];
  }

  const createdAt = now.toISOString();
  const artifactDir = resolve(safetyRoot, `ledger-restore-safety-${timestampForPath(now)}`);
  const metadata = {
    schemaVersion: backupSchemaVersion,
    artifactType: backupArtifactType,
    createdAt,
    sourcePath,
    sourceSha256: sha256Hex(source),
    eventCount,
    eventLogFile: "events.jsonl",
    safetyBackup: true,
    validationErrors,
  };

  await mkdir(artifactDir, { recursive: true });
  await writeFile(join(artifactDir, "events.jsonl"), source, "utf8");
  await writeFile(join(artifactDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  return {
    artifactDir,
    metadataPath: join(artifactDir, "metadata.json"),
    eventsPath: join(artifactDir, "events.jsonl"),
    metadata,
  };
}

export async function readBackupBundle(backupPath) {
  const resolvedBackupPath = resolve(backupPath);
  const metadataPath =
    basename(resolvedBackupPath) === "metadata.json"
      ? resolvedBackupPath
      : join(resolvedBackupPath, "metadata.json");
  let metadata;

  try {
    metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  } catch (error) {
    throw new Error(`backup metadata is missing or invalid: ${error.message}`);
  }

  const errors = [];
  requireMetadataValue(
    metadata.schemaVersion === backupSchemaVersion,
    "metadata has unsupported schema version",
    errors,
  );
  requireMetadataValue(
    metadata.artifactType === backupArtifactType,
    "metadata has invalid artifact type",
    errors,
  );
  requireMetadataValue(
    typeof metadata.createdAt === "string" && !Number.isNaN(Date.parse(metadata.createdAt)),
    "metadata has invalid createdAt",
    errors,
  );
  requireMetadataValue(
    typeof metadata.sourcePath === "string" && metadata.sourcePath.length > 0,
    "metadata is missing sourcePath",
    errors,
  );
  requireMetadataValue(
    typeof metadata.sourceSha256 === "string" && /^[A-F0-9]{64}$/.test(metadata.sourceSha256),
    "metadata is missing sourceSha256",
    errors,
  );
  requireMetadataValue(
    Number.isInteger(metadata.eventCount) && metadata.eventCount >= 0,
    "metadata is missing eventCount",
    errors,
  );
  requireMetadataValue(
    typeof metadata.eventLogFile === "string" && metadata.eventLogFile === basename(metadata.eventLogFile),
    "metadata is missing eventLogFile",
    errors,
  );

  if (errors.length > 0) {
    throw new Error(`backup metadata validation failed: ${errors.join("; ")}`);
  }

  const eventsPath = join(dirname(metadataPath), metadata.eventLogFile);
  const source = await readFile(eventsPath, "utf8");
  const events = parseLedgerEventsStrict(source);
  const actualSha256 = sha256Hex(source);
  const validationErrors = validateEventLogIntegrity(events);

  if (actualSha256 !== metadata.sourceSha256) {
    validationErrors.push("backup event log SHA-256 does not match metadata");
  }
  if (events.length !== metadata.eventCount) {
    validationErrors.push("backup event count does not match metadata");
  }
  if (validationErrors.length > 0) {
    throw new Error(`backup event log validation failed: ${validationErrors.join("; ")}`);
  }

  return {
    metadata,
    metadataPath,
    eventsPath,
    source,
    events,
    sha256: actualSha256,
  };
}

export async function restoreLedgerBackup({
  backupPath,
  eventsPath = defaultEventsPath(),
  safetyRoot = defaultBackupRoot(),
  dryRun = false,
  now = new Date(),
}) {
  if (!backupPath) {
    throw new Error("backup path is required");
  }

  const backup = await readBackupBundle(backupPath);

  if (dryRun) {
    return {
      restored: false,
      dryRun: true,
      backup,
      safetyBackup: null,
      targetPath: resolve(eventsPath),
    };
  }

  await mkdir(dirname(resolve(eventsPath)), { recursive: true });
  const safetyBackup = await createSafetyBackup({ eventsPath, safetyRoot, now });
  await copyFile(backup.eventsPath, resolve(eventsPath));

  return {
    restored: true,
    dryRun: false,
    backup,
    safetyBackup,
    targetPath: resolve(eventsPath),
  };
}
