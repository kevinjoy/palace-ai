import { describe, it, expect } from "vitest";
import { parsePalaceUri, buildPalaceUri } from "@palace/memory/uri.ts";

describe("parsePalaceUri", () => {
  it("parses a court URI", () => {
    const uri = parsePalaceUri("palace://court/chaplain/drafts/essay-on-intelligence");
    expect(uri.scheme).toBe("palace");
    expect(uri.scope).toBe("court");
    expect(uri.path).toBe("chaplain/drafts/essay-on-intelligence");
  });

  it("parses a counsel URI", () => {
    const uri = parsePalaceUri("palace://counsel/guild/research-findings/openviking");
    expect(uri.scope).toBe("counsel");
    expect(uri.path).toBe("guild/research-findings/openviking");
  });

  it("parses a user URI", () => {
    const uri = parsePalaceUri("palace://user/kevin/observations/2026-04-03");
    expect(uri.scope).toBe("user");
    expect(uri.path).toBe("kevin/observations/2026-04-03");
  });

  it("parses a projects URI", () => {
    const uri = parsePalaceUri("palace://projects/comp-strata/backlog/item-42");
    expect(uri.scope).toBe("projects");
    expect(uri.path).toBe("comp-strata/backlog/item-42");
  });

  it("throws on invalid URI (no palace:// prefix)", () => {
    expect(() => parsePalaceUri("http://example.com")).toThrow("Invalid Palace URI");
  });

  it("throws on URI with no path", () => {
    expect(() => parsePalaceUri("palace://court")).toThrow("Invalid Palace URI");
  });

  it("throws on empty string", () => {
    expect(() => parsePalaceUri("")).toThrow("Invalid Palace URI");
  });
});

describe("buildPalaceUri", () => {
  it("builds a court URI", () => {
    expect(buildPalaceUri("court", "chaplain/drafts/essay")).toBe("palace://court/chaplain/drafts/essay");
  });

  it("builds a counsel URI", () => {
    expect(buildPalaceUri("counsel", "guild/findings")).toBe("palace://counsel/guild/findings");
  });

  it("roundtrips through parse", () => {
    const original = "palace://court/herald/briefs/2026-04-03";
    const parsed = parsePalaceUri(original);
    const rebuilt = buildPalaceUri(parsed.scope, parsed.path);
    expect(rebuilt).toBe(original);
  });
});
