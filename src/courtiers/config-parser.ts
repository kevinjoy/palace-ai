/**
 * Courtier Config Parser — loads and validates courtier YAML definitions.
 * Full implementation in Step 3 (INTERN-55).
 */

import { parse } from "yaml";
import type { CourtierConfig } from "../types.ts";

/** Parse a YAML string into a CourtierConfig */
export function parseCourtierConfig(yamlContent: string): CourtierConfig {
  const raw = parse(yamlContent) as { courtier: Record<string, unknown> };
  const c = raw.courtier;
  return {
    name: c.name as string,
    displayName: (c.displayName ?? c.display_name) as string,
    description: c.description as string,
    domain: c.domain as CourtierConfig["domain"],
    security: {
      tierAccess: ((c.security as Record<string, unknown>).tierAccess ??
        (c.security as Record<string, unknown>).tier_access) as CourtierConfig["security"]["tierAccess"],
      writeScope: ((c.security as Record<string, unknown>).writeScope ??
        (c.security as Record<string, unknown>).write_scope) as string,
      auditLevel: ((c.security as Record<string, unknown>).auditLevel ??
        (c.security as Record<string, unknown>).audit_level) as CourtierConfig["security"]["auditLevel"],
    },
    operations: c.operations as CourtierConfig["operations"],
    modelPreference: (c.modelPreference ?? c.model_preference) as CourtierConfig["modelPreference"],
    accountScope: (c.accountScope ?? c.account_scope) as CourtierConfig["accountScope"],
    canUseAccounts: (c.canUseAccounts ?? c.can_use_accounts) as readonly string[],
    status: c.status as CourtierConfig["status"],
    activatedInPhase: (c.activatedInPhase ?? c.activated_in_phase) as number,
  };
}

/** Validate a CourtierConfig is well-formed */
export function validateCourtierConfig(config: CourtierConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name) errors.push("Courtier must have a name");
  if (!config.displayName) errors.push("Courtier must have a displayName");
  if (!config.domain?.primary) errors.push("Courtier must have a primary domain");
  if (!config.security?.tierAccess?.length) errors.push("Courtier must have at least one tier access");
  if (!config.accountScope) errors.push("Courtier must have an accountScope");

  return { valid: errors.length === 0, errors };
}
