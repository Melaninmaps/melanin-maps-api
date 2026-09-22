import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tabsLayout = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/_layout.tsx", import.meta.url)),
  "utf8",
);

describe("mobile bottom-navigation visibility", () => {
  it("uses an opaque, high-contrast destination bar", () => {
    expect(tabsLayout).toContain('backgroundColor: isDark ? "#201710" : "#FFFDF8"');
    expect(tabsLayout).toContain('tabBarActiveTintColor: isDark ? "#F0CF63" : "#70480F"');
    expect(tabsLayout).toContain('tabBarInactiveTintColor: isDark ? "#D9CFC3" : "#5A493B"');
    expect(tabsLayout).toContain("borderTopWidth: 1");
    expect(tabsLayout).not.toContain("<BlurView");
  });
});
