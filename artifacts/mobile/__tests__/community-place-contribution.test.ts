import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../app/nominate-business.tsx", import.meta.url)),
  "utf8",
);

describe("community place contribution choices", () => {
  it("offers distinct business, thriving-place, and owner-invitation contributions", () => {
    expect(source).toContain('id: "business_nomination"');
    expect(source).toContain('id: "thrive_recommendation"');
    expect(source).toContain('id: "owner_invitation"');
    expect(source).toContain("How would you like to contribute?");
  });

  it("keeps member ownership reports explicitly non-verifying and sends typed source context", () => {
    expect(source).toContain("A community report never verifies");
    expect(source).toContain("sourceChannel: `expo_community_${contributionIntent}`");
    expect(source).toContain('locationSource: "google_places"');
    expect(source).not.toContain("verified: true");
  });
});
