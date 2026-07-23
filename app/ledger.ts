import actorsData from "../data/actors.json";
import agentRunsData from "../data/agent-runs.json";
import approvalsData from "../data/approvals.json";
import blockersData from "../data/blockers.json";
import claimsData from "../data/claims.json";
import decisionsData from "../data/decisions.json";
import evidenceData from "../data/evidence.json";
import projectsData from "../data/projects.json";
import tracesData from "../data/traces.json";
import workItemsData from "../data/work-items.json";

type Severity = "critical" | "warning" | "info";
type ActionType = "approve" | "verify" | "unblock" | "capture";
type VerificationStatus = "missing" | "pending" | "verified" | "rejected" | "stale";
type ApprovalState = "requested" | "approved" | "rejected" | "expired" | "used";

export type ProjectRecord = {
  id: string;
  name: string;
  purpose: string;
  successDefinition: string;
  priorityLane: "core" | "revenue" | "infrastructure" | "laboratory";
  stage: "idea" | "validation" | "build" | "launch" | "growth" | "maintenance";
  state: "active" | "blocked" | "paused" | "archived";
  currentMilestone: string;
  nextAction: string;
  mainBlockerId: string | null;
  decisionNeededId: string | null;
  ownerId: string;
  canonicalRepository: string | null;
  productionUrl: string | null;
  lastUpdated: string;
};

export type EvidenceRecord = {
  id: string;
  claimId: string;
  projectId: string;
  type: string;
  source: string;
  urlOrPath: string | null;
  createdAt: string;
  submittedBy: string;
  verifiedBy: string | null;
  verificationStatus: VerificationStatus;
  freshnessExpiresAt: string | null;
  hash: string | null;
  knownGaps: string[];
};

export type ClaimRecord = {
  id: string;
  projectId: string;
  subjectType: string;
  subjectId: string;
  claim: string;
  status: "verified" | "pending" | "missing_evidence" | "rejected";
  requiredEvidenceTypes: string[];
  linkedEvidenceIds: string[];
};

export type BlockerRecord = {
  id: string;
  projectId: string;
  question: string;
  impact: string;
  ownerId: string;
  state: "open" | "resolved" | "paused";
  createdAt: string;
  decisionId: string | null;
};

export type DecisionRecord = {
  id: string;
  projectId: string;
  question: string;
  context: string;
  optionsConsidered: string[];
  selectedOption: string | null;
  rationale: string | null;
  state: "open" | "selected" | "rejected" | "superseded";
  decidedBy: string | null;
  decidedAt: string | null;
  reviewDate: string;
  linkedEvidenceIds: string[];
};

export type AgentRunRecord = {
  id: string;
  agentId: string;
  traceId: string;
  parentRunId: string | null;
  toolHarness: string;
  objective: string;
  permissionScope: string;
  startedAt: string;
  completedAt: string | null;
  resultClaim: string;
  filesChanged: string[];
  externalActions: string[];
  linkedEvidenceIds: string[];
  verificationStatus: VerificationStatus;
  humanDecision: "pending_review" | "approved" | "rejected";
};

export type ApprovalRecord = {
  id: string;
  requestedBy: string;
  requestedAt: string;
  actionType: string;
  entityType: string;
  entityId: string;
  scope: string;
  riskLevel: "low" | "medium" | "high";
  requiredEvidenceTypes: string[];
  state: ApprovalState;
  approverId: string | null;
  decidedAt: string | null;
  expiresAt: string | null;
  rationale: string;
  linkedEvidenceIds: string[];
};

export type ActorRecord = {
  id: string;
  displayName: string;
  actorType: "person" | "agent" | "system" | "external";
  trustLevel: string;
  allowedScopes: string[];
  credentialSource: string;
  lastSeenAt: string | null;
};

export type TraceRecord = {
  id: string;
  rootRunId: string;
  parentTraceId: string | null;
  startedAt: string;
  endedAt: string | null;
  handoffIds: string[];
  toolCalls: string[];
  artifacts: string[];
  redactionStatus: string;
  verificationDecision: string;
};

export type LedgerEvent = {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: Record<string, unknown> | null;
  evidenceIds: string[];
  source: string;
  idempotencyKey: string;
};

export type StateLedger = {
  actors: ActorRecord[];
  projects: ProjectRecord[];
  workItems: WorkItemRecord[];
  evidence: EvidenceRecord[];
  claims: ClaimRecord[];
  decisions: DecisionRecord[];
  agentRuns: AgentRunRecord[];
  approvals: ApprovalRecord[];
  blockers: BlockerRecord[];
  traces: TraceRecord[];
  events: LedgerEvent[];
};

