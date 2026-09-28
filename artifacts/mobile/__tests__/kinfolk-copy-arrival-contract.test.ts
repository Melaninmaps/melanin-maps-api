import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const travel = readFileSync(`${root}/artifacts/mobile/app/travel.tsx`, "utf8");
const layout = readFileSync(`${root}/artifacts/mobile/app/_layout.tsx`, "utf8");
const settings = readFileSync(`${root}/artifacts/mobile/app/notifications-settings.tsx`, "utf8");

describe("Kinfolk native copy and arrival awareness contracts", () => {
  it("keeps assistant answers selectable and copyable", () => {
    expect(travel).toContain('import * as Clipboard from "expo-clipboard"');
    expect(travel).toContain("selectable style");
    expect(travel).toContain("Clipboard.setStringAsync(msg.content)");
    expect(travel).toContain('accessibilityLabel="Copy this Kinfolk answer"');
  });

  it("requires an explicit foreground arrival-awareness opt-in", () => {
    expect(settings).toContain("arrivalAwarenessEnabled: false");
    expect(settings).toContain("requestForegroundPermissionsAsync");
    expect(layout).toContain("function ArrivalAwarenessWatcher()");
    expect(layout).toContain("getForegroundPermissionsAsync()");
    expect(layout).toContain("/api/kinfolk/arrival-awareness");
    expect(layout).toContain("foreground-only until an explicit background-location");
  });
});
