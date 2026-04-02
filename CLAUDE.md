# Palace AI

Personal agentic infrastructure using a court organizational metaphor. A Grand Vizier (Finn) orchestrates facet-based Courtiers across life domains — personal, work (Novo), research, learning, and creative output.

## Operational Principles

1. **Palace is an app, not an OS.** Users interact with Finn, not with Tailscale ACLs. Infrastructure is invisible.
2. **Maximize throughput, not minimize cost.** Right model for the problem. `throughput = Σ(tasks × size × importance)`.
3. **Directional governance.** Novo models for sensitive Novo data. Personal can help everywhere else. The wall faces one direction.
4. **Security through classification, not location.** Data is sensitive because of WHAT it contains, not WHERE it lives. 6-tier model.
5. **Courtiers own organization, share data.** Three layers: Organization (owned), Data (fluid), Counsel (surfaced).
6. **Copy-in, PR-out.** Agents get read-only copies. Write-back only through review/PR process.
7. **File-based first, database later.** Human-readable markdown and YAML in Phase 1. Database backing in Phase 2.
8. **Test at every boundary.** TDD for structural code. PromptFoo evaluation for agent behavior. Red team for security.

## Architecture References

See these docs for detailed specs (all in `docs/`):

| Document | Purpose |
|----------|---------|
| @docs/architecture.md | Full system architecture — layers, topology, data flow |
| @docs/security.md | 6-tier security model — Crown Jewels through Diplomatic Pouch |
| @docs/courtiers.md | Courtier system — configurable roles, three-layer ownership |
| @docs/token-routing.md | Multi-account management — routing, model selection, budgets |
| @docs/codebase-map.md | **All Mermaid diagrams live here** — single source of truth |
| @docs/decisions.md | Timestamped decision log |
| @docs/phase1-plan.md | Phase 1 implementation plan with tasks |
| @docs/testing-strategy.md | Phased testing approach — 6 layers |
| @docs/research-report.md | Reference project research with findings |

## System Overview

See @docs/codebase-map.md for the full diagram. Summary:

```
Kevin (Principal)
  └─ Grand Vizier (Finn) — orchestrates everything
       ├─ Herald/Chamberlain — daily prep, task coordination
       ├─ Lord of Guild — research projects
       ├─ Chaplain — long-form thinking synthesis
       ├─ Chancellor — calendar, comms (Phase 2)
       ├─ Master at Arms — security (Phase 2)
       ├─ Fool/Librarian — entertainment (Phase 2)
       ├─ Ambassadors — public life (Phase 3)
       └─ Dungeon Master — TBD
```

## Key Decisions

| # | Decision | Date |
|---|----------|------|
| D-001 | Token priority: maximize throughput > governance > cost | 2026-04-02 |
| D-002 | Multi-account: directional governance, Novo for sensitive only | 2026-04-02 |
| D-003 | Data sync: git-based → PR-based → real-time (phased) | 2026-04-02 |
| D-004 | Security: 6-tier model (Crown Jewels → Diplomatic Pouch) | 2026-04-02 |
| D-005 | Phase 1 security: filesystem enforcement only | 2026-04-02 |
| D-006 | Palace is an app, not an OS | 2026-04-02 |
| D-007 | Phase 1: MBP-only + parallel NUC prep | 2026-04-02 |
| D-008 | Spec suite: domain-organized multi-file | 2026-04-03 |
| D-009 | Mermaid maps: single source in codebase-map.md | 2026-04-03 |
| D-010 | Courtiers: configurable/user-definable, not hardcoded | 2026-04-03 |

Full decision log: @docs/decisions.md

## Technology Stack (Phase 1)

- **Runtime:** Bun + TypeScript
- **Agent framework:** Claude Code + PAI patterns
- **Memory:** Markdown + YAML files (file-based)
- **Multi-account:** `CLAUDE_CONFIG_DIR` aliases
- **Data sync:** Git
- **Scheduling:** Cron + RemoteTrigger
- **Testing:** Vitest + PromptFoo

## Development Workflow

1. Read relevant spec docs before implementing
2. Write tests first (TDD)
3. Keep files focused (<800 lines)
4. Immutable data patterns
5. Update @docs/codebase-map.md when adding new components
6. Log non-obvious decisions in @docs/decisions.md
7. Security review before commits touching tier enforcement

## Multi-Provider Work Delegation

**Use actual Codex and Gemini CLI headless for parallel work — not Claude subagents with similar names.** Kevin pays for Codex and Gemini team plans. Delegate real work to those providers via their CLI tools to maximize throughput across all accounts.

```bash
# Claude accounts
claude              # Personal (default ~/.claude)
claude-novo         # Novo work (CLAUDE_CONFIG_DIR=~/.claude-novo)

# Other providers (headless, parallel work)
codex               # OpenAI Codex CLI — research, code review, validation
gemini              # Google Gemini CLI — research, counsel, alternative perspectives
```

See @docs/token-routing.md for routing logic.
