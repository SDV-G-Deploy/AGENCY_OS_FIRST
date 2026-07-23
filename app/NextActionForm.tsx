"use client";

import { useState, type FormEvent } from "react";

type ProjectOption = {
  id: string;
  name: string;
  nextAction: string;
};

type NextActionFormProps = {
  projects: ProjectOption[];
};

type CommandResult = {
  ok: boolean;
  errors: string[];
  appended: boolean;
  projectNextAction: string | null;
};

export function NextActionForm({ projects }: NextActionFormProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [nextAction, setNextAction] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/local/next-action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, nextAction }),
    });
    const result = (await response.json()) as CommandResult;

    if (!response.ok || !result.ok) {
      setStatus("error");
      setMessage(result.errors.join("; ") || "Unable to update next action.");
      return;
    }

    setStatus("saved");
    setMessage(result.appended ? "Saved to the event ledger." : "Already recorded.");
    setNextAction("");
    window.setTimeout(() => window.location.reload(), 500);
  }

  return (
    <form className="next-action-form" onSubmit={submit}>
      <label>
        <span>Project</span>
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>New next action</span>
        <input
          value={nextAction}
          onChange={(event) => setNextAction(event.target.value)}
          placeholder="Write the next physical action"
        />
      </label>

      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving" : "Update"}
      </button>
      <p className={`command-status ${status}`} aria-live="polite">
        {message || "Local-only write through the event ledger."}
      </p>
    </form>
  );
}
