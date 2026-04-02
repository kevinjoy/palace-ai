# Palace AI — Reference Project Research Report

Research conducted Apr 2-3, 2026 to inform Palace AI's architecture. All repos cloned to `references/` (gitignored).

## Index

| # | Project | Applicability | Key Pattern for Palace |
|---|---------|--------------|----------------------|
| 1 | [OpenViking](#1-openviking) | **High** | L0/L1/L2 tiered memory, filesystem-paradigm retrieval |
| 2 | [Paperclip](#2-paperclip) | **High** | Heartbeat model, org-chart hierarchy, dashboard UX |
| 3 | [Hermes](#3-hermes) | **High** | Self-improving skill accumulation, bounded memory, security scanning |
| 4 | [PromptFoo](#4-promptfoo) | **High** | Model evaluation/benchmarking for routing optimization |
| 5 | [PAI (Daniel Miessler)](#5-pai) | **High** | Hooks, skills, CLAUDE.md cascading — Palace's foundation |
| 6 | [Openclaw / Nanoclaw](#6-openclaw--nanoclaw) | **Medium** | Heartbeat/cron patterns, sandbox agent behavior |
| 7 | [Claw-code](#7-claw-code) | **Medium** | CC-like software architecture patterns |
| 8 | [Pixel Agents](#8-pixel-agents) | **Medium** | Spatial-metaphor agent visualization UX |
| 9 | [cmux](#9-cmux) | **Medium** | Terminal UX for agents — notifications, workspaces |
| 10 | [Autoresearch](#10-autoresearch) | **Medium** | Keep/discard hill-climbing for Vizier research orchestration |
| 11 | [aisw + KMJ Gist](#11-aisw--kmj-gist) | **Low** | Account switching — solved by CLAUDE_CONFIG_DIR |
| 12 | [TurboQuant](#12-turboquant) | **Low** | KV-cache compression — only relevant for local inference |
| 13 | [Pretext](#13-pretext) | **Low** | DOM-free text measurement — niche dashboard optimization |
| 14 | [Claude Code Agent Teams](#14-claude-code-agent-teams) | **High** | Peer-to-peer agent communication — Palace's comms foundation |
| 15 | [Security Patterns](#15-security-architecture-patterns) | **Critical** | Bell-LaPadula, Biba, Clark-Wilson adapted for agentic AI |

---

## 1. OpenViking
**Repo:** [volcengine/OpenViking](https://github.com/volcengine/OpenViking) | **Cloned:** `references/OpenViking/`

**Summary:** ByteDance's context database implementing a filesystem paradigm for AI agent memory. The core innovation: L0/L1/L2 tiered context decomposition at WRITE time, not query time.

**Key Patterns:**
- **L0 (Abstract):** <100 tokens, single-sentence summary. Cheap scanning across many items.
- **L1 (Overview):** <2,000 tokens, structured summary. Planning and decision-making.
- **L2 (Detail):** Full content, unbounded. Deep engagement only.
- **viking:// URI scheme:** `viking://resources/`, `viking://user/`, `viking://agent/` — filesystem structure preserves hierarchy that flat vectors lose
- **Directory-recursive retrieval:** BFS priority queue navigates structure, not just matches fragments
- **Self-evolving memory:** Session-end extraction classifies into 8 categories, deduplicates via vector similarity + LLM, archives cold memories via hotness score
- **Token savings:** 83-96% vs traditional RAG

**Palace application:** Directly adopted for memory architecture. Palace URI scheme (`palace://court/{courtier}/`) follows this pattern. L0/L1/L2 tiers map to Counsel Layer scanning (L0), Courtier planning (L1), deep work (L2).

---

## 2. Paperclip
**Repo:** [paperclipai/paperclip](https://github.com/paperclipai/paperclip) | **Cloned:** `references/paperclip/`

**Summary:** Open-source agent orchestrator using company metaphor. Heartbeat-based agent lifecycle with PostgreSQL state persistence and a React dashboard.

**Key Patterns:**
- **Heartbeat model:** Agents wake on schedule + event triggers. Each heartbeat injects curated context packet (memory, tasks, inputs, config). State persists in PostgreSQL.
- **Org-chart hierarchy:** Roles, reporting lines, delegation flows. Company metaphor — not just agent spawning.
- **Dashboard:** Metrics-first with 4-column MetricCards, live agent run cards, streaming tool output, Kanban board (7 columns, drag-and-drop), goal tree hierarchy
- **Org Chart visualization:** SVG pannable/zoomable tree with color-coded status dots (cyan=running, green=active, yellow=paused, red=error)
- **Company Import/Export:** Portable org packages with secret scrubbing — the "Clipmart" marketplace for downloading pre-built teams
- **Adapter system:** Supports Claude, Codex, Gemini, Hermes, Openclaw — any runtime that receives a heartbeat is "hired"

**Palace application:** Heartbeat model adopted for Courtier lifecycle. Org-chart pattern validates the Court hierarchy approach. Dashboard patterns inform Phase 3 interface design. Company import/export concept could become Palace "Court Templates" for other users.

---

## 3. Hermes
**Repo:** [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | **Cloned:** `references/hermes-agent/`

**Summary:** Self-improving AI agent by Nous Research. Python-based, supports multiple chat frontends.

**Key Patterns:**
- **Autonomous skill creation** (`skill_manager_tool.py`): Agent creates, edits, patches skills at runtime. Skills are markdown files with YAML frontmatter. Creates skills when: 5+ tool calls succeeded, errors overcome, non-trivial workflow discovered.
- **Bounded curated memory** (`memory_tool.py`): Two stores — `MEMORY.md` (agent notes, 2200 char cap) and `USER.md` (user profile, 1375 char cap). Forced curation via character limits. Injection-scanned before acceptance.
- **Security scanning** (`skills_guard.py`): Regex-based analyzer detects exfiltration, injection, destructive commands. Trust-tiered install policy: builtin trusted, community blocked, agent-created gets intermediate trust.
- **Session persistence:** SQLite + WAL + FTS5. Sessions chain via parent_session_id when context compression triggers.
- **RL training loop:** Built-in Tinker-Atropos integration for reinforcement learning.

**Palace application:** Skill accumulation pattern directly applicable to Courtier learning. Bounded memory prevents context bloat. Security scanning pipeline essential for any agent-created content entering Palace memory. Skills Hub pattern informs potential Palace skill marketplace.

---

## 4. PromptFoo
**Repo:** [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | **Cloned:** `references/promptfoo/`

**Summary:** LLM evaluation framework. Declarative YAML configs, multi-provider comparison, assertion pipelines.

**Key Patterns:**
- **Providers/Prompts/Tests pipeline:** Define test cases → run across models → compare via assertions
- **Assertion types:** equals, contains, regex, factuality (model-graded), cost, latency, custom JS/Python
- **Three integration modes for Palace:**
  1. Offline benchmarking: periodic eval of models per task category → routing table update
  2. Online A/B testing: programmatic `evaluate()` API for runtime routing weight adjustment
  3. Red team testing: security testing before granting agent access to new models
- **Provider registry:** Clean abstraction — any LLM implements common interface
- **200+ example configs** showing real evaluation patterns

**Palace application:** Used for Layer 3 (agent behavior tests) and Layer 4 (model evaluation) in testing strategy. Vizier consults model capability matrix built from PromptFoo results when routing tasks.

---

## 5. PAI
**Repo:** [danielmiessler/Personal_AI_Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure)

**Summary:** Personal AI Infrastructure — Claude Code harness focused on human activation. Kevin's current foundation.

**Key Patterns:**
- **Hooks system:** PreToolUse, PostToolUse, Stop hooks extend behavior without modifying CC
- **Skills:** Modular capability packages (Thinking, Research, Media, etc.)
- **CLAUDE.md cascading:** Global → project-level instruction layering
- **Algorithm workflow:** OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN with ISC criteria
- **Memory:** File-based persistence with MEMORY directories
- **PRD tracking:** Work items with dashboard sync

**Palace application:** Palace IS built on PAI. The hooks, skills, CLAUDE.md patterns, and Algorithm workflow are the foundation. Palace extends with multi-agent orchestration, role-based access, and multi-account routing. The Algorithm's phased state machine (OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN) with ISC criteria provides the template for how Courtiers should approach complex work — each Courtier could run a simplified Algorithm for its domain tasks.

---

## 6. Openclaw / Nanoclaw
**Repos:** [openclaw](https://github.com/anthropics/openclaw), [nanoclaw](https://github.com/anthropics/nanoclaw) | **Cloned:** `references/openclaw/`, `references/nanoclaw/`

**Summary:** OpenClaw is the full agent framework; NanoClaw is a lightweight TypeScript variant with container isolation.

**Key Patterns:**
- **Lane mutual exclusion (OpenClaw):** User-priority scheduling where human requests preempt agent work. Lanes are work queues with priority levels — ensures the Vizier can interrupt any Courtier when Kevin needs attention.
- **Heartbeat/cron architecture:** Agents wake on schedule, check task queue, execute, report. State persists between heartbeats.
- **OpenViking integration:** Native context management using the L0/L1/L2 model.
- **Container isolation (NanoClaw):** Agents run in isolated containers with credential injection — credentials provisioned per-task, never inherited from host. Directly applicable to Palace's sandbox model.
- **Lightweight agent loop:** NanoClaw's TypeScript implementation shows a minimal immutable agent loop that can be extended.

**Palace application:** Lane mutual exclusion informs Vizier priority scheduling. Container isolation pattern applies to NUC sandbox containment. Heartbeat/cron patterns validate the Courtier lifecycle design. OpenViking integration proves the L0/L1/L2 memory model works in production with agents.

---

## 7. Claw-code
**Repo:** claw0 fallback (ultraworkers/claw-code main repo inaccessible) | **Cloned:** `references/claw0/`

**Summary:** Learning-oriented Claude Code reference implementation. 10 sessions of Python implementations exploring CC internals.

**Key Patterns:**
- **Immutable agent loop primitive:** A clean, stateless loop where the agent receives context, produces actions, and returns results without mutating shared state. Each iteration is a pure function of its inputs.
- **Tool execution pipeline:** Structured tool dispatch with type-safe input/output contracts.
- **Session management:** Clean session boundaries with explicit state serialization.

**Palace application:** The immutable agent loop is the right primitive for Courtier heartbeat cycles — each heartbeat is a pure function of (config + memory + task queue) → (outputs + memory updates). No hidden state mutation.

---

## 8. Pixel Agents
**Repo:** [pablodelucca/pixel-agents](https://github.com/pablodelucca/pixel-agents) | **Cloned:** `references/pixel-agents/`

**Summary:** VS Code extension that visualizes Claude Code agents as pixel art characters in a virtual office.

**Key Patterns:**
- **Character-as-agent binding:** Each CC terminal gets an animated character with 3-state FSM (IDLE, WALK, TYPE)
- **Real-time tool tracking:** Watches JSONL transcript files. Tool-to-animation mapping: Write/Edit/Bash → typing, Read/Grep/Glob → reading
- **Sub-agent visualization:** Task sub-agents spawn as smaller characters near parent
- **Office layout editor:** Full tile-based editor with furniture, 50-level undo/redo, persistent layouts
- **Sound notifications:** Ascending chime via Web Audio API when agent finishes

**Palace application:** The spatial metaphor maps DIRECTLY to Palace's court concept. Office → throne room/castle. Desks → court positions. The transcript-parsing pattern works for any CC agent with zero modifications. Layout customization feeds Palace's personalization ethos. Phase 3 interface design should study this closely.

---

## 9. cmux
**Repo:** [manaflow-ai/cmux](https://github.com/manaflow-ai/cmux) | **Cloned:** `references/cmux/`

**Summary:** Ghostty-based macOS terminal for agentic workflows.

**Key Patterns:**
- **Vertical tabs:** Each workspace shows git branch, PR status, working dir, listening ports, latest notification
- **Three notification channels:** OSC terminal escapes, CLI command (`cmux notify`), socket API
- **Blue ring indicator:** Unread notification ring on panes via CAShapeLayer overlay
- **Scriptable browser pane:** Embedded WebKit with agent-controllable accessibility tree, click, fill, evaluate JS
- **Cookie import:** Browser panes import sessions from Chrome, Firefox, Arc

**Palace application:** Notification patterns for Phase 3 terminal UX. The workspace-per-agent model maps to Courtier workspaces. The scriptable browser enables Courtiers to interact with web services directly.

---

## 10. Autoresearch
**Repo:** [karpathy/autoresearch](https://github.com/karpathy/autoresearch) | **Cloned:** `references/autoresearch/`

**Summary:** Andrej Karpathy's automated research system using keep/discard hill-climbing.

**Key Patterns:**
- **Keep/discard loop:** Fixed 5-minute evaluation budget. Single-file modification constraint. If modification improves eval score → keep, else → discard.
- **Program-as-markdown:** Agent control via markdown files that define research scope
- **Fork ecosystem:** Community has built parallel execution variants

**Palace application:** The keep/discard hill-climbing loop could inform how the Vizier optimizes routing decisions over time. The fixed-budget evaluation aligns with Palace's throughput-maximization principle.

---

## 11. aisw + KMJ Gist

**Summary:** Account switching tools for Claude Code.

**Key Patterns:**
- **aisw:** Rust binary for profile switching (one active at a time)
- **KMJ Gist:** `CLAUDE_CONFIG_DIR` environment variable for multi-account isolation

**Palace application:** Solved. `CLAUDE_CONFIG_DIR` is the pattern Palace uses. CCS, aisw, and the KMJ gist all converge on this same mechanism.

---

## 12. TurboQuant
**Repo:** [tonbistudio/turboquant-pytorch](https://github.com/tonbistudio/turboquant-pytorch) | **Cloned:** `references/turboquant-pytorch/`

**Summary:** KV-cache compression for LLM inference. Two-stage: random orthogonal transform + Lloyd-Max quantization. 5.1x compression with 0.9996 cosine similarity.

**Palace application:** **Low.** TurboQuant solves VRAM optimization for self-hosted model serving. Palace uses API-based routing, not local inference. Only relevant if Palace ever runs local models on NUC for privacy-sensitive tiers. Filed as future reference.

---

## 13. Pretext
**Repo:** [chenglou/pretext](https://github.com/chenglou/pretext) | **Cloned:** `references/pretext/`

**Summary:** DOM-free text measurement in TypeScript. Two-phase: `prepare()` (canvas-based measurement) → `layout()` (pure arithmetic). ~0.09ms per layout call.

**Palace application:** **Low but interesting.** Relevant if Palace's dashboard needs virtualized text rendering (chat logs, agent output streams). The `walkLineRanges` API enables shrink-wrap layouts CSS can't do. Worth watching if Palace moves toward canvas-rendered dashboards.

---

## 14. Claude Code Agent Teams

**Summary:** Anthropic's shipped (Feb 2026) multi-agent coordination system.

**Key Patterns:**
- **Peer-to-peer messaging:** Teammates message each other directly, not just report to parent
- **13 operations in TeammateTool:** team lifecycle, membership, coordination, shutdown
- **Broadcasting:** Team lead can broadcast to all agents
- **Each agent has its own context window** — isolation by default

**Palace application:** **Foundation.** Palace uses Agent Teams for all inter-Courtier communication. The Vizier is the team lead. Courtiers are teammates. Agent Teams provides the message bus; Palace adds role-based access control and the Counsel Layer on top.

**Note:** No Unix socket protocol found in Agent Teams. If Palace needs cross-machine communication (Phase 2+), it would need to build its own socket layer beneath Agent Teams.

---

## 15. Security Architecture Patterns

**Summary:** Classic security models adapted for multi-agent AI, drawing from OWASP, NVIDIA, TRiSM, and NIST.

**Key Patterns:**
- **Bell-LaPadula:** No read up, no write down → agents see only their tier and below
- **Biba:** No write up, no read down → lower-trust agents can't poison higher-trust state
- **Clark-Wilson:** Transaction integrity → agents propose, system validates, then commits
- **NVIDIA sandboxing:** MicroVMs (Firecracker) for untrusted agents, gVisor for semi-trusted, network egress controls
- **OWASP 4-tier classification:** PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED — maps to Palace's tiers
- **Credential broker:** Per-task secret provisioning, never inherited host credentials
- **Graduated autonomy (TRiSM):** Start restricted, earn trust through validated behavior
- **NIST AI Agent Standards:** Treat agents as non-human identities requiring Zero Trust controls

**Palace application:** **Critical.** Directly informs `docs/security.md`. Bell-LaPadula + Biba + Clark-Wilson provide the theoretical foundation for Palace's 6-tier model. NVIDIA's sandboxing patterns apply to NUC containment. OWASP's classification maps directly to Palace's tier assignments.

**Sources:** OWASP AI Agent Security Cheat Sheet, NVIDIA Sandboxing Guide, TRiSM for Agentic AI (arXiv), NIST AI Agent Standards Initiative.

---

## Cross-Cutting Patterns

Three patterns appear across multiple projects and are especially relevant to Palace:

### 1. Skill Accumulation Loop
**Seen in:** Hermes, Paperclip, PAI

Agents accumulate procedural knowledge from experience. Skills are stored as markdown files with YAML frontmatter. A security scanner validates agent-created skills before they enter the system. The loop: succeed at complex task → extract procedure → store as skill → consult before solving from scratch.

**Palace adoption:** Courtiers should accumulate skills within their domain. The Chaplain learns "how Kevin likes essays structured." The Lord of Guild learns "how to conduct compensation research." These skills are Organization Layer (owned by Courtier).

### 2. Evaluation-Driven Routing
**Seen in:** PromptFoo, Autoresearch, multi-account research

Model selection should be empirical, not assumed. Periodic benchmarking across task types keeps routing optimal. The keep/discard pattern provides continuous optimization without manual tuning.

**Palace adoption:** PromptFoo evaluations inform the Vizier's routing table. Monthly benchmarks update which model is best for each task category. The throughput formula weights quality over cost.

### 3. Security-First Agent Content
**Seen in:** Hermes, NVIDIA, OWASP, TRiSM

Every piece of agent-generated content that enters the system is a potential injection vector. Security scanning, trust tiers, and graduated autonomy are essential — not optional hardening.

**Palace adoption:** All Counsel Layer submissions are validated. Sandbox agent outputs are reviewed before entering Open Court. Agent-created skills pass through security scanning. The 6-tier model enforces access boundaries at every layer.
