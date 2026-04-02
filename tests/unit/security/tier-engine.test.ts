import { describe, it, expect } from "vitest";
import { checkTierAccess, canAccess, TIER_HIERARCHY } from "@palace/security/tier-engine.ts";
import type { SecurityTier, CourtierConfig } from "@palace/types.ts";

/** Helper to build a minimal courtier for access testing */
function courtier(name: string, tierAccess: SecurityTier[]): Pick<CourtierConfig, "name" | "security"> {
  return {
    name,
    security: {
      tierAccess,
      writeScope: "own_workspace",
      auditLevel: "standard",
    },
  };
}

describe("TIER_HIERARCHY", () => {
  it("contains all 6 tiers in order", () => {
    expect(TIER_HIERARCHY).toEqual([
      "crown_jewels",
      "inner_chamber",
      "guarded",
      "open_court",
      "sandlot",
      "diplomatic_pouch",
    ]);
  });

  it("has crown_jewels as most restrictive (index 0)", () => {
    expect(TIER_HIERARCHY[0]).toBe("crown_jewels");
  });
});

describe("checkTierAccess", () => {
  it("returns true when tier is in access list", () => {
    expect(checkTierAccess(["open_court", "inner_chamber"], "open_court")).toBe(true);
  });

  it("returns false when tier is NOT in access list", () => {
    expect(checkTierAccess(["open_court"], "inner_chamber")).toBe(false);
  });

  it("returns false for empty access list", () => {
    expect(checkTierAccess([], "open_court")).toBe(false);
  });
});

describe("canAccess", () => {
  it("crown_jewels: NO agent can access, not even vizier", () => {
    const vizier = courtier("vizier", ["crown_jewels", "inner_chamber", "guarded", "open_court"]);
    expect(canAccess(vizier, "crown_jewels")).toBe(false);
  });

  it("inner_chamber: only named courtiers with explicit access", () => {
    const chaplain = courtier("chaplain", ["open_court", "inner_chamber"]);
    const herald = courtier("herald", ["open_court"]);

    expect(canAccess(chaplain, "inner_chamber")).toBe(true);
    expect(canAccess(herald, "inner_chamber")).toBe(false);
  });

  it("guarded: only courtiers with guarded access", () => {
    const guild = courtier("guild", ["open_court", "guarded"]);
    const chaplain = courtier("chaplain", ["open_court", "inner_chamber"]);

    expect(canAccess(guild, "guarded")).toBe(true);
    expect(canAccess(chaplain, "guarded")).toBe(false);
  });

  it("open_court: any courtier with open_court access", () => {
    const herald = courtier("herald", ["open_court"]);
    expect(canAccess(herald, "open_court")).toBe(true);
  });

  it("sandlot: only sandbox agents", () => {
    const sandbox = courtier("openclaw", ["sandlot"]);
    const herald = courtier("herald", ["open_court"]);

    expect(canAccess(sandbox, "sandlot")).toBe(true);
    expect(canAccess(herald, "sandlot")).toBe(false);
  });

  it("diplomatic_pouch: only courtiers with explicit access", () => {
    const ambassador = courtier("ambassador", ["open_court", "diplomatic_pouch"]);
    const chaplain = courtier("chaplain", ["open_court", "inner_chamber"]);

    expect(canAccess(ambassador, "diplomatic_pouch")).toBe(true);
    expect(canAccess(chaplain, "diplomatic_pouch")).toBe(false);
  });
});
