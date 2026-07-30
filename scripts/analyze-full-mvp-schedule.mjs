import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const graph = JSON.parse(
  readFileSync(resolve(root, "docs/full-mvp/TASK_GRAPH.json"), "utf8"),
);
const tasks = graph.tasks;
const taskById = new Map(tasks.map((task) => [task.id, task]));
const automated = tasks.filter((task) => task.kind === "automated");

function automatedCriticalPath(taskId, memo = new Map()) {
  if (memo.has(taskId)) return memo.get(taskId);
  const task = taskById.get(taskId);
  assert.ok(task, `unknown task ${taskId}`);
  const dependencyMinutes = task.dependsOn.length
    ? Math.max(
        ...task.dependsOn.map((dependencyId) =>
          automatedCriticalPath(dependencyId, memo),
        ),
      )
    : 0;
  const duration =
    task.kind === "automated" || task.kind === "manual_preflight"
      ? task.estimatedMinutes
      : 0;
  const value = dependencyMinutes + duration;
  memo.set(taskId, value);
  return value;
}

function endToEndCriticalPath(taskId, memo = new Map()) {
  if (memo.has(taskId)) return memo.get(taskId);
  const task = taskById.get(taskId);
  assert.ok(task, `unknown task ${taskId}`);
  const dependencyMinutes = task.dependsOn.length
    ? Math.max(
        ...task.dependsOn.map((dependencyId) =>
          endToEndCriticalPath(dependencyId, memo),
        ),
      )
    : 0;
  const value = dependencyMinutes + task.estimatedMinutes;
  memo.set(taskId, value);
  return value;
}

const automatedMinutes = automated.reduce(
  (total, task) => total + task.estimatedMinutes,
  0,
);
const oversizedTaskIds = automated
  .filter(
    (task) =>
      task.estimatedMinutes > graph.resourceModel.maxAutomatedTaskMinutes,
  )
  .map((task) => task.id);
assert.deepEqual(
  oversizedTaskIds,
  [],
  `automated tasks exceed ${graph.resourceModel.maxAutomatedTaskMinutes} minutes`,
);
const safePairs = [];
for (const task of automated) {
  for (const otherId of task.parallelSafeWith) {
    const other = taskById.get(otherId);
    if (other?.kind !== "automated" || task.id >= other.id) continue;
    safePairs.push({
      tasks: [task.id, other.id],
      maximumPossibleOverlapMinutes: Math.min(
        task.estimatedMinutes,
        other.estimatedMinutes,
      ),
    });
  }
}
const declaredOverlapUpperBoundMinutes = safePairs.reduce(
  (total, pair) => total + pair.maximumPossibleOverlapMinutes,
  0,
);
const workerCapacityLowerBoundMinutes = Math.ceil(
  automatedMinutes / graph.maxWorkers,
);
const automatedDependencyCriticalPathMinutes = automatedCriticalPath("V03");
const endToEndCriticalPathMinutes = endToEndCriticalPath("V03");
const declaredParallelismLowerBoundMinutes = Math.max(
  automatedDependencyCriticalPathMinutes,
  workerCapacityLowerBoundMinutes,
  automatedMinutes - declaredOverlapUpperBoundMinutes,
);
const productiveWindowMinutes =
  graph.resourceModel.authorizationWindowMinutes -
  graph.resourceModel.stopDispatchReserveMinutes;
const minimumProductiveWindows = Math.ceil(
  declaredParallelismLowerBoundMinutes / productiveWindowMinutes,
);
const automatedReviewArtifacts = automated.reduce(
  (total, task) => total + task.reviewRoles.length,
  0,
);
const reviewMinutes =
  automatedReviewArtifacts * graph.resourceModel.reviewMinutesPerArtifact;
const coordinationMinutes =
  automated.length * graph.resourceModel.coordinationMinutesPerAutomatedTask;
const ownerGateMinutes = tasks
  .filter((task) => task.reviewRoles.includes("owner"))
  .reduce((total, task) => total + task.estimatedMinutes, 0);
const postAutomationManualAndReleaseMinutes = tasks
  .filter((task) => /^H0[1-5]$/.test(task.id) || task.id === "R00")
  .reduce((total, task) => total + task.estimatedMinutes, 0);
const serialOverheadPlanningWindows = Math.ceil(
  (reviewMinutes + coordinationMinutes) / productiveWindowMinutes,
);
const operationalPlanningWindows =
  minimumProductiveWindows + serialOverheadPlanningWindows;
let fullVerifyInvocations = 0;
for (const task of automated) {
  fullVerifyInvocations += task.acceptanceCommands.filter(
    (command) => command === "npm run verify",
  ).length;
  fullVerifyInvocations += (
    task.postMergeCommands ?? graph.defaultPostMergeCommands
  ).filter((command) => command === "npm run verify").length;
}

const scheduleBaseline = {
  automatedMinutes,
  automatedDependencyCriticalPathMinutes,
  endToEndCriticalPathMinutes,
  declaredParallelismLowerBoundMinutes,
  minimumProductiveWindows,
  automatedReviewArtifacts,
  reviewMinutes,
  coordinationMinutes,
  ownerGateMinutes,
  postAutomationManualAndReleaseMinutes,
  serialOverheadPlanningWindows,
  operationalPlanningWindows,
  fullVerifyInvocations,
};
assert.deepEqual(
  graph.scheduleBaseline,
  scheduleBaseline,
  "TASK_GRAPH scheduleBaseline is stale; update graph and planning prose together",
);

console.log(
  JSON.stringify(
    {
      result: "PASS",
      automatedTaskCount: automated.length,
      ...scheduleBaseline,
      maxAutomatedTaskMinutes: graph.resourceModel.maxAutomatedTaskMinutes,
      oversizedTaskIds,
      maxWorkers: graph.maxWorkers,
      declaredSafePairs: safePairs,
      declaredOverlapUpperBoundMinutes,
      workerCapacityLowerBoundMinutes,
      productiveWindowMinutes,
      caveat:
        "Eight windows is a mathematical automated-work lower bound. The 11-window operational budget serializes estimated review and coordination overhead; repairs, command runtime and context switching can extend it further.",
    },
    null,
    2,
  ),
);
