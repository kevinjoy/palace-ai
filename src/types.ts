/**
 * Palace AI — Core Type Definitions
 *
 * Shared types used across all Palace subsystems.
 * These types define the contracts between components.
 */

/** Security tier levels, ordered from most to least restrictive */
export type SecurityTier =
  | "crown_jewels"
  | "inner_chamber"
  | "guarded"
  | "open_court"
  | "sandlot"
  | "diplomatic_pouch";

/** Courtier lifecycle states */
export type CourtierStatus =
  | "disabled"
  | "dormant"
  | "activating"
  | "active"
  | "suspended"
  | "deactivated";

/** Valid state transitions for the Courtier lifecycle */
export const VALID_TRANSITIONS: Record<CourtierStatus, readonly CourtierStatus[]> = {
  disabled: ["dormant"],
  dormant: ["activating"],
  activating: ["active"],
  active: ["suspended", "deactivated"],
  suspended: ["active", "deactivated"],
  deactivated: ["dormant"],
} as const;

/** LLM provider identifiers — Palace is model-agnostic */
export type ProviderId = string;

/** Model tier for complexity-based routing */
export type ModelTier = "strategic" | "implementation" | "routine";

/** Account scope for governance routing */
export type AccountScope = "personal" | "novo" | string;

/** Palace URI scheme for addressable state */
export interface PalaceUri {
  readonly scheme: "palace";
  readonly scope: string;
  readonly path: string;
}

/** Context tier levels inspired by OpenViking */
export type ContextLevel = 0 | 1 | 2;

/** A memory item with tiered representations */
export interface MemoryItem {
  readonly uri: string;
  readonly tier: SecurityTier;
  readonly l0: string; // Abstract: <100 tokens
  readonly l1: string; // Overview: <2000 tokens
  readonly l2: string; // Full detail
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Structured message envelope for deterministic agent interaction */
export interface AgentMessage {
  readonly type: "task" | "result" | "status" | "counsel" | "cancel";
  readonly id: string;
  readonly correlationId: string;
  readonly parentId?: string;
  readonly from: string;
  readonly to: string;
  readonly timestamp: string;
  readonly payload: unknown;
}

/** Courtier configuration as loaded from YAML */
export interface CourtierConfig {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly domain: {
    readonly primary: string;
    readonly keywords: readonly string[];
  };
  readonly security: {
    readonly tierAccess: readonly SecurityTier[];
    readonly writeScope: string;
    readonly auditLevel: "none" | "standard" | "full";
  };
  readonly operations: {
    readonly heartbeat: string;
    readonly triggers: readonly string[];
    readonly outputs: readonly string[];
  };
  readonly modelPreference: {
    readonly default: string;
    readonly deepWork: string;
    readonly quick: string;
  };
  readonly accountScope: AccountScope;
  readonly canUseAccounts: readonly string[];
  readonly status: CourtierStatus;
  readonly activatedInPhase: number;
}

/** Security tier configuration */
export interface TierConfig {
  readonly paths: readonly string[];
  readonly access: "none" | readonly string[];
  readonly sync: string;
  readonly audit?: boolean;
}

/** Full security configuration */
export interface SecurityConfig {
  readonly tiers: Record<SecurityTier, TierConfig>;
}

/** Provider capabilities for model-agnostic routing */
export interface ProviderCapabilities {
  readonly providerId: ProviderId;
  readonly models: readonly string[];
  readonly supportsStreaming: boolean;
  readonly supportsTools: boolean;
}
