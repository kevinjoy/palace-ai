/**
 * CLI Provider — executes LLM tasks via command-line tools.
 *
 * Supports any CLI that accepts a prompt and returns output:
 * - claude -p "prompt" --output-format json
 * - codex exec "prompt"
 * - gemini -p "prompt"
 *
 * Each provider runs as a subprocess with configurable env vars
 * (e.g., CLAUDE_CONFIG_DIR for multi-account isolation).
 */

import { spawn, execSync } from "child_process";
import type { Provider, ProviderTask, ProviderResult, ProviderStatus, ModelInfo, TokenUsage } from "./provider.ts";
import type { ProviderId } from "../types.ts";
import { ProviderUnavailableError } from "../errors/palace-errors.ts";

export interface CLIProviderConfig {
  readonly id: ProviderId;
  readonly command: string;
  readonly type: "claude" | "codex" | "gemini" | "generic";
  readonly configDir?: string; // For CLAUDE_CONFIG_DIR
  readonly defaultModel?: string;
  readonly env?: Record<string, string>;
}

/** Build the command args for each provider type */
function buildArgs(type: CLIProviderConfig["type"], task: ProviderTask): string[] {
  switch (type) {
    case "claude":
      return [
        "-p", task.prompt,
        "--output-format", "json",
        ...(task.model ? ["--model", task.model] : []),
        ...(task.maxTokens ? ["--max-tokens", String(task.maxTokens)] : []),
      ];
    case "codex":
      return [
        "exec", task.prompt,
        "--json",
        ...(task.model ? ["-c", `model="${task.model}"`] : []),
      ];
    case "gemini":
      return [
        "-p", task.prompt,
        ...(task.model ? ["--model", task.model] : []),
      ];
    case "generic":
      return [task.prompt];
  }
}

/** Parse token usage from Claude JSON output */
function parseClaudeUsage(output: unknown): TokenUsage {
  if (typeof output === "object" && output !== null) {
    const obj = output as Record<string, unknown>;
    const usage = obj.usage as Record<string, number> | undefined;
    if (usage) {
      return {
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        cacheReadTokens: usage.cache_read_input_tokens,
        cacheWriteTokens: usage.cache_creation_input_tokens,
      };
    }
  }
  return { inputTokens: 0, outputTokens: 0 };
}

/** Extract text content from Claude JSON output */
function parseClaudeContent(output: unknown): string {
  if (typeof output === "object" && output !== null) {
    const obj = output as Record<string, unknown>;
    // Claude JSON output has { result: "text" } or { content: "text" }
    if (typeof obj.result === "string") return obj.result;
    if (typeof obj.content === "string") return obj.content;
    // May also be in content blocks
    if (Array.isArray(obj.content)) {
      return obj.content
        .filter((b: Record<string, unknown>) => b.type === "text")
        .map((b: Record<string, unknown>) => b.text)
        .join("\n");
    }
  }
  return String(output);
}

export class CLIProvider implements Provider {
  readonly id: ProviderId;
  private readonly config: CLIProviderConfig;
  private resolvedCommand: string | undefined;

  constructor(config: CLIProviderConfig) {
    this.id = config.id;
    this.config = config;
  }

  /** Resolve the full path to the CLI command (cached) */
  private getCommand(): string {
    if (!this.resolvedCommand) {
      try {
        this.resolvedCommand = execSync(`which ${this.config.command}`, { encoding: "utf-8" }).trim();
      } catch {
        this.resolvedCommand = this.config.command; // Fallback to raw command
      }
    }
    return this.resolvedCommand;
  }

  async execute(task: ProviderTask): Promise<ProviderResult> {
    const args = buildArgs(this.config.type, task);
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      ...(this.config.env ?? {}),
    };

    // Multi-account isolation via CLAUDE_CONFIG_DIR
    if (this.config.configDir && this.config.type === "claude") {
      env.CLAUDE_CONFIG_DIR = this.config.configDir;
    }

    const startTime = Date.now();

    return new Promise<ProviderResult>((resolve, reject) => {
      const proc = spawn(this.getCommand(), args, {
        env,
        stdio: ["ignore", "pipe", "pipe"],
        cwd: process.cwd(),
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
      proc.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

      // AbortSignal support
      if (task.signal) {
        task.signal.addEventListener("abort", () => {
          proc.kill("SIGTERM");
          reject(new ProviderUnavailableError(this.id, "Task aborted"));
        });
      }

      proc.on("close", (code) => {
        const durationMs = Date.now() - startTime;

        if (code !== 0) {
          reject(new ProviderUnavailableError(
            this.id,
            `CLI exited with code ${code}. stderr: ${stderr.slice(0, 500) || "(empty)"}. stdout: ${stdout.slice(0, 200) || "(empty)"}`,
          ));
          return;
        }

        let content: string;
        let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

        if (this.config.type === "claude") {
          try {
            const parsed = JSON.parse(stdout);
            content = parseClaudeContent(parsed);
            usage = parseClaudeUsage(parsed);
          } catch {
            content = stdout.trim();
          }
        } else {
          content = stdout.trim();
        }

        resolve({
          content,
          usage,
          model: task.model ?? this.config.defaultModel ?? "unknown",
          providerId: this.id,
          durationMs,
        });
      });

      proc.on("error", (err) => {
        reject(new ProviderUnavailableError(this.id, err.message));
      });
    });
  }

  async status(): Promise<ProviderStatus> {
    // Check if the CLI command exists by running --version
    return new Promise<ProviderStatus>((resolve) => {
      const proc = spawn(this.getCommand(), ["--version"], {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: process.cwd(),
      });

      proc.on("close", (code) => {
        resolve({
          available: code === 0,
          remainingCapacity: null,
          lastChecked: new Date().toISOString(),
        });
      });

      proc.on("error", () => {
        resolve({
          available: false,
          remainingCapacity: null,
          lastChecked: new Date().toISOString(),
        });
      });
    });
  }

  async models(): Promise<readonly ModelInfo[]> {
    // CLI providers don't expose model lists — return configured defaults
    const model = this.config.defaultModel ?? this.config.command;
    return [{
      id: model,
      name: model,
      provider: this.id,
      contextWindow: 200000,
      supportsTools: this.config.type === "claude",
      supportsStreaming: true,
      tier: "implementation",
    }];
  }
}
