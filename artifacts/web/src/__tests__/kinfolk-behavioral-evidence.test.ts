import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const manager = source("../components/kinfolk/KinfolkBehavioralEvidenceManager.tsx");
const settings = source("../components/kinfolk/KinfolkExperienceSettings.tsx");
const profile = source("../pages/profile.tsx");

describe("Web reviewable behavioral evidence controls", () => {
  it("makes the separately controlled learning layer visible with every required mode", () => {
    expect(settings).toContain("KinfolkBehavioralEvidenceManager");
    expect(manager).toContain('data-testid="kinfolk-behavioral-evidence-manager"');
    for (const copy of ["Off", "Review first", "On"]) expect(manager).toContain(copy);
    expect(manager).toContain("never a saved memory, preference, or Current Chapter");
    expect(manager).toContain("never infers identity, health, legal or immigration status");
  });

  it("uses authenticated no-store manager requests with review, removal, and clear-all controls", () => {
    expect(manager).toContain("credentials: \"include\"");
    expect(manager).toContain('cache: "no-store"');
    expect(manager).toContain('request("/mode", "PUT"');
    expect(manager).toContain("/approve`, \"PATCH\"");
    expect(manager).toContain('request(`/${encodeURIComponent(evidence.id)}`, "DELETE")');
    expect(manager).toContain('request("", "DELETE")');
    expect(manager).toContain("KINFOLK_BEHAVIORAL_EVIDENCE_SCHEMA_UNAVAILABLE");
    expect(manager).toContain("Nothing was claimed as saved.");
    expect(manager).toContain("immediately prevents its future use");
  });

  it("removes the unsupported claim that Kinfolk learns simply from chatting", () => {
    expect(profile).toContain("Kinfolk does not automatically learn from chatting.");
    expect(profile).toContain("Choose what it can use in Kinfolk Settings.");
    expect(profile).not.toContain("The more you\n                      chat, the better it knows you.");
  });
});
