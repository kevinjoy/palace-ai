# Palace AI — Codebase Map

Single source of truth for all Mermaid diagrams. Other docs reference sections here via anchors.

**Status:** Phase 1 scaffold implemented. Diagrams reflect both architecture and actual code structure.

---

## Source Code Structure

```mermaid
graph LR
    subgraph src["src/"]
        index["index.ts<br/>Entry point"]
        types["types.ts<br/>Core type definitions"]

        subgraph security["security/"]
            sec_idx["index.ts"]
            tier["tier-engine.ts<br/>6-tier enforcement"]
            sec_cfg["config-parser.ts<br/>YAML → SecurityConfig"]
        end

        subgraph courtiers["courtiers/"]
            crt_idx["index.ts"]
            crt_cfg["config-parser.ts<br/>YAML → CourtierConfig"]
            lifecycle["lifecycle.ts<br/>State machine"]
            registry["registry.ts<br/>Courtier tracking"]
        end

        subgraph memory["memory/"]
            mem_idx["index.ts"]
            uri["uri.ts<br/>palace:// URIs"]
            mem["memory.ts<br/>Tiered storage"]
            counsel["counsel.ts<br/>Counsel Layer"]
        end

        subgraph routing["routing/"]
            rt_idx["index.ts"]
            router["router.ts<br/>Multi-account routing"]
            analyzer["analyzer.ts<br/>Task complexity"]
        end

        subgraph providers["providers/"]
            prov_idx["index.ts"]
            provider["provider.ts<br/>Provider interface"]
            prov_reg["registry.ts<br/>Provider tracking"]
        end

        subgraph vizier["vizier/"]
            viz_idx["index.ts"]
            viz["vizier.ts<br/>Orchestrator"]
        end

        subgraph events["events/"]
            ebus["event-bus.ts<br/>Typed pub/sub"]
        end

        subgraph errors["errors/"]
            perr["palace-errors.ts<br/>8 error types"]
        end

        subgraph observability["observability/"]
            logger["logger.ts<br/>Structured JSON"]
        end

        subgraph integrations["integrations/"]
            obsidian["obsidian.ts<br/>Vault reader"]
        end

        schemas["schemas.ts<br/>Zod validation"]
    end

    subgraph config["config/"]
        palace_yaml["palace.yaml"]
        subgraph cfg_security["security/"]
            tiers_yaml["tiers.yaml"]
        end
        subgraph cfg_courtiers["courtiers/"]
            herald_yaml["herald.yaml"]
            guild_yaml["guild.yaml"]
            chaplain_yaml["chaplain.yaml"]
        end
    end

    types --> security
    types --> courtiers
    types --> memory
    types --> providers
    types --> routing
    schemas --> security
    schemas --> courtiers
    security --> memory
    security --> courtiers
    providers --> routing
    routing --> vizier
    courtiers --> vizier
    memory --> vizier
    events --> vizier
    integrations --> memory
    errors --> security
    errors --> memory
    errors --> courtiers
    config --> security
    config --> courtiers
```

## System Overview

```mermaid
graph TB
    Kevin[Kevin - Principal]

    subgraph Palace["Palace App Layer"]
        Vizier["Grand Vizier (Finn)"]
        subgraph Courtiers["Courtier System"]
            Chancellor["Chancellor<br/>Calendar, Comms"]
            Herald["Herald/Chamberlain<br/>Reporting, Daily Prep"]
            MasterAtArms["Master at Arms<br/>Security"]
            LordOfGuild["Lord of Guild<br/>Research"]
            Fool["Fool/Librarian<br/>Entertainment"]
            Chaplain["Chaplain<br/>Long-form Thinking"]
            Ambassadors["Ambassadors<br/>Public Life"]
            DM["Dungeon Master<br/>TBD"]
        end
        Memory["Memory System<br/>(OpenViking-inspired)"]
        Router["Token Router<br/>Multi-account"]
        CounselLayer["Counsel Layer<br/>Shared Insights"]
    end

    subgraph Accounts["LLM Accounts"]
        Personal["Personal Claude Max"]
        Novo["Novo Team"]
        Gemini["Gemini Team"]
        Codex["Codex (winding down)"]
    end

    Kevin --> Vizier
    Vizier --> Courtiers
    Vizier --> CounselLayer
    Courtiers --> Memory
    Courtiers --> CounselLayer
    Router --> Accounts
    Vizier --> Router
```

