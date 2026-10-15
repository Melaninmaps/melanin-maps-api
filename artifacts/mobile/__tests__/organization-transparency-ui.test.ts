import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("Expo Organization Transparency intake", () => {
  it("checks exact organization candidates before creating an organization", () => {
    const screen = source("../app/organization-transparency/submit.tsx");
    expect(screen).toContain("/api/organizations/duplicate-candidates");
    expect(screen).toContain("Check existing organizations");
    expect(screen).toContain("Possible existing organization");
  });

  it("uses the separate source-only intake contract and describes its publication limits", () => {
    const screen = source("../app/organization-transparency/submit.tsx");
    expect(screen).toContain("/api/community/organizations");
    expect(screen).toContain("not searchable, pinnable, recommended by");
    expect(screen).toContain("Kinfolk, or");
    expect(screen).toContain("promoted until separately approved.");
    expect(screen).toContain(
      "Searchability, map placement, Kinfolk use, promotion, and",
    );
    expect(screen).toContain("member experience are separate decisions.");
  });

  it("makes the member select a relationship while withholding verified ownership from intake", () => {
    const screen = source("../app/organization-transparency/submit.tsx");
    expect(screen).toContain('"current_employee"');
    expect(screen).toContain('"former_employee"');
    expect(screen).toContain('"patient"');
    expect(screen).toContain('"caregiver"');
    expect(screen).toContain('"self_identified_minority_owned"');
    expect(screen).not.toContain('"verified_minority_owned"');
    expect(screen).toContain(
      "separate evidence review can mark ownership as verified",
    );
  });

  it("includes stable native test identifiers for the inputs and safety states", () => {
    const screen = source("../app/organization-transparency/submit.tsx");
    for (const id of [
      "organization-name-input",
      "organization-city-input",
      "organization-duplicate-check",
      "organization-submit",
      "organization-submission-success",
    ]) {
      expect(screen).toContain(id);
    }
  });

  it("keeps the native profile experience flow structured, location-attributed, and moderation-first", () => {
    const screen = source("../app/organization-transparency/[id].tsx");
    expect(screen).toContain("/api/organizations/${encodeURIComponent(id)}");
    expect(screen).toContain("organizationLocationId: locationId");
    expect(screen).toContain("pseudonymous_public");
    expect(screen).toContain("private_to_moderators");
    expect(screen).toContain("No stars or universal score");
    expect(screen).toContain("organization-experience-submit");
  });

  it("provides member status recovery and a bounded appeal path without publishing automatically", () => {
    const screen = source("../app/organization-transparency/activity.tsx");
    expect(screen).toContain("/api/community/organizations/mine");
    expect(screen).toContain(
      "/api/organization-experiences/${encodeURIComponent(item.experienceId)}/appeals",
    );
    expect(screen).toContain(
      "This does not publish or alter the original experience by itself.",
    );
    expect(screen).toContain("organization-transparency-activity");
  });
});
