import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "fs/promises";
import { CounselLayer } from "@palace/memory/counsel.ts";
import { PalaceMemory } from "@palace/memory/memory.ts";

const TEST_DIR = ".test-counsel";

describe("CounselLayer", () => {
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

  describe("submit", () => {
    it("submits a counsel item from a courtier", async () => {
      await counsel.submit({
        from: "guild",
        title: "OpenViking Analysis Complete",
        content: "L0/L1/L2 tiering provides 83-96% token savings over traditional RAG.",
        tier: "open_court",
      });

      const items = await counsel.list();
      expect(items.length).toBe(1);
      expect(items[0]!.l2).toContain("token savings");
    });

    it("stores under counsel scope URI", async () => {
      await counsel.submit({
        from: "herald",
        title: "Daily Brief Ready",
        content: "3 tasks pending, 1 urgent from Novo.",
        tier: "open_court",
      });

      const items = await memory.list("counsel");
      expect(items.length).toBe(1);
      expect(items[0]!.uri).toContain("palace://counsel/herald/");
    });
  });

  describe("list", () => {
    it("lists all counsel items", async () => {
      await counsel.submit({ from: "guild", title: "Finding 1", content: "Research A.", tier: "open_court" });
      await counsel.submit({ from: "chaplain", title: "Draft 1", content: "Essay B.", tier: "open_court" });

      const items = await counsel.list();
      expect(items.length).toBe(2);
    });

    it("filters by courtier", async () => {
      await counsel.submit({ from: "guild", title: "Finding 1", content: "A.", tier: "open_court" });
      await counsel.submit({ from: "guild", title: "Finding 2", content: "B.", tier: "open_court" });
      await counsel.submit({ from: "chaplain", title: "Draft", content: "C.", tier: "open_court" });

      const guildItems = await counsel.listFrom("guild");
      expect(guildItems.length).toBe(2);

      const chapItems = await counsel.listFrom("chaplain");
      expect(chapItems.length).toBe(1);
    });
  });

  describe("scan at L0", () => {
    it("returns L0 summaries for efficient scanning", async () => {
      await counsel.submit({
        from: "guild",
        title: "Long Research",
        content: "A very detailed research report spanning many paragraphs of analysis and findings.",
        tier: "open_court",
      });

      const summaries = await counsel.scanL0();
      expect(summaries.length).toBe(1);
      expect(summaries[0]!.length).toBeLessThanOrEqual(100);
    });
  });
});
