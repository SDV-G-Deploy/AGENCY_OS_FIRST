import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const earlyOption = (name) => {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
};
const root = resolve(earlyOption("--root") ?? resolve(import.meta.dirname, ".."));
const authorityRoot = resolve(earlyOption("--authority-root") ?? root);
const graph = JSON.parse(
  readFileSync(resolve(authorityRoot, "docs/full-mvp/TASK_GRAPH.json"), "utf8"),
);
const executionSchemas = JSON.parse(
  readFileSync(
    resolve(authorityRoot, "docs/full-mvp/EXECUTION_SCHEMAS.json"),
    "utf8",
  ),
);
const taskById = new Map(graph.tasks.map((task) => [task.id, task]));

function option(name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

function fail(message) {
  throw new Error(message);
}

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function iso(value, label) {
  const result = Date.parse(value);
  if (!Number.isFinite(result)) fail(`${label} must be an ISO date-time`);
  return result;
}

function sha(value, label) {
  if (!/^[0-9a-f]{40}$/.test(value ?? "")) {
    fail(`${label} must be a 40-character lowercase Git SHA`);
  }
  return value;
}

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function gitAt(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function commitExists(commit, label) {
  sha(commit, label);
  try {
    git(["cat-file", "-e", `${commit}^{commit}`]);
  } catch {
    fail(`${label} does not resolve to a Git commit`);
  }
}

function isAncestor(ancestor, descendant) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function checksum(value) {
  return `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
}

function bytesHash(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function schemaErrors(value, schema, path = "$") {
  if (schema.$ref) {
    const name = schema.$ref.match(/^#\/\$defs\/(.+)$/)?.[1];
    return name
      ? schemaErrors(value, executionSchemas.$defs[name], path)
      : [`${path}: unsupported ref ${schema.$ref}`];
  }
  if (schema.allOf) return schema.allOf.flatMap((part) => schemaErrors(value, part, path));
  if (schema.anyOf) {
    const alternatives = schema.anyOf.map((part) => schemaErrors(value, part, path));
    return alternatives.some((errors) => errors.length === 0)
      ? []
      : [`${path}: no anyOf alternative matched`];
  }
  const errors = [];
  if ("const" in schema && value !== schema.const) errors.push(`${path}: expected const ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: value is not in enum`);
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual =
      value === null
        ? "null"
        : Array.isArray(value)
          ? "array"
          : Number.isInteger(value)
            ? "integer"
            : typeof value;
    const numberMatches = actual === "integer" && types.includes("number");
    if (!types.includes(actual) && !numberMatches) errors.push(`${path}: expected ${types.join("|")}, got ${actual}`);
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: too short`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path}: too long`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: pattern mismatch`);
    if (schema.format === "date-time" && !Number.isFinite(Date.parse(value))) errors.push(`${path}: invalid date-time`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: too few items`);
    if (schema.items) {
      value.forEach((item, index) => errors.push(...schemaErrors(item, schema.items, `${path}[${index}]`)));
    }
  } else if (value && typeof value === "object") {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${path}.${key}: required`);
    }
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties?.[key]) {
        errors.push(...schemaErrors(child, schema.properties[key], `${path}.${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key}: additional property`);
      } else if (
        schema.additionalProperties &&
        typeof schema.additionalProperties === "object"
      ) {
        errors.push(
          ...schemaErrors(child, schema.additionalProperties, `${path}.${key}`),
        );
      }
    }
  }
  return errors;
}

function validateAgainstDef(value, name, label = name) {
  const schema = executionSchemas.$defs[name];
  assert.ok(schema, `missing execution schema ${name}`);
  const errors = schemaErrors(value, schema, label);
  assert.deepEqual(errors, [], `${label} schema errors:\n${errors.join("\n")}`);
}

function exactKeys(value, required, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  for (const key of required) assert.ok(key in value, `${label}.${key} is required`);
}

function noExtraKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    assert.ok(allowed.includes(key), `${label}.${key} is not allowed`);
  }
}

