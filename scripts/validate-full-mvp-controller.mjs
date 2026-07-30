import assert from "node:assert/strict";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { checksum } from "./validate-full-mvp-execution.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const controllerPath = resolve(repoRoot, "scripts/full-mvp-controller.mjs");

function git(...args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function gitAt(root, ...args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function cloneRepo(target) {
  const result = spawnSync(
    "git",
    ["clone", "--quiet", "--no-hardlinks", repoRoot, target],
    {
      cwd: tempRoot,
      encoding: "utf8",
      shell: false,
    },
  );
  assert.equal(result.status, 0, result.stderr);
}

function syntheticDescendant(root, parent, message) {
  const result = spawnSync(
    "git",
    ["commit-tree", `${parent}^{tree}`, "-p", parent, "-m", message],
    {
      cwd: root,
      encoding: "utf8",
      shell: false,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "Agency OS Controller Self Test",
        GIT_AUTHOR_EMAIL: "controller-self-test@example.invalid",
        GIT_AUTHOR_DATE: "2026-07-29T00:00:00.000Z",
        GIT_COMMITTER_NAME: "Agency OS Controller Self Test",
        GIT_COMMITTER_EMAIL: "controller-self-test@example.invalid",
        GIT_COMMITTER_DATE: "2026-07-29T00:00:00.000Z",
      },
    },
  );
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function runController(args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [controllerPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    env: { ...process.env, LOCALAPPDATA: tempRoot },
  });
  assert.equal(
    result.status,
    expectedStatus,
    `controller ${args[0]} exited ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return result;
}

function runControllerAsync(args) {
  return new Promise((resolveResult) => {
    const child = spawn(process.execPath, [controllerPath, ...args], {
      cwd: repoRoot,
      shell: false,
      env: { ...process.env, LOCALAPPDATA: tempRoot },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => {
      resolveResult({ status, stdout, stderr });
    });
  });
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function authorization({
  authorizationId,
  goalId,
  windowId,
  planningCommit,
  authorizedStartCommit,
  startAt,
  deadlineAt,
}) {
  return {
    schemaVersion: 2,
    authorizationId,
    goalId,
    windowId,
    planningCommit,
    authorizedStartCommit,
    canonicalRepo: "C:\\Agency_os_first\\AGENCY_OS_FIRST",
    startAt,
    deadlineAt,
    stopDispatchMinutesBeforeDeadline: 30,
    diskQuotaBytes: 10 * 1024 ** 3,
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
}

const tempRoot = mkdtempSync(resolve(tmpdir(), "agency-os-controller-"));
async function main() {
try {
  const goalId = "goal-controller-self-test";
  const planningCommit = git("rev-parse", "HEAD");
  const authorizedStartCommit = syntheticDescendant(
    repoRoot,
    planningCommit,
    "test: authorized clean descendant",
  );
  const expectedEvolvedIntegrationHead = syntheticDescendant(
    repoRoot,
    authorizedStartCommit,
    "test: evolved integration state",
  );
  assert.equal(
    git("merge-base", "--is-ancestor", planningCommit, authorizedStartCommit),
    "",
    "self-test requires authorizedStartCommit to descend from planningCommit",
  );
  const authorityRoot = resolve(tempRoot, "authority-repo");
  const integrationRoot = resolve(tempRoot, `integration-repo-${goalId}`);
  cloneRepo(authorityRoot);
  cloneRepo(integrationRoot);
  assert.equal(
    syntheticDescendant(
      integrationRoot,
      planningCommit,
      "test: authorized clean descendant",
    ),
    authorizedStartCommit,
  );
  gitAt(authorityRoot, "checkout", "--quiet", "--detach", planningCommit);
  const now = Date.now();
  const firstAuthorization = authorization({
    authorizationId: "authorization-window-001",
    goalId,
    windowId: "window-controller-001",
    planningCommit,
    authorizedStartCommit,
    startAt: new Date(now - 60_000).toISOString(),
    deadlineAt: new Date(now + 4 * 60 * 60_000).toISOString(),
  });
  const firstAuthorizationPath = resolve(
    tempRoot,
    "AgencyOS",
    "run-authorizations",
    goalId,
    `${firstAuthorization.windowId}.json`,
  );
  const runStatePath = resolve(
    tempRoot,
    "AgencyOS",
    "goal-runs",
    goalId,
    "RUN_STATE.json",
  );
  writeJson(firstAuthorizationPath, firstAuthorization);
  const wrongAuthorizationPath = resolve(
    tempRoot,
    "wrong-root",
    "AgencyOS",
    "run-authorizations",
    goalId,
    `${firstAuthorization.windowId}.json`,
  );
  writeJson(wrongAuthorizationPath, firstAuthorization);
  runController([
    "init",
    "--authorization",
    wrongAuthorizationPath,
    "--run-state",
    runStatePath,
    "--coordinator-id",
    "coordinator-self-test",
    "--authority-root",
    authorityRoot,
    "--integration-root",
    integrationRoot,
  ], 1);
  runController([
    "init",
    "--authorization",
    firstAuthorizationPath,
    "--run-state",
    resolve(tempRoot, "wrong-root", "AgencyOS", "goal-runs", goalId, "RUN_STATE.json"),
    "--coordinator-id",
    "coordinator-self-test",
    "--authority-root",
    authorityRoot,
    "--integration-root",
    integrationRoot,
  ], 1);

  const common = [
    "--authorization",
    firstAuthorizationPath,
    "--run-state",
    runStatePath,
  ];
  gitAt(authorityRoot, "checkout", "--quiet", "--detach", `${planningCommit}^`);
  runController([
    "init",
    ...common,
    "--coordinator-id",
    "coordinator-self-test",
    "--authority-root",
    authorityRoot,
    "--integration-root",
    integrationRoot,
  ], 1);
  gitAt(authorityRoot, "checkout", "--quiet", "--detach", planningCommit);
  gitAt(integrationRoot, "checkout", "--quiet", "--detach", planningCommit);
  runController([
    "init",
    ...common,
    "--coordinator-id",
    "coordinator-self-test",
    "--authority-root",
    authorityRoot,
    "--integration-root",
    integrationRoot,
  ], 1);
  gitAt(
    integrationRoot,
    "checkout",
    "--quiet",
    "--detach",
    authorizedStartCommit,
  );
  runController([
    "init",
    ...common,
    "--coordinator-id",
    "coordinator-self-test",
    "--authority-root",
    authorityRoot,
    "--integration-root",
    integrationRoot,
  ]);
  const initialized = JSON.parse(readFileSync(runStatePath, "utf8"));
  assert.equal(initialized.taskStates.H00.status, "accepted");
  assert.equal(initialized.taskStates.T00.status, "ready");
  assert.equal(initialized.taskStates.H05.status, "manual_pending");
  assert.equal(initialized.taskStates.H01.status, "manual_pending");
  assert.deepEqual(initialized.activeTaskIds, []);
  assert.equal(initialized.authorizedStartCommit, authorizedStartCommit);
  assert.equal(initialized.integrationWorktree, integrationRoot);

  const patchPath = resolve(tempRoot, "transition-patch.json");
  writeJson(patchPath, {
    branch: "goal/controller-self-test/T00",
    worktree: resolve(tempRoot, "worktrees", "T00"),
    workerId: "worker-self-test",
    processState: "worker_dispatched",
  });
  runController([
    "transition",
    ...common,
    "--task-id",
    "T00",
    "--to",
    "dispatched",
    "--run-footprint-bytes",
    String(18 * 1024 ** 3),
    "--patch",
    patchPath,
  ], 1);
  assert.equal(
    JSON.parse(readFileSync(runStatePath, "utf8")).stateRevision,
    1,
    "rejected disk-threshold dispatch mutated RUN_STATE",
  );
  const lockPath = `${runStatePath}.lock`;
  writeFileSync(lockPath, "held-by-another-controller\n", "utf8");
  runController([
    "transition",
    ...common,
    "--task-id",
    "T00",
    "--to",
    "dispatched",
    "--run-footprint-bytes",
    "1024",
    "--patch",
    patchPath,
  ], 1);
  assert.equal(readFileSync(lockPath, "utf8"), "held-by-another-controller\n");
  rmSync(lockPath);
  const staleToken = "00000000-0000-4000-8000-000000000001";
  writeFileSync(
    lockPath,
    `pid=2147483646 token=${staleToken} revision=1 at=2026-07-29T00:00:00.000Z\n`,
    "utf8",
  );
  const reclaimResults = await Promise.all([
    runControllerAsync([
      "transition",
      ...common,
      "--task-id",
      "T00",
      "--to",
      "dispatched",
      "--run-footprint-bytes",
      "1024",
      "--patch",
      patchPath,
    ]),
    runControllerAsync([
      "transition",
      ...common,
      "--task-id",
      "T00",
      "--to",
      "dispatched",
      "--run-footprint-bytes",
      "1024",
      "--patch",
      patchPath,
    ]),
  ]);
  assert.deepEqual(
    reclaimResults.map((result) => result.status).sort(),
    [0, 1],
    `exactly one stale-lock reclaimer must win:\n${JSON.stringify(reclaimResults)}`,
  );
  assert.ok(
    existsSync(`${lockPath}.stale.${staleToken}`),
    "stale lock quarantine is missing",
  );
  writeJson(patchPath, {
    implementationCommit: authorizedStartCommit,
    processState: "implementation_recorded",
    evidencePaths: ["tasks/full-mvp/T00/BASELINE.json"],
  });
  runController([
    "transition",
    ...common,
    "--task-id",
    "T00",
    "--to",
    "implemented",
    "--patch",
    patchPath,
  ]);
  writeJson(patchPath, {
    reviewerIds: ["reviewer-self-test"],
    processState: "verification_passed",
  });
  for (const status of ["verified", "accepted"]) {
    runController([
      "transition",
      ...common,
      "--task-id",
      "T00",
      "--to",
      status,
      "--patch",
      patchPath,
    ]);
  }
  writeJson(patchPath, {
    mergeCommit: authorizedStartCommit,
    processState: "aggregate_verification_pending",
  });
  runController([
    "transition",
    ...common,
    "--task-id",
    "T00",
    "--to",
    "merge_pending_verification",
    "--patch",
    patchPath,
  ]);
  writeJson(patchPath, { processState: "merged_and_verified" });
  runController([
    "transition",
    ...common,
    "--task-id",
    "T00",
    "--to",
    "merged",
    "--patch",
    patchPath,
  ]);
  writeJson(patchPath, {
    branch: "goal/controller-self-test/T01",
    worktree: resolve(tempRoot, "worktrees", "T01"),
    workerId: "unassigned",
    processState: "dependency_ready",
  });
  runController([
    "transition",
    ...common,
    "--task-id",
    "T01",
    "--to",
    "ready",
    "--patch",
    patchPath,
  ]);
  writeJson(patchPath, {
    branch: "goal/controller-self-test/T01",
    worktree: resolve(tempRoot, "worktrees", "T01"),
    workerId: "worker-self-test",
    processState: "worker_dispatched",
  });
  runController([
    "transition",
    ...common,
    "--task-id",
    "T01",
    "--to",
    "dispatched",
    "--run-footprint-bytes",
    "1024",
    "--patch",
    patchPath,
  ]);
  runController([
    "transition",
    ...common,
    "--task-id",
    "T01",
    "--to",
    "paused",
    "--patch",
    patchPath,
  ]);

  writeFileSync(
    resolve(dirname(runStatePath), "RUN_STATE.sha256"),
    `sha256:${"0".repeat(64)}\n`,
    "utf8",
  );
  const recoveryBlocked = runController(["inspect", ...common], 1);
  assert.match(recoveryBlocked.stderr, /use recover or open-window/);
  runController(["recover", ...common]);

  const expiredStart = new Date(now - 2 * 60 * 60_000).toISOString();
  const expiredDeadline = new Date(now - 60 * 60_000).toISOString();
  const expiredAuthorization = {
    ...firstAuthorization,
    startAt: expiredStart,
    deadlineAt: expiredDeadline,
  };
  writeJson(firstAuthorizationPath, expiredAuthorization);
  const expiredState = JSON.parse(readFileSync(runStatePath, "utf8"));
  expiredState.startedAt = expiredStart;
  expiredState.deadlineAt = expiredDeadline;
  expiredState.stopDispatchAt = new Date(
    Date.parse(expiredDeadline) - 30 * 60_000,
  ).toISOString();
  expiredState.updatedAt = new Date(
    Date.parse(expiredDeadline) - 60_000,
  ).toISOString();
  expiredState.authorizationHistory[0] = {
    authorizationId: expiredAuthorization.authorizationId,
    windowId: expiredAuthorization.windowId,
    authorizationHash: checksum(expiredAuthorization),
    startAt: expiredStart,
    deadlineAt: expiredDeadline,
  };
  delete expiredState.stateChecksum;
  expiredState.stateChecksum = checksum(expiredState);
  writeJson(runStatePath, expiredState);
  writeFileSync(
    resolve(dirname(runStatePath), "RUN_STATE.sha256"),
    `${expiredState.stateChecksum}\n`,
    "utf8",
  );
  appendFileSync(
    resolve(dirname(runStatePath), "RUN_LOG.md"),
    `SELF_TEST_EXPIRED goalId=${goalId} windowId=${expiredAuthorization.windowId} revision=${expiredState.stateRevision}\n`,
    "utf8",
  );

  const secondAuthorization = authorization({
    authorizationId: "authorization-window-002",
    goalId,
    windowId: "window-controller-002",
    planningCommit,
    authorizedStartCommit,
    startAt: new Date(now - 30_000).toISOString(),
    deadlineAt: new Date(now + 2 * 60 * 60_000).toISOString(),
  });
  const secondAuthorizationPath = resolve(
    tempRoot,
    "AgencyOS",
    "run-authorizations",
    goalId,
    `${secondAuthorization.windowId}.json`,
  );
  writeJson(secondAuthorizationPath, secondAuthorization);
  const evolvedIntegrationHead = syntheticDescendant(
    integrationRoot,
    authorizedStartCommit,
    "test: evolved integration state",
  );
  assert.equal(evolvedIntegrationHead, expectedEvolvedIntegrationHead);
  gitAt(
    integrationRoot,
    "checkout",
    "--quiet",
    "--detach",
    evolvedIntegrationHead,
  );
  assert.notEqual(evolvedIntegrationHead, authorizedStartCommit);
  assert.equal(
    gitAt(
      integrationRoot,
      "merge-base",
      "--is-ancestor",
      authorizedStartCommit,
      evolvedIntegrationHead,
    ),
    "",
  );
  runController([
    "open-window",
    "--previous-authorization",
    firstAuthorizationPath,
    "--authorization",
    secondAuthorizationPath,
    "--run-state",
    runStatePath,
    "--authority-root",
    authorityRoot,
    "--integration-root",
    integrationRoot,
  ]);

  const secondCommon = [
    "--authorization",
    secondAuthorizationPath,
    "--run-state",
    runStatePath,
  ];
  writeJson(patchPath, { processState: "worker_resumed" });
  runController([
    "transition",
    ...secondCommon,
    "--task-id",
    "T01",
    "--to",
    "dispatched",
    "--run-footprint-bytes",
    "1024",
    "--patch",
    patchPath,
  ]);
  runController([
    "transition",
    ...secondCommon,
    "--task-id",
    "T01",
    "--to",
    "paused",
    "--patch",
    patchPath,
  ]);
  const runPatchPath = resolve(tempRoot, "run-patch.json");
  writeJson(runPatchPath, {
    currentWave: "foundation",
    reviewScores: { T00: 96 },
    aggregateGate: { T00: "PASS" },
    stopReason: "window_checkpoint",
  });
  runController([
    "update-run",
    ...secondCommon,
    "--patch",
    runPatchPath,
  ]);

  const finalState = JSON.parse(readFileSync(runStatePath, "utf8"));
  const candidateRoot = resolve(tempRoot, "candidate-repo");
  const clone = spawnSync(
    "git",
    ["clone", "--quiet", "--no-hardlinks", repoRoot, candidateRoot],
    {
      cwd: tempRoot,
      encoding: "utf8",
      shell: false,
    },
  );
  assert.equal(clone.status, 0, clone.stderr);
  assert.equal(
    syntheticDescendant(
      candidateRoot,
      planningCommit,
      "test: authorized clean descendant",
    ),
    authorizedStartCommit,
  );
  assert.equal(
    syntheticDescendant(
      candidateRoot,
      authorizedStartCommit,
      "test: evolved integration state",
    ),
    evolvedIntegrationHead,
  );
  gitAt(
    candidateRoot,
    "checkout",
    "--quiet",
    "--detach",
    evolvedIntegrationHead,
  );
  const checkpointPath = resolve(
    candidateRoot,
    "tasks",
    "full-mvp",
    "controller-checkpoints",
    `${finalState.stateRevision}.json`,
  );
  runController([
    "checkpoint",
    ...secondCommon,
    "--integration-commit",
    evolvedIntegrationHead,
    "--candidate-root",
    candidateRoot,
    "--output",
    checkpointPath,
  ]);
  const checkpointBytes = readFileSync(checkpointPath, "utf8");
  const checkpointRetry = runController([
    "checkpoint",
    ...secondCommon,
    "--integration-commit",
    evolvedIntegrationHead,
    "--candidate-root",
    candidateRoot,
    "--output",
    checkpointPath,
  ]);
  assert.match(checkpointRetry.stdout, /"noOp": true/);
  assert.equal(readFileSync(checkpointPath, "utf8"), checkpointBytes);
  const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));
  assert.equal(finalState.activeWindowId, secondAuthorization.windowId);
  assert.equal(finalState.authorizationHistory.length, 2);
  assert.equal(finalState.taskStates.T00.status, "merged");
  assert.equal(finalState.taskStates.T01.status, "paused");
  assert.deepEqual(finalState.activeTaskIds, []);
  assert.equal(finalState.currentWave, "foundation");
  assert.equal(finalState.stopReason, "window_checkpoint");
  assert.equal(checkpoint.stateRevision, finalState.stateRevision);
  assert.equal(checkpoint.stateChecksum, finalState.stateChecksum);
  assert.deepEqual(checkpoint.activeTaskIds, []);
  runController([
    "inspect",
    ...secondCommon,
  ]);

  console.log(
    JSON.stringify(
      {
        selfTest: "PASS",
        operations: [
          "init",
          "transition",
          "pause-resume",
          "update-run",
          "checkpoint",
          "checkpoint-idempotency",
          "authorized-descendant-initialization",
          "initial-start-commit-mismatch-rejection",
          "later-window-evolved-integration-resume",
          "authority-worktree-exact-pin",
          "exact-localappdata-binding",
          "dispatch-disk-budget",
          "exclusive-state-lock",
          "stale-lock-recovery",
          "recover",
          "expired-window-rollover",
          "inspect",
        ],
        finalRevision: finalState.stateRevision,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
}

await main();
