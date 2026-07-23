import actorsData from "../data/actors.json";
import agentRunsData from "../data/agent-runs.json";
import approvalsData from "../data/approvals.json";
import blockersData from "../data/blockers.json";
import claimsData from "../data/claims.json";
import decisionsData from "../data/decisions.json";
import evidenceData from "../data/evidence.json";
import eventsJsonl from "../data/events.jsonl?raw";
import projectsData from "../data/projects.json";
import tracesData from "../data/traces.json";
import workItemsData from "../data/work-items.json";

type Severity = "critical" | "warning" | "info";
type ActionType = "approve" | "verify" | "unblock" | "capture";
type VerificationStatus = "missing" | "pending" | "verified" | "rejected" | "stale";
type ApprovalState = "requested" | "approved" | "rejected" | "expired" | "used";
type RedactionStatus =
  | "not_required"
  | "pending_scan"
  | "redacted"
  | "no_secrets_detected"
  | "blocked_sensitive";
type RetentionClass = "audit" | "operational" | "temporary";

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
  singleUse: boolean;
  usedAt: string | null;
  usedByEventId: string | null;
  humanRequired: boolean;
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
  schemaVersion: 1;
  sequence: number;
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: Record<string, unknown> | null;
  evidenceIds: string[];
  approvalIds: string[];
  traceId: string | null;
  source: string;
  idempotencyKey: string;
  redactionStatus: RedactionStatus;
  retentionClass: RetentionClass;
  previousEventHash: string | null;
  eventHash: string;
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

const allowedRedactionStatuses = new Set<RedactionStatus>([
  "not_required",
  "pending_scan",
  "redacted",
  "no_secrets_detected",
  "blocked_sensitive",
]);
const allowedRetentionClasses = new Set<RetentionClass>([
  "audit",
  "operational",
  "temporary",
]);

export function parseLedgerEvents(source: string): LedgerEvent[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LedgerEvent);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function calculateEventHash(event: LedgerEvent) {
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

export function validateEventLog(
  events: LedgerEvent[],
  references: {
    evidenceIds?: Set<string>;
    approvalIds?: Set<string>;
    traceIds?: Set<string>;
  } = {},
) {
  const errors: string[] = [];
  const sequences = new Set<number>();
  const eventIds = new Set<string>();
  const idempotencyKeys = new Map<string, string>();
  let previousHash: string | null = null;

  events.forEach((event, index) => {
    if (event.schemaVersion !== 1) {
      errors.push(`event ${event.id ?? index} has unsupported schema version`);
    }
    if (typeof event.sequence !== "number" || event.sequence < 1) {
      errors.push(`event ${event.id ?? index} has invalid sequence`);
    }
    if (sequences.has(event.sequence)) {
      errors.push(`duplicate event sequence ${event.sequence}`);
    }
    sequences.add(event.sequence);
    if (event.sequence !== index + 1) {
      errors.push(`event ${event.id} sequence must be ${index + 1}`);
    }
    if (eventIds.has(event.id)) {
      errors.push(`duplicate event id ${event.id}`);
    }
    eventIds.add(event.id);

    if (!Array.isArray(event.evidenceIds)) {
      errors.push(`event ${event.id} evidenceIds must be an array`);
    }
    if (!Array.isArray(event.approvalIds)) {
      errors.push(`event ${event.id} approvalIds must be an array`);
    }
    if (!event.redactionStatus) {
      errors.push(`event ${event.id} is missing redaction status`);
    } else if (!allowedRedactionStatuses.has(event.redactionStatus)) {
      errors.push(`event ${event.id} has invalid redaction status`);
    }
    if (!event.retentionClass) {
      errors.push(`event ${event.id} is missing retention class`);
    } else if (!allowedRetentionClasses.has(event.retentionClass)) {
      errors.push(`event ${event.id} has invalid retention class`);
    }
    if (event.previousEventHash !== previousHash) {
      errors.push(`event ${event.id} has broken previous hash`);
    }

    const expectedHash = calculateEventHash(event);
    if (event.eventHash !== expectedHash) {
      errors.push(`event ${event.id} has invalid event hash`);
    }

    const priorIdempotencyHash = idempotencyKeys.get(event.idempotencyKey);
    if (priorIdempotencyHash && priorIdempotencyHash !== expectedHash) {
      errors.push(`duplicate idempotency key ${event.idempotencyKey} has different payload`);
    } else if (priorIdempotencyHash) {
      errors.push(`duplicate idempotency key ${event.idempotencyKey}`);
    }
    idempotencyKeys.set(event.idempotencyKey, expectedHash);

    for (const id of event.evidenceIds ?? []) {
      if (references.evidenceIds && !references.evidenceIds.has(id)) {
        errors.push(`event ${event.id} references unknown evidence ${id}`);
      }
    }
    for (const id of event.approvalIds ?? []) {
      if (references.approvalIds && !references.approvalIds.has(id)) {
        errors.push(`event ${event.id} references unknown approval ${id}`);
      }
    }
    if (event.traceId && references.traceIds && !references.traceIds.has(event.traceId)) {
      errors.push(`event ${event.id} references unknown trace ${event.traceId}`);
    }

    previousHash = event.eventHash;
  });

  return errors;
}

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
  events: parseLedgerEvents(eventsJsonl),
};

