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

  it("retires arrival awareness so the app never polls device location", () => {
    expect(settings).not.toContain("arrivalAwarenessEnabled");
    expect(settings).not.toContain("expo-location");
    expect(layout).not.toContain("ArrivalAwarenessWatcher");
    expect(layout).not.toContain("getForegroundPermissionsAsync()");
    expect(layout).not.toContain("/api/kinfolk/arrival-awareness");
  });
});