function distinct(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be distinct`);
}

function commandMatches(template, actual) {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/<[^>]+>/g, "\\S+");
  return new RegExp(`^${pattern}$`).test(actual);
}

function globMatches(pattern, path) {
  const normalizedPattern = pattern.replaceAll("\\", "/");
  const normalizedPath = path.replaceAll("\\", "/");
  const sentinel = "\u0000";
  const regex = normalizedPattern
    .replaceAll("**", sentinel)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll(sentinel, ".*")
    .replaceAll("\\*", "[^/]*");
  return new RegExp(`^${regex}$`).test(normalizedPath);
}

function parseNameStatus(output) {
  const tokens = output.split("\0").filter(Boolean);
  const paths = [];
  for (let index = 0; index < tokens.length; ) {
    const status = tokens[index++];
    if (/^[RC]/.test(status)) {
      paths.push(tokens[index++], tokens[index++]);
    } else {
      paths.push(tokens[index++]);
    }
  }
  return paths;
}

function changedPathsBetween(startingCommit, implementationCommit) {
  return parseNameStatus(
    execFileSync(
      "git",
      ["diff", "--name-status", "-z", startingCommit, implementationCommit],
      { cwd: root, encoding: "utf8" },
    ),
  );
}

function validateCertificationPaths(paths, label) {
  for (const changedPath of paths) {
    assert.ok(
      graph.certificationOnlyPaths.some((pattern) =>
        globMatches(pattern, changedPath),
      ),
      `${label} is stale because non-certification path changed after testing: ${changedPath}`,
    );
  }
}

function validateCertificationBoundary(testedCommit, artifactCommit, label) {
  commitExists(testedCommit, `${label}.testedCommit`);
  commitExists(artifactCommit, `${label}.artifactCommit`);
  assert.ok(
    isAncestor(testedCommit, artifactCommit),
    `${label} testedCommit is not an ancestor of artifactCommit`,
  );
  validateCertificationPaths(
    changedPathsBetween(testedCommit, artifactCommit),
    label,
  );
}

function safeArtifact(relativePath, label) {
  assert.equal(typeof relativePath, "string", `${label} must be a path string`);
  assert.ok(!isAbsolute(relativePath), `${label} must be repository-relative`);
  const absolute = resolve(root, relativePath);
  assert.ok(!relative(root, absolute).startsWith(".."), `${label} escapes repository`);
  assert.ok(existsSync(absolute), `${label} does not exist: ${relativePath}`);
  assert.ok(statSync(absolute).isFile(), `${label} is not a file: ${relativePath}`);
  return absolute;
}

function assertCommittedPath(commit, path, label) {
  const relativePath = relative(root, path).replaceAll("\\", "/");
  assert.ok(!relativePath.startsWith(".."), `${label} is outside candidate root`);
  try {
    git(["cat-file", "-e", `${commit}:${relativePath}`]);
  } catch {
    fail(`${label} is not committed in ${commit}: ${relativePath}`);
  }
}

function committedBytes(commit, path, label) {
  assertCommittedPath(commit, path, label);
  const relativePath = relative(root, path).replaceAll("\\", "/");
  return execFileSync("git", ["show", `${commit}:${relativePath}`], {
    cwd: root,
    encoding: null,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function validateArtifactCheckout(artifactCommit) {
  commitExists(artifactCommit, "artifactCommit");
  assert.equal(
    git(["rev-parse", "HEAD"]),
    artifactCommit,
    "artifactCommit must equal checked-out HEAD",
  );
  assert.equal(git(["status", "--porcelain"]), "", "artifact worktree must be clean");
}

function validateCommand(command, label, expectedCommit) {
  exactKeys(
    command,
    ["command", "testedCommit", "exitCode", "startedAt", "endedAt"],
    label,
  );
  assert.ok(command.command.length > 0, `${label}.command is empty`);
  commitExists(command.testedCommit, `${label}.testedCommit`);
  if (expectedCommit) {
    assert.equal(command.testedCommit, expectedCommit, `${label} tested wrong commit`);
  }
  assert.equal(command.exitCode, 0, `${label} did not pass`);
  const start = iso(command.startedAt, `${label}.startedAt`);
  const end = iso(command.endedAt, `${label}.endedAt`);
  assert.ok(end >= start, `${label} has negative duration`);
}

function validateAuthorizationDocument(
  value,
  { checkGit = true, checkCurrentTime = true } = {},
) {
  validateAgainstDef(value, "OwnerAuthorization", "authorization");
  const authorizationKeys = [
      "schemaVersion",
      "authorizationId",
      "goalId",
      "windowId",
      "planningCommit",
      "authorizedStartCommit",
      "canonicalRepo",
      "startAt",
      "deadlineAt",
      "stopDispatchMinutesBeforeDeadline",
      "diskQuotaBytes",
      "permissions",
      "manualGatesRemainOwnerWork",
      "completionIsNotGuaranteed",
  ];
  exactKeys(value, authorizationKeys, "authorization");
  noExtraKeys(value, authorizationKeys, "authorization");
  assert.equal(value.schemaVersion, 2);
  for (const id of ["authorizationId", "goalId", "windowId"]) {
    assert.ok(
      typeof value[id] === "string" && value[id].length >= 8,
      `authorization.${id} is invalid`,
    );
  }
  distinct(
    [value.authorizationId, value.goalId, value.windowId],
    "authorization identifiers",
  );
  assert.equal(value.canonicalRepo, "C:\\Agency_os_first\\AGENCY_OS_FIRST");
  const start = iso(value.startAt, "authorization.startAt");
  const deadline = iso(value.deadlineAt, "authorization.deadlineAt");
  assert.ok(deadline > start, "authorization deadline must follow start");
  assert.ok(deadline - start <= 8 * 60 * 60 * 1000, "authorization window exceeds 8 hours");
  if (checkCurrentTime) {
    const now = Date.now();
    assert.ok(now >= start - 5 * 60 * 1000, "authorization window has not started");
    assert.ok(now <= deadline, "authorization window has expired");
  }
  assert.ok(
    Number.isInteger(value.stopDispatchMinutesBeforeDeadline) &&
      value.stopDispatchMinutesBeforeDeadline >= 30,
    "authorization dispatch reserve is too small",
  );
  assert.ok(
    value.stopDispatchMinutesBeforeDeadline * 60 * 1000 < deadline - start,
    "authorization dispatch reserve consumes the whole window",
  );
  assert.ok(
    Number.isInteger(value.diskQuotaBytes) && value.diskQuotaBytes >= 10 * 1024 ** 3,
    "authorization disk quota is below 10 GiB",
  );
  const permissionKeys = [
      "createControllerAndTaskWorktrees",
      "deleteOnlyWorktreesCreatedByThisGoal",
      "localMergeIntoIntegration",
      "moveOrPushMain",
      "pushAnyBranch",
      "deployOrExposePublicly",
      "migrateRealPrivateData",
      "installOnlyApprovedExactDependencies",
  ];
  exactKeys(value.permissions, permissionKeys, "authorization.permissions");
  noExtraKeys(value.permissions, permissionKeys, "authorization.permissions");
  for (const key of [
    "createControllerAndTaskWorktrees",
    "deleteOnlyWorktreesCreatedByThisGoal",
    "localMergeIntoIntegration",
    "installOnlyApprovedExactDependencies",
  ]) {
    assert.equal(value.permissions[key], true, `authorization.permissions.${key} must be true`);
  }
  for (const key of [
    "moveOrPushMain",
    "pushAnyBranch",
    "deployOrExposePublicly",
    "migrateRealPrivateData",
  ]) {
    assert.equal(value.permissions[key], false, `authorization.permissions.${key} must be false`);
  }
  assert.equal(value.manualGatesRemainOwnerWork, true);
  assert.equal(value.completionIsNotGuaranteed, true);
  if (checkGit) {
    commitExists(value.planningCommit, "authorization.planningCommit");
    commitExists(value.authorizedStartCommit, "authorization.authorizedStartCommit");
    assert.ok(
      isAncestor(value.planningCommit, value.authorizedStartCommit),
      "planning commit is not an ancestor of authorized start commit",
    );
  }
  return value;
}

const taskTransitions = {
  blocked: new Set(["ready", "aborted", "failed"]),
  ready: new Set(["dispatched", "blocked", "aborted"]),
  dispatched: new Set(["implemented", "aborted", "failed"]),
  implemented: new Set(["verified", "repairing", "failed"]),
  verified: new Set(["review_rejected", "accepted", "repairing", "failed"]),
  review_rejected: new Set(["repairing", "failed"]),
  repairing: new Set(["implemented", "failed", "aborted"]),
  accepted: new Set(["merge_pending_verification", "invalidated", "reverted"]),
  merge_pending_verification: new Set(["merged", "reverted"]),
  merged: new Set(["invalidated", "reverted"]),
  reverted: new Set(["repairing", "merged", "failed"]),
  invalidated: new Set(["repairing", "merged", "failed"]),
  manual_pending: new Set(["accepted", "failed"]),
  aborted: new Set(),
  failed: new Set(),
};

const activeStatuses = new Set([
  "dispatched",
  "implemented",
  "verified",
  "review_rejected",
  "repairing",
  "accepted",
  "merge_pending_verification",
]);

function isKnownOrRepairTaskId(taskId) {
  return taskById.has(taskId) || /^RPR-[A-Z]\d{2}-[1-9]\d*$/.test(taskId);
}

function validateRunStateDocument(value, previous, authorization) {
  validateAgainstDef(value, "RunState", "runState");
  exactKeys(
    value,
    [
      "schemaVersion",
      "stateRevision",
      "stateChecksum",
      "goalId",
      "activeAuthorizationId",
      "activeWindowId",
      "planningCommit",
      "authorizedStartCommit",
      "integrationBranch",
      "integrationWorktree",
      "startedAt",
      "deadlineAt",
      "stopDispatchAt",
      "diskQuotaBytes",
      "updatedAt",
      "currentWave",
      "activeTaskIds",
      "taskStates",
      "authorizationHistory",
      "reviewScores",
      "aggregateGate",
      "manualGates",
      "stopReason",
    ],
    "runState",
  );
  assert.equal(value.schemaVersion, 2);
  assert.ok(Number.isInteger(value.stateRevision) && value.stateRevision > 0);
  const unsigned = structuredClone(value);
  delete unsigned.stateChecksum;
  assert.equal(value.stateChecksum, checksum(unsigned), "runState checksum mismatch");
  commitExists(value.planningCommit, "runState.planningCommit");
  commitExists(value.authorizedStartCommit, "runState.authorizedStartCommit");
  assert.ok(
    isAncestor(value.planningCommit, value.authorizedStartCommit),
    "runState planning commit is not an ancestor of authorized start commit",
  );
  assert.equal(value.integrationBranch, graph.integrationBranch);
  assert.ok(
    value.integrationWorktree.includes(value.goalId),
    "integration worktree must include stable goalId",
  );
  const started = iso(value.startedAt, "runState.startedAt");
  const deadline = iso(value.deadlineAt, "runState.deadlineAt");
  const stop = iso(value.stopDispatchAt, "runState.stopDispatchAt");
  const updated = iso(value.updatedAt, "runState.updatedAt");
  assert.ok(started <= updated && updated <= deadline, "runState time order is invalid");
  assert.ok(stop <= deadline - 30 * 60 * 1000, "runState stopDispatchAt lacks 30 minute reserve");
  assert.ok(Number.isInteger(value.diskQuotaBytes) && value.diskQuotaBytes >= 10 * 1024 ** 3);
  assert.ok(Array.isArray(value.authorizationHistory) && value.authorizationHistory.length > 0);
  distinct(value.authorizationHistory.map((item) => item.authorizationId), "authorization IDs");
  distinct(value.authorizationHistory.map((item) => item.windowId), "window IDs");
  for (const item of value.authorizationHistory) {
    exactKeys(item, ["authorizationId", "windowId", "authorizationHash", "startAt", "deadlineAt"], "authorizationHistory item");
    assert.match(item.authorizationHash, /^sha256:[0-9a-f]{64}$/);
    assert.ok(iso(item.deadlineAt, "authorization deadline") > iso(item.startAt, "authorization start"));
  }
  const activeAuthorization = value.authorizationHistory.at(-1);
  assert.equal(value.activeAuthorizationId, activeAuthorization.authorizationId);
  assert.equal(value.activeWindowId, activeAuthorization.windowId);
  assert.equal(value.deadlineAt, activeAuthorization.deadlineAt);
  if (authorization) {
    validateAuthorizationDocument(authorization);
    assert.equal(value.goalId, authorization.goalId);
    assert.equal(value.activeAuthorizationId, authorization.authorizationId);
    assert.equal(value.activeWindowId, authorization.windowId);
    assert.equal(value.planningCommit, authorization.planningCommit);
    assert.equal(value.authorizedStartCommit, authorization.authorizedStartCommit);
    assert.equal(value.deadlineAt, authorization.deadlineAt);
    assert.equal(value.diskQuotaBytes, authorization.diskQuotaBytes);
    assert.equal(activeAuthorization.authorizationHash, checksum(authorization));
  }
  distinct(value.activeTaskIds, "activeTaskIds");
  for (const taskId of value.activeTaskIds) {
    assert.ok(isKnownOrRepairTaskId(taskId), `unknown active task ${taskId}`);
  }
  for (const [taskId, state] of Object.entries(value.taskStates)) {
    assert.ok(isKnownOrRepairTaskId(taskId), `unknown task state ${taskId}`);
    validateAgainstDef(state, "RunTaskState", `${taskId} state`);
    if (taskById.has(taskId)) {
      assert.equal(state.contractTaskId, taskId, `${taskId} contractTaskId mismatch`);
      assert.deepEqual(state.ownedPaths, taskById.get(taskId).ownedPaths, `${taskId} ownedPaths drift`);
      if (state.satisfiedByTaskId !== null) {
        assert.equal(state.status, "merged", `${taskId} repair satisfaction requires merged status`);
        assert.ok(
          state.satisfiedByTaskId.startsWith(`RPR-${taskId}-`),
          `${taskId} has mismatched satisfying repair ${state.satisfiedByTaskId}`,
        );
        const repairState = value.taskStates[state.satisfiedByTaskId];
        assert.ok(repairState, `${taskId} satisfying repair is missing`);
        assert.equal(repairState.contractTaskId, taskId);
        assert.equal(repairState.status, "merged", `${taskId} satisfying repair is not merged`);
        assert.equal(state.implementationCommit, repairState.implementationCommit);
        assert.equal(state.mergeCommit, repairState.mergeCommit);
        assert.equal(state.repairCount, repairState.repairCount);
      }
    } else {
      const match = taskId.match(/^RPR-([A-Z]\d{2})-([1-9]\d*)$/);
      assert.ok(match, `invalid repair task ID ${taskId}`);
      assert.equal(state.contractTaskId, match[1], `${taskId} repair contract mismatch`);
      const repairOrdinal = Number(match[2]);
      assert.ok(
        repairOrdinal <= graph.rules.maxRepairTurnsPerTask,
        `${taskId} exceeds repair turn limit`,
      );
      assert.equal(
        state.repairCount,
        repairOrdinal,
        `${taskId} ordinal/repairCount mismatch`,
      );
      if (repairOrdinal > 1) {
        const priorRepairId = `RPR-${state.contractTaskId}-${repairOrdinal - 1}`;
        const priorRepair = value.taskStates[priorRepairId];
        assert.ok(priorRepair, `${taskId} skips missing prior repair ${priorRepairId}`);
        assert.ok(
          ["reverted", "aborted", "failed"].includes(priorRepair.status),
          `${taskId} prior repair ${priorRepairId} is not terminally unsuccessful`,
        );
      }
      const contractTask = taskById.get(state.contractTaskId);
      assert.ok(contractTask?.kind === "automated", `${taskId} repair contract is not automated`);
      assert.deepEqual(state.ownedPaths, contractTask.ownedPaths, `${taskId} repair widened ownedPaths`);
      assert.equal(state.satisfiedByTaskId, null, `${taskId} may not satisfy another repair`);
    }
    assert.ok(taskTransitions[state.status], `${taskId} has invalid status ${state.status}`);
    assert.ok(Number.isInteger(state.repairCount) && state.repairCount >= 0 && state.repairCount <= 2);
    assert.ok(state.branch.length > 0 && state.worktree.length > 0);
    assert.ok(state.workerId.length > 0);
    distinct(state.reviewerIds, `${taskId} reviewer IDs`);
    assert.ok(!state.reviewerIds.includes(state.workerId), `${taskId} worker is also reviewer`);
    assert.ok(state.processState.length > 0);
    assert.ok(Array.isArray(state.ownedPaths) && state.ownedPaths.length > 0);
    assert.ok(Array.isArray(state.evidencePaths));
    assert.equal(
      value.activeTaskIds.includes(taskId),
      activeStatuses.has(state.status),
      `${taskId} activeTaskIds/status mismatch`,
    );
    for (const commitField of ["startingCommit", "implementationCommit", "mergeCommit", "revertCommit"]) {
      if (state[commitField]) commitExists(state[commitField], `${taskId}.${commitField}`);
    }
    if (["implemented", "verified", "review_rejected", "repairing", "accepted", "merge_pending_verification", "merged", "reverted"].includes(state.status)) {
      assert.ok(state.implementationCommit, `${taskId} status ${state.status} lacks implementationCommit`);
    }
    if (["merge_pending_verification", "merged"].includes(state.status)) {
      assert.ok(state.mergeCommit, `${taskId} ${state.status} without mergeCommit`);
    }
    if (state.status === "reverted") assert.ok(state.revertCommit, `${taskId} reverted without revertCommit`);
    if (state.implementationCommit) {
      assert.ok(isAncestor(state.startingCommit, state.implementationCommit), `${taskId} implementation ancestry invalid`);
    }
    if (state.mergeCommit && state.implementationCommit) {
      assert.ok(isAncestor(state.implementationCommit, state.mergeCommit), `${taskId} merge ancestry invalid`);
    }
    if (taskById.has(taskId) && ["ready", ...activeStatuses, "merged"].includes(state.status)) {
      for (const dependency of taskById.get(taskId).dependsOn) {
        const dependencyState = value.taskStates[dependency];
        const dependencyTask = taskById.get(dependency);
        const requiredDependencyStatuses = dependencyTask.kind.startsWith("manual")
          ? ["accepted"]
          : ["merged"];
        assert.ok(
          dependencyState &&
            requiredDependencyStatuses.includes(dependencyState.status),
          `${taskId} dependency ${dependency} is not accepted/merged`,
        );
        if (dependencyState.mergeCommit) {
          assert.ok(
            isAncestor(dependencyState.mergeCommit, state.startingCommit),
            `${taskId} starting commit omits merged dependency ${dependency}`,
          );
        }
      }
    }
    for (const invalidator of state.invalidatedBy) {
      const invalidatorState = value.taskStates[invalidator];
      assert.ok(
        invalidatorState && ["reverted", "invalidated"].includes(invalidatorState.status),
        `${taskId} has invalid invalidatedBy reference ${invalidator}`,
      );
    }
  }
  for (const task of graph.tasks) {
    const dependencyState = value.taskStates[task.id];
    if (!dependencyState || !["reverted", "invalidated"].includes(dependencyState.status)) continue;
    const descendantIds = new Set();
    const queue = [task.id];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const dependent of graph.tasks.filter((candidate) =>
        candidate.dependsOn.includes(current),
      )) {
        if (!descendantIds.has(dependent.id)) {
          descendantIds.add(dependent.id);
          queue.push(dependent.id);
        }
      }
    }
    for (const dependent of graph.tasks.filter((candidate) => descendantIds.has(candidate.id))) {
      const dependentState = value.taskStates[dependent.id];
      if (dependentState && ["accepted", "merged"].includes(dependentState.status)) {
        fail(`${dependent.id} remains ${dependentState.status} after ${task.id} invalidation`);
      }
    }
  }
  if (previous) {
    validateRunStateDocument(previous);
    assert.equal(value.goalId, previous.goalId, "goalId changed between revisions");
    assert.equal(value.planningCommit, previous.planningCommit, "planning commit changed between revisions");
    assert.equal(value.stateRevision, previous.stateRevision + 1, "state revision did not increment by one");
    assert.ok(updated >= iso(previous.updatedAt, "previous.updatedAt"), "updatedAt moved backward");
    assert.deepEqual(
      value.authorizationHistory.slice(0, previous.authorizationHistory.length),
      previous.authorizationHistory,
      "authorization history was rewritten",
    );
    for (const [taskId, oldState] of Object.entries(previous.taskStates)) {
      const nextState = value.taskStates[taskId];
      assert.ok(nextState, `task state disappeared: ${taskId}`);
      if (nextState.status !== oldState.status) {
        assert.ok(
          taskTransitions[oldState.status]?.has(nextState.status),
          `illegal task transition ${taskId}: ${oldState.status} -> ${nextState.status}`,
        );
      }
    }
  }
}

function runLogLineCovers(line, state) {
  const tokens = new Map(
    line
      .trim()
      .split(/\s+/)
      .filter((token) => token.includes("="))
      .map((token) => {
        const separator = token.indexOf("=");
        return [token.slice(0, separator), token.slice(separator + 1)];
      }),
  );
  return (
    tokens.get("goalId") === state.goalId &&
    tokens.get("windowId") === state.activeWindowId &&
    tokens.get("revision") === String(state.stateRevision)
  );
}

function loadDurableRunState(primaryPath) {
  const sidecarPath = resolve(dirname(primaryPath), "RUN_STATE.sha256");
  const backupPath = `${primaryPath}.bak`;
  const runLogPath = resolve(dirname(primaryPath), "RUN_LOG.md");
  const runLog = existsSync(runLogPath) ? readFileSync(runLogPath, "utf8") : "";
  const logCovers = (state) =>
    runLog.split(/\r?\n/).some((line) => runLogLineCovers(line, state));
  try {
    assert.ok(existsSync(sidecarPath), `missing RUN_STATE sidecar ${sidecarPath}`);
    const sidecar = readFileSync(sidecarPath, "utf8").trim();
    const primary = json(primaryPath);
    const unsigned = structuredClone(primary);
    delete unsigned.stateChecksum;
    assert.equal(primary.stateChecksum, checksum(unsigned));
    assert.equal(sidecar, primary.stateChecksum, "RUN_STATE sidecar mismatch");
    const logMissing = !logCovers(primary);
    return {
      value: primary,
      source: "primary",
      recoveryRequired: logMissing,
      recoveryLogEntry: logMissing
        ? `RECOVERY_REQUIRED goalId=${primary.goalId} windowId=${primary.activeWindowId} revision=${primary.stateRevision} reason=run-log-missing-or-stale`
        : undefined,
    };
  } catch (primaryError) {
    assert.ok(existsSync(backupPath), `primary invalid and backup missing: ${primaryError.message}`);
    const backup = json(backupPath);
    const unsigned = structuredClone(backup);
    delete unsigned.stateChecksum;
    assert.equal(backup.stateChecksum, checksum(unsigned), "RUN_STATE backup checksum mismatch");
    return {
      value: backup,
      source: "backup",
      recoveryRequired: true,
      recoveryLogEntry: `RECOVERY_REQUIRED goalId=${backup.goalId} windowId=${backup.activeWindowId} revision=${backup.stateRevision} reason=primary-or-sidecar-invalid primary=${primaryPath}`,
    };
  }
}

function validateAcceptanceEvidence(
  value,
  fixtureId,
  artifactCommit,
  goalId,
  { selfTest = false } = {},
) {
  validateAgainstDef(value, "AcceptanceEvidence", `evidence ${fixtureId}`);
  exactKeys(
    value,
    [
      "schemaVersion",
      "fixtureId",
      "taskId",
      "goalId",
      "testedCommit",
      "checks",
      "dependencyEvidenceIds",
      "result",
    ],
    `evidence ${fixtureId}`,
  );
  assert.equal(value.schemaVersion, 1);
  assert.equal(value.fixtureId, fixtureId);
  assert.equal(value.goalId, goalId);
  assert.equal(value.result, "PASS");
  assert.equal(
    value.taskId,
    graph.canonicalEvidenceTaskId,
    `${fixtureId} must be canonicalized by ${graph.canonicalEvidenceTaskId}`,
  );
  const task = taskById.get(value.taskId);
  assert.ok(task, `${fixtureId} names unknown task ${value.taskId}`);
  assert.ok(task.acceptanceFixtures.includes(fixtureId), `${value.taskId} does not own ${fixtureId}`);
  validateCertificationBoundary(
    value.testedCommit,
    artifactCommit,
    `${fixtureId} evidence`,
  );
  assert.ok(Array.isArray(value.checks) && value.checks.length > 0, `${fixtureId} has no checks`);
  const checksByLevel = new Map();
  for (const [index, check] of value.checks.entries()) {
    const label = `${fixtureId}.checks[${index}]`;
    exactKeys(
      check,
      ["sourceTaskId", "level", "engines", "commands", "artifactPaths", "artifactHashes", "metadata", "result"],
      label,
    );
    assert.equal(check.result, "PASS", `${label} is not PASS`);
    assert.ok(["domain", "workspace", "api", "browser", "manual"].includes(check.level));
    const levelChecks = checksByLevel.get(check.level) ?? [];
    levelChecks.push(check);
    checksByLevel.set(check.level, levelChecks);
    assert.ok(Array.isArray(check.engines) && check.engines.length > 0, `${label} has no engines`);
    for (const engine of check.engines) {
      assert.ok(["node", "chromium", "webkit", "physical_phone", "manual"].includes(engine));
    }
    assert.ok(Array.isArray(check.commands) && check.commands.length > 0);
    const sourceTask = taskById.get(check.sourceTaskId);
    assert.ok(sourceTask, `${label} has unknown sourceTaskId`);
    assert.ok(sourceTask.acceptanceFixtures.includes(fixtureId), `${label} source task does not own fixture`);
    assert.ok(
      graph.evidenceLevelTaskPrefixes[check.level].some((prefix) =>
        check.sourceTaskId.startsWith(prefix),
      ),
      `${label} source task is not allowed for ${check.level}`,
    );
    const allowedCommands =
      check.level === "browser"
        ? new Set(
            taskById
              .get(graph.canonicalEvidenceTaskId)
              .acceptanceCommands.filter((command) =>
                command.includes("playwright test"),
              ),
          )
        : new Set(
            sourceTask.acceptanceCommands
              .filter((command) => command.startsWith("node --test ")),
          );
    assert.ok(allowedCommands.size > 0, `${label} has no fixture-bound command authority`);
    check.commands.forEach((command, commandIndex) => {
      validateCommand(command, `${label}.commands[${commandIndex}]`, value.testedCommit);
      assert.ok(
        allowedCommands.has(command.command),
        `${label} uses undeclared command ${command.command}`,
      );
    });
    assert.ok(Array.isArray(check.artifactPaths) && check.artifactPaths.length > 0);
    check.artifactPaths.forEach((path, artifactIndex) => {
      if (!selfTest) {
        assert.ok(
          path
            .replaceAll("\\", "/")
            .startsWith(
              `tasks/full-mvp/evidence/artifacts/${fixtureId}/${check.level}/`,
            ),
          `${label} artifact is outside its fixture/level family`,
        );
      }
      safeArtifact(path, `${label}.artifactPaths[${artifactIndex}]`);
      const recordedHash = check.artifactHashes[path];
      assert.match(recordedHash ?? "", /^sha256:[0-9a-f]{64}$/);
      let committedBytes;
      try {
        committedBytes = execFileSync(
          "git",
          ["show", `${artifactCommit}:${path.replaceAll("\\", "/")}`],
          { cwd: root, encoding: null, stdio: ["ignore", "pipe", "pipe"] },
        );
      } catch {
        fail(`${label} artifact is not committed in candidate: ${path}`);
      }
      assert.equal(
        bytesHash(committedBytes),
        recordedHash,
        `${label} artifact hash mismatch: ${path}`,
      );
    });
    assert.equal(
      Object.keys(check.artifactHashes).length,
      check.artifactPaths.length,
      `${label} artifact hash/path cardinality mismatch`,
    );
    if (check.level === "browser") {
      for (const requiredBrowserCommand of taskById
        .get(graph.canonicalEvidenceTaskId)
        .acceptanceCommands.filter((command) => command.includes("playwright test"))) {
        assert.ok(
          check.commands.some((command) => command.command === requiredBrowserCommand),
          `${label} omits ${requiredBrowserCommand}`,
        );
      }
      assert.ok(check.metadata && typeof check.metadata === "object", `${label} lacks browser metadata`);
      const contract = graph.browserEvidenceContract;
      for (const width of contract.requiredViewportWidths) {
        assert.ok(check.metadata.viewportWidths.includes(width), `${label} lacks viewport ${width}`);
      }
      for (const inputMode of contract.requiredInputModes) {
        assert.ok(check.metadata.inputModes.includes(inputMode), `${label} lacks input mode ${inputMode}`);
      }
      assert.ok(Number.isFinite(check.metadata.timingMs) && check.metadata.timingMs >= 0);
      for (const assertionName of contract.requiredAssertions) {
        passFail(check.metadata[assertionName], `${label}.metadata.${assertionName}`);
      }
    } else {
      assert.equal(check.metadata, null, `${label} non-browser metadata must be null`);
    }
  }
  const requirements = graph.fixtureEvidenceRequirements[fixtureId];
  assert.ok(requirements, `missing evidence requirements for ${fixtureId}`);
  for (const level of requirements.levels) {
    const checks = checksByLevel.get(level) ?? [];
    assert.ok(checks.length > 0, `${fixtureId} lacks ${level} evidence`);
    const requiredEngines =
      level === "browser"
        ? requirements.engines.filter((engine) => ["chromium", "webkit"].includes(engine))
        : requirements.engines.includes("node")
          ? ["node"]
          : [];
    for (const engine of requiredEngines) {
      assert.ok(
        checks.some((check) => check.engines.includes(engine)),
        `${fixtureId} lacks ${engine} on ${level} evidence`,
      );
    }
  }
  assert.ok(Array.isArray(value.dependencyEvidenceIds));
}

function latestReview(directory, role) {
  assert.ok(existsSync(directory), `missing review directory ${directory}`);
  const files = readdirSync(directory)
    .filter((name) => name.startsWith(`${role}-round-`) && name.endsWith(".json"))
    .sort((a, b) => {
      const number = (name) => Number(name.match(/round-(\d+)\.json$/)?.[1] ?? -1);
      return number(a) - number(b);
    });
  assert.ok(files.length > 0, `missing ${role} review`);
  const path = resolve(directory, files.at(-1));
  return { path, relativePath: relative(root, path).replaceAll("\\", "/"), value: json(path) };
}

function validateCandidateEvidence(
  evidenceDirectory,
  taskArtifactsDirectory,
  runStateSnapshotPath,
  artifactCommit,
  planningCommit,
  goalId,
  coordinatorId,
) {
  validateArtifactCheckout(artifactCommit);
  commitExists(planningCommit, "planningCommit");
  assert.equal(
    gitAt(authorityRoot, ["rev-parse", "HEAD"]),
    planningCommit,
    "authority worktree is not pinned to planningCommit",
  );
  assert.equal(
    gitAt(authorityRoot, ["status", "--porcelain"]),
    "",
    "authority worktree must be clean",
  );
  assert.ok(isAncestor(planningCommit, artifactCommit), "planning commit is not an ancestor of artifact package");
  const authorityDiff = git([
    "diff",
    "--name-only",
    planningCommit,
    artifactCommit,
    "--",
    ...graph.planningAuthorityPaths,
  ]);
  assert.equal(authorityDiff, "", `accepted planning authority changed:\n${authorityDiff}`);
  assertCommittedPath(artifactCommit, runStateSnapshotPath, "final RUN_STATE snapshot");
  const finalRunState = json(runStateSnapshotPath);
  validateRunStateDocument(finalRunState);
  assert.equal(finalRunState.goalId, goalId);
  assert.equal(finalRunState.planningCommit, planningCommit);
  const evidenceIds = new Set();
  for (const fixtureId of Object.keys(graph.fixtureEvidenceRequirements)) {
    const path = resolve(evidenceDirectory, `${fixtureId}.json`);
    assert.ok(existsSync(path), `missing canonical evidence ${path}`);
    const value = json(path);
    assertCommittedPath(artifactCommit, path, `canonical evidence ${fixtureId}`);
    validateAcceptanceEvidence(value, fixtureId, artifactCommit, goalId);
    evidenceIds.add(fixtureId);
  }
  for (const fixtureId of evidenceIds) {
    const value = json(resolve(evidenceDirectory, `${fixtureId}.json`));
    for (const dependencyId of value.dependencyEvidenceIds) {
      assert.ok(evidenceIds.has(dependencyId), `${fixtureId} references missing evidence ${dependencyId}`);
    }
  }

  const includeV03 = argv.includes("--include-v03");
  // V03 invokes this gate, so requiring V03's own post-gate acceptance in that
  // invocation would be self-referential. R00 repeats it with --include-v03.
  const selectedRepairIds = new Set();
  const validationTasks = graph.tasks
    .filter(
      (item) => item.kind === "automated" && (includeV03 || item.id !== "V03"),
    )
    .map((contractTask) => {
      const contractState = finalRunState.taskStates[contractTask.id];
      assert.ok(contractState, `final RUN_STATE omits ${contractTask.id}`);
      assert.equal(
        contractState.status,
        "merged",
        `${contractTask.id} is not merged in final RUN_STATE`,
      );
      const executionTaskId =
        contractState.satisfiedByTaskId ?? contractTask.id;
      if (executionTaskId !== contractTask.id) selectedRepairIds.add(executionTaskId);
      return { ...contractTask, id: executionTaskId, contractTaskId: contractTask.id };
    });
  for (const [repairId, state] of Object.entries(finalRunState.taskStates)) {
    if (!repairId.startsWith("RPR-") || state.status !== "merged") continue;
    assert.ok(
      selectedRepairIds.has(repairId),
      `${repairId} is a merged orphan not selected by its static contract`,
    );
  }
  for (const task of validationTasks) {
    const state = finalRunState.taskStates[task.id];
    assert.ok(state, `final RUN_STATE omits ${task.id}`);
    assert.equal(state.status, "merged", `${task.id} is not merged in final RUN_STATE`);
    assert.equal(state.contractTaskId, task.contractTaskId);
    const taskDirectory = resolve(taskArtifactsDirectory, task.id);
    const receiptPath = resolve(taskDirectory, "IMPLEMENTATION_RECEIPT.json");
    assert.ok(existsSync(receiptPath), `missing ${task.id} implementation receipt`);
    assertCommittedPath(artifactCommit, receiptPath, `${task.id} receipt`);
    const receipt = json(receiptPath);
    validateAgainstDef(receipt, "ImplementationReceipt", `${task.id} receipt`);
    exactKeys(
      receipt,
      ["schemaVersion", "taskId", "startingCommit", "implementationCommit", "resultTreeHash", "workerId", "coordinatorId", "recordedAt", "focusedCommands", "evidencePaths"],
      `${task.id} receipt`,
    );
    assert.equal(receipt.schemaVersion, 1);
    assert.equal(receipt.taskId, task.id);
    commitExists(receipt.startingCommit, `${task.id}.startingCommit`);
    commitExists(receipt.implementationCommit, `${task.id}.implementationCommit`);
    sha(receipt.resultTreeHash, `${task.id}.resultTreeHash`);
    assert.ok(isAncestor(receipt.startingCommit, receipt.implementationCommit));
    assert.ok(isAncestor(receipt.implementationCommit, artifactCommit));
    assert.equal(
      git(["show", "-s", "--format=%T", receipt.implementationCommit]),
      receipt.resultTreeHash,
      `${task.id} receipt tree hash mismatch`,
    );
    const changedPaths = changedPathsBetween(
      receipt.startingCommit,
      receipt.implementationCommit,
    );
    const allowedPatterns = [
      ...task.ownedPaths,
      ...task.evidence,
      `tasks/full-mvp/${task.id}/PLAN_FIRST.md`,
      `tasks/full-mvp/${task.id}/RESULT.md`,
    ];
    for (const changedPath of changedPaths) {
      assert.ok(
        allowedPatterns.some((pattern) => globMatches(pattern, changedPath)),
        `${task.id} changed undeclared path ${changedPath}`,
      );
    }
    const receiptAt = iso(receipt.recordedAt, `${task.id}.recordedAt`);
    assert.equal(receipt.coordinatorId, coordinatorId);
    assert.ok(receipt.workerId && receipt.workerId !== coordinatorId, `${task.id} worker/coordinator identity collision`);
    assert.ok(Array.isArray(receipt.focusedCommands) && receipt.focusedCommands.length > 0);
    receipt.focusedCommands.forEach((command, index) =>
      validateCommand(
        command,
        `${task.id}.focusedCommands[${index}]`,
        receipt.implementationCommit,
      ),
    );
    assert.ok(
      receiptAt >= Math.max(...receipt.focusedCommands.map((command) => iso(command.endedAt, "focused command endedAt"))),
      `${task.id} receipt predates focused verification`,
    );
    const recordedCommands = new Set(receipt.focusedCommands.map((command) => command.command));
    for (const requiredCommand of task.acceptanceCommands) {
      assert.ok(
        [...recordedCommands].some((actual) => commandMatches(requiredCommand, actual)),
        `${task.id} receipt omits acceptance command: ${requiredCommand}`,
      );
    }
    receipt.evidencePaths.forEach((path, index) =>
      safeArtifact(path, `${task.id}.receipt.evidencePaths[${index}]`),
    );
    for (const declaredPath of task.evidence) {
      assert.ok(
        receipt.evidencePaths.includes(declaredPath),
        `${task.id} receipt omits declared evidence ${declaredPath}`,
      );
    }

    const selectedReviews = [];
    for (const role of task.reviewRoles) {
      const review = latestReview(resolve(taskDirectory, "reviews"), role);
      assertCommittedPath(artifactCommit, review.path, `${task.id}/${role} review`);
      const value = review.value;
      validateAgainstDef(value, "ReviewArtifact", `${task.id}/${role} review`);
      exactKeys(
        value,
        ["schemaVersion", "taskId", "role", "reviewerId", "workerId", "coordinatorId", "reviewedCommit", "reviewedAt", "score", "verdict", "deterministicBlockers"],
        `${task.id}/${role} review`,
      );
      assert.equal(value.taskId, task.id);
      assert.equal(value.role, role);
      assert.equal(value.workerId, receipt.workerId);
      assert.equal(value.coordinatorId, coordinatorId);
      assert.equal(value.reviewedCommit, receipt.implementationCommit);
      assert.ok(value.reviewerId !== receipt.workerId && value.reviewerId !== coordinatorId);
      assert.ok(value.score >= graph.acceptanceThreshold);
      assert.equal(value.verdict, "ACCEPT");
      assert.deepEqual(value.deterministicBlockers, []);
      assert.ok(iso(value.reviewedAt, `${task.id}/${role}.reviewedAt`) >= receiptAt);
      selectedReviews.push(review);
    }
    distinct(selectedReviews.map((review) => review.value.reviewerId), `${task.id} reviewer IDs`);

    const acceptancePath = resolve(taskDirectory, "COORDINATOR_ACCEPTANCE.json");
    assert.ok(existsSync(acceptancePath), `missing ${task.id} coordinator acceptance`);
    assertCommittedPath(artifactCommit, acceptancePath, `${task.id} acceptance`);
    const acceptance = json(acceptancePath);
    validateAgainstDef(acceptance, "CoordinatorAcceptance", `${task.id} acceptance`);
    exactKeys(
      acceptance,
      ["schemaVersion", "taskId", "coordinatorId", "implementationCommit", "mergeCommit", "aggregateCommit", "acceptedAt", "aggregateCommands", "reviewPaths", "result"],
      `${task.id} acceptance`,
    );
    assert.equal(acceptance.taskId, task.id);
    assert.equal(acceptance.coordinatorId, coordinatorId);
    assert.equal(acceptance.implementationCommit, receipt.implementationCommit);
    commitExists(acceptance.mergeCommit, `${task.id}.mergeCommit`);
    commitExists(acceptance.aggregateCommit, `${task.id}.aggregateCommit`);
    assert.ok(
      git(["rev-list", "--parents", "-n", "1", acceptance.mergeCommit]).split(/\s+/).length >= 3,
      `${task.id} mergeCommit is not a visible no-ff merge`,
    );
    assert.ok(isAncestor(receipt.implementationCommit, acceptance.mergeCommit));
    assert.ok(isAncestor(acceptance.mergeCommit, acceptance.aggregateCommit));
    assert.ok(isAncestor(acceptance.mergeCommit, artifactCommit));
    assert.ok(isAncestor(acceptance.aggregateCommit, artifactCommit));
    const acceptedAt = iso(acceptance.acceptedAt, `${task.id}.acceptedAt`);
    assert.ok(
      acceptedAt >= Math.max(...selectedReviews.map((review) => iso(review.value.reviewedAt, "reviewedAt"))),
      `${task.id} acceptance predates review`,
    );
    acceptance.aggregateCommands.forEach((command, index) =>
      validateCommand(
        command,
        `${task.id}.aggregateCommands[${index}]`,
        acceptance.aggregateCommit,
      ),
    );
    assert.ok(
      acceptance.aggregateCommands.some(
        (command) => command.command === "npm run verify",
      ),
      `${task.id} post-merge aggregate omits npm run verify`,
    );
    for (const requiredAggregateCommand of
      task.postMergeCommands ?? graph.defaultPostMergeCommands) {
      assert.ok(
        acceptance.aggregateCommands.some((command) =>
          commandMatches(requiredAggregateCommand, command.command),
        ),
        `${task.id} post-merge aggregate omits ${requiredAggregateCommand}`,
      );
    }
    assert.ok(
      acceptedAt >= Math.max(...acceptance.aggregateCommands.map((command) => iso(command.endedAt, "aggregate command endedAt"))),
      `${task.id} acceptance predates aggregate verification`,
    );
    acceptance.reviewPaths.forEach((path, index) =>
      safeArtifact(path, `${task.id}.acceptance.reviewPaths[${index}]`),
    );
    for (const review of selectedReviews) {
      assert.ok(acceptance.reviewPaths.includes(review.relativePath), `${task.id} acceptance omits ${review.relativePath}`);
    }
    assert.equal(acceptance.result, "ACCEPT");
  }
}

const passFail = (value, label) => assert.equal(value, "PASS", `${label} must be PASS`);

function noFailStrings(value, label = "manual gate") {
  if (value === "FAIL") fail(`${label} contains FAIL`);
  if (Array.isArray(value)) value.forEach((item, index) => noFailStrings(item, `${label}[${index}]`));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) noFailStrings(child, `${label}.${key}`);
  }
}

function markdownSection(text, heading) {
  const marker = `## ${heading}`;
  const start = text.indexOf(marker);
  assert.ok(start >= 0, `release summary omits ${marker}`);
  const contentStart = start + marker.length;
  const next = text.indexOf("\n## ", contentStart);
  return text.slice(contentStart, next === -1 ? undefined : next).trim();
}