export type WorkItemRecord = {
  id: string;
  projectId: string;
  title: string;
  ownerId: string;
  status: "queued" | "doing" | "blocked" | "done";
  priority: "low" | "medium" | "high";
  definitionOfDone: string;
  verificationMethod: string;
  linkedEvidenceIds: string[];
  linkedAgentRunIds: string[];
};

export type SanityCheck = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  project?: string;
};

export type RecommendedStep = {
  id: string;
  project: string;
  action: string;
  reason: string;
  evidenceTarget: string;
};

export type PhoneReviewAction = {
  id: string;
  type: ActionType;
  label: string;
  detail: string;
  target: string;
  evidenceHint: string;
  count?: number;
};

const rawEvents = [
  {
    id: "event-v0-2-plan-created",
    timestamp: "2026-07-22T22:35:00Z",
    actorId: "agent-codex",
    action: "plan_first_recorded",
    entityType: "task",
    entityId: "task-agency-os-v0-2",
    before: null,
    after: { artifactPath: "AGENCY_OS_PLAN.md" },
    evidenceIds: [],
    source: "codex_thread",
    idempotencyKey: "2026-07-22-v0-2-plan-created",
  },
  {
    id: "event-v0-2-ledger-added",
    timestamp: "2026-07-22T22:55:00Z",
    actorId: "agent-codex",
    action: "state_ledger_added",
    entityType: "project",
    entityId: "project-agency-os",
    before: null,
    after: { files: ["app/ledger.ts", "app/page.tsx", "app/globals.css"] },
    evidenceIds: ["evidence-local-v0-2-verify"],
    source: "local_files",
    idempotencyKey: "2026-07-22-v0-2-ledger-added",
  },
  {
    id: "event-v0-2-honesty-closure",
    timestamp: "2026-07-23T00:00:00Z",
    actorId: "agent-codex",
    action: "honesty_closure_recorded",
    entityType: "task",
    entityId: "task-agency-os-v0-2",
    before: null,
    after: {
      artifactPath: "docs/CURRENT_EVIDENCE.md",
      knownBlocker: "production_dependency_audit",
    },
    evidenceIds: ["evidence-local-v0-2-verify"],
    source: "local_files",
    idempotencyKey: "2026-07-23-honesty-closure",
  },
] satisfies LedgerEvent[];

export const stateLedger: StateLedger = {
  actors: actorsData as ActorRecord[],
  projects: projectsData as ProjectRecord[],
  workItems: workItemsData as WorkItemRecord[],
  evidence: evidenceData as EvidenceRecord[],
  claims: claimsData as ClaimRecord[],
  decisions: decisionsData as DecisionRecord[],
  agentRuns: agentRunsData as AgentRunRecord[],
  approvals: approvalsData as ApprovalRecord[],
  blockers: blockersData as BlockerRecord[],
  traces: tracesData as TraceRecord[],
  events: rawEvents,
};

const projectById = new Map(stateLedger.projects.map((project) => [project.id, project]));
const evidenceById = new Map(stateLedger.evidence.map((evidence) => [evidence.id, evidence]));
const actorById = new Map(stateLedger.actors.map((actor) => [actor.id, actor]));

