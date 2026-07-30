import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const productPath = resolve(
  root,
  "docs/full-mvp/01_PRODUCT_AND_UX_CONTRACT.md",
);
const readmePath = resolve(root, "docs/full-mvp/00_README.md");
const dagPath = resolve(root, "docs/full-mvp/03_IMPLEMENTATION_DAG.md");
const graphPath = resolve(root, "docs/full-mvp/TASK_GRAPH.json");
const executionSchemasPath = resolve(
  root,
  "docs/full-mvp/EXECUTION_SCHEMAS.json",
);
const promptPath = resolve(root, "docs/full-mvp/05_OVERNIGHT_GOAL_PROMPT.md");
const gapRoadmapPath = resolve(
  root,
  "docs/full-mvp/06_GAP_AUDIT_AND_WINDOW_ROADMAP.md",
);
const agentsPath = resolve(root, "AGENTS.md");

const product = readFileSync(productPath, "utf8");
const readme = readFileSync(readmePath, "utf8");
const dag = readFileSync(dagPath, "utf8");
const graph = JSON.parse(readFileSync(graphPath, "utf8"));
const executionSchemas = JSON.parse(readFileSync(executionSchemasPath, "utf8"));
const prompt = readFileSync(promptPath, "utf8");
const gapRoadmap = readFileSync(gapRoadmapPath, "utf8");
const agents = readFileSync(agentsPath, "utf8");