function validateReleaseSummary(path, testedCommit, artifactCommit, goalId) {
  const testedBytes = committedBytes(testedCommit, path, "R00 summary at tested commit");
  const artifactBytes = committedBytes(artifactCommit, path, "R00 summary at artifact commit");
  assert.deepEqual(
    artifactBytes,
    testedBytes,
    "R00 summary changed after independent review",
  );
  const text = testedBytes.toString("utf8");
  assert.ok(text.startsWith("# Agency OS FULL MVP Release Review"));
  assert.ok(text.includes(`Goal ID: ${goalId}`), "release summary goalId mismatch");
  for (const requiredLine of [
    "Automated FULL MVP implementation candidate: yes",
    "Private Local Dogfood MVP: yes",
    "Personal private daily-use candidate: yes",
    "Public/Internet remote-access candidate: no",
    "Production launch candidate: no",
    "H01: PASS",
    "H02: PASS",
    "H03: PASS",
    "H04: PASS",
  ]) {
    assert.ok(text.includes(requiredLine), `release summary omits: ${requiredLine}`);
  }
  for (const heading of [
    "Commit Boundary",
    "Task Table",
    "Reviewer Scores",
    "Aggregate Verification",
    "Production Audit Classification",
    "Manual Gates",
    "Worktrees And Branches",
    "Main And GitHub Non-Mutation",
    "Next Owner Action",
  ]) {
    assert.ok(
      markdownSection(text, heading).length > 0,
      `release summary section is empty: ${heading}`,
    );
  }
}

