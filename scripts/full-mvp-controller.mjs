import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  checksum,
  commitExists,
  graph,
  isAncestor,
  loadDurableRunState,
  taskById,
  taskStateIsActive,
  validateAuthorizationDocument,
  validateFormativePhone,
  validateRunStateDocument,
} from "./validate-full-mvp-execution.mjs";

const argv = process.argv.slice(2);
const command = argv[0];

function option(name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

function required(name) {
  const value = option(name);
  assert.ok(value, `${name} is required`);
  return value;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function localAppDataPath(...parts) {
  assert.ok(process.env.LOCALAPPDATA, "LOCALAPPDATA is required");
  return resolve(process.env.LOCALAPPDATA, ...parts);
}

function sameWindowsPath(left, right) {
  return resolve(left).replaceAll("/", "\\").toLowerCase() ===
    resolve(right).replaceAll("/", "\\").toLowerCase();
}

function gitAt(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function isAncestorAt(root, ancestor, descendant) {
  try {
    gitAt(root, ["merge-base", "--is-ancestor", ancestor, descendant]);
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

function cleanHead(root, label) {
  assert.equal(gitAt(root, ["status", "--porcelain"]), "", `${label} must be clean`);
  return gitAt(root, ["rev-parse", "HEAD"]);
}

function validateAuthorityRoot(authorization) {
  const root = resolve(required("--authority-root"));
  assert.equal(
    cleanHead(root, "authority worktree"),
    authorization.planningCommit,
    "authority worktree must remain pinned exactly to planningCommit",
  );
  return root;
}

function validateInitialIntegrationRoot(authorization) {
  const root = resolve(required("--integration-root"));
  const head = cleanHead(root, "initial controller/integration worktree");
  assert.equal(
    head,
    authorization.authorizedStartCommit,
    "initial controller/integration HEAD must equal authorizedStartCommit",
  );
  assert.ok(
    isAncestorAt(
      root,
      authorization.planningCommit,
      authorization.authorizedStartCommit,
    ),
    "planningCommit must be an ancestor of the initial authorizedStartCommit",
  );
  return { root, head };
}

function validateResumeIntegrationRoot(authorization, state) {
  const root = resolve(required("--integration-root"));
  assert.ok(
    sameWindowsPath(root, state.integrationWorktree),
    "later window must reuse the controller/integration worktree recorded in RUN_STATE",
  );
  const head = cleanHead(root, "resumed controller/integration worktree");
  assert.ok(
    isAncestorAt(root, authorization.authorizedStartCommit, head),
    "resumed integration HEAD must descend from authorizedStartCommit",
  );
  for (const [taskId, taskStateValue] of Object.entries(state.taskStates)) {
    if (taskStateValue.status !== "merged") continue;
    assert.ok(
      taskStateValue.mergeCommit &&
        isAncestorAt(root, taskStateValue.mergeCommit, head),
      `resumed integration HEAD omits merged task ${taskId}`,
    );
  }
  return { root, head };
}

function authorizationFrom(name, { checkCurrentTime = true } = {}) {
  const path = resolve(required(name));
  const authorization = readJson(path);
  assert.ok(
    sameWindowsPath(
      path,
      localAppDataPath(
        "AgencyOS",
        "run-authorizations",
        authorization.goalId,
        `${authorization.windowId}.json`,
      ),
    ),
    `${name} must be the exact LOCALAPPDATA authorization path`,
  );
  validateAuthorizationDocument(authorization, { checkCurrentTime });
  return { authorization, path };
}

function nowWithin(deadlineAt, floorAt) {
  const now = Date.now();
  const floor = Date.parse(floorAt);
  const deadline = Date.parse(deadlineAt);
  const value = Math.max(now, floor);
  assert.ok(value <= deadline, "authorization window has ended");
  return new Date(value).toISOString();
}

function statePathFor(goalId) {
  const path = resolve(required("--run-state"));
  assert.ok(
    sameWindowsPath(
      path,
      localAppDataPath("AgencyOS", "goal-runs", goalId, "RUN_STATE.json"),
    ),
    "RUN_STATE must be the exact LOCALAPPDATA goal path",
  );
  return path;
}

function writeFsynced(path, value) {
  const fd = openSync(path, "w");
  try {
    writeSync(fd, value);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function appendFsynced(path, value) {
  const fd = openSync(path, "a");
  try {
    writeSync(fd, value);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function acquireStateLock(lockPath, stateRevision) {
  const token = randomUUID();
  const open = () => openSync(lockPath, "wx");
  let fd;
  try {
    fd = open();
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = readFileSync(lockPath, "utf8");
    const pid = Number(existing.match(/\bpid=(\d+)\b/)?.[1]);
    const existingToken = existing.match(/\btoken=([0-9a-f-]{36})\b/)?.[1];
    assert.ok(
      Number.isInteger(pid) && pid > 0 && existingToken,
      `RUN_STATE lock is malformed and must be inspected manually: ${lockPath}`,
    );
    assert.equal(
      processIsAlive(pid),
      false,
      `RUN_STATE lock is held by live pid ${pid}`,
    );
    const quarantinePath = `${lockPath}.stale.${existingToken}`;
    try {
      linkSync(lockPath, quarantinePath);
    } catch (claimError) {
      throw new Error(
        `stale RUN_STATE lock was already claimed; reload before retrying: ${claimError.message}`,
      );
    }
    assert.equal(
      readFileSync(lockPath, "utf8"),
      readFileSync(quarantinePath, "utf8"),
      "stale lock changed while it was being claimed",
    );
    unlinkSync(lockPath);
    fd = open();
  }
  writeSync(
    fd,
    `pid=${process.pid} token=${token} revision=${stateRevision} at=${new Date().toISOString()}\n`,
  );
  fsyncSync(fd);
  return { fd, token };
}

function persistState(
  path,
  state,
  logLine,
  { initializing = false, preserveBackup = false } = {},
) {
  mkdirSync(dirname(path), { recursive: true });
  const lockPath = `${path}.lock`;
  let lock;
  try {
    lock = acquireStateLock(lockPath, state.stateRevision);

    const backupPath = `${path}.bak`;
    if (existsSync(path)) {
      assert.equal(initializing, false, "refusing to overwrite existing RUN_STATE");
      let predecessor;
      try {
        predecessor = readJson(path);
      } catch (error) {
        assert.equal(
          preserveBackup,
          true,
          `RUN_STATE predecessor is unreadable: ${error.message}`,
        );
        predecessor = readJson(backupPath);
      }
      assert.equal(
        predecessor.stateRevision,
        state.stateRevision - 1,
        "RUN_STATE compare-and-swap failed; reload before retrying",
      );
      if (!preserveBackup) {
        writeFsynced(backupPath, readFileSync(path));
      }
    } else {
      assert.equal(initializing, true, "RUN_STATE is missing; use init");
    }

    const stateTemp = `${path}.tmp`;
    writeFsynced(stateTemp, `${JSON.stringify(state, null, 2)}\n`);
    renameSync(stateTemp, path);

    const sidecarPath = resolve(dirname(path), "RUN_STATE.sha256");
    const sidecarTemp = `${sidecarPath}.tmp`;
    writeFsynced(sidecarTemp, `${state.stateChecksum}\n`);
    renameSync(sidecarTemp, sidecarPath);

    appendFsynced(
      resolve(dirname(path), "RUN_LOG.md"),
      `${logLine} goalId=${state.goalId} windowId=${state.activeWindowId} revision=${state.stateRevision}\n`,
    );
  } finally {
    if (lock !== undefined) {
      closeSync(lock.fd);
      assert.ok(existsSync(lockPath), "RUN_STATE lock disappeared before release");
      const currentLock = readFileSync(lockPath, "utf8");
      assert.equal(
        currentLock.match(/\btoken=([0-9a-f-]{36})\b/)?.[1],
        lock.token,
        "RUN_STATE lock ownership changed before release",
      );
      unlinkSync(lockPath);
    }
  }
}

function authorizationHash(authorization) {
  return checksum(authorization);
}

function taskState(task, authorization, coordinatorId, integrationWorktree) {
  const h00 = task.id === "H00";
  const t00 = task.id === "T00";
  const manual = task.kind.startsWith("manual");
  return {
    status: h00
      ? "accepted"
      : t00
        ? "ready"
        : manual
          ? "manual_pending"
          : "blocked",
    contractTaskId: task.id,
    satisfiedByTaskId: null,
    branch: h00 ? "external/H00" : `pending/${task.id}`,
    worktree: h00
      ? authorization.canonicalRepo
      : `${integrationWorktree}\\pending-${task.id}`,
    startingCommit: authorization.authorizedStartCommit,
    implementationCommit: h00 ? authorization.authorizedStartCommit : null,
    mergeCommit: null,
    revertCommit: null,
    workerId: h00 ? coordinatorId : "unassigned",
    reviewerIds: [],
    ownedPaths: task.ownedPaths,
    repairCount: 0,
    processState: h00
      ? "owner_authorization_validated"
      : t00
        ? "dependency_ready"
        : manual
          ? "awaiting_owner_acceptance"
        : "awaiting_dependencies",
    evidencePaths: h00 ? task.evidence : [],
    invalidatedBy: [],
  };
}

function activeTaskIds(state) {
  return Object.entries(state.taskStates)
    .filter(([taskId, taskState]) => taskStateIsActive(taskId, taskState))
    .map(([taskId]) => taskId)
    .sort();
}

function initialState(authorization, coordinatorId, integrationWorktree) {
  const taskStates = Object.fromEntries(
    graph.tasks.map((task) => [
      task.id,
      taskState(task, authorization, coordinatorId, integrationWorktree),
    ]),
  );
  const unsigned = {
    schemaVersion: 2,
    stateRevision: 1,
    goalId: authorization.goalId,
    activeAuthorizationId: authorization.authorizationId,
    activeWindowId: authorization.windowId,
    planningCommit: authorization.planningCommit,
    authorizedStartCommit: authorization.authorizedStartCommit,
    integrationBranch: graph.integrationBranch,
    integrationWorktree,
    startedAt: authorization.startAt,
    deadlineAt: authorization.deadlineAt,
    stopDispatchAt: new Date(
      Date.parse(authorization.deadlineAt) -
        authorization.stopDispatchMinutesBeforeDeadline * 60 * 1000,
    ).toISOString(),
    diskQuotaBytes: authorization.diskQuotaBytes,
    updatedAt: nowWithin(authorization.deadlineAt, authorization.startAt),
    currentWave: "preflight",
    activeTaskIds: [],
    taskStates,
    authorizationHistory: [
      {
        authorizationId: authorization.authorizationId,
        windowId: authorization.windowId,
        authorizationHash: authorizationHash(authorization),
        startAt: authorization.startAt,
        deadlineAt: authorization.deadlineAt,
      },
    ],
    reviewScores: {},
    aggregateGate: {},
    manualGates: {
      H05: "MANUAL_PENDING",
      H01: "MANUAL_PENDING",
      H02: "MANUAL_PENDING",
      H03: "MANUAL_PENDING",
      H04: "MANUAL_PENDING",
    },
    stopReason: null,
  };
  return { ...unsigned, stateChecksum: checksum(unsigned) };
}

function loadCurrent(path, authorization) {
  const loaded = loadDurableRunState(path);
  assert.equal(
    loaded.recoveryRequired,
    false,
    `${loaded.recoveryLogEntry}; use recover or open-window`,
  );
  validateRunStateDocument(loaded.value, undefined, authorization);
  return loaded.value;
}

function finalizeNext(next, previous, authorization, updatedAt) {
  next.stateRevision = previous.stateRevision + 1;
  next.updatedAt = updatedAt;
  next.activeTaskIds = activeTaskIds(next);
  delete next.stateChecksum;
  next.stateChecksum = checksum(next);
  validateRunStateDocument(next, previous, authorization);
  return next;
}

function dependencyReady(task, state) {
  return task.dependsOn.every((dependencyId) => {
    const dependencyTask = taskById.get(dependencyId);
    const dependencyState = state.taskStates[dependencyId];
    return dependencyTask.kind.startsWith("manual")
      ? dependencyState?.status === "accepted"
      : dependencyState?.status === "merged";
  });
}

function init() {
  const { authorization } = authorizationFrom("--authorization");
  const path = statePathFor(authorization.goalId);
  assert.equal(existsSync(path), false, "RUN_STATE already exists");
  validateAuthorityRoot(authorization);
  const { root: integrationWorktree } =
    validateInitialIntegrationRoot(authorization);
  const state = initialState(
    authorization,
    required("--coordinator-id"),
    integrationWorktree,
  );
  validateRunStateDocument(state, undefined, authorization);
  persistState(path, state, "INIT", { initializing: true });
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        operation: "init",
        runState: path,
        stateRevision: state.stateRevision,
        readyTasks: ["T00"],
      },
      null,
      2,
    ),
  );
}

function inspect() {
  const { authorization } = authorizationFrom("--authorization");
  const path = statePathFor(authorization.goalId);
  const state = loadCurrent(path, authorization);
  const dependencyReadyTasks = graph.tasks
    .filter(
      (task) =>
        state.taskStates[task.id]?.status === "blocked" &&
        dependencyReady(task, state),
    )
    .map((task) => task.id);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        operation: "inspect",
        goalId: state.goalId,
        windowId: state.activeWindowId,
        revision: state.stateRevision,
        activeTaskIds: state.activeTaskIds,
        readyTasks: graph.tasks
          .filter((task) => state.taskStates[task.id]?.status === "ready")
          .map((task) => task.id),
        dependencyReadyBlockedTasks: dependencyReadyTasks,
        stopDispatchAt: state.stopDispatchAt,
      },
      null,
      2,
    ),
  );
}

function transition() {
  const { authorization } = authorizationFrom("--authorization");
  const path = statePathFor(authorization.goalId);
  const previous = loadCurrent(path, authorization);
  const taskId = required("--task-id");
  const to = required("--to");
  assert.ok(previous.taskStates[taskId], `unknown task ${taskId}`);
  const patch = option("--patch") ? readJson(resolve(option("--patch"))) : {};
  const allowedPatchKeys = new Set([
    "branch",
    "worktree",
    "startingCommit",
    "implementationCommit",
    "mergeCommit",
    "revertCommit",
    "workerId",
    "reviewerIds",
    "repairCount",
    "processState",
    "evidencePaths",
    "invalidatedBy",
    "satisfiedByTaskId",
  ]);
  for (const key of Object.keys(patch)) {
    assert.ok(allowedPatchKeys.has(key), `transition patch may not set ${key}`);
  }
  if (to === "dispatched") {
    const contractTask = taskById.get(
      previous.taskStates[taskId].contractTaskId,
    );
    assert.ok(contractTask, `${taskId} has no static dispatch estimate`);
    const now = Date.now();
    assert.ok(
      now < Date.parse(previous.stopDispatchAt),
      "dispatch cutoff has passed",
    );
    assert.ok(
      now + contractTask.estimatedMinutes * 60_000 <=
        Date.parse(previous.stopDispatchAt),
      `${taskId} estimate does not fit before stopDispatchAt`,
    );
    const runFootprintBytes = Number(required("--run-footprint-bytes"));
    assert.ok(
      Number.isInteger(runFootprintBytes) && runFootprintBytes >= 0,
      "--run-footprint-bytes must be a non-negative integer",
    );
    assert.ok(
      runFootprintBytes <= previous.diskQuotaBytes * 0.8,
      "run footprint exceeded the 80% dispatch threshold",
    );
  }
  const next = structuredClone(previous);
  if (to === "paused") {
    patch.processState = `paused_from:${previous.taskStates[taskId].status}`;
  }
  if (taskId === "H05" && to === "accepted") {
    required("--root");
    required("--authority-root");
    validateFormativePhone(
      resolve(required("--manual-artifact")),
      required("--artifact-commit"),
      authorization.goalId,
      required("--coordinator-id"),
    );
  }
  Object.assign(next.taskStates[taskId], patch, { status: to });
  const task = taskById.get(taskId);
  if (task?.kind.startsWith("manual")) {
    if (to === "accepted") next.manualGates[taskId] = "PASS";
    if (to === "failed") next.manualGates[taskId] = "FAIL";
  }
  finalizeNext(
    next,
    previous,
    authorization,
    nowWithin(authorization.deadlineAt, previous.updatedAt),
  );
  persistState(path, next, `TRANSITION taskId=${taskId} status=${to}`);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        operation: "transition",
        taskId,
        status: to,
        stateRevision: next.stateRevision,
      },
      null,
      2,
    ),
  );
}

