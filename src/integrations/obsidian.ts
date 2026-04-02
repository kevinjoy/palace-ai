/**
 * Obsidian Integration — read-only vault access for Palace AI.
 *
 * Reads Obsidian markdown notes, parses frontmatter, and converts
 * to Palace memory format. Phase 1 is read-only; write-back via
 * PR/review queue comes in Phase 2.
 */

import { readFile, readdir } from "fs/promises";
import { join, basename, extname } from "path";
import type { SecurityTier } from "../types.ts";
import type { WriteInput } from "../memory/memory.ts";
import { buildPalaceUri } from "../memory/uri.ts";

export interface ObsidianNote {
  readonly path: string;
  readonly title: string;
  readonly content: string;
  readonly frontmatter: Record<string, unknown>;
  readonly tags: readonly string[];
  readonly date?: string;
}

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

/** Parse YAML-like frontmatter (simple key: value pairs) */
function parseFrontmatter(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const line of raw.split("\n")) {
    const match = /^(\w+):\s*(.+)$/.exec(line.trim());
    if (match) {
      const key = match[1]!;
      let value: unknown = match[2]!.trim();

      // Parse arrays: [a, b, c]
      if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
        value = value.slice(1, -1).split(",").map((s) => s.trim());
      }
      result[key] = value;
    }
  }
  return result;
}

export class ObsidianReader {
  constructor(private readonly vaultPath: string) {}

  /** Read a note by relative path within the vault */
  async readNote(relativePath: string): Promise<ObsidianNote | undefined> {
    const fullPath = join(this.vaultPath, relativePath);
    let raw: string;
    try {
      raw = await readFile(fullPath, "utf-8");
    } catch {
      return undefined;
    }

    const fmMatch = FRONTMATTER_REGEX.exec(raw);
    let frontmatter: Record<string, unknown> = {};
    let content: string;

    if (fmMatch) {
      frontmatter = parseFrontmatter(fmMatch[1]!);
      content = fmMatch[2]!.trim();
    } else {
      content = raw.trim();
    }

    const title = (frontmatter.title as string) ?? basename(relativePath, extname(relativePath));
    const tags = Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]) : [];
    const date = frontmatter.date as string | undefined;

    return { path: relativePath, title, content, frontmatter, tags, date };
  }

  /** List all markdown files in a vault directory */
  async listNotes(directory: string): Promise<readonly string[]> {
    const dirPath = join(this.vaultPath, directory);
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .map((e) => `${directory}/${e.name}`);
    } catch {
      return [];
    }
  }

  /** Read the daily note for a specific date (YYYY-MM-DD format) */
  async readDailyNote(date: string): Promise<ObsidianNote | undefined> {
    return this.readNote(`Daily Notes/${date}.md`);
  }

  /** Convert an Obsidian note to Palace memory write input */
  toPalaceMemory(note: ObsidianNote, tier: SecurityTier): WriteInput {
    const slug = note.path.replace(/\.md$/, "").replace(/\//g, "/");
    const uri = buildPalaceUri("user", `obsidian/${slug}`);

    return {
      uri,
      tier,
      content: note.content,
    };
  }
}
