/**
 * Courtier Registry — tracks active courtiers and their state.
 * Full implementation in Step 3 (INTERN-55).
 */

import type { CourtierConfig, CourtierStatus } from "../types.ts";
import { CourtierLifecycle } from "./lifecycle.ts";

interface RegisteredCourtier {
  readonly config: CourtierConfig;
  readonly lifecycle: CourtierLifecycle;
}

export class CourtierRegistry {
  private readonly courtiers = new Map<string, RegisteredCourtier>();

  /** Register a courtier with the Vizier */
  register(config: CourtierConfig): void {
    if (this.courtiers.has(config.name)) {
      throw new Error(`Courtier already registered: ${config.name}`);
    }
    this.courtiers.set(config.name, {
      config,
      lifecycle: new CourtierLifecycle(config.name, config.status),
    });
  }

  /** Get a registered courtier by name */
  get(name: string): RegisteredCourtier | undefined {
    return this.courtiers.get(name);
  }

  /** List all registered courtiers */
  list(): readonly RegisteredCourtier[] {
    return [...this.courtiers.values()];
  }

  /** List courtiers filtered by status */
  byStatus(status: CourtierStatus): readonly RegisteredCourtier[] {
    return this.list().filter((c) => c.lifecycle.status === status);
  }

  /** Transition a courtier's status */
  transition(name: string, to: CourtierStatus): void {
    const courtier = this.courtiers.get(name);
    if (!courtier) throw new Error(`Courtier not found: ${name}`);
    courtier.lifecycle.transition(to);
  }

  /** Count of registered courtiers */
  get size(): number {
    return this.courtiers.size;
  }
}
