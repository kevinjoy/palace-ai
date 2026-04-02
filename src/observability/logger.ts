/**
 * Palace AI — Structured Logger
 *
 * JSON-structured logging for audit trails and debugging.
 * Every security decision, state transition, and memory operation
 * gets a log entry. Supports correlation IDs for request tracing.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  readonly level: LogLevel;
  readonly timestamp: string;
  readonly source: string;
  readonly message: string;
  readonly correlationId?: string;
  readonly data?: Record<string, unknown>;
}

type LogTransport = (entry: LogEntry) => void | Promise<void>;

export class Logger {
  private readonly transports: LogTransport[] = [];
  private readonly source: string;
  private minLevel: LogLevel;

  private static readonly LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(source: string, minLevel: LogLevel = "info") {
    this.source = source;
    this.minLevel = minLevel;
  }

  /** Add a transport (console, file, event bus, etc.) */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /** Set minimum log level */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  debug(message: string, data?: Record<string, unknown>, correlationId?: string): void {
    this.log("debug", message, data, correlationId);
  }

  info(message: string, data?: Record<string, unknown>, correlationId?: string): void {
    this.log("info", message, data, correlationId);
  }

  warn(message: string, data?: Record<string, unknown>, correlationId?: string): void {
    this.log("warn", message, data, correlationId);
  }

  error(message: string, data?: Record<string, unknown>, correlationId?: string): void {
    this.log("error", message, data, correlationId);
  }

  /** Create a child logger with a sub-source */
  child(subsource: string): Logger {
    const child = new Logger(`${this.source}:${subsource}`, this.minLevel);
    for (const transport of this.transports) {
      child.addTransport(transport);
    }
    return child;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, correlationId?: string): void {
    if (Logger.LEVEL_ORDER[level] < Logger.LEVEL_ORDER[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      source: this.source,
      message,
      ...(correlationId ? { correlationId } : {}),
      ...(data ? { data } : {}),
    };

    for (const transport of this.transports) {
      transport(entry);
    }
  }
}

/** Console transport — structured JSON to stdout */
export const consoleTransport: LogTransport = (entry) => {
  const line = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
};

/** Collect transport — stores entries in memory (for testing) */
export function createCollectTransport(): { transport: LogTransport; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return {
    transport: (entry) => { entries.push(entry); },
    entries,
  };
}
