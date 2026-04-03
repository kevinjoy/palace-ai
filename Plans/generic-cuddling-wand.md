# Plan: Courtier Operational Workflows + Token Allocation Engine

## Context

Palace AI has a complete harness (192 tests, 20 files, types/routing/memory/counsel/providers/events all working) but courtiers don't DO anything useful yet. The heartbeat sends a generic "review court activity" prompt regardless of courtier. The allocation engine — Palace's key differentiator — doesn't exist. This plan makes Palace operationally functional.

**Kevin's vision:** Courtiers negotiate with the Vizier for token budget based on work complexity. The Vizier coordinates across all providers (Claude personal, Novo, Codex, Gemini), allocating token share and scheduling reawakening. The Herald gathers intel asynchronously and produces structured daily briefs with Finn's opinions. Historical court research will inform the metaphor's operational patterns (pending — researchers still running).

**Research findings:** No existing framework (CrewAI, AutoGen, LangGraph) ships per-agent token budgets with dynamic reallocation. Palace must build a custom allocator combining Paperclip's heartbeat-bounded cycles, LangGraph's conditional routing primitives, and explicit per-courtier token accounting.

---

## Recommended Approach

### Core Architecture: Three New Subsystems

```
WORKFLOW SYSTEM          ALLOCATION ENGINE         SCHEDULER
src/workflows/           src/allocation/           src/scheduler/
  workflow.ts              allocator.ts              scheduler.ts
  registry.ts              budget.ts                 triggers.ts
  herald.ts                types.ts
  guild.ts
  chaplain.ts

          +                    +
src/outputs/             config/budgets.yaml
  schemas.ts
  parser.ts
```

**Key design principle:** Personas stay in YAML (personality), workflows stay in TypeScript (behavior), allocation is infrastructure.

### The Wake Cycle (how it all fits together)

```
Cron/Event fires
    |
    v
Scheduler.wake(courtierName)
    |
    v
Workflow.assess() — scan for pending work
    |
    v
Courtier builds AllocationRequest (work items, estimated tokens, priority)
    |
    v
Allocator.allocate() — check budgets, resolve contention, grant or deny
    |
    +--- DENIED ---> set nextWakeTime, go to sleep
    |
    +--- GRANTED ---> create budget-bounded execute() function
                          |
                          v
                      Workflow.run(ctx, execute)
                          |
                          v
                      Parse typed output via Zod schema
                          |
                          v
                      Store in Counsel Layer + emit events
```

---

## Implementation Phases

### Phase 0: MVP — Herald Daily Brief (makes Palace useful)

**Goal:** `palace heartbeat herald` produces a real structured daily brief. One courtier working end-to-end with simple budget limits.

**Create:**
- `src/workflows/workflow.ts` — WorkflowContext, WorkflowResult, ExecuteFn interfaces
- `src/workflows/registry.ts` — Map courtier names to workflow functions
- `src/workflows/herald.ts` — Herald workflow: gather counsel + obsidian, build brief prompt, parse structured output
- `src/outputs/schemas.ts` — DailyBrief Zod schema (priorities with Finn rationale, time blocks, backlog changes, appointments)
- `src/outputs/parser.ts` — Extract JSON from LLM output, validate against schema, graceful degradation

**Modify:**
- `src/vizier/vizier.ts` — heartbeat() checks workflow registry before generic fallback
- `src/boot.ts` — Wire ObsidianReader into PalaceInstance, register default workflows
- `src/cli.ts` — Add `palace brief` command to render latest daily brief
- `src/types.ts` — Add DailyBrief, Priority, TimeBlock, BacklogChange types

**Budget in Phase 0:** Simple token ceiling per courtier per day stored in `.palace/allocation/usage.json`. No negotiation, no contention. Hard limit that stops execution if exceeded.

**Tests:** Workflow context assembly, herald prompt building, output parsing (valid JSON, invalid JSON, graceful degradation), budget enforcement (ceiling hit → BudgetExhaustedError)

**DailyBrief structure:**
```typescript
interface DailyBrief {
  date: string;
  vizierCommentary: string;              // Finn's take on the day
  priorities: Priority[];                // Stack-ranked with Finn's rationale
  timeBlocks: TimeBlock[];               // Suggested schedule
  appointments: Appointment[];           // With "leave by" times
  backlogChanges: BacklogChange[];       // What changed and why
  warnings: string[];                    // Things that need attention
}

interface Priority {
  rank: number;
  description: string;
  project: string;
  estimatedMinutes: number;
  finnRationale: string;                 // WHY this ordering
  implementationIntention: string;       // "When X, then Y"
}
```

### Phase 1: Allocation Engine

**Goal:** Courtiers negotiate for resources. Vizier allocates across providers/accounts with priority-based contention resolution.

**Create:**
- `src/allocation/allocator.ts` — Core engine: load budgets, sort by priority, grant/deny, contention resolution
- `src/allocation/budget.ts` — Budget config loading from YAML, ceiling tracking, file-based persistence
- `src/allocation/types.ts` — AllocationRequest, AllocationGrant, AllocationDenial, WorkItem
- `config/budgets.yaml` — Per-account ceilings, per-courtier quota shares, escalation thresholds

