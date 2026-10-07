import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const dashboard = readFileSync(`${root}artifacts/web/src/pages/business-dashboard.tsx`, "utf8");
const checklist = readFileSync(`${root}artifacts/web/src/components/businesses/BusinessOwnerOnboarding.tsx`, "utf8");

describe("web business owner onboarding", () => {
  it("adds a direct, owner-controlled launch checklist to the existing owner dashboard", () => {
    expect(dashboard).toContain("BusinessOwnerOnboarding");
    expect(checklist).toContain("Owner launch checklist");
    expect(checklist).toContain("api/businesses/mine/onboarding");
    expect(checklist).toContain("Save private checklist");
  });

  it("makes the no-publish, no-marketing, no-contact boundary clear", () => {
    expect(checklist).toContain("never publishes your profile");
    expect(checklist).toContain("creates marketing copy");
    expect(checklist).toContain("contacts customers");
    expect(checklist).toContain("No media is uploaded or changed here.");
  });
});
