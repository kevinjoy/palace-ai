# Palace AI — Pre-Proposal Discussion (In Progress)

## Context

Palace AI is Kevin's personal agentic infrastructure project. The goal is a court-metaphor orchestration system where a Grand Vizier (Finn) manages facet-based Courtiers across Kevin's life domains — personal, work (Novo), research, learning, and creative output. This conversation serves as the foundational spec document for `/init`.

The prior session (Apr 2, 28 messages) established the phased approach and machine topology. The current session (Apr 2-3) resumed the interview to close open questions.

**Source artifacts:** `Directory structure for Agentic work.md` (Excalidraw export) and `Directory structure for Agentic work.png` (visual) are in the repo root.

## What's Been Decided

### Infrastructure Topology
- **MBP (M1 Max, 64GB)** — Daily driver, primary interaction point, where Palace app builds first
- **NUC (Ubuntu, 32GB)** — Agent sandbox, to be wiped and fresh-installed in parallel with Palace dev (for Hermes/Openclaw familiarization)
- **NAS (TrueNAS, 64GB, 1080 GPU)** — Storage + services (Immich, Ollama, n8n, uptime kuma)
- **Dell XPS** — Dormant, available for future Novo-specific work
- **Network:** Flat Tailscale mesh. Phase 1 uses filesystem-level enforcement (copy-in model). Tailscale ACLs deferred to Phase 2 as defense-in-depth.

### Palace is an App, Not an OS
- **Palace = app layer** (Vizier, Courtiers, memory, model routing, dashboard) — this is what we build
- **Palace = installer/configurator** — setup flow discovers environment, configures infrastructure primitives automatically
- Security tiers configured once during onboarding, then invisible to user
- Users interact with Finn (Vizier), not with ACLs or network configs
- Must feel like an app experience, not sysadmin work

### Data Flow
- **Obsidian vault** — Phase 1: Git-based sync from MBP to NUC (periodic pull, read-only copies). Phase 2: Courtiers with Inner Chamber access propose writes via PR/review queue. Phase 3: Real-time collaborative editing with trusted Courtiers.
- **Obsidian evolution** — Currently underused (daily notes only, outdated template). Will become bidirectional exchange surface: workpad for Chaplain (thinking), Vizier (observations → backlogs), Chamberlain (daily prep). Kevin pays for Obsidian Sync currently.
- **Vault write-back** — Role-dependent: Vizier and Inner Chamber Courtiers propose writes for review; all others read-only via copies
- **GitHub repos** — Direct access for agents
- **NAS storage** — Direct access over Tailscale
- **Work/Novo data** — Governed by 6-tier security model (see below)

### Court Structure
- **Scaffold all Courtier roles upfront** (even if some start dormant):
  - Chancellor (calendar, comms, interpersonal management)
  - Herald/Chamberlain (Fingertip threads, reporting, daily prep/abstracts, task coordination — absorbs Sunsama gap)
  - Master at Arms (system security & defense)
  - Lord of Guild (research projects, sub-guildmasters)
  - Fool/Librarian (entertainment, content discovery)
  - Chaplain (long-form thinking, weaving personal lines of thought with research)
  - Ambassadors (public life, applications, compliance)
  - Dungeon Master (TBD)

### Courtier Ownership Model (Three Layers)
1. **Organization layer** (owned by each Courtier) — how they do their work, their processes, internal structure
2. **Data layer** (fluid/shared) — research, thinking, resources flow between Courtiers as needed. Example: Guild generates research, Chaplain consumes it alongside Kevin's thinking
3. **Counsel layer** (surfaced upward) — best outputs from each Courtier promoted to a shared view all Courtiers can see and build on, with the Vizier mediating

### 6-Tier Security Model

| Tier | Court Name | What Lives Here | Who Sees It |
|------|-----------|-----------------|-------------|
| 1 | **Crown Jewels** | Identity, keys, crypto, passwords | **Nobody** — not even Vizier |
| 2 | **Inner Chamber** | Personal intimate content — journals, health, deeply personal thinking | **Vizier + named Courtiers only** (Chaplain, Chancellor) |
| 3 | **Guarded** | Work-sensitive, client data, org-specific protected material | **Org-scoped agents only** (Novo account agents + Vizier) |
| 4 | **Open Court** | Research, project code, general thinking, non-sensitive docs | **All trusted agents** |
| 5 | **Sandlot** | Sandbox-owned workspace | **Sandbox agents** (free reign within) |
| 6 | **Diplomatic Pouch** | Content shared with external collaborators, teams, their agents | **Governed by collaboration agreements** |

**Key principles:**
- Classification by data type, not by location
- Copy-in, PR-out: sandbox agents get read-only copies, never write directly to sources
- Crown Jewels are air-gapped from all agents — no path exists
- Free outbound network for sandbox (NUC is their oyster), but no inbound tunnel to sensitive zones
- Audit everything in the Guarded tier
- Scalable to other users: onboarding flow explores what they have, suggests tier model. Framework is data classification; labels are thematic.