const unique = (values) => [...new Set(values)];
const productJourneys = unique(
  [...product.matchAll(/^### (J-\d{2})\b/gm)].map((match) => match[1]),
);
const productFixtures = unique(
  [...product.matchAll(/\b(AT-(?:J\d{2}(?:-[A-Z])?|ZERO|PARTIAL))\b/g)].map(
    (match) => match[1],
  ),
);
const dagTaskIds = unique(
  [...dag.matchAll(/^### ([A-Z]\d{2})\s+—/gm)].map((match) => match[1]),
);

assert.equal(graph.schemaVersion, 2, "unexpected task graph schema");
for (const schemaName of [
  "OwnerAuthorization",
  "RunState",
  "ControllerCheckpoint",
  "AcceptanceEvidence",
  "ReviewArtifact",
  "ImplementationReceipt",
  "CoordinatorAcceptance",
  "ReleaseReviewArtifact",
  "ReleaseAcceptance",
  "ManualAttestation",
  "H05FormativePhone",
  "H01PhysicalPhone",
  "H02Accessibility",
  "H03CleanRecovery",
  "H04RealGit",
]) {
  assert.ok(executionSchemas.$defs?.[schemaName], `missing schema ${schemaName}`);
}
assert.ok(graph.planningCommitSource, "planning commit source is required");
assert.ok(graph.authorizedStartCommitSource, "authorized start source required");
assert.ok(graph.authorizationPathTemplate, "external authorization path required");
assert.ok(graph.controllerStateTemplate, "external controller state path required");
assert.equal(graph.canonicalEvidenceTaskId, "V02");
for (const authorityPath of [
  "AGENTS.md",
  "docs/full-mvp/00_README.md",
  "docs/full-mvp/TASK_GRAPH.json",
  "docs/full-mvp/06_GAP_AUDIT_AND_WINDOW_ROADMAP.md",
  "docs/full-mvp/EXECUTION_SCHEMAS.json",
  "scripts/validate-full-mvp-plan.mjs",
  "scripts/validate-full-mvp-execution.mjs",
  "scripts/validate-full-mvp-controller.mjs",
  "scripts/analyze-full-mvp-schedule.mjs",
  "scripts/classify-production-audit.mjs",
  "scripts/full-mvp-controller.mjs",
]) {
  assert.ok(
    graph.planningAuthorityPaths.includes(authorityPath),
    `planning authority omits ${authorityPath}`,
  );
}
assert.ok(graph.authorizationPathTemplate.includes("<goal-id>"));
assert.ok(graph.authorizationPathTemplate.includes("<window-id>"));
assert.ok(graph.controllerWorktreeTemplate.includes("<goal-id>"));
assert.equal(graph.rules.mainUntouched, true);
assert.equal(graph.rules.pushAllowed, false);
assert.equal(graph.rules.deployAllowed, false);
assert.equal(graph.rules.realDataMigrationAllowed, false);
assert.deepEqual(graph.defaultPostMergeCommands, ["npm run verify"]);
assert.ok(
  executionSchemas.$defs.RunTaskState.properties.status.enum.includes("paused"),
  "RUN_STATE lifecycle omits paused continuation status",
);
assert.equal(graph.resourceModel.reviewMinutesPerArtifact, 15);
assert.equal(graph.resourceModel.coordinationMinutesPerAutomatedTask, 10);
assert.deepEqual(graph.certificationOnlyPaths, [
  "docs/CURRENT_STATE.md",
  "docs/NEXT_AGENT_HANDOFF.md",
  "tasks/full-mvp/**",
]);

const taskIds = graph.tasks.map((task) => task.id);
assert.equal(new Set(taskIds).size, taskIds.length, "duplicate task IDs");
const taskById = new Map(graph.tasks.map((task) => [task.id, task]));

for (const task of graph.tasks) {
  for (const field of [
    "dependsOn",
    "parallelSafeWith",
    "ownedPaths",
    "journeys",
    "acceptanceFixtures",
    "acceptanceCommands",
    "evidence",
    "reviewRoles",
  ]) {
    assert.ok(Array.isArray(task[field]), `${task.id}.${field} must be an array`);
  }
  if (task.postMergeCommands !== undefined) {
    assert.ok(Array.isArray(task.postMergeCommands) && task.postMergeCommands.length > 0);
  }
  assert.ok(task.acceptanceCommands.length > 0, `${task.id} has no command`);
  assert.ok(task.evidence.length > 0, `${task.id} has no evidence path`);
  assert.ok(
    Number.isInteger(task.estimatedMinutes) && task.estimatedMinutes > 0,
    `${task.id} has invalid estimate`,
  );
  for (const dependency of task.dependsOn) {
    assert.ok(taskById.has(dependency), `${task.id} has unknown dependency ${dependency}`);
  }
  for (const parallelId of task.parallelSafeWith) {
    const other = taskById.get(parallelId);
    assert.ok(other, `${task.id} has unknown parallel task ${parallelId}`);
    assert.ok(
      other.parallelSafeWith.includes(task.id),
      `${task.id}/${parallelId} parallel declaration is not symmetric`,
    );
  }
}

const visiting = new Set();
const visited = new Set();
function visit(taskId) {
  assert.ok(!visiting.has(taskId), `dependency cycle at ${taskId}`);
  if (visited.has(taskId)) return;
  visiting.add(taskId);
  for (const dependency of taskById.get(taskId).dependsOn) visit(dependency);
  visiting.delete(taskId);
  visited.add(taskId);
}
for (const taskId of taskIds) visit(taskId);

for (const journey of productJourneys) {
  assert.ok(
    graph.tasks.some((task) => task.journeys.includes(journey)),
    `unowned product journey ${journey}`,
  );
}
for (const fixture of productFixtures) {
  assert.ok(graph.fixtureEvidenceRequirements?.[fixture], `missing evidence requirements for ${fixture}`);
  assert.ok(
    graph.fixtureEvidenceRequirements[fixture].levels.length > 0,
    `${fixture} has no required evidence level`,
  );
  assert.ok(
    graph.fixtureEvidenceRequirements[fixture].engines.length > 0,
    `${fixture} has no required evidence engine`,
  );
  for (const level of graph.fixtureEvidenceRequirements[fixture].levels) {
    const prefixes = graph.evidenceLevelTaskPrefixes[level];
    assert.ok(prefixes?.length > 0, `${fixture}/${level} has no source-task policy`);
    const sources = graph.tasks.filter(
      (task) =>
        task.acceptanceFixtures.includes(fixture) &&
        prefixes.some((prefix) => task.id.startsWith(prefix)),
    );
    assert.ok(sources.length > 0, `${fixture}/${level} has no eligible source task`);
    if (level !== "browser") {
      assert.ok(
        sources.some((task) =>
          task.acceptanceCommands.some((command) => command.startsWith("node --test ")),
        ),
        `${fixture}/${level} has no focused node-test command`,
      );
    }
  }
  assert.ok(
    graph.tasks.some((task) => task.acceptanceFixtures.includes(fixture)),
    `unowned acceptance fixture ${fixture}`,
  );
}

assert.ok(taskById.has("U05"), "missing early visible product slice U05");
assert.ok(taskById.has("H05"), "missing formative physical-phone checkpoint H05");
assert.ok(taskById.has("U06"), "missing final UI composition owner U06");
assert.ok(taskById.has("H04"), "missing real Git manual gate H04");
assert.ok(
  taskById.get("W03").dependsOn.includes("W04"),
  "W03 must wait for W04 verified pre-migration backup support",
);
for (const formativeDependency of ["U01", "U02", "U03"]) {
  assert.ok(
    taskById.get("H05").dependsOn.includes(formativeDependency),
    `H05 must follow ${formativeDependency}`,
  );
}
for (const integratedSurface of ["U00", "U02", "U03"]) {
  assert.ok(
    taskById.get("U01").dependsOn.includes(integratedSurface),
    `U01 formative composition must integrate ${integratedSurface}`,
  );
}
assert.ok(taskById.get("U06").dependsOn.includes("H05"), "U06 must wait for H05");
for (const resultKey of [
  "desktopDashboardNotAppendedBelowPhone",
  "desktopTruthViaExplicitNavigation",
]) {
  assert.ok(
    executionSchemas.$defs.H05FormativePhone.allOf[1].properties.results
      .required.includes(resultKey),
    `H05 schema omits ${resultKey}`,
  );
}
for (const manualTaskId of ["H01", "H02", "H03", "H04"]) {
  assert.deepEqual(
    taskById.get(manualTaskId).parallelSafeWith,
    [],
    `${manualTaskId} shares the owner and may not claim parallel execution`,
  );
}
assert.ok(taskById.get("U00").dependsOn.includes("U05"), "U00 must integrate U05");
assert.ok(taskById.get("U01").dependsOn.includes("U05"), "U01 must integrate U05");
assert.ok(taskById.get("V02").dependsOn.includes("U06"), "V02 must verify U06 composition");
assert.ok(taskById.get("R00").dependsOn.includes("H04"), "release omits H04");
assert.ok(
  !taskById.get("V03").ownedPaths.some((path) => path.startsWith("docs/full-mvp")),
  "V03 may not rewrite accepted FULL MVP authority",
);

for (const finalTaskId of ["V03", "R00"]) {
  const task = taskById.get(finalTaskId);
  assert.ok(task, `missing ${finalTaskId}`);
  for (const journey of productJourneys) {
    assert.ok(task.journeys.includes(journey), `${finalTaskId} omits ${journey}`);
  }
  for (const fixture of productFixtures) {
    assert.ok(
      task.acceptanceFixtures.includes(fixture),
      `${finalTaskId} omits ${fixture}`,
    );
  }
}

assert.deepEqual(
  [...dagTaskIds].sort(),
  [...taskIds].sort(),
  "DAG task headings and TASK_GRAPH task IDs differ",
);

for (const requiredText of [
  "Automated FULL MVP implementation candidate",
  "manual acceptance gates remain",
  "Do not checkout, merge, fast-forward, reset, or push main.",
  "The graph is expected to require multiple authorized windows.",
  "full-mvp-controller.mjs init",
  "`paused`",
]) {
  assert.ok(prompt.includes(requiredText), `launch prompt omits: ${requiredText}`);
}
for (const requiredText of [
  "testedCommit",
  "artifactCommit",
  "H01-H04",
  "later windows",
  "05_OVERNIGHT_GOAL_PROMPT.md",
  "pending independent re-acceptance",
]) {
  assert.ok(readme.includes(requiredText), `FULL MVP README omits: ${requiredText}`);
}
for (const requiredText of [
  "Owner-Authorized FULL MVP Goal Mode",
  "BLOCKED_PRECONDITION",
  "TASK_GRAPH.json",
  "main",
]) {
  assert.ok(agents.includes(requiredText), `AGENTS.md omits FULL MVP boundary: ${requiredText}`);
}
for (const requiredText of [
  "v0.3 supervised local staging",
  "minimum productive windows: 8",
  "operational planning windows: 11",
  "H05",
  "U06",
  "BLOCKED_PRECONDITION",
  "FULL MVP already built",
]) {
  assert.ok(
    gapRoadmap.includes(requiredText),
    `gap/window roadmap omits: ${requiredText}`,
  );
}

assert.ok(
  !process.argv.includes("--require-implementation-evidence"),
  "existence-only evidence mode was removed; use validate-full-mvp-execution.mjs",
);

const estimatedAutomatedMinutes = graph.tasks
  .filter((task) => task.kind === "automated")
  .reduce((sum, task) => sum + task.estimatedMinutes, 0);
const criticalPathMemo = new Map();
function criticalMinutes(taskId) {
  if (criticalPathMemo.has(taskId)) return criticalPathMemo.get(taskId);
  const task = taskById.get(taskId);
  const result =
    task.estimatedMinutes +
    Math.max(0, ...task.dependsOn.map((dependency) => criticalMinutes(dependency)));
  criticalPathMemo.set(taskId, result);
  return result;
}
const candidateEndToEndCriticalPathMinutes = criticalMinutes("V03");

console.log(
  JSON.stringify(
    {
      graphId: graph.graphId,
      tasks: graph.tasks.length,
      journeys: productJourneys,
      fixtures: productFixtures,
      acyclic: true,
      estimatedAutomatedMinutes,
      candidateEndToEndCriticalPathMinutes,
      fullCandidateLikelyMultiWindow:
        candidateEndToEndCriticalPathMinutes > 8 * 60,
    },
    null,
    2,
  ),
);
