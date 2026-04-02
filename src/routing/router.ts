/**
 * Token Router — multi-account, multi-provider task routing.
 *
 * Routes tasks to the right provider, model, and account based on
 * task analysis. Tracks token usage per account for budget management.
 * Provider-agnostic: works with any provider registered in the system.
 */

import { randomUUID } from "crypto";
import type { TaskAnalysis } from "./analyzer.ts";

export interface RouterConfig {
  readonly accounts: Record<string, { providers: readonly string[] }>;
  readonly defaultAccount: string;
  readonly modelMapping: Record<string, string>; // alias → full model ID
}

export interface RoutingDecision {
  readonly account: string;
  readonly providerId: string;
  readonly model: string;
  readonly correlationId: string;
  readonly reasoning: string;
}

interface TokenCount {
  inputTokens: number;
  outputTokens: number;
}

export class TokenRouter {
  private readonly config: RouterConfig;
  private readonly usage = new Map<string, TokenCount>();

  constructor(config: RouterConfig) {
    this.config = config;
  }

  /** Route a task analysis to a specific provider, model, and account */
  route(analysis: TaskAnalysis, correlationId?: string): RoutingDecision {
    const account = this.selectAccount(analysis);
    const providerId = this.selectProvider(account);
    const model = this.selectModel(analysis.recommendedModel);
    const corrId = correlationId ?? randomUUID();

    const reasoning = [
      `complexity=${analysis.complexity}`,
      `sensitive=${analysis.sensitive}`,
      `importance=${analysis.importance}`,
      `→ account=${account}, provider=${providerId}, model=${model}`,
    ].join("; ");

    return { account, providerId, model, correlationId: corrId, reasoning };
  }

  /** Record token usage for an account */
  recordUsage(account: string, tokens: { inputTokens: number; outputTokens: number }): void {
    const current = this.usage.get(account) ?? { inputTokens: 0, outputTokens: 0 };
    this.usage.set(account, {
      inputTokens: current.inputTokens + tokens.inputTokens,
      outputTokens: current.outputTokens + tokens.outputTokens,
    });
  }

  /** Get cumulative token usage for an account */
  getUsage(account: string): Readonly<TokenCount> {
    return this.usage.get(account) ?? { inputTokens: 0, outputTokens: 0 };
  }

  /** Get usage across all accounts */
  getAllUsage(): Readonly<Record<string, TokenCount>> {
    return Object.fromEntries(this.usage.entries());
  }

  private selectAccount(analysis: TaskAnalysis): string {
    // Directional governance: sensitive tasks MUST use required account
    if (analysis.sensitive && analysis.requiredAccount) {
      return analysis.requiredAccount;
    }
    return this.config.defaultAccount;
  }

  private selectProvider(account: string): string {
    const acct = this.config.accounts[account];
    if (!acct || acct.providers.length === 0) {
      return this.config.accounts[this.config.defaultAccount]!.providers[0]!;
    }
    // For now, select first provider. Future: load-balance, check availability.
    return acct.providers[0]!;
  }

  private selectModel(recommended: string): string {
    return this.config.modelMapping[recommended] ?? recommended;
  }
}
