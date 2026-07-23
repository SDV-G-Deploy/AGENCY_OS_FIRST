# Research And Comparison Notes

Status: draft v0.2  
Last updated: 2026-07-23

## Sources Checked

Primary/local:
- Trailmark repository: https://github.com/bearded-illirian/trailmark
- Trailmark local research clone: `work/trailmark-research`
- AI Action Ledger repository: https://github.com/Jreamr/ai-action-ledger
- Agent Ledger repository: https://github.com/rune0-dev/agent-ledger
- Awesome Auditable AI repository:
  https://github.com/yzhao062/awesome-auditable-ai

Market/product:
- Buzz official announcement:
  https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together
- Buzz product site: https://buzz.xyz
- Hive Buzz product page: https://hive.com/buzz
- Buzz engineering post:
  https://engineering.block.xyz/blog/buzz

Agent frameworks and current repo direction:
- OpenAI Agents SDK docs:
  https://openai.github.io/openai-agents-python/
- OpenAI Agents SDK tracing:
  https://openai.github.io/openai-agents-python/tracing/
- OpenAI Agents SDK human-in-the-loop:
  https://openai.github.io/openai-agents-python/human_in_the_loop/
- OpenAI Agents SDK JS:
  https://github.com/openai/openai-agents-js
- LangChain:
  https://github.com/langchain-ai/langchain
- LangGraph:
  https://github.com/langchain-ai/langgraph
- CrewAI:
  https://github.com/crewAIInc/crewAI
- AutoGPT:
  https://github.com/significant-gravitas/autogpt

Security/process:
- OWASP Top 10 for Agentic Applications 2026:
  https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- OWASP Agentic Skills Top 10:
  https://owasp.org/www-project-agentic-skills-top-10/
- GitHub Copilot coding agent:
  https://github.blog/news-insights/product-news/github-copilot-meet-the-new-coding-agent/
- GitHub Agentic Workflows:
  https://github.blog/ai-and-ml/automate-repository-tasks-with-github-agentic-workflows/
- Agentic AI best practices:
  https://zenity.io/academy/agentic-ai-best-practices
- Human-in-the-loop identity guidance:
  https://www.strata.io/blog/agentic-identity/practicing-the-human-in-the-loop/

## Key Takeaways

### Trailmark

Trailmark is an artifact-first agent framework. Its strongest lesson is not
its exact UI or bash tooling; it is the rule that every meaningful step writes
a durable artifact and registers it.

What to borrow:
- artifact-first discipline;
- tasks, blocks, reports and artifacts;
- local SQLite/file records;
- read-only browsing over work history;
- regression archaeology through block -> artifact -> commit.

What not to borrow directly:
- Claude-only workflow assumptions;
- Unix-first scripts as the product foundation;
- mandatory heavy skill chain for every small action;
- full hub-and-spoke skill symlink system before Agency OS proves value.

Architecture implication:
- Agency OS should keep tasks, plan-first artifacts, reports and critic reviews
  as first-class records, but should not require a heavyweight ritual for every
  small phone action.

### Buzz

Buzz validates the market direction: humans and agents need a shared place with
context, identity, permissions, history and code/work artifacts.

Block describes Buzz as a shared workspace with channels, threads, direct
messages, voice, media sharing, code repositories and workflows where agents
have identities, permissions and can participate alongside humans. That is a
strong market signal, but it is broader and more chat/workspace-centric than
Agency OS should be in the near term.

What to borrow:
- agents as first-class participants;
- identity and permission as core primitives;
- signed/open event-log direction as a long-term idea;
- bringing conversation, decisions and code together.

What to avoid:
- becoming a chat-first workspace;
- competing with Slack/Buzz directly;
- adding decentralized identity before local value is proven.

Agency OS differentiation:
- command/state/evidence first;
- phone review and personal operating layer;
- integrates across ChatGPT, Codex, Claude, GitHub and OpenClaw instead of
  requiring all work to happen inside one room.
- rejects "workspace sprawl" as the first product bet; the core view is global
  state and verified next action, not another place to talk.

### Action / Agent Ledgers

Recent open-source projects around AI action ledgers validate the same lower
layer:
- tamper-evident audit logs;
- event submission and query APIs;
- chain verification;
- exports;
- at-most-once execution;
- human-in-the-loop approvals;
- queryable audit trails.

What to borrow:
- event integrity checks;
- explicit idempotency;
- verify/export endpoints;
- human approval as a runtime primitive;
- side-effect ledgers for agent actions.

