import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "fs/promises";
import { ObsidianReader } from "@palace/integrations/obsidian.ts";

const TEST_VAULT = ".test-vault";

describe("ObsidianReader", () => {
  let reader: ObsidianReader;

  beforeEach(async () => {
    await mkdir(`${TEST_VAULT}/Daily Notes`, { recursive: true });
    await mkdir(`${TEST_VAULT}/Research`, { recursive: true });
    reader = new ObsidianReader(TEST_VAULT);
  });

  afterEach(async () => {
    await rm(TEST_VAULT, { recursive: true, force: true });
  });

  describe("readNote", () => {
    it("reads a markdown note with frontmatter", async () => {
      await writeFile(`${TEST_VAULT}/Research/openviking.md`, [
        "---",
        "title: OpenViking Analysis",
        "tags: [research, memory]",
        "date: 2026-04-03",
        "---",
        "",
        "# OpenViking Analysis",
        "",
        "The L0/L1/L2 model provides 83-96% token savings.",
      ].join("\n"));

      const note = await reader.readNote("Research/openviking.md");
      expect(note).toBeDefined();
      expect(note!.title).toBe("OpenViking Analysis");
      expect(note!.tags).toContain("research");
      expect(note!.content).toContain("L0/L1/L2 model");
    });

    it("reads a note without frontmatter", async () => {
      await writeFile(`${TEST_VAULT}/Research/quick-note.md`, "Just a quick thought about agents.");

      const note = await reader.readNote("Research/quick-note.md");
      expect(note).toBeDefined();
      expect(note!.content).toBe("Just a quick thought about agents.");
      expect(note!.title).toBe("quick-note");
    });

    it("returns undefined for non-existent note", async () => {
      const note = await reader.readNote("Nonexistent/ghost.md");
      expect(note).toBeUndefined();
    });
  });

  describe("listNotes", () => {
    it("lists all markdown files in a directory", async () => {
      await writeFile(`${TEST_VAULT}/Research/note1.md`, "Note 1");
      await writeFile(`${TEST_VAULT}/Research/note2.md`, "Note 2");
      await writeFile(`${TEST_VAULT}/Research/readme.txt`, "Not a note");

      const notes = await reader.listNotes("Research");
      expect(notes.length).toBe(2);
      expect(notes.every((n) => n.endsWith(".md"))).toBe(true);
    });

    it("returns empty array for non-existent directory", async () => {
      const notes = await reader.listNotes("NonExistent");
      expect(notes).toEqual([]);
    });
  });

  describe("readDailyNote", () => {
    it("reads today's daily note by date", async () => {
      const date = "2026-04-03";
      await writeFile(`${TEST_VAULT}/Daily Notes/${date}.md`, [
        "---",
        "date: 2026-04-03",
        "---",
        "",
        "Woke up thinking about Palace AI architecture.",
        "Met with the team about Comp-Strata progress.",
      ].join("\n"));

      const note = await reader.readDailyNote(date);
      expect(note).toBeDefined();
      expect(note!.content).toContain("Palace AI architecture");
    });

    it("returns undefined when no daily note exists", async () => {
      const note = await reader.readDailyNote("2099-12-31");
      expect(note).toBeUndefined();
    });
  });

  describe("watchForChanges", () => {
    it("detects new notes added to a directory", async () => {
      const before = await reader.listNotes("Research");
      expect(before.length).toBe(0);

      await writeFile(`${TEST_VAULT}/Research/new-finding.md`, "New research finding.");

      const after = await reader.listNotes("Research");
      expect(after.length).toBe(1);
    });
  });

  describe("parseForPalace", () => {
    it("converts an Obsidian note to a Palace memory write input", async () => {
      await writeFile(`${TEST_VAULT}/Research/palace-ready.md`, [
        "---",
        "title: Agent Communication Patterns",
        "tags: [research, palace, agents]",
        "---",
        "",
        "Explored various inter-agent communication patterns.",
        "Unix sockets vs HTTP vs in-process messaging.",
      ].join("\n"));

      const note = await reader.readNote("Research/palace-ready.md");
      const palaceInput = reader.toPalaceMemory(note!, "open_court");

      expect(palaceInput.uri).toContain("palace://user/obsidian/");
      expect(palaceInput.tier).toBe("open_court");
      expect(palaceInput.content).toContain("inter-agent communication");
    });
  });
});
