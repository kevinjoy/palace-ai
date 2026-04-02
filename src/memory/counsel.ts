/**
 * Counsel Layer — shared insight surface for cross-courtier visibility.
 *
 * Security: submissions require a registered caller identity.
 * The `from` field is verified against the caller, not self-asserted.
 */

import type { MemoryItem, SecurityTier } from "../types.ts";
import type { PalaceMemory, CallerIdentity } from "./memory.ts";
import { buildPalaceUri } from "./uri.ts";
import { UnauthorizedCounselError } from "../errors/palace-errors.ts";

interface CounselSubmission {
  readonly from: string;
  readonly title: string;
  readonly content: string;
  readonly tier: SecurityTier;
}

export class CounselLayer {
  constructor(private readonly memory: PalaceMemory) {}

  /** Submit an item to the Counsel Layer. Caller identity is verified. */
  async submit(submission: CounselSubmission, caller?: CallerIdentity): Promise<MemoryItem> {
    // If caller provided, verify the `from` field matches
    if (caller && caller.name !== submission.from) {
      throw new UnauthorizedCounselError(
        submission.from,
        `Caller "${caller.name}" cannot submit as "${submission.from}"`,
      );
    }

    const slug = submission.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const timestamp = Date.now();
    const uri = buildPalaceUri("counsel", `${submission.from}/${slug}-${timestamp}`);

    return this.memory.write(
      { uri, tier: submission.tier, content: submission.content },
      caller,
    );
  }

  /** List all counsel items, filtered by caller's tier access */
  async list(caller?: CallerIdentity): Promise<readonly MemoryItem[]> {
    return this.memory.list("counsel", caller);
  }

  /** List counsel items from a specific courtier */
  async listFrom(courtierName: string, caller?: CallerIdentity): Promise<readonly MemoryItem[]> {
    const all = await this.list(caller);
    return all.filter((item) => item.uri.includes(`/counsel/${courtierName}/`));
  }

  /** Scan all counsel items at L0 for efficient overview */
  async scanL0(caller?: CallerIdentity): Promise<readonly string[]> {
    const all = await this.list(caller);
    return all.map((item) => item.l0);
  }
}
