/**
 * Palace AI — Zod Schemas for Runtime Validation
 *
 * Every YAML config is parsed through Zod before entering the system.
 * No more `as unknown as T` — types are enforced at runtime.
 */

import { z } from "zod";

/** Security tier enum */
export const SecurityTierSchema = z.enum([
  "crown_jewels",
  "inner_chamber",
  "guarded",
  "open_court",
  "sandlot",
  "diplomatic_pouch",
]);

/** Courtier status enum */
export const CourtierStatusSchema = z.enum([
  "disabled",
  "dormant",
  "activating",
  "active",
  "suspended",
  "deactivated",
]);

/** Audit level enum */
export const AuditLevelSchema = z.enum(["none", "standard", "full"]);

/** Tier configuration (from tiers.yaml) */
export const TierConfigSchema = z.object({
  paths: z.array(z.string()).optional().default([]),
  access: z.union([
    z.literal("none"),
    z.literal("all_trusted"),
    z.literal("sandbox_agents"),
    z.array(z.string()),
    z.object({
      account: z.string().optional(),
      roles: z.array(z.string()).optional(),
    }),
  ]),
  sync: z.string(),
  audit: z.boolean().optional(),
  write_back: z.string().optional(),
  location: z.string().optional(),
  network: z.string().optional(),
  agreements: z.array(z.unknown()).optional(),
});

/** Full security configuration */
export const SecurityConfigSchema = z.object({
  tiers: z.object({
    crown_jewels: TierConfigSchema,
    inner_chamber: TierConfigSchema,
    guarded: TierConfigSchema,
    open_court: TierConfigSchema,
    sandlot: TierConfigSchema,
    diplomatic_pouch: TierConfigSchema,
  }),
});

/** Courtier domain */
const CourtierDomainSchema = z.object({
  primary: z.string().min(1),
  keywords: z.array(z.string()),
});

/** Courtier security config */
const CourtierSecuritySchema = z.object({
  tierAccess: z.array(SecurityTierSchema).min(1),
  writeScope: z.string(),
  auditLevel: AuditLevelSchema,
});

/** Courtier operations */
const CourtierOperationsSchema = z.object({
  heartbeat: z.string(),
  triggers: z.array(z.string()),
  outputs: z.array(z.string()),
});

/** Courtier model preferences */
const ModelPreferenceSchema = z.object({
  default: z.string(),
  deepWork: z.string(),
  quick: z.string(),
});

/** Courtier persona — personality traits and cognitive techniques */
const CourtierPersonaSchema = z.object({
  traits: z.array(z.string()).min(1),
  communicationStyle: z.string().min(1),
  cognitiveTechniques: z.array(z.string()).min(1),
  challengeBehavior: z.string().min(1),
});

/** Full courtier configuration */
export const CourtierConfigSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string(),
  domain: CourtierDomainSchema,
  persona: CourtierPersonaSchema,
  security: CourtierSecuritySchema,
  operations: CourtierOperationsSchema,
  modelPreference: ModelPreferenceSchema,
  accountScope: z.string(),
  canUseAccounts: z.array(z.string()),
  status: CourtierStatusSchema,
  activatedInPhase: z.number().int().positive(),
});

/** Raw courtier YAML structure (snake_case from YAML) */
export const RawCourtierYamlSchema = z.object({
  courtier: z.object({
    name: z.string().min(1),
    displayName: z.string().optional(),
    display_name: z.string().optional(),
    description: z.string(),
    domain: CourtierDomainSchema,
    persona: z.object({
      traits: z.array(z.string()).min(1),
      communicationStyle: z.string().optional(),
      communication_style: z.string().optional(),
      cognitiveTechniques: z.array(z.string()).optional(),
      cognitive_techniques: z.array(z.string()).optional(),
      challengeBehavior: z.string().optional(),
      challenge_behavior: z.string().optional(),
    }).optional(),
    security: z.object({
      tierAccess: z.array(z.string()).optional(),
      tier_access: z.array(z.string()).optional(),
      writeScope: z.string().optional(),
      write_scope: z.string().optional(),
      auditLevel: z.string().optional(),
      audit_level: z.string().optional(),
    }),
    operations: CourtierOperationsSchema,
    modelPreference: ModelPreferenceSchema.optional(),
    model_preference: ModelPreferenceSchema.optional(),
    accountScope: z.string().optional(),
    account_scope: z.string().optional(),
    canUseAccounts: z.array(z.string()).optional(),
    can_use_accounts: z.array(z.string()).optional(),
    status: CourtierStatusSchema,
    activatedInPhase: z.number().optional(),
    activated_in_phase: z.number().optional(),
  }),
});
