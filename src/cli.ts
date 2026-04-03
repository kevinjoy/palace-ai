#!/usr/bin/env bun
/**
 * Palace AI — CLI Entry Point
 *
 * Usage:
 *   palace start              Boot the Vizier and show status
 *   palace task "description"  Analyze and route a task
 *   palace status             Show courtier states and usage
 *   palace counsel            List Counsel Layer items (L0 summaries)
 *   palace activate <name>    Activate a dormant courtier
 *   palace config             Show current configuration
 *   palace heartbeat <name>   Trigger a courtier heartbeat
 *   palace exec <provider> "prompt"  Execute directly via a provider
 */

import { boot, type PalaceInstance } from "./boot.ts";

const COMMANDS = ["start", "task", "status", "counsel", "activate", "config", "heartbeat", "exec", "help"] as const;
type Command = typeof COMMANDS[number];

function printUsage(): void {
  console.log(`
Palace AI v0.1.0 — Personal Agentic Infrastructure

Usage: palace <command> [args]

Commands:
  start                Boot the Vizier and show court status
  task "description"   Analyze and route a task to a courtier
  status               Show courtier states and account usage
  counsel              List Counsel Layer items (L0 summaries)
  activate <name>      Activate a dormant courtier
  config               Show current palace.yaml configuration
  heartbeat <name>     Trigger a courtier heartbeat manually
  exec <provider> "p"  Execute a prompt directly via a provider
  help                 Show this help message
  `.trim());
}

function formatTable(rows: { name: string; status: string; domain: string }[]): string {
  const nameW = Math.max(10, ...rows.map((r) => r.name.length));
  const statusW = Math.max(8, ...rows.map((r) => r.status.length));
  const header = `${"COURTIER".padEnd(nameW)}  ${"STATUS".padEnd(statusW)}  DOMAIN`;
  const divider = "─".repeat(header.length);
  const body = rows.map((r) =>
    `${r.name.padEnd(nameW)}  ${colorStatus(r.status).padEnd(statusW + 10)}  ${r.domain}`
  ).join("\n");
  return `${header}\n${divider}\n${body}`;
}

