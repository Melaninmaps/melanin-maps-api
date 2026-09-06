import { describe, expect, it } from "vitest";
import { mayUseContextualIntelligence, resolveContextualIntelligenceMode } from "../contextual-intelligence-mode";

describe("contextual intelligence mode", () => {
  it("fails closed for missing, blank, and invalid settings", () => {
    expect(resolveContextualIntelligenceMode(undefined)).toBe("off");
    expect(resolveContextualIntelligenceMode(" ")).toBe("off");
    expect(resolveContextualIntelligenceMode("true")).toBe("off");
  });
  it("uses the established server-side staff rule", () => {
    expect(mayUseContextualIntelligence({ mode: "staff", authenticated: true, administrator: true, activeTester: false })).toBe(true);
    expect(mayUseContextualIntelligence({ mode: "staff", authenticated: true, administrator: false, activeTester: true })).toBe(true);
    expect(mayUseContextualIntelligence({ mode: "staff", authenticated: true, administrator: false, activeTester: false })).toBe(false);
    expect(mayUseContextualIntelligence({ mode: "off", authenticated: true, administrator: true, activeTester: true })).toBe(false);
    expect(mayUseContextualIntelligence({ mode: "on", authenticated: false, administrator: true, activeTester: true })).toBe(false);
    expect(mayUseContextualIntelligence({ mode: "on", authenticated: true, administrator: false, activeTester: false })).toBe(true);
  });
});