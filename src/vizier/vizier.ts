/**
 * The Grand Vizier (Finn) — master orchestrator for Palace AI.
 *
 * Coordinates all subsystems: analyzes tasks, routes to providers,
 * dispatches to courtiers, aggregates results through the Counsel Layer,
 * and emits events for observability.
 */

import type { CourtierConfig, SecurityTier } from "../types.ts";
import type { CourtierRegistry } from "../courtiers/registry.ts";
import type { PalaceMemory, CallerIdentity } from "../memory/memory.ts";
import type { CounselLayer } from "../memory/counsel.ts";
import type { TokenRouter, RoutingDecision } from "../routing/router.ts";
import type { TaskAnalyzer, TaskInput } from "../routing/analyzer.ts";
import type { ProviderRegistry } from "../providers/registry.ts";
import type { ProviderResult } from "../providers/provider.ts";
import { EventBus } from "../events/event-bus.ts";
import { ProviderUnavailableError } from "../errors/palace-errors.ts";

interface VizierConfig {
  readonly registry: CourtierRegistry;
  readonly memory: PalaceMemory;
  readonly counsel: CounselLayer;
  readonly router: TokenRouter;
  readonly analyzer: TaskAnalyzer;
  readonly eventBus: EventBus;
  readonly providers?: ProviderRegistry;
}

interface CounselSubmission {
  readonly from: string;
  readonly title: string;
  readonly content: string;
  readonly tier: SecurityTier;
}

/** Full result of a dispatched task */
export interface DispatchResult {
  readonly content: string;
  readonly decision: RoutingDecision;
  readonly courtier: CourtierConfig | null;
  readonly providerResult: ProviderResult;
  readonly durationMs: number;
}

export class Vizier {
  private readonly registry: CourtierRegistry;
  readonly memory: PalaceMemory;
  private readonly counsel: CounselLayer;
  private readonly router: TokenRouter;
  private readonly analyzer: TaskAnalyzer;
  private readonly eventBus: EventBus;
  private readonly providers: ProviderRegistry | undefined;

  constructor(config: VizierConfig) {
    this.registry = config.registry;
    this.memory = config.memory;
    this.counsel = config.counsel;
    this.router = config.router;
    this.analyzer = config.analyzer;
    this.eventBus = config.eventBus;
    this.providers = config.providers;
  }

  /** Number of registered courtiers */
  get registeredCourtiers(): number {
    return this.registry.size;
  }

  /** Analyze a task and produce a routing decision */
  analyzeTask(task: TaskInput): RoutingDecision {
    const analysis = this.analyzer.analyze(task);
    const decision = this.router.route(analysis);

    this.eventBus.emit(
      EventBus.createEvent("vizier:task_routed", "vizier", {
        task: task.description,
        analysis,
        decision,
      }, decision.correlationId),
    );

    return decision;
  }