function colorStatus(status: string): string {
  switch (status) {
    case "active": return `\x1b[32m${status}\x1b[0m`;
    case "dormant": return `\x1b[33m${status}\x1b[0m`;
    case "activating": return `\x1b[36m${status}\x1b[0m`;
    case "suspended": return `\x1b[31m${status}\x1b[0m`;
    default: return `\x1b[90m${status}\x1b[0m`;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = (args[0] ?? "help") as Command;

  if (command === "help" || !COMMANDS.includes(command)) {
    printUsage();
    return;
  }

  // Boot Palace for all commands except help
  let palace: PalaceInstance;
  try {
    palace = await boot();
  } catch (err) {
    console.error(`Failed to boot Palace: ${(err as Error).message}`);
    process.exit(1);
  }

  switch (command) {
    case "start": {
      console.log(`\n🏰 Palace AI v${palace.config.palace.version}`);
      console.log(`👑 Principal: ${palace.config.palace.principal.name}`);
      console.log(`📍 Phase: ${palace.config.palace.phase}\n`);

      const court = palace.vizier.getCourtStatus();
      console.log(formatTable(court));

      const providers = palace.providers.list();
      console.log(`\n⚡ Providers: ${providers.map((p) => p.id).join(", ")}`);
      console.log(`\nPalace is ready. Use 'palace task \"...\"' to dispatch work.\n`);
      break;
    }

    case "task": {
      const description = args.slice(1).join(" ");
      if (!description) {
        console.error("Usage: palace task \"description of the task\"");
        process.exit(1);
      }

      const decision = palace.vizier.analyzeTask({
        description,
        project: "default",
      });

      const courtier = palace.vizier.matchCourtier(description);

      console.log(`\n📋 Task Analysis`);
      console.log(`  Description: ${description}`);
      console.log(`  Account:     ${decision.account}`);
      console.log(`  Provider:    ${decision.providerId}`);
      console.log(`  Model:       ${decision.model}`);
      console.log(`  Courtier:    ${courtier?.displayName ?? "(no match — Vizier handles directly)"}`);
      console.log(`  Correlation: ${decision.correlationId}`);
      console.log(`  Reasoning:   ${decision.reasoning}\n`);
      break;
    }

    case "status": {
      const court = palace.vizier.getCourtStatus();
      console.log("\n🏰 Court Status\n");
      console.log(formatTable(court));

      const providers = palace.providers.list();
      console.log("\n⚡ Provider Status");
      for (const provider of providers) {
        const status = await provider.status();
        const icon = status.available ? "✓" : "✗";
        console.log(`  ${icon} ${provider.id}: ${status.available ? "available" : "unavailable"}`);
      }
      console.log();
      break;
    }

    case "counsel": {
      const items = await palace.vizier.memory.list("counsel");
      if (items.length === 0) {
        console.log("\n📜 Counsel Layer is empty. No submissions yet.\n");
        break;
      }
      console.log(`\n📜 Counsel Layer (${items.length} items)\n`);
      for (const item of items) {
        console.log(`  • [${item.tier}] ${item.l0}`);
        console.log(`    URI: ${item.uri}`);
        console.log(`    Updated: ${item.updatedAt}\n`);
      }
      break;
    }

    case "activate": {
      const name = args[1];
      if (!name) {
        console.error("Usage: palace activate <courtier-name>");
        process.exit(1);
      }
      try {
        palace.vizier.activateCourtier(name);
        console.log(`\n✅ ${name} activated successfully.\n`);
        const court = palace.vizier.getCourtStatus();
        console.log(formatTable(court));
        console.log();
      } catch (err) {
        console.error(`Failed to activate ${name}: ${(err as Error).message}`);
        process.exit(1);
      }
      break;
    }

    case "config": {
      console.log("\n⚙️  Palace Configuration\n");
      console.log(JSON.stringify(palace.config, null, 2));
      console.log();
      break;
    }

    case "heartbeat": {
      const name = args[1];
      if (!name) {
        console.error("Usage: palace heartbeat <courtier-name>");
        process.exit(1);
      }
      console.log(`\n💓 Triggering heartbeat for ${name}...`);
      // TODO: Full heartbeat with context injection.
      // For now, activate if dormant and show status.
      const courtier = palace.vizier.getCourtStatus().find((c) => c.name === name);
      if (!courtier) {
        console.error(`Courtier not found: ${name}`);
        process.exit(1);
      }
      if (courtier.status === "dormant") {
        palace.vizier.activateCourtier(name);
        console.log(`  ${name} was dormant — activated.`);
      }
      console.log(`  Status: ${courtier.status}`);
      console.log(`  Domain: ${courtier.domain}`);
      console.log(`  Heartbeat complete.\n`);
      break;
    }

    case "exec": {
      const providerId = args[1];
      const prompt = args.slice(2).join(" ");
      if (!providerId || !prompt) {
        console.error("Usage: palace exec <provider-id> \"prompt\"");
        process.exit(1);
      }

      const provider = palace.providers.get(providerId);
      if (!provider) {
        console.error(`Provider not found: ${providerId}. Available: ${palace.providers.list().map((p) => p.id).join(", ")}`);
        process.exit(1);
      }

      console.log(`\n⚡ Executing via ${providerId}...\n`);
      try {
        const result = await provider.execute({ prompt });
        console.log(result.content);
        console.log(`\n--- ${result.providerId} | ${result.model} | ${result.durationMs}ms | in:${result.usage.inputTokens} out:${result.usage.outputTokens} ---\n`);
      } catch (err) {
        console.error(`Execution failed: ${(err as Error).message}`);
        process.exit(1);
      }
      break;
    }
  }
}

main().catch((err) => {
  console.error(`Palace error: ${(err as Error).message}`);
  process.exit(1);
});
