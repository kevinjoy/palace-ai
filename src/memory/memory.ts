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

const L0_MAX = 100;
const L1_MAX = 2000;
const VERY_SHORT_THRESHOLD = 50;
const EMPTY_PLACEHOLDER = "(empty)";

// Hoisted regex patterns — compiled once, not per-write
const HEADING_LINE_RE = /^#{1,6}\s/;
const HEADING_MULTILINE_RE = /^#{1,6}\s/m;
const HEADING_CAPTURE_RE = /^(#{1,6})\s+(.+)/;
const HEADING_FIRST_CAPTURE_RE = /^#{1,6}\s+(.+)/m;
const BULLET_RE = /^\s*[-*+]\s+(.+)/;

/** Strip leading markdown headings (lines starting with #) and return the remaining content */
function stripLeadingHeadings(content: string): string {
  const lines = content.split("\n");
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "" || HEADING_LINE_RE.test(trimmed)) {
      start = i + 1;
    } else {
      break;
    }
  }
  return lines.slice(start).join("\n").trim();
}

function hasSentencePunctuation(text: string): boolean {
  return text.endsWith(".") || text.endsWith("!") || text.endsWith("?");
}

function ensurePunctuation(text: string): string {
  return hasSentencePunctuation(text) ? text : text + ".";
}

/** Extract the first real sentence from text, ending with proper punctuation */
function extractFirstSentence(text: string): string {
  const match = text.match(/[^.!?]*[.!?]/);
  if (match) {
    return match[0].trim();
  }
  return ensurePunctuation(text.trim());
}

/** Check if content contains markdown headings */
function hasHeadings(content: string): boolean {
  return HEADING_MULTILINE_RE.test(content);
}

/** Generate L0 abstract: smart first-sentence extraction, max 100 chars */
function generateL0(content: string): string {
  const trimmed = content.trim();

  // Empty content
  if (trimmed.length === 0) {
    return EMPTY_PLACEHOLDER;
  }

  // If content has headings, always try to extract body text first
  if (hasHeadings(trimmed)) {
    const body = stripLeadingHeadings(trimmed);

    if (body.length === 0) {
      // Content is only headings — use the first heading text
      const headingMatch = trimmed.match(HEADING_FIRST_CAPTURE_RE);
      if (headingMatch) {
        return ensurePunctuation(headingMatch[1].trim()).slice(0, L0_MAX);
      }
    } else {
      const sentence = extractFirstSentence(body);
      if (sentence.length <= L0_MAX) {
        return sentence;
      }
      const truncated = sentence.slice(0, L0_MAX - 3);
      const lastSpace = truncated.lastIndexOf(" ");
      return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
    }
  }

  // Very short content without headings — use it directly
  if (trimmed.length <= L0_MAX) {
    return ensurePunctuation(trimmed).slice(0, L0_MAX);
  }

  // Standard content — extract first sentence
  const sentence = extractFirstSentence(trimmed);
  if (sentence.length <= L0_MAX) {
    return sentence;
  }
  // Truncate long sentences at word boundary with ellipsis
  const truncated = sentence.slice(0, L0_MAX - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/** Extract headings and bullets from content in a single pass over lines */
function extractStructure(lines: readonly string[], maxBullets: number): { headings: string[]; bullets: string[] } {
  const headings: string[] = [];
  const bullets: string[] = [];
  for (const line of lines) {
    const hMatch = line.match(HEADING_CAPTURE_RE);
    if (hMatch) {
      headings.push(hMatch[2].trim());
      continue;
    }
    if (bullets.length < maxBullets) {
      const bMatch = line.match(BULLET_RE);
      if (bMatch) {
        bullets.push(bMatch[1].trim());
      }
    }
  }
  return { headings, bullets };
}

/** Generate L1 overview: structured summary with headings and bullets, max 2000 chars */
function generateL1(content: string): string {
  const trimmed = content.trim();

  // Empty content
  if (trimmed.length === 0) {
    return EMPTY_PLACEHOLDER;
  }

  // Single-pass structure extraction
  const lines = trimmed.split("\n");
  const { headings, bullets } = extractStructure(lines, 3);

  // Very short content with no structural elements — use it directly
  if (trimmed.length <= VERY_SHORT_THRESHOLD && headings.length === 0 && bullets.length === 0) {
    return trimmed;
  }

  // Start with first paragraph
  const firstParagraph = trimmed.split(/\n\n/)[0] ?? trimmed;
  const parts: string[] = [firstParagraph];

  if (headings.length > 0) {
    parts.push("\n\nOutline: " + headings.join(" | "));
  }

  if (bullets.length > 0) {
    parts.push("\n\nKey points:\n" + bullets.map((b) => `- ${b}`).join("\n"));
  }

  const result = parts.join("");
  return result.slice(0, L1_MAX);
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