function updateRun() {
  const { authorization } = authorizationFrom("--authorization");
  const path = statePathFor(authorization.goalId);
  const previous = loadCurrent(path, authorization);
  const patch = readJson(resolve(required("--patch")));
  const allowedKeys = new Set([
    "currentWave",
    "reviewScores",
    "aggregateGate",
    "stopReason",
  ]);
  for (const key of Object.keys(patch)) {
    assert.ok(allowedKeys.has(key), `run patch may not set ${key}`);
  }
  const next = structuredClone(previous);
  Object.assign(next, patch);
  finalizeNext(
    next,
    previous,
    authorization,
    nowWithin(authorization.deadlineAt, previous.updatedAt),
  );
  persistState(path, next, "UPDATE_RUN");
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        operation: "update-run",
        stateRevision: next.stateRevision,
        currentWave: next.currentWave,
        stopReason: next.stopReason,
      },
      null,
      2,
    ),
  );
}

function checkpoint() {
  const { authorization } = authorizationFrom("--authorization");
  const path = statePathFor(authorization.goalId);
  const state = loadCurrent(path, authorization);
  const integrationCommit = required("--integration-commit");
  commitExists(integrationCommit, "checkpoint integrationCommit");
  const candidateRoot = resolve(required("--candidate-root"));
  const candidateHead = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: candidateRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  assert.equal(
    integrationCommit,
    candidateHead,
    "checkpoint integrationCommit must equal candidate-root HEAD",
  );
  for (const [taskId, taskStateValue] of Object.entries(state.taskStates)) {
    if (taskStateValue.status !== "merged") continue;
    assert.ok(
      taskStateValue.mergeCommit &&
        isAncestor(taskStateValue.mergeCommit, integrationCommit),
      `checkpoint integrationCommit omits merged task ${taskId}`,
    );
  }
  const output = resolve(required("--output"));
  assert.ok(
    sameWindowsPath(
      output,
      resolve(
        candidateRoot,
        "tasks",
        "full-mvp",
        "controller-checkpoints",
        `${state.stateRevision}.json`,
      ),
    ),
    "checkpoint output is not the exact candidate-root revision path",
  );
  const taskStatusCounts = {};
  for (const taskStateValue of Object.values(state.taskStates)) {
    taskStatusCounts[taskStateValue.status] =
      (taskStatusCounts[taskStateValue.status] ?? 0) + 1;
  }
  const receipt = {
    schemaVersion: 1,
    goalId: state.goalId,
    stateRevision: state.stateRevision,
    stateChecksum: state.stateChecksum,
    planningCommit: state.planningCommit,
    authorizedStartCommit: state.authorizedStartCommit,
    integrationCommit,
    activeWindowId: state.activeWindowId,
    currentWave: state.currentWave,
    taskStatusCounts,
    readyTaskIds: Object.entries(state.taskStates)
      .filter(([, taskStateValue]) => taskStateValue.status === "ready")
      .map(([taskId]) => taskId)
      .sort(),
    activeTaskIds: state.activeTaskIds,
    manualGates: state.manualGates,
    recordedAt: nowWithin(authorization.deadlineAt, state.updatedAt),
  };
  mkdirSync(dirname(output), { recursive: true });
  if (existsSync(output)) {
    const existing = readJson(output);
    assert.equal(
      existing.stateChecksum,
      receipt.stateChecksum,
      "checkpoint revision already exists for different RUN_STATE",
    );
    assert.equal(
      existing.integrationCommit,
      receipt.integrationCommit,
      "checkpoint revision already exists for different integration commit",
    );
    console.log(
      JSON.stringify(
        {
          result: "PASS",
          operation: "checkpoint",
          output,
          stateRevision: state.stateRevision,
          noOp: true,
        },
        null,
        2,
      ),
    );
    return;
  }
  writeFsynced(output, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        operation: "checkpoint",
        output,
        stateRevision: state.stateRevision,
      },
      null,
      2,
    ),
  );
}

