import { describe, expect, it } from "vitest";
import { HBCU_PROFILE_CONTEXT_COUNT, findHbcuProfileContext } from "../hbcuProfileContext";

describe("HBCU profile context", () => {
  it("ships source-backed context for the reviewed campus set", () => {
    expect(HBCU_PROFILE_CONTEXT_COUNT).toBe(20);
    const howard = findHbcuProfileContext("Howard University");
    expect(howard?.identity).toMatch(/Howard University/);
    expect(howard?.knownFor.length).toBeGreaterThan(0);
    expect(howard?.traditions.length).toBeGreaterThan(0);
    expect(howard?.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
  });

  it("does not make an arbitrary cultural site look like a reviewed HBCU", () => {
    expect(findHbcuProfileContext("Tuskegee History Center")).toBeNull();
  });
});
