# Palace AI — Token Management & Model Routing

> For visual diagrams, see [@docs/codebase-map.md](codebase-map.md#token-routing).

## Core Principle

**Maximize total work throughput.** The optimization function is:

```
throughput = Σ (task_count × task_size × project_importance)
```

This means: the right model for the problem, always. Cheap inference on hard problems creates rework loops that burn more tokens than using the capable model upfront. Cost optimization is the LAST priority, after throughput, quality, and governance.

## Priority Stack

1. **Right model for the problem** — complexity-based selection, not cost-based
2. **Directional governance** — Novo models for sensitive Novo data (wall faces one direction)
3. **Maximize utilization** — don't let accounts sit idle; use available capacity
4. **Cost efficiency** — last priority; only matters when all else is equal

## Multi-Account Architecture

### Accounts Available

| Account | Provider | Type | Primary Use |
|---------|----------|------|-------------|
| Personal Claude Max | Anthropic | Subscription | Personal projects, research, Palace dev |
| Novo Team | Anthropic | Team plan | Novo-sensitive work, client-related tasks |
| Gemini Team | Google | Team plan (lent) | Overflow, parallel research, validation |
| Codex | OpenAI | Team plan (ending) | Headless research, code review |

### Account Isolation via Config Directories

```bash
# Each account gets its own isolated config directory
~/.claude/              # Personal (default)
~/.claude-novo/         # Novo Team
# Gemini and Codex use their own config mechanisms
```

**Aliases in ~/.zshrc:**
```bash
alias claude-novo="CLAUDE_CONFIG_DIR=~/.claude-novo claude"
alias claude-personal="claude"
```

Each config directory stores independent auth tokens, history, settings, and PAI configuration. Zero cross-contamination between accounts.

### Routing Logic

```
INCOMING TASK
    │
    ├─ Contains sensitive Novo data? ──→ MUST use Novo account
    │
    ├─ Is Novo work but non-sensitive? ──→ PREFER Novo if capacity
    │                                      FALLBACK to Personal
    │
    ├─ Is personal work? ──→ Use Personal account
    │
    └─ Is research/validation? ──→ Any available account
                                   PREFER Gemini/Codex for parallel work
```

**Directional governance rule:** The wall faces ONE direction. Novo models must touch sensitive Novo data. But Personal capacity can support non-sensitive Novo work. Personal agents never handle: client compensation data, NDA-covered material, or anything in Guarded tier under Novo scope.

## Model Selection Strategy

### Complexity-Based Routing

| Task Complexity | Model | Rationale |
|----------------|-------|-----------|
| **Strategic/Architectural** | Opus | Deep reasoning, complex trade-offs, system design |
| **Implementation/Coding** | Sonnet | Best coding model, strong reasoning |
| **Routine/Simple** | Haiku | Fast, cheap, sufficient for straightforward tasks |
| **Research/Exploration** | Sonnet (default), Opus (deep) | Balance of capability and throughput |

### Courtier Default Models

Each Courtier has a model preference profile (defined in their config):

| Courtier | Default | Deep Work | Quick |
|----------|---------|-----------|-------|
| Vizier | Sonnet | Opus | Sonnet |
| Chaplain | Sonnet | Opus | Haiku |
| Lord of Guild | Sonnet | Opus | Haiku |
| Herald/Chamberlain | Haiku | Sonnet | Haiku |
| Master at Arms | Sonnet | Opus | Haiku |

Model preferences are overridable at the task level — if the Vizier determines a Herald task requires deeper reasoning, it can upgrade the model for that specific task.

## Budget Tracking

### Per-Account Tracking

Palace tracks token consumption per account:

```yaml
# palace.token-tracking.yaml (auto-maintained)
accounts:
  personal:
    provider: anthropic
    plan: max
    period: monthly
    usage:
      opus: { input: 0, output: 0 }
      sonnet: { input: 0, output: 0 }
      haiku: { input: 0, output: 0 }
    limits:
      # Subscription limits are hard — never exceed
      daily_messages: null  # Track but don't enforce (subscription)
    last_updated: 2026-04-03T00:00:00Z

  novo:
    provider: anthropic
    plan: team
    period: monthly
    usage: { ... }
    limits: { ... }
```

### Throughput Reporting

The Vizier generates periodic throughput reports:

- **Tasks completed** per account per period
- **Model utilization** — are we using the right models? (overuse of Opus on simple tasks = waste; underuse on complex tasks = rework)
- **Account utilization** — is any account sitting idle while others are constrained?
- **Governance compliance** — did any task violate directional routing rules?

## Model Evaluation with PromptFoo

For selecting the best model for a task TYPE (not individual tasks), Palace can use PromptFoo-style evaluation:

1. **Define task categories:** "research synthesis," "code generation," "daily briefing," etc.
2. **Create test cases:** Representative prompts for each category
3. **Run across models:** Test Opus, Sonnet, Haiku on each category
4. **Compare results:** Quality, speed, token usage
5. **Update routing table:** Adjust default model per category based on evaluation

This runs periodically (monthly or when new models are released) to keep routing optimal.

## Future: Gateway Layer

As Palace matures, the multi-account routing may evolve from shell aliases to a proper gateway:

- **LiteLLM Gateway** pattern: unified API that routes to the right provider/model
- **Portkey** pattern: credential hierarchy with budget ceilings and failover
- **Custom Palace Router:** integrated with the Vizier's task analysis

For Phase 1, the `CLAUDE_CONFIG_DIR` alias approach is sufficient and zero-overhead.

## References

- [CCS - Claude Code Switch](https://ccs.kaitran.ca/)
- [LiteLLM Claude Code Max integration](https://docs.litellm.ai/docs/tutorials/claude_code_max_subscription)
- [Portkey Enterprise Best Practices](https://portkey.ai/blog/claude-code-best-practices-for-enterprise-teams/)
- [Multi-Account Management Gist](https://gist.github.com/KMJ-007/0979814968722051620461ab2aa01bf2)
