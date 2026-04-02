/**
 * Provider Registry — tracks available LLM providers and their capabilities.
 * Stub — implemented alongside routing.
 */

import type { Provider } from "./provider.ts";
import type { ProviderId } from "../types.ts";

export class ProviderRegistry {
  private readonly providers = new Map<ProviderId, Provider>();

  register(provider: Provider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: ProviderId): Provider | undefined {
    return this.providers.get(id);
  }

  list(): readonly Provider[] {
    return [...this.providers.values()];
  }
}