function validateManualBase(value, name, artifactCommit, goalId) {
  exactKeys(value, ["schemaVersion", "goalId", "testedCommit", "testerId", "coordinatorId", "testedAt", "evidencePaths", "evidenceHashes", "reviewerAttestations", "overallResult"], name);
  assert.equal(value.schemaVersion, 2);
  assert.equal(value.goalId, goalId);
  validateCertificationBoundary(value.testedCommit, artifactCommit, name);
  const testedAt = iso(value.testedAt, `${name}.testedAt`);
  assert.notEqual(value.testerId, value.coordinatorId, `${name} tester/coordinator collision`);
  assert.ok(Array.isArray(value.evidencePaths) && value.evidencePaths.length > 0);
  value.evidencePaths.forEach((path, index) => {
    assert.ok(
      path.replaceAll("\\", "/").startsWith(`tasks/full-mvp/manual/evidence/${name}/`),
      `${name} evidence is outside its dedicated manual evidence directory`,
    );
    const absolute = safeArtifact(path, `${name}.evidencePaths[${index}]`);
    assert.equal(
      value.evidenceHashes[path],
      bytesHash(committedBytes(artifactCommit, absolute, `${name} evidence ${path}`)),
      `${name} evidence hash mismatch: ${path}`,
    );
  });
  assert.equal(Object.keys(value.evidenceHashes).length, value.evidencePaths.length);
  const gateTask = taskById.get(name);
  assert.ok(gateTask, `unknown manual gate ${name}`);
  assert.deepEqual(
    [...new Set(value.reviewerAttestations.map((item) => item.role))].sort(),
    [...gateTask.reviewRoles].sort(),
    `${name} attestation roles differ from TASK_GRAPH`,
  );
  for (const role of gateTask.reviewRoles) {
    const attestation = value.reviewerAttestations.find((item) => item.role === role);
    assert.ok(attestation, `${name} missing ${role} attestation`);
    validateAgainstDef(attestation, "ManualAttestation", `${name}/${role}`);
    passFail(attestation.result, `${name}/${role}.result`);
    assert.notEqual(attestation.reviewerId, value.coordinatorId);
    if (role === "owner") assert.equal(attestation.reviewerId, value.testerId);
    else assert.notEqual(attestation.reviewerId, value.testerId);
    assert.ok(iso(attestation.reviewedAt, `${name}/${role}.reviewedAt`) >= testedAt);
  }
  distinct(
    value.reviewerAttestations
      .filter((attestation) => attestation.role !== "owner")
      .map((attestation) => attestation.reviewerId),
    `${name} non-owner reviewer IDs`,
  );
  passFail(value.overallResult, `${name}.overallResult`);
  noFailStrings(value, name);
}

