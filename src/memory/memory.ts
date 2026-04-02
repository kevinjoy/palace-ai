/**
 * Palace Memory — file-based memory with OpenViking-inspired L0/L1/L2 tiering.
 *
 * Every memory item is decomposed at WRITE time into three representations:
 * - L0 (Abstract): <100 chars, single-sentence summary for cheap scanning
 * - L1 (Overview): <2000 chars, structured summary for planning
 * - L2 (Detail): Full content, unbounded
 *
 * Items are stored as JSON files on disk, organized by URI path.
 */

import { mkdir, readFile, writeFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import type { MemoryItem, SecurityTier, ContextLevel } from "../types.ts";
import { parsePalaceUri } from "./uri.ts";

interface WriteInput {
  readonly uri: string;
  readonly tier: SecurityTier;
  readonly content: string;
}

/** Generate L0 abstract: first sentence, truncated to 100 chars */
function generateL0(content: string): string {
  const firstSentence = content.split(/[.!?]\s/)[0] ?? content;
  const trimmed = (firstSentence + ".").slice(0, 100);
  return trimmed;
}

/** Generate L1 overview: first paragraph or truncated to 2000 chars */
function generateL1(content: string): string {
  const firstParagraph = content.split(/\n\n/)[0] ?? content;
  return firstParagraph.slice(0, 2000);
}

export class PalaceMemory {
  constructor(private readonly baseDir: string) {}

  /** Write a memory item with auto-generated L0/L1/L2 tiers */
  async write(input: WriteInput): Promise<MemoryItem> {
    const parsed = parsePalaceUri(input.uri);
    const now = new Date().toISOString();

    const item: MemoryItem = {
      uri: input.uri,
      tier: input.tier,
      l0: generateL0(input.content),
      l1: generateL1(input.content),
      l2: input.content,
      createdAt: now,
      updatedAt: now,
    };

    const filePath = this.uriToPath(parsed.scope, parsed.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(item, null, 2), "utf-8");

    return item;
  }

  /** Read a memory item by URI, or undefined if not found */
  async read(uri: string): Promise<MemoryItem | undefined> {
    const parsed = parsePalaceUri(uri);
    const filePath = this.uriToPath(parsed.scope, parsed.path);
    try {
      const raw = await readFile(filePath, "utf-8");
      return JSON.parse(raw) as MemoryItem;
    } catch {
      return undefined;
    }
  }

  /** Read a memory item at a specific context level */
  async readAtLevel(uri: string, level: ContextLevel): Promise<string | undefined> {
    const item = await this.read(uri);
    if (!item) return undefined;

    switch (level) {
      case 0: return item.l0;
      case 1: return item.l1;
      case 2: return item.l2;
    }
  }

  /** List all memory items under a scope */
  async list(scope: string): Promise<readonly MemoryItem[]> {
    const scopeDir = join(this.baseDir, scope);
    try {
      return await this.collectItems(scopeDir);
    } catch {
      return [];
    }
  }

  private uriToPath(scope: string, path: string): string {
    return join(this.baseDir, scope, `${path}.json`);
  }

  private async collectItems(dir: string): Promise<MemoryItem[]> {
    const items: MemoryItem[] = [];
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          items.push(...(await this.collectItems(fullPath)));
        } else if (entry.name.endsWith(".json")) {
          try {
            const raw = await readFile(fullPath, "utf-8");
            items.push(JSON.parse(raw) as MemoryItem);
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
    return items;
  }
}
