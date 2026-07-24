import { isAbsolute, resolve } from "node:path";

const localEventsPathEnvKey = "AGENCY_OS_EVENTS_PATH";

export function resolveLocalEventsPath() {
  const configuredPath = process.env[localEventsPathEnvKey]?.trim();

  if (!configuredPath) {
    return resolve(process.cwd(), "data/events.jsonl");
  }

  return isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath);
}
