import { describe, expect, it } from "vitest";
import { resolveMemberAgeBand } from "../audience-policy";

const today = new Date("2026-09-04T12:00:00.000Z");

describe("resolveMemberAgeBand", () => {
  it("upgrades a legacy null band to 18_plus only when DOB proves adulthood", () => {
    expect(resolveMemberAgeBand(null, "1990-09-04", today)).toBe("18_plus");
    expect(resolveMemberAgeBand(null, "2008-09-04", today)).toBe("18_plus");
  });

  it("keeps minors protective when their stored band is null", () => {
    expect(resolveMemberAgeBand(null, "2008-09-05", today)).toBe("unknown");
    expect(resolveMemberAgeBand(null, "2014-09-04", today)).toBe("unknown");
    expect(resolveMemberAgeBand(null, null, today)).toBe("unknown");
  });

  it("never weakens an explicit minor assurance", () => {
    expect(resolveMemberAgeBand("under_13", "1990-01-01", today)).toBe("under_13");
    expect(resolveMemberAgeBand("13_15", "1990-01-01", today)).toBe("13_15");
    expect(resolveMemberAgeBand("16_17", "1990-01-01", today)).toBe("16_17");
  });
});