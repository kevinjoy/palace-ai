import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile } from "fs/promises";
import { PalaceMemory } from "@palace/memory/memory.ts";

const TEST_DIR = ".test-memory";

describe("PalaceMemory", () => {
  let memory: PalaceMemory;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    memory = new PalaceMemory(TEST_DIR);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("write", () => {
    it("writes a memory item with L0/L1/L2 tiers", async () => {
      await memory.write({
        uri: "palace://court/chaplain/drafts/test-essay",
        tier: "open_court",
        content: "This is a detailed essay about intelligence and consciousness that explores multiple dimensions of the topic across several thousand words of analysis.",
      });

      const item = await memory.read("palace://court/chaplain/drafts/test-essay");
      expect(item).toBeDefined();
      expect(item!.uri).toBe("palace://court/chaplain/drafts/test-essay");
      expect(item!.tier).toBe("open_court");
      expect(item!.l2).toContain("detailed essay about intelligence");
    });

    it("auto-generates L0 summary (<100 chars)", async () => {
      await memory.write({
        uri: "palace://court/guild/findings/test",
        tier: "open_court",
        content: "A comprehensive research report on quantum computing advances in 2026, covering superconducting qubits, topological approaches, and error correction breakthroughs.",
      });

      const item = await memory.read("palace://court/guild/findings/test");
      expect(item!.l0.length).toBeLessThanOrEqual(100);
      expect(item!.l0.length).toBeGreaterThan(0);
    });

    it("auto-generates L1 overview (<2000 chars)", async () => {
      const longContent = "Detailed analysis. ".repeat(200);
      await memory.write({
        uri: "palace://court/guild/findings/long",
        tier: "open_court",
        content: longContent,
      });

      const item = await memory.read("palace://court/guild/findings/long");
      expect(item!.l1.length).toBeLessThanOrEqual(2000);
      expect(item!.l1.length).toBeGreaterThan(0);
    });

    it("stores L2 as full content", async () => {
      const content = "Full detailed content here.";
      await memory.write({
        uri: "palace://court/herald/briefs/today",
        tier: "open_court",
        content,
      });

      const item = await memory.read("palace://court/herald/briefs/today");
      expect(item!.l2).toBe(content);
    });

    it("persists to filesystem", async () => {
      await memory.write({
        uri: "palace://court/chaplain/drafts/persisted",
        tier: "open_court",
        content: "This should be on disk.",
      });

      // Read raw file
      const raw = await readFile(`${TEST_DIR}/court/chaplain/drafts/persisted.json`, "utf-8");
      const parsed = JSON.parse(raw);
      expect(parsed.uri).toBe("palace://court/chaplain/drafts/persisted");
      expect(parsed.l2).toBe("This should be on disk.");
    });

    it("includes timestamps", async () => {
      await memory.write({
        uri: "palace://court/herald/briefs/timestamped",
        tier: "open_court",
        content: "Check timestamps.",
      });

      const item = await memory.read("palace://court/herald/briefs/timestamped");
      expect(item!.createdAt).toBeDefined();
      expect(item!.updatedAt).toBeDefined();
    });
  });

  describe("read", () => {
    it("returns undefined for non-existent URI", async () => {
      const item = await memory.read("palace://court/ghost/nothing");
      expect(item).toBeUndefined();
    });
  });

  describe("list", () => {
    it("lists items by scope", async () => {
      await memory.write({ uri: "palace://court/herald/brief/1", tier: "open_court", content: "Brief 1" });
      await memory.write({ uri: "palace://court/herald/brief/2", tier: "open_court", content: "Brief 2" });
      await memory.write({ uri: "palace://counsel/guild/finding/1", tier: "open_court", content: "Finding" });

      const courtItems = await memory.list("court");
      expect(courtItems.length).toBe(2);

      const counselItems = await memory.list("counsel");
      expect(counselItems.length).toBe(1);
    });
  });

  describe("readAtLevel", () => {
    it("returns L0 for level 0", async () => {
      await memory.write({
        uri: "palace://court/chaplain/drafts/leveled",
        tier: "open_court",
        content: "Very long detailed content that would be expensive to load every time.",
      });

      const l0 = await memory.readAtLevel("palace://court/chaplain/drafts/leveled", 0);
      expect(l0).toBeDefined();
      expect(l0!.length).toBeLessThanOrEqual(100);
    });

    it("returns L1 for level 1", async () => {
      await memory.write({
        uri: "palace://court/chaplain/drafts/leveled2",
        tier: "open_court",
        content: "Detailed content for L1 testing purposes.",
      });

      const l1 = await memory.readAtLevel("palace://court/chaplain/drafts/leveled2", 1);
      expect(l1).toBeDefined();
      expect(l1!.length).toBeLessThanOrEqual(2000);
    });

    it("returns L2 for level 2", async () => {
      const content = "Full content at maximum detail.";
      await memory.write({
        uri: "palace://court/chaplain/drafts/leveled3",
        tier: "open_court",
        content,
      });

      const l2 = await memory.readAtLevel("palace://court/chaplain/drafts/leveled3", 2);
      expect(l2).toBe(content);
    });
  });

  describe("security tier tagging", () => {
    it("tags items with their security tier", async () => {
      await memory.write({
        uri: "palace://court/chaplain/private/thought",
        tier: "inner_chamber",
        content: "Personal reflection.",
      });

      const item = await memory.read("palace://court/chaplain/private/thought");
      expect(item!.tier).toBe("inner_chamber");
    });
  });
});
