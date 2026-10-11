import { describe, expect, it } from "vitest";
import { allowsSafetyCheckinNotification } from "../routes/cron";

describe("Safety Check-In notification preference normalization", () => {
  it("honors safety across array, JSON, and legacy scalar serializations", () => {
    expect(allowsSafetyCheckinNotification('{community,safety,events}')).toBe(true);
    expect(allowsSafetyCheckinNotification('["community","safety"]')).toBe(true);
    expect(allowsSafetyCheckinNotification('"safety"')).toBe(true);
    expect(allowsSafetyCheckinNotification('safety')).toBe(true);
  });

  it("does not turn an explicit empty or non-safety preference into consent", () => {
    expect(allowsSafetyCheckinNotification('{community,events}')).toBe(false);
    expect(allowsSafetyCheckinNotification('["community","events"]')).toBe(false);
    expect(allowsSafetyCheckinNotification('')).toBe(false);
    expect(allowsSafetyCheckinNotification('safety_updates')).toBe(false);
  });

  it("keeps legacy recipients with no stored preference eligible by default", () => {
    expect(allowsSafetyCheckinNotification(null)).toBe(true);
  });
});
