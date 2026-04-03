# Palace AI — System Architecture

> For all visual diagrams, see [@docs/codebase-map.md](codebase-map.md). This document references diagram sections by anchor.

## Overview

Palace AI is a personal agentic infrastructure built on Claude Code, using a court organizational metaphor. A Grand Vizier (Finn) orchestrates facet-based Courtiers that manage domains of the user's life — personal, work, research, learning, and creative output.

**Palace is an app, not an OS.** Users interact with Finn, not with Tailscale ACLs. Security tiers are configured during onboarding and then invisible. Infrastructure (network, sync, permissions) is abstracted behind the app layer.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  INTERFACE LAYER (multi-target rendering)        │
│  TUI · Web Dashboard · Mobile · Vision Pro       │
│  All renderers consume the same structured data  │
├─────────────────────────────────────────────────┤
│  HARNESS LAYER (Phase 1 focus)                   │
│  Vizier · Courtiers · Memory · Token Router      │
│  Built on Claude Code + PAI patterns             │
├─────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                            │
│  Machines · Network · Data Sync · Security       │
│  Configured by Palace, invisible to user         │
└─────────────────────────────────────────────────┘
```

## Machine Topology

See [@docs/codebase-map.md — Machine Topology](codebase-map.md#machine-topology).

| Machine | Role | Phase |
|---------|------|-------|
| **MBP (M1 Max, 64GB)** | Daily driver. Palace app runs here. Primary interaction point. | Phase 1 |
| **NUC (Ubuntu, 32GB)** | Agent sandbox. Openclaw/Hermes experimentation. | Phase 1 (prep), Phase 2 (integration) |
| **NAS (TrueNAS, 64GB, 1080)** | Storage + services (Immich, Ollama, n8n, uptime kuma) | Phase 2 |
| **Dell XPS** | Dormant. Available for future Novo-dedicated work. | Phase 3+ |

**Network:** Flat Tailscale mesh. Phase 1 uses filesystem enforcement only (copy-in model). Tailscale ACLs added in Phase 2.

## Harness Layer Architecture

### Building on Claude Code + PAI

Palace extends Claude Code's capabilities using the patterns established by Daniel Miessler's PAI:

- **Hooks system:** PreToolUse, PostToolUse, and Stop hooks for extending agent behavior without modifying Claude Code itself
- **CLAUDE.md cascading:** Global instructions (~/.claude/CLAUDE.md) + project-level instructions provide context layering
- **Skills:** Modular capability packages invoked via the Skill tool
- **Memory:** File-based persistence across sessions via MEMORY directories
- **Status tracking:** PRD-based work tracking with dashboard sync

Palace adds on top of this:
- **Multi-agent orchestration** via the Vizier
- **Role-based access control** via the 6-tier security model
- **Multi-account routing** via config directory isolation
- **Tiered memory** inspired by OpenViking's L0/L1/L2 model
- **Configurable Courtier system** for domain-specific agent specialization

### The Vizier (Finn)

The Vizier is the master orchestrator — the single point of coordination for all Palace activity.

**Responsibilities:**
- Receive tasks from Kevin (via chat, Obsidian notes, scheduled triggers)
- Analyze task complexity and route to appropriate Courtier + model + account
- Mediate the Counsel Layer (review, prioritize, synthesize Courtier outputs)
- Manage Courtier lifecycle (activate, suspend, coordinate)
- Track throughput and report on system utilization

**Implementation pattern:** The Vizier runs as a Claude Code session with a specialized CLAUDE.md that defines its orchestration role. It uses Agent Teams (Claude Code's shipped peer messaging) to communicate with active Courtiers, and the Task tool for spawning sub-agents.

### Courtier Lifecycle

See [@docs/courtiers.md](courtiers.md) for the full Courtier system spec.

**Heartbeat model (informed by Paperclip):**
- Courtiers wake on **scheduled heartbeats** (daily, hourly, or custom) plus **event triggers** (task assignment, data changes, user requests)
- Each heartbeat injects a context packet: current memory state, pending tasks, recent Counsel Layer updates, Courtier config
- The Courtier processes its queue, produces outputs, and submits results to the Counsel Layer
- State persists between heartbeats in the Palace memory system

**Phase 1 simplification:** In Phase 1, Courtiers are Claude Code sessions/agents spawned by the Vizier as needed, not persistent processes. The heartbeat model is simulated via cron jobs and Claude Code's RemoteTrigger capability.

### Inter-Agent Communication

Palace uses Claude Code's **Agent Teams** for inter-agent communication:

- **Peer-to-peer messaging:** Courtiers can message each other and the Vizier directly (not just report to parent)
- **Broadcasting:** The Vizier can broadcast priority changes or context updates to all active Courtiers
- **Team lifecycle:** Vizier spawns, discovers, and manages Courtier teams

**Future consideration:** Unix domain socket communication as a lower-level transport layer beneath Agent Teams. This would enable:
- Communication between agents on different machines (NUC ↔ MBP via socket forwarding over Tailscale)
- Non-Claude-Code agents (Openclaw, Hermes) participating in Palace's message bus
- Persistent message queues that survive agent restarts

Assessment: Agent Teams is sufficient for Phase 1 (MBP-only, Claude Code agents). Unix sockets become relevant in Phase 2 when NUC agents need to communicate with MBP agents across machines.

### Provider Abstraction Layer

**Palace is model-agnostic.** The harness must NOT be bound to Claude or any single frontier lab. Any model or inference provider should be connectable — Anthropic, OpenAI, Google, Ollama, local models, future providers.

**Why this matters:** Courtiers receive model/effort/token assignment from the Vizier BEFORE spinning up their org. The Vizier must be able to say "this research task goes to Gemini, this code review goes to Codex, this synthesis goes to Opus" — routing across providers, not just across accounts of the same provider.

**Architecture:**

```
┌─────────────────────────────────────────────────────┐
│  VIZIER (Task Analysis + Routing Decision)          │
│  Analyzes: complexity, sensitivity, task type        │
│  Decides: provider + model + account + effort        │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  PROVIDER ABSTRACTION LAYER                          │
│  Uniform interface for all providers                 │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Anthropic│ │  OpenAI  │ │  Google  │ │ Ollama │ │
│  │ Claude   │ │  Codex   │ │  Gemini  │ │ Local  │ │
│  │ API/CLI  │ │  CLI     │ │  CLI     │ │ Server │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────┘
```

**Provider interface (uniform across all providers):**
- `execute(task, config) → result` — send a task, get structured output
- `status() → availability` — check provider health, remaining capacity
- `capabilities() → model_list` — what models are available, what they're good at

**Reference implementations:**
- **Hermes:** Supports Claude, GPT, Gemini, Ollama, any OpenAI-compatible API via adapter pattern
- **Openclaw:** Gateway pattern connecting to multiple model backends
- **OpenCode:** Multi-provider with provider-specific adapters
- **Paperclip:** Adapter system (Claude, Codex, Gemini, Hermes, Openclaw, HTTP, generic Process)
- **LiteLLM:** Unified API proxy supporting 100+ providers — potential gateway layer

**Phase 1:** The Vizier orchestrates via CLI tools (`claude`, `claude-novo`, `codex`, `gemini`) as separate processes. The provider abstraction is the CLI itself — each tool is a provider.
**Phase 2:** Formalize into a typed provider interface with adapters. Add API-based providers (Anthropic API, OpenAI API) alongside CLI providers.
**Phase 3:** Intelligent routing with PromptFoo-driven benchmarking per task type per provider.

### Deterministic Agent Interaction

Agent-to-agent communication must be **structured, observable, and reproducible** — not free-form LLM conversation.

**Principles:**
- **Typed message schemas:** Every inter-agent message has a defined structure (task assignment, result, status update, counsel submission). No unstructured text passing.
- **URI-addressable state:** All shared state referenced via `palace://` URIs. Agents don't pass blobs — they pass references.
- **Auditable state transitions:** Every Courtier state change (dormant → active, task received → completed) is logged with timestamp, trigger, and outcome.
- **Idempotent operations:** If a heartbeat or message is delivered twice, the system produces the same result. No hidden side effects.

