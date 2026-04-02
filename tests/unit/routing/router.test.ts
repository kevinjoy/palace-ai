import { describe, it, expect, beforeEach } from "vitest";
import { TokenRouter } from "@palace/routing/router.ts";
import { type TaskAnalysis } from "@palace/routing/analyzer.ts";

describe("TokenRouter", () => {
  let router: TokenRouter;

  beforeEach(() => {
    router = new TokenRouter({
      accounts: {
        personal: { providers: ["claude-personal", "codex", "gemini"] },
        novo: { providers: ["claude-novo"] },
      },
      defaultAccount: "personal",
      modelMapping: {
        opus: "claude-opus-4-6",
        sonnet: "claude-sonnet-4-6",
        haiku: "claude-haiku-4-5",
      },
    });
  });

  describe("route", () => {
    it("routes sensitive tasks to novo account", () => {
      const analysis: TaskAnalysis = {
        complexity: "implementation",
        sensitive: true,
        requiredAccount: "novo",
        importance: 8,
        recommendedModel: "sonnet",
      };

      const decision = router.route(analysis);
      expect(decision.account).toBe("novo");
      expect(decision.providerId).toBe("claude-novo");
    });

    it("routes non-sensitive tasks to personal account", () => {
      const analysis: TaskAnalysis = {
        complexity: "implementation",
        sensitive: false,
        importance: 5,
        recommendedModel: "sonnet",
      };

      const decision = router.route(analysis);
      expect(decision.account).toBe("personal");
    });

    it("selects model based on complexity", () => {
      const strategic: TaskAnalysis = {
        complexity: "strategic",
        sensitive: false,
        importance: 9,
        recommendedModel: "opus",
      };

      const decision = router.route(strategic);
      expect(decision.model).toBe("claude-opus-4-6");
    });

    it("uses haiku for routine tasks", () => {
      const routine: TaskAnalysis = {
        complexity: "routine",
        sensitive: false,
        importance: 2,
        recommendedModel: "haiku",
      };

      const decision = router.route(routine);
      expect(decision.model).toBe("claude-haiku-4-5");
    });

    it("includes correlationId in decision", () => {
      const analysis: TaskAnalysis = {
        complexity: "routine",
        sensitive: false,
        importance: 3,
        recommendedModel: "haiku",
      };

      const decision = router.route(analysis, "corr-abc-123");
      expect(decision.correlationId).toBe("corr-abc-123");
    });
  });

  describe("budget tracking", () => {
    it("tracks token usage per account", () => {
      router.recordUsage("personal", { inputTokens: 1000, outputTokens: 500 });
      router.recordUsage("personal", { inputTokens: 2000, outputTokens: 800 });

      const usage = router.getUsage("personal");
      expect(usage.inputTokens).toBe(3000);
      expect(usage.outputTokens).toBe(1300);
    });

    it("tracks usage separately per account", () => {
      router.recordUsage("personal", { inputTokens: 1000, outputTokens: 500 });
      router.recordUsage("novo", { inputTokens: 3000, outputTokens: 1500 });

      expect(router.getUsage("personal").inputTokens).toBe(1000);
      expect(router.getUsage("novo").inputTokens).toBe(3000);
    });

    it("returns zero usage for unused accounts", () => {
      const usage = router.getUsage("personal");
      expect(usage.inputTokens).toBe(0);
      expect(usage.outputTokens).toBe(0);
    });
  });
});