**Modify:**
- `src/vizier/vizier.ts` — heartbeat() uses allocator to get grant before dispatching
- `src/events/event-bus.ts` — Add allocation event types (requested, granted, denied, exhausted, escalation)
- `src/cli.ts` — `palace budget` command (show usage, ceilings, grants)
- `src/types.ts` — Allocation types

**Allocation algorithm:**
1. Load ceilings and current usage per account
2. Sort pending requests by priority (critical > high > medium > low)
3. For each: check preferred account capacity → grant up to min(requested, quota, remaining)
4. If no capacity: check fallback accounts → if none: deny with suggestedWakeTime
5. At equal priority: split by default_share ratio
6. min_tokens guarantees always honored before excess distributed
7. At escalation threshold (90%): emit escalation event

**Budget-bounded execution:** The `execute` function passed to workflows wraps the provider in a closure over the grant. Every call deducts from remaining budget. When exhausted → BudgetExhaustedError. Workflow never knows about budgets directly.

### Phase 2: Heartbeat Scheduling + Triggers

**Goal:** Courtiers wake on schedule and on events. Denied courtiers retry at suggested times.

**Create:**
- `src/scheduler/scheduler.ts` — Cron-based + event-driven wake management
- `src/scheduler/triggers.ts` — Map YAML trigger strings to EventBus subscriptions

**Modify:**
- `src/boot.ts` — Register schedules at boot from courtier configs
- `src/integrations/obsidian.ts` — Add filesystem watcher for new notes (triggers `new_obsidian_daily_note`)

**Trigger mapping:** `"morning_cron"` → `0 6 * * *`, `"new_counsel_submission"` → EventBus `counsel:submitted`, `"new_obsidian_daily_note"` → fs.watch on Obsidian daily notes dir

### Phase 3: Guild + Chaplain Workflows

**Goal:** All three Phase 1 courtiers have operational workflows.

**Create:**
- `src/workflows/guild.ts` — Research with adversarial review (initial research → red team → synthesis, multi-turn if budget allows)
- `src/workflows/chaplain.ts` — Thinking synthesis (collect Obsidian + Guild outputs → pattern detection → synthesis proposal)
- Add ResearchFindings and ThinkingAnalysis Zod schemas

**Guild adversarial pattern:** 2-3 LLM calls per cycle. If budget allows only initial research, store as low-confidence and flag for next wake.

### Phase 4: Escalation + Cross-Courtier Triggers

**Goal:** Budget escalation to Kevin. Guild output triggers Chaplain wake.

**Create:**
- `src/allocation/escalation.ts` — Console (Phase 1) + Telegram (Phase 2) escalation
- `palace budget approve <account> <amount>` CLI command
- Cross-courtier triggers: `research_output_from_guild` → wake Chaplain

---

## Key Architectural Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D-017 | Workflows in TypeScript, personas in YAML | Workflows have branching logic and typed I/O; personas are declarative config |
| D-018 | Budget-bounded execution via closure | Simpler and more testable than workflows calling allocator directly |
| D-019 | Allocation at wake, not per-call | Enables global optimization across all courtiers, not local per-call decisions |
| D-020 | Graceful degradation for typed outputs | If LLM output fails schema validation, store raw text — always produce something |
| D-021 | File-based budget persistence | `.palace/allocation/` — follows principle #9 (file-based first) |

---

## Critical Files to Modify

| File | What Changes |
|------|-------------|
| `src/vizier/vizier.ts:210-255` | heartbeat() delegates to workflow registry + allocator |
| `src/routing/router.ts:57-68` | recordUsage/getUsage foundation for allocator ceiling checks |
| `src/types.ts` | Add allocation, workflow, and output types |
| `src/events/event-bus.ts:9-22` | Expand PalaceEventType for allocation/scheduler/workflow events |
| `src/boot.ts` | Wire allocator, scheduler, workflow registry, ObsidianReader |
| `src/cli.ts` | Add `palace brief`, `palace budget` commands |
| `config/courtiers/herald.yaml` | operations.triggers/outputs define the workflow contract |

---

## Verification

After each phase:
1. `npx vitest run` — all existing + new tests pass
2. `palace heartbeat herald` — produces structured DailyBrief (Phase 0+)
3. `palace budget` — shows per-account usage and ceilings (Phase 1+)
4. `palace brief` — renders the most recent Herald daily brief (Phase 0+)
5. Allocation contention test: two courtiers request budget simultaneously, priority wins (Phase 1)
6. Budget exhaustion test: workflow hits ceiling, BudgetExhaustedError thrown cleanly (Phase 0)

---

## Linear Tracking

Create one Linear issue per phase:
- INTERN-75: Phase 0 — Herald daily brief workflow + typed outputs + simple budget
- INTERN-76: Phase 1 — Allocation engine (the differentiator)
- INTERN-77: Phase 2 — Heartbeat scheduling + trigger system
- INTERN-78: Phase 3 — Guild + Chaplain workflows
- INTERN-79: Phase 4 — Escalation + cross-courtier triggers

---

## Pending: Historical Court Research

Two Claude researchers are still running on royal court operations (French, Chinese, English, Mughal). Findings will be incorporated into:
- The allocation algorithm (Mughal mansabdari ranking maps to courtier quota shares)
- Herald workflow (morning audience/lever ceremony maps to daily brief assembly)
- Intelligence gathering patterns (barid network maps to Herald background gathering)
- The design spec doc when written

The plan structure is independent of these findings — they refine the metaphor, not the architecture.