function createIndexes(ledger: StateLedger) {
  return {
    actorById: new Map(ledger.actors.map((actor) => [actor.id, actor])),
    evidenceById: new Map(ledger.evidence.map((evidence) => [evidence.id, evidence])),
    projectById: new Map(ledger.projects.map((project) => [project.id, project])),
  };
}

function hasText(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function projectEvidence(projectId: string, ledger: StateLedger = stateLedger) {
  return ledger.evidence.filter((evidence) => evidence.projectId === projectId);
}

function projectHasFreshEvidence(projectId: string, ledger: StateLedger = stateLedger) {
  return projectEvidence(projectId, ledger).some(
    (evidence) => evidence.verificationStatus === "verified",
  );
}

function projectFreshnessLabel(projectId: string, ledger: StateLedger = stateLedger) {
  const records = projectEvidence(projectId, ledger);
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
  const { actorById, evidenceById } = createIndexes(ledger);
  const projectIds = new Set(ledger.projects.map((project) => project.id));
  const actorIds = new Set(ledger.actors.map((actor) => actor.id));
  const evidenceIds = new Set(ledger.evidence.map((evidence) => evidence.id));
  const decisionIds = new Set(ledger.decisions.map((decision) => decision.id));
  const approvalIds = new Set(ledger.approvals.map((approval) => approval.id));
  const traceIds = new Set(ledger.traces.map((trace) => trace.id));
  const idempotencyKeys = new Set<string>();

  errors.push(
    ...validateEventLog(ledger.events, {
      evidenceIds,
      approvalIds,
      traceIds,
    }),
  );

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
    if (claim.status === "verified") {
      const linkedVerifiedTypes = new Set(
        claim.linkedEvidenceIds
          .map((id) => evidenceById.get(id))
          .filter((evidence) => evidence?.verificationStatus === "verified")
          .map((evidence) => evidence?.type),
      );

      for (const requiredType of claim.requiredEvidenceTypes) {
        if (!linkedVerifiedTypes.has(requiredType)) {
          errors.push(`claim ${claim.id} missing verified evidence type ${requiredType}`);
        }
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
  if (approval.singleUse && approval.usedAt) {
    return false;
  }
  if (approval.expiresAt && new Date(approval.expiresAt).getTime() < now.getTime()) {
    return false;
  }
  return true;
}

export type ApprovalUseRequest = {
  approvalId: string | null;
  actionType: string;
  scope: string;
  riskLevel: ApprovalRecord["riskLevel"];
  requestedBy?: string;
  entityId?: string;
  approvals?: ApprovalRecord[];
  actors?: ActorRecord[];
  now?: Date;
};

export function canUseApproval({
  approvalId,
  actionType,
  scope,
  riskLevel,
  requestedBy,
  entityId,
  approvals = stateLedger.approvals,
  actors = stateLedger.actors,
  now = new Date(),
}: ApprovalUseRequest) {
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
  if (approval.singleUse && approval.usedAt) {
    return false;
  }
  if (approval.actionType !== actionType) {
    return false;
  }
  if (approval.scope !== scope) {
    return false;
  }
  if (approval.riskLevel !== riskLevel) {
    return false;
  }
  if (requestedBy && approval.requestedBy !== requestedBy) {
    return false;
  }
  if (entityId && approval.entityId !== entityId) {
    return false;
  }
  if (approval.humanRequired) {
    const approver = actors.find((actor) => actor.id === approval.approverId);
    if (approver?.actorType !== "person") {
      return false;
    }
  }
  return true;
}

export type ReplayResult = {
  ledger: StateLedger;
  appliedEventIds: string[];
  ignoredEventIds: string[];
  errors: string[];
};

export type DerivedLedgerResult = {
  ledger: StateLedger;
  errors: string[];
};

function cloneLedger(ledger: StateLedger): StateLedger {
  return JSON.parse(JSON.stringify(ledger)) as StateLedger;
}

function idempotencyPayloadHash(event: LedgerEvent) {
  const payload = Object.fromEntries(
    Object.entries(event).filter(
      ([key]) => key !== "eventHash" && key !== "previousEventHash" && key !== "sequence",
    ),
  );
  return stableStringify(payload);
}

export function replayLedgerEvents(
  initialLedger: StateLedger,
  events: LedgerEvent[],
  now = new Date(),
): ReplayResult {
  const ledger = cloneLedger(initialLedger);
  const projectById = new Map(ledger.projects.map((project) => [project.id, project]));
  const actorById = new Map(ledger.actors.map((actor) => [actor.id, actor]));
  const seenIdempotency = new Map<string, string>();
  const appliedEventIds: string[] = [];
  const ignoredEventIds: string[] = [];
  const errors: string[] = [];
  const eventsToApply: LedgerEvent[] = [];

  for (const event of ledger.events) {
    seenIdempotency.set(event.idempotencyKey, idempotencyPayloadHash(event));
  }

  for (const event of events) {
    const payloadHash = idempotencyPayloadHash(event);
    const previousPayloadHash = seenIdempotency.get(event.idempotencyKey);

    if (previousPayloadHash) {
      if (previousPayloadHash === payloadHash) {
        ignoredEventIds.push(event.id);
      } else {
        errors.push(`duplicate idempotency key ${event.idempotencyKey} has different payload`);
      }
      continue;
    }
    seenIdempotency.set(event.idempotencyKey, payloadHash);
    eventsToApply.push(event);
  }

  if (errors.length > 0) {
    return {
      ledger,
      appliedEventIds,
      ignoredEventIds,
      errors,
    };
  }

  const eventLogErrors = validateEventLog([...ledger.events, ...eventsToApply], {
    evidenceIds: new Set(ledger.evidence.map((evidence) => evidence.id)),
    approvalIds: new Set(ledger.approvals.map((approval) => approval.id)),
    traceIds: new Set(ledger.traces.map((trace) => trace.id)),
  });

  if (eventLogErrors.length > 0) {
    return {
      ledger,
      appliedEventIds,
      ignoredEventIds,
      errors: eventLogErrors,
    };
  }

  for (const event of eventsToApply) {
    if (event.redactionStatus === "pending_scan" || event.redactionStatus === "blocked_sensitive") {
      errors.push(`event ${event.id} cannot be applied with redaction status ${event.redactionStatus}`);
      continue;
    }

    if (event.action !== "project.next_action_updated") {
      if (event.action === "approval.approved") {
        const approval = ledger.approvals.find((item) => item.id === event.entityId);
        const actor = actorById.get(event.actorId);
        const approverId = event.after?.approverId;
        const decidedAt = event.after?.decidedAt;
        const requestedBy = event.after?.requestedBy;
        const actionType = event.after?.actionType;
        const scope = event.after?.scope;
        const riskLevel = event.after?.riskLevel;
        const approvedEntityId = event.after?.entityId;

        if (event.entityType !== "approval" || !approval) {
          errors.push(`event ${event.id} references unknown approval ${event.entityId}`);
          continue;
        }
        if (!actor || actor.actorType !== "person") {
          errors.push(`event ${event.id} requires person approver actor`);
          continue;
        }
        if (event.actorId !== approverId) {
          errors.push(`event ${event.id} approver must match actor`);
          continue;
        }
        if (
          typeof approverId !== "string" ||
          typeof decidedAt !== "string" ||
          typeof requestedBy !== "string" ||
          typeof actionType !== "string" ||
          typeof scope !== "string" ||
          typeof riskLevel !== "string" ||
          typeof approvedEntityId !== "string"
        ) {
          errors.push(`event ${event.id} missing approval decision details`);
          continue;
        }
        if (
          approval.requestedBy !== requestedBy ||
          approval.actionType !== actionType ||
          approval.scope !== scope ||
          approval.riskLevel !== riskLevel ||
          approval.entityId !== approvedEntityId
        ) {
          errors.push(`event ${event.id} approval details do not match request`);
          continue;
        }

        approval.state = "approved";
        approval.approverId = approverId;
        approval.decidedAt = decidedAt;
        appliedEventIds.push(event.id);
        continue;
      }

      if (event.action === "approval.used") {
        const approval = ledger.approvals.find((item) => item.id === event.entityId);
        const usedAt = event.after?.usedAt;
        const usedByEventId = event.after?.usedByEventId;

        if (event.entityType !== "approval" || !approval) {
          errors.push(`event ${event.id} references unknown approval ${event.entityId}`);
          continue;
        }
        if (typeof usedAt !== "string" || typeof usedByEventId !== "string") {
          errors.push(`event ${event.id} missing approval use details`);
          continue;
        }

        approval.state = "used";
        approval.usedAt = usedAt;
        approval.usedByEventId = usedByEventId;
        appliedEventIds.push(event.id);
        continue;
      }

      ignoredEventIds.push(event.id);
      continue;
    }

    const actor = actorById.get(event.actorId);
    const project = projectById.get(event.entityId);
    const nextAction = event.after?.nextAction;

    if (!actor) {
      errors.push(`event ${event.id} references unknown actor ${event.actorId}`);
      continue;
    }
    if (event.entityType !== "project" || !project) {
      errors.push(`event ${event.id} references unknown project ${event.entityId}`);
      continue;
    }
    if (typeof nextAction !== "string" || !nextAction.trim()) {
      errors.push(`event ${event.id} missing nextAction`);
      continue;
    }
    if (actor.actorType === "agent") {
      const validApproval = event.approvalIds
        .map((approvalId) => ledger.approvals.find((approval) => approval.id === approvalId))
        .find((approval) =>
          canUseApproval({
            approvalId: approval?.id ?? null,
            actionType: "scoped_write",
            scope: `${project.id}:project.next_action_updated`,
            riskLevel: "medium",
            requestedBy: actor.id,
            entityId: actor.id,
            approvals: ledger.approvals,
            actors: ledger.actors,
            now,
          }),
        );

      if (!validApproval) {
        errors.push(`event ${event.id} requires scoped approval`);
        continue;
      }

      if (validApproval.singleUse) {
        validApproval.state = "used";
        validApproval.usedAt = event.timestamp;
        validApproval.usedByEventId = event.id;
      }
    }

    project.nextAction = nextAction;
    project.lastUpdated = event.timestamp;
    appliedEventIds.push(event.id);
  }

  return {
    ledger,
    appliedEventIds,
    ignoredEventIds,
    errors,
  };
}

export function getReplayDerivedLedger(ledger: StateLedger = stateLedger): DerivedLedgerResult {
  const replayResult = replayLedgerEvents(
    {
      ...ledger,
      events: [],
    },
    ledger.events,
  );

  return {
    ledger: {
      ...replayResult.ledger,
      events: ledger.events,
    },
    errors: replayResult.errors,
  };
}

export const replayDerivedLedger = getReplayDerivedLedger(stateLedger);
export const derivedStateLedger = replayDerivedLedger.ledger;
const derivedIndexes = createIndexes(derivedStateLedger);

export function getSanityChecks(ledger: StateLedger = derivedStateLedger): SanityCheck[] {
  const checks: SanityCheck[] = [];
  const activeProjects = ledger.projects.filter((project) => project.state === "active");

  for (const project of ledger.projects) {
    if (!projectHasFreshEvidence(project.id, ledger)) {
      checks.push({
        id: `stale-evidence-${project.id}`,
        severity: projectFreshnessLabel(project.id, ledger) === "missing" ? "critical" : "warning",
        title: "Evidence is not fresh",
        detail: `Freshness is ${projectFreshnessLabel(project.id, ledger)} from linked evidence records.`,
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

  if (ledger === derivedStateLedger) {
    for (const error of replayDerivedLedger.errors) {
      checks.push({
        id: `ledger-replay-${checks.length}`,
        severity: "critical",
        title: "Ledger replay failed",
        detail: error,
      });
    }
  }

  return checks;
}

export function getRecommendedSteps(ledger: StateLedger = derivedStateLedger): RecommendedStep[] {
  const { projectById } = createIndexes(ledger);
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

export function getPhoneReviewQueue(ledger: StateLedger = derivedStateLedger): PhoneReviewAction[] {
  const { actorById, projectById } = createIndexes(ledger);
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

export const ledgerEvents = derivedStateLedger.events.map((event) => {
  const actor = derivedIndexes.actorById.get(event.actorId);
  return {
    id: event.id,
    actor: actor?.displayName ?? event.actorId,
    action: event.action.replaceAll("_", " "),
    entity: event.entityId,
    proof: event.evidenceIds.length > 0 ? event.evidenceIds.join(", ") : event.source,
  };
});

export const projects = derivedStateLedger.projects.map((project) => ({
  id: project.id,
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
    projectEvidence(project.id, derivedStateLedger).find((evidence) => evidence.verificationStatus === "verified")
      ?.urlOrPath ?? "No fresh proof attached",
  evidenceState: projectFreshnessLabel(project.id, derivedStateLedger),
}));

export const workItems = derivedStateLedger.workItems.map((item) => {
  const project = derivedIndexes.projectById.get(item.projectId);
  return {
    project: project?.name ?? item.projectId,
    title: item.title,
    status: item.status === "blocked" ? "queued" : item.status,
    statusLabel: item.status,
    done: item.definitionOfDone,
    verify: item.verificationMethod,
  };
});

export const blockerQueue = derivedStateLedger.blockers
  .filter((blocker) => blocker.state === "open")
  .map((blocker) => {
    const project = derivedIndexes.projectById.get(blocker.projectId);
    return {
      project: project?.name ?? blocker.projectId,
      question: blocker.question,
      impact: blocker.impact,
    };
  });

export const evidenceQueue = derivedStateLedger.claims.map((claim) => {
  const project = derivedIndexes.projectById.get(claim.projectId);
  const evidence = claim.linkedEvidenceIds
    .map((id) => derivedIndexes.evidenceById.get(id))
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

export const agentRuns = derivedStateLedger.agentRuns.map((run) => {
  const actor = derivedIndexes.actorById.get(run.agentId);
  const linkedEvidence = run.linkedEvidenceIds
    .map((id) => derivedIndexes.evidenceById.get(id))
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
