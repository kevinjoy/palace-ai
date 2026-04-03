/**
 * Tests for Vizier.dispatch() — the full task execution pipeline.
 * Uses a mock provider to avoid real LLM calls in unit tests.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile } from "fs/promises";

import { Vizier } from "@palace/vizier/vizier.ts";
import { CourtierRegistry } from "@palace/courtiers/registry.ts";
import { PalaceMemory } from "@palace/memory/memory.ts";
import { CounselLayer } from "@palace/memory/counsel.ts";
import { TokenRouter } from "@palace/routing/router.ts";
import { TaskAnalyzer } from "@palace/routing/analyzer.ts";
import { EventBus } from "@palace/events/event-bus.ts";
import { ProviderRegistry } from "@palace/providers/registry.ts";
import { parseCourtierConfig } from "@palace/courtiers/config-parser.ts";
import type { Provider, ProviderTask, ProviderResult, ProviderStatus, ModelInfo } from "@palace/providers/provider.ts";

const TEST_DIR = ".test-dispatch";

/** Mock provider that returns a deterministic response */
class MockProvider implements Provider {
  readonly id: string;
  readonly calls: ProviderTask[] = [];

  constructor(id: string) {
    this.id = id;
  }

  async execute(task: ProviderTask): Promise<ProviderResult> {
    this.calls.push(task);
    return {
      content: `Mock response to: ${task.prompt.slice(0, 50)}`,
      usage: { inputTokens: 100, outputTokens: 50 },
      model: "mock-model",
      providerId: this.id,
      durationMs: 42,
    };
  }

  async status(): Promise<ProviderStatus> {
    return { available: true, remainingCapacity: null, lastChecked: new Date().toISOString() };
  }

  async models(): Promise<readonly ModelInfo[]> {
    return [{ id: "mock-model", name: "Mock", provider: this.id, contextWindow: 100000, supportsTools: false, supportsStreaming: false, tier: "implementation" }];
  }
}

async function loadCourtier(name: string) {
  const yaml = await readFile(`config/courtiers/${name}.yaml`, "utf-8");
  return parseCourtierConfig(yaml);
}

describe("Vizier.dispatch", () => {
  let vizier: Vizier;
  let registry: CourtierRegistry;
  let memory: PalaceMemory;
  let counsel: CounselLayer;
  let router: TokenRouter;
  let eventBus: EventBus;
  let providerRegistry: ProviderRegistry;
  let mockPersonal: MockProvider;
  let mockNovo: MockProvider;

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

    mockPersonal = new MockProvider("claude-personal");
    mockNovo = new MockProvider("claude-novo");
    providerRegistry.register(mockPersonal);
    providerRegistry.register(mockNovo);

    const [herald, guild, chaplain] = await Promise.all([
      loadCourtier("herald"),
      loadCourtier("guild"),
      loadCourtier("chaplain"),
    ]);
    registry.register(herald);
    registry.register(guild);
    registry.register(chaplain);

    vizier = new Vizier({
      registry, memory, counsel, router,
      analyzer: new TaskAnalyzer(),
      eventBus,
      providers: providerRegistry,
    });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("dispatches a task end-to-end: analyze → route → execute → store", async () => {
    const result = await vizier.dispatch({
      description: "Research the latest quantum computing advances",
      project: "palace-ai",
    });

    expect(result.content).toContain("Mock response");
    expect(result.decision.account).toBe("personal");
    expect(result.courtier?.name).toBe("guild");
    expect(result.decision.correlationId).toBeDefined();
  });

  it("stores result in Counsel Layer", async () => {
    await vizier.dispatch({
      description: "Research agent memory architectures",
      project: "palace-ai",
    });

    const items = await counsel.list();
    expect(items.length).toBe(1);
    expect(items[0]!.l2).toContain("Mock response");
  });

  it("tracks token usage on the router", async () => {
    await vizier.dispatch({
      description: "Write a function to parse YAML",
      project: "palace-ai",
    });

    const usage = router.getUsage("personal");
    expect(usage.inputTokens).toBe(100);
    expect(usage.outputTokens).toBe(50);
  });

  it("routes sensitive tasks to Novo provider", async () => {
    await vizier.dispatch({
      description: "Implement the compensation analysis for client data",
      project: "comp-strata",
      tags: ["novo"],
    });

    expect(mockNovo.calls.length).toBe(1);
    expect(mockPersonal.calls.length).toBe(0);
  });

  it("injects courtier context into the provider prompt", async () => {
    await vizier.dispatch({
      description: "Research quantum computing advances",
      project: "palace-ai",
    });

    expect(mockPersonal.calls.length).toBe(1);
    const call = mockPersonal.calls[0]!;
    // System prompt should contain courtier identity
    expect(call.systemPrompt).toContain("Lord of Guild");
  });

  it("emits task_completed event with result", async () => {
    const events: string[] = [];
    eventBus.on("vizier:task_completed", () => { events.push("completed"); });

    await vizier.dispatch({
      description: "Research something",
      project: "palace-ai",
    });

    expect(events).toContain("completed");
  });

  it("handles tasks with no matching courtier (Vizier handles directly)", async () => {
    const result = await vizier.dispatch({
      description: "Play some relaxing music",
      project: "personal",
    });

    // No courtier match, but task still executes via provider
    expect(result.content).toContain("Mock response");
    expect(result.courtier).toBeNull();
  });

  it("returns full dispatch result with timing", async () => {
    const result = await vizier.dispatch({
      description: "Prepare the daily brief",
      project: "personal",
    });

    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.decision).toBeDefined();
    expect(result.providerResult).toBeDefined();
    expect(result.providerResult.durationMs).toBe(42);
  });
});
