# Research And Comparison Notes

Status: draft v0.1  
Last updated: 2026-07-23

## Sources Checked

Primary/local:
- Trailmark repository: https://github.com/bearded-illirian/trailmark
- Trailmark local research clone: `work/trailmark-research`

Market/product:
- Buzz official announcement:
  https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together
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

### Buzz

Buzz validates the market direction: humans and agents need a shared place with
context, identity, permissions, history and code/work artifacts.

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

## Architecture Implications

1. Local-first data before hosted complexity.
2. Append-only events before mutable state.
3. Evidence freshness before dashboards.
4. Agent permissions before agent autonomy.
5. Phone review before full mobile app.
6. GitHub read-only importer before write-capable integrations.
7. Human decisions as first-class records.
8. Security/audit gates visible in Command Center.

## Open Questions For Later

- Should Agency OS use SQLite first or JSON/JSONL files first?
- Should agent identity start as local token identity or cryptographic identity?
- Should GitHub be the first hard evidence importer or should Codex task logs be
  first because they are closer to the current workflow?
- Should local-only mode remain permanent, or become a staging mode before
  hosted Sites deployment?
- What is the first real user besides the builder?
