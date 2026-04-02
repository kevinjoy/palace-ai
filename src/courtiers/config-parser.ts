/**
 * Courtier Config Parser — loads and validates courtier YAML through Zod.
 * Handles snake_case → camelCase normalization in one place.
 */

import { parse } from "yaml";
import { RawCourtierYamlSchema } from "../schemas.ts";
import { ConfigValidationError } from "../errors/palace-errors.ts";
import type { CourtierConfig, SecurityTier } from "../types.ts";

/** Parse and validate a YAML string into a CourtierConfig */
export function parseCourtierConfig(yamlContent: string): CourtierConfig {
  const raw = parse(yamlContent);
  const result = RawCourtierYamlSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new ConfigValidationError("courtier config", errors);
  }

  const c = result.data.courtier;

  return {
    name: c.name,
    displayName: (c.displayName ?? c.display_name)!,
    description: c.description,
    domain: c.domain,
    security: {
      tierAccess: (c.security.tierAccess ?? c.security.tier_access ?? []) as SecurityTier[],
      writeScope: (c.security.writeScope ?? c.security.write_scope ?? "own_workspace"),
      auditLevel: (c.security.auditLevel ?? c.security.audit_level ?? "standard") as "none" | "standard" | "full",
    },
    operations: c.operations,
    modelPreference: (c.modelPreference ?? c.model_preference)!,
    accountScope: (c.accountScope ?? c.account_scope ?? "personal"),
    canUseAccounts: (c.canUseAccounts ?? c.can_use_accounts ?? ["personal"]),
    status: c.status,
    activatedInPhase: (c.activatedInPhase ?? c.activated_in_phase ?? 1),
  };
}

/** Validate a CourtierConfig is well-formed (business rules beyond schema) */
export function validateCourtierConfig(config: CourtierConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name) errors.push("Courtier must have a name");
  if (!config.displayName) errors.push("Courtier must have a displayName");
  if (!config.domain?.primary) errors.push("Courtier must have a primary domain");
  if (!config.security?.tierAccess?.length) errors.push("Courtier must have at least one tier access");
  if (!config.accountScope) errors.push("Courtier must have an accountScope");

  return { valid: errors.length === 0, errors };
}
