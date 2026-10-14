import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const apiSource = fs.readFileSync(
  path.join(root, "features", "connected-apps", "api.ts"),
  "utf8",
);
const settingsSource = fs.readFileSync(
  path.join(root, "components", "kinfolk", "ConnectedAppsSettings.tsx"),
  "utf8",
);
const kinfolkSettingsSource = fs.readFileSync(
  path.join(root, "components", "kinfolk", "KinfolkExperienceSettings.tsx"),
  "utf8",
);
const chatSource = fs.readFileSync(
  path.join(root, "pages", "travel.tsx"),
  "utf8",
);
const profileSource = fs.readFileSync(
  path.join(root, "pages", "profile.tsx"),
  "utf8",
);

describe("Connected Apps Web settings contract", () => {
  it("uses authenticated, uncached member requests", () => {
    expect(apiSource).toContain("authenticatedFetch");
    expect(apiSource).toContain('cache: "no-store"');
    expect(apiSource).toContain("recordConnectedAppConsent");
    expect(apiSource).toContain("revokeConnectedApp");
    expect(apiSource).toContain("deleteConnectedAppPermission");
  });

  it("shows all catalog categories without implying a connection", () => {
    expect(settingsSource).toContain('id: "travel"');
    expect(settingsSource).toContain('id: "health"');
    expect(settingsSource).toContain('id: "finance"');
    expect(settingsSource).toContain('id: "everyday"');
    expect(settingsSource).toContain("not connected");
    expect(settingsSource).toMatch(
      /never scans an inbox,[\s\S]*financial account by itself/,
    );
  });

  it("places Connected Apps in the member-controlled Kinfolk settings area", () => {
    expect(kinfolkSettingsSource).toContain("ConnectedAppsSettings");
    expect(settingsSource).toContain("Kinfolk Journeys");
  });

  it("renders a chat prompt as an optional settings review rather than an automatic connection", () => {
    expect(chatSource).toContain("connectedAppsPrompt");
    expect(chatSource).toContain("connectedAppsPrompt.description");
    expect(chatSource).toContain("profile?settings=connected-apps&focus=");
    expect(chatSource).toContain("Review Connected Apps");
    expect(profileSource).toContain(
      'params.get("settings") !== "connected-apps"',
    );
    expect(profileSource).toContain('setActiveSettingsFolder("kinfolk")');
  });
});
