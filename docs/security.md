# Palace AI — Security Architecture

> This document defines Palace AI's security model. For visual diagrams, see [@docs/codebase-map.md](codebase-map.md#security-tier-model).

## Design Philosophy

Palace operates on three security principles drawn from classic information security adapted for agentic AI:

1. **Bell-LaPadula (Confidentiality):** "No read up, no write down." Agents can read data at or below their clearance, never above. A Sandbox agent cannot read Inner Chamber content. The Vizier cannot write sensitive data down to lower-trust agents.

2. **Biba (Integrity):** "No write up, no read down." Prevents lower-trust agents from poisoning higher-trust state. A compromised Sandbox agent's outputs must be validated before entering the Counsel Layer. This blocks prompt injection from propagating upward.

3. **Clark-Wilson (Transaction Integrity):** All state mutations go through validated transformation procedures. Agents propose changes; the system verifies integrity before committing. No agent directly modifies shared state — the "agents propose, Vizier approves" pattern.

## Threat Models

### Threat 1: Accidental Exfiltration
An agent reads sensitive data and — in the course of normal work — outputs it to an insecure location (log file pushed to GitHub, summary shared in a note, context leaked in a prompt to an external API).

**Mitigations:**
- Crown Jewels never enter any agent's context window (air-gapped at filesystem level)
- Inner Chamber content only provided to named, trusted Courtiers
- Guarded data accessed only by org-scoped agents with audit trails
- Default-deny: agents receive ONLY the data explicitly provisioned for their task
- Credential broker pattern: per-task secret provisioning, never inherited host credentials

### Threat 2: Active Compromise
An agent is compromised via prompt injection, malicious dependency, or supply chain attack, and actively attempts to exfiltrate data or plant persistence.

**Mitigations:**
- NUC physical separation: even full compromise only exposes Open Court copies and Sandlot workspace
- No network path from NUC to Crown Jewels or Inner Chamber (filesystem enforcement Phase 1, Tailscale ACLs Phase 2)
- Free outbound from NUC, but nothing inbound to MBP sensitive paths
- Agent configuration (hooks, MCP definitions, skills) treated as immutable from the agent's perspective (NVIDIA pattern)
- Behavioral anomaly detection: agents that deviate from expected patterns flagged for review

### Threat 3: Cross-Agent Contamination
A compromised or misbehaving agent influences other agents through shared state (poisoned memories, manipulated counsel layer outputs, injected instructions).

**Mitigations:**
- Biba integrity model: lower-trust outputs validated before entering higher-trust contexts
- Counsel layer submissions require Vizier review before propagation
- Agent-to-agent communication uses Palace's message bus, not direct state mutation
- Each agent operates in its own context window (Claude Code Agent Teams pattern)

## The 6-Tier Security Model

### Tier 1: Crown Jewels
| Property | Value |
|----------|-------|
| **Contains** | Identity documents, passwords, SSH/API keys, crypto wallets, sensitive personal media |
| **Access** | No agent access — not even the Vizier |
| **Location** | MBP only, in encrypted paths |
| **Enforcement** | Filesystem: these paths are never mounted, synced, or shared. No network share, no Tailscale mount. |
| **Rationale** | Some data is too sensitive for any automated system. Human-only access. |

### Tier 2: Inner Chamber
| Property | Value |
|----------|-------|
| **Contains** | Personal journals, health records, deeply personal thinking/reflections, family legal documents |
| **Access** | Vizier + named Courtiers only (Chaplain, Chancellor) |
| **Location** | MBP, selectively synced to trusted agents |
| **Enforcement** | Named access list in Palace config. Audit trail on every read. |
| **Rationale** | The Chaplain needs Kevin's intimate thinking to help weave long-form works. The Chancellor needs personal context for interpersonal management. But no other agent should see journals or health records. |

### Tier 3: Guarded
| Property | Value |
|----------|-------|
| **Contains** | Client compensation data, NDA-covered work, org-specific protected material, financial modeling |
| **Access** | Org-scoped agents (Novo account) + Vizier |
| **Location** | Novo OneDrive, NAS protected paths |
| **Enforcement** | Directional governance: only agents running under the Novo account touch this data. Audit trail on every read. Per-task secret provisioning for credentials. |
| **Rationale** | Work-sensitive data has governance requirements. The wall faces one direction — Novo models for Novo-sensitive data. |

### Tier 4: Open Court
| Property | Value |
|----------|-------|
| **Contains** | Research, project code, general thinking, non-sensitive documentation |
| **Access** | All trusted agents (Vizier + all Courtiers) |
| **Location** | GitHub repos, synced copies to NUC |
| **Enforcement** | Git-based sync provides read-only copies. Write-back only via PR/review process. |
| **Rationale** | Research and project work should flow freely between Courtiers. The Counsel Layer draws from this tier. |

