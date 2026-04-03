/**
 * Task Analyzer — assesses complexity, sensitivity, and importance
 * to inform routing decisions. This is the "brain" that decides
 * which model and account a task should use.
 */

import type { ModelTier } from "../types.ts";

export interface TaskInput {
  readonly description: string;
  readonly project: string;
  readonly tags?: readonly string[];
  readonly priority?: "urgent" | "high" | "medium" | "low";
}

export interface TaskAnalysis {
  readonly complexity: ModelTier;
  readonly sensitive: boolean;
  readonly requiredAccount?: string;
  readonly importance: number; // 1-10
  readonly recommendedModel: "opus" | "sonnet" | "haiku";
}

/** Keywords that indicate strategic/architectural complexity */
const STRATEGIC_KEYWORDS = [
  "design", "architect", "plan", "strategy", "system", "infrastructure",
  "abstraction", "framework", "security model", "trade-off", "multi-",
];

/** Keywords that indicate implementation complexity */
const IMPLEMENTATION_KEYWORDS = [
  "implement", "build", "write", "create", "function", "class", "module",
  "parse", "validate", "test", "refactor", "fix", "debug", "code",
  "research", "investigate", "analyze", "study", "explore", "compare",
  "review", "assess", "evaluate", "trend",
];

/** Keywords/tags that indicate Novo-sensitive work */
const SENSITIVE_INDICATORS = [
  "novo", "client", "compensation", "confidential", "nda",
  "comp-strata", "comptech", "comp-agency",
];

const PRIORITY_SCORES: Record<string, number> = {
  urgent: 10,
  high: 8,
  medium: 5,
  low: 2,
};

export class TaskAnalyzer {
  /** Analyze a task to determine routing parameters */
  analyze(task: TaskInput): TaskAnalysis {
    const complexity = this.assessComplexity(task.description);
    const sensitive = this.detectSensitivity(task);
    const importance = this.scoreImportance(task);
    const recommendedModel = this.recommendModel(complexity);

    return {
      complexity,
      sensitive,
      ...(sensitive ? { requiredAccount: "novo" } : {}),
      importance,
      recommendedModel,
    };
  }

  private assessComplexity(description: string): ModelTier {
    const lower = description.toLowerCase();

    const strategicScore = STRATEGIC_KEYWORDS.filter((kw) => lower.includes(kw)).length;
    const implScore = IMPLEMENTATION_KEYWORDS.filter((kw) => lower.includes(kw)).length;

    if (strategicScore >= 2 || (strategicScore >= 1 && description.length > 100)) {
      return "strategic";
    }
    if (implScore >= 1) {
      return "implementation";
    }
    return "routine";
  }

  private detectSensitivity(task: TaskInput): boolean {
    const lower = task.description.toLowerCase();
    const projectLower = task.project.toLowerCase();
    const tags = task.tags?.map((t) => t.toLowerCase()) ?? [];

    return SENSITIVE_INDICATORS.some(
      (indicator) =>
        lower.includes(indicator) ||
        projectLower.includes(indicator) ||
        tags.includes(indicator),
    );
  }

  private scoreImportance(task: TaskInput): number {
    let score = PRIORITY_SCORES[task.priority ?? "medium"] ?? 5;

    // Boost for known high-value projects
    if (task.project === "palace-ai") score = Math.min(10, score + 1);

    return score;
  }

  private recommendModel(complexity: ModelTier): "opus" | "sonnet" | "haiku" {
    switch (complexity) {
      case "strategic": return "opus";
      case "implementation": return "sonnet";
      case "routine": return "haiku";
    }
  }
}
