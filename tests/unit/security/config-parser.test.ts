import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { parseSecurityConfig, validateSecurityConfig } from "@palace/security/config-parser.ts";

describe("parseSecurityConfig", () => {
  it("parses the default tiers.yaml", async () => {
    const yaml = await readFile("config/security/tiers.yaml", "utf-8");
    const config = parseSecurityConfig(yaml);

    expect(config.tiers).toBeDefined();
    expect(config.tiers.crown_jewels).toBeDefined();
    expect(config.tiers.inner_chamber).toBeDefined();
    expect(config.tiers.guarded).toBeDefined();
    expect(config.tiers.open_court).toBeDefined();
    expect(config.tiers.sandlot).toBeDefined();
    expect(config.tiers.diplomatic_pouch).toBeDefined();
  });

  it("crown_jewels has access: none", async () => {
    const yaml = await readFile("config/security/tiers.yaml", "utf-8");
    const config = parseSecurityConfig(yaml);

    expect(config.tiers.crown_jewels.access).toBe("none");
  });

  it("inner_chamber has named access list", async () => {
    const yaml = await readFile("config/security/tiers.yaml", "utf-8");
    const config = parseSecurityConfig(yaml);

    expect(Array.isArray(config.tiers.inner_chamber.access)).toBe(true);
    expect(config.tiers.inner_chamber.access).toContain("vizier");
    expect(config.tiers.inner_chamber.access).toContain("chaplain");
  });

  it("open_court has sync: git", async () => {
    const yaml = await readFile("config/security/tiers.yaml", "utf-8");
    const config = parseSecurityConfig(yaml);

    expect(config.tiers.open_court.sync).toBe("git");
  });
});

describe("validateSecurityConfig", () => {
  it("validates a complete config", async () => {
    const yaml = await readFile("config/security/tiers.yaml", "utf-8");
    const config = parseSecurityConfig(yaml);
    const result = validateSecurityConfig(config);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects config missing required tiers", () => {
    const config = {
      tiers: {
        crown_jewels: { paths: [], access: "none" as const, sync: "never" },
        // missing all other tiers
      },
    };

    const result = validateSecurityConfig(config as any);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e: string) => e.includes("inner_chamber"))).toBe(true);
  });

  it("rejects crown_jewels with non-none access", () => {
    const config = {
      tiers: {
        crown_jewels: { paths: [], access: ["vizier"], sync: "never" },
        inner_chamber: { paths: [], access: ["vizier"], sync: "selective" },
        guarded: { paths: [], access: ["vizier"], sync: "org-scoped" },
        open_court: { paths: [], access: "all_trusted", sync: "git" },
        sandlot: { paths: [], access: "sandbox_agents", sync: "copy_in" },
        diplomatic_pouch: { paths: [], access: "none", sync: "never" },
      },
    };

    const result = validateSecurityConfig(config as any);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("Crown jewels"))).toBe(true);
  });
});
