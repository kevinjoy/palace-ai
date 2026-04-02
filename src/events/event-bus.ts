/**
 * Palace AI — Typed Event Bus
 *
 * Pub/sub for all Palace events. Every module emits, nothing polls.
 * This is the nervous system — without it, components can't react
 * to each other's state changes.
 */

/** All possible Palace event types */
export type PalaceEventType =
  | "courtier:registered"
  | "courtier:transition"
  | "memory:written"
  | "memory:read"
  | "counsel:submitted"
  | "security:access_denied"
  | "security:access_granted"
  | "provider:task_started"
  | "provider:task_completed"
  | "provider:task_failed"
  | "vizier:task_routed"
  | "vizier:task_completed";

/** A Palace event with typed payload */
export interface PalaceEvent<T = unknown> {
  readonly type: PalaceEventType;
  readonly timestamp: string;
  readonly correlationId?: string;
  readonly source: string;
  readonly payload: T;
}

type EventHandler<T = unknown> = (event: PalaceEvent<T>) => void | Promise<void>;

export class EventBus {
  private readonly handlers = new Map<PalaceEventType, Set<EventHandler>>();
  private readonly allHandlers = new Set<EventHandler>();

  /** Subscribe to a specific event type */
  on<T = unknown>(type: PalaceEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    const set = this.handlers.get(type)!;
    set.add(handler as EventHandler);

    // Return unsubscribe function
    return () => set.delete(handler as EventHandler);
  }

  /** Subscribe to ALL events (for logging, audit trail) */
  onAll(handler: EventHandler): () => void {
    this.allHandlers.add(handler);
    return () => this.allHandlers.delete(handler);
  }

  /** Emit an event to all matching subscribers */
  async emit<T = unknown>(event: PalaceEvent<T>): Promise<void> {
    const typeHandlers = this.handlers.get(event.type);
    const promises: Promise<void>[] = [];

    if (typeHandlers) {
      for (const handler of typeHandlers) {
        const result = handler(event as PalaceEvent);
        if (result instanceof Promise) promises.push(result);
      }
    }

    for (const handler of this.allHandlers) {
      const result = handler(event as PalaceEvent);
      if (result instanceof Promise) promises.push(result);
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /** Create an event with timestamp */
  static createEvent<T>(
    type: PalaceEventType,
    source: string,
    payload: T,
    correlationId?: string,
  ): PalaceEvent<T> {
    return {
      type,
      timestamp: new Date().toISOString(),
      source,
      payload,
      ...(correlationId ? { correlationId } : {}),
    };
  }

  /** Remove all handlers (for testing) */
  clear(): void {
    this.handlers.clear();
    this.allHandlers.clear();
  }
}
