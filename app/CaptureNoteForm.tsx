"use client";

import { useState, type FormEvent } from "react";

type ProjectOption = {
  id: string;
  name: string;
};

type CaptureSummary = {
  id: string;
  project: string;
  source: string;
  receivedAt: string;
  summary: string;
};

type CaptureNoteFormProps = {
  projects: ProjectOption[];
  recentCaptures: CaptureSummary[];
};

type CaptureResult = {
  ok: boolean;
  errors: string[];
  appended: boolean;
  captureId: string | null;
  reviewStatus: string | null;
};

const sourceOptions = [
  { id: "phone", label: "Phone" },
  { id: "laptop", label: "Laptop" },
  { id: "manual", label: "Manual" },
];

export function CaptureNoteForm({ projects, recentCaptures }: CaptureNoteFormProps) {
  const [projectId, setProjectId] = useState("inbox");
  const [source, setSource] = useState("phone");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/local/capture-note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          source,
          body,
          createdAt: new Date().toISOString(),
        }),
      });
      const result = (await response.json()) as CaptureResult;

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.errors.join("; ") || "Unable to capture note.");
        return;
      }

      setStatus("saved");
      setMessage(result.appended ? "Captured for review." : "Already captured.");
      setBody("");
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      setStatus("error");
      setMessage("Unable to capture note.");
    }
  }

  return (
    <section className="capture-note-panel" aria-labelledby="capture-note-title">
      <div>
        <p className="eyebrow">Quick capture</p>
        <h3 id="capture-note-title">One note or fact</h3>
      </div>

      <form className="capture-note-form" onSubmit={submit}>
        <div className="capture-note-fields">
          <label>
            <span>Project</span>
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="inbox">Inbox</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Source</span>
            <select value={source} onChange={(event) => setSource(event.target.value)}>
              {sourceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="capture-note-body">
          <span>Note or fact</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write what changed"
            rows={3}
          />
        </label>

        <button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving" : "Capture"}
        </button>
        <p className={`command-status ${status}`} aria-live="polite">
          {message || "Local-only capture through the event ledger."}
        </p>
      </form>

      <div className="capture-review-list" aria-label="Last uncategorized captures">
        <span>Last uncategorized</span>
        {recentCaptures.length > 0 ? (
          recentCaptures.map((capture) => (
            <article key={capture.id}>
              <strong>{capture.project}</strong>
              <p>{capture.summary}</p>
              <small>
                {capture.source} / {capture.receivedAt}
              </small>
            </article>
          ))
        ) : (
          <p>No uncategorized captures yet.</p>
        )}
      </div>
    </section>
  );
}
