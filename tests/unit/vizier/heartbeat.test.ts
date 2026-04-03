/**
 * Unit Test: Vizier Heartbeat
 *
 * Tests the heartbeat logic extracted into Vizier.heartbeat():
 * - Activates dormant courtiers
 * - Gathers recent Counsel Layer context (L0 summaries)
 * - Builds a context-injected prompt with courtier role + counsel context
 * - Dispatches via the provider pipeline
 * - Returns a full DispatchResult
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdir, rm } from "fs/promises";
import { Vizier, type DispatchResult } from "@palace/vizier/vizier.ts";
import { CourtierRegistry } from "@palace/courtiers/registry.ts";
import { PalaceMemory } from "@palace/memory/memory.ts";
import { CounselLayer } from "@palace/memory/counsel.ts";
import { TokenRouter } from "@palace/routing/router.ts";
import { TaskAnalyzer } from "@palace/routing/analyzer.ts";
import { EventBus } from "@palace/events/event-bus.ts";
import { ProviderRegistry } from "@palace/providers/registry.ts";
import type { Provider, ProviderResult, ProviderTask } from "@palace/providers/provider.ts";
import type { CourtierConfig } from "@palace/types.ts";

const TEST_DIR = ".test-heartbeat";

/** Create a minimal CourtierConfig for testing */
function makeCourtierConfig(overrides: Partial<CourtierConfig> = {}): CourtierConfig {
  return {
    name: "guild",
    displayName: "The Lord of Guild",
    description: "Research projects, sub-guildmaster coordination",
    domain: {
      primary: "Research orchestration, investigation, analysis",
      keywords: ["research", "investigate", "analyze", "study", "explore"],
    },
    persona: {
      traits: [
        "Deep curiosity with systematic rigor",
        "Synthesizes across disciplines",
      ],
      communicationStyle: "Structured and evidence-based. Presents findings hierarchically.",
      cognitiveTechniques: [
        "Literature review methodology",
        "Cross-domain synthesis",
      ],
      challengeBehavior: "Pushes back on surface-level analysis. Demands primary sources.",
    },
    security: {
      tierAccess: ["open_court", "guarded"],
      writeScope: "own_workspace + counsel_layer",
      auditLevel: "standard",
    },
    operations: {
      heartbeat: "daily",
      triggers: ["research_request", "user_request"],
      outputs: ["research_reports", "counsel_submissions"],
    },
    modelPreference: {
      default: "sonnet",
      deepWork: "opus",
      quick: "haiku",
    },
    accountScope: "personal",
    canUseAccounts: ["personal"],
    status: "dormant",
    activatedInPhase: 1,
    ...overrides,
  };
}

/** Create a mock provider that captures the prompt it receives */
function createMockProvider(id: string): Provider & { lastTask: ProviderTask | null } {
  const mock: Provider & { lastTask: ProviderTask | null } = {
    id,
    lastTask: null,
    async execute(task: ProviderTask): Promise<ProviderResult> {
      mock.lastTask = task;
      return {
        content: "Mock heartbeat response: Guild has reviewed court activity and found no urgent items.",
        usage: { inputTokens: 150, outputTokens: 80 },
        model: "claude-sonnet-4-6",
        providerId: id,
        durationMs: 42,
      };
    },
    async status() {
      return { available: true, remainingCapacity: null, lastChecked: new Date().toISOString() };
    },
    async models() {
      return [];
    },
  };
  return mock;
}

