import {
  integrations,
  todaySignals,
} from "./seed";
import { NextActionForm } from "./NextActionForm";
import {
  agentRuns,
  blockerQueue,
  evidenceQueue,
  projects,
  workItems,
  getPhoneReviewQueue,
  getRecommendedSteps,
  getSanityChecks,
  ledgerEvents,
} from "./ledger";

const staleEvidence = projects.filter((project) => project.evidenceState !== "fresh");
const blockedProjects = projects.filter((project) => project.state === "blocked");
const activeProjects = projects.filter((project) => project.state === "active");
const verificationLoad = evidenceQueue.filter(
  (item) => item.status !== "verified",
).length;
const sanityChecks = getSanityChecks();
const recommendedSteps = getRecommendedSteps();
const phoneReviewQueue = getPhoneReviewQueue();
const primaryProject = projects.find(
  (project) => project.priority === "core" && project.state === "active",
) ?? projects[0];

export default function Home() {
  return (
    <main className="dashboard-shell">
      <aside className="sidebar" aria-label="Agency OS navigation">
        <div className="brand-lockup">
          <span className="brand-mark">AO</span>
          <div>
            <p className="eyebrow">Agency OS</p>
            <h1>Local Solo Builder Kit</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main sections">
          <a href="#command">Command</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#verification">Evidence</a>
          <a href="#agents">Agent runs</a>
        </nav>

        <section className="mobile-brief" aria-labelledby="mobile-brief-title">
          <p className="eyebrow">7 minute phone mode</p>
          <h2 id="mobile-brief-title">Approve, verify, unblock.</h2>
          <div className="phone-action-list">
            {phoneReviewQueue.map((item) => (
              <article className={`phone-action ${item.type}`} key={item.id}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.count ?? 0}</strong>
                </div>
                <p>{item.target}</p>
                <small>{item.evidenceHint}</small>
              </article>
            ))}
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local truth ledger staging for ChatGPT, Codex, Claude, OpenClaw and GitHub</p>
            <h2>One screen that refuses false progress.</h2>
          </div>
          <div className="session-chip">
            <span className="pulse" />
            Short evening build
          </div>
        </header>

        <section className="hero-grid" id="command" aria-label="Command center">
          <article className="command-panel primary-panel">
            <div className="panel-heading">
              <p className="eyebrow">Tonight focus</p>
              <span className={`status-pill ${primaryProject.priority}`}>
                {primaryProject.priorityLabel}
              </span>
            </div>
            <h3>{primaryProject.name}</h3>
            <p className="mission-copy">{primaryProject.purpose}</p>
            <div className="next-action">
              <span>Next physical action</span>
              <strong>{primaryProject.nextAction}</strong>
            </div>
            <p className="planned-control">Evidence attachment is planned for the next command block.</p>
            <NextActionForm projects={projects.map((project) => ({
              id: project.id,
              name: project.name,
              nextAction: project.nextAction,
            }))} />
          </article>

          <article className="command-panel metric-panel">
            <p className="eyebrow">Portfolio health</p>
            <div className="metric-stack">
              <div>
                <strong>{activeProjects.length}</strong>
                <span>active</span>
              </div>
              <div>
                <strong>{blockedProjects.length}</strong>
                <span>blocked</span>
              </div>
              <div>
                <strong>{staleEvidence.length}</strong>
                <span>stale evidence</span>
              </div>
              <div>
                <strong>{verificationLoad}</strong>
                <span>to verify</span>
              </div>
            </div>
          </article>

          <article className="command-panel signal-panel">
            <p className="eyebrow">Signals captured today</p>
            <ul className="signal-list">
              {todaySignals.map((signal) => (
                <li key={signal.source}>
                  <span>{signal.source}</span>
                  <strong>{signal.summary}</strong>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="ledger-grid" aria-label="State Ledger">
          <article className="section-band ledger-panel" aria-labelledby="ledger-title">
            <div className="section-heading tight">
              <div>
                <p className="eyebrow">State Ledger</p>
                <h2 id="ledger-title">Sanity checks before another beautiful detour.</h2>
              </div>
              <span className="status-pill infra">{sanityChecks.length} checks</span>
            </div>
            <div className="sanity-list">
              {sanityChecks.slice(0, 5).map((check) => (
                <article className={`sanity-item ${check.severity}`} key={check.id}>
                  <span>{check.project ?? "Global"}</span>
                  <h3>{check.title}</h3>
                  <p>{check.detail}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="section-band ledger-panel" aria-labelledby="recommended-title">
            <div className="section-heading tight">
              <div>
                <p className="eyebrow">Recommended next steps</p>
                <h2 id="recommended-title">Small moves that increase truth.</h2>
              </div>
            </div>
            <div className="recommendation-list">
              {recommendedSteps.map((step) => (
                <article className="recommendation-item" key={step.id}>
                  <span>{step.project}</span>
                  <h3>{step.action}</h3>
                  <p>{step.reason}</p>
                  <small>{step.evidenceTarget}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="section-band ledger-panel" aria-labelledby="events-title">
            <div className="section-heading tight">
              <div>
                <p className="eyebrow">Recent ledger events</p>
                <h2 id="events-title">Artifacts that make memory durable.</h2>
              </div>
            </div>
            <div className="event-list">
              {ledgerEvents.map((event) => (
                <article className="event-item" key={event.id}>
                  <span>{event.actor}</span>
                  <strong>{event.action}</strong>
                  <p>{event.entity}</p>
                  <small>{event.proof}</small>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="section-band" id="portfolio" aria-labelledby="portfolio-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Portfolio</p>
              <h2 id="portfolio-title">Four active lanes, no infinite prelude.</h2>
            </div>
            <div className="segmented-status" aria-label="Project state overview">
              <span className="active">Active</span>
              <span>Paused</span>
              <span>Archived</span>
            </div>
          </div>

          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.name}>
                <div className="project-card-header">
                  <span className={`status-pill ${project.priority}`}>{project.priorityLabel}</span>
                  <span className={`state-dot ${project.state}`} aria-label={project.state} />
                </div>
                <h3>{project.name}</h3>
                <p>{project.purpose}</p>
                <dl className="project-facts">
                  <div>
                    <dt>Stage</dt>
                    <dd>{project.stage}</dd>
                  </div>
                  <div>
                    <dt>Next</dt>
                    <dd>{project.nextAction}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{project.lastVerifiedChange}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="two-column">
          <div className="section-band compact" aria-labelledby="work-title">
            <div className="section-heading tight">
              <div>
                <p className="eyebrow">Work queue</p>
                <h2 id="work-title">Only tasks with a verification method.</h2>
              </div>
            </div>
            <div className="work-list">
              {workItems.map((item) => (
                <article className="work-item" key={item.title}>
                  <div>
                    <span className="mini-label">{item.project}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <span className={`work-status ${item.status}`}>{item.statusLabel}</span>
                  <p>{item.done}</p>
                  <small>{item.verify}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="section-band compact" aria-labelledby="blocker-title">
            <div className="section-heading tight">
              <div>
                <p className="eyebrow">Blockers</p>
                <h2 id="blocker-title">Decisions before more code.</h2>
              </div>
            </div>
            <div className="blocker-list">
              {blockerQueue.map((blocker) => (
                <article className="blocker-item" key={blocker.question}>
                  <span>{blocker.project}</span>
                  <h3>{blocker.question}</h3>
                  <p>{blocker.impact}</p>
                  <small className="planned-control">Resolution command is planned.</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band" id="verification" aria-labelledby="evidence-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Evidence queue</p>
              <h2 id="evidence-title">Claims are not green until proof is fresh.</h2>
            </div>
            <span className="planned-control">Verifier command is planned.</span>
          </div>
          <div className="evidence-table" role="table" aria-label="Evidence queue">
            <div className="table-row table-head" role="row">
              <span role="columnheader">Project</span>
              <span role="columnheader">Claim</span>
              <span role="columnheader">Evidence</span>
              <span role="columnheader">Status</span>
            </div>
            {evidenceQueue.map((item) => (
              <div className="table-row" role="row" key={`${item.project}-${item.claim}`}>
                <span role="cell">{item.project}</span>
                <span role="cell">{item.claim}</span>
                <span role="cell">{item.evidence}</span>
                <span role="cell" className={`verification-status ${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="section-band" id="agents" aria-labelledby="agents-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Agent run ledger</p>
              <h2 id="agents-title">Every agent gets a claim, scope and proof trail.</h2>
            </div>
          </div>
          <div className="agent-grid">
            {agentRuns.map((run) => (
              <article className="agent-run" key={run.id}>
                <div className="agent-run-header">
                  <span>{run.agent}</span>
                  <strong>{run.status}</strong>
                </div>
                <h3>{run.objective}</h3>
                <p>{run.scope}</p>
                <dl>
                  <div>
                    <dt>Claim</dt>
                    <dd>{run.claim}</dd>
                  </div>
                  <div>
                    <dt>Proof</dt>
                    <dd>{run.proof}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="section-band integrations-band" aria-labelledby="integration-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Integration staging</p>
              <h2 id="integration-title">First inputs, in the order that matters.</h2>
            </div>
          </div>
          <div className="integration-strip">
            {integrations.map((integration) => (
              <article key={integration.name}>
                <span>{integration.name}</span>
                <strong>{integration.role}</strong>
                <p>{integration.firstSignal}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
