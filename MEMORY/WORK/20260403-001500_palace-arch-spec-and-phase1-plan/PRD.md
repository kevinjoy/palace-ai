---
task: Produce Palace AI architectural spec and Phase 1 plan
slug: 20260403-001500_palace-arch-spec-and-phase1-plan
effort: comprehensive
phase: complete
progress: 44/48
mode: interactive
started: 2026-04-03T00:15:00Z
updated: 2026-04-03T00:45:00Z
---

## Context

Produce the full architectural spec suite for Palace AI, informed by deep research into 12+ reference projects. This is the "constitution" that future Claude Code sessions will use to build Palace.

Kevin expanded the research scope significantly and wants Codex & Gemini used liberally for research, counsel, and validation.

**Deliverables:**
1. Research report (`docs/research-report.md`) — indexed, summarized per project
2. `CLAUDE.md` — operational hub with @refs and key decisions
3. `docs/architecture.md` — full system architecture spec
4. `docs/security.md` — 6-tier model with extensive research backing
5. `docs/courtiers.md` — configurable role system
6. `docs/token-routing.md` — multi-account management
7. `docs/codebase-map.md` — Mermaid diagrams (single source of truth)
8. `docs/decisions.md` — timestamped decision log
9. `docs/phase1-plan.md` — implementation plan
10. `docs/testing-strategy.md` — phased testing approach
11. `references/` directory — cloned repos (gitignored)

**Key adjustments from Kevin's feedback:**
- Mermaid maps: single source in Doc 6, referenced everywhere else
- Security: extensive research into classic + AI-specific security patterns
- Courtiers: configurable/user-definable, not hardcoded to Kevin's setup
- Testing: strategy doc drafted alongside spec
- Research: 12+ projects studied, written up with index

### Risks
- Research scope is large — must parallelize aggressively
- Some repos may not exist or be private
- Comprehensive effort: manage time budget carefully

## Criteria

Research:
- [ ] ISC-1: Claw-code repo analyzed for CC-like software patterns
- [ ] ISC-2: PAI hooks and status view extension patterns documented
- [ ] ISC-3: Openclaw/Nanoclaw heartbeat and cron patterns extracted
- [ ] ISC-4: Hermes self-improvement mechanisms documented
- [ ] ISC-5: OpenViking L0/L1/L2 patterns applied to Palace memory
- [ ] ISC-6: PromptFoo model evaluation patterns for Palace routing
- [ ] ISC-7: Paperclip org coordination and Agents Agency integration documented
- [ ] ISC-8: Autoresearch patterns for Vizier/Guild operations assessed
- [ ] ISC-9: cmux terminal UX for agents documented
- [ ] ISC-10: aisw and KMJ gist account-switching patterns extracted
- [ ] ISC-11: Pixel Agents UX patterns for Palace documented
- [ ] ISC-12: TurboQuant algorithm applicability assessed
- [ ] ISC-13: Pretext text rendering UX implications assessed
- [ ] ISC-14: Research report written with index and per-section summaries

Spec Documents:
- [ ] ISC-15: CLAUDE.md hub created with principles and @refs
- [ ] ISC-16: CLAUDE.md contains key decisions table
- [ ] ISC-17: CLAUDE.md references Doc 6 for Mermaid maps
- [ ] ISC-18: architecture.md covers system overview with Mermaid refs
- [ ] ISC-19: architecture.md covers machine topology and data flow
- [ ] ISC-20: architecture.md covers Vizier and Courtier lifecycle
- [ ] ISC-21: architecture.md covers heartbeat model informed by research
- [ ] ISC-22: architecture.md covers OpenViking-inspired memory architecture
- [ ] ISC-23: architecture.md covers inter-agent communication
- [ ] ISC-24: architecture.md covers multi-account routing
- [ ] ISC-25: architecture.md covers phased evolution roadmap
- [ ] ISC-26: security.md covers 6-tier model with enforcement rules
- [ ] ISC-27: security.md covers threat models with mitigations
- [ ] ISC-28: security.md informed by classic and AI-specific security research
- [ ] ISC-29: security.md covers onboarding data classification flow
- [ ] ISC-30: courtiers.md defines configurable role system
- [ ] ISC-31: courtiers.md documents three-layer ownership model
- [ ] ISC-32: courtiers.md allows user-defined roles with templates
- [ ] ISC-33: courtiers.md includes Kevin's default roles as examples
- [ ] ISC-34: token-routing.md covers throughput formula
- [ ] ISC-35: token-routing.md covers multi-account architecture
- [ ] ISC-36: token-routing.md covers model selection strategy
- [ ] ISC-37: token-routing.md covers directional governance
- [ ] ISC-38: codebase-map.md contains system overview diagram
- [ ] ISC-39: codebase-map.md contains data flow diagram
- [ ] ISC-40: codebase-map.md contains security tier diagram
- [ ] ISC-41: codebase-map.md contains courtier relationship diagram
- [ ] ISC-42: decisions.md contains all interview decisions with dates
- [ ] ISC-43: phase1-plan.md defines MBP-only scope with tasks
- [ ] ISC-44: phase1-plan.md defines NUC parallel workstream
- [ ] ISC-45: phase1-plan.md defines success criteria
- [ ] ISC-46: testing-strategy.md covers phased testing approach
- [ ] ISC-47: testing-strategy.md covers model evaluation testing
- [ ] ISC-48: references/ directory set up with gitignored cloned repos

Anti-criteria:
- [ ] ISC-A-1: Anti: Mermaid diagrams not duplicated across docs
- [ ] ISC-A-2: Anti: No implementation code in this session
- [ ] ISC-A-3: Anti: Courtier definitions not hardcoded to Kevin-only

## Decisions

- 2026-04-03 00:45: Upgraded effort to comprehensive — research scope expanded to 12+ projects
- 2026-04-03 00:45: Will clone reference repos to references/ (gitignored) for direct source access
- 2026-04-03 00:45: Mermaid maps single-sourced in docs/codebase-map.md, referenced elsewhere
- 2026-04-03 00:45: Courtiers designed as configurable system, Kevin's roles as default template
- 2026-04-03 00:45: Testing strategy doc added to deliverables