  /**
   * Dispatch a task end-to-end:
   * analyze → route → match courtier → execute via provider → store in Counsel Layer
   */
  async dispatch(task: TaskInput): Promise<DispatchResult> {
    const startTime = Date.now();

    // 1. Analyze and route
    const decision = this.analyzeTask(task);

    // 2. Match courtier
    const courtier = this.matchCourtier(task.description);

    // 3. Get provider
    if (!this.providers) {
      throw new ProviderUnavailableError("none", "No provider registry configured");
    }
    const provider = this.providers.get(decision.providerId);
    if (!provider) {
      throw new ProviderUnavailableError(decision.providerId, "Provider not found in registry");
    }

    // 4. Build prompt with courtier context
    const systemPrompt = courtier
      ? buildCourtierSystemPrompt(courtier)
      : "You are the Grand Vizier (Finn), master orchestrator of Palace AI. Complete the task directly.";

    // 5. Execute via provider
    this.eventBus.emit(
      EventBus.createEvent("provider:task_started", "vizier", {
        providerId: decision.providerId,
        model: decision.model,
        courtier: courtier?.name ?? "vizier",
      }, decision.correlationId),
    );

    const providerResult = await provider.execute({
      prompt: task.description,
      systemPrompt,
      model: decision.model,
    });

    // 6. Track token usage
    this.router.recordUsage(decision.account, {
      inputTokens: providerResult.usage.inputTokens,
      outputTokens: providerResult.usage.outputTokens,
    });

    // 7. Store result in Counsel Layer
    const submitter = courtier?.name ?? "vizier";
    const callerIdentity: CallerIdentity = {
      name: submitter,
      security: { tierAccess: courtier?.security.tierAccess ?? ["open_court"] },
    };

    await this.counsel.submit({
      from: submitter,
      title: `Task: ${task.description.slice(0, 60)}`,
      content: providerResult.content,
      tier: "open_court",
    }, callerIdentity);

    // 8. Emit completion event
    const durationMs = Date.now() - startTime;

    this.eventBus.emit(
      EventBus.createEvent("vizier:task_completed", "vizier", {
        task: task.description,
        courtier: courtier?.name ?? "vizier",
        providerId: decision.providerId,
        model: decision.model,
        durationMs,
        tokens: providerResult.usage,
      }, decision.correlationId),
    );

    return {
      content: providerResult.content,
      decision,
      courtier,
      providerResult,
      durationMs,
    };
  }

  /** Match a task description to the best courtier by keyword overlap */
  matchCourtier(description: string): CourtierConfig | null {
    const lower = description.toLowerCase();
    const courtiers = this.registry.list();

    let bestMatch: CourtierConfig | null = null;
    let bestScore = 0;

    for (const { config } of courtiers) {
      const keywords = config.domain.keywords;
      const score = keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;

      const primaryWords = config.domain.primary.toLowerCase().split(/\s+/);
      const primaryScore = primaryWords.filter((w) => lower.includes(w) && w.length > 3).length;

      const totalScore = score + primaryScore;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = config;
      }
    }

    return bestScore > 0 ? bestMatch : null;
  }

  /** Submit an item to the Counsel Layer with caller verification */
  async submitToCounsel(submission: CounselSubmission, caller: CallerIdentity): Promise<void> {
    await this.counsel.submit(submission, caller);
  }

  /** Activate a dormant courtier through the full lifecycle */
  activateCourtier(name: string): void {
    this.registry.transition(name, "activating");
    this.eventBus.emit(
      EventBus.createEvent("courtier:transition", "vizier", {
        courtier: name, from: "dormant", to: "activating",
      }),
    );

    this.registry.transition(name, "active");
    this.eventBus.emit(
      EventBus.createEvent("courtier:transition", "vizier", {
        courtier: name, from: "activating", to: "active",
      }),
    );
  }

  /** Suspend an active courtier */
  suspendCourtier(name: string): void {
    this.registry.transition(name, "suspended");
    this.eventBus.emit(
      EventBus.createEvent("courtier:transition", "vizier", {
        courtier: name, from: "active", to: "suspended",
      }),
    );
  }

  /** Get a summary of active courtiers and their status */
  getCourtStatus(): { name: string; status: string; domain: string }[] {
    return this.registry.list().map(({ config, lifecycle }) => ({
      name: config.name,
      status: lifecycle.status,
      domain: config.domain.primary,
    }));
  }
}

/** Build a system prompt that gives the provider the courtier's identity and context */
function buildCourtierSystemPrompt(courtier: CourtierConfig): string {
  return [
    `You are ${courtier.displayName}, a courtier of Palace AI.`,
    `Your domain: ${courtier.domain.primary}.`,
    `Your expertise covers: ${courtier.domain.keywords.join(", ")}.`,
    "",
    "Complete the task from your specialized perspective.",
    "Be specific and substantive. Focus on actionable output.",
  ].join("\n");
}
