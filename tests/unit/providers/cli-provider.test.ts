import { describe, it, expect } from "vitest";
import { CLIProvider } from "@palace/providers/cli-provider.ts";

describe("CLIProvider", () => {
  describe("construction", () => {
    it("creates a provider with correct id", () => {
      const provider = new CLIProvider({
        id: "test-claude",
        command: "claude",
        type: "claude",
        configDir: "~/.claude",
      });
      expect(provider.id).toBe("test-claude");
    });
  });

  describe("status", () => {
    it("reports claude as available", async () => {
      const provider = new CLIProvider({
        id: "claude-check",
        command: "claude",
        type: "claude",
      });
      const status = await provider.status();
      expect(status.available).toBe(true);
      expect(status.lastChecked).toBeDefined();
    });

    it("reports codex as available", async () => {
      const provider = new CLIProvider({
        id: "codex-check",
        command: "codex",
        type: "codex",
      });
      const status = await provider.status();
      expect(status.available).toBe(true);
    });

    it("reports gemini as available", async () => {
      const provider = new CLIProvider({
        id: "gemini-check",
        command: "gemini",
        type: "gemini",
      });
      const status = await provider.status();
      expect(status.available).toBe(true);
    });

    it("reports non-existent command as unavailable", async () => {
      const provider = new CLIProvider({
        id: "fake",
        command: "nonexistent-tool-xyz",
        type: "generic",
      });
      const status = await provider.status();
      expect(status.available).toBe(false);
    });
  });

  describe("models", () => {
    it("returns configured model info", async () => {
      const provider = new CLIProvider({
        id: "claude-test",
        command: "claude",
        type: "claude",
        defaultModel: "claude-sonnet-4-6",
      });
      const models = await provider.models();
      expect(models.length).toBe(1);
      expect(models[0]!.id).toBe("claude-sonnet-4-6");
      expect(models[0]!.provider).toBe("claude-test");
    });
  });

  // Note: execute() tests that actually call LLM providers are in
  // integration tests, not unit tests — they cost tokens and time.
});