**This is what separates Palace from "agents chatting with each other."** The OpenViking filesystem paradigm, typed URIs, and structured message envelopes make agent interaction predictable and debuggable.

## Memory Architecture

### OpenViking-Inspired Tiered Context

Palace's memory system adapts OpenViking's filesystem paradigm with tiered context loading:

**Three-tier decomposition (at write time):**
- **L0 (Abstract):** Single-sentence summary, <100 tokens. Used for scanning across many items cheaply.
- **L1 (Overview):** Structured summary with essential info, structure, usage scenarios, <2,000 tokens. Used for planning and decision-making.
- **L2 (Detail):** Full original content, unbounded. Loaded only when deep engagement is needed.

**Token savings:** 83-96% vs loading full content for every query. Agents skim at L0, plan at L1, dive at L2 only when necessary.

**Palace URI scheme (adapted from viking://):**
```
palace://court/vizier/decisions/2026-04/task-routing-update     # Vizier's decisions
palace://court/chaplain/drafts/essay-on-intelligence             # Chaplain's work
palace://counsel/guild/research-findings/openviking-analysis     # Counsel Layer
palace://user/kevin/observations/2026-04-03                      # Kevin's daily notes
palace://projects/comp-strata/backlog/item-42                    # Project backlog
```

**Self-evolving memory (adapted from OpenViking):**
- At session end, a memory extraction process analyzes the conversation
- Classifies outputs into categories: decisions, patterns, preferences, entities, skills
- Deduplicates against existing memory (vector similarity + LLM-assisted merge)
- Archives cold memories (hotness score based on access frequency and age)

### Memory Scoping by Security Tier

Memory items are tagged with their security tier. When a Courtier's context is assembled:
1. Start with the Courtier's own organizational memory (Layer 1)
2. Add relevant items from shared data (Layer 2) filtered by the Courtier's tier access
3. Add Counsel Layer items at L0 (summaries) — the Courtier can request L1/L2 depth
4. Never include items above the Courtier's clearance level

### Storage Implementation (Phase 1)

Phase 1 uses file-based storage (markdown + YAML), consistent with PAI's existing patterns:
- Courtier memories in `MEMORY/COURT/{courtier}/`
- Counsel Layer in `MEMORY/COUNSEL/`
- User observations in `MEMORY/USER/`
- Project backlogs in `MEMORY/PROJECTS/{project}/`

Phase 2 introduces database backing (PostgreSQL or SQLite) with the file-based layer as a human-readable cache. OpenViking's vector indexing added for semantic retrieval.

## Multi-Account Token Routing

See [@docs/token-routing.md](token-routing.md) for the full spec.

**Phase 1 implementation:** `CLAUDE_CONFIG_DIR` environment variable aliases. Each account gets an isolated config directory with its own auth, history, and settings.

**Routing summary:**
- Sensitive Novo data → MUST use Novo account
- Non-sensitive Novo work → PREFER Novo, FALLBACK to Personal
- Personal work → Personal account
- Research/validation → Any available (prefer Gemini/Codex for parallel work)
- Model selection: Opus for strategic, Sonnet for implementation, Haiku for routine

## Security Architecture

See [@docs/security.md](security.md) for the full spec.

**Summary:** 6-tier data classification model (Crown Jewels / Inner Chamber / Guarded / Open Court / Sandlot / Diplomatic Pouch) enforced at filesystem level in Phase 1, network level in Phase 2, runtime level in Phase 3. Grounded in Bell-LaPadula (confidentiality), Biba (integrity), and Clark-Wilson (transaction integrity).

## Data Flow

See [@docs/codebase-map.md — Data Flow](codebase-map.md#data-flow).

### Obsidian Integration

Obsidian is Kevin's workpad — evolving from underused daily notes to a bidirectional exchange surface:

| Phase | Obsidian Role | Sync Mechanism |
|-------|--------------|----------------|
| **Phase 1** | Read-only data source for agents | Git-based sync (MBP → NUC, periodic pull) |
| **Phase 2** | Courtiers propose writes via review queue | PR-based write proposals, Kevin approves |
| **Phase 3** | Bidirectional collaborative editing | Palace-managed sync, may replace Obsidian Sync |

**Courtier interactions with Obsidian:**
- **Chaplain:** Reads daily notes and personal reflections, helps expand thinking into long-form works
- **Vizier:** Reads observations, pushes items into project backlogs
- **Herald/Chamberlain:** Prepares daily to-do and communications abstracts

### GitHub Integration

All code projects are git-managed repos on GitHub. Agents interact via:
- Direct git operations (clone, pull, branch, commit, PR)
- GitHub CLI (`gh`) for issues, PRs, reviews
- Courtiers with project responsibilities get repo access at their security tier

## Phased Evolution Roadmap

See [@docs/codebase-map.md — Phase Evolution](codebase-map.md#phase-evolution).

### Phase 1: Foundation (MBP Only)
- Vizier running on MBP as Claude Code session
- 4 active Courtiers: Herald, Lord of Guild, Chaplain, (+ Vizier)
- Multi-account routing via config directory aliases
- File-based memory system
- Git-based Obsidian sync (read-only)
- NUC wiped and prepped in parallel (Hermes/Openclaw familiarization)

### Phase 2: Distribution (MBP + NUC)
- NUC sandbox integrated with Palace
- Tailscale ACLs for network-level security
- Database-backed memory (file-based human-readable cache)
- Openclaw/Hermes running in sandlot
- Cloud fallback for Vizier availability
- Courtier heartbeat model fully operational

### Phase 3: Interface (Dashboard + Collaboration)
- Web dashboard for daily interaction (responsive: desktop, tablet, mobile)
- Bidirectional Obsidian integration
- Full Courtier activation (Chancellor, Master at Arms, Ambassadors)
- Pixel Agents-inspired visualization of court activity
- Real-time Courtier status and work tracking

### Phase 4: Expansion
- Ganglionic center (distributed insight commons)
- Multi-operator support (beyond single user)
- Cross-organization collaboration via Diplomatic Pouch
- Self-improving agent patterns (skill accumulation, behavior adaptation)

### Phase 5: Spatial Computing (Apple Vision Pro)
- **visionOS native app** — Palace as a spatial court experience
- Courtiers as positioned panels/volumes in the user's space
- The Raja (Kevin) at the center, surveying the court in 360°
- Terminal outputs as floating windows, arrangeable spatially
- Counsel Layer as a shared table courtiers present at
- Real-time courtier activity visualized as presence/motion (Pixel Agents evolved to 3D)
- Voice-driven interaction with Finn (spatial audio)
- **Why:** Kevin evaluates terminal output all day but doesn't composite or edit — spatial computing removes the "suffocated for space" constraint of flat screens
- **Note:** This is a late-phase aspiration. It requires no special code NOW but does require architectural discipline: **structured data first, rendered text second.**

## Renderer Abstraction (Multi-Target UX)

Palace's core produces **structured data**. Renderers turn it into visual output for each target platform. This separation is what makes TUI, web, mobile, and Vision Pro all possible without forking the core.

```
┌─────────────────────────────────────────────────┐
│  PALACE CORE (structured data output)            │
│  Counsel items, courtier status, task results,   │
│  event streams, memory items — all typed JSON    │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────┼──────────┬──────────┬────────────┐
    ▼          ▼          ▼          ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│  TUI   │ │  Web   │ │ Mobile │ │ cmux   │ │ visionOS │
│ CLI    │ │ React  │ │ tablet │ │terminal│ │ spatial  │
│ stdout │ │ dash   │ │ phone  │ │ panes  │ │ volumes  │
└────────┘ └────────┘ └────────┘ └────────┘ └──────────┘
 Phase 1    Phase 3    Phase 3    Phase 3     Phase 5
```

**Architectural rule:** No renderer-specific formatting in the core. The Vizier, Courtiers, memory system, and routing engine produce structured data (typed interfaces). The CLI formats it for the terminal. A future web dashboard renders it as React components. visionOS renders it as spatial panels. The core doesn't know or care which renderer is consuming its output.

**Practical implication for current code:** The `cli.ts` module is a renderer. When we build new features, the output should be a typed return value that `cli.ts` formats, not `console.log` embedded in core logic. This discipline pays off when the second renderer (web dashboard or Vision Pro) arrives.

### UX Target Roadmap

| Phase | Target | Technology | Notes |
|-------|--------|-----------|-------|
| 1 | TUI (CLI) | Bun + stdout | Current — `palace` command |
| 3 | Web dashboard | React + WebSocket | Paperclip-inspired, responsive |
| 3 | Mobile/tablet | Responsive web | Same dashboard, responsive layout |
| 3 | Terminal panes | cmux integration | Spatial tabs per courtier |
| 5 | Apple Vision Pro | visionOS + SwiftUI | Spatial court — Raja at center, courtiers as volumes |

### Vision Pro Design Concepts (Phase 5, aspirational)

The court metaphor maps naturally to spatial computing:

- **Throne room layout:** Kevin (the Raja) sits at the center. Courtier panels are positioned around the space — Guild research to the left, Herald's daily brief front-center, Chaplain's drafts to the right.
- **Presence as status:** Active courtiers are bright, prominent volumes. Dormant courtiers fade. Suspended courtiers dim with a pulse.
- **Counsel table:** A shared surface where courtier outputs land as cards. Swipe to promote, dismiss, or dive deeper (L0 → L1 → L2).
- **Voice interaction:** "Finn, what's the Guild working on?" → spatial audio response from the Guild's position.
- **Terminal volumes:** Each courtier's working terminal is a window that can be pulled closer, expanded, or pushed to the periphery. No more fighting for screen real estate.

## Reference Architecture Influences

| Project | What Palace Borrows | Where Applied |
|---------|-------------------|---------------|
| **PAI** | Hooks, skills, CLAUDE.md cascading, Algorithm workflow | Harness foundation |
| **OpenViking** | L0/L1/L2 tiered context, filesystem paradigm, self-evolving memory | Memory architecture |
| **Paperclip** | Heartbeat model, org-chart hierarchy, persistent state | Courtier lifecycle |
| **Claude Code Agent Teams** | Peer-to-peer agent messaging, team lifecycle | Inter-agent communication |
| **Pixel Agents** | Spatial-metaphor visualization, transcript parsing | Interface layer (Phase 3) |
| **Hermes** | Self-improving skill accumulation, dual-store memory | Self-evolving agents (Phase 4) |
| **PromptFoo** | Declarative model evaluation, provider benchmarking | Model selection optimization |
| **Autoresearch** | Keep/discard hill-climbing loop, fixed-budget evaluation | Vizier research orchestration |
| **cmux** | Notification system, workspace metadata, scriptable browser | Terminal UX (Phase 3) |

## Technology Stack (Phase 1)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | Bun + TypeScript | Fast, modern, good Claude Code integration |
| **Agent framework** | Claude Code + PAI | Proven foundation, Kevin's existing setup |
| **Memory storage** | Markdown + YAML files | Human-readable, git-friendly, PAI-compatible |
| **Multi-account** | `CLAUDE_CONFIG_DIR` aliases | Zero-overhead, proven pattern |
| **Data sync** | Git | Auditable, one-directional, familiar |
| **Scheduling** | Cron + Claude Code RemoteTrigger | Simple, available today |
| **Version control** | Git + GitHub | Standard, enables PR-based write-back |
