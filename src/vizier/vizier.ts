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
import { EventBus } from "../events/event-bus.ts";

interface VizierConfig {
  readonly registry: CourtierRegistry;
  readonly memory: PalaceMemory;
  readonly counsel: CounselLayer;
  readonly router: TokenRouter;
  readonly analyzer: TaskAnalyzer;
  readonly eventBus: EventBus;
}

interface CounselSubmission {
  readonly from: string;
  readonly title: string;
  readonly content: string;
  readonly tier: SecurityTier;
}

export class Vizier {
  private readonly registry: CourtierRegistry;
  readonly memory: PalaceMemory;
  private readonly counsel: CounselLayer;
  private readonly router: TokenRouter;
  private readonly analyzer: TaskAnalyzer;
  private readonly eventBus: EventBus;

  constructor(config: VizierConfig) {
    this.registry = config.registry;
    this.memory = config.memory;
    this.counsel = config.counsel;
    this.router = config.router;
    this.analyzer = config.analyzer;
    this.eventBus = config.eventBus;
  }

  /** Number of registered courtiers */
  get registeredCourtiers(): number {
    return this.registry.size;
  }

  /** Analyze a task and produce a routing decision */
  analyzeTask(task: TaskInput): RoutingDecision {
    const analysis = this.analyzer.analyze(task);
    const decision = this.router.route(analysis);

    // Emit event for observability
    this.eventBus.emit(
      EventBus.createEvent("vizier:task_routed", "vizier", {
        task: task.description,
        analysis,
        decision,
      }, decision.correlationId),
    );

    return decision;
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

      // Also check if the primary domain description matches
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

  /** Activate a dormant courtier through the full lifecycle (dormant → activating → active) */
  activateCourtier(name: string): void {
    // dormant → activating
    this.registry.transition(name, "activating");
    this.eventBus.emit(
      EventBus.createEvent("courtier:transition", "vizier", {
        courtier: name,
        from: "dormant",
        to: "activating",
      }),
    );

    // activating → active
    this.registry.transition(name, "active");
    this.eventBus.emit(
      EventBus.createEvent("courtier:transition", "vizier", {
        courtier: name,
        from: "activating",
        to: "active",
      }),
    );
  }

  /** Suspend an active courtier */
  suspendCourtier(name: string): void {
    this.registry.transition(name, "suspended");
    this.eventBus.emit(
      EventBus.createEvent("courtier:transition", "vizier", {
        courtier: name,
        from: "active",
        to: "suspended",
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
