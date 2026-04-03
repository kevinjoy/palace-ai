/**
 * Palace AI — Boot Sequence
 *
 * Loads configuration, registers providers and courtiers,
 * wires up the event bus and logger, and returns a ready Vizier.
 */

import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { parse } from "yaml";

import { Vizier } from "./vizier/vizier.ts";
import { CourtierRegistry } from "./courtiers/registry.ts";
import { parseCourtierConfig } from "./courtiers/config-parser.ts";
import { PalaceMemory } from "./memory/memory.ts";
import { CounselLayer } from "./memory/counsel.ts";
import { TokenRouter, type RouterConfig } from "./routing/router.ts";
import { TaskAnalyzer } from "./routing/analyzer.ts";
import { EventBus } from "./events/event-bus.ts";
import { Logger, consoleTransport } from "./observability/logger.ts";
import { CLIProvider, type CLIProviderConfig } from "./providers/cli-provider.ts";
import { ProviderRegistry } from "./providers/registry.ts";

/** Raw provider entry from palace.yaml */
interface RawProviderEntry {
  readonly id: string;
  readonly type: string;
  readonly command: string;
  readonly configDir?: string;
  readonly accounts?: readonly string[];
  readonly defaultModel?: string;
}

export interface PalaceConfig {
  readonly palace: {
    readonly version: string;
    readonly name: string;
    readonly principal: { readonly name: string };
    readonly phase: number;
    readonly providers: readonly RawProviderEntry[];
    readonly routing: Record<string, string>;
    readonly activeCourtiers: readonly string[];
  };
}

export interface PalaceInstance {
  readonly vizier: Vizier;
  readonly providers: ProviderRegistry;
  readonly eventBus: EventBus;
  readonly logger: Logger;
  readonly config: PalaceConfig;
}

const PROJECT_ROOT = decodeURIComponent(new URL("..", import.meta.url).pathname).replace(/\/$/, "");
const CONFIG_DIR = join(PROJECT_ROOT, "config");
const MEMORY_DIR = join(PROJECT_ROOT, "MEMORY", "PALACE");

/** Boot Palace AI — load config, wire subsystems, return ready instance */
export async function boot(configPath?: string): Promise<PalaceInstance> {
  const logger = new Logger("palace");
  logger.addTransport(consoleTransport);

  // 1. Load palace.yaml
  const cfgPath = configPath ?? join(CONFIG_DIR, "palace.yaml");
  const rawYaml = await readFile(cfgPath, "utf-8");
  const config = parse(rawYaml) as PalaceConfig;

  logger.info("Palace AI booting", { version: config.palace.version, principal: config.palace.principal.name });

  // 2. Set up event bus with audit logging
  const eventBus = new EventBus();
  const auditLogger = logger.child("audit");
  eventBus.onAll((event) => {
    auditLogger.info(event.type, {
      source: event.source,
      correlationId: event.correlationId,
      payload: event.payload as Record<string, unknown>,
    });
  });

  // 3. Register providers
  const providerRegistry = new ProviderRegistry();
  for (const provConfig of config.palace.providers) {
    const provider = new CLIProvider({
      id: provConfig.id,
      command: provConfig.command,
      type: inferProviderType(provConfig.command),
      configDir: provConfig.configDir,
      defaultModel: provConfig.defaultModel,
    });
    providerRegistry.register(provider);
    logger.info(`Provider registered: ${provConfig.id}`, { command: provConfig.command });
  }

  // 4. Build token router
  const accounts: Record<string, { providers: string[] }> = {};
  for (const provConfig of config.palace.providers) {
    const accts = provConfig.accounts;
    if (accts) {
      for (const acct of accts) {
        if (!accounts[acct]) accounts[acct] = { providers: [] };
        accounts[acct]!.providers.push(provConfig.id);
      }
    }
  }

  const routerConfig: RouterConfig = {
    accounts,
    defaultAccount: "personal",
    modelMapping: {
      opus: "claude-opus-4-6",
      sonnet: "claude-sonnet-4-6",
      haiku: "claude-haiku-4-5",
    },
  };
  const router = new TokenRouter(routerConfig);

  // 5. Set up memory and counsel
  const memory = new PalaceMemory(MEMORY_DIR);
  const counsel = new CounselLayer(memory);

  // 6. Load and register courtiers
  const registry = new CourtierRegistry();
  const courtierDir = join(CONFIG_DIR, "courtiers");

  try {
    const files = await readdir(courtierDir);
    for (const file of files) {
      if (!file.endsWith(".yaml")) continue;
      const yaml = await readFile(join(courtierDir, file), "utf-8");
      const courtierConfig = parseCourtierConfig(yaml);
      registry.register(courtierConfig);
      logger.info(`Courtier registered: ${courtierConfig.displayName}`, { name: courtierConfig.name, status: courtierConfig.status });
    }
  } catch (err) {
    logger.warn("Could not load courtiers", { error: (err as Error).message });
  }

  // 7. Create Vizier
  const vizier = new Vizier({
    registry,
    memory,
    counsel,
    router,
    analyzer: new TaskAnalyzer(),
    eventBus,
  });

  logger.info("Palace AI ready", {
    courtiers: registry.size,
    providers: providerRegistry.list().length,
    phase: config.palace.phase,
  });

  return { vizier, providers: providerRegistry, eventBus, logger, config };
}

function inferProviderType(command: string): CLIProviderConfig["type"] {
  if (command.includes("claude")) return "claude";
  if (command.includes("codex")) return "codex";
  if (command.includes("gemini")) return "gemini";
  return "generic";
}