function hasText(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function projectEvidence(projectId: string) {
  return stateLedger.evidence.filter((evidence) => evidence.projectId === projectId);
}

function projectHasFreshEvidence(projectId: string) {
  return projectEvidence(projectId).some(
    (evidence) => evidence.verificationStatus === "verified",
  );
}

function projectFreshnessLabel(projectId: string) {
  const records = projectEvidence(projectId);
  if (records.some((evidence) => evidence.verificationStatus === "verified")) {
    return "fresh";
  }
  if (records.some((evidence) => evidence.verificationStatus === "pending")) {
    return "pending";
  }
  return "missing";
}

export function validateLedger(ledger: StateLedger = stateLedger): string[] {
  const errors: string[] = [];
  const projectIds = new Set(ledger.projects.map((project) => project.id));
  const actorIds = new Set(ledger.actors.map((actor) => actor.id));
  const evidenceIds = new Set(ledger.evidence.map((evidence) => evidence.id));
  const decisionIds = new Set(ledger.decisions.map((decision) => decision.id));
  const approvalIds = new Set(ledger.approvals.map((approval) => approval.id));
  const traceIds = new Set(ledger.traces.map((trace) => trace.id));
  const idempotencyKeys = new Set<string>();

  for (const project of ledger.projects) {
    if (!actorIds.has(project.ownerId)) {
      errors.push(`project ${project.id} references unknown owner ${project.ownerId}`);
    }
    if (project.mainBlockerId && !ledger.blockers.some((blocker) => blocker.id === project.mainBlockerId)) {
      errors.push(`project ${project.id} references unknown blocker ${project.mainBlockerId}`);
    }
    if (project.decisionNeededId && !decisionIds.has(project.decisionNeededId)) {
      errors.push(`project ${project.id} references unknown decision ${project.decisionNeededId}`);
    }
  }

  for (const evidence of ledger.evidence) {
    if (!projectIds.has(evidence.projectId)) {
      errors.push(`evidence ${evidence.id} references unknown project ${evidence.projectId}`);
    }
    if (!actorIds.has(evidence.submittedBy)) {
      errors.push(`evidence ${evidence.id} references unknown submitter ${evidence.submittedBy}`);
    }
    if (evidence.verificationStatus === "verified" && !evidence.verifiedBy) {
      errors.push(`evidence ${evidence.id} is verified without verifier`);
    }
    if (evidence.verifiedBy && !actorIds.has(evidence.verifiedBy)) {
      errors.push(`evidence ${evidence.id} references unknown verifier ${evidence.verifiedBy}`);
    }
    if (
      evidence.verificationStatus === "verified" &&
      evidence.submittedBy === evidence.verifiedBy &&
      actorById.get(evidence.submittedBy)?.actorType === "agent"
    ) {
      errors.push(`evidence ${evidence.id} is self-verified by agent ${evidence.submittedBy}`);
    }
  }

  for (const claim of ledger.claims) {
    if (!projectIds.has(claim.projectId)) {
      errors.push(`claim ${claim.id} references unknown project ${claim.projectId}`);
    }
    for (const id of claim.linkedEvidenceIds) {
      if (!evidenceIds.has(id)) {
        errors.push(`claim ${claim.id} references unknown evidence ${id}`);
      }
    }
  }

  for (const blocker of ledger.blockers) {
    if (!projectIds.has(blocker.projectId)) {
      errors.push(`blocker ${blocker.id} references unknown project ${blocker.projectId}`);
    }
    if (blocker.decisionId && !decisionIds.has(blocker.decisionId)) {
      errors.push(`blocker ${blocker.id} references unknown decision ${blocker.decisionId}`);
    }
  }

  for (const approval of ledger.approvals) {
    if (!actorIds.has(approval.requestedBy)) {
      errors.push(`approval ${approval.id} references unknown requester ${approval.requestedBy}`);
    }
    if (approval.approverId && !actorIds.has(approval.approverId)) {
      errors.push(`approval ${approval.id} references unknown approver ${approval.approverId}`);
    }
  }

  for (const run of ledger.agentRuns) {
    if (!actorIds.has(run.agentId)) {
      errors.push(`agent run ${run.id} references unknown agent ${run.agentId}`);
    }
    if (!traceIds.has(run.traceId)) {
      errors.push(`agent run ${run.id} references unknown trace ${run.traceId}`);
    }
    if (run.verificationStatus === "verified") {
      const hasVerifiedEvidence = run.linkedEvidenceIds.some(
        (id) => evidenceById.get(id)?.verificationStatus === "verified",
      );
      if (!hasVerifiedEvidence) {
        errors.push(`agent run ${run.id} is verified without verified evidence`);
      }
    }
  }

  for (const trace of ledger.traces) {
    if (!ledger.agentRuns.some((run) => run.id === trace.rootRunId)) {
      errors.push(`trace ${trace.id} references unknown root run ${trace.rootRunId}`);
    }
  }

  for (const event of ledger.events) {
    if (!actorIds.has(event.actorId)) {
      errors.push(`event ${event.id} references unknown actor ${event.actorId}`);
    }
    if (idempotencyKeys.has(event.idempotencyKey)) {
      errors.push(`duplicate idempotency key ${event.idempotencyKey}`);
    }
    idempotencyKeys.add(event.idempotencyKey);
    for (const id of event.evidenceIds) {
      if (!evidenceIds.has(id)) {
        errors.push(`event ${event.id} references unknown evidence ${id}`);
      }
    }
  }

  for (const workItem of ledger.workItems) {
    if (!projectIds.has(workItem.projectId)) {
      errors.push(`work item ${workItem.id} references unknown project ${workItem.projectId}`);
    }
    if (!actorIds.has(workItem.ownerId)) {
      errors.push(`work item ${workItem.id} references unknown owner ${workItem.ownerId}`);
    }
    if (workItem.status === "done" && workItem.linkedEvidenceIds.length === 0) {
      errors.push(`work item ${workItem.id} is done without evidence`);
    }
  }

  // Referenced approval IDs should exist before external actions can run.
  for (const approvalId of Array.from(approvalIds)) {
    if (!approvalId.startsWith("approval-")) {
      errors.push(`approval ${approvalId} must use approval-* id namespace`);
    }
  }

  return errors;
}

export function canRunExternalAction(
  approvalId: string | null,
  approvals: ApprovalRecord[] = stateLedger.approvals,
  now = new Date(),
) {
  if (!approvalId) {
    return false;
  }
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval || approval.state !== "approved") {
    return false;
  }
  if (approval.expiresAt && new Date(approval.expiresAt).getTime() < now.getTime()) {
    return false;
  }
  return true;
}