function validateManualGates(directory, artifactCommit, goalId, coordinatorId) {
  validateArtifactCheckout(artifactCommit);
  const paths = {
    H01: resolve(directory, "H01-physical-phone.json"),
    H02: resolve(directory, "H02-accessibility.json"),
    H03: resolve(directory, "H03-clean-recovery.json"),
    H04: resolve(directory, "H04-real-git.json"),
  };
  for (const [name, path] of Object.entries(paths)) {
    assert.ok(existsSync(path), `missing ${name}: ${path}`);
    assertCommittedPath(artifactCommit, path, `${name} gate`);
  }
  const h01 = json(paths.H01);
  validateAgainstDef(h01, "H01PhysicalPhone", "H01");
  validateManualBase(h01, "H01", artifactCommit, goalId);
  assert.equal(h01.coordinatorId, coordinatorId);
  exactKeys(h01, ["phone", "laptop", "tailnet", "timingsSeconds", "results"], "H01");
  for (const [key, maximum] of Object.entries({ capture: 30, classify: 60, typedConversion: 120, todayOrientation: 180 })) {
    const value = h01.timingsSeconds[key];
    assert.ok(Number.isFinite(value) && value >= 0 && value <= maximum, `H01 timing ${key} is invalid`);
  }
  for (const key of ["https", "serve", "funnelDisabled"]) {
    passFail(h01.tailnet[key], `H01.tailnet.${key}`);
  }
  assert.ok(h01.evidencePaths.includes(h01.tailnet.aclReceipt));
  safeArtifact(h01.tailnet.aclReceipt, "H01.tailnet.aclReceipt");
  for (const key of [
    "expectedIdentity",
    "wrongIdentityDenied",
    "headerlessDenied",
    "funnelDenied",
    "directLanDenied",
    "secureCookie",
    "disconnectSameIntentRetry",
    "logoutBackReloadOfflineNoCache",
    "noHorizontalOverflow",
    "durableCaptureAfterReload",
    "nextReviewItemCorrect",
    "typedConversionCorrect",
    "evidenceReviewCorrect",
    "blockerDecisionCorrect",
    "agentRunReviewCorrect",
    "todayDeltaCorrect",
    "quarantineMaskedAndOwnerAction",
  ]) passFail(h01.results[key], `H01.results.${key}`);

  const h02 = json(paths.H02);
  validateAgainstDef(h02, "H02Accessibility", "H02");
  validateManualBase(h02, "H02", artifactCommit, goalId);
  assert.equal(h02.coordinatorId, coordinatorId);
  exactKeys(h02, ["environments", "surfaces"], "H02");
  for (const surface of ["runtimeShell", "capture", "review", "quarantine", "today", "desktopTruth", "recovery"]) {
    const checks = h02.surfaces[surface];
    exactKeys(
      checks,
      ["desktopScreenReader", "phoneScreenReader", "keyboard", "focusAfterSuccess", "focusAfterError", "liveRegion", "zoom200", "reflow400", "forcedColors", "reducedMotion"],
      `H02.surfaces.${surface}`,
    );
    for (const [key, value] of Object.entries(checks)) passFail(value, `H02.surfaces.${surface}.${key}`);
  }

  const h03 = json(paths.H03);
  validateAgainstDef(h03, "H03CleanRecovery", "H03");
  validateManualBase(h03, "H03", artifactCommit, goalId);
  assert.equal(h03.coordinatorId, coordinatorId);
  exactKeys(
    h03,
    [
      "machineProfile",
      "bundleId",
      "bundleHash",
      "containsQuarantinePayloads",
      "encryptionClaim",
      "externalEvidenceContentIncluded",
      "expectedStateHash",
      "actualStateHash",
      "externalReferenceInventoryChecked",
      "quarantineHandlingChecked",
      "cleanupDecision",
    ],
    "H03",
  );
  assert.equal(h03.expectedStateHash, h03.actualStateHash, "H03 restored state hash mismatch");
  passFail(h03.externalReferenceInventoryChecked, "H03.externalReferenceInventoryChecked");
  passFail(h03.quarantineHandlingChecked, "H03.quarantineHandlingChecked");

  const h04 = json(paths.H04);
  validateAgainstDef(h04, "H04RealGit", "H04");
  validateManualBase(h04, "H04", artifactCommit, goalId);
  assert.equal(h04.coordinatorId, coordinatorId);
  exactKeys(
    h04,
    ["repositoryId", "repositoryPathMasked", "allowListConfirmed", "before", "after", "firstScanObservationCount", "secondScanNewObservationCount", "contentReadInstrumentation", "sourceConfiguredThroughUI"],
    "H04",
  );
  for (const key of ["head", "refSnapshotHash", "indexHash", "porcelainStatus"]) {
    assert.equal(h04.before[key], h04.after[key], `H04 mutated Git ${key}`);
  }
  assert.ok(Number.isInteger(h04.firstScanObservationCount) && h04.firstScanObservationCount >= 1);
  assert.equal(h04.secondScanNewObservationCount, 0);
  passFail(h04.allowListConfirmed, "H04.allowListConfirmed");
  passFail(h04.contentReadInstrumentation, "H04.contentReadInstrumentation");
  passFail(h04.sourceConfiguredThroughUI, "H04.sourceConfiguredThroughUI");
}

