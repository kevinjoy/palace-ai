# Palace AI — Testing Strategy

## Philosophy

Testing an agentic system differs from testing traditional software. Agents are non-deterministic, their outputs depend on LLM responses, and their interactions with each other create emergent behavior. Palace's testing strategy addresses this through layered verification — deterministic where possible, statistical where necessary.

## Testing Layers

### Layer 1: Unit Tests (Deterministic)
Test the structural components of Palace that DON'T involve LLM calls:

- **Config parsing:** Courtier YAML configs load and validate correctly
- **Security tier enforcement:** Data classification rules applied correctly
- **Token routing logic:** Complexity → model mapping, account → governance rules
- **Memory indexing:** L0/L1/L2 decomposition produces correct structures
- **URI scheme:** `palace://` URI parsing and resolution
- **Lifecycle state machine:** Courtier state transitions (dormant → active → suspended)

**Framework:** Vitest (TypeScript) or Bun's built-in test runner
**Coverage target:** 80%+ on structural code
**When:** Every PR, every commit

### Layer 2: Integration Tests (Semi-deterministic)
Test components working together without full LLM involvement:

- **Multi-account isolation:** Config directories don't leak between accounts
- **Git sync pipeline:** Changes on MBP appear as read-only on target correctly
- **Memory persistence:** Write → restart → read cycle preserves data
- **Courtier registration:** Vizier discovers and tracks active Courtiers
- **Security boundary enforcement:** Courtier at tier X cannot access tier Y data
- **Heartbeat scheduling:** Cron triggers fire at correct intervals

**Framework:** Vitest + test fixtures
**When:** Pre-merge, nightly

### Layer 3: Agent Behavior Tests (Stochastic)
Test that agents behave correctly given representative tasks:

- **Task routing accuracy:** Given a task description, does the Vizier route to the right Courtier + model + account?
- **Counsel Layer quality:** Do Courtier outputs meet minimum quality bar for Counsel promotion?
- **Security compliance:** Does an agent ever attempt to access data above its clearance?
- **Governance compliance:** Does routing respect directional governance rules?

**Approach:** PromptFoo-style evaluation
1. Define test cases as YAML: input task → expected routing/behavior
2. Run across actual LLM providers
3. Assert on structural properties (correct Courtier selected, correct account used)
4. Score on quality properties (output relevance, completeness)

```yaml
# tests/agent-behavior/task-routing.yaml
prompts:
  - "Route this task: Review the Q2 compensation analysis for Novo client ABC"

providers:
  - anthropic:claude-sonnet-4-6

tests:
  - assert:
      - type: contains
        value: "novo"        # Must route to Novo account
      - type: contains
        value: "guild"       # Should go to Lord of Guild
      - type: not-contains
        value: "personal"    # Must NOT use personal account for sensitive data
```

**When:** Weekly, on model updates, before major releases

### Layer 4: Model Evaluation (Periodic)
Test which model is best for each task category:

- **Task categories:** research synthesis, code generation, daily briefing, strategic planning, simple queries
- **Evaluation:** Run representative prompts across Opus, Sonnet, Haiku
- **Metrics:** Quality (human-rated or LLM-judged), speed, token usage
- **Output:** Updated routing table recommendations

**Framework:** PromptFoo with custom evaluators
**When:** Monthly, or when new models are released

### Layer 5: Security Tests (Critical Path)
Adversarial testing of Palace's security boundaries:

- **Prompt injection resistance:** Can a crafted input cause an agent to access data above its tier?
- **Exfiltration prevention:** Can an agent be tricked into outputting Crown Jewel data to a log/file/API?
- **Cross-agent contamination:** Can a compromised Courtier inject malicious content into the Counsel Layer?
- **Escalation prevention:** Can a Sandbox agent convince the Vizier to grant it higher access?
- **Config immutability:** Can an agent modify its own hooks, MCP definitions, or skill files?

**Approach:** Red team exercises using PromptFoo's red-team capabilities
**When:** Before each phase milestone, quarterly

### Layer 6: End-to-End Scenarios (Phase Milestones)
Full workflow tests that exercise Palace as a user would:

**Phase 1 scenarios:**
- Kevin asks Vizier to research a topic → Lord of Guild assigned → research produced → Counsel Layer updated
- Kevin writes a daily note in Obsidian → Chaplain picks it up → expands thinking → proposes long-form draft
- Herald prepares morning brief → pulls from Counsel Layer → summarizes priorities → presents to Kevin
- Novo task arrives → routed to Novo account → completed → result reported back

**Phase 2 scenarios:**
- Sandbox agent (Openclaw) receives Open Court research → works in sandlot → proposes PR back
- NUC agent attempts to access Inner Chamber → access denied at filesystem level
- Vizier fails on MBP → cloud fallback activated → continues orchestration

**Framework:** Playwright for dashboard tests, custom harness for agent workflow tests
**When:** Phase milestones

## Testing Phases

| Phase | Testing Focus | Layers Active |
|-------|--------------|---------------|
| **Phase 1** | Structural correctness, routing logic, security boundaries | 1, 2, 3 (basic), 5 (basic) |
| **Phase 2** | Multi-machine integration, heartbeat reliability, network security | 1-5, 6 |
| **Phase 3** | Dashboard UX, full workflow, performance | 1-6 |

## Test-Driven Development Workflow

For every Palace feature:
1. **Write test first** (RED) — define what correct behavior looks like
2. **Implement** (GREEN) — make the test pass
3. **Verify security** — run Layer 5 checks against the new feature
4. **Evaluate routing** — if the feature affects task routing, run Layer 3 checks
5. **Refactor** (IMPROVE) — clean up while tests stay green

## Continuous Integration

```yaml
# CI pipeline
on_pr:
  - Layer 1: Unit tests (must pass)
  - Layer 2: Integration tests (must pass)
  - Layer 5: Security smoke tests (must pass)

nightly:
  - Layer 3: Agent behavior tests
  - Layer 5: Full security tests

weekly:
  - Layer 4: Model evaluation
  - Layer 6: E2E scenarios (against current phase)

on_release:
  - All layers
  - Red team exercise
```
