import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const circles = readFileSync(new URL("../pages/circles.tsx", import.meta.url), "utf8");

describe("Web Circle privacy contract", () => {
  it("shows only the member's private invite-only Circles and does not expose a nonfunctional public discovery path", () => {
    expect(circles).toContain('fetch(`${BASE}api/circles`, { credentials: "include" })');
    expect(circles).toContain("Your private, invite-only crew coordination space.");
    expect(circles).toContain("Private Circle");
    expect(circles).toContain("Invite-only");
    expect(circles).toContain('aria-label="Invite-only Circle"');
    for (const unsupportedControl of [
      "api/circles/community",
      "communityCircles",
      "activeTab",
      "joinCircle",
      "newPrivacy",
      'option value="public"',
      "circle.privacy",
    ]) {
      expect(circles).not.toContain(unsupportedControl);
    }
  });

  it("does not send client-selected public/privacy/type values that the server intentionally ignores", () => {
    expect(circles).toContain('body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, city: newCity.trim() || null, description: newDescription.trim() || null })');
    expect(circles).toContain("Private by design.");
    expect(circles).toContain("Every Circle is invite-only and limited to eight people.");
    expect(circles).toContain("Groups for larger discoverable communities.");
  });
});
