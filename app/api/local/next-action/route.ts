import { resolve } from "node:path";

import { runProjectNextActionCommand } from "../../../local-command";

type NextActionPayload = {
  projectId?: unknown;
  nextAction?: unknown;
};

export async function POST(request: Request) {
  let payload: NextActionPayload;

  try {
    payload = (await request.json()) as NextActionPayload;
  } catch {
    return Response.json({ ok: false, errors: ["invalid JSON payload"] }, { status: 400 });
  }

  const projectId = typeof payload.projectId === "string" ? payload.projectId : "";
  const nextAction = typeof payload.nextAction === "string" ? payload.nextAction : "";
  const result = await runProjectNextActionCommand({
    eventsPath: resolve(process.cwd(), "data/events.jsonl"),
    actorId: "person-serj",
    projectId,
    nextAction,
    idempotencyKey: `ui-next-action:${projectId}:${nextAction.trim().toLowerCase()}`,
    timestamp: new Date().toISOString(),
  });

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
