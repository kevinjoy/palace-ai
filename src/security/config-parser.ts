/**
 * Security Config Parser — loads and validates palace.security.yaml
 * Full implementation in Step 2 (INTERN-54).
 */

import { parse } from "yaml";
import type { SecurityConfig } from "../types.ts";

/** Parse a YAML string into a SecurityConfig */
export function parseSecurityConfig(yamlContent: string): SecurityConfig {
  const raw = parse(yamlContent) as { tiers: Record<string, unknown> };
  return raw as unknown as SecurityConfig;
}

/** Validate a SecurityConfig is well-formed */
export function validateSecurityConfig(config: SecurityConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredTiers = ["crown_jewels", "inner_chamber", "guarded", "open_court", "sandlot", "diplomatic_pouch"];

  for (const tier of requiredTiers) {
    if (!(tier in config.tiers)) {
      errors.push(`Missing required tier: ${tier}`);
    }
  }

  if (config.tiers.crown_jewels && config.tiers.crown_jewels.access !== "none") {
    errors.push("Crown jewels tier must have access: none");
  }

  return { valid: errors.length === 0, errors };
}