What to avoid:
- reducing Agency OS to an audit-log backend;
- hiding project/product state behind generic events only.

Agency OS role:
- use an action ledger as the spine;
- add portfolio, blocker, evidence and phone-review semantics above it.

### Auditable AI / Reliability Resources

The auditable AI direction reframes reliability as more than a log. It includes
consistent behavior, stress tolerance, fault recovery, observability, durable
decision records and failure attribution.

What to borrow:
- durability for consequential decisions;
- failure attribution;
- operational observability;
- reliability tests and evaluation artifacts.

Agency OS role:
- make every agent run answerable after the fact: what happened, why, under
  whose authority, what proof exists, what failed, and what changed.

### OpenAI Agents SDK

OpenAI's agent docs emphasize small primitives, sessions, handoffs, tracing,
guardrails and human-in-the-loop approval.

What to borrow:
- session memory as a first-class concept;
- tracing as proof of agent actions;
- explicit approval interruptions;
- guardrails around tool calls;
- handoff visibility.

Agency OS role:
- consume traces and approvals as evidence;
- show pending approvals in phone review;
- keep a project-level view above individual agent runs.

### GitHub Agentic Workflows / Copilot Coding Agent

GitHub is moving agent work into issues, background environments, Actions,
security scanning and pull requests.

What to borrow:
- background agent tasks need reviewable outputs;
- GitHub checks/security scans are strong evidence;
- PRs are natural proof containers;
- issues make good task boundaries.

Agency OS role:
- aggregate GitHub evidence across projects;
- detect claims without PR/check/deploy proof;
- recommend next steps based on real repository signals.

### LangChain / LangGraph / CrewAI / AutoGPT

These projects validate that agent orchestration, stateful workflows, event
flows and visual builders matter.

What to borrow:
- stateful workflows and durable agent state from LangGraph;
- explicit crews/flows from CrewAI;
- workflow triggers/scheduling from AutoGPT;
- integration ecosystem patterns from LangChain.

What to avoid:
- building a full orchestration runtime too early;
- visual workflow builder before the state ledger is useful;
- agent abstraction layers that hide proof.

Agency OS role:
- sit above orchestrators;
- consume their outputs;
- enforce evidence and review across them.

### OWASP Agentic AI Guidance

Security must be product architecture, not a later checklist.

What to borrow:
- least privilege;
- explicit permission manifests;
- safe parsing for untrusted data;
- signed/hashable artifacts where possible;
- dependency pinning;
- audit log retention;
- no silent authority escalation;
- no deletion of evidence logs by agents.

Agency OS role:
- every agent has scope;
- every external action has approval policy;
- every write is evented;
- every imported artifact is treated as untrusted until parsed/validated.

### 2026 Governance Direction

Current governance writing converges on a few ideas:
- discovery: know which agents exist;
- identity: treat agents like security principals;
- ownership: every agent has a human owner;
- autonomy matched to blast radius;
- runtime controls, not only pre-launch policy;
- measurable control effectiveness;
- retirement and token removal before agents become invisible legacy systems;
- human-in-the-loop as trained decision authority, not a decorative checkbox.

Agency OS implications:
- add an Agent Registry before adding agent autonomy;
- show owner, scope, last run, permissions and retirement status;
- require rationale and context for approvals;
- record rejected approvals, expired approvals and agent retirement events;
- surface agent sprawl as a Command Center warning.

## Architecture Implications

1. Local-first data before hosted complexity.
2. Append-only events before mutable state.
3. Evidence freshness before dashboards.
4. Agent permissions before agent autonomy.
5. Phone review before full mobile app.
6. GitHub read-only importer before write-capable integrations.
7. Human decisions as first-class records.
8. Security/audit gates visible in Command Center.
9. Agent lifecycle management before wide integrations.
10. Export/backup/restore before production dependency on the ledger.
11. Cost and token-spend signals before long-running automation.

## Open Questions For Later

- Should Agency OS use SQLite first or JSON/JSONL files first?
- Should agent identity start as local token identity or cryptographic identity?
- Should GitHub be the first hard evidence importer or should Codex task logs be
  first because they are closer to the current workflow?
- Should local-only mode remain permanent, or become a staging mode before
  hosted Sites deployment?
- What is the first real user besides the builder?
- Should action-ledger integrity stay local-checksum based for v0.2, or should
  v0.3 introduce cryptographic signatures before any external write API?
- Which evidence source should be imported first: GitHub checks/PRs or Codex
  task artifacts?
