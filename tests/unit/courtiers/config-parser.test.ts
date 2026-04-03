import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { parseCourtierConfig, validateCourtierConfig } from "@palace/courtiers/config-parser.ts";

describe("parseCourtierConfig", () => {
  it("parses herald config", async () => {
    const yaml = await readFile("config/courtiers/herald.yaml", "utf-8");
    const config = parseCourtierConfig(yaml);

    expect(config.name).toBe("herald");
    expect(config.displayName).toBe("The Herald/Chamberlain");
    expect(config.domain.primary).toContain("Daily preparation");
    expect(config.security.tierAccess).toEqual(["open_court"]);
    expect(config.accountScope).toBe("personal");
    expect(config.status).toBe("dormant");
    expect(config.activatedInPhase).toBe(1);
  });

  it("parses guild config with multiple tier access", async () => {
    const yaml = await readFile("config/courtiers/guild.yaml", "utf-8");
    const config = parseCourtierConfig(yaml);

    expect(config.name).toBe("guild");
    expect(config.security.tierAccess).toEqual(["open_court", "guarded"]);
    expect(config.canUseAccounts).toContain("personal");
    expect(config.canUseAccounts).toContain("novo");
  });

  it("parses chaplain config with inner_chamber access", async () => {
    const yaml = await readFile("config/courtiers/chaplain.yaml", "utf-8");
    const config = parseCourtierConfig(yaml);

    expect(config.name).toBe("chaplain");
    expect(config.security.tierAccess).toContain("inner_chamber");
    expect(config.modelPreference.deepWork).toBe("opus");
  });

  it("preserves all model preferences", async () => {
    const yaml = await readFile("config/courtiers/herald.yaml", "utf-8");
    const config = parseCourtierConfig(yaml);

    expect(config.modelPreference.default).toBe("haiku");
    expect(config.modelPreference.deepWork).toBe("sonnet");
    expect(config.modelPreference.quick).toBe("haiku");
  });

  it("parses persona with cognitive techniques", async () => {
    const yaml = await readFile("config/courtiers/guild.yaml", "utf-8");
    const config = parseCourtierConfig(yaml);

    expect(config.persona.traits.length).toBeGreaterThan(0);
    expect(config.persona.communicationStyle).toBeDefined();
    expect(config.persona.cognitiveTechniques.length).toBeGreaterThan(0);
    expect(config.persona.challengeBehavior).toBeDefined();
    expect(config.persona.cognitiveTechniques.some((t: string) => t.includes("Socratic"))).toBe(true);
  });

  it("preserves operation triggers", async () => {
    const yaml = await readFile("config/courtiers/chaplain.yaml", "utf-8");
    const config = parseCourtierConfig(yaml);

    expect(config.operations.heartbeat).toBe("daily");
    expect(config.operations.triggers).toContain("new_obsidian_daily_note");
    expect(config.operations.triggers).toContain("research_output_from_guild");
  });
});

describe("validateCourtierConfig", () => {
  it("validates a well-formed config", async () => {
    const yaml = await readFile("config/courtiers/herald.yaml", "utf-8");
    const config = parseCourtierConfig(yaml);
    const result = validateCourtierConfig(config);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects config missing name", () => {
    const config = {
      name: "",
      displayName: "Test",
      description: "Test",
      domain: { primary: "test", keywords: [] },
      persona: { traits: ["test"], communicationStyle: "direct", cognitiveTechniques: ["testing"], challengeBehavior: "push back" },
      security: { tierAccess: ["open_court" as const], writeScope: "own", auditLevel: "standard" as const },
      operations: { heartbeat: "daily", triggers: [], outputs: [] },
      modelPreference: { default: "sonnet", deepWork: "opus", quick: "haiku" },
      accountScope: "personal",
      canUseAccounts: ["personal"],
      status: "dormant" as const,
      activatedInPhase: 1,
    };

    const result = validateCourtierConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("name"))).toBe(true);
  });

  it("rejects config with empty tier access", () => {
    const config = {
      name: "test",
      displayName: "Test",
      description: "Test",
      domain: { primary: "test", keywords: [] },
      persona: { traits: ["test"], communicationStyle: "direct", cognitiveTechniques: ["testing"], challengeBehavior: "push back" },
      security: { tierAccess: [] as const, writeScope: "own", auditLevel: "standard" as const },
      operations: { heartbeat: "daily", triggers: [], outputs: [] },
      modelPreference: { default: "sonnet", deepWork: "opus", quick: "haiku" },
      accountScope: "personal",
      canUseAccounts: ["personal"],
      status: "dormant" as const,
      activatedInPhase: 1,
    };

    const result = validateCourtierConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("tier access"))).toBe(true);
  });
});
