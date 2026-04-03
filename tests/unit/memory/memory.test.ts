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

  describe("L0 generation (ISC-14)", () => {
    it("skips markdown headings and uses first real sentence", async () => {
      await memory.write({
        uri: "palace://court/guild/findings/headed",
        tier: "open_court",
        content: "# Research Report\n\nQuantum computing made significant breakthroughs in 2026. The field advanced rapidly.",
      });

      const item = await memory.read("palace://court/guild/findings/headed");
      expect(item!.l0).toBe("Quantum computing made significant breakthroughs in 2026.");
      expect(item!.l0.length).toBeLessThanOrEqual(100);
    });

    it("uses whole content as L0 when very short (<100 chars)", async () => {
      await memory.write({
        uri: "palace://court/herald/briefs/short",
        tier: "open_court",
        content: "Quick note about today",
      });

      const item = await memory.read("palace://court/herald/briefs/short");
      expect(item!.l0).toBe("Quick note about today.");
    });

    it("returns (empty) for empty content", async () => {
      await memory.write({
        uri: "palace://court/herald/briefs/empty",
        tier: "open_court",
        content: "",
      });

      const item = await memory.read("palace://court/herald/briefs/empty");
      expect(item!.l0).toBe("(empty)");
    });

    it("returns (empty) for whitespace-only content", async () => {
      await memory.write({
        uri: "palace://court/herald/briefs/whitespace",
        tier: "open_court",
        content: "   \n\n  ",
      });

      const item = await memory.read("palace://court/herald/briefs/whitespace");
      expect(item!.l0).toBe("(empty)");
    });

    it("ends with proper punctuation", async () => {
      await memory.write({
        uri: "palace://court/guild/findings/nopunct",
        tier: "open_court",
        content: "A finding without punctuation at end",
      });

      const item = await memory.read("palace://court/guild/findings/nopunct");
      expect(item!.l0).toMatch(/[.!?]$/);
    });

    it("extracts heading text when content has only headings", async () => {
      await memory.write({
        uri: "palace://court/guild/findings/headonly",
        tier: "open_court",
        content: "# Architecture Overview\n## Phase 1\n## Phase 2",
      });

      const item = await memory.read("palace://court/guild/findings/headonly");
      expect(item!.l0).toBe("Architecture Overview.");
      expect(item!.l0.length).toBeLessThanOrEqual(100);
    });

    it("truncates long first sentences at word boundary", async () => {
      await memory.write({
        uri: "palace://court/guild/findings/longsentence",
        tier: "open_court",
        content: "This is an extraordinarily long first sentence that goes on and on about many different topics without ever reaching a period or any other sentence-ending punctuation mark whatsoever.",
      });

      const item = await memory.read("palace://court/guild/findings/longsentence");
      expect(item!.l0.length).toBeLessThanOrEqual(100);
      expect(item!.l0).toMatch(/\.\.\.$/);
    });
  });

  describe("L1 generation (ISC-15)", () => {
    it("includes heading outline when content has headings", async () => {
      await memory.write({
        uri: "palace://court/guild/findings/structured",
        tier: "open_court",
        content: "# Research Report\n\nIntroduction paragraph here.\n\n## Methodology\n\nWe used surveys.\n\n## Results\n\nKey findings follow.",
      });

      const item = await memory.read("palace://court/guild/findings/structured");
      expect(item!.l1).toContain("Outline:");
      expect(item!.l1).toContain("Research Report");
      expect(item!.l1).toContain("Methodology");
      expect(item!.l1).toContain("Results");
    });

    it("includes first 3 bullet items", async () => {
      await memory.write({
        uri: "palace://court/guild/findings/bulleted",
        tier: "open_court",
        content: "Summary of findings:\n\n- First important point\n- Second important point\n- Third important point\n- Fourth point should not appear",
      });

      const item = await memory.read("palace://court/guild/findings/bulleted");
      expect(item!.l1).toContain("Key points:");
      expect(item!.l1).toContain("First important point");
      expect(item!.l1).toContain("Second important point");
      expect(item!.l1).toContain("Third important point");
      expect(item!.l1).not.toContain("Fourth point should not appear");
    });

    it("returns (empty) for empty content", async () => {
      await memory.write({
        uri: "palace://court/herald/briefs/emptyl1",
        tier: "open_court",
        content: "",
      });

      const item = await memory.read("palace://court/herald/briefs/emptyl1");
      expect(item!.l1).toBe("(empty)");
    });

    it("uses full content when very short (<50 chars)", async () => {
      await memory.write({
        uri: "palace://court/herald/briefs/tiny",
        tier: "open_court",
        content: "Short memo",
      });

      const item = await memory.read("palace://court/herald/briefs/tiny");
      expect(item!.l1).toBe("Short memo");
    });

    it("respects 2000 char limit even with headings and bullets", async () => {
      const longContent = "First paragraph. ".repeat(100) + "\n\n## Section\n\n" + "- Bullet item\n".repeat(50);
      await memory.write({
        uri: "palace://court/guild/findings/longl1",
        tier: "open_court",
        content: longContent,
      });

      const item = await memory.read("palace://court/guild/findings/longl1");
      expect(item!.l1.length).toBeLessThanOrEqual(2000);
      expect(item!.l1.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases (ISC-16)", () => {
    it("handles content with only bullet points", async () => {
      await memory.write({
        uri: "palace://court/herald/briefs/bullets-only",
        tier: "open_court",
        content: "- Item one\n- Item two\n- Item three",
      });

      const item = await memory.read("palace://court/herald/briefs/bullets-only");
      expect(item!.l0.length).toBeGreaterThan(0);
      expect(item!.l0.length).toBeLessThanOrEqual(100);
      expect(item!.l1).toContain("Key points:");
    });

    it("handles multi-level headings correctly", async () => {
      await memory.write({
        uri: "palace://court/guild/findings/multihead",
        tier: "open_court",
        content: "## Overview\n\nThe system works well.\n\n### Details\n\nMore info here.",
      });

      const item = await memory.read("palace://court/guild/findings/multihead");
      expect(item!.l0).toBe("The system works well.");
    });

    it("L0 equals L1 for very short content", async () => {
      await memory.write({
        uri: "palace://court/herald/briefs/eq",
        tier: "open_court",
        content: "Done.",
      });

      const item = await memory.read("palace://court/herald/briefs/eq");
      expect(item!.l0).toBe("Done.");
      expect(item!.l1).toBe("Done.");
    });
  });
});
