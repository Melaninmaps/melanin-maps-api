import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync(
  new URL("../app/kinfolk-connected-apps.tsx", import.meta.url),
  "utf8",
);
const layout = readFileSync(
  new URL("../app/_layout.tsx", import.meta.url),
  "utf8",
);
const settings = readFileSync(
  new URL("../components/KinfolkSettingsControlCenter.tsx", import.meta.url),
  "utf8",
);
const chat = readFileSync(
  new URL("../components/AIChatWidget.tsx", import.meta.url),
  "utf8",
);

describe("native Connected Apps contract", () => {
  it("registers the native settings route and member settings entry", () => {
    expect(layout).toContain('name="kinfolk-connected-apps"');
    expect(settings).toContain(
      'router.push("/kinfolk-connected-apps" as never)',
    );
    expect(settings).toContain("Connected Apps");
  });

  it("uses authenticated API requests and supports review, revoke, and delete", () => {
    expect(screen).toContain("getMemberApiHeaders");
    expect(screen).toContain("/kinfolk-connected-apps");
    expect(screen).toContain("explicitConsent: true");
    expect(screen).toContain("sensitiveDataAcknowledged");
    expect(screen).toContain("revoke");
    expect(screen).toContain("Delete permission setting");
  });

  it("does not claim silent access to sensitive accounts", () => {
    expect(screen).toMatch(
      /Nothing scans an inbox,[\s\S]*financial account on its own/,
    );
    expect(screen).toMatch(
      /It does\s+not connect to,[\s\S]*health or financial data/,
    );
  });

  it("renders Kinfolk conversation prompts as optional and opens member settings", () => {
    expect(chat).toContain("connectedAppsPrompt");
    expect(chat).toContain("connectedAppsPrompt.description");
    expect(chat).toContain('pathname: "/kinfolk-connected-apps"');
    expect(chat).toContain("Review Connected Apps");
  });
});
