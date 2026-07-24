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

type CaptureReviewResult = CaptureResult & {
  candidateType: string | null;
};

const sourceOptions = [
  { id: "phone", label: "Phone" },
  { id: "laptop", label: "Laptop" },
  { id: "manual", label: "Manual" },
];

const candidateOptions = [
  { id: "evidence_candidate", label: "Evidence candidate" },
  { id: "blocker_candidate", label: "Blocker candidate" },
  { id: "decision_candidate", label: "Decision candidate" },
  { id: "next_action_candidate", label: "Next action candidate" },
];

export function CaptureNoteForm({ projects, recentCaptures }: CaptureNoteFormProps) {
  const [projectId, setProjectId] = useState("inbox");
  const [source, setSource] = useState("phone");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reviewCaptureId, setReviewCaptureId] = useState(recentCaptures[0]?.id ?? "");
  const [candidateType, setCandidateType] = useState(candidateOptions[0].id);
  const [reviewStatus, setReviewStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewedCaptureIds, setReviewedCaptureIds] = useState<Set<string>>(() => new Set());
  const visibleCaptures = recentCaptures.filter((capture) => !reviewedCaptureIds.has(capture.id));
  const selectedReviewCaptureId = reviewCaptureId || visibleCaptures[0]?.id || "";

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

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const captureId = selectedReviewCaptureId;

    if (!captureId) {
      setReviewStatus("error");
      setReviewMessage("No uncategorized capture is ready for review.");
      return;
    }

    setReviewStatus("saving");
    setReviewMessage("");

    try {
      const response = await fetch("/api/local/capture-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          captureId,
          candidateType,
          reviewedAt: new Date().toISOString(),
        }),
      });
      const result = (await response.json()) as CaptureReviewResult;

      if (!response.ok || !result.ok) {
        setReviewStatus("error");
        setReviewMessage(result.errors.join("; ") || "Unable to review capture.");
        return;
      }

      const nextCapture = visibleCaptures.find((capture) => capture.id !== captureId);
      setReviewedCaptureIds((current) => new Set(current).add(captureId));
      setReviewCaptureId(nextCapture?.id ?? "");
      setReviewStatus("saved");
      setReviewMessage(
        result.appended ? "Marked for follow-up. Refreshing derived state." : "Already reviewed.",
      );
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      setReviewStatus("error");
      setReviewMessage("Unable to review capture.");
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

      <form className="capture-review-form" onSubmit={submitReview}>
        <div>
          <p className="eyebrow">Review capture</p>
          <h3>Mark one candidate</h3>
        </div>

        <label>
          <span>Capture</span>
          <select
            value={selectedReviewCaptureId}
            onChange={(event) => setReviewCaptureId(event.target.value)}
            disabled={visibleCaptures.length === 0}
          >
            {visibleCaptures.length > 0 ? (
              visibleCaptures.map((capture) => (
                <option key={capture.id} value={capture.id}>
                  {capture.project}: {capture.summary}
                </option>
              ))
            ) : (
              <option value="">No captures</option>
            )}
          </select>
        </label>

        <label>
          <span>Candidate type</span>
          <select
            value={candidateType}
            onChange={(event) => setCandidateType(event.target.value)}
            disabled={visibleCaptures.length === 0}
          >
            {candidateOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={reviewStatus === "saving" || visibleCaptures.length === 0}>
          {reviewStatus === "saving" ? "Saving" : "Mark candidate"}
        </button>
        <p className={`command-status ${reviewStatus}`} aria-live="polite">
          {reviewMessage || "Local-only review through the event ledger."}
        </p>
      </form>

      <div className="capture-review-list" aria-label="Last uncategorized captures">
        <span>Last uncategorized</span>
        {visibleCaptures.length > 0 ? (
          visibleCaptures.map((capture) => (
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
