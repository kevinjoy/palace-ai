import { describe, it, expect } from "vitest";
import { EventBus } from "@palace/events/event-bus.ts";

describe("EventBus", () => {
  it("emits events to type-specific handlers", async () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.on("courtier:transition", (event) => { received.push(event.payload as string); });

    await bus.emit(EventBus.createEvent("courtier:transition", "test", "dormant→active"));

    expect(received).toEqual(["dormant→active"]);
  });

  it("does not emit to non-matching handlers", async () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.on("memory:written", () => { received.push("memory"); });

    await bus.emit(EventBus.createEvent("courtier:transition", "test", "data"));

    expect(received).toEqual([]);
  });

  it("emits to onAll handlers for every event", async () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.onAll((e) => { received.push(e.type); });

    await bus.emit(EventBus.createEvent("courtier:transition", "test", "a"));
    await bus.emit(EventBus.createEvent("memory:written", "test", "b"));

    expect(received).toEqual(["courtier:transition", "memory:written"]);
  });

  it("supports unsubscribe", async () => {
    const bus = new EventBus();
    const received: string[] = [];

    const unsub = bus.on("memory:written", () => { received.push("hit"); });
    await bus.emit(EventBus.createEvent("memory:written", "test", null));
    expect(received.length).toBe(1);

    unsub();
    await bus.emit(EventBus.createEvent("memory:written", "test", null));
    expect(received.length).toBe(1); // Still 1, handler removed
  });

  it("creates events with timestamps", () => {
    const event = EventBus.createEvent("courtier:registered", "registry", { name: "herald" });
    expect(event.timestamp).toBeDefined();
    expect(event.source).toBe("registry");
    expect(event.type).toBe("courtier:registered");
  });

  it("includes correlationId when provided", () => {
    const event = EventBus.createEvent("vizier:task_routed", "vizier", {}, "corr-123");
    expect(event.correlationId).toBe("corr-123");
  });

  it("handles async handlers", async () => {
    const bus = new EventBus();
    let resolved = false;

    bus.on("memory:written", async () => {
      await new Promise((r) => setTimeout(r, 10));
      resolved = true;
    });

    await bus.emit(EventBus.createEvent("memory:written", "test", null));
    expect(resolved).toBe(true);
  });

  it("clear removes all handlers", async () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.on("memory:written", () => { received.push("hit"); });
    bus.onAll(() => { received.push("all"); });

    bus.clear();
    await bus.emit(EventBus.createEvent("memory:written", "test", null));
    expect(received).toEqual([]);
  });
});
