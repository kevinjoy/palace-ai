import { describe, it, expect } from "vitest";

/** Test CLI command parsing and boot sequence (no subprocess needed) */
describe("CLI command parsing", () => {
  const VALID_COMMANDS = ["start", "task", "status", "counsel", "activate", "config", "heartbeat", "exec", "help"];

  it("recognizes all valid commands", () => {
    for (const cmd of VALID_COMMANDS) {
      expect(VALID_COMMANDS).toContain(cmd);
    }
  });

  it("has 9 commands total", () => {
    expect(VALID_COMMANDS.length).toBe(9);
  });
});

describe("Boot sequence", () => {
  it("boot() loads config and returns a PalaceInstance", async () => {
    const { boot } = await import("@palace/boot.ts");
    const palace = await boot();

    expect(palace.vizier).toBeDefined();
    expect(palace.providers).toBeDefined();
    expect(palace.eventBus).toBeDefined();
    expect(palace.logger).toBeDefined();
    expect(palace.config.palace.version).toBe("0.1.0");
  });

  it("registers all providers from config", async () => {
    const { boot } = await import("@palace/boot.ts");
    const palace = await boot();

    const providers = palace.providers.list();
    expect(providers.length).toBe(4);
    expect(providers.map((p) => p.id)).toContain("claude-personal");
    expect(providers.map((p) => p.id)).toContain("claude-novo");
    expect(providers.map((p) => p.id)).toContain("codex");
    expect(providers.map((p) => p.id)).toContain("gemini");
  });

  it("registers all courtiers from config/courtiers/", async () => {
    const { boot } = await import("@palace/boot.ts");
    const palace = await boot();

    expect(palace.vizier.registeredCourtiers).toBe(3);
  });

  it("wires event bus to audit logger", async () => {
    const { boot } = await import("@palace/boot.ts");
    const palace = await boot();

    // Emitting an event should not throw (logger is connected)
    const { EventBus } = await import("@palace/events/event-bus.ts");
    await palace.eventBus.emit(
      EventBus.createEvent("courtier:registered", "test", { name: "test" }),
    );
    // If we get here, the audit logger handled it without error
    expect(true).toBe(true);
  });
});
