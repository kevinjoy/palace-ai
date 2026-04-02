/**
 * Palace AI — Provider Interface
 *
 * Model-agnostic provider abstraction. Every LLM provider (Anthropic, OpenAI,
 * Google, Ollama, etc.) implements this interface. The Vizier and Courtiers
 * interact with providers ONLY through this contract.
 *
 * Inspired by OpenCode's Provider interface (references/opencode/internal/llm/provider/provider.go)
 */

import type { ProviderId } from "../types.ts";

/** Token usage reported by a provider after execution */
export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens?: number;
  readonly cacheWriteTokens?: number;
}

/** Result from a provider execution */
export interface ProviderResult {
  readonly content: string;
  readonly usage: TokenUsage;
  readonly model: string;
  readonly providerId: ProviderId;
  readonly durationMs: number;
}

/** Provider availability status */
export interface ProviderStatus {
  readonly available: boolean;
  readonly remainingCapacity: number | null; // null = unknown/unlimited
  readonly lastChecked: string;
}

/** Model info exposed by a provider */
export interface ModelInfo {
  readonly id: string;
  readonly name: string;
  readonly provider: ProviderId;
  readonly contextWindow: number;
  readonly supportsTools: boolean;
  readonly supportsStreaming: boolean;
  readonly tier: "strategic" | "implementation" | "routine";
}

/** Task to send to a provider */
export interface ProviderTask {
  readonly prompt: string;
  readonly systemPrompt?: string;
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

/**
 * Provider interface — the contract every LLM provider must implement.
 *
 * Three methods, matching OpenCode's pattern:
 * - execute: send a task, get structured output
 * - status: check provider health and remaining capacity
 * - models: what models are available and what they're good at
 */
export interface Provider {
  readonly id: ProviderId;

  /** Execute a task and return the result */
  execute(task: ProviderTask): Promise<ProviderResult>;

  /** Check provider health and remaining capacity */
  status(): Promise<ProviderStatus>;

  /** List available models with their capabilities */
  models(): Promise<readonly ModelInfo[]>;
}
