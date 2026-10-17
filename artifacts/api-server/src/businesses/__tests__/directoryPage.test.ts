import { describe, expect, it } from "vitest";
import { normalizeDirectoryPage } from "../directoryPage";

describe("normalizeDirectoryPage", () => {
  it("preserves the established 200-result default for absent, malformed, and zero limits", () => {
    expect(normalizeDirectoryPage(undefined, undefined)).toEqual({ offset: 0, limit: 200 });
    expect(normalizeDirectoryPage("not-a-page", "not-a-limit")).toEqual({ offset: 0, limit: 200 });
    expect(normalizeDirectoryPage("0", "0")).toEqual({ offset: 0, limit: 200 });
  });

  it("uses the same bounded page values for the primary route and a direct-name fallback", () => {
    expect(normalizeDirectoryPage("50", "25")).toEqual({ offset: 50, limit: 25 });
    expect(normalizeDirectoryPage("-4", "500")).toEqual({ offset: 0, limit: 200 });
    expect(normalizeDirectoryPage("8", "-3")).toEqual({ offset: 8, limit: 1 });
  });
});