export function getSanityChecks(ledger: StateLedger = stateLedger): SanityCheck[] {
  const checks: SanityCheck[] = [];
  const activeProjects = ledger.projects.filter((project) => project.state === "active");

  for (const project of ledger.projects) {
    if (!projectHasFreshEvidence(project.id)) {
      checks.push({
        id: `stale-evidence-${project.id}`,
        severity: projectFreshnessLabel(project.id) === "missing" ? "critical" : "warning",
        title: "Evidence is not fresh",
        detail: `Freshness is ${projectFreshnessLabel(project.id)} from linked evidence records.`,
        project: project.name,
      });
    }

    if (project.state === "active" && !hasText(project.nextAction)) {
      checks.push({
        id: `missing-next-action-${project.id}`,
        severity: "critical",
        title: "Missing next action",
        detail: "Every active project needs one physical next action.",
        project: project.name,
      });
    }

    if (
      project.state === "blocked" &&
      !ledger.blockers.some(
        (blocker) => blocker.projectId === project.id && blocker.state === "open",
      )
    ) {
      checks.push({
        id: `blocked-without-decision-${project.id}`,
        severity: "critical",
        title: "Blocked without decision",
        detail: "A blocked project needs a visible decision question.",
        project: project.name,
      });
    }
  }

  for (const run of ledger.agentRuns) {
    if (
      run.resultClaim !== "No claim yet." &&
      run.humanDecision === "pending_review"
    ) {
      checks.push({
        id: `agent-claim-without-proof-${run.id}`,
        severity: run.verificationStatus === "verified" ? "info" : "warning",
        title: "Agent claim needs human review",
        detail: `${run.toolHarness}: ${run.resultClaim}`,
      });
    }
  }

  if (activeProjects.length > 4) {
    checks.push({
      id: "too-many-active-lanes",
      severity: "warning",
      title: "Too many active lanes",
      detail: `${activeProjects.length} projects are active. Keep the night build at four or fewer lanes.`,
    });
  }

  for (const error of validateLedger(ledger)) {
    checks.push({
      id: `ledger-validation-${checks.length}`,
      severity: "critical",
      title: "Ledger validation failed",
      detail: error,
    });
  }

  return checks;
}

export function getRecommendedSteps(ledger: StateLedger = stateLedger): RecommendedStep[] {
  const missingEvidence = ledger.claims
    .filter((claim) => claim.status !== "verified")
    .slice(0, 2)
    .map((claim) => {
      const project = projectById.get(claim.projectId);
      return {
        id: `claim-${claim.id}`,
        project: project?.name ?? claim.projectId,
        action: `Attach proof for: ${claim.claim}`,
        reason: "The dashboard should not trust claims without evidence.",
        evidenceTarget: claim.requiredEvidenceTypes.join(", "),
      };
    });

  const blockerSteps = ledger.blockers
    .filter((blocker) => blocker.state === "open")
    .slice(0, 2)
    .map((blocker) => {
      const project = projectById.get(blocker.projectId);
      return {
        id: `blocker-${blocker.id}`,
        project: project?.name ?? blocker.projectId,
        action: blocker.question,
        reason: blocker.impact,
        evidenceTarget: "Decision note or explicit pause/archive action.",
      };
    });

  return [...missingEvidence, ...blockerSteps].slice(0, 4);
}

