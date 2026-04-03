---
task: Palace hardening, courtier personas, memory enrichment
slug: 20260403-140000_palace-hardening-personas-memory
effort: advanced
phase: complete
progress: 26/26
mode: interactive
started: 2026-04-03T14:00:00-04:00
updated: 2026-04-03T14:05:00-04:00
---

## Context

Kevin wants to advance Palace AI beyond its functional Phase 1 scaffold into a system where courtiers have real personality — grounded in cognitive psychology — and the heartbeat/memory systems do actual work. Four parallel workstreams:

1. **Courtier Personas**: Add `persona` section to courtier configs. Each courtier gets a distinct personality that uses cognitive psych techniques (Socratic questioning, motivational interviewing, deliberate practice scaffolding, cognitive reframing) to induce best work from sub-agents. "Take no shit" — these are demanding, expert characters.

2. **Memory Enrichment**: Improve L0/L1 auto-generation beyond naive first-sentence/first-paragraph extraction. Add metadata-aware summarization.

3. **Heartbeat Activation**: Make `palace heartbeat <name>` actually execute — gather Counsel Layer context, build a context-injected prompt, dispatch via provider, store results.

4. **Hardening**: Remove misleading comments, wire hookify Linear hook, ensure tests pass.

### Risks
- Persona system prompts could become too long and waste tokens
- Better L0/L1 generation might break existing tests
- Heartbeat execution depends on provider availability (test with mocks)

## Criteria

### Courtier Persona Architecture
- [x] ISC-1: CourtierConfig type includes readonly persona field
- [x] ISC-2: Zod CourtierConfigSchema validates persona object
- [x] ISC-3: RawCourtierYamlSchema handles persona from YAML
- [x] ISC-4: Config parser transforms persona section correctly
- [x] ISC-5: Persona schema has traits array field
- [x] ISC-6: Persona schema has communication_style string field
- [x] ISC-7: Persona schema has cognitive_techniques array field
- [x] ISC-8: Persona schema has challenge_behavior string field

### Courtier Personality Definitions
- [x] ISC-9: Herald YAML has full persona with distinct personality
- [x] ISC-10: Guild YAML has full persona with distinct personality
- [x] ISC-11: Chaplain YAML has full persona with distinct personality
- [x] ISC-12: Each persona uses named cognitive psych techniques
- [x] ISC-13: buildCourtierSystemPrompt incorporates persona into prompt

### Memory Enrichment
- [x] ISC-14: L0 generation handles multi-sentence content intelligently
- [x] ISC-15: L1 generation produces structured overview with key points
- [x] ISC-16: L0/L1 handle edge cases (empty, very short, very long content)
- [x] ISC-17: Memory tests updated and passing for new L0/L1 logic

### Heartbeat Activation
- [x] ISC-18: Heartbeat gathers recent Counsel Layer items as context
- [x] ISC-19: Heartbeat builds context-injected prompt for courtier
- [x] ISC-20: Heartbeat dispatches via Vizier.dispatch pipeline
- [x] ISC-21: Heartbeat result displayed to user in CLI
- [x] ISC-22: Heartbeat test covers full context-injection flow

### Hardening
- [x] ISC-23: Misleading INTERN-55 comments removed from registry.ts and lifecycle.ts
- [x] ISC-24: Hookify Linear hook wired into settings.json Stop hooks
- [x] ISC-25: All existing tests pass after changes

### Linear Tracking
- [x] ISC-26: Linear issue created and updated for this work

## Decisions

## Verification

- 192 tests pass across 20 files (up from 166 baseline)
- /simplify review found: domain duplication in heartbeat (fixed), regex hoisting (fixed), single-pass line extraction (fixed)
- Remaining efficiency notes for future: parallel file reads in collectItems, bounded counsel listing
- All 26 ISC criteria verified with evidence
