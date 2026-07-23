import { resolve } from "node:path";

import { runCaptureNoteCommand } from "../../../local-command";

type CaptureNotePayload = {
  projectId?: unknown;
  body?: unknown;
  source?: unknown;
  idempotencyKey?: unknown;
  createdAt?: unknown;
};

function normalizeIdempotencyPart(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  let payload: CaptureNotePayload;

  try {
    payload = (await request.json()) as CaptureNotePayload;
  } catch {
    return Response.json({ ok: false, errors: ["invalid JSON payload"] }, { status: 400 });
  }

  const projectId = typeof payload.projectId === "string" ? payload.projectId : "";
  const body = typeof payload.body === "string" ? payload.body : "";
  const source = typeof payload.source === "string" ? payload.source : "";
  const receivedAt = new Date().toISOString();
  const createdAt =
    typeof payload.createdAt === "string" && payload.createdAt.trim()
      ? payload.createdAt
      : receivedAt;
  const idempotencyKey =
    typeof payload.idempotencyKey === "string" && payload.idempotencyKey.trim()
      ? payload.idempotencyKey
      : `ui-capture-note:${normalizeIdempotencyPart(projectId)}:${normalizeIdempotencyPart(
          source,
        )}:${normalizeIdempotencyPart(createdAt)}:${normalizeIdempotencyPart(body)}`;

  const result = await runCaptureNoteCommand({
    eventsPath: resolve(process.cwd(), "data/events.jsonl"),
    actorId: "person-serj",
    projectId,
    body,
    source,
    idempotencyKey,
    createdAt,
    receivedAt,
    redactionStatus: "pending_scan",
  });

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