function createRepair() {
  const { authorization } = authorizationFrom("--authorization");
  const path = statePathFor(authorization.goalId);
  const previous = loadCurrent(path, authorization);
  const contractTaskId = required("--contract-task-id");
  const contractTask = taskById.get(contractTaskId);
  assert.ok(contractTask?.kind === "automated", "repair contract must be automated");
  const contractState = previous.taskStates[contractTaskId];
  assert.ok(
    ["reverted", "invalidated"].includes(contractState.status),
    "repair requires reverted or invalidated contract state",
  );
  const ordinal = contractState.repairCount + 1;
  assert.ok(
    ordinal <= graph.rules.maxRepairTurnsPerTask,
    "repair turn limit reached",
  );
  const repairId = `RPR-${contractTaskId}-${ordinal}`;
  assert.equal(previous.taskStates[repairId], undefined, `${repairId} already exists`);
  const next = structuredClone(previous);
  next.taskStates[repairId] = {
    status: "ready",
    contractTaskId,
    satisfiedByTaskId: null,
    branch: required("--branch"),
    worktree: required("--worktree"),
    startingCommit: required("--starting-commit"),
    implementationCommit: null,
    mergeCommit: null,
    revertCommit: null,
    workerId: required("--worker-id"),
    reviewerIds: [],
    ownedPaths: contractTask.ownedPaths,
    repairCount: ordinal,
    processState: "dependency_ready",
    evidencePaths: [],
    invalidatedBy: [],
  };
  next.taskStates[contractTaskId].repairCount = ordinal;
  finalizeNext(
    next,
    previous,
    authorization,
    nowWithin(authorization.deadlineAt, previous.updatedAt),
  );
  persistState(path, next, `CREATE_REPAIR taskId=${repairId} status=ready`);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        operation: "create-repair",
        repairId,
        stateRevision: next.stateRevision,
      },
      null,
      2,
    ),
  );
}