export function getPhoneReviewQueue(ledger: StateLedger = stateLedger): PhoneReviewAction[] {
  const sanityChecks = getSanityChecks(ledger);
  const missingEvidenceCount = ledger.claims.filter(
    (claim) => claim.status !== "verified",
  ).length;
  const pendingAgentClaims = ledger.agentRuns.filter(
    (run) => run.humanDecision === "pending_review",
  ).length;
  const firstBlocker = ledger.blockers.find((blocker) => blocker.state === "open");
  const firstPendingAgent = ledger.agentRuns.find(
    (run) => run.humanDecision === "pending_review",
  );

  return [
    {
      id: "phone-verify",
      type: "verify",
      label: "Verify evidence",
      detail: "Check claims that are pending or missing proof.",
      target: "Evidence queue",
      evidenceHint: "Attach URL, commit, screenshot, file path or test result.",
      count: missingEvidenceCount,
    },
    {
      id: "phone-unblock",
      type: "unblock",
      label: "Resolve blockers",
      detail: "Answer the decisions that prevent the next action.",
      target: firstBlocker
        ? projectById.get(firstBlocker.projectId)?.name ?? firstBlocker.projectId
        : "Portfolio",
      evidenceHint: firstBlocker?.question ?? "Write the decision and rationale.",
      count: ledger.blockers.filter((blocker) => blocker.state === "open").length,
    },
    {
      id: "phone-approve",
      type: "approve",
      label: "Review agent claims",
      detail: "Approve only runs with a proof trail.",
      target: firstPendingAgent
        ? actorById.get(firstPendingAgent.agentId)?.displayName ?? firstPendingAgent.agentId
        : "Agent ledger",
      evidenceHint: "Look for changed files, build output, test output or artifact path.",
      count: pendingAgentClaims,
    },
    {
      id: "phone-capture",
      type: "capture",
      label: "Capture drift",
      detail: "Record any project that feels active but has no fresh state.",
      target: "Portfolio",
      evidenceHint: "Create a blocker, next action, pause decision or evidence request.",
      count: sanityChecks.length,
    },
  ];
}

export const ledgerEvents = stateLedger.events.map((event) => {
  const actor = actorById.get(event.actorId);
  return {
    id: event.id,
    actor: actor?.displayName ?? event.actorId,
    action: event.action.replaceAll("_", " "),
    entity: event.entityId,
    proof: event.evidenceIds.length > 0 ? event.evidenceIds.join(", ") : event.source,
  };
});

export const projects = stateLedger.projects.map((project) => ({
  name: project.name,
  purpose: project.purpose,
  stage: project.stage,
  state: project.state,
  priority: project.priorityLane === "infrastructure" ? "infra" : project.priorityLane,
  priorityLabel:
    project.priorityLane === "core"
      ? "Core product"
      : project.priorityLane === "revenue"
        ? "Revenue"
        : project.priorityLane === "infrastructure"
          ? "Infrastructure"
          : "Laboratory",
  nextAction: project.nextAction,
  lastVerifiedChange:
    projectEvidence(project.id).find((evidence) => evidence.verificationStatus === "verified")
      ?.urlOrPath ?? "No fresh proof attached",
  evidenceState: projectFreshnessLabel(project.id),
}));

export const workItems = stateLedger.workItems.map((item) => {
  const project = projectById.get(item.projectId);
  return {
    project: project?.name ?? item.projectId,
    title: item.title,
    status: item.status === "blocked" ? "queued" : item.status,
    statusLabel: item.status,
    done: item.definitionOfDone,
    verify: item.verificationMethod,
  };
});

export const blockerQueue = stateLedger.blockers
  .filter((blocker) => blocker.state === "open")
  .map((blocker) => {
    const project = projectById.get(blocker.projectId);
    return {
      project: project?.name ?? blocker.projectId,
      question: blocker.question,
      impact: blocker.impact,
    };
  });

export const evidenceQueue = stateLedger.claims.map((claim) => {
  const project = projectById.get(claim.projectId);
  const evidence = claim.linkedEvidenceIds
    .map((id) => evidenceById.get(id))
    .find(Boolean);
  const status =
    claim.status === "verified"
      ? "verified"
      : evidence?.verificationStatus === "pending"
        ? "pending"
        : "missing";

  return {
    project: project?.name ?? claim.projectId,
    claim: claim.claim,
    evidence: evidence?.knownGaps.join("; ") || evidence?.urlOrPath || "Evidence needed",
    status,
    statusLabel: status,
  };
});

export const agentRuns = stateLedger.agentRuns.map((run) => {
  const actor = actorById.get(run.agentId);
  const linkedEvidence = run.linkedEvidenceIds
    .map((id) => evidenceById.get(id))
    .filter(Boolean)
    .map((evidence) => evidence?.id)
    .join(", ");

  return {
    id: run.id,
    agent: actor?.displayName ?? run.agentId,
    status: run.humanDecision === "pending_review" ? "awaiting human review" : run.humanDecision,
    objective: run.objective,
    scope: run.permissionScope,
    claim: run.resultClaim,
    proof: linkedEvidence || "No linked evidence",
  };
});