describe("Vizier.heartbeat()", () => {
  let vizier: Vizier;
  let registry: CourtierRegistry;
  let memory: PalaceMemory;
  let counsel: CounselLayer;
  let router: TokenRouter;
  let eventBus: EventBus;
  let providerRegistry: ProviderRegistry;
  let mockProvider: ReturnType<typeof createMockProvider>;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });

    registry = new CourtierRegistry();
    memory = new PalaceMemory(TEST_DIR);
    counsel = new CounselLayer(memory);
    router = new TokenRouter({
      accounts: {
        personal: { providers: ["claude-personal"] },
        novo: { providers: ["claude-novo"] },
      },
      defaultAccount: "personal",
      modelMapping: { opus: "claude-opus-4-6", sonnet: "claude-sonnet-4-6", haiku: "claude-haiku-4-5" },
    });
    eventBus = new EventBus();
    providerRegistry = new ProviderRegistry();
    mockProvider = createMockProvider("claude-personal");
    providerRegistry.register(mockProvider);

    // Register a test courtier
    registry.register(makeCourtierConfig());

    vizier = new Vizier({
      registry,
      memory,
      counsel,
      router,
      analyzer: new TaskAnalyzer(),
      eventBus,
      providers: providerRegistry,
    });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("throws if courtier is not found", async () => {
    await expect(vizier.heartbeat("nonexistent")).rejects.toThrow(/not found/i);
  });

  it("activates a dormant courtier before dispatching", async () => {
    expect(registry.get("guild")!.lifecycle.status).toBe("dormant");

    await vizier.heartbeat("guild");

    expect(registry.get("guild")!.lifecycle.status).toBe("active");
  });

  it("does not re-activate an already active courtier", async () => {
    // Manually activate first
    vizier.activateCourtier("guild");
    expect(registry.get("guild")!.lifecycle.status).toBe("active");

    // Heartbeat should not throw or break
    const result = await vizier.heartbeat("guild");
    expect(result).toBeDefined();
    expect(registry.get("guild")!.lifecycle.status).toBe("active");
  });

  it("gathers counsel context and includes L0 summaries in the prompt", async () => {
    // Seed the Counsel Layer with items
    const systemCaller = { name: "guild", security: { tierAccess: ["open_court" as const] } };
    await counsel.submit({
      from: "guild",
      title: "Research on agent memory",
      content: "OpenViking L0/L1/L2 tiering provides 83-96% token savings over full context loading.",
      tier: "open_court",
    }, systemCaller);
    await counsel.submit({
      from: "guild",
      title: "Quantum computing findings",
      content: "Topological qubits reduced error rates by 10x in 2026 lab results.",
      tier: "open_court",
    }, systemCaller);

    await vizier.heartbeat("guild");

    // The prompt sent to the provider should contain counsel L0 summaries
    expect(mockProvider.lastTask).not.toBeNull();
    const prompt = mockProvider.lastTask!.prompt;
    expect(prompt).toContain("OpenViking");
    expect(prompt).toContain("Topological");
  });

  it("builds a prompt that includes the courtier's domain for routing", async () => {
    await vizier.heartbeat("guild");

    const prompt = mockProvider.lastTask!.prompt;
    // Domain in title line enables matchCourtier routing
    expect(prompt).toContain("Research orchestration");
  });

  it("builds a prompt with a heartbeat directive", async () => {
    await vizier.heartbeat("guild");

    const prompt = mockProvider.lastTask!.prompt;
    expect(prompt).toContain("Review the court");
    expect(prompt).toContain("identify anything that needs attention");
  });

  it("limits counsel context to 5 most recent items", async () => {
    const systemCaller = { name: "guild", security: { tierAccess: ["open_court" as const] } };
    // Seed 7 counsel items
    for (let i = 0; i < 7; i++) {
      await counsel.submit({
        from: "guild",
        title: `Item ${i}`,
        content: `Content for item number ${i} with unique marker ITEM_${i}.`,
        tier: "open_court",
      }, systemCaller);
    }

    await vizier.heartbeat("guild");

    const prompt = mockProvider.lastTask!.prompt;
    // Should have at most 5 items referenced. The oldest 2 should be excluded.
    // Count how many "ITEM_" references appear — allow up to 5
    const itemRefs = (prompt.match(/Content for item/g) || []).length;
    expect(itemRefs).toBeLessThanOrEqual(5);
  });

  it("returns a DispatchResult with content, decision, and timing", async () => {
    const result = await vizier.heartbeat("guild");

    expect(result.content).toContain("Mock heartbeat response");
    expect(result.decision.account).toBe("personal");
    expect(result.decision.providerId).toBe("claude-personal");
    expect(result.courtier?.name).toBe("guild");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.providerResult.usage.inputTokens).toBe(150);
  });

  it("stores the heartbeat result in the Counsel Layer", async () => {
    await vizier.heartbeat("guild");

    const items = await counsel.list();
    expect(items.length).toBeGreaterThanOrEqual(1);
    // The latest item should contain the mock response
    const latest = items[items.length - 1]!;
    expect(latest.l2).toContain("Mock heartbeat response");
  });

  it("emits events for the heartbeat lifecycle", async () => {
    const events: string[] = [];
    eventBus.onAll((e) => { events.push(e.type); });

    await vizier.heartbeat("guild");

    // Should emit: courtier transitions (dormant→activating, activating→active),
    // task routed, provider started, task completed
    expect(events).toContain("courtier:transition");
    expect(events).toContain("vizier:task_routed");
    expect(events).toContain("vizier:task_completed");
  });
});
