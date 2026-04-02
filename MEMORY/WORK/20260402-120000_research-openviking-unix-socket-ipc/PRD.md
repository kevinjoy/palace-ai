---
task: Research OpenViking architecture and Unix socket IPC
slug: 20260402-120000_research-openviking-unix-socket-ipc
effort: standard
phase: complete
progress: 10/10
mode: interactive
started: 2026-04-02T12:00:00-05:00
updated: 2026-04-02T12:06:00-05:00
---

## Context

Research task analyzing two architectural patterns for Palace AI reference:
1. OpenViking's hierarchical memory system (cloned to references/OpenViking)
2. Unix socket IPC as inter-agent communication pattern

No code writing -- pure architectural analysis with code references.

### Risks
- OpenViking codebase is large; focused on the 4 specific mechanisms requested
- Unix socket analysis balanced theoretical assessment with concrete Palace applicability

## Criteria

- [x] ISC-1: L0/L1/L2 tier decomposition implementation explained with code references
- [x] ISC-2: viking:// URI scheme parsing and path structure documented
- [x] ISC-3: Self-evolving memory extraction mechanism analyzed with code references
- [x] ISC-4: Memory deduplication and merge flow explained
- [x] ISC-5: Directory-recursive retrieval algorithm analyzed with code references
- [x] ISC-6: Score propagation and convergence logic explained
- [x] ISC-7: Investigation 1 is 400-500 words with code file references
- [x] ISC-8: Unix socket advantages over HTTP/REST assessed for Palace
- [x] ISC-9: Vizier-Courtier socket communication design sketched
- [x] ISC-10: Security implications and comparison to Claude Code Agent Teams included

## Decisions

- Focused on implementation mechanics over description
- Used actual line numbers and file paths for code references
- Kept Unix socket assessment Palace-specific rather than generic

## Verification

- ISC-1: Verified via context.py:33 ContextLevel enum, viking_fs.py:1907 write_context, directories.py:244 vector seeding
- ISC-2: Verified via uri.py VikingURI class, viking_fs.py:1199 _uri_to_path mapping
- ISC-3: Verified via session.py:447 asyncio.create_task trigger, memory_extractor.py extract() LLM pipeline
- ISC-4: Verified via memory_deduplicator.py skip/create/merge/delete decisions, memory_extractor.py:560 _merge_memory_bundle
- ISC-5: Verified via hierarchical_retriever.py:351 _recursive_search heapq BFS
- ISC-6: Verified via hierarchical_retriever.py:449 alpha score propagation, line 483 convergence check
- ISC-7: Word count approximately 490
- ISC-8: Covered latency, throughput, port exhaustion advantages
- ISC-9: Covered socket path, wire protocol, routing table, broadcast pattern
- ISC-10: Covered chmod permissions, stale socket cleanup, Claude Code Agent Teams comparison
