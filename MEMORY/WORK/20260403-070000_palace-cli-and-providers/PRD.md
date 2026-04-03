---
task: Build Palace CLI entry point and real provider adapters
slug: 20260403-070000_palace-cli-and-providers
effort: advanced
phase: execute
progress: 0/28
mode: interactive
started: 2026-04-03T07:00:00Z
updated: 2026-04-03T07:01:00Z
---

## Context

Phase 1 Steps 1-8 built the library layer (146 tests). Now we need the app layer: a CLI that boots the Vizier, real provider adapters that call claude/codex/gemini, and a heartbeat system for courtier scheduling.

## Criteria

CLI:
- [ ] ISC-1: `palace` command exists and is runnable via `bun run`
- [ ] ISC-2: `palace start` boots Vizier with all registered courtiers
- [ ] ISC-3: `palace task "description"` analyzes and routes a task
- [ ] ISC-4: `palace status` shows courtier states and account usage
- [ ] ISC-5: `palace counsel` lists Counsel Layer items at L0
- [ ] ISC-6: `palace activate <courtier>` activates a dormant courtier
- [ ] ISC-7: `palace config` shows current palace.yaml configuration
- [ ] ISC-8: CLI loads config from config/palace.yaml on startup

Providers:
- [ ] ISC-9: CLIProvider implements Provider interface
- [ ] ISC-10: CLIProvider executes claude CLI with correct CLAUDE_CONFIG_DIR
- [ ] ISC-11: CLIProvider executes codex CLI headless
- [ ] ISC-12: CLIProvider executes gemini CLI headless
- [ ] ISC-13: Provider captures stdout as result content
- [ ] ISC-14: Provider tracks token usage from CLI output where available
- [ ] ISC-15: Provider supports AbortSignal for cancellation
- [ ] ISC-16: Provider registry loads from palace.yaml config

Heartbeat:
- [ ] ISC-17: Courtier heartbeat can be triggered manually via CLI
- [ ] ISC-18: Heartbeat injects context packet (memory state, pending tasks)
- [ ] ISC-19: Heartbeat results submitted to Counsel Layer

Wiring:
- [ ] ISC-20: Vizier auto-loads courtier configs from config/courtiers/
- [ ] ISC-21: Vizier auto-registers providers from config/palace.yaml
- [ ] ISC-22: Event bus connected to structured logger for audit trail
- [ ] ISC-23: CLI emits events for all user commands

Testing:
- [ ] ISC-24: CLI command parsing tests
- [ ] ISC-25: CLIProvider unit tests (mocked subprocess)
- [ ] ISC-26: Boot sequence integration test
- [ ] ISC-27: package.json has `bin` entry for palace command

Anti-criteria:
- [ ] ISC-A-1: Anti: CLI does not require interactive input (headless-friendly)
