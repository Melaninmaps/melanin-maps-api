import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const control = source("../components/KinfolkBehavioralEvidenceControl.tsx");
const settings = source("../components/KinfolkSettingsControlCenter.tsx");

describe("native reviewable behavioral evidence controls", () => {
  it("shows separate, member-controlled learning controls in Kinfolk Settings", () => {
    expect(settings).toContain("KinfolkBehavioralEvidenceControl");
    expect(settings).toContain("<KinfolkBehavioralEvidenceControl />");
    expect(control).toContain("REVIEWABLE INTERACTION PATTERNS");
    for (const copy of ["Off", "Review", "On"]) expect(control).toContain(copy);
    expect(control).toContain("not a saved memory, preference, or Current Chapter");
    expect(control).toContain("never infers your identity, health, legal or immigration status");
  });

  it("uses the authenticated API manager contract and exposes approve, remove, and clear actions", () => {
    expect(control).toContain("SecureStore.getItemAsync(\"auth_session_token\")");
    expect(control).toContain('cache: "no-store"');
    expect(control).toContain("/api/kinfolk/behavioral-evidence");
    expect(control).toContain('request("/mode", "PUT"');
    expect(control).toContain('request(`/${encodeURIComponent(item.id)}/approve`, "PATCH"');
    expect(control).toContain('request(`/${encodeURIComponent(item.id)}`, "DELETE"');
    expect(control).toContain('request("", "DELETE")');
    expect(control).toContain("KINFOLK_BEHAVIORAL_EVIDENCE_SCHEMA_UNAVAILABLE");
    expect(control).toContain("immediately prevents future use");
  });
});