**Threat models addressed:**
1. Accidental exfiltration: agent reads sensitive data and outputs it to insecure space
2. Active compromise: agent is compromised via prompt injection/malicious dependency and exfiltrates or plants persistence

### Token Management
- **Primary optimization:** Maximize total work throughput, measured as `(task count) × (task size) × (project importance)`
- **Right model for the problem** — cost optimization is a trap; cheap inference on hard problems = rework loops. Choose the best model for each task.
- **Governance is directional** — Novo models must touch sensitive Novo data, but personal capacity can support non-sensitive Novo work. The wall only faces one direction.
- **Flexibility serves throughput** — use available capacity where it makes sense, don't let accounts sit idle
- **Cost is least important** — budget efficiency is last priority after throughput, quality, and governance

### Always-On Requirements
- **Primary need:** Proactive autonomous work (agents doing things while Kevin is away)
- **Secondary need:** State recovery and crash resilience (interdependent components must handle unavailability)
- Cloud fallback when local machines are down

### Memory Model
- Full scope: task state + decisions + learned patterns + personal context + relationships between ideas
- Tiered by court rank (higher roles read/merge across levels)
- Database-driven + human-readable records
- **Reference architecture:** OpenViking's filesystem paradigm with tiered context loading (L0/L1/L2) is a strong candidate for the context/memory layer. Paperclip's PostgreSQL-based persistent state for agent heartbeats is relevant for always-on Courtier patterns.

### Phase 1 Scope
- **MBP only** — Build Palace app layer: Vizier + initial Courtiers running as Claude Code agents, memory system, multi-account model routing
- **NUC in parallel** — Wipe, fresh Ubuntu install, install Hermes & Openclaw for familiarization. NOT integrated with Palace yet.
- **No network config** — Filesystem enforcement via copy-in model is sufficient
- **Deliverable:** Working Vizier on MBP that can route tasks, manage multiple Claude accounts, and interact with Kevin

## Resolved Questions

1. **Token management priority** → Maximize throughput; right model for problem; directional governance; cost last
3. **Courtier scope boundaries** → Own organization, fluid data, counsel layer for cross-pollination
4. **Network segmentation** → Deferred. Filesystem enforcement (copy-in) for Phase 1. Tailscale ACLs in Phase 2.
8. **Sandbox security model** → 6-tier model (Crown Jewels / Inner Chamber / Guarded / Open Court / Sandlot / Diplomatic Pouch). Free outbound for sandbox. Air-gap Crown Jewels.
9. **Multi-account routing** → Directional governance (Novo models for sensitive Novo data, personal can help with non-sensitive). Maximize throughput across all available capacity.
10. **NUC-to-MBP data flow** → Git-based sync (read-only copies), building toward efficient read-write in later phases

## Open Questions (Deferred to Later Phases)

2. **Tiered database architecture** — Technology choices (Postgres? SQLite? OpenViking?), write permission logic, merge/propagation patterns. OpenViking's L0/L1/L2 model and Paperclip's Postgres heartbeat pattern are leading references. → **Phase 2 deep dive**
5. **Cloud fallback specifics** — Which cloud provider, what triggers failover → **Phase 2**
6. **Dashboard/messaging interface** — How Kevin interacts day-to-day. Obsidian evolution feeds into this. → **Phase 2-3**
7. **Ganglionic center** — Distributed insight commons → **Long horizon, Phase 4+**
10. **"Self-improving" agents** — What this means concretely → **Phase 2 after database architecture is settled**

## Courtier Scope Details (To Be Refined)

Each Courtier's specific data ownership, read permissions, and security tier access needs to be mapped in the architectural spec. The three-layer model (organization/data/counsel) provides the framework; the specifics per role are a Phase 1 design task.

## Reference Projects

| Project | Relevance | Pattern |
|---------|-----------|---------|
| [OpenViking](https://github.com/volcengine/OpenViking) | Context/memory layer | Filesystem paradigm, L0/L1/L2 tiered loading, self-evolving memory |
| [Paperclip](https://github.com/paperclipai/paperclip) | Agent orchestration | PostgreSQL persistent state, agent heartbeats, org-chart model |
| [cmux](https://github.com/manaflow-ai/cmux) | Terminal/TUI layer | Ghostty-based, vertical tabs, agent notifications, scriptable browser |
| [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure) | Current harness foundation | Feedback loops, modular architecture, human activation focus |

## What Happens Next

1. ~~Continue the interview to close the open questions~~ → **Tier 1-3 questions resolved (Apr 2-3)**
2. Produce full architectural spec document → **Next session**
3. Produce directory structure for `/init` → **Next session**
4. Phase 1 implementation plan → **Next session, informed by this doc**
