import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "fs/promises";
import { Vizier } from "@palace/vizier/vizier.ts";
import { CourtierRegistry } from "@palace/courtiers/registry.ts";
import { PalaceMemory } from "@palace/memory/memory.ts";
import { CounselLayer } from "@palace/memory/counsel.ts";
import { TokenRouter } from "@palace/routing/router.ts";
import { TaskAnalyzer } from "@palace/routing/analyzer.ts";
import { EventBus } from "@palace/events/event-bus.ts";
import { parseCourtierConfig } from "@palace/courtiers/config-parser.ts";
import { readFile } from "fs/promises";

const TEST_DIR = ".test-vizier";

async function loadCourtier(name: string) {
  const yaml = await readFile(`config/courtiers/${name}.yaml`, "utf-8");
  return parseCourtierConfig(yaml);
}

describe("Vizier", () => {
  let vizier: Vizier;
  let registry: CourtierRegistry;
  let memory: PalaceMemory;
  let counsel: CounselLayer;
  let router: TokenRouter;
  let eventBus: EventBus;

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

    // Register Phase 1 courtiers
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

  describe("initialization", () => {
    it("creates with all subsystems connected", () => {
      expect(vizier).toBeDefined();
      expect(vizier.registeredCourtiers).toBe(3);
    });
  });

  describe("task routing", () => {
    it("analyzes and routes a task to a routing decision", () => {
      const decision = vizier.analyzeTask({
        description: "Research quantum computing advances",
        project: "palace-ai",
      });

      expect(decision.account).toBe("personal");
      expect(decision.model).toBeDefined();
      expect(decision.correlationId).toBeDefined();
    });

    it("routes sensitive tasks to Novo account", () => {
      const decision = vizier.analyzeTask({
        description: "Analyze Q2 compensation data for client review",
        project: "comp-strata",
        tags: ["novo"],
      });

      expect(decision.account).toBe("novo");
    });

    it("selects appropriate courtier for research tasks", () => {
      const match = vizier.matchCourtier("Research the latest advances in agent memory architectures");
      expect(match?.name).toBe("guild");
    });

    it("selects herald for daily prep tasks", () => {
      const match = vizier.matchCourtier("Prepare the daily brief and todo list for today");
      expect(match?.name).toBe("herald");
    });

    it("selects chaplain for thinking/synthesis tasks", () => {
      const match = vizier.matchCourtier("Help me synthesize my reflections on intelligence into an essay");
      expect(match?.name).toBe("chaplain");
    });

    it("returns null when no courtier matches", () => {
      const match = vizier.matchCourtier("Play some music");
      // Fool/Librarian is not registered in Phase 1
      expect(match).toBeNull();
    });
  });

  describe("event emission", () => {
    it("emits task_routed event on analyzeTask", () => {
      const events: string[] = [];
      eventBus.on("vizier:task_routed", () => { events.push("routed"); });

      vizier.analyzeTask({
        description: "Research something",
        project: "palace-ai",
      });

      // Events are sync in this case
      expect(events.length).toBe(1);
    });
  });

  describe("counsel integration", () => {
    it("can submit to counsel layer on behalf of a courtier", async () => {
      const guildCaller = { name: "guild", security: { tierAccess: ["open_court" as const, "guarded" as const] } };

      await vizier.submitToCounsel({
        from: "guild",
        title: "Research Complete",
        content: "Found significant patterns in OpenViking architecture.",
        tier: "open_court",
      }, guildCaller);

      const items = await counsel.list();
      expect(items.length).toBe(1);
    });
  });

  describe("courtier activation", () => {
    it("activates a dormant courtier through full lifecycle", () => {
      // Herald starts dormant
      expect(registry.get("herald")!.lifecycle.status).toBe("dormant");

      vizier.activateCourtier("herald");

      expect(registry.get("herald")!.lifecycle.status).toBe("active");
    });

    it("emits transition events during activation", () => {
      const transitions: string[] = [];
      eventBus.on("courtier:transition", (e) => {
        transitions.push(JSON.stringify(e.payload));
      });

      vizier.activateCourtier("guild");

      // dormant → activating → active = 2 transitions
      expect(transitions.length).toBe(2);
    });
  });
});
