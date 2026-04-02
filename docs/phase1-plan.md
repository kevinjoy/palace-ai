# Palace AI — Phase 1 Implementation Plan

## Scope

**Phase 1 = MBP only.** Build the Palace harness layer: Vizier, initial Courtiers, memory system, multi-account routing. The NUC is prepped in parallel but NOT integrated with Palace until Phase 2.

**Success criteria:** Kevin can ask Finn (the Vizier) to route tasks, and Finn correctly delegates to the right Courtier, model, and account — with results flowing back through the Counsel Layer.

## Prerequisites

- [ ] Multi-account setup: `~/.claude-novo/` configured with Novo auth
- [ ] Obsidian vault accessible to Palace (git-initialized if not already)
- [ ] GitHub repos accessible to Palace agents
- [ ] NUC wiped and Ubuntu fresh-installed (parallel workstream)

## Implementation Sequence

### Step 1: Project Scaffold
**Estimated effort:** 1-2 sessions

- Initialize the Palace project structure:
  ```
  palace-ai/
  ├── src/
  │   ├── vizier/          # Vizier orchestration
  │   ├── courtiers/       # Courtier framework
  │   ├── memory/          # Memory system
  │   ├── routing/         # Token routing
  │   └── security/        # Tier enforcement
  ├── config/
  │   ├── courtiers/       # Courtier YAML definitions
  │   ├── security/        # Security tier config
  │   └── palace.yaml      # Main config
  ├── docs/                # Spec documents (existing)
  ├── tests/               # Test suite
  ├── references/          # Cloned reference repos (gitignored)
  └── CLAUDE.md            # Project constitution
  ```
- Set up Bun + TypeScript
- Configure Vitest for testing
- Create project-level CLAUDE.md with operational principles
- Set up basic CI (GitHub Actions)

### Step 2: Security Tier Engine
**Estimated effort:** 2-3 sessions

- Implement data classification schema parser (`palace.security.yaml`)
- Build tier enforcement: given a Courtier's config, determine what it can access
- Unit tests for every tier boundary (Layer 1)
- Integration tests for cross-tier access denial (Layer 2)

**TDD sequence:**
1. Test: Courtier at Open Court cannot read Inner Chamber → FAIL
2. Implement tier checking logic → PASS
3. Test: Vizier can read Inner Chamber → FAIL
4. Implement named-access exceptions → PASS
5. Test: No agent can read Crown Jewels → FAIL
6. Implement air-gap enforcement → PASS

### Step 3: Courtier Framework
**Estimated effort:** 3-4 sessions

- Implement Courtier config parser (YAML schema)
- Build Courtier lifecycle state machine (disabled → dormant → active → suspended)
- Implement Courtier registration with Vizier
- Create the 4 Phase 1 Courtier configs:
  - Herald/Chamberlain (daily prep, task coordination)
  - Lord of Guild (research orchestration)
  - Chaplain (thinking synthesis)
  - (Vizier is always active, not a "Courtier" per se)
- Unit tests for config parsing, lifecycle transitions
- Integration tests for Vizier ↔ Courtier registration

### Step 4: Memory System (Basic)
**Estimated effort:** 3-4 sessions

- Implement file-based memory with L0/L1/L2 tiering
- Build Palace URI scheme (`palace://court/{courtier}/{path}`)
- Implement Counsel Layer: Courtiers submit outputs, Vizier promotes/mediates
- Implement memory scoping: assemble context for a Courtier filtered by tier access
- L0 summary generation (auto-summarize on write)
- Unit tests for URI parsing, tier decomposition, memory scoping
- Integration tests for Counsel Layer submission flow

### Step 5: Token Routing
**Estimated effort:** 2-3 sessions

- Implement task analysis: complexity assessment, sensitivity check, project importance
- Build routing decision engine: task → (model, account, courtier)
- Implement `CLAUDE_CONFIG_DIR` switching for multi-account execution
- Build budget tracking (per-account token usage)
- Unit tests for routing logic
- Agent behavior tests (Layer 3) for routing accuracy

### Step 6: Vizier Orchestration
**Estimated effort:** 4-5 sessions

- Implement task reception: Kevin → Vizier (via chat, Obsidian note, or trigger)
- Build task decomposition: break complex requests into Courtier-sized tasks
- Implement Courtier dispatch: Vizier → appropriate Courtier(s) via Agent Teams
- Build result aggregation: Courtier outputs → Counsel Layer → Kevin
- Implement basic heartbeat: cron-triggered check-in for active Courtiers
- End-to-end test: full task lifecycle (receive → route → delegate → collect → report)

### Step 7: Obsidian Integration (Read-Only)
**Estimated effort:** 1-2 sessions

- Set up git-based sync for Obsidian vault (or read directly from vault path on MBP)
- Implement daily note watcher: new notes trigger Chaplain/Vizier
- Parse Obsidian markdown into Palace memory format
- Test: new daily note → Chaplain receives → processes → submits to Counsel

### Step 8: Integration & Polish
**Estimated effort:** 2-3 sessions

- Full end-to-end testing (Phase 1 scenarios from testing-strategy.md)
- Security smoke tests (Layer 5 basics)
- Agent behavior evaluation (Layer 3)
- Documentation update (CLAUDE.md, codebase-map.md with actual code paths)
- Performance baseline: how long do typical workflows take?

## Parallel Workstream: NUC Preparation

Independent of Palace development:

1. **Wipe NUC** — Fresh Ubuntu install (latest LTS)
2. **Install basics** — Tailscale, git, Docker, Bun
3. **Install Openclaw** — Follow setup guide, get running
4. **Install Hermes** — Follow setup guide, get running
5. **Familiarize** — Run both, understand their patterns, document observations
6. **Evaluate:** What nuances exist for extending Palace to the NUC?

This workstream helps Kevin build intuition about sandbox agent behavior before Palace integrates with the NUC in Phase 2.

## Phase 1 Exit Criteria

- [ ] Vizier can receive a task and route it to the correct Courtier, model, and account
- [ ] At least 3 Courtiers operational: Herald (daily prep), Guild (research), Chaplain (thinking)
- [ ] Multi-account routing works: Novo tasks go to Novo account, personal to personal
- [ ] Memory system stores and retrieves at L0/L1/L2 with correct tier scoping
- [ ] Security tier enforcement prevents cross-tier data access
- [ ] Counsel Layer aggregates Courtier outputs for cross-domain visibility
- [ ] Obsidian daily notes trigger Courtier activity
- [ ] All Layer 1 + Layer 2 tests pass
- [ ] Layer 5 security smoke tests pass
- [ ] NUC is prepped with Openclaw + Hermes running (parallel workstream)

## Estimated Total: 18-26 sessions

This is a guideline, not a commitment. The TDD approach means each step is validated before moving to the next, and scope can adjust based on what we learn.
