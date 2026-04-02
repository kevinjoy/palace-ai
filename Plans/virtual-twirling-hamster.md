# Palace AI — Pre-Proposal Discussion (In Progress)

## Context

Palace AI is Kevin's personal agentic infrastructure project. The goal is a court-metaphor orchestration system where a Grand Vizier (Finn) manages facet-based Courtiers across Kevin's life domains — personal, work (Novo), research, learning, and creative output. This conversation serves as the foundational spec document for `/init`.

The prior session (Apr 2, 28 messages) established the phased approach and machine topology. This session is continuing the interview to fill remaining gaps before producing a full architectural spec.

## What's Been Decided

### Infrastructure Topology
- **MBP (M1 Max, 64GB)** — Daily driver, primary interaction point
- **NUC (Ubuntu, 32GB)** — Agent sandbox, to be wiped and fresh-installed
- **NAS (TrueNAS, 64GB, 1080 GPU)** — Storage + services (Immich, Ollama, n8n, uptime kuma)
- **Dell XPS** — Dormant, available for future Novo-specific work
- **Network:** Flat Tailscale mesh, no segmentation yet

### Data Flow
- **Obsidian vault** — Git-based sync from MBP to NUC (periodic pull, not real-time)
- **Vault write-back** — Role-dependent: Vizier writes directly, lower Courtiers propose via PR
- **GitHub repos** — Direct access for agents
- **NAS storage** — Direct access over Tailscale
- **Work/Novo data** — Human-vetted dispatch only (for now)

### Court Structure
- **Scaffold all Courtier roles upfront** (even if some start dormant):
  - Chancellor (calendar, comms, interpersonal management)
  - Herald/Chamberlain (Fingertip threads, reporting)
  - Master at Arms (security & defense)
  - Lord of Guild (research projects, sub-guildmasters)
  - Fool/Librarian (entertainment, content discovery)
  - Chaplain (long-form thinking, weaving personal lines of thought with research)
  - Ambassadors (public life, applications, compliance)
  - Dungeon Master (TBD)

### Always-On Requirements
- **Primary need:** Proactive autonomous work (agents doing things while Kevin is away)
- **Secondary need:** State recovery and crash resilience (interdependent components must handle unavailability)
- Cloud fallback when local machines are down

### Memory Model
- Full scope: task state + decisions + learned patterns + personal context + relationships between ideas
- Tiered by court rank (higher roles read/merge across levels)
- Database-driven + human-readable records

### Token Management (all three, prioritized)
- **Priority TBD** — three constraints to rank:
  1. Don't exceed subscription limits (hard caps)
  2. Cost optimization (cheapest capable model per task)
  3. Work/personal separation (governance)

## Open Questions (Still Being Discussed)

1. **Token management priority ranking** — Which of the three constraints comes first?
2. **Tiered database architecture** — Specific technology choices (SQLite? Postgres? Vector DB?), write permission logic, merge/propagation patterns
3. **Courtier scope boundaries** — What each Courtier actually owns vs. shares
4. **Network segmentation** — Moving from flat Tailscale to role-based ACLs
5. **Cloud fallback specifics** — Which cloud provider, what triggers failover
6. **Dashboard/messaging interface** — How Kevin interacts with the system day-to-day
7. **Ganglionic center** — Distributed insight commons (longer horizon, but architectural implications for now)
8. **Sandbox security model** — Firewall-within-firewall for Openclaw/Hermes
9. **Multi-account routing** — How the abstraction layer between personal/Novo accounts actually works
10. **"Self-improving" agents** — What this means concretely (fine-tuning? skill accumulation? behavior adaptation?)

## What Happens Next

Continue the interview to close the open questions above, then produce:
1. Full architectural spec document
2. Directory structure for `/init`
3. Phase 1 implementation plan (infrastructure + data flow setup)