### Tier 5: Sandlot
| Property | Value |
|----------|-------|
| **Contains** | Sandbox working files, experimental outputs, agent scratch space |
| **Access** | Sandbox agents (Openclaw, Hermes) — free reign within |
| **Location** | NUC local storage |
| **Enforcement** | Agents can write freely within the Sandlot. Cannot write to Open Court directly (PR only). Cannot reach Crown Jewels, Inner Chamber, or Guarded at all. Free outbound network. |
| **Rationale** | Experimental agents need freedom to work. The NUC is their oyster — but the moat keeps them from the castle. |

### Tier 6: Diplomatic Pouch
| Property | Value |
|----------|-------|
| **Contains** | Shared repos, team workspaces, co-authored documents, cross-org collaboration |
| **Access** | Governed by per-collaboration agreements |
| **Location** | Shared services (GitHub, shared cloud storage) |
| **Enforcement** | Access rules defined per collaboration. Time-bounded, revocable, audited. |
| **Rationale** | Future-facing tier for when Palace interacts with other people's agents, collaborators, or organizations. |

## Enforcement Mechanisms by Phase

### Phase 1: Filesystem Enforcement
- Crown Jewels never leave MBP encrypted paths
- No agent has filesystem access to Crown Jewel paths
- Open Court data synced to NUC via git (read-only copies)
- Sandlot agents write only to NUC local storage
- Inner Chamber content manually provisioned to named agents only
- No network-level enforcement needed — if the data isn't there, it can't be read

### Phase 2: Network Defense-in-Depth
- Tailscale ACLs enforced: NUC can only reach Open Court paths and NAS storage
- No inbound connection from NUC to MBP sensitive paths
- MicroVM isolation (Firecracker/Kata) for Sandbox agents on NUC
- Egress controls: default-deny outbound from MBP agents, allowlisted for Sandbox

### Phase 3: Runtime Security
- Behavioral anomaly detection for all agents
- OpenTelemetry-based agent tracing (Microsoft AutoGen pattern)
- Automated PII detection on agent outputs (flag before commit/share)
- Memory expiration (TTL) on sensitive context within agent windows
- Integrity verification on Counsel Layer submissions

## Data Classification During Onboarding

Palace's onboarding flow helps users classify their data into tiers:

1. **Discovery:** Palace scans the user's filesystem and cloud storage to identify data categories
2. **Suggestion:** Based on data types (documents, media, code, credentials), Palace suggests tier assignments
3. **Review:** User reviews and adjusts classifications
4. **Persistence:** Classifications stored in Palace config, enforced at runtime
5. **Evolution:** Users can reclassify data as trust builds

The framework is data-classification-based, not location-based. A file is sensitive because of WHAT it contains, not WHERE it lives. Tier labels are thematic (Court-metaphor names) but the underlying model is OWASP's four-tier data classification (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED) extended with Palace's Inner Chamber and Diplomatic Pouch.

### Scalability to Other Users

The 6-tier model adapts to different life contexts:

| User Type | Crown Jewels | Inner Chamber | Guarded | Open Court |
|-----------|-------------|---------------|---------|------------|
| **Individual** | Passwords, crypto, identity | Health, journals, family legal | Financial modeling, tax docs | Projects, research, notes |
| **Freelancer** | Same + client credentials | Personal thinking | Client deliverables, NDAs | Portfolio, public code |
| **Small Business** | Company secrets, IP | Employee personal data | Client data, financials | Product code, marketing |

## Security Configuration Schema

```yaml
# palace.security.yaml
tiers:
  crown_jewels:
    paths:
      - ~/Documents/Identity/
      - ~/Documents/Financial/Crypto/
      - ~/.ssh/
      - ~/.aws/
    access: none
    sync: never

  inner_chamber:
    paths:
      - ~/Obsidian/Daily Notes/
      - ~/Obsidian/Personal Reflections/
      - ~/Documents/Health/
    access:
      - vizier
      - chaplain
      - chancellor
    sync: selective
    audit: true

  guarded:
    paths:
      - ~/OneDrive - Novo/Compensation/
      - ~/OneDrive - Novo/Client Data/
    access:
      account: novo
      roles:
        - vizier
    sync: org-scoped
    audit: true

  open_court:
    paths:
      - ~/Coding Repositories/
      - ~/Obsidian/Research/
      - ~/Obsidian/Projects/
    access: all_trusted
    sync: git
    write_back: pr_only

  sandlot:
    location: nuc:/home/agents/sandlot/
    access: sandbox_agents
    sync: copy_in
    network: free_outbound

  diplomatic_pouch:
    agreements: []  # Populated per collaboration
```

## References

- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
- [NVIDIA: Practical Security Guidance for Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/)
- [TRiSM for Agentic AI (arXiv)](https://arxiv.org/html/2506.04133v3)
- [Bell-LaPadula and Biba Security Models](https://stagefoursecurity.com/blog/2025/05/09/bell-lapadula-and-biba/)
- [Clark-Wilson Integrity Model](https://inventivehq.com/blog/formal-security-models-bell-lapadula-biba-clark-wilson)
- [NIST AI Agent Standards Initiative](https://labs.cloudsecurityalliance.org/research/csa-research-note-nist-ai-agent-standards-federal-framework/)
