/**
 * Palace AI — Typed Error Hierarchy
 *
 * Every error has a code, message, and context. No silent failures.
 * Catch blocks use these instead of returning undefined.
 */

export class PalaceError extends Error {
  readonly code: string;
  readonly context: Record<string, unknown>;

  constructor(code: string, message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = "PalaceError";
    this.code = code;
    this.context = context;
  }
}

export class TierAccessDeniedError extends PalaceError {
  constructor(courtier: string, tier: string, resource: string) {
    super("TIER_ACCESS_DENIED", `Courtier "${courtier}" denied access to ${tier} resource: ${resource}`, {
      courtier,
      tier,
      resource,
    });
    this.name = "TierAccessDeniedError";
  }
}

export class MemoryNotFoundError extends PalaceError {
  constructor(uri: string) {
    super("MEMORY_NOT_FOUND", `Memory item not found: ${uri}`, { uri });
    this.name = "MemoryNotFoundError";
  }
}

export class MemoryCorruptedError extends PalaceError {
  constructor(uri: string, reason: string) {
    super("MEMORY_CORRUPTED", `Memory item corrupted at ${uri}: ${reason}`, { uri, reason });
    this.name = "MemoryCorruptedError";
  }
}

export class InvalidTransitionError extends PalaceError {
  constructor(courtier: string, from: string, to: string, allowed: readonly string[]) {
    super("INVALID_TRANSITION", `Invalid transition for "${courtier}": ${from} → ${to}. Allowed: ${allowed.join(", ")}`, {
      courtier,
      from,
      to,
      allowed,
    });
    this.name = "InvalidTransitionError";
  }
}

export class ConfigValidationError extends PalaceError {
  constructor(configPath: string, errors: readonly string[]) {
    super("CONFIG_VALIDATION", `Invalid config at ${configPath}: ${errors.join("; ")}`, {
      configPath,
      errors,
    });
    this.name = "ConfigValidationError";
  }
}

export class ProviderUnavailableError extends PalaceError {
  constructor(providerId: string, reason: string) {
    super("PROVIDER_UNAVAILABLE", `Provider "${providerId}" unavailable: ${reason}`, {
      providerId,
      reason,
    });
    this.name = "ProviderUnavailableError";
  }
}

export class PathTraversalError extends PalaceError {
  constructor(uri: string, resolvedPath: string) {
    super("PATH_TRAVERSAL", `URI "${uri}" resolves outside allowed directory: ${resolvedPath}`, {
      uri,
      resolvedPath,
    });
    this.name = "PathTraversalError";
  }
}

export class UnauthorizedCounselError extends PalaceError {
  constructor(from: string, reason: string) {
    super("UNAUTHORIZED_COUNSEL", `Unauthorized counsel submission from "${from}": ${reason}`, {
      from,
      reason,
    });
    this.name = "UnauthorizedCounselError";
  }
}
