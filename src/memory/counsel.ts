/**
 * Counsel Layer — shared insight surface for cross-courtier visibility.
 *
 * Courtiers submit their best outputs to the Counsel Layer. All courtiers
 * can scan it at L0 (summaries) or request L1/L2 depth. The Vizier mediates.
 */

import type { MemoryItem, SecurityTier } from "../types.ts";
import type { PalaceMemory } from "./memory.ts";
import { buildPalaceUri } from "./uri.ts";

interface CounselSubmission {
  readonly from: string;
  readonly title: string;
  readonly content: string;
  readonly tier: SecurityTier;
}

export class CounselLayer {
  constructor(private readonly memory: PalaceMemory) {}

  /** Submit an item to the Counsel Layer */
  async submit(submission: CounselSubmission): Promise<MemoryItem> {
    const slug = submission.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const timestamp = Date.now();
    const uri = buildPalaceUri("counsel", `${submission.from}/${slug}-${timestamp}`);

    return this.memory.write({
      uri,
      tier: submission.tier,
      content: submission.content,
    });
  }

  /** List all counsel items */
  async list(): Promise<readonly MemoryItem[]> {
    return this.memory.list("counsel");
  }

  /** List counsel items from a specific courtier */
  async listFrom(courtierName: string): Promise<readonly MemoryItem[]> {
    const all = await this.list();
    return all.filter((item) => item.uri.includes(`/counsel/${courtierName}/`));
  }

  /** Scan all counsel items at L0 for efficient overview */
  async scanL0(): Promise<readonly string[]> {
    const all = await this.list();
    return all.map((item) => item.l0);
  }
}
