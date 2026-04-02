/**
 * Integration Test: Full Palace AI Workflow
 *
 * Tests the complete pipeline: task reception → analysis → routing →
 * courtier matching → memory storage → counsel submission → event emission.
 * This is the Phase 1 end-to-end validation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile, readFile } from "fs/promises";

import { Vizier } from "@palace/vizier/vizier.ts";
import { CourtierRegistry } from "@palace/courtiers/registry.ts";
import { PalaceMemory } from "@palace/memory/memory.ts";
import { CounselLayer } from "@palace/memory/counsel.ts";
import { TokenRouter } from "@palace/routing/router.ts";
import { TaskAnalyzer } from "@palace/routing/analyzer.ts";
import { EventBus } from "@palace/events/event-bus.ts";
import { parseCourtierConfig } from "@palace/courtiers/config-parser.ts";
import { parseSecurityConfig, validateSecurityConfig } from "@palace/security/config-parser.ts";
import { canAccess } from "@palace/security/tier-engine.ts";
import { ObsidianReader } from "@palace/integrations/obsidian.ts";
import { Logger, createCollectTransport } from "@palace/observability/logger.ts";
import { TierAccessDeniedError } from "@palace/errors/palace-errors.ts";

const TEST_DIR = ".test-integration";
const VAULT_DIR = `${TEST_DIR}/vault`;
const MEMORY_DIR = `${TEST_DIR}/memory`;

async function loadCourtier(name: string) {
  const yaml = await readFile(`config/courtiers/${name}.yaml`, "utf-8");
  return parseCourtierConfig(yaml);
}

describe("Full Palace AI Workflow", () => {
  let vizier: Vizier;
  let registry: CourtierRegistry;
  let memory: PalaceMemory;
  let counsel: CounselLayer;
  let router: TokenRouter;
  let eventBus: EventBus;
  let logger: Logger;
  let logEntries: ReturnType<typeof createCollectTransport>;

  beforeEach(async () => {
    await mkdir(VAULT_DIR + "/Daily Notes", { recursive: true });
    await mkdir(VAULT_DIR + "/Research", { recursive: true });
    await mkdir(MEMORY_DIR, { recursive: true });

    registry = new CourtierRegistry();
    memory = new PalaceMemory(MEMORY_DIR);
    counsel = new CounselLayer(memory);
    router = new TokenRouter({
      accounts: {
        personal: { providers: ["claude-personal", "codex", "gemini"] },
        novo: { providers: ["claude-novo"] },
      },
      defaultAccount: "personal",
      modelMapping: { opus: "claude-opus-4-6", sonnet: "claude-sonnet-4-6", haiku: "claude-haiku-4-5" },
    });
    eventBus = new EventBus();
    logEntries = createCollectTransport();
    logger = new Logger("integration-test");
    logger.addTransport(logEntries.transport);

    const [herald, guild, chaplain] = await Promise.all([
      loadCourtier("herald"),
      loadCourtier("guild"),
      loadCourtier("chaplain"),
    ]);
    registry.register(herald);
    registry.register(guild);
    registry.register(chaplain);

    vizier = new Vizier({ registry, memory, counsel, router, analyzer: new TaskAnalyzer(), eventBus });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("Scenario 1: Research task → Guild → Counsel Layer", async () => {
    // 1. Kevin submits a research task
    const decision = vizier.analyzeTask({
      description: "Research quantum computing advances in 2026",
      project: "palace-ai",
    });

    // 2. Task routes to personal account (not sensitive)
    expect(decision.account).toBe("personal");
    expect(decision.correlationId).toBeDefined();

    // 3. Vizier matches task to Lord of Guild
    const courtier = vizier.matchCourtier("Research quantum computing advances");
    expect(courtier?.name).toBe("guild");

    // 4. Activate Guild
    vizier.activateCourtier("guild");
    expect(registry.get("guild")!.lifecycle.status).toBe("active");

    // 5. Guild produces result and submits to Counsel Layer
    const guildCaller = { name: "guild", security: { tierAccess: ["open_court" as const, "guarded" as const] } };
    await vizier.submitToCounsel({
      from: "guild",
      title: "Quantum Computing 2026 Findings",
      content: "Major advances in topological qubits reduced error rates by 10x.",
      tier: "open_court",
    }, guildCaller);

    // 6. Counsel Layer has the submission
    const counselItems = await counsel.list();
    expect(counselItems.length).toBe(1);
    expect(counselItems[0]!.l2).toContain("topological qubits");

    // 7. L0 summary is available for cheap scanning
    const summaries = await counsel.scanL0();
    expect(summaries.length).toBe(1);
    expect(summaries[0]!.length).toBeLessThanOrEqual(100);

    logger.info("Scenario 1 complete", { correlationId: decision.correlationId });
  });

  it("Scenario 2: Sensitive Novo task → Novo account routing", () => {
    const decision = vizier.analyzeTask({
      description: "Implement the Q2 compensation analysis pipeline for client ABC",
      project: "comp-strata",
      tags: ["novo"],
    });

    expect(decision.account).toBe("novo");
    expect(decision.providerId).toBe("claude-novo");
    expect(decision.model).toBe("claude-sonnet-4-6"); // implementation → sonnet
  });

  it("Scenario 3: Obsidian daily note → Memory → Chaplain trigger", async () => {
    // 1. Kevin writes a daily note in Obsidian
    await writeFile(`${VAULT_DIR}/Daily Notes/2026-04-03.md`, [
      "---",
      "date: 2026-04-03",
      "tags: [reflection, palace]",
      "---",
      "",
      "Thinking about how agents should communicate deterministically.",
      "The court metaphor feels right — structured interaction, not chat.",
    ].join("\n"));

    // 2. Obsidian reader picks it up
    const reader = new ObsidianReader(VAULT_DIR);
    const note = await reader.readDailyNote("2026-04-03");
    expect(note).toBeDefined();
    expect(note!.content).toContain("deterministically");

    // 3. Convert to Palace memory
    const palaceInput = reader.toPalaceMemory(note!, "inner_chamber");
    expect(palaceInput.uri).toContain("palace://user/obsidian/");
    expect(palaceInput.tier).toBe("inner_chamber");

    // 4. Write to memory (as system — no caller restriction for vault ingestion)
    const item = await memory.write(palaceInput);
    expect(item.l0.length).toBeLessThanOrEqual(100);
    expect(item.l2).toContain("court metaphor");

    // 5. Chaplain (has inner_chamber access) can read it
    const chaplainCaller = { name: "chaplain", security: { tierAccess: ["open_court" as const, "inner_chamber" as const] } };
    const retrieved = await memory.read(palaceInput.uri, chaplainCaller);
    expect(retrieved).toBeDefined();
    expect(retrieved!.tier).toBe("inner_chamber");

    // 6. Herald (only open_court) CANNOT read it
    const heraldCaller = { name: "herald", security: { tierAccess: ["open_court" as const] } };
    await expect(
      memory.read(palaceInput.uri, heraldCaller),
    ).rejects.toThrow(TierAccessDeniedError);
  });

  it("Scenario 4: Security config validates correctly", async () => {
    const yaml = await readFile("config/security/tiers.yaml", "utf-8");
    const config = parseSecurityConfig(yaml);
    const validation = validateSecurityConfig(config);

    expect(validation.valid).toBe(true);
    expect(config.tiers.crown_jewels.access).toBe("none");
  });

  it("Scenario 5: Event bus captures full workflow events", async () => {
    const events: string[] = [];
    eventBus.onAll((e) => { events.push(e.type); });

    // Activate a courtier
    vizier.activateCourtier("herald");

    // Route a task
    vizier.analyzeTask({ description: "Prepare daily brief", project: "personal" });

    // Should have: 2 transition events (dormant→activating, activating→active) + 1 task_routed
    expect(events).toContain("courtier:transition");
    expect(events).toContain("vizier:task_routed");
    expect(events.length).toBe(3);
  });

  it("Scenario 6: All Phase 1 courtiers can be activated", () => {
    for (const name of ["herald", "guild", "chaplain"]) {
      vizier.activateCourtier(name);
      expect(registry.get(name)!.lifecycle.status).toBe("active");
    }

    const active = registry.byStatus("active");
    expect(active.length).toBe(3);
  });

  it("Scenario 7: Crown Jewels are inaccessible to ALL agents", () => {
    const vizierIdentity = { name: "vizier", security: { tierAccess: ["inner_chamber" as const, "guarded" as const, "open_court" as const] } };
    expect(canAccess(vizierIdentity, "crown_jewels")).toBe(false);

    const chaplainIdentity = { name: "chaplain", security: { tierAccess: ["open_court" as const, "inner_chamber" as const] } };
    expect(canAccess(chaplainIdentity, "crown_jewels")).toBe(false);
  });

  it("Scenario 8: Budget tracking across accounts", () => {
    // Simulate work done
    router.recordUsage("personal", { inputTokens: 5000, outputTokens: 2000 });
    router.recordUsage("novo", { inputTokens: 8000, outputTokens: 3500 });
    router.recordUsage("personal", { inputTokens: 3000, outputTokens: 1000 });

    expect(router.getUsage("personal").inputTokens).toBe(8000);
    expect(router.getUsage("novo").inputTokens).toBe(8000);

    const all = router.getAllUsage();
    expect(Object.keys(all).length).toBe(2);
  });
});
