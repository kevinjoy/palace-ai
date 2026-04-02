# Palace AI — Courtier System

> For visual diagrams of Courtier relationships and the three-layer model, see [@docs/codebase-map.md](codebase-map.md#courtier-relationship-model).

## Design Philosophy

Courtiers are **configurable, facet-based sub-orchestrators** — each managing a domain of the user's life. They are NOT hardcoded roles; the system provides a framework for defining roles, and ships with a default template that users customize.

The court metaphor is intentional: it's fun, memorable, and maps naturally to organizational hierarchy. But beneath the theme, a Courtier is simply a **scoped agent with defined permissions, data access, and operational patterns**.

## The Three-Layer Ownership Model

Every Courtier operates across three layers:

### Layer 1: Organization (Owned)
Each Courtier owns HOW it works — its processes, internal structure, tools, and operational patterns. The Chaplain's approach to weaving thinking with research is different from the Lord of Guild's approach to managing research projects. This organizational knowledge is the Courtier's identity.

- **What's owned:** Workflows, templates, skill configurations, operational preferences
- **Where stored:** Per-Courtier config directory within Palace
- **Who can modify:** The Courtier itself + the Vizier

### Layer 2: Data (Fluid / Shared)
Data flows between Courtiers as needed. The Guild generates research that the Chaplain consumes. The Chancellor's calendar context informs the Herald's daily prep. Data is not siloed by Courtier — it's classified by security tier and accessible based on permissions.

- **What's shared:** Research outputs, thinking notes, project artifacts, observations
- **Where stored:** Palace memory system (tiered), Obsidian, GitHub
- **Access governed by:** Security tier model (see [@docs/security.md](security.md))

### Layer 3: Counsel (Surfaced Upward)
Each Courtier surfaces its best outputs — key findings, recommendations, summaries, completed work — to a shared Counsel Layer that all Courtiers can see and build upon. The Vizier mediates this layer, prioritizing, synthesizing, and directing attention.

- **What's surfaced:** Completed analyses, key decisions, recommendations, status reports
- **Where stored:** Counsel Layer in Palace memory (OpenViking L0/L1 representations)
- **Propagation:** Courtier promotes → Vizier reviews → available to all Courtiers
- **Consumption:** Any Courtier can read the Counsel Layer at L0 (summaries) or request L1/L2 depth

## Courtier Definition Schema

A Courtier is defined by a YAML configuration:

```yaml
# courtiers/chaplain.yaml
courtier:
  name: Chaplain
  display_name: "The Chaplain"
  description: "Weaves personal thinking with research into long-form works"

  # What this Courtier does
  domain:
    primary: "Long-form thinking, personal-research synthesis"
    keywords: ["thinking", "writing", "synthesis", "reflection", "research integration"]

  # Security access
  security:
    tier_access:
      - open_court       # Research, project code
      - inner_chamber    # Personal journals, reflections (NAMED ACCESS)
    write_scope: "own_workspace + counsel_layer"
    audit_level: standard

  # Operational patterns
  operations:
    heartbeat: "daily"          # How often it checks in
    triggers:                    # What activates it beyond heartbeat
      - "new obsidian daily note"
      - "research output from guild"
      - "user request"
    outputs:
      - "draft essays"
      - "thinking summaries"
      - "counsel layer submissions"

  # LLM preferences
  model_preference:
    default: sonnet              # For routine work
    deep_work: opus              # For synthesis and long-form
    quick: haiku                 # For simple queries

  # Account governance
  account_scope: personal        # Which LLM account to use
  can_use_accounts:
    - personal
    # NOT novo — Chaplain doesn't touch work-sensitive data

  # State
  status: active                 # active | dormant | disabled
  activated_in_phase: 2          # When this Courtier comes online
```

## Default Template: Kevin's Court

These are the default Courtiers that ship with Palace. Users can modify, remove, or add to this template during onboarding.

### The Grand Vizier (Finn)
- **Domain:** Master orchestration, task routing, cross-Courtier synthesis
- **Security:** Reads all tiers except Crown Jewels. Mediates Counsel Layer.
- **Account:** All accounts (routes tasks to appropriate account)
- **Model:** Opus for strategic decisions, Sonnet for routine coordination
- **Always active.** The Vizier is the only Courtier that runs in every phase.

### Chancellor
- **Domain:** Calendar management, communications, interpersonal (friends/family/work)
- **Security:** Inner Chamber (personal relationships) + Guarded (work scheduling)
- **Account:** Personal (default), Novo (for work scheduling)
- **Triggers:** Calendar events, incoming communications, scheduling requests
- **Phase 1:** Dormant (activated Phase 2)

### Herald / Chamberlain
- **Domain:** Fingertip thread management, reporting, daily prep/abstracts, task coordination
- **Security:** Open Court + Counsel Layer (reads all Courtier outputs for daily briefs)
- **Account:** Personal
- **Triggers:** Morning cron (daily brief), new Counsel Layer submissions, user requests
- **Note:** Absorbs the Sunsama gap — daily task coordination and ADHD-friendly preparation
- **Phase 1:** Active (early activation for daily prep value)

### Master at Arms
- **Domain:** System security, network defense, agent behavior monitoring
- **Security:** Open Court + monitors all tiers for anomalies (read-only audit)
- **Account:** Personal
- **Triggers:** Anomaly detection, security events, scheduled security audits
- **Phase 1:** Dormant (activated Phase 2 with NUC integration)

### Lord of Guild
- **Domain:** Research projects, sub-guildmaster coordination
- **Security:** Open Court + Guarded (for work-related research)
- **Account:** Personal + Novo (research may span both)
- **Triggers:** Research requests, project milestones, new information discovery
- **Sub-agents:** Can spawn sub-guildmasters for specific research threads
- **Phase 1:** Active (research is a core value from day one)

### Fool / Librarian
- **Domain:** Entertainment consumption, content discovery, interesting-things-finding
- **Security:** Open Court only
- **Account:** Personal
- **Triggers:** Scheduled exploration, user requests, content recommendations
- **Phase 1:** Dormant (nice-to-have, not critical path)

### Chaplain
- **Domain:** Long-form thinking, weaving personal lines of thought with research
- **Security:** Inner Chamber + Open Court (reads personal reflections AND research)
- **Account:** Personal
- **Triggers:** New daily notes, research outputs from Guild, user requests for synthesis
- **Phase 1:** Active (high value — helps Kevin develop thinking into works)

### Ambassadors
- **Domain:** Public life management, applications, gigs, grants, compliance
- **Security:** Open Court + Diplomatic Pouch (external-facing)
- **Account:** Personal (default), may use Novo for work applications
- **Triggers:** Application deadlines, public commitments, compliance requirements
- **Phase 1:** Dormant (activated when external-facing needs arise)

### Dungeon Master
- **Domain:** TBD — reserved for future definition
- **Status:** Disabled (not just dormant — this is a placeholder for Kevin to define)

## User Customization

### Adding a Custom Courtier

Users create a YAML file in their Palace config:

```yaml
# courtiers/custom/my-fitness-coach.yaml
courtier:
  name: FitnessCoach
  display_name: "The Squire"  # Court-themed name (optional)
  description: "Tracks workouts, nutrition, and health goals"

  domain:
    primary: "Health and fitness management"
    keywords: ["fitness", "nutrition", "workout", "health"]

  security:
    tier_access:
      - inner_chamber    # Health data is personal
      - open_court       # Fitness research
    write_scope: own_workspace + counsel_layer

  operations:
    heartbeat: daily
    triggers:
      - "morning routine"
      - "workout completion"
    outputs:
      - "workout plans"
      - "nutrition summaries"
      - "health counsel submissions"

  model_preference:
    default: haiku        # Simple tracking
    analysis: sonnet      # Trend analysis

  account_scope: personal
  status: active
  activated_in_phase: 1
```

### Courtier Templates

Palace ships with template categories that suggest roles based on life domains:

| Category | Suggested Roles | Court Names |
|----------|----------------|-------------|
| **Professional** | Project Manager, Code Reviewer, Meeting Prep | Steward, Scribe, Page |
| **Creative** | Writer's Assistant, Music Curator, Art Director | Bard, Minstrel, Artisan |
| **Academic** | Research Assistant, Study Coach, Citation Manager | Scholar, Tutor, Archivist |
| **Health** | Fitness Tracker, Meal Planner, Mental Health | Squire, Cook, Healer |
| **Financial** | Budget Tracker, Investment Monitor, Tax Prep | Treasurer, Banker, Exchequer |
| **Social** | Event Planner, Relationship Manager, Gift Tracker | Seneschal, Herald, Cupbearer |

Users can mix templates, rename roles, and define entirely custom Courtiers. The court-themed naming is optional — if a user prefers "Fitness Coach" over "Squire," that works.

## Courtier Lifecycle

```
DISABLED → DORMANT → ACTIVATING → ACTIVE → SUSPENDED → ACTIVE
                                      ↓
                                  DEACTIVATED → DORMANT
```

- **Disabled:** Not configured. Placeholder only.
- **Dormant:** Configured but not running. Waiting for its phase to begin.
- **Activating:** Starting up — loading config, connecting to memory, registering with Vizier.
- **Active:** Running. Responds to heartbeats and triggers.
- **Suspended:** Temporarily paused (user-initiated or resource-constrained).
- **Deactivated:** Shut down gracefully. Can be returned to dormant.

## Communication Patterns

### Courtier → Vizier
- **Status reports:** Heartbeat responses summarizing current work
- **Counsel submissions:** Promoted outputs for the shared layer
- **Escalations:** Problems or decisions requiring Principal (Kevin) input
- **Resource requests:** Needs more tokens, needs access to a data source

### Vizier → Courtier
- **Task assignments:** Direct work requests with context
- **Priority shifts:** Reordering work based on Kevin's current focus
- **Context injections:** Relevant Counsel Layer updates from other Courtiers
- **Directives:** Strategic direction changes

### Courtier → Courtier (via Counsel Layer)
- Courtiers don't message each other directly
- They surface outputs to the Counsel Layer
- Other Courtiers consume from the Counsel Layer at their next heartbeat
- The Vizier can expedite by flagging urgent counsel items

## Phase 1 Activation Plan

| Courtier | Phase 1 Status | Rationale |
|----------|---------------|-----------|
| Vizier (Finn) | **Active** | Core orchestrator — must be first |
| Herald/Chamberlain | **Active** | Daily prep value + Sunsama replacement |
| Lord of Guild | **Active** | Research is a core use case |
| Chaplain | **Active** | High-value personal thinking support |
| Chancellor | Dormant | Calendar/comms integration more complex |
| Master at Arms | Dormant | Security monitoring needs NUC |
| Fool/Librarian | Dormant | Entertainment is nice-to-have |
| Ambassadors | Dormant | External-facing is later |
| Dungeon Master | Disabled | Undefined |
