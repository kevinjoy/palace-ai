/**
 * Security Config Parser — loads and validates tiers.yaml through Zod.
 * No more raw casts. Every field is validated at runtime.
 */

import { parse } from "yaml";
import { SecurityConfigSchema } from "../schemas.ts";
import { ConfigValidationError } from "../errors/palace-errors.ts";
import type { SecurityConfig } from "../types.ts";

/** Parse and validate a YAML string into a SecurityConfig */
export function parseSecurityConfig(yamlContent: string): SecurityConfig {
  const raw = parse(yamlContent);
  const result = SecurityConfigSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new ConfigValidationError("security/tiers.yaml", errors);
  }

  return result.data as unknown as SecurityConfig;
}

/** Validate a SecurityConfig is well-formed (additional business rules beyond schema) */
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