## Machine Topology

```mermaid
graph LR
    subgraph MBP["MBP (M1 Max, 64GB)"]
        Palace_App["Palace App"]
        Obsidian["Obsidian Vault"]
        CrownJewels["Crown Jewels<br/>(never shared)"]
        InnerChamber["Inner Chamber<br/>(Vizier + named Courtiers)"]
    end

    subgraph NUC["NUC (Ubuntu, 32GB)"]
        Sandbox["Sandlot"]
        Openclaw["Openclaw"]
        Hermes["Hermes"]
        OpenCourt_Copy["Open Court<br/>(read-only copies)"]
    end

    subgraph NAS["NAS (TrueNAS, 64GB)"]
        Storage["/tank/mine/"]
        Immich["Immich"]
        Ollama["Ollama"]
        N8N["n8n"]
    end

    subgraph Cloud["Cloud Services"]
        GitHub["GitHub"]
        NovoDrive["Novo OneDrive"]
        Supabase["Supabase"]
        Render["Render"]
        Vercel["Vercel"]
    end

    MBP -->|"git sync<br/>(read-only)"| NUC
    MBP -->|Tailscale| NAS
    MBP -->|Internet| Cloud
    NUC -->|"free outbound"| Cloud
    NUC -->|Tailscale| NAS
```

## Security Tier Model

```mermaid
graph TB
    subgraph Tier1["Tier 1: Crown Jewels"]
        T1_Data["Identity docs, passwords,<br/>crypto wallets, API keys"]
        T1_Access["ACCESS: Nobody<br/>Not even Vizier"]
        T1_Location["LOCATION: MBP only,<br/>encrypted paths"]
    end

    subgraph Tier2["Tier 2: Inner Chamber"]
        T2_Data["Journals, health records,<br/>personal reflections"]
        T2_Access["ACCESS: Vizier +<br/>named Courtiers only"]
        T2_Location["LOCATION: MBP,<br/>selective sync"]
    end

    subgraph Tier3["Tier 3: Guarded"]
        T3_Data["Client comp data,<br/>NDA work, financials"]
        T3_Access["ACCESS: Org-scoped<br/>agents + Vizier"]
        T3_Location["LOCATION: Novo OneDrive,<br/>NAS protected paths"]
    end

    subgraph Tier4["Tier 4: Open Court"]
        T4_Data["Research, project code,<br/>general thinking"]
        T4_Access["ACCESS: All trusted agents"]
        T4_Location["LOCATION: GitHub,<br/>synced copies"]
    end

    subgraph Tier5["Tier 5: Sandlot"]
        T5_Data["Sandbox workspace,<br/>agent working files"]
        T5_Access["ACCESS: Sandbox agents<br/>free reign"]
        T5_Location["LOCATION: NUC local storage"]
    end

    subgraph Tier6["Tier 6: Diplomatic Pouch"]
        T6_Data["Shared repos,<br/>team workspaces"]
        T6_Access["ACCESS: Per collaboration<br/>agreement"]
        T6_Location["LOCATION: Shared services"]
    end

    Tier1 -.->|"air gap"| Tier2
    Tier2 -.->|"named access"| Tier3
    Tier3 -.->|"org scope"| Tier4
    Tier4 -.->|"copy-in"| Tier5
    Tier4 -.->|"agreement"| Tier6
```

## Data Flow

