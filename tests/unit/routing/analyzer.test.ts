import { describe, it, expect } from "vitest";
import { TaskAnalyzer, type TaskInput } from "@palace/routing/analyzer.ts";

describe("TaskAnalyzer", () => {
  const analyzer = new TaskAnalyzer();

  describe("complexity assessment", () => {
    it("classifies simple tasks as routine", () => {
      const task: TaskInput = {
        description: "Check the weather in Kerala",
        project: "personal",
      };
      const result = analyzer.analyze(task);
      expect(result.complexity).toBe("routine");
    });

    it("classifies coding tasks as implementation", () => {
      const task: TaskInput = {
        description: "Write a function to parse YAML config files with Zod validation",
        project: "palace-ai",
      };
      const result = analyzer.analyze(task);
      expect(result.complexity).toBe("implementation");
    });

    it("classifies architectural tasks as strategic", () => {
      const task: TaskInput = {
        description: "Design the provider abstraction layer for multi-model routing across Palace courtiers",
        project: "palace-ai",
      };
      const result = analyzer.analyze(task);
      expect(result.complexity).toBe("strategic");
    });
  });

  describe("sensitivity detection", () => {
    it("flags tasks mentioning client data as sensitive", () => {
      const task: TaskInput = {
        description: "Analyze the Q2 compensation data for client ABC",
        project: "comp-strata",
        tags: ["novo"],
      };
      const result = analyzer.analyze(task);
      expect(result.sensitive).toBe(true);
      expect(result.requiredAccount).toBe("novo");
    });

    it("does not flag general tasks as sensitive", () => {
      const task: TaskInput = {
        description: "Research OpenViking's memory architecture",
        project: "palace-ai",
      };
      const result = analyzer.analyze(task);
      expect(result.sensitive).toBe(false);
    });

    it("flags tasks with explicit novo tag as sensitive", () => {
      const task: TaskInput = {
        description: "Review the project roadmap",
        project: "comptech",
        tags: ["novo", "confidential"],
      };
      const result = analyzer.analyze(task);
      expect(result.sensitive).toBe(true);
      expect(result.requiredAccount).toBe("novo");
    });
  });

  describe("importance scoring", () => {
    it("scores higher for projects with more weight", () => {
      const important: TaskInput = {
        description: "Fix critical bug in auth system",
        project: "palace-ai",
        priority: "urgent",
      };
      const routine: TaskInput = {
        description: "Update README",
        project: "personal",
        priority: "low",
      };
      const importantResult = analyzer.analyze(important);
      const routineResult = analyzer.analyze(routine);
      expect(importantResult.importance).toBeGreaterThan(routineResult.importance);
    });
  });

  describe("model recommendation", () => {
    it("recommends opus for strategic tasks", () => {
      const task: TaskInput = {
        description: "Design the security architecture for multi-tenant agent isolation",
        project: "palace-ai",
      };
      const result = analyzer.analyze(task);
      expect(result.recommendedModel).toBe("opus");
    });

    it("recommends sonnet for implementation tasks", () => {
      const task: TaskInput = {
        description: "Implement the courtier config parser with Zod validation",
        project: "palace-ai",
      };
      const result = analyzer.analyze(task);
      expect(result.recommendedModel).toBe("sonnet");
    });

    it("recommends haiku for routine tasks", () => {
      const task: TaskInput = {
        description: "List all files in the src directory",
        project: "personal",
      };
      const result = analyzer.analyze(task);
      expect(result.recommendedModel).toBe("haiku");
    });
  });
});
