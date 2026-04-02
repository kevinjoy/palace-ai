# Palace AI — Decision Log

Timestamped record of architectural and design decisions. Newest first.

---

## 2026-04-03

### D-012: Testing strategy document added to spec suite
- **Decision:** Include `docs/testing-strategy.md` as a deliverable alongside the spec
- **Rationale:** Testing approach should be defined before implementation begins, not after
- **Impact:** Adds phased testing plan covering unit, integration, model evaluation, and security testing

### D-011: Reference repos cloned to `references/` (gitignored)
- **Decision:** Clone all reference projects into `references/` for direct source code access
- **Rationale:** Agents can extract patterns directly from source rather than relying on web summaries
- **Impact:** `.gitignore` updated; repos kept at main branch, periodically updated

### D-010: Courtier system designed as configurable, not hardcoded
- **Decision:** Courtier roles are user-definable with templates. Kevin's roles (Chancellor, Chaplain, etc.) serve as the default template.
- **Rationale:** Palace should be usable by other people with different life domains
- **Impact:** `docs/courtiers.md` defines the framework; specific roles are configuration, not code

### D-009: Mermaid diagrams single-sourced in `docs/codebase-map.md`
- **Decision:** All Mermaid maps live in one file. Other docs reference it, never duplicate.
- **Rationale:** Prevents diagram drift; one place to update
- **Impact:** `CLAUDE.md` and all spec docs link to codebase-map.md sections via anchors

### D-008: Spec suite uses domain-organized multi-file structure
- **Decision:** CLAUDE.md as hub with @refs to domain-specific spec files in `docs/`
- **Rationale:** Kevin wants CLAUDE.md for operational principles, with detailed specs in separate files
- **Impact:** 10 documents total (CLAUDE.md + 9 in docs/)

## 2026-04-02 — Interview Session

### D-007: Phase 1 scope is MBP-only with parallel NUC prep
- **Decision:** Build Palace app on MBP first. NUC wiped and prepped in parallel for Hermes/Openclaw familiarization.
- **Rationale:** "App not OS" — get the harness working locally before distributing across machines
- **Impact:** Phase 1 deliverable is a working Vizier on MBP with multi-account routing

### D-006: Palace is an app, not an OS
- **Decision:** Palace is an application layer (Vizier, Courtiers, memory, routing, dashboard) that configures infrastructure primitives, not an operating system that manages them directly.
- **Rationale:** Kevin wants an app experience — users interact with Finn, not with Tailscale ACLs
- **Impact:** Security tiers, network config, and data sync are abstracted behind onboarding flow

### D-005: Filesystem enforcement for Phase 1 security
- **Decision:** Use copy-in model (only sync what agents need) rather than network-level ACLs
- **Rationale:** Simplest enforcement that works. Crown Jewels never leave MBP = no network rule needed.
- **Impact:** Tailscale ACLs deferred to Phase 2 as defense-in-depth

### D-004: 6-tier security model adopted
- **Decision:** Crown Jewels / Inner Chamber / Guarded / Open Court / Sandlot / Diplomatic Pouch
- **Rationale:** 4 tiers insufficient — Inner Chamber solves the personal-thinking access problem; Diplomatic Pouch handles future external collaboration
- **Impact:** Each tier has defined data types, access rules, and enforcement mechanisms
- **Scalability:** Framework is data-classification-based; tier labels are thematic. Other users get onboarding-guided tier suggestions.

### D-003: Data sync via git-based sync, phased toward read-write
- **Decision:** Phase 1: Git-based sync (MBP → NUC, read-only). Phase 2: PR-based write proposals. Phase 3: Real-time collaborative editing.
- **Rationale:** Security concern (trust must build) and Obsidian Sync already in use
- **Impact:** Obsidian evolves from read-only data source to bidirectional exchange surface

### D-002: Multi-account routing with directional governance
- **Decision:** Novo models must touch sensitive Novo data. Personal can support non-sensitive Novo work. Maximize throughput across all available capacity.
- **Rationale:** The wall faces one direction — governance protects sensitive data, but doesn't waste idle capacity
- **Formula:** Optimize `(task count) x (task size) x (project importance)`. Cost is least important.

### D-001: Token management priority = maximize throughput
- **Decision:** Right model for the problem > directional governance > cost optimization
- **Rationale:** Cheap inference on hard problems = rework loops that burn more tokens. Choose quality.
- **Impact:** Model selection is complexity-based, not cost-based

### D-000: Courtier ownership is three-layered
- **Decision:** (1) Organization layer (owned), (2) Data layer (fluid/shared), (3) Counsel layer (surfaced upward)
- **Rationale:** Courtiers own HOW they work, not the data exclusively. Research flows between Guild and Chaplain. Best outputs promoted to shared view.
- **Impact:** Vizier mediates counsel layer; all Courtiers can see and build on promoted outputs