function validateReleaseReview(directory, artifactCommit, goalId, coordinatorId) {
  validateArtifactCheckout(artifactCommit);
  const releaseTask = taskById.get("R00");
  const selectedReviews = [];
  for (const role of releaseTask.reviewRoles) {
    const review = latestReview(resolve(directory, "reviews"), role);
    const value = review.value;
    assertCommittedPath(artifactCommit, review.path, `R00/${role} review`);
    validateAgainstDef(value, "ReleaseReviewArtifact", `R00/${role}`);
    assert.equal(value.goalId, goalId);
    assert.equal(value.role, role);
    assert.equal(value.coordinatorId, coordinatorId);
    assert.notEqual(value.reviewerId, coordinatorId);
    validateCertificationBoundary(value.reviewedCommit, artifactCommit, `R00/${role}`);
    assert.ok(value.score >= graph.acceptanceThreshold);
    assert.equal(value.verdict, "ACCEPT");
    assert.deepEqual(value.deterministicBlockers, []);
    iso(value.reviewedAt, `R00/${role}.reviewedAt`);
    selectedReviews.push(review);
  }
  distinct(selectedReviews.map((review) => review.value.reviewerId), "R00 reviewer IDs");

  const acceptancePath = resolve(directory, "RELEASE_ACCEPTANCE.json");
  assert.ok(existsSync(acceptancePath), `missing ${acceptancePath}`);
  assertCommittedPath(artifactCommit, acceptancePath, "R00 acceptance");
  const acceptance = json(acceptancePath);
  validateAgainstDef(acceptance, "ReleaseAcceptance", "R00 acceptance");
  assert.equal(acceptance.goalId, goalId);
  validateCertificationBoundary(acceptance.testedCommit, artifactCommit, "R00 acceptance");
  for (const review of selectedReviews) {
    assert.equal(
      review.value.reviewedCommit,
      acceptance.testedCommit,
      "R00 reviewers and acceptance must bind the same tested commit",
    );
  }
  assert.equal(acceptance.coordinatorId, coordinatorId);
  const summaryPath = safeArtifact(acceptance.summaryPath, "R00.summaryPath");
  validateReleaseSummary(
    summaryPath,
    acceptance.testedCommit,
    artifactCommit,
    goalId,
  );
  const acceptedAt = iso(acceptance.acceptedAt, "R00.acceptedAt");
  acceptance.aggregateCommands.forEach((command, index) =>
    validateCommand(command, `R00.aggregateCommands[${index}]`, acceptance.testedCommit),
  );
  const requiredCommandTemplates = releaseTask.acceptanceCommands.filter(
    (command) => !command.includes("--release-review"),
  );
  for (const requiredCommand of requiredCommandTemplates) {
    assert.ok(
      acceptance.aggregateCommands.some((command) =>
        commandMatches(requiredCommand, command.command),
      ),
      `R00 acceptance omits command: ${requiredCommand}`,
    );
  }
  assert.ok(
    acceptedAt >=
      Math.max(
        ...acceptance.aggregateCommands.map((command) => iso(command.endedAt, "R00 command endedAt")),
        ...selectedReviews.map((review) => iso(review.value.reviewedAt, "R00 reviewedAt")),
      ),
    "R00 acceptance predates gates/reviews",
  );
  for (const review of selectedReviews) {
    assert.ok(acceptance.reviewPaths.includes(review.relativePath));
  }
  acceptance.reviewPaths.forEach((path, index) =>
    safeArtifact(path, `R00.reviewPaths[${index}]`),
  );
  assert.equal(acceptance.result, "ACCEPT");
}

