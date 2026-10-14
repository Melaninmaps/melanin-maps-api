import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync(new URL("../app/my-trips.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../hooks/useItineraries.ts", import.meta.url), "utf8");
const controls = readFileSync(new URL("../components/PrivateAvailabilityBlocks.tsx", import.meta.url), "utf8");
const availabilityHook = hook.slice(hook.indexOf("async function availabilityRequest"), hook.indexOf("/**\n * My Trips"));

describe("native private Availability Blocks", () => {
  it("places manual availability controls on the existing authenticated My Trips surface", () => {
    expect(screen).toContain('import PrivateAvailabilityBlocks from "@/components/PrivateAvailabilityBlocks";');
    expect(screen).toContain("<PrivateAvailabilityBlocks />");
  });

  it("uses authenticated no-store API lifecycle plus an explicit confirmed preview", () => {
    expect(hook).toContain("/api/kinfolk/availability-blocks${path}");
    expect(hook).toContain('credentials: Platform.OS === "web" ? "include" : undefined');
    expect(hook).toContain('method: "POST", cache: "no-store"');
    expect(hook).toContain('method: "PUT", cache: "no-store"');
    expect(hook).toContain('method: "DELETE", cache: "no-store"');
    expect(hook).toContain('availabilityRequest("/preview"');
    expect(hook.match(/memberConfirmed: true/g)?.length).toBeGreaterThanOrEqual(4);
    expect(controls).toContain('accessibilityLabel="Confirm private availability save"');
    expect(controls).toContain('accessibilityLabel="Confirm private availability preview"');
    expect(controls).toContain('Alert.alert("Delete private availability block?"');
    expect(controls).toContain("hasConflict");
    expect(controls).toContain("conflictCount");
  });

  it("states manual/private no-external-sync use and preserves separate opt-in scope", () => {
    for (const contract of [
      "Manual private planning only.",
      "No external calendar is connected, read, synced, or blocked.",
      "separate future approval gate",
      "Allow this block only when I deliberately run a manual availability preview.",
      "never reveals labels, commitment details, another member&apos;s data, or provider state",
      "never automatically used in Kinfolk chat or memory",
      "Canonical IANA time zone",
    ]) expect(controls).toContain(contract);
  });

  it("does not add AsyncStorage, automatic chat, provider calls, sharing, or arbitrary calendar URLs", () => {
    for (const forbidden of ["api/kinfolk/chat", "AsyncStorage", "localStorage", "sessionStorage", "googleapis", "calendar.google", "shareId", "http://", "https://"]) {
      expect(`${availabilityHook}\n${controls}`).not.toContain(forbidden);
    }
  });
});
