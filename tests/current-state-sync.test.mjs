import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const repoRoot = new URL("../", import.meta.url);

async function readText(path) {
  return readFile(new URL(path, repoRoot), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

test("current source documents point to the canonical current-state authority", async () => {
  const sources = [
    "AGENTS.md",
    "README.md",
    "docs/AGENT_START_BRIEF.md",
    "docs/NEXT_AGENT_HANDOFF.md",
    "docs/PRODUCT_DEVELOPMENT_FLOW.md",
    "docs/WORKFLOW_FOR_PHONE_AND_AGENTS.md",
    "docs/RELEASE_GATES.md",
    "docs/STACK_AND_TOOLING_DECISION.md",
    "docs/EVENT_LOG_INTEGRITY.md",
    "docs/DATA_MODEL_AND_INVARIANTS.md",
    "docs/AGENCY_OS_ARCHITECTURE.md",
  ];

  const contents = await Promise.all(sources.map(readText));

  for (const [index, content] of contents.entries()) {
    assert.match(
      content,
      /CURRENT_STATE\.md/,
      `${sources[index]} must reference docs/CURRENT_STATE.md`,
    );
  }
});

test("current stage and next milestone agree across compact operating docs", async () => {
  const currentState = await readText("docs/CURRENT_STATE.md");
  const agentStart = await readText("docs/AGENT_START_BRIEF.md");
  const handoff = await readText("docs/NEXT_AGENT_HANDOFF.md");
  const productFlow = await readText("docs/PRODUCT_DEVELOPMENT_FLOW.md");
  const workflow = await readText("docs/WORKFLOW_FOR_PHONE_AND_AGENTS.md");

  assert.match(currentState, /v0\.3-supervised-local-staging/);

  for (const content of [agentStart, handoff, productFlow]) {
    assert.match(content, /v0\.3 Supervised Local Staging/i);
  }

  for (const content of [currentState, agentStart, handoff, productFlow, workflow]) {
    assert.match(content, /private runtime data-home contract/i);
    assert.doesNotMatch(content, /mobile capture review UI affordance for capture\.review_marked/i);
  }
});

test("tracked Agency OS staging records match the synchronized project stage", async () => {
  const projects = await readJson("data/projects.json");
  const workItems = await readJson("data/work-items.json");
  const claims = await readJson("data/claims.json");
  const evidence = await readJson("data/evidence.json");
  const eventLines = (await readText("data/events.jsonl")).trim().split(/\r?\n/);
  const lastEvent = JSON.parse(eventLines.at(-1));

  const agencyOs = projects.find((project) => project.id === "project-agency-os");
  assert.equal(
    agencyOs.currentMilestone,
    "v0.3 state synchronization and private-runtime hardening",
  );
  assert.equal(
    agencyOs.nextAction,
    "Define the private runtime data-home contract outside the public Git worktree.",
  );

  assert.equal(
    workItems.find((item) => item.id === "work-canonical-portfolio-model")?.status,
    "done",
  );
  assert.equal(
    workItems.find((item) => item.id === "work-local-capture-ledger")?.status,
    "done",
  );
  assert.equal(
    workItems.find((item) => item.id === "work-current-state-synchronization")?.status,
    "doing",
  );
  assert.equal(
    workItems.find((item) => item.id === "work-private-runtime-data-home")?.status,
    "queued",
  );

  const currentClaim = claims.find((claim) => claim.id === "claim-current-state-synchronized");
  assert.equal(currentClaim?.status, "verified");
  assert.deepEqual(currentClaim?.requiredEvidenceTypes, ["command_output", "git_commit"]);
  assert.deepEqual(currentClaim?.linkedEvidenceIds, [
    "evidence-current-state-verify",
    "evidence-current-state-git",
  ]);
  assert.equal(
    evidence.some((item) => item.id === "evidence-current-state-verify"),
    true,
  );
  assert.equal(evidence.some((item) => item.id === "evidence-current-state-git"), true);

  assert.equal(lastEvent.sequence, 4);
  assert.equal(lastEvent.action, "system.current_state_synchronized");
  assert.equal(lastEvent.entityId, "project-agency-os");
});
