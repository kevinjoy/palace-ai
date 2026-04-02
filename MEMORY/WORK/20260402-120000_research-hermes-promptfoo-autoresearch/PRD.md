---
task: Research Hermes PromptFoo Autoresearch for Palace AI
slug: 20260402-120000_research-hermes-promptfoo-autoresearch
effort: extended
phase: complete
progress: 16/16
mode: interactive
started: 2026-04-02T12:00:00-04:00
updated: 2026-04-02T12:01:00-04:00
---

## Context

Research-only task: investigate three open-source projects (Hermes Agent, PromptFoo, Autoresearch) to extract implementation patterns applicable to Palace AI's court-metaphor agentic harness. No code writing -- findings delivered as a written analysis document.

### Risks

- Surface-level analysis that misses actionable patterns
- Misattributing capabilities based on marketing rather than source code
- Failing to connect findings to Palace's specific architecture needs

## Criteria

- [x] ISC-1: Hermes skill_manager_tool.py analyzed for create/edit/patch/delete mechanisms
- [x] ISC-2: Hermes memory_tool.py analyzed for dual-store bounded memory architecture
- [x] ISC-3: Hermes skills_guard.py analyzed for security scanning of agent-created content
- [x] ISC-4: Hermes skills_hub.py analyzed for external skill discovery and installation
- [x] ISC-5: Hermes hermes_state.py analyzed for SQLite session persistence with FTS5
- [x] ISC-6: Hermes trajectory_compressor.py analyzed for training data compression
- [x] ISC-7: Hermes findings written as 200-400 word analysis
- [x] ISC-8: PromptFoo TestSuite schema analyzed for providers/prompts/tests structure
- [x] ISC-9: PromptFoo evaluator.ts analyzed for assertion and scoring pipeline
- [x] ISC-10: PromptFoo example configs analyzed for multi-model comparison workflow
- [x] ISC-11: PromptFoo findings written as 200-400 word analysis
- [x] ISC-12: Autoresearch program.md analyzed for autonomous experiment loop
- [x] ISC-13: Autoresearch train.py analyzed for single-file modification constraint
- [x] ISC-14: Autoresearch README.md analyzed for design philosophy and fork ecosystem
- [x] ISC-15: Autoresearch findings written as 200-400 word analysis
- [x] ISC-16: All findings written to references/research-findings.md

## Decisions

- Cloned all repos to palace-ai/references/ as requested
- Used shallow clones (--depth 1) to minimize disk usage

## Verification
