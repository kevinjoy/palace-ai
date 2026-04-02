import { describe, it, expect } from "vitest";
import { PALACE_VERSION } from "@palace/index.ts";

describe("Palace AI scaffold", () => {
  it("exports a version", () => {
    expect(PALACE_VERSION).toBe("0.1.0");
  });

  it("version matches package.json", async () => {
    const { readFile } = await import("fs/promises");
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    expect(PALACE_VERSION).toBe(pkg.version);
  });
});