function recover() {
  const { authorization } = authorizationFrom("--authorization");
  const path = statePathFor(authorization.goalId);
  const loaded = loadDurableRunState(path);
  assert.equal(loaded.recoveryRequired, true, "RUN_STATE does not require recovery");
  validateRunStateDocument(loaded.value, undefined, authorization);
  const previous = loaded.value;
  const next = structuredClone(previous);
  finalizeNext(
    next,
    previous,
    authorization,
    nowWithin(authorization.deadlineAt, previous.updatedAt),
  );
  persistState(path, next, `RECOVER source=${loaded.source}`, {
    preserveBackup: true,
  });
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        operation: "recover",
        source: loaded.source,
        stateRevision: next.stateRevision,
      },
      null,
      2,
    ),
  );
}

function openWindow() {
  const { authorization: previousAuthorization } = authorizationFrom(
    "--previous-authorization",
    {
    checkCurrentTime: false,
    },
  );
  const { authorization } = authorizationFrom("--authorization");
  assert.equal(authorization.goalId, previousAuthorization.goalId);
  assert.equal(authorization.planningCommit, previousAuthorization.planningCommit);
  assert.equal(
    authorization.authorizedStartCommit,
    previousAuthorization.authorizedStartCommit,
  );
  assert.notEqual(authorization.windowId, previousAuthorization.windowId);
  assert.notEqual(
    authorization.authorizationId,
    previousAuthorization.authorizationId,
  );
  const path = statePathFor(authorization.goalId);
  const loaded = loadDurableRunState(path);
  const previous = loaded.value;
  validateRunStateDocument(previous, undefined, previousAuthorization, {
    authorizationCheckCurrentTime: false,
  });
  validateAuthorityRoot(authorization);
  validateResumeIntegrationRoot(authorization, previous);
  assert.deepEqual(
    previous.activeTaskIds,
    [],
    "finish or pause active tasks before opening a new window",
  );

  const next = structuredClone(previous);
  next.activeAuthorizationId = authorization.authorizationId;
  next.activeWindowId = authorization.windowId;
  next.deadlineAt = authorization.deadlineAt;
  next.stopDispatchAt = new Date(
    Date.parse(authorization.deadlineAt) -
      authorization.stopDispatchMinutesBeforeDeadline * 60 * 1000,
  ).toISOString();
  next.diskQuotaBytes = authorization.diskQuotaBytes;
  next.authorizationHistory.push({
    authorizationId: authorization.authorizationId,
    windowId: authorization.windowId,
    authorizationHash: authorizationHash(authorization),
    startAt: authorization.startAt,
    deadlineAt: authorization.deadlineAt,
  });
  finalizeNext(
    next,
    previous,
    authorization,
    nowWithin(authorization.deadlineAt, authorization.startAt),
  );
  persistState(path, next, "OPEN_WINDOW", {
    preserveBackup: loaded.recoveryRequired,
  });
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        operation: "open-window",
        windowId: next.activeWindowId,
        stateRevision: next.stateRevision,
        recoveredFrom: loaded.source,
      },
      null,
      2,
    ),
  );
}

switch (command) {
  case "init":
    init();
    break;
  case "inspect":
    inspect();
    break;
  case "transition":
    transition();
    break;
  case "update-run":
    updateRun();
    break;
  case "checkpoint":
    checkpoint();
    break;
  case "create-repair":
    createRepair();
    break;
  case "recover":
    recover();
    break;
  case "open-window":
    openWindow();
    break;
  default:
    throw new Error(
      "use init, inspect, transition, update-run, checkpoint, create-repair, recover, or open-window",
    );
}
