import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "fs/promises";
import { PalaceMemory } from "@palace/memory/memory.ts";
import { CounselLayer } from "@palace/memory/counsel.ts";
import { TierAccessDeniedError, UnauthorizedCounselError, PathTraversalError } from "@palace/errors/palace-errors.ts";
import { parsePalaceUri } from "@palace/memory/uri.ts";
import type { CallerIdentity } from "@palace/memory/memory.ts";

const TEST_DIR = ".test-enforcement";

function caller(name: string, tiers: string[]): CallerIdentity {
  return { name, security: { tierAccess: tiers as any } };
}

describe("Tier Enforcement on Memory", () => {
  let memory: PalaceMemory;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    memory = new PalaceMemory(TEST_DIR);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("allows write when caller has tier access", async () => {
    const chaplain = caller("chaplain", ["open_court", "inner_chamber"]);
    const item = await memory.write(
      { uri: "palace://court/chaplain/thought", tier: "inner_chamber", content: "Deep thought." },
      chaplain,
    );
    expect(item.tier).toBe("inner_chamber");
  });

  it("denies write when caller lacks tier access", async () => {
    const herald = caller("herald", ["open_court"]);
    await expect(
      memory.write(
        { uri: "palace://court/herald/secret", tier: "inner_chamber", content: "Shouldn't work." },
        herald,
      ),
    ).rejects.toThrow(TierAccessDeniedError);
  });

  it("always denies crown_jewels writes", async () => {
    const vizier = caller("vizier", ["inner_chamber", "guarded", "open_court"]);
    await expect(
      memory.write(
        { uri: "palace://court/vizier/keys", tier: "crown_jewels", content: "API keys" },
        vizier,
      ),
    ).rejects.toThrow(TierAccessDeniedError);
  });

  it("allows read when caller has tier access", async () => {
    // Write without caller (system write)
    await memory.write({ uri: "palace://court/guild/research", tier: "open_court", content: "Research." });

    const guild = caller("guild", ["open_court", "guarded"]);
    const item = await memory.read("palace://court/guild/research", guild);
    expect(item).toBeDefined();
  });

  it("denies read when caller lacks tier access", async () => {
    // Write an inner_chamber item (system write)
    await memory.write({ uri: "palace://court/chaplain/private", tier: "inner_chamber", content: "Private." });

    const herald = caller("herald", ["open_court"]);
    await expect(
      memory.read("palace://court/chaplain/private", herald),
    ).rejects.toThrow(TierAccessDeniedError);
  });

  it("filters list results by caller tier access", async () => {
    await memory.write({ uri: "palace://court/data/public", tier: "open_court", content: "Public." });
    await memory.write({ uri: "palace://court/data/private", tier: "inner_chamber", content: "Private." });

    const herald = caller("herald", ["open_court"]);
    const items = await memory.list("court", herald);

    expect(items.length).toBe(1);
    expect(items[0]!.tier).toBe("open_court");
  });

  it("allows unchecked access when no caller provided (system operations)", async () => {
    await memory.write({ uri: "palace://court/system/data", tier: "inner_chamber", content: "System." });
    const item = await memory.read("palace://court/system/data");
    expect(item).toBeDefined();
  });
});

describe("Counsel Layer Authorization", () => {
  let memory: PalaceMemory;
  let counsel: CounselLayer;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    memory = new PalaceMemory(TEST_DIR);
    counsel = new CounselLayer(memory);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("allows submission when caller matches from field", async () => {
    const guild = caller("guild", ["open_court"]);
    const item = await counsel.submit(
      { from: "guild", title: "Finding", content: "Result.", tier: "open_court" },
      guild,
    );
    expect(item).toBeDefined();
  });

  it("denies submission when caller doesn't match from field", async () => {
    const herald = caller("herald", ["open_court"]);
    await expect(
      counsel.submit(
        { from: "vizier", title: "Fake", content: "Impersonation.", tier: "open_court" },
        herald,
      ),
    ).rejects.toThrow(UnauthorizedCounselError);
  });
});

describe("Path Traversal Prevention", () => {
  it("blocks .. in URI path", () => {
    expect(() => parsePalaceUri("palace://counsel/../../etc/passwd")).toThrow(PathTraversalError);
  });

  it("blocks .. at start of path", () => {
    expect(() => parsePalaceUri("palace://court/../secret")).toThrow(PathTraversalError);
  });

  it("allows normal paths", () => {
    const uri = parsePalaceUri("palace://court/chaplain/drafts/essay");
    expect(uri.path).toBe("chaplain/drafts/essay");
  });
});