```mermaid
flowchart LR
    subgraph Sources["Data Sources"]
        Obs["Obsidian Vault"]
        GH["GitHub Repos"]
        Granola["Granola Transcripts"]
        Cloud["Cloud Storage"]
    end

    subgraph Classification["Data Classification"]
        Classify{"Onboarding<br/>Classification"}
    end

    subgraph Tiers["Security Tiers"]
        CJ["Crown Jewels"]
        IC["Inner Chamber"]
        G["Guarded"]
        OC["Open Court"]
    end

    subgraph Agents["Agent Access"]
        V["Vizier"]
        Named["Named Courtiers"]
        Org["Org-scoped Agents"]
        All["All Agents"]
        SB["Sandbox"]
    end

    Sources --> Classify
    Classify --> CJ
    Classify --> IC
    Classify --> G
    Classify --> OC

    IC -->|"read"| V
    IC -->|"read"| Named
    G -->|"read"| Org
    G -->|"read"| V
    OC -->|"read"| All
    OC -->|"copy-in"| SB
    SB -->|"PR only"| OC
```

## Courtier Relationship Model

```mermaid
graph TB
    Kevin["Kevin (Principal)"]
    Vizier["Grand Vizier (Finn)<br/>Orchestrator"]

    subgraph OrgLayer["Organization Layer (Owned)"]
        C_Org["Each Courtier owns<br/>their processes"]
    end

    subgraph DataLayer["Data Layer (Fluid)"]
        D_Shared["Shared resources<br/>flow between Courtiers"]
    end

    subgraph CounselLayer["Counsel Layer (Surfaced)"]
        CL_Best["Best outputs promoted<br/>to shared view"]
    end

    Kevin --> Vizier
    Vizier --> OrgLayer
    Vizier --> CounselLayer
    OrgLayer --> DataLayer
    DataLayer --> CounselLayer
    CounselLayer -->|"Vizier mediates"| Vizier

    Guild["Lord of Guild<br/>generates research"] -->|"shares"| DataLayer
    Chaplain["Chaplain<br/>weaves thinking"] -->|"reads"| DataLayer
    Herald["Herald/Chamberlain<br/>prepares briefs"] -->|"reads"| CounselLayer
```

## Token Routing

```mermaid
flowchart LR
    Task["Incoming Task"]

    subgraph Analysis["Task Analysis"]
        Complexity{"Complexity<br/>Assessment"}
        Sensitivity{"Sensitivity<br/>Check"}
        Priority{"Project<br/>Importance"}
    end

    subgraph Routing["Routing Decision"]
        ModelSelect["Model Selection<br/>(Opus/Sonnet/Haiku)"]
        AcctSelect["Account Selection<br/>(Personal/Novo/Gemini)"]
    end

    subgraph Accounts["Accounts"]
        Personal["Personal Claude Max"]
        NovoTeam["Novo Team"]
        GeminiTeam["Gemini Team"]
    end

    Task --> Complexity
    Task --> Sensitivity
    Task --> Priority
    Complexity --> ModelSelect
    Sensitivity --> AcctSelect
    Priority --> ModelSelect

    ModelSelect --> AcctSelect
    AcctSelect -->|"sensitive Novo"| NovoTeam
    AcctSelect -->|"personal/general"| Personal
    AcctSelect -->|"overflow/parallel"| GeminiTeam
```

## Phase Evolution

```mermaid
gantt
    title Palace AI Phases
    dateFormat YYYY-MM
    section Phase 1
        Vizier on MBP              :p1a, 2026-04, 2026-06
        Multi-account routing      :p1b, 2026-04, 2026-06
        Memory system (basic)      :p1c, 2026-05, 2026-06
        NUC wipe & prep (parallel) :p1d, 2026-04, 2026-05
    section Phase 2
        NUC sandbox integration    :p2a, 2026-06, 2026-08
        Tailscale ACLs             :p2b, 2026-06, 2026-07
        Database architecture      :p2c, 2026-06, 2026-08
        Cloud fallback             :p2d, 2026-07, 2026-08
    section Phase 3
        Dashboard/messaging        :p3a, 2026-08, 2026-10
        Bidirectional Obsidian     :p3b, 2026-08, 2026-09
        Full Courtier activation   :p3c, 2026-09, 2026-10
    section Phase 4+
        Ganglionic center          :p4a, 2026-10, 2027-01
        Multi-operator support     :p4b, 2026-11, 2027-02
```