function expectFailure(fn, label) {
  let failed = false;
  try {
    fn();
  } catch {
    failed = true;
  }
  assert.ok(failed, `negative self-test did not fail: ${label}`);
}

function selfTest() {
  const head = git(["rev-parse", "HEAD"]);
  const now = Date.now();
  const base = {
    schemaVersion: 2,
    authorizationId: "authorization-test",
    goalId: "goal-test",
    windowId: "window-test",
    planningCommit: head,
    authorizedStartCommit: head,
    canonicalRepo: "C:\\Agency_os_first\\AGENCY_OS_FIRST",
    startAt: new Date(now - 60 * 1000).toISOString(),
    deadlineAt: new Date(now + 7 * 60 * 60 * 1000).toISOString(),
    stopDispatchMinutesBeforeDeadline: 30,
    diskQuotaBytes: 20 * 1024 ** 3,
    permissions: {
      createControllerAndTaskWorktrees: true,
      deleteOnlyWorktreesCreatedByThisGoal: true,
      localMergeIntoIntegration: true,
      moveOrPushMain: false,
      pushAnyBranch: false,
      deployOrExposePublicly: false,
      migrateRealPrivateData: false,
      installOnlyApprovedExactDependencies: true,
    },
    manualGatesRemainOwnerWork: true,
    completionIsNotGuaranteed: true,
  };
  validateAuthorizationDocument(base);
  expectFailure(
    () => validateAuthorizationDocument({ ...base, diskQuotaBytes: 1 }),
    "small authorization quota",
  );
  expectFailure(
    () =>
      validateAuthorizationDocument({
        ...base,
        permissions: { ...base.permissions, pushAnyBranch: true },
      }),
    "push authority",
  );
  const runUnsigned = {
    schemaVersion: 2,
    stateRevision: 1,
    goalId: "goal-test",
    activeAuthorizationId: "authorization-test",
    activeWindowId: "window-test",
    planningCommit: head,
    authorizedStartCommit: head,
    integrationBranch: graph.integrationBranch,
    integrationWorktree: "C:\\Agency_os_first\\worktrees\\full-mvp-controller-goal-test",
    startedAt: "2026-07-29T00:00:00.000Z",
    deadlineAt: "2026-07-29T08:00:00.000Z",
    stopDispatchAt: "2026-07-29T07:30:00.000Z",
    diskQuotaBytes: 20 * 1024 ** 3,
    updatedAt: "2026-07-29T00:01:00.000Z",
    currentWave: "baseline",
    activeTaskIds: [],
    taskStates: {},
    authorizationHistory: [
      {
        authorizationId: "authorization-test",
        windowId: "window-test",
        authorizationHash: `sha256:${"a".repeat(64)}`,
        startAt: "2026-07-29T00:00:00.000Z",
        deadlineAt: "2026-07-29T08:00:00.000Z",
      },
    ],
    reviewScores: {},
    aggregateGate: {},
    manualGates: {},
    stopReason: null,
  };
  const runState = { ...runUnsigned, stateChecksum: checksum(runUnsigned) };
  validateRunStateDocument(runState);
  assert.equal(
    runLogLineCovers(
      "PASS goalId=goal-test windowId=window-test revision=1",
      runState,
    ),
    true,
  );
  assert.equal(
    runLogLineCovers(
      "PASS goalId=goal-test-extra windowId=window-test revision=10",
      runState,
    ),
    false,
  );
  expectFailure(
    () => validateRunStateDocument({ ...runState, stateChecksum: `sha256:${"0".repeat(64)}` }),
    "run-state checksum",
  );
  const impossibleRepairUnsigned = structuredClone(runUnsigned);
  impossibleRepairUnsigned.taskStates["RPR-T00-999"] = {
    status: "failed",
    contractTaskId: "T00",
    satisfiedByTaskId: null,
    branch: "repair/T00-999",
    worktree: "C:/worktree/T00-999",
    startingCommit: head,
    implementationCommit: null,
    mergeCommit: null,
    revertCommit: null,
    workerId: "worker-repair",
    reviewerIds: [],
    ownedPaths: taskById.get("T00").ownedPaths,
    repairCount: 2,
    processState: "failed",
    evidencePaths: [],
    invalidatedBy: [],
  };
  const impossibleRepair = {
    ...impossibleRepairUnsigned,
    stateChecksum: checksum(impossibleRepairUnsigned),
  };
  expectFailure(
    () => validateRunStateDocument(impossibleRepair),
    "repair ID exceeds bounded ordinal",
  );
  const evidence = {
    schemaVersion: 1,
    fixtureId: "AT-J01",
    taskId: "V02",
    goalId: "goal-test",
    testedCommit: head,
    checks: [
      {
        sourceTaskId: "V02",
        level: "browser",
        engines: ["chromium", "webkit"],
        commands: [
          {
            command: "npx playwright test --project=chromium",
            testedCommit: head,
            exitCode: 0,
            startedAt: "2026-07-29T00:00:00.000Z",
            endedAt: "2026-07-29T00:00:01.000Z",
          },
          {
            command: "npx playwright test --project=webkit",
            testedCommit: head,
            exitCode: 0,
            startedAt: "2026-07-29T00:00:01.000Z",
            endedAt: "2026-07-29T00:00:02.000Z",
          },
        ],
        artifactPaths: ["package.json"],
        artifactHashes: {
          "package.json": bytesHash(
            execFileSync("git", ["show", `${head}:package.json`], {
              cwd: root,
              encoding: null,
            }),
          ),
        },
        metadata: {
          viewportWidths: [390, 760, 1024, 1280, 1440],
          inputModes: ["keyboard", "pointer", "touch"],
          timingMs: 1,
          resultOutcome: "PASS",
          focusOutcome: "PASS",
          postReloadProjection: "PASS",
          noHorizontalOverflow: "PASS",
          sensitiveContentAbsent: "PASS",
        },
        result: "PASS",
      },
    ],
    dependencyEvidenceIds: [],
    result: "PASS",
  };
  validateAcceptanceEvidence(evidence, "AT-J01", head, "goal-test", {
    selfTest: true,
  });
  expectFailure(
    () =>
      validateAcceptanceEvidence(
        {
          ...evidence,
          checks: [{ ...evidence.checks[0], engines: ["chromium"] }],
        },
        "AT-J01",
        head,
        "goal-test",
        { selfTest: true },
      ),
    "missing required evidence engine",
  );
  expectFailure(
    () =>
      validateAcceptanceEvidence(
        {
          ...evidence,
          checks: [
            {
              ...evidence.checks[0],
              commands: [
                evidence.checks[0].commands[0],
                {
                  ...evidence.checks[0].commands[1],
                  command: "npm run verify",
                },
              ],
            },
          ],
        },
        "AT-J01",
        head,
        "goal-test",
        { selfTest: true },
      ),
    "fixture command-family substitution",
  );
  expectFailure(
    () =>
      validateAcceptanceEvidence(
        {
          ...evidence,
          checks: [
            {
              ...evidence.checks[0],
              artifactHashes: { "package.json": `sha256:${"0".repeat(64)}` },
            },
          ],
        },
        "AT-J01",
        head,
        "goal-test",
        { selfTest: true },
      ),
    "forged artifact hash",
  );
  const parent = git(["rev-parse", `${head}^`]);
  expectFailure(
    () =>
      validateAcceptanceEvidence(
        { ...evidence, testedCommit: parent },
        "AT-J01",
        head,
        "goal-test",
        { selfTest: true },
      ),
    "stale candidate evidence",
  );
  const unsigned = { hello: "world", nested: { b: 2, a: 1 } };
  assert.equal(checksum(unsigned), checksum({ nested: { a: 1, b: 2 }, hello: "world" }));
  assert.ok(globMatches("src/ui/**", "src/ui/nested/file.ts"));
  assert.ok(!globMatches("src/ui/**", "src/domain/file.ts"));
  assert.deepEqual(
    parseNameStatus("D\0deleted.ts\0R100\0old.ts\0new.ts\0"),
    ["deleted.ts", "old.ts", "new.ts"],
  );
  validateCertificationPaths(
    ["docs/CURRENT_STATE.md", "tasks/full-mvp/V03/report.json"],
    "certification allow-list",
  );
  expectFailure(
    () => validateCertificationPaths(["app/page.tsx"], "certification allow-list"),
    "runtime change after tested commit",
  );
  const runTaskState = {
    status: "ready",
    contractTaskId: "T00",
    satisfiedByTaskId: null,
    branch: "feature/test",
    worktree: "C:/worktree",
    startingCommit: head,
    implementationCommit: null,
    mergeCommit: null,
    revertCommit: null,
    workerId: "worker-test",
    reviewerIds: [],
    ownedPaths: ["package.json"],
    repairCount: 0,
    processState: "ready",
    evidencePaths: [],
    invalidatedBy: [],
  };
  validateAgainstDef(runTaskState, "RunTaskState", "runTaskState self-test");
  const missingSatisfactionLink = structuredClone(runTaskState);
  delete missingSatisfactionLink.satisfiedByTaskId;
  expectFailure(
    () => validateAgainstDef(missingSatisfactionLink, "RunTaskState"),
    "missing repair satisfaction link",
  );
  expectFailure(
    () =>
      assert.ok(
        markdownSection(
          "## Task Table\n\n## Reviewer Scores\nPASS",
          "Task Table",
        ).length > 0,
      ),
    "empty release summary section",
  );
  assert.ok(
    commandMatches(
      "node <authority-root>/validator.mjs --candidate <candidate-commit>",
      "node C:/authority/validator.mjs --candidate 0123456789abcdef",
    ),
  );
  const failTree = { overallResult: "PASS", nested: { child: "FAIL" } };
  expectFailure(() => noFailStrings(failTree), "nested manual FAIL");
  console.log(JSON.stringify({ selfTest: "PASS", negativeCases: 12 }, null, 2));
}

