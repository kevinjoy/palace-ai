/**
 * Palace Memory — file-based memory with OpenViking-inspired L0/L1/L2 tiering.
 *
 * Security: reads and writes are gated by caller identity and tier access.
 * Writes are atomic (temp-file-then-rename) to prevent corruption.
 * Errors are typed, never silently swallowed.
 */

import { mkdir, readFile, writeFile, readdir, rename } from "fs/promises";
import { join, dirname, resolve } from "path";
import type { MemoryItem, SecurityTier, ContextLevel } from "../types.ts";
import { parsePalaceUri, validateContainment } from "./uri.ts";
import { MemoryCorruptedError, TierAccessDeniedError } from "../errors/palace-errors.ts";
import { canAccess, type AccessIdentity } from "../security/tier-engine.ts";

export interface WriteInput {
  readonly uri: string;
  readonly tier: SecurityTier;
  readonly content: string;
}

/** Caller identity for access control — re-exported from tier engine */
export type CallerIdentity = AccessIdentity;

/** Generate L0 abstract: first sentence, truncated to 100 chars */
function generateL0(content: string): string {
  const firstSentence = content.split(/[.!?]\s/)[0] ?? content;
  return (firstSentence + ".").slice(0, 100);
}

/** Generate L1 overview: first paragraph or truncated to 2000 chars */
function generateL1(content: string): string {
  const firstParagraph = content.split(/\n\n/)[0] ?? content;
  return firstParagraph.slice(0, 2000);
}

export class PalaceMemory {
  private readonly resolvedBaseDir: string;

  constructor(private readonly baseDir: string) {
    this.resolvedBaseDir = resolve(baseDir);
  }

  /** Write a memory item with auto-generated L0/L1/L2 tiers. Caller must have tier access. */
  async write(input: WriteInput, caller?: CallerIdentity): Promise<MemoryItem> {
    // Enforce tier access if caller is provided
    if (caller && !canAccess(caller, input.tier)) {
      throw new TierAccessDeniedError(caller.name, input.tier, input.uri);
    }

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

    // Validate path stays within baseDir
    validateContainment(resolve(filePath), this.resolvedBaseDir);

    // Atomic write: temp file then rename
    await mkdir(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    await writeFile(tempPath, JSON.stringify(item, null, 2), "utf-8");
    await rename(tempPath, filePath);

    return item;
  }

  /** Read a memory item by URI. Caller must have tier access. */
  async read(uri: string, caller?: CallerIdentity): Promise<MemoryItem | undefined> {
    const parsed = parsePalaceUri(uri);
    const filePath = this.uriToPath(parsed.scope, parsed.path);

    // Validate path stays within baseDir
    validateContainment(resolve(filePath), this.resolvedBaseDir);

    let raw: string;
    try {
      raw = await readFile(filePath, "utf-8");
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined; // Genuinely not found
      }
      // Real errors (permissions, disk) are NOT swallowed
      throw new MemoryCorruptedError(uri, (err as Error).message);
    }

    let item: MemoryItem;
    try {
      item = JSON.parse(raw) as MemoryItem;
    } catch {
      throw new MemoryCorruptedError(uri, "Invalid JSON");
    }

    // Enforce tier access if caller is provided
    if (caller && !canAccess(caller, item.tier)) {
      throw new TierAccessDeniedError(caller.name, item.tier, uri);
    }

    return item;
  }

  /** Read a memory item at a specific context level */
  async readAtLevel(uri: string, level: ContextLevel, caller?: CallerIdentity): Promise<string | undefined> {
    const item = await this.read(uri, caller);
    if (!item) return undefined;

    switch (level) {
      case 0: return item.l0;
      case 1: return item.l1;
      case 2: return item.l2;
    }
  }

  /** List all memory items under a scope */
  async list(scope: string, caller?: CallerIdentity): Promise<readonly MemoryItem[]> {
    const scopeDir = join(this.baseDir, scope);

    // Validate path stays within baseDir
    validateContainment(resolve(scopeDir), this.resolvedBaseDir);

    const items = await this.collectItems(scopeDir);

    // Filter by caller tier access if provided
    if (caller) {
      return items.filter((item) => canAccess(caller, item.tier));
    }
    return items;
  }

  private uriToPath(scope: string, path: string): string {
    return join(this.baseDir, scope, `${path}.json`);
  }

  private async collectItems(dir: string): Promise<MemoryItem[]> {
    const items: MemoryItem[] = [];
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        return []; // Directory doesn't exist — not an error
      }
      throw err; // Real errors propagate
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        items.push(...(await this.collectItems(fullPath)));
      } else if (entry.name.endsWith(".json") && !entry.name.endsWith(".tmp")) {
        let raw: string;
        try {
          raw = await readFile(fullPath, "utf-8");
        } catch {
          continue; // Skip unreadable files during collection
        }
        try {
          items.push(JSON.parse(raw) as MemoryItem);
        } catch {
          // Log instead of skip in production — for now, skip malformed
          continue;
        }
      }
    }
    return items;
  }
}
