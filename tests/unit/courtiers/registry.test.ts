import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { CourtierRegistry } from "@palace/courtiers/registry.ts";
import { parseCourtierConfig } from "@palace/courtiers/config-parser.ts";

async function loadCourtier(name: string) {
  const yaml = await readFile(`config/courtiers/${name}.yaml`, "utf-8");
  return parseCourtierConfig(yaml);
}

describe("CourtierRegistry", () => {
  it("starts empty", () => {
    const registry = new CourtierRegistry();
    expect(registry.size).toBe(0);
    expect(registry.list()).toEqual([]);
  });

  it("registers a courtier", async () => {
    const registry = new CourtierRegistry();
    const herald = await loadCourtier("herald");

    registry.register(herald);

    expect(registry.size).toBe(1);
    expect(registry.get("herald")).toBeDefined();
    expect(registry.get("herald")!.config.name).toBe("herald");
  });

  it("prevents duplicate registration", async () => {
    const registry = new CourtierRegistry();
    const herald = await loadCourtier("herald");

    registry.register(herald);
    expect(() => registry.register(herald)).toThrow("already registered");
  });

  it("registers multiple courtiers", async () => {
    const registry = new CourtierRegistry();
    const [herald, guild, chaplain] = await Promise.all([
      loadCourtier("herald"),
      loadCourtier("guild"),
      loadCourtier("chaplain"),
    ]);

    registry.register(herald);
    registry.register(guild);
    registry.register(chaplain);

    expect(registry.size).toBe(3);
  });

  it("filters by status", async () => {
    const registry = new CourtierRegistry();
    const [herald, guild, chaplain] = await Promise.all([
      loadCourtier("herald"),
      loadCourtier("guild"),
      loadCourtier("chaplain"),
    ]);

    registry.register(herald);
    registry.register(guild);
    registry.register(chaplain);

    // All start as dormant
    const dormant = registry.byStatus("dormant");
    expect(dormant.length).toBe(3);

    const active = registry.byStatus("active");
    expect(active.length).toBe(0);
  });

  it("transitions a courtier's status", async () => {
    const registry = new CourtierRegistry();
    const herald = await loadCourtier("herald");
    registry.register(herald);

    registry.transition("herald", "activating");
    expect(registry.get("herald")!.lifecycle.status).toBe("activating");

    registry.transition("herald", "active");
    expect(registry.get("herald")!.lifecycle.status).toBe("active");

    const active = registry.byStatus("active");
    expect(active.length).toBe(1);
    expect(active[0]!.config.name).toBe("herald");
  });

  it("throws on transition of unknown courtier", () => {
    const registry = new CourtierRegistry();
    expect(() => registry.transition("ghost", "active")).toThrow("not found");
  });

  it("returns undefined for unknown courtier", () => {
    const registry = new CourtierRegistry();
    expect(registry.get("nonexistent")).toBeUndefined();
  });
});
