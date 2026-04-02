/**
 * Security Tier Engine — enforces the 6-tier data classification model.
 * Implementation in Step 2 (INTERN-54).
 */

import type { SecurityTier, CourtierConfig } from "../types.ts";

/** Tier hierarchy from most to least restrictive */
export const TIER_HIERARCHY: readonly SecurityTier[] = [
  "crown_jewels",
  "inner_chamber",
  "guarded",
  "open_court",
  "sandlot",
  "diplomatic_pouch",
] as const;

/** Check if a courtier's tier access includes the target tier */
export function checkTierAccess(
  courtierTierAccess: readonly SecurityTier[],
  targetTier: SecurityTier,
): boolean {
  return courtierTierAccess.includes(targetTier);
}

/** Check if a courtier can access a resource at a given tier */
export function canAccess(
  courtier: Pick<CourtierConfig, "name" | "security">,
  resourceTier: SecurityTier,
): boolean {
  if (resourceTier === "crown_jewels") return false;
  return checkTierAccess(courtier.security.tierAccess, resourceTier);
}
