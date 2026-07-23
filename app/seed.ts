export const focusStack = {
  project: "Agency OS / Project Portfolio Staging",
  intent:
    "Build the global state layer first: one reliable command center over scattered AI projects, agents, repos and chats.",
  nextAction:
    "Open the MVP, review the four active lanes, and replace sample records with your real portfolio.",
};

export const quickDecisions = [
  { id: "verify", label: "Evidence waiting", count: 3 },
  { id: "blockers", label: "Blockers to resolve", count: 2 },
  { id: "agents", label: "Agent claims to inspect", count: 4 },
];

export const todaySignals = [
  {
    source: "Buzz / Block",
    summary: "Market is moving toward shared human-agent workspaces.",
  },
  {
    source: "Codex",
    summary: "Local project threads are powerful but still fragmented globally.",
  },
  {
    source: "GitHub",
    summary: "Commits and checks become the first hard evidence source.",
  },
];

export const projects = [
  {
    name: "Agency OS",
    purpose:
      "A command center that turns a solo builder plus AI agents into a small accountable organization.",
    stage: "staging",
    state: "active",
    priority: "core",
    priorityLabel: "Core product",
    nextAction: "Replace seed data with the real project portfolio.",
    lastVerifiedChange: "Visual MVP bootstrapped today",
    evidenceState: "fresh",
  },
  {
    name: "ai1geo",
    purpose:
      "Revenue and validation playground for AI-first operational workflows.",
    stage: "validation",
    state: "active",
    priority: "revenue",
    priorityLabel: "Revenue",
    nextAction: "Define one paid workflow and one proof metric.",
    lastVerifiedChange: "No fresh proof attached",
    evidenceState: "stale",
  },
  {
    name: "OpenClaw / TeleClo",
    purpose:
      "Execution and delivery infrastructure for agents, remote work and Telegram control surfaces.",
    stage: "build",
    state: "blocked",
    priority: "infra",
    priorityLabel: "Infrastructure",
    nextAction: "Decide the first scoped-write agent permission.",
    lastVerifiedChange: "Agent harness exists, verification policy missing",
    evidenceState: "stale",
  },
  {
    name: "Lab slot",
    purpose:
      "One creative game or visual experiment that stays bounded and does not compete with the core product.",
    stage: "selection",
    state: "active",
    priority: "lab",
    priorityLabel: "Laboratory",
    nextAction: "Choose one public-playable lab project, pause the rest.",
    lastVerifiedChange: "No selected lab yet",
    evidenceState: "missing",
  },
];

export const workItems = [
  {
    project: "Agency OS",
    title: "Canonical portfolio model",
    status: "doing",
    statusLabel: "doing",
    done: "Projects have purpose, state, stage, next action, blocker and evidence freshness.",
    verify: "Verified when all active projects have one next action.",
  },
  {
    project: "Agency OS",
    title: "Manual evidence attach flow",
    status: "queued",
    statusLabel: "queued",
    done: "A claim can be linked to URL, file path, commit, screenshot or check result.",
    verify: "Verified by one real GitHub commit attached to one work item.",
  },
  {
    project: "OpenClaw",
    title: "Agent run ingestion API",
    status: "queued",
    statusLabel: "queued",
    done: "Agent can submit objective, result claim, changed files and evidence.",
    verify: "Verified by one local agent run visible in the ledger.",
  },
];

export const blockerQueue = [
  {
    project: "OpenClaw / TeleClo",
    question: "Which agent gets first scoped write permission?",
    impact:
      "Without a tiny permission policy, agent actions stay trapped as chat claims.",
  },
  {
    project: "Lab slot",
    question: "Which creative project survives as the single active lab?",
    impact:
      "The lab becomes useful only when the other tempting branches are explicitly paused.",
  },
];

export const evidenceQueue = [
  {
    project: "Agency OS",
    claim: "Visual MVP exists",
    evidence: "Local running app + successful build",
    status: "verified",
    statusLabel: "verified",
  },
  {
    project: "ai1geo",
    claim: "Commercial workflow has user value",
    evidence: "Needs one external signal or paid test",
    status: "missing",
    statusLabel: "missing",
  },
  {
    project: "OpenClaw",
    claim: "Agent can safely update project state",
    evidence: "Needs scoped token + audit log",
    status: "pending",
    statusLabel: "pending",
  },
  {
    project: "Lab slot",
    claim: "One lab is selected",
    evidence: "Needs explicit pause/archive decision",
    status: "missing",
    statusLabel: "missing",
  },
];

export const agentRuns = [
  {
    id: "codex-001",
    agent: "Codex",
    status: "awaiting verification",
    objective: "Create the first local Agency OS dashboard.",
    scope: "Read/write in the new project folder only.",
    claim: "MVP implemented and buildable.",
    proof: "Local source, app screen and build output.",
  },
  {
    id: "openc-law-001",
    agent: "OpenClaw",
    status: "planned",
    objective: "Submit the first structured agent run event.",
    scope: "Read portfolio state, propose evidence only.",
    claim: "No claim yet.",
    proof: "Waiting for API stub.",
  },
  {
    id: "github-001",
    agent: "GitHub watcher",
    status: "planned",
    objective: "Import commits, PR checks and deploy URLs as evidence.",
    scope: "Read repository events.",
    claim: "No claim yet.",
    proof: "Waiting for connector.",
  },
];

export const integrations = [
  {
    name: "GitHub",
    role: "Hard evidence",
    firstSignal: "Commits, PRs, checks, releases and deploy links.",
  },
  {
    name: "Codex",
    role: "Work execution",
    firstSignal: "Task summaries, changed files, build/test results.",
  },
  {
    name: "Claude Code",
    role: "Parallel reasoning",
    firstSignal: "Claims, plans and repo changes requiring verification.",
  },
  {
    name: "OpenClaw",
    role: "Agent harness",
    firstSignal: "Agent run events and scoped-write requests.",
  },
  {
    name: "Telegram",
    role: "Phone control",
    firstSignal: "Approve, block, verify and capture from short sessions.",
  },
];
