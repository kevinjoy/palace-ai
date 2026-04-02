import { describe, it, expect } from "vitest";
import { CourtierLifecycle } from "@palace/courtiers/lifecycle.ts";

describe("CourtierLifecycle", () => {
  it("initializes with given status", () => {
    const lc = new CourtierLifecycle("herald", "dormant");
    expect(lc.status).toBe("dormant");
    expect(lc.name).toBe("herald");
  });

  describe("valid transitions", () => {
    it("disabled → dormant", () => {
      const lc = new CourtierLifecycle("test", "disabled");
      lc.transition("dormant");
      expect(lc.status).toBe("dormant");
    });

    it("dormant → activating", () => {
      const lc = new CourtierLifecycle("test", "dormant");
      lc.transition("activating");
      expect(lc.status).toBe("activating");
    });

    it("activating → active", () => {
      const lc = new CourtierLifecycle("test", "activating");
      lc.transition("active");
      expect(lc.status).toBe("active");
    });

    it("active → suspended", () => {
      const lc = new CourtierLifecycle("test", "active");
      lc.transition("suspended");
      expect(lc.status).toBe("suspended");
    });

    it("active → deactivated", () => {
      const lc = new CourtierLifecycle("test", "active");
      lc.transition("deactivated");
      expect(lc.status).toBe("deactivated");
    });

    it("suspended → active (resume)", () => {
      const lc = new CourtierLifecycle("test", "suspended");
      lc.transition("active");
      expect(lc.status).toBe("active");
    });

    it("suspended → deactivated", () => {
      const lc = new CourtierLifecycle("test", "suspended");
      lc.transition("deactivated");
      expect(lc.status).toBe("deactivated");
    });

    it("deactivated → dormant (can be re-enabled)", () => {
      const lc = new CourtierLifecycle("test", "deactivated");
      lc.transition("dormant");
      expect(lc.status).toBe("dormant");
    });
  });

  describe("invalid transitions", () => {
    it("disabled → active (must go through dormant + activating)", () => {
      const lc = new CourtierLifecycle("test", "disabled");
      expect(() => lc.transition("active")).toThrow("Invalid transition");
    });

    it("dormant → active (must go through activating)", () => {
      const lc = new CourtierLifecycle("test", "dormant");
      expect(() => lc.transition("active")).toThrow("Invalid transition");
    });

    it("active → dormant (must deactivate first)", () => {
      const lc = new CourtierLifecycle("test", "active");
      expect(() => lc.transition("dormant")).toThrow("Invalid transition");
    });

    it("activating → suspended (must be active first)", () => {
      const lc = new CourtierLifecycle("test", "activating");
      expect(() => lc.transition("suspended")).toThrow("Invalid transition");
    });
  });

  describe("transition returns previous status", () => {
    it("returns the status before transition", () => {
      const lc = new CourtierLifecycle("test", "dormant");
      const prev = lc.transition("activating");
      expect(prev).toBe("dormant");
    });
  });

  describe("canTransition", () => {
    it("returns true for valid transition", () => {
      const lc = new CourtierLifecycle("test", "dormant");
      expect(lc.canTransition("activating")).toBe(true);
    });

    it("returns false for invalid transition", () => {
      const lc = new CourtierLifecycle("test", "dormant");
      expect(lc.canTransition("active")).toBe(false);
    });
  });

  describe("full lifecycle: dormant → active → suspended → active → deactivated → dormant", () => {
    it("completes a full cycle", () => {
      const lc = new CourtierLifecycle("herald", "dormant");

      lc.transition("activating");
      expect(lc.status).toBe("activating");

      lc.transition("active");
      expect(lc.status).toBe("active");

      lc.transition("suspended");
      expect(lc.status).toBe("suspended");

      lc.transition("active");
      expect(lc.status).toBe("active");

      lc.transition("deactivated");
      expect(lc.status).toBe("deactivated");

      lc.transition("dormant");
      expect(lc.status).toBe("dormant");
    });
  });
});