if (argv.includes("--self-test")) {
  selfTest();
} else if (option("--authorization")) {
  const path = resolve(option("--authorization"));
  const authorization = json(path);
  validateAuthorizationDocument(authorization);
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  assert.ok(
    normalized.includes("/agencyos/run-authorizations/") &&
      normalized.endsWith(
        `/${authorization.goalId}/${authorization.windowId}.json`.toLowerCase(),
      ),
    "authorization path does not bind goalId/windowId",
  );
  console.log(JSON.stringify({ authorization: "PASS", path }, null, 2));
} else if (option("--run-state")) {
  const path = resolve(option("--run-state"));
  const previousPath = option("--previous-run-state");
  const authorizationPath =
    option("--active-authorization") ?? fail("--active-authorization is required with --run-state");
  const loaded = loadDurableRunState(path);
  validateRunStateDocument(
    loaded.value,
    previousPath ? json(resolve(previousPath)) : undefined,
    json(resolve(authorizationPath)),
  );
  console.log(
    JSON.stringify(
      {
        runState: "PASS",
        path,
        source: loaded.source,
        recoveryRequired: loaded.recoveryRequired,
        recoveryLogEntry: loaded.recoveryLogEntry ?? null,
      },
      null,
      2,
    ),
  );
  if (loaded.recoveryRequired) process.exitCode = 2;
} else if (option("--candidate-evidence")) {
  const artifactCommit = option("--artifact-commit") ?? fail("--artifact-commit is required");
  const planningCommit = option("--planning-commit") ?? fail("--planning-commit is required");
  const goalId = option("--goal-id") ?? fail("--goal-id is required");
  const coordinatorId = option("--coordinator-id") ?? fail("--coordinator-id is required");
  const evidenceDirectory = resolve(root, option("--candidate-evidence"));
  const taskArtifactsDirectory = resolve(root, option("--task-artifacts") ?? "tasks/full-mvp");
  const runStateSnapshotPath = resolve(
    root,
    option("--run-state-snapshot") ??
      fail("--run-state-snapshot is required with --candidate-evidence"),
  );
  validateCandidateEvidence(
    evidenceDirectory,
    taskArtifactsDirectory,
    runStateSnapshotPath,
    artifactCommit,
    planningCommit,
    goalId,
    coordinatorId,
  );
  console.log(JSON.stringify({ candidateEvidence: "PASS", artifactCommit, goalId }, null, 2));
} else if (option("--manual-gates")) {
  const artifactCommit = option("--artifact-commit") ?? fail("--artifact-commit is required");
  const goalId = option("--goal-id") ?? fail("--goal-id is required");
  const coordinatorId = option("--coordinator-id") ?? fail("--coordinator-id is required");
  validateManualGates(
    resolve(root, option("--manual-gates")),
    artifactCommit,
    goalId,
    coordinatorId,
  );
  console.log(JSON.stringify({ manualGates: "PASS", artifactCommit, goalId }, null, 2));
} else if (option("--release-review")) {
  const artifactCommit = option("--artifact-commit") ?? fail("--artifact-commit is required");
  const goalId = option("--goal-id") ?? fail("--goal-id is required");
  const coordinatorId = option("--coordinator-id") ?? fail("--coordinator-id is required");
  validateReleaseReview(
    resolve(root, option("--release-review")),
    artifactCommit,
    goalId,
    coordinatorId,
  );
  console.log(JSON.stringify({ releaseReview: "PASS", artifactCommit, goalId }, null, 2));
} else {
  fail(
    "use --self-test, --authorization <file>, --run-state <file>, " +
      "--candidate-evidence <dir>, --manual-gates <dir>, or --release-review <dir>",
  );
}
