import { resolveLocalEventsPath } from "../../../local-events-path";
import { runCaptureReviewMarkedCommand } from "../../../local-command";

type CaptureReviewPayload = {
  captureId?: unknown;
  candidateType?: unknown;
  idempotencyKey?: unknown;
  reviewedAt?: unknown;
};

function normalizeIdempotencyPart(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  let payload: CaptureReviewPayload;

  try {
    payload = (await request.json()) as CaptureReviewPayload;
  } catch {
    return Response.json({ ok: false, errors: ["invalid JSON payload"] }, { status: 400 });
  }

  const captureId = typeof payload.captureId === "string" ? payload.captureId : "";
  const candidateType = typeof payload.candidateType === "string" ? payload.candidateType : "";
  const reviewedAt =
    typeof payload.reviewedAt === "string" && payload.reviewedAt.trim()
      ? payload.reviewedAt
      : new Date().toISOString();
  const idempotencyKey =
    typeof payload.idempotencyKey === "string" && payload.idempotencyKey.trim()
      ? payload.idempotencyKey
      : `ui-capture-review:${normalizeIdempotencyPart(captureId)}:${normalizeIdempotencyPart(
          candidateType,
        )}:${normalizeIdempotencyPart(reviewedAt)}`;

  const result = await runCaptureReviewMarkedCommand({
    eventsPath: resolveLocalEventsPath(),
    actorId: "person-serj",
    captureId,
    candidateType,
    idempotencyKey,
    reviewedAt,
  });

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
