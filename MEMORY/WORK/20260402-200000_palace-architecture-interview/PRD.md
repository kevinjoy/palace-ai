---
task: Resume Palace AI architectural interview and close gaps
slug: 20260402-200000_palace-architecture-interview
effort: extended
phase: complete
progress: 18/18
mode: interactive
started: 2026-04-02T20:00:00Z
updated: 2026-04-02T20:01:00Z
---

## Context

Palace AI is Kevin's personal agentic infrastructure project using a "Court" organizational metaphor. A prior conversation (Apr 2, Messages 1-28) established the phased approach, machine topology, and court structure but was interrupted mid-interview with 10 open questions unresolved.

This session resumes the interview to close the open questions, prioritized by dependency graph (FirstPrinciples analysis):
- **Tier 1 (root decisions):** Token management priority ranking, Courtier scope boundaries
- **Tier 2 (unlocked by Tier 1):** Multi-account routing, Sandbox security model
- **Tier 3:** Network segmentation
- **Tier 4 (own sessions):** Tiered database architecture, Cloud fallback
- **Tier 5 (defer):** Dashboard/messaging, Self-improving agents, Ganglionic center

Source artifacts now in repo: Excalidraw .md and .png files. Recovered conversation and plan doc also present.

**Not requested:** Implementation, coding, or scaffolding — this is spec/interview phase only.

### Risks
- Kevin may not have answers to all 10 questions yet — some may need to stay pinned
- Interview could expand scope if new questions surface
- Courtier boundaries may be fuzzy by nature (facets overlap in real life)

## Criteria

- [x] ISC-1: Token management priority ranking decided by Kevin
- [x] ISC-2: Token priority rationale captured in plan doc
- [x] ISC-3: Each Courtier role has defined scope boundaries
- [x] ISC-4: Courtier shared-vs-owned resources explicitly listed
- [x] ISC-5: Multi-account routing model described with concrete flow
- [x] ISC-6: Work/personal account separation rules documented
- [x] ISC-7: Sandbox security model defines trust tiers
- [x] ISC-8: Sandbox data exposure rules specified per tier
- [x] ISC-9: Network segmentation approach selected for Tailscale
- [x] ISC-10: NUC-to-MBP data flow mechanism chosen
- [x] ISC-11: Questions 2,5,6,7,10 explicitly deferred with rationale
- [x] ISC-12: Plan doc updated with all new decisions
- [x] ISC-13: Excalidraw source files referenced in plan doc
- [x] ISC-14: Interview questions presented in dependency order
- [x] ISC-15: Kevin's answers captured verbatim where critical
- [x] ISC-16: Phase 1 scope boundaries clearly defined
- [x] ISC-A-1: Anti: No architectural decisions made without Kevin's input
- [x] ISC-A-2: Anti: No implementation or code produced in this session
