import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const controls = readFileSync(`${root}artifacts/mobile/app/kinfolk-interests.tsx`, "utf8");
const forYou = readFileSync(`${root}artifacts/mobile/components/ForYouCard.tsx`, "utf8");
const settings = readFileSync(`${root}artifacts/mobile/components/KinfolkSettingsControlCenter.tsx`, "utf8");

describe("native Kinfolk interest intelligence", () => {
  it("offers clear consent, review, and deletion controls", () => {
    expect(controls).toContain("Recognize repeated topics");
    expect(controls).toContain("Show proactive discoveries");
    expect(controls).toContain("Add and confirm");
    expect(controls).toContain("Remove interest?");
    expect(controls).toContain('request(`/interests/${interest.id}`, "DELETE")');
    expect(controls).toContain("never chat text, family, health, or third-party context");
  });

  it("makes Circle sharing a deliberate item-level choice", () => {
    expect(controls).toContain("Share with Circle");
    expect(controls).toContain("Only “{shareInterest?.label}” is shared");
    expect(controls).toContain("/api/kinfolk/circles/${circle.id}/interests/${shareInterest.id}/share");
  });

  it("uses governed recommendations with meaningful actions", () => {
    expect(forYou).toContain("/api/kinfolk/interest-intelligence");
    expect(forYou).toContain("/api/saved-places");
    expect(forYou).toContain("not_interested");
    expect(forYou).toContain("never raw chat or search text");
    expect(settings).toContain('router.push("/kinfolk-interests"');
  });
});
